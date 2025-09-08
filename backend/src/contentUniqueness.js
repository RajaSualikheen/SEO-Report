// src/contentUniqueness.js
import { load } from 'cheerio';
import crypto from 'crypto';
import logger from './logger.js';
import { fetchUrlGet } from './fetchUtils.js';
import { URL } from 'url';
import { XMLParser } from 'fast-xml-parser';
/**
 * Normalize text for comparison
 */
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Extract visible, cleaned body text
 */
const extractCleanBodyText = ($) => {
    const bodyContent = $('body').clone();
    bodyContent.find('header, nav, footer, aside, .sidebar, script, style').remove();
    return normalizeText(bodyContent.text());
};

/**
 * Calculate cosine similarity between two texts
 */
const calculateSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;

    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const vocab = new Set([...words1, ...words2]);

    const freq1 = {};
    const freq2 = {};
    vocab.forEach(word => {
        freq1[word] = 0;
        freq2[word] = 0;
    });

    words1.forEach(w => { if (freq1[w] !== undefined) freq1[w]++; });
    words2.forEach(w => { if (freq2[w] !== undefined) freq2[w]++; });

    // Dot product
    const dot = [...vocab].reduce((sum, word) => sum + (freq1[word] * freq2[word]), 0);
    const mag1 = Math.sqrt(Object.values(freq1).reduce((sum, f) => sum + f * f, 0));
    const mag2 = Math.sqrt(Object.values(freq2).reduce((sum, f) => sum + f * f, 0));

    return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
};

/**
 * Stub external check (placeholder for API)
 */
const externalCheck = async (text) => {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    // TODO: integrate with Copyscape / Google API
    return { overlap: 0, source: null, hash };
};

/**
 * Main content uniqueness analyzer
 */
export const analyzeContentUniqueness = async (soup, visibleText, baseUrl) => {
    const uniquenessAnalysis = {
        is_unique: true,
        duplication_issues: [],
        internal_overlap_percentage: 0,
        external_overlap_percentage: 0,
        recommendations: []
    };

    const cleanText = normalizeText(visibleText);
    const cleanBodyText = extractCleanBodyText(soup);

    // --- INTERNAL CHECK ---
    let sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    const sitemapResponse = await fetchUrlGet(sitemapUrl).catch(() => ({ success: false }));
    let internalPages = [];
    if (sitemapResponse.success && sitemapResponse.statusCode === 200) {
        try {
            const parser = new XMLParser();
            const parsedXml = parser.parse(sitemapResponse.content);
            if (parsedXml.urlset && parsedXml.urlset.url) {
                const urls = Array.isArray(parsedXml.urlset.url) ? parsedXml.urlset.url : [parsedXml.urlset.url];
                internalPages = urls.map(urlObj => urlObj.loc).filter(Boolean).slice(0, 5);
            }
        } catch (e) {
            logger.warn(`Failed to parse sitemap in contentUniqueness check: ${e.message}`);
        }
    }
    for (const pageUrl of internalPages) {
        if (pageUrl === baseUrl) continue;

        try {
            const pageResponse = await fetchUrlGet(pageUrl);
            if (pageResponse.success) {
                const pageSoup = load(pageResponse.content);
                const cleanPageText = extractCleanBodyText(pageSoup);

                const similarity = calculateSimilarity(cleanBodyText, cleanPageText);
                const overlapPercentage = Math.round(similarity * 100);

                if (overlapPercentage > 50) {
                    uniquenessAnalysis.is_unique = false;
                    uniquenessAnalysis.duplication_issues.push(
                        `High overlap (${overlapPercentage}%) with internal page: ${pageUrl}`
                    );
                    uniquenessAnalysis.recommendations.push(`Reduce duplication with ${pageUrl}`);
                } else if (overlapPercentage > 20) {
                    uniquenessAnalysis.duplication_issues.push(
                        `Moderate overlap (${overlapPercentage}%) with internal page: ${pageUrl}`
                    );
                    uniquenessAnalysis.recommendations.push(`Review content overlap with ${pageUrl}`);
                }
                uniquenessAnalysis.internal_overlap_percentage = Math.max(
                    uniquenessAnalysis.internal_overlap_percentage,
                    overlapPercentage
                );
            }
        } catch (err) {
            logger.warn(`Failed to fetch internal page ${pageUrl}: ${err.message}`);
        }
    }

    // --- EXTERNAL CHECK (stub) ---
    const externalResult = await externalCheck(cleanText);
    uniquenessAnalysis.external_overlap_percentage = externalResult.overlap;

    if (externalResult.overlap > 50) {
        uniquenessAnalysis.is_unique = false;
        uniquenessAnalysis.duplication_issues.push(
            `High overlap (${externalResult.overlap}%) with external source: ${externalResult.source || 'unknown'}`
        );
        uniquenessAnalysis.recommendations.push("Rewrite content to ensure originality");
    }

    // --- Final recommendation ---
    if (uniquenessAnalysis.is_unique) {
        uniquenessAnalysis.recommendations.push("✅ Content appears unique. Good job!");
    }

    return uniquenessAnalysis;
};
