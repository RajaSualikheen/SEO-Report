// src/competitorAnalysis.js
import axios from 'axios';
import { load } from 'cheerio';
import logger from './logger.js';
import { fetchUrlGet } from './fetchUtils.js';
import { getVisibleText } from './utils.js';
import { analyzeStructuredData } from './structuredDataAnalysis.js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const SERP_API_URL = 'https://www.googleapis.com/customsearch/v1';

/**
 * Fetches the entire SERP for a given keyword to analyze all its features.
 * @param {string} keyword - The keyword to search for.
 * @returns {object} - Contains competitor links, titles, snippets, and PAA questions.
 */
const fetchSERPData = async (keyword) => {
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        logger.warn('Google API Key or CSE ID is missing. Skipping SERP analysis.');
        return { competitors: [], peopleAlsoAsk: [], relatedSearches: [] };
    }

    const searchUrl = `${SERP_API_URL}?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(keyword)}&num=5`; // Fetch top 5 for analysis

    try {
        const response = await axios.get(searchUrl, { timeout: 15000 });
        const items = response.data.items || [];
        
        const competitors = items.map(item => ({
            url: item.link,
            title: item.title,
            snippet: item.snippet,
        }));

        // Extract "People Also Ask" and "Related Searches" if available in the response metadata
        const peopleAlsoAsk = response.data.relatedSearches?.map(item => item.title) || [];
        
        return { competitors, peopleAlsoAsk };
    } catch (e) {
        logger.error(`Error fetching SERP data for keyword '${keyword}': ${e.message}`);
        //✅ ENHANCED ERROR HANDLING
        let reason = 'An unknown error occurred while contacting the Google Search API.';
        if (e.response) { // Error from Google API
            if (e.response.status === 429) {
                reason = 'Google Custom Search API daily quota exceeded (100 free queries per day). Please check your usage in the Google Cloud Console.';
            } else if (e.response.status === 403 || e.response.status === 400) {
                reason = 'Google API request failed. Please check that your API Key is valid, the Custom Search API is enabled, and your CSE ID is configured to search the entire web.';
            } else {
                reason = `Google API returned an error: ${e.response.status} ${e.response.statusText}`;
            }
        } else if (e.code === 'ECONNABORTED') {
            reason = 'The request to Google Search API timed out.';
        }
        
        return { competitors: [], peopleAlsoAsk: [], error: reason };
    }
};

/**
 * Performs a lightweight analysis on a single competitor URL.
 * @param {string} url - The competitor's URL.
 * @returns {object|null} - A structured object with competitor's content metrics.
 */
const analyzeCompetitorPage = async (url, title) => {
    try {
        const response = await fetchUrlGet(url);
        if (!response.success || response.statusCode !== 200) {
            return null;
        }

        const $ = load(response.content);
        const text = getVisibleText($);
        const wordCount = text.split(/\s+/).length;

        const headings = {
            h1: $('h1').first().text().trim(),
            h2: $('h2').map((i, el) => $(el).text().trim()).get(),
        };

        const structuredData = await analyzeStructuredData($, url);
        
        return {
            url,
            title: title || $('title').text().trim() || 'No title found',
            wordCount,
            headings,
            schemaTypes: structuredData.schema_types,
        };
    } catch (e) {
        logger.warn(`Failed to scrape and analyze competitor URL ${url}: ${e.message}`);
        return null;
    }
};


/**
 * Main function to orchestrate SERP and competitor analysis.
 * @param {string} targetKeyword - The user's target keyword.
 * @param {number} userWordCount - The word count of the user's page.
 * @returns {object} - The complete SERP and content gap analysis.
 */
export const analyzeSERPAndCompetitors = async (targetKeyword, userWordCount) => {
    if (!targetKeyword) {
        return { status: 'skipped', reason: 'No keyword provided.' };
    }

    const { competitors, peopleAlsoAsk } = await fetchSERPData(targetKeyword);
    
    if (competitors.length === 0) {
        return { status: 'failed', reason: 'Could not fetch competitor data from Google.' };
    }

    const analysisPromises = competitors.map(c => analyzeCompetitorPage(c.url, c.title));
    const competitorAnalyses = (await Promise.all(analysisPromises)).filter(Boolean); // Filter out nulls from failed fetches

    // Aggregate Data for Content Gap Analysis
    const totalCompetitorWordCount = competitorAnalyses.reduce((sum, c) => sum + c.wordCount, 0);
    const averageWordCount = competitorAnalyses.length > 0 ? Math.round(totalCompetitorWordCount / competitorAnalyses.length) : 0;
    
    const allCompetitorH2s = competitorAnalyses.flatMap(c => c.headings.h2);
    const commonHeadings = allCompetitorH2s.reduce((acc, h2) => {
        // Simple keyword extraction from headings
        h2.toLowerCase().split(/\s+/).forEach(word => {
            if (word.length > 3 && !['the', 'and', 'for', 'with'].includes(word)) {
                acc[word] = (acc[word] || 0) + 1;
            }
        });
        return acc;
    }, {});
    
    const topHeadings = Object.entries(commonHeadings)
        .filter(([, count]) => count > 1) // Only show topics mentioned by more than one competitor
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([term]) => term);

    const competitorSchemaTypes = [...new Set(competitorAnalyses.flatMap(c => c.schemaTypes))];

    return {
        status: 'completed',
        targetKeyword,
        peopleAlsoAsk,
        contentGap: {
            userWordCount,
            competitorAverageWordCount: averageWordCount,
            commonCompetitorHeadings: topHeadings,
            commonCompetitorSchemas: competitorSchemaTypes,
        },
        competitors: competitorAnalyses,
    };
};