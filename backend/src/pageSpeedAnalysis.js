import axios from "axios";
import { URLSearchParams } from "url";
import logger from "./logger.js";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

const PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const STRATEGIES = ["mobile", "desktop"];
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

/**
 * Normalize user input into a valid URL
 */
const normalizeUrl = (inputUrl) => {
  try {
    let decoded = inputUrl.trim();
    while (decoded.includes("%")) {
      const temp = decodeURIComponent(decoded);
      if (temp === decoded) break;
      decoded = temp;
    }
    const normalized = new URL(decoded.match(/^https?:\/\//) ? decoded : `https://${decoded}`);
    return normalized.href;
  } catch (error) {
    logger.error(`Invalid URL for PageSpeed: ${inputUrl}`, { error: error.message });
    return null;
  }
};

/**
 * Extract a metric value from the Lighthouse audits
 */
const getMetricValue = (audits, key, fallback = "N/A") => {
  const audit = audits?.[key];
  return audit?.displayValue || fallback;
};

/**
 * Extract audit score
 */
const getMetricScore = (audits, key) => {
  return audits?.[key]?.score ?? 0;
};

/**
 * Transform PSI response → normalized result object
 */
const transformPsiResponse = (data, strategy) => {
  const audits = data.audits || {};
  return {
    status: "success",
    performance_score: Math.round((data.categories?.performance?.score || 0) * 100),
    accessibility_score: Math.round((data.categories?.accessibility?.score || 0) * 100),
    seo_score: Math.round((data.categories?.seo?.score || 0) * 100),
    metrics: {
      LCP: getMetricValue(audits, "largest-contentful-paint"),
      INP: getMetricValue(audits, "interaction-to-next-paint", getMetricValue(audits, "max-potential-fid", "N/A")),
      CLS: getMetricValue(audits, "cumulative-layout-shift"),
      FCP: getMetricValue(audits, "first-contentful-paint"),
      TBT: getMetricValue(audits, "total-blocking-time"),
      TTI: getMetricValue(audits, "interactive"),
    },
    screenshot: audits["full-page-screenshot"]?.details?.screenshot?.data || null,
    tap_targets_audit: audits["tap-targets"]?.details?.items || [],
    font_size_audit: audits["font-size"]?.details?.items || [],
  };
};

/**
 * Handle errors gracefully
 */
const buildErrorResult = (error, strategy) => {
  let message = `Failed to fetch PageSpeed data: ${error.message}`;
  if (error.response?.status === 400) {
    message = "Invalid URL or request parameters.";
  } else if (error.response?.status === 403) {
    message = "Invalid or restricted API key.";
  } else if (error.response?.status === 429) {
    message = "API rate limit exceeded.";
  } else if (error.code === "ECONNABORTED") {
    message = "Request timed out.";
  }

  return {
    status: "error",
    error: message,
    status_code: error.response?.status || null,
    performance_score: null,
    accessibility_score: null,
    seo_score: null,
    metrics: { LCP: "N/A", INP: "N/A", CLS: "N/A", FCP: "N/A", TBT: "N/A", TTI: "N/A" },
    screenshot: null,
    tap_targets_audit: [],
    font_size_audit: [],
  };
};

/**
 * Fetch PageSpeed Insights data for one strategy
 */
const fetchPsiForStrategy = async (normalizedUrl, strategy, apiKey) => {
  const params = new URLSearchParams({ url: normalizedUrl, key: apiKey, strategy });
  CATEGORIES.forEach((cat) => params.append("category", cat));

  const apiUrl = `${PSI_URL}?${params.toString()}`;
  logger.info(`PageSpeed request for ${strategy}: ${apiUrl.replace(apiKey, "API_KEY_HIDDEN")}`);

  try {
    const response = await axios.get(apiUrl, {
      timeout: 90_000,
      headers: { "User-Agent": "SEO-Analyzer-Tool/1.0" },
    });

    if (!response.data?.lighthouseResult) {
      throw new Error("Empty PageSpeed response");
    }

    return transformPsiResponse(response.data.lighthouseResult, strategy);
  } catch (error) {
    logger.error(`Error fetching PSI for ${strategy}`, {
      message: error.message,
      status: error.response?.status,
    });
    return buildErrorResult(error, strategy);
  }
};

/**
 * Main entry → fetch PageSpeed data for both strategies
 */
export const fetchPageSpeedData = async (url) => {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const results = { mobile: null, desktop: null };

  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) {
    return {
      mobile: { ...buildErrorResult(new Error("Invalid URL"), "mobile") },
      desktop: { ...buildErrorResult(new Error("Invalid URL"), "desktop") },
    };
  }

  if (!apiKey) {
    logger.error("PAGESPEED_API_KEY not set");
    return {
      mobile: { ...buildErrorResult(new Error("Missing API key"), "mobile") },
      desktop: { ...buildErrorResult(new Error("Missing API key"), "desktop") },
    };
  }

  // Cache check
  const cacheKey = `${normalizedUrl}-${STRATEGIES.join("-")}-${CATEGORIES.join("-")}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.info(`Serving cached PageSpeed results for ${normalizedUrl}`);
    return cached.data;
  }

  // Fetch in parallel
  const [mobile, desktop] = await Promise.all(
    STRATEGIES.map((s) => fetchPsiForStrategy(normalizedUrl, s, apiKey))
  );

  results.mobile = mobile;
  results.desktop = desktop;

  cache.set(cacheKey, { data: results, timestamp: Date.now() });
  logger.info(`Cached PageSpeed data for ${normalizedUrl}`);

  return results;
};
