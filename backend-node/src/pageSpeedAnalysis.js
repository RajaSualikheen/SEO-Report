import axios from 'axios';
import { URLSearchParams } from 'url';
import logger from './logger.js';

const CACHE_DURATION = 300000; // 5 minutes in milliseconds
const cache = new Map();

export const fetchPageSpeedData = async (url) => {
    console.time('PageSpeed API - Normalize URL');
    const API_KEY = process.env.PAGESPEED_API_KEY;
    const psiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    const strategies = ['mobile', 'desktop'];
    const results = {
        mobile: { error: 'API key not configured', status: 'error', performance_score: null, accessibility_score: null, seo_score: null, metrics: {}, screenshot: null, tap_targets_audit: null, font_size_audit: null },
        desktop: { error: 'API key not configured', status: 'error', performance_score: null, accessibility_score: null, seo_score: null, metrics: {}, screenshot: null }
    };

    logger.info(`Raw input URL for PageSpeed: ${url}`);

    const normalizeUrl = (inputUrl) => {
        try {
            let decodedUrl = inputUrl.trim();
            while (decodedUrl.includes('%')) {
                const temp = decodeURIComponent(decodedUrl);
                if (temp === decodedUrl) break;
                decodedUrl = temp;
            }
            const normalized = new URL(decodedUrl.match(/^https?:\/\//) ? decodedUrl : `https://${decodedUrl}`);
            return normalized.href;
        } catch (error) {
            logger.error(`Invalid URL provided for PageSpeed: ${inputUrl}`, { error: error.message });
            return null;
        }
    };

    const normalizedUrl = normalizeUrl(url);
    console.timeEnd('PageSpeed API - Normalize URL');

    if (!normalizedUrl) {
        results.mobile.error = 'Invalid URL format';
        results.desktop.error = 'Invalid URL format';
        return results;
    }

    logger.info(`Normalized PageSpeed URL: ${normalizedUrl}`);

    logger.info(`PageSpeed API Key present: ${!!API_KEY}`);
    if (!API_KEY) {
        logger.error('PAGESPEED_API_KEY is not set in environment variables.');
        return results;
    }

    const cacheKey = `${normalizedUrl}-${strategies.join('-')}-${categories.join('-')}`;
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            logger.info(`Returning cached PageSpeed data for ${normalizedUrl}`);
            return cached.data;
        }
    }

    const pageSpeedTasks = strategies.map(async (strategy) => {
        console.time(`PageSpeed API - ${strategy}`);
        try {
            const params = new URLSearchParams({
                url: normalizedUrl,
                key: API_KEY,
                strategy: strategy
            });
            categories.forEach(category => params.append('category', category));

            const apiUrl = `${psiUrl}?${params.toString()}`;
            logger.info(`Making PageSpeed API request for ${strategy}: ${apiUrl.replace(API_KEY, 'API_KEY_HIDDEN')}`);

            const response = await axios.get(apiUrl, {
                timeout: 90000,
                headers: { 'User-Agent': 'SEO-Analyzer-Tool/1.0' }
            }).catch(async (error) => {
                if (error.code === 'ECONNABORTED' || error.response?.status === 429) {
                    logger.warn(`Retrying PageSpeed API for ${strategy} due to ${error.code || 'rate limit'}`);
                    const retryResponse = await axios.get(apiUrl, { timeout: 90000, headers: { 'User-Agent': 'SEO-Analyzer-Tool/1.0' } });
                    return retryResponse;
                }
                throw error;
            });

            if (!response.data?.lighthouseResult) {
                throw new Error('Invalid or empty response from PageSpeed API');
            }

            const data = response.data.lighthouseResult;

            logger.debug(`PageSpeed API Response for ${strategy}:`, JSON.stringify({
                performance_score: data.categories?.performance?.score,
                accessibility_score: data.categories?.accessibility?.score,
                seo_score: data.categories?.seo?.score,
                metrics: data.audits
            }, null, 2));

            const getMetricValue = (auditKey, fallback = 'N/A') => {
                const audit = data.audits?.[auditKey];
                if (!audit || !audit.displayValue) {
                    logger.warn(`Metric ${auditKey} not available in PageSpeed response for ${strategy}`);
                    return fallback;
                }
                return audit.displayValue;
            };

            const getMetricScore = (auditKey) => {
                const audit = data.audits?.[auditKey];
                return audit?.score || 0;
            };

            const result = {
                performance_score: Math.round((data.categories?.performance?.score || 0) * 100),
                accessibility_score: Math.round((data.categories?.accessibility?.score || 0) * 100),
                seo_score: Math.round((data.categories?.seo?.score || 0) * 100),
                metrics: {
                    LCP: getMetricValue('largest-contentful-paint'),
                    INP: getMetricValue('interaction-to-next-paint', getMetricValue('max-potential-fid', 'N/A')),
                    CLS: getMetricValue('cumulative-layout-shift'),
                    FCP: getMetricValue('first-contentful-paint'),
                    TBT: getMetricValue('total-blocking-time'),
                    TTI: getMetricValue('interactive')
                },
                status: 'success',
                
                // --- NEW: EXTRACT MOBILE-SPECIFIC AUDIT DATA ---
                screenshot: data.audits['full-page-screenshot']?.details?.screenshot?.data || null,
                tap_targets_audit: data.audits['tap-targets']?.details?.items || [],
                font_size_audit: data.audits['font-size']?.details?.items || [],
                // ----------------------------------------------
            };
            
            console.timeEnd(`PageSpeed API - ${strategy}`);
            return { strategy, data: result };
        } catch (error) {
            logger.error(`Error fetching PageSpeed data for ${strategy}:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data
            });

            const result = {
                error: `Failed to retrieve PageSpeed data: ${error.message}`,
                status_code: error.response?.status || null,
                performance_score: null,
                accessibility_score: null,
                seo_score: null,
                metrics: {
                    LCP: 'N/A',
                    INP: 'N/A',
                    CLS: 'N/A',
                    FCP: 'N/A',
                    TBT: 'N/A',
                    TTI: 'N/A'
                },
                status: 'error',
                screenshot: null,
                tap_targets_audit: [],
                font_size_audit: [],
            };

            if (error.response?.status === 400) {
                result.error = 'Invalid URL or request parameters. Ensure URL is correctly formatted.';
            } else if (error.response?.status === 403) {
                result.error = 'Invalid or restricted API key. Check Google Cloud Console.';
            } else if (error.response?.status === 429) {
                result.error = 'API rate limit exceeded. Retrying...';
            } else if (error.code === 'ECONNABORTED') {
                result.error = 'Request timed out. Check network or increase timeout.';
            }
            console.timeEnd(`PageSpeed API - ${strategy}`);
            return { strategy, data: result };
        }
    });

    const pageSpeedResults = await Promise.all(pageSpeedTasks);
    pageSpeedResults.forEach(({ strategy, data }) => {
        results[strategy] = data;
    });

    cache.set(cacheKey, { data: results, timestamp: Date.now() });
    logger.info(`Cached PageSpeed data for ${normalizedUrl}`);
    return results;
};