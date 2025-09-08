import axios from "axios";
import { load } from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { URL } from "url";
import logger from "./logger.js";
import { fetchUrlGet } from "./fetchUtils.js";

const CRAWL_CONCURRENCY = 10;
const URL_LIMIT = 200;
const TIMEOUT = 15000;

// configure fast-xml-parser to always normalize
const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: true,
  isArray: (name) => ["url", "sitemap"].includes(name)
});

// Safe extractor for <loc>
const getLoc = (entry) => {
  if (!entry) return null;
  if (typeof entry.loc === "string") return entry.loc.trim();
  if (Array.isArray(entry.loc) && entry.loc.length > 0) return entry.loc[0].trim();
  if (typeof entry.loc === "object" && entry.loc["#text"]) return entry.loc["#text"].trim();
  return null;
};

const isDisallowed = (url, robotsRules) => {
  if (!robotsRules) return false;
  try {
    const path = new URL(url).pathname;
    const userAgents = ["Googlebot", "*"];
    for (const ua of userAgents) {
      if (robotsRules[ua]?.disallow?.some((rule) => path.startsWith(rule))) {
        return true;
      }
    }
    return false;
  } catch {
    logger.warn(`Could not parse URL for robots check: ${url}`);
    return false;
  }
};

const auditSitemapUrl = async (url, robotsRules) => {
  logger.info(`Auditing URL from sitemap: ${url}`);
  const result = {
    url,
    http_status: null,
    is_noindexed: false,
    is_disallowed: isDisallowed(url, robotsRules),
    issues: []
  };

  if (result.is_disallowed) {
    result.issues.push("Disallowed by robots.txt");
    return result;
  }

  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEO-Audit-Tool/1.0)" }
    });

    result.http_status = response.status;
    if (response.headers["content-type"]?.includes("text/html")) {
      const $ = load(response.data);
      const metaRobots = $('meta[name="robots"]').attr("content");
      if (metaRobots && metaRobots.toLowerCase().includes("noindex")) {
        result.is_noindexed = true;
        result.issues.push('Meta tag contains "noindex"');
      }
      const canonical = $('link[rel="canonical"]').attr("href");
      if (canonical) {
        try {
          if (new URL(canonical, url).href !== url) {
            result.issues.push(`Non-canonical URL: points to ${canonical}`);
          }
        } catch {
          logger.warn(`Invalid canonical URL found on page ${url}: ${canonical}`);
        }
      }
    }
  } catch (error) {
    result.http_status = error.response?.status || "Failed to Fetch";
    result.issues.push(`Failed to fetch: HTTP ${result.http_status} (${error.message})`);
    logger.error(`Failed to audit sitemap URL ${url}: ${error.message}`);
  }
  return result;
};

export const analyzeFullSitemap = async (sitemapUrl, robotsRules) => {
  if (!sitemapUrl) {
    return {
      summary: { status: "bad", message: "No sitemap found." },
      total_urls_found: 0,
      audited_urls: []
    };
  }

  logger.info(`Starting full sitemap analysis for: ${sitemapUrl}`);
  try {
    const response = await fetchUrlGet(sitemapUrl);
    logger.info(`Successfully fetched sitemap from ${sitemapUrl}`);

    const parsedXml = parser.parse(response.content);
    let urls = [];
    let isIndex = false;

    if (parsedXml.sitemapindex && parsedXml.sitemapindex.sitemap) {
      isIndex = true;
      logger.info("Sitemap is an index, fetching sub-sitemaps.");

      const sitemaps = Array.isArray(parsedXml.sitemapindex.sitemap)
        ? parsedXml.sitemapindex.sitemap
        : [parsedXml.sitemapindex.sitemap];

      for (const sitemap of sitemaps) {
        const subLoc = getLoc(sitemap);
        if (!subLoc) continue;
        if (urls.length >= URL_LIMIT) break;

        try {
          logger.info(`Fetching sub-sitemap: ${subLoc}`);
          const subResponse = await fetchUrlGet(subLoc);

          if (!subResponse?.content) {
            logger.warn(`No content received from sub-sitemap ${subLoc}. Skipping.`);
            continue;
          }

          const subParsedXml = parser.parse(subResponse.content);
          const subUrls = subParsedXml.urlset?.url || [];
          const locations = subUrls.map(getLoc).filter(Boolean);
          urls.push(...locations);
        } catch (err) {
          logger.error(`Failed sub-sitemap ${subLoc}: ${err.message}`);
        }
      }
    } else if (parsedXml.urlset && parsedXml.urlset.url) {
      const directUrls = Array.isArray(parsedXml.urlset.url)
        ? parsedXml.urlset.url
        : [parsedXml.urlset.url];
      urls = directUrls.map(getLoc).filter(Boolean);
    } else {
      throw new Error("Invalid sitemap format: No <urlset> or <sitemapindex> found.");
    }

    const totalUrlsFound = urls.length;
    if (totalUrlsFound === 0) {
      logger.warn("Sitemap found but empty.");
      return {
        summary: { status: "warning", message: "Sitemap is empty or invalid." },
        total_urls_found: 0,
        audited_urls: []
      };
    }

    const urlsToAudit = urls.slice(0, URL_LIMIT);
    logger.info(`Beginning audit of ${urlsToAudit.length} URLs.`);

    const auditedUrls = [];
    const promises = [];
    for (const url of urlsToAudit) {
      if (typeof url !== "string" || url.trim().length === 0) {
        logger.warn(`Skipping invalid URL: ${url}`);
        continue;
      }
      promises.push(auditSitemapUrl(url, robotsRules));
      if (promises.length >= CRAWL_CONCURRENCY) {
        const results = await Promise.allSettled(promises);
        auditedUrls.push(
          ...results.filter((r) => r.status === "fulfilled").map((r) => r.value)
        );
        promises.length = 0;
      }
    }
    if (promises.length > 0) {
      const results = await Promise.allSettled(promises);
      auditedUrls.push(
        ...results.filter((r) => r.status === "fulfilled").map((r) => r.value)
      );
    }

    const summary = {
      ok_count: auditedUrls.filter(
        (u) =>
          u.http_status >= 200 &&
          u.http_status < 400 &&
          !u.is_disallowed &&
          !u.is_noindexed
      ).length,
      noindex_count: auditedUrls.filter((u) => u.is_noindexed).length,
      disallowed_count: auditedUrls.filter((u) => u.is_disallowed).length,
      error_count: auditedUrls.filter(
        (u) => u.http_status >= 400 || u.http_status === "Failed to Fetch"
      ).length
    };

    let status = "good";
    if (summary.error_count > 0 || summary.noindex_count > 0 || summary.disallowed_count > 0) {
      status = summary.error_count === 0 ? "warning" : "bad";
    }

    return {
      sitemap_url: sitemapUrl,
      total_urls_found: totalUrlsFound,
      audited_urls_count: auditedUrls.length,
      audited_urls: auditedUrls,
      summary: {
        ...summary,
        status,
        message: isIndex
          ? `Audited ${Math.min(totalUrlsFound, URL_LIMIT)} URLs from sub-sitemaps.`
          : `Audited ${Math.min(totalUrlsFound, URL_LIMIT)} of ${totalUrlsFound} URLs found.`
      }
    };
  } catch (error) {
    logger.error(`Failed to fetch or parse sitemap: ${error.message}`);
    return {
      summary: { status: "bad", message: `Sitemap Error: ${error.message}` },
      total_urls_found: 0,
      audited_urls: []
    };
  }
};
