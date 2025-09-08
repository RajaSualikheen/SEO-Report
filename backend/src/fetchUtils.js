// src/fetchUtils.js
import axios from "axios";
import { URL } from "url";
import logger from "./logger.js";
import { chromium } from "playwright-extra"; // 💡 Changed from 'playwright' to 'playwright-extra'
import { USER_AGENTS } from './utils.js'; // 💡 New: Import User-Agent list

// We'll manage the single browser instance globally in index.js now
let browserInstance = null;
export const setBrowserInstance = (instance) => {
    browserInstance = instance;
};

// 💡 New: Get a random User-Agent
const getRandomUserAgent = () => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

/**
 * Fetch page content with Playwright (handles JavaScript-rendered content).
 */
export const fetchPageContent = async (url) => {
  let page;
  try {
    if (!browserInstance) {
      throw new Error("Playwright browser instance is not available.");
    }
const proxyConfig = process.env.PROXY_URL ? {
        server: process.env.PROXY_URL,
    } : undefined;
    // Create a new browser context with the desired settings
    const context = await browserInstance.newContext({
      userAgent: getRandomUserAgent(), // 💡 New: Use a random User-Agent
      viewport: { width: 1280, height: 800 }
    });
if (proxyConfig) {
      context.use({
        proxy: proxyConfig
      });
    }
    // Prevent blocking modals/popups
    context.on("dialog", async (dialog) => {
      logger.warn(`⚠️ Dismissing dialog of type: ${dialog.type()}`);
      await dialog.dismiss();
    });
    
    page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90000, // 💡 Increased timeout as a temporary measure
    });

    // Try to wait for meaningful content
    const keySelectors = ["main", ".product-grid", "h1", ".main-content"];
    try {
      await page.waitForSelector(keySelectors.join(","), { timeout: 30000 });
      logger.info(`📄 Content loaded for ${url}`);
    } catch {
      logger.warn("⌛ Content selector not found, using fallback wait.");
      await page.waitForTimeout(5000);
    }
    
    await page.waitForTimeout(3000); // allow async JS to settle

    const html = await page.content();
    const finalUrl = page.url();
    const statusCode = response?.status() || 200;

    await context.close(); // Close the context, which also closes the page

    return {
      html,
      pageUrl: finalUrl,
      statusCode,
      error:
        statusCode >= 400 ? `HTTP ${statusCode}: Failed to load page.` : null,
    };
  } catch (err) {
    if (page && !page.isClosed()) {
      await page.close();
    }
    logger.error(`❌ fetchPageContent error for ${url}: ${err.message}`);
    return {
      html: null,
      pageUrl: url,
      statusCode: err.name === "TimeoutError" ? 408 : 500,
      error:
        err.name === "TimeoutError"
          ? "Request timed out (site too slow or heavy)."
          : err.message,
    };
  }
};

/**
 * Simple HEAD request to check URL headers & response code.
 */
export const fetchUrlHead = async (url) => {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 10,
      headers: {
        "User-Agent": getRandomUserAgent(), // 💡 New: Use a random User-Agent
      },
    });

    return {
      url,
      statusCode: response.status,
      contentLength: parseInt(response.headers["content-length"] || "0", 10),
      success: true,
    };
  } catch (err) {
    return {
      url,
      statusCode: err.response?.status || null,
      error: err.message,
      success: false,
    };
  }
};

/**
 * Fetch raw HTML content with GET (fastest for static pages).
 */
export const fetchUrlGet = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        "User-Agent": getRandomUserAgent(), // 💡 New: Use a random User-Agent
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        Connection: "keep-alive",
      },
    });

    return {
      url,
      statusCode: response.status,
      content: response.data,
      success: true,
    };
  } catch (err) {
    return {
      url,
      statusCode: err.response?.status || null,
      error: err.message,
      success: false,
    };
  }
};

/**
 * Follow redirects manually to detect long chains.
 */
export const followRedirects = async (
  url,
  maxRedirects = 10,
  redirectChain = []
) => {
  redirectChain.push(url);
  if (redirectChain.length > maxRedirects) {
    return {
      finalUrl: url,
      statusCode: null,
      redirectChain,
      error: "Max redirects exceeded",
    };
  }

  try {
    const response = await axios.get(url, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
      timeout: 5000,
      headers: {
        "User-Agent": getRandomUserAgent(), // 💡 New: Use a random User-Agent
      },
    });

    return {
      finalUrl: response.request.res.responseUrl,
      statusCode: response.status,
      redirectChain: [...redirectChain, response.request.res.responseUrl],
    };
  } catch (err) {
    if (err.response?.status >= 300 && err.response?.status < 400) {
      const newUrl = err.response.headers.location;
      if (newUrl) {
        return followRedirects(new URL(newUrl, url).href, maxRedirects, redirectChain);
      }
    }

    return {
      finalUrl: url,
      statusCode: err.response?.status || null,
      redirectChain,
      error: err.message,
    };
  }
};