import axios from 'axios';
import { load } from 'cheerio';
import xml2js from 'xml2js';
import { URL } from 'url';
import logger from './logger.js';
import { fetchUrlGet, fetchUrlHead } from './fetchUtils.js';

// Increased concurrency for a faster crawl
const CRAWL_CONCURRENCY = 10;
const URL_LIMIT = 200;
const TIMEOUT = 15000;

const isDisallowed = (url, robotsRules) => {
    if (!robotsRules) return false;
    try {
        const path = new URL(url).pathname;
        const userAgents = ['Googlebot', '*'];
        for (const ua of userAgents) {
            if (robotsRules[ua]?.disallow?.some(rule => path.startsWith(rule))) {
                return true;
            }
        }
        return false;
    } catch (e) {
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
        issues: [],
    };

    if (result.is_disallowed) {
        result.issues.push('Disallowed by robots.txt');
    }

    try {
        const response = await axios.get(url, {
            timeout: TIMEOUT,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Tool/1.0)' }
        });
        result.http_status = response.status;

        if (response.headers['content-type']?.includes('text/html')) {
            const $ = load(response.data);
            const metaRobots = $('meta[name="robots"]').attr('content');
            if (metaRobots && metaRobots.toLowerCase().includes('noindex')) {
                result.is_noindexed = true;
                result.issues.push('Meta tag contains "noindex"');
            }
            const canonical = $('link[rel="canonical"]').attr('href');
            if (canonical && new URL(canonical, url).href !== url) {
                result.issues.push(`Non-canonical URL: points to ${canonical}`);
            }
        }
    } catch (error) {
        result.http_status = error.response?.status || 'Failed to Fetch';
        result.issues.push(`Failed to fetch: HTTP ${result.http_status} (${error.message})`);
        logger.error(`Failed to audit sitemap URL ${url}: ${error.message}`);
    }

    return result;
};

export const analyzeFullSitemap = async (sitemapUrl, robotsRules) => {
    if (!sitemapUrl) {
        logger.warn('No sitemap URL provided, returning default no-sitemap report.');
        return {
            summary: { status: 'bad', message: 'No sitemap found in robots.txt or common locations.' },
            total_urls_found: 0,
            audited_urls: []
        };
    }

    logger.info(`Starting full sitemap analysis for: ${sitemapUrl}`);

    try {
        const response = await fetchUrlGet(sitemapUrl);
        logger.info(`Successfully fetched sitemap from ${sitemapUrl}`);
        const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });
        let parsedXml = await parser.parseStringPromise(response.content);
        let urls = [];
        let isIndex = false;

        if (parsedXml?.sitemapindex) {
            isIndex = true;
            logger.info('Sitemap is an index, fetching sub-sitemaps.');
            // Use optional chaining and nullish coalescing to safely access properties
            const subSitemaps = parsedXml.sitemapindex.sitemap ?? [];
            const subSitemapUrls = (Array.isArray(subSitemaps) ? subSitemaps : [subSitemaps]).map(s => s.loc).filter(Boolean);

            if (!subSitemapUrls.length) {
                logger.warn("Sitemap index is empty.");
                return { summary: { status: 'warning', message: 'Sitemap index found but it contains no sitemap locations.' }, total_urls_found: 0, audited_urls: [] };
            }
            urls = [];
            for (const subSitemapUrl of subSitemapUrls) {
                if (urls.length >= URL_LIMIT) {
                    logger.warn(`Reached URL limit of ${URL_LIMIT}. Stopping sub-sitemap fetch.`);
                    break;
                }
                try {
                    logger.info(`Fetching sub-sitemap: ${subSitemapUrl}`);
                    const subResponse = await fetchUrlGet(subSitemapUrl);
                    const subParsedXml = await parser.parseStringPromise(subResponse.content);
                    // Safely access the `url` property
                    const subUrls = subParsedXml?.urlset?.url ?? [];
                    if (subUrls.length > 0) {
                        urls.push(...(Array.isArray(subUrls) ? subUrls : [subUrls]).map(u => u.loc));
                    }
                } catch (subError) {
                    logger.error(`Failed to fetch or parse sub-sitemap ${subSitemapUrl}: ${subError.message}`);
                }
            }
        } else if (parsedXml?.urlset) {
            // Safely access the `url` property
            const directUrls = parsedXml.urlset.url ?? [];
            urls = (Array.isArray(directUrls) ? directUrls : [directUrls]).map(u => u.loc);
        } else {
            throw new Error("Invalid sitemap format: No <urlset> or <sitemapindex> found.");
        }

        const totalUrlsFound = urls.length;

        if (totalUrlsFound === 0) {
            logger.warn('Sitemap found but it is empty.');
            return { summary: { status: 'warning', message: 'Sitemap found but it is empty or invalid.' }, total_urls_found: 0, audited_urls: [] };
        }

        const reportMessage = isIndex
            ? `Audited ${Math.min(totalUrlsFound, URL_LIMIT)} URLs from sub-sitemaps.`
            : `Audited ${Math.min(totalUrlsFound, URL_LIMIT)} of ${totalUrlsFound} URLs found.`;

        const urlsToAudit = urls.slice(0, URL_LIMIT);
        logger.info(`Beginning audit of ${urlsToAudit.length} URLs from the sitemap.`);

        const auditedUrls = [];
        const promises = [];
        for (const url of urlsToAudit) {
            promises.push(auditSitemapUrl(url, robotsRules));
            if (promises.length >= CRAWL_CONCURRENCY) {
                const results = await Promise.allSettled(promises);
                auditedUrls.push(...results.filter(r => r.status === 'fulfilled').map(r => r.value));
                promises.length = 0;
            }
        }
        if (promises.length > 0) {
            const results = await Promise.allSettled(promises);
            auditedUrls.push(...results.filter(r => r.status === 'fulfilled').map(r => r.value));
        }

        const summary = {
            ok_count: auditedUrls.filter(u => u.http_status >= 200 && u.http_status < 400 && !u.is_disallowed && !u.is_noindexed).length,
            noindex_count: auditedUrls.filter(u => u.is_noindexed).length,
            disallowed_count: auditedUrls.filter(u => u.is_disallowed).length,
            error_count: auditedUrls.filter(u => u.http_status >= 400 || u.http_status === 'Failed to Fetch').length,
        };

        let status = 'good';
        if (summary.error_count > 0 || summary.noindex_count > 0 || summary.disallowed_count > 0) {
            status = 'bad';
            if (summary.error_count === 0) {
                status = 'warning';
            }
        }

        logger.info(`Sitemap audit completed. Status: ${status}, Errors: ${summary.error_count}, Issues: ${summary.noindex_count + summary.disallowed_count}`);

        return {
            sitemap_url: sitemapUrl,
            total_urls_found: totalUrlsFound,
            audited_urls_count: auditedUrls.length,
            audited_urls: auditedUrls,
            summary: {
                ...summary,
                status,
                message: reportMessage
            }
        };

    } catch (error) {
        logger.error(`Failed to fetch or parse sitemap: ${error.message}`, { code: error.code, response: error.response?.status });
        return {
            summary: { status: 'bad', message: `Sitemap Error: ${error.message}` },
            total_urls_found: 0,
            audited_urls: []
        };
    }
};

const visualizeSitemap = (sitemapAudit) => {
    const { audited_urls, summary, total_urls_found } = sitemapAudit;
    return {
        summary: {
            total_urls: total_urls_found || 'N/A',
            audited_urls: summary.audited_urls_count || 'N/A',
            ok: summary.ok_count || 'N/A',
            errors: summary.error_count || 'N/A',
            issues: summary.noindex_count + summary.disallowed_count || 0,
            message: summary.message || 'No data available'
        },
        details: audited_urls.map(url => ({
            url: url.url,
            status: url.http_status || 'N/A',
            noindexed: url.is_noindexed,
            disallowed: url.is_disallowed,
            issues: url.issues.join(', ') || 'None'
        }))
    };
};