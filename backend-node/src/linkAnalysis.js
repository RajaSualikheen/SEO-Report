import axios from 'axios';
import { URL } from 'url';
import logger from './logger.js';

// Function to fetch a URL's status code, optimized with HEAD request
const checkLinkStatus = async (link) => {
    try {
        const response = await axios.head(link, { timeout: 5000, maxRedirects: 5 });
        return {
            url: link,
            statusCode: response.status,
            ok: response.status >= 200 && response.status < 400
        };
    } catch (error) {
        return {
            url: link,
            statusCode: error.response?.status || 500,
            ok: false
        };
    }
};

// Main function to analyze all links on a page
export const analyzeLinks = async (soup, baseUrl) => {
    const linkAnalysis = {
        internal_links_count: 0,
        external_links_count: 0,
        broken_links_count: 0,
        broken_links: [],
        issues: []
    };

    const allLinks = soup('a[href]');
    const linksToProcess = [];

    // Discover and categorize links
    allLinks.each((i, el) => {
        const href = soup(el).attr('href');
        const anchorText = soup(el).text().trim();
        
        if (!href) return;
        
        try {
            const absoluteUrl = new URL(href, baseUrl).href;
            if (absoluteUrl.startsWith(baseUrl)) {
                linkAnalysis.internal_links_count++;
            } else {
                linkAnalysis.external_links_count++;
            }
            // Push all valid links to an array for later processing
            linksToProcess.push({ url: absoluteUrl, anchorText });
        } catch (e) {
            linkAnalysis.issues.push(`❌ Malformed link found: ${href}`);
        }
    });

    // Check the status of each unique link
    const uniqueLinks = [...new Set(linksToProcess.map(link => link.url))];
    const checkPromises = uniqueLinks.map(url => checkLinkStatus(url));
    const results = await Promise.all(checkPromises);

    results.forEach(result => {
        if (!result.ok) {
            const originalLink = linksToProcess.find(link => link.url === result.url);
            const brokenLinkInfo = {
                url: result.url,
                statusCode: result.statusCode,
                anchorText: originalLink ? originalLink.anchorText : 'No anchor text'
            };
            linkAnalysis.broken_links.push(brokenLinkInfo);
            linkAnalysis.issues.push(`❌ Broken link found: ${brokenLinkInfo.url} (${brokenLinkInfo.statusCode})`);
        }
    });
    
    linkAnalysis.broken_links_count = linkAnalysis.broken_links.length;

    if (linkAnalysis.broken_links_count === 0) {
        linkAnalysis.issues.push('✅ No broken links found on the page.');
    }

    return linkAnalysis;
};