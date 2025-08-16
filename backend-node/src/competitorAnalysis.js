import axios from 'axios';
import { load } from 'cheerio';
import logger from './logger.js';
import { fetchUrlGet } from './fetchUtils.js';

// Your API Key and Custom Search Engine ID
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
 // You'll need to replace this with your actual CSE ID

// Function to fetch top 10 search results for a given keyword
const fetchTopCompetitorUrls = async (keyword) => {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(keyword)}&num=10`;
    try {
        const response = await axios.get(searchUrl, { timeout: 15000 });
        if (response.data.items) {
            return response.data.items.map(item => item.link);
        }
        return [];
    } catch (e) {
        logger.error(`Error fetching SERP data for keyword '${keyword}': ${e.message}`);
        return [];
    }
};

// Function to extract visible text from HTML using Cheerio
const getVisibleText = (html) => {
    if (!html) return '';
    const $ = load(html);
    $('script, style, noscript, nav, header, footer, aside, form, button, input, select, textarea').remove();
    $('[aria-hidden="true"], [role="presentation"], [style*="display:none"], [style*="visibility:hidden"]').remove();
    return $.text().replace(/\s+/g, ' ').trim();
};

// Main function to analyze competitor word count
export const analyzeCompetitorWordCount = async (targetKeyword, targetWordCount) => {
    const competitorUrls = await fetchTopCompetitorUrls(targetKeyword);
    const wordCounts = [];
    const concurrencyLimit = 5;

    logger.info(`Found ${competitorUrls.length} competitor URLs. Starting concurrent scraping.`);

    // Use a Promise-based queue for concurrent scraping
    const promises = competitorUrls.map(async (url) => {
        try {
            const response = await fetchUrlGet(url);
            if (response.success && response.statusCode === 200) {
                const text = getVisibleText(response.content);
                const count = text.split(/\s+/).length;
                if (count > 0) {
                    wordCounts.push(count);
                }
            }
        } catch (e) {
            logger.warn(`Failed to scrape competitor URL ${url}: ${e.message}`);
        }
    });

    // Wait for all concurrent requests to complete
    await Promise.allSettled(promises);

    const averageWordCount = wordCounts.length > 0
        ? Math.round(wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length)
        : 0;
        
    const idealRange = {
        min: Math.round(averageWordCount * 0.8),
        max: Math.round(averageWordCount * 1.2)
    };
    
    let issues = [];
    if (targetWordCount < idealRange.min) {
        issues.push(`⚠️ Your word count is too low. Aim for a word count between ${idealRange.min} and ${idealRange.max}.`);
    } else if (targetWordCount > idealRange.max) {
        issues.push(`⚠️ Your word count is too high. Aim for a word count between ${idealRange.min} and ${idealRange.max}.`);
    } else if (averageWordCount > 0) {
        issues.push(`✅ Your word count is within the ideal range of ${idealRange.min}-${idealRange.max}.`);
    }

    return {
        target_word_count: targetWordCount,
        competitor_average: averageWordCount,
        ideal_range: idealRange,
        issues: issues,
        competitors_scraped: wordCounts.length
    };
};