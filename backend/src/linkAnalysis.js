import axios from "axios";
import { URL } from "url";
import logger from "./logger.js";

/**
 * Fetch a URL's status code (using HEAD for efficiency, fallback to GET if needed)
 */
const checkLinkStatus = async (link) => {
    try {
        const response = await axios.head(link, { timeout: 5000, maxRedirects: 5 });
        return { url: link, statusCode: response.status, ok: response.status >= 200 && response.status < 400 };
    } catch (error) {
        // Fallback: sometimes servers don't respond to HEAD properly → try GET
        if (error.response?.status === 405) {
            try {
                const response = await axios.get(link, { timeout: 5000, maxRedirects: 5 });
                return { url: link, statusCode: response.status, ok: response.status >= 200 && response.status < 400 };
            } catch (getError) {
                return { url: link, statusCode: getError.response?.status || 500, ok: false };
            }
        }
        return { url: link, statusCode: error.response?.status || 500, ok: false };
    }
};

/**
 * Analyze all internal and external links on a page
 */
export const analyzeLinks = async (soup, baseUrl) => {
    const linkAnalysis = {
        internal_links_count: 0,
        external_links_count: 0,
        broken_links_count: 0,
        broken_links: [],
        issues: []
    };

    const linksToProcess = [];
    const allLinks = soup("a[href]");

    // Discover and classify links
    allLinks.each((_, el) => {
        const href = soup(el).attr("href");
        const anchorText = soup(el).text().trim();

        if (!href) return;

        try {
            const absoluteUrl = new URL(href, baseUrl).href;

            if (absoluteUrl.startsWith(baseUrl)) {
                linkAnalysis.internal_links_count++;
            } else {
                linkAnalysis.external_links_count++;
            }

            linksToProcess.push({ url: absoluteUrl, anchorText });
        } catch {
            linkAnalysis.issues.push(`❌ Malformed link found: ${href}`);
        }
    });

    // Deduplicate URLs
    const uniqueLinks = [...new Set(linksToProcess.map(link => link.url))];

    // Check link statuses concurrently
    const results = await Promise.allSettled(uniqueLinks.map(url => checkLinkStatus(url)));

    for (const result of results) {
        if (result.status === "fulfilled" && !result.value.ok) {
            const { url, statusCode } = result.value;
            const original = linksToProcess.find(link => link.url === url);
            const brokenLink = {
                url,
                statusCode,
                anchorText: original?.anchorText || "No anchor text"
            };
            linkAnalysis.broken_links.push(brokenLink);
            linkAnalysis.issues.push(`❌ Broken link found: ${url} (${statusCode})`);
        } else if (result.status === "rejected") {
            linkAnalysis.issues.push(`❌ Failed to check link: ${result.reason?.message || "Unknown error"}`);
        }
    }

    linkAnalysis.broken_links_count = linkAnalysis.broken_links.length;

    if (!linkAnalysis.broken_links_count) {
        linkAnalysis.issues.push("✅ No broken links found on the page.");
    }

    return linkAnalysis;
};
