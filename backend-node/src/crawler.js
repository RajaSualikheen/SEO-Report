// src/crawler.js (Corrected and optimized)

import { fetchUrlGet, fetchUrlHead } from './fetchUtils.js';
import { JSDOM } from 'jsdom';
import { URL } from 'url';
import logger from './logger.js';
import xml2js from 'xml2js';

// Increased concurrency and page limit for a more thorough crawl
const MAX_DEPTH = 3;
const MAX_PAGES = 200;
const CONCURRENCY_LIMIT = 10; // Increased concurrency limit to speed up fetching

// Normalize URL helper
const normalizeUrl = (url) => {
    try {
        const u = new URL(url);
        u.hash = '';
        u.search = '';
        return u.href.replace(/\/$/, '');
    } catch (e) {
        return url;
    }
};

// Main function to start the crawl
export async function crawlSite(startUrl, sitemapUrl) {
    const queue = [{ url: normalizeUrl(startUrl), depth: 0 }];
    const visited = new Set();
    const linkGraph = { nodes: [], edges: [], orphan_pages: [], issues: [] };
    const sitemapPages = new Set();

    // Fetch sitemap content, but don't perform a full audit here
    if (sitemapUrl) {
        try {
            const sitemapResponse = await fetchUrlGet(sitemapUrl);
            if (sitemapResponse.success && sitemapResponse.statusCode === 200) {
                const parser = new xml2js.Parser();
                const parsedXml = await parser.parseStringPromise(sitemapResponse.content);
                const urls = (parsedXml.urlset?.url || []).map(urlObj => normalizeUrl(urlObj.loc[0]));
                urls.forEach(url => sitemapPages.add(url));
                logger.info(`Found ${sitemapPages.size} URLs in sitemap for orphan check.`);
            }
        } catch (e) {
            logger.warn(`Failed to parse sitemap in crawler: ${e.message}`);
        }
    }

    const homepageCheck = await fetchUrlHead(startUrl); // Use HEAD request for speed
    if (!homepageCheck.success || homepageCheck.statusCode >= 400) {
        logger.error(`Cannot start crawl, homepage fetch failed: ${startUrl}`);
        return {
            nodes: [],
            edges: [],
            orphan_pages: Array.from(sitemapPages),
            issues: [`❌ Homepage fetch failed (${homepageCheck.statusCode || 'N/A'}). Cannot perform a crawl.`]
        };
    }

    let head = 0;
    while (queue.length > head && visited.size < MAX_PAGES) {
        const batchSize = Math.min(queue.length - head, CONCURRENCY_LIMIT);
        const promises = [];

        for (let i = 0; i < batchSize; i++) {
            const { url, depth } = queue[head++];

            if (visited.has(url) || depth > MAX_DEPTH) continue;
            visited.add(url);

            promises.push(
                (async () => {
                    try {
                        const { content, success } = await fetchUrlGet(url);
                        if (!success) return;

                        const dom = new JSDOM(content);
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

    const nodeIds = new Set(linkGraph.nodes.map(node => node.id));
    linkGraph.edges = linkGraph.edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
    linkGraph.orphan_pages = Array.from(sitemapPages).filter(page => !visited.has(page));

    linkGraph.orphan_pages.forEach(orphanUrl => {
        if (!linkGraph.nodes.find(node => node.id === orphanUrl)) {
            linkGraph.nodes.push({ id: orphanUrl, label: 'Orphan Page', depth: -1 });
        }
    });

    if (visited.size === 0) {
        linkGraph.issues.push('❌ Crawl failed to find any pages.');
    } else if (linkGraph.orphan_pages.length > 0) {
        linkGraph.issues.push(`⚠️ ${linkGraph.orphan_pages.length} orphan pages found.`);
    } else {
        linkGraph.issues.push('✅ No orphan pages found.');
    }

    linkGraph.issues.push(`ℹ️ Crawled ${visited.size} pages up to depth ${MAX_DEPTH}.`);

    return linkGraph;
}