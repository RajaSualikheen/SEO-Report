import { URL } from "url";
import logger from "./logger.js";
import { fetchUrlHead, fetchUrlGet, followRedirects } from "./fetchUtils.js";
import { safeGetAttribute } from "./utils.js";
import { XMLParser } from 'fast-xml-parser';
/**
 * Analyze robots.txt rules for crawlability.
 */
export const analyzeRobotsTxt = async (baseUrl) => {
  const robotsTxtUrl = new URL("/robots.txt", baseUrl).href;
  const robotsResult = {
    present: false,
    rules: {},
    sitemap_path: null,
    issues: [],
  };

  try {
    const response = await fetchUrlGet(robotsTxtUrl);
    if (response.success && response.statusCode === 200) {
      robotsResult.present = true;
      const lines = response.content.split("\n");
      let currentUserAgent = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const [key, value] = trimmed.split(":").map((s) => s.trim());
        if (!key || !value) continue;

        switch (key.toLowerCase()) {
          case "user-agent":
            currentUserAgent = value;
            if (!robotsResult.rules[currentUserAgent]) {
              robotsResult.rules[currentUserAgent] = { allow: [], disallow: [] };
            }
            break;
          case "disallow":
            if (currentUserAgent)
              robotsResult.rules[currentUserAgent].disallow.push(value);
            break;
          case "allow":
            if (currentUserAgent)
              robotsResult.rules[currentUserAgent].allow.push(value);
            break;
          case "sitemap":
            robotsResult.sitemap_path = value;
            break;
        }
      }

      // Check general rules for "*"
      if (!robotsResult.rules["*"] && Object.keys(robotsResult.rules).length) {
        robotsResult.issues.push(
          "⚠️ No general User-agent (*) rule found. This might cause inconsistent bot behavior."
        );
      } else if (robotsResult.rules["*"]?.disallow.includes("/")) {
        robotsResult.issues.push(
          "❌ Crawling blocked for all bots via `Disallow: /` in robots.txt."
        );
      }
    } else {
      robotsResult.issues.push("❌ robots.txt missing or inaccessible.");
    }
  } catch (e) {
    logger.warn(`Error analyzing robots.txt: ${e.message}`);
    robotsResult.issues.push("⚠️ Error while fetching/parsing robots.txt.");
  }

  return robotsResult;
};

/**
 * Analyze meta robots tag for indexing rules.
 */
export const analyzeMetaRobots = (soup) => {
  const tag = soup('meta[name="robots"]');
  const result = {
    present: false,
    content: null,
    is_noindex: false,
    is_nofollow: false,
    issues: [],
  };

  if (tag.length) {
    result.present = true;
    const content = safeGetAttribute(tag, "content") || "";
    result.content = content;

    const lowered = content.toLowerCase();
    if (lowered.includes("noindex")) {
      result.is_noindex = true;
      result.issues.push(
        "❌ Meta robots tag includes `noindex`. Page will not be indexed."
      );
    }
    if (lowered.includes("nofollow")) {
      result.is_nofollow = true;
      result.issues.push(
        "⚠️ Meta robots tag includes `nofollow`. Links will not pass equity."
      );
    }
  } else {
    result.issues.push("✅ No meta robots tag. Page is indexable by default.");
  }

  return result;
};

/**
 * Validate sitemap for accessibility, structure, and URL health.
 */
export const validateSitemapUrls = async (sitemapUrl) => {
  const sitemapResult = {
    found: false,
    url_count: 0,
    valid_urls: 0,
    invalid_urls: [],
    status: "❌ Sitemap not found or invalid",
    issues: [],
  };

  if (!sitemapUrl) return sitemapResult;

  try {
    const response = await fetchUrlGet(sitemapUrl);
    if (response.success && response.statusCode === 200) {
      const parser = new XMLParser();
            const parsed = parser.parse(response.content);
            let urls = [];
            if (parsed.urlset && parsed.urlset.url) {
                const urlEntries = Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url];
                urls = urlEntries.map(u => u?.loc).filter(Boolean);
            }
      sitemapResult.found = true;
      sitemapResult.url_count = urls.length;

      if (urls.length === 0) {
        sitemapResult.status = "❌ Sitemap found but contains no URLs.";
        sitemapResult.issues.push("❌ Sitemap is empty.");
      } else {
        sitemapResult.status = `✅ Sitemap with ${urls.length} URLs.`;

        if (urls.length > 50000) {
          sitemapResult.issues.push(
            "⚠️ Sitemap exceeds 50,000 URLs. Consider splitting it."
          );
        }

        // Check first 10 URLs
        const toCheck = urls.slice(0, 10);
        const results = await Promise.allSettled(toCheck.map(fetchUrlHead));

        for (const r of results) {
          if (
            r.status === "fulfilled" &&
            r.value.success &&
            r.value.statusCode === 200
          ) {
            sitemapResult.valid_urls++;
          } else {
            const reason = r.value?.error || `Status ${r.value?.statusCode}`;
            sitemapResult.invalid_urls.push({
              url: r.value?.url || "unknown",
              reason,
            });
            sitemapResult.issues.push(
              `❌ Sitemap URL invalid: ${r.value?.url || "unknown"} (${reason})`
            );
          }
        }

        if (sitemapResult.invalid_urls.length > 0) {
          sitemapResult.status = `⚠️ Sitemap has ${sitemapResult.invalid_urls.length} invalid URLs.`;
        }
      }
    } else {
      sitemapResult.issues.push("❌ Sitemap inaccessible.");
    }
  } catch (e) {
    logger.warn(`Error validating sitemap: ${e.message}`);
    sitemapResult.status = "⚠️ Error while checking sitemap";
    sitemapResult.issues.push("⚠️ Sitemap validation error.");
  }

  return sitemapResult;
};

/**
 * Analyze redirects and HTTP status for homepage + top 3 internal links.
 */
export const analyzeHttpStatusAndRedirects = async (baseUrl, internalLinks) => {
  const results = {};
  const toCheck = [baseUrl, ...internalLinks.slice(0, 3)];

  for (const url of toCheck) {
    try {
      const res = await followRedirects(url);
      results[url] = {
        final_url: res.finalUrl,
        final_status_code: res.statusCode,
        redirect_chain: res.redirectChain,
        has_redirect_chain: res.redirectChain.length > 1,
        issues: [],
      };

      if (res.redirectChain.length > 2) {
        results[url].issues.push(
          `⚠️ Long redirect chain (${res.redirectChain.length - 1} hops). Simplify.`
        );
      }
      if (res.statusCode >= 400) {
        results[url].issues.push(
          `❌ Final URL returns status ${res.statusCode}.`
        );
      }
    } catch (e) {
      logger.warn(`Redirect check failed for ${url}: ${e.message}`);
      results[url] = {
        final_url: url,
        final_status_code: null,
        redirect_chain: [url],
        has_redirect_chain: false,
        issues: [`❌ Failed to check URL: ${e.message}`],
      };
    }
  }

  return results;
};
