// src/crawler.js

import { fetchUrlGet, fetchUrlHead, fetchPageContent } from './fetchUtils.js';
import { JSDOM } from 'jsdom';
import { URL } from 'url';
import logger from './logger.js';
import { XMLParser } from 'fast-xml-parser';
import { delay } from './utils.js'; // 💡 New: Import the delay function

// Limits
const MAX_DEPTH = 3;
const MAX_PAGES = 300;
const CONCURRENCY_LIMIT = 10;
const MAX_PLAYWRIGHT_CALLS = 10;

let playwrightUsed = 0;

// Normalize URL helper
const normalizeUrl = (url) => {
    try {
        const u = new URL(url);
        u.hash = '';
        u.search = '';
        return u.href.replace(/\/$/, '');
    } catch {
        return url;
    }
};

// Retry helper
async function withRetry(fn, retries = 3, delayMs = 1000) { // 💡 Renamed delay parameter to avoid conflict with the function
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(res => setTimeout(res, delayMs * (i + 1)));
        }
    }
}

// Playwright fetch using the shared browser instance from index.js
async function fetchWithPlaywright(url) {
    const { html, statusCode, error } = await fetchPageContent(url);
    if (!error) {
      playwrightUsed++;
      return { success: true, statusCode, content: html };
    }
    logger.error(`Playwright failed for ${url}: ${error}`);
    return { success: false, statusCode: statusCode || 500 };
}

// Decide if page deserves Playwright
function shouldUsePlaywright(url, depth, htmlContent, orphan = false) {
    if (playwrightUsed >= MAX_PLAYWRIGHT_CALLS) return false;

    // Always homepage
    if (depth === 0) return true;

    // Orphans deserve Playwright
    if (orphan) return true;

    // Empty or broken
    if (!htmlContent || htmlContent.length < 200) return true;

    // Missing title or links
    if (!/<title>.*<\/title>/i.test(htmlContent) || (htmlContent.match(/<a\s/i) || []).length < 5) {
        return true;
    }

    // Category page
    if (/\/(blog|category|products|services)(\/|$)/i.test(url)) return true;

    // Detail page (deep URL structure)
    if (/\/[a-z0-9-]+\/[a-z0-9-]+/i.test(url) && url.split('/').length > 4) return true;

    return false;
}

// Homepage fetch with fallback: HEAD → GET → Playwright
async function fetchHomepage(url) {
    try {
        let res = await fetchUrlHead(url, { headers: { 'User-Agent': 'Mozilla/5.0 SEO-Bot' }, timeout: 10000 });
        if (res.success && res.statusCode < 400) return res;

        logger.warn(`HEAD failed, retrying with GET for ${url}`);
        res = await fetchUrlGet(url, { headers: { 'User-Agent': 'Mozilla/5.0 SEO-Bot' }, timeout: 10000 });
        if (res.success && res.statusCode < 400 && res.content?.length > 200) return res;

        logger.warn(`GET also failed or empty, falling back to Playwright for ${url}`);
        return await fetchWithPlaywright(url);
    } catch (e) {
        logger.error(`Homepage fetch exception: ${e.message}`);
        return { success: false, statusCode: 500 };
    }
}

export async function crawlSite(startUrl, sitemapUrl) {
    const queue = [{ url: normalizeUrl(startUrl), depth: 0 }];
    const visited = new Set();
    const linkGraph = { nodes: [], edges: [], orphan_pages: [], issues: [] };
    const sitemapPages = new Set();

    // Parse sitemap
    if (sitemapUrl) {
        try {
            const sitemapResponse = await fetchUrlGet(sitemapUrl, { timeout: 15000 });
            if (sitemapResponse.success && sitemapResponse.statusCode === 200) {
                const parser = new XMLParser();
                const parsedXml = parser.parse(sitemapResponse.content);
                let urls = [];
                if (parsedXml.urlset && parsedXml.urlset.url) {
                    const urlEntries = Array.isArray(parsedXml.urlset.url) ? parsedXml.urlset.url : [parsedXml.urlset.url];
                    urls = urlEntries.map(u => normalizeUrl(u?.loc)).filter(Boolean);
                }
                urls.forEach(url => sitemapPages.add(url));
                logger.info(`Found ${sitemapPages.size} URLs in sitemap for orphan check.`);
            }
        } catch (e) {
            logger.warn(`Failed to parse sitemap in crawler: ${e.message}`);
        }
    }

    // Homepage check
    let homepageCheck;
    try {
        homepageCheck = await withRetry(() => fetchHomepage(startUrl), 2);
    } catch {
        homepageCheck = { success: false, statusCode: 500 };
    }

    if (!homepageCheck.success || homepageCheck.statusCode >= 400) {
        logger.warn(`Homepage fetch failed but continuing crawl from sitemap: ${startUrl}`);
        if (sitemapPages.size > 0) {
            sitemapPages.forEach(url => queue.push({ url, depth: 0 }));
        } else {
            linkGraph.issues.push(`❌ Homepage fetch failed (${homepageCheck.statusCode || 'N/A'}) and no sitemap fallback.`);
            return linkGraph;
        }
    }

    let head = 0;
    while (queue.length > head && visited.size < MAX_PAGES) {
        const batchSize = Math.min(queue.length - head, CONCURRENCY_LIMIT);
        const promises = [];

        for (let i = 0; i < batchSize; i++) {
            const { url, depth } = queue[head++];
            if (visited.has(url) || depth > MAX_DEPTH) continue;
            visited.add(url);
            
            await delay(100, 500); // 💡 New: Add a small random delay before each request

            promises.push(
                (async () => {
                    try {
                        let res = await fetchUrlGet(url, {
                            headers: { 'User-Agent': 'Mozilla/5.0 SEO-Bot' },
                            timeout: 15000
                        });
                        
                        // If static fetch failed OR this page qualifies for Playwright
                        if (!res.success || shouldUsePlaywright(url, depth, res.content, sitemapPages.has(url))) {
                            logger.warn(`Using Playwright for ${url}`);
                            res = await fetchWithPlaywright(url);
                        }
                        if (!res.success) return;
                        
                        const dom = new JSDOM(res.content);
                        const document = dom.window.document;
                        const pageTitle = document.querySelector('title')?.textContent.trim() || 'No Title';
                        linkGraph.nodes.push({ id: url, label: pageTitle, depth });
                        
                        const anchors = [...document.querySelectorAll('a[href]')];
                        const newLinks = anchors.map(a => {
                            try {
                                const href = a.getAttribute('href');
                                const absUrl = new URL(href, startUrl).href;
                                return new URL(absUrl).host === new URL(startUrl).host ? normalizeUrl(absUrl) : null;
                            } catch {
                                return null;
                            }
                        }).filter(link => link && !link.match(/\.(jpg|jpeg|png|pdf|docx|mp4|zip|svg|gif)$/i));

                        newLinks.forEach(link => {
                            if (!visited.has(link) && !queue.some(q => q.url === link)) {
                                queue.push({ url: link, depth: depth + 1 });
                            }
                            if (!linkGraph.edges.find(edge => edge.source === url && edge.target === link)) {
                                linkGraph.edges.push({ source: url, target: link });
                            }
                        });
                    } catch (e) {
                        logger.error(`Error crawling ${url}: ${e.message}`);
                    }
                })()
            );
        }
        await Promise.all(promises);
    }

    // Cleanup
    const nodeIds = new Set(linkGraph.nodes.map(node => node.id));
    linkGraph.edges = linkGraph.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    linkGraph.orphan_pages = Array.from(sitemapPages).filter(page => !visited.has(page));

    linkGraph.orphan_pages.forEach(orphanUrl => {
        if (!linkGraph.nodes.find(node => node.id === orphanUrl)) {
            linkGraph.nodes.push({ id: orphanUrl, label: 'Orphan Page', depth: -1 });
        }
    });

    // Issues summary
    if (visited.size === 0) {
        linkGraph.issues.push('❌ Crawl failed to find any pages.');
    } else if (linkGraph.orphan_pages.length > 0) {
        linkGraph.issues.push(`⚠️ ${linkGraph.orphan_pages.length} orphan pages found.`);
    } else {
        linkGraph.issues.push('✅ No orphan pages found.');
    }

    linkGraph.issues.push(`ℹ️ Crawled ${visited.size} pages up to depth ${MAX_DEPTH}.`);
    linkGraph.issues.push(`ℹ️ Playwright was used on ${playwrightUsed} important pages (homepage, templates, orphans).`);

    return linkGraph;
}