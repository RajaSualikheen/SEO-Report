import { URL } from 'url';
import xml2js from 'xml2js';
import logger from './logger.js';
import { fetchUrlHead, fetchUrlGet, followRedirects } from './fetchUtils.js';
import { safeGetAttribute } from './utils.js';

export const analyzeRobotsTxt = async (baseUrl) => {
    const robotsTxtUrl = new URL('/robots.txt', baseUrl).href;
    const robotsResult = {
        present: false,
        rules: {},
        sitemap_path: null,
        issues: []
    };

    try {
        const response = await fetchUrlGet(robotsTxtUrl);
        if (response.success && response.statusCode === 200) {
            robotsResult.present = true;
            const content = response.content;
            const lines = content.split('\n');
            let currentUserAgent = null;

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue;
                }

                const [key, value] = trimmedLine.split(':').map(s => s.trim());
                if (!key || !value) continue;

                if (key.toLowerCase() === 'user-agent') {
                    currentUserAgent = value;
                    if (!robotsResult.rules[currentUserAgent]) {
                        robotsResult.rules[currentUserAgent] = { allow: [], disallow: [] };
                    }
                } else if (currentUserAgent) {
                    if (key.toLowerCase() === 'disallow') {
                        robotsResult.rules[currentUserAgent].disallow.push(value);
                    } else if (key.toLowerCase() === 'allow') {
                        robotsResult.rules[currentUserAgent].allow.push(value);
                    }
                } else if (key.toLowerCase() === 'sitemap') {
                    robotsResult.sitemap_path = value;
                }
            }

            if (!robotsResult.rules['*'] && Object.keys(robotsResult.rules).length > 0) {
                robotsResult.issues.push('⚠️ No general User-agent (*) rule found. This might lead to unexpected crawling behavior for unspecified bots.');
            } else if (robotsResult.rules['*']) {
                const wildCardRules = robotsResult.rules['*'];
                if (wildCardRules.disallow.includes('/')) {
                    robotsResult.issues.push('❌ Crawling is disallowed for all bots by `Disallow: /` rule in robots.txt.');
                }
            }

        } else {
            robotsResult.issues.push('❌ robots.txt file not found or inaccessible.');
        }
    } catch (e) {
        logger.warn(`Error analyzing robots.txt: ${e.message}`);
        robotsResult.issues.push('⚠️ An error occurred while fetching or parsing robots.txt.');
    }
    return robotsResult;
};

export const analyzeMetaRobots = (soup) => {
    const metaRobotsTag = soup('meta[name="robots"]');
    const result = {
        present: false,
        content: null,
        is_noindex: false,
        is_nofollow: false,
        issues: []
    };

    if (metaRobotsTag.length) {
        result.present = true;
        const content = safeGetAttribute(metaRobotsTag, 'content') || '';
        result.content = content;

        if (content.toLowerCase().includes('noindex')) {
            result.is_noindex = true;
            result.issues.push('❌ Meta robots tag contains `noindex` directive. This page will not be indexed by search engines.');
        }
        if (content.toLowerCase().includes('nofollow')) {
            result.is_nofollow = true;
            result.issues.push('⚠️ Meta robots tag contains `nofollow` directive. All links on this page will not pass link equity.');
        }
    } else {
        result.issues.push('✅ No meta robots tag found. The page is likely indexable and crawlable by default.');
    }

    return result;
};

export const validateSitemapUrls = async (sitemapUrl) => {
    const sitemapResult = {
        found: false,
        url_count: 0,
        valid_urls: 0,
        invalid_urls: [],
        status: "❌ Sitemap not found or invalid",
        issues: []
    };

    if (!sitemapUrl) {
        return sitemapResult;
    }

    try {
        const sitemapResponse = await fetchUrlGet(sitemapUrl);
        if (sitemapResponse.success && sitemapResponse.statusCode === 200) {
            const parser = new xml2js.Parser();
            const parsedXml = await parser.parseStringPromise(sitemapResponse.content);
            const urlset = parsedXml.urlset && parsedXml.urlset.url;

            sitemapResult.found = true;
            if (urlset) {
                sitemapResult.url_count = urlset.length;
                sitemapResult.status = `✅ Sitemap Found with ${urlset.length} URLs.`;
                if (urlset.length === 0) {
                    sitemapResult.status = "❌ Sitemap found but contains no URLs.";
                    sitemapResult.issues.push("❌ Sitemap is empty.");
                } else if (urlset.length > 50000) {
                    sitemapResult.issues.push("⚠️ Sitemap contains over 50,000 URLs, consider splitting it.");
                }

                const urlsToCheck = urlset.slice(0, 10);
                const urlCheckTasks = urlsToCheck.map(urlObj => {
                    const url = urlObj.loc[0];
                    return fetchUrlHead(url);
                });

                const urlCheckResults = await Promise.allSettled(urlCheckTasks);
                for (const result of urlCheckResults) {
                    if (result.status === 'fulfilled' && result.value.success && result.value.statusCode === 200) {
                        sitemapResult.valid_urls++;
                    } else {
                        const reason = result.value.error || `Status ${result.value.statusCode}`;
                        sitemapResult.invalid_urls.push({ url: result.value.url, reason });
                        sitemapResult.issues.push(`❌ URL in sitemap returns an error: ${result.value.url} (${reason})`);
                    }
                }
                
                if (sitemapResult.invalid_urls.length > 0) {
                    sitemapResult.status = `⚠️ Sitemap contains ${sitemapResult.invalid_urls.length} invalid URLs.`;
                }

            } else {
                sitemapResult.status = "❌ Sitemap found but is invalid XML.";
                sitemapResult.issues.push("❌ Sitemap found but is invalid XML.");
            }
        } else {
            sitemapResult.issues.push("❌ Sitemap not found or inaccessible.");
        }
    } catch (e) {
        logger.warn(`Error validating sitemap: ${e.message}`);
        sitemapResult.status = "⚠️ Error occurred while checking sitemap";
        sitemapResult.issues.push("⚠️ An error occurred while checking sitemap.");
    }
    return sitemapResult;
};

export const analyzeHttpStatusAndRedirects = async (baseUrl, internalLinks) => {
    const redirectionResults = {};
    const urlsToCheck = [baseUrl, ...internalLinks.slice(0, 3)];

    for (const url of urlsToCheck) {
        try {
            const result = await followRedirects(url);
            redirectionResults[url] = {
                final_url: result.finalUrl,
                final_status_code: result.statusCode,
                redirect_chain: result.redirectChain,
                has_redirect_chain: result.redirectChain.length > 1,
                issues: []
            };

            if (result.redirectChain.length > 2) {
                redirectionResults[url].issues.push(`⚠️ Long redirect chain detected (${result.redirectChain.length - 1} hops). Consider simplifying.`);
            }
            if (result.statusCode && result.statusCode >= 400) {
                redirectionResults[url].issues.push(`❌ Final URL returns a ${result.statusCode} status code.`);
            }

        } catch (e) {
            logger.warn(`Error checking redirection for ${url}: ${e.message}`);
            redirectionResults[url] = {
                final_url: url,
                final_status_code: null,
                redirect_chain: [url],
                has_redirect_chain: false,
                issues: [`❌ Failed to check URL: ${e.message}`]
            };
        }
    }
    return redirectionResults;
};