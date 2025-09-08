// src/backlinkAnalysis.js
import logger from './logger.js';
import { URL } from 'url';

const GSC_API_TOKEN = process.env.GSC_API_TOKEN;

/**
 * Simulate fetching backlink data from Google Search Console
 * (Replace with real API integration when OAuth is set up)
 */
const fetchGscBacklinks = async () => {
    logger.info("Simulating GSC API call...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    const referringDomains = 50 + Math.floor(Math.random() * 500);
    const totalBacklinks = referringDomains * (5 + Math.floor(Math.random() * 10));
    const toxicBacklinks = Math.random() < 0.1 ? Math.floor(Math.random() * (totalBacklinks * 0.05)) : 0;

    return {
        domain_authority: 45 + Math.floor(Math.random() * 20),
        referring_domains: referringDomains,
        total_backlinks: totalBacklinks,
        toxic_backlinks: toxicBacklinks,
        sources: [
            { url: "https://example.com/blog", trust: "trusted" },
            { url: "https://trusted-site.org", trust: "trusted" },
            ...(toxicBacklinks > 0 ? [{ url: "http://spammy-site.ru", trust: "toxic" }] : [])
        ]
    };
};

/**
 * Heuristic check for potentially toxic backlinks
 */
function classifyBacklink(url) {
    const toxicKeywords = ['spam', 'casino', 'poker', 'adult'];
    const toxicTlds = ['.ru', '.cn', '.xyz', '.top'];

    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        if (hostname.startsWith('http://')) return 'toxic';
        if (toxicKeywords.some(k => url.includes(k))) return 'toxic';
        if (toxicTlds.some(tld => hostname.endsWith(tld))) return 'toxic';
        if (parsed.protocol !== 'https:') return 'suspicious';

        return 'trusted';
    } catch {
        return 'suspicious';
    }
}

/**
 * Main Backlink Analyzer
 */
export const analyzeBacklinks = async (url, manualLinks = []) => {
    let backlinkData = {
        domain_authority: 0,
        referring_domains: 0,
        total_backlinks: 0,
        toxic_backlinks: 0,
        sources: [],
        issues: []
    };

    if (GSC_API_TOKEN) {
        logger.info("GSC API token detected. Fetching backlink data...");
        try {
            backlinkData = await fetchGscBacklinks();
            backlinkData.issues.push("✅ Backlink data retrieved from Google Search Console (Simulated).");
        } catch (error) {
            logger.error("Failed to fetch backlink data from GSC:", error);
            backlinkData.issues.push("⚠️ Failed to retrieve backlink data from GSC. Please check your connection.");
        }

    } else if (manualLinks.length > 0) {
        logger.info("Analyzing manually provided backlinks...");

        backlinkData.total_backlinks = manualLinks.length;
        backlinkData.referring_domains = new Set(manualLinks.map(link => {
            try { return new URL(link).hostname; } catch { return link; }
        })).size;

        backlinkData.sources = manualLinks.map(link => ({
            url: link,
            trust: classifyBacklink(link)
        }));

        backlinkData.toxic_backlinks = backlinkData.sources.filter(s => s.trust === 'toxic').length;

        backlinkData.issues.push("✅ Backlink data is based on manual input.");
        if (backlinkData.toxic_backlinks > 0) {
            backlinkData.issues.push(`⚠️ ${backlinkData.toxic_backlinks} potentially toxic backlinks found.`);
        }

    } else {
        backlinkData.issues.push("ℹ️ Backlink data is not available. Connect GSC or paste links manually for insights.");
    }

    return backlinkData;
};
