import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import { URL } from 'url';
import axiosRetry from 'axios-retry';
import logger from '../src/logger.js';
import { getVisibleText, countSyllables, safeGetText, safeGetAttribute, getStopWords } from '../src/utils.js';
import { analyzeMetadataLength } from '../src/metadataAnalysis.js';
import { analyzeKeywordPresence, getKeywordSuggestions } from '../src/keywordAnalysis.js';
import { analyzeImages } from '../src/imageAnalysis.js';
import { analyzeOpenGraphTwitter } from '../src/socialMediaAnalysis.js';
import { auditLocalSeo } from '../src/localSeoAnalysis.js';
import { analyzeRobotsTxt, analyzeMetaRobots, validateSitemapUrls, analyzeHttpStatusAndRedirects } from '../src/crawlabilityAnalysis.js';
import { analyzeStructuredData } from '../src/structuredDataAnalysis.js';
import { analyzeContentUniqueness } from '../src/contentUniqueness.js';
import { fetchPageSpeedData } from '../src/pageSpeedAnalysis.js';
import { calculateOverallScore } from '../src/scoreCalculation.js';

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
    retryCondition: (error) => error.response?.status === 429
});

const router = express.Router();

router.post('/generate-report', async (req, res) => {
    console.time('SEO Report Generation Time');
    let siteUrl = req.body.url;
    if (!siteUrl) {
        console.timeEnd('SEO Report Generation Time');
        return res.status(400).json({ detail: 'URL is required' });
    }

    console.time('URL Normalization');
    logger.info(`Raw input URL from client: ${siteUrl}`);
    try {
        let decodedUrl = siteUrl.trim();
        while (decodedUrl.includes('%')) {
            const temp = decodeURIComponent(decodedUrl);
            if (temp === decodedUrl) break;
            decodedUrl = temp;
        }
        siteUrl = new URL(decodedUrl.match(/^https?:\/\//) ? decodedUrl : `https://${decodedUrl}`).href;
        logger.info(`Normalized URL: ${siteUrl}`);
    } catch (error) {
        console.timeEnd('URL Normalization');
        console.timeEnd('SEO Report Generation Time');
        logger.error(`Invalid URL format: ${siteUrl}`, { error: error.message });
        return res.status(400).json({ detail: `Invalid URL format: ${error.message}` });
    }
    console.timeEnd('URL Normalization');

    logger.info(`Processing SEO report for: ${siteUrl}`);

    try {
        console.time('Fetch HTML');
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };

        let response;
        try {
            response = await axios.get(siteUrl, { headers, timeout: 15000 });
            if (!response.headers['content-type'].includes('text/html')) {
                console.timeEnd('Fetch HTML');
                console.timeEnd('SEO Report Generation Time');
                return res.status(400).json({ detail: `URL does not return HTML content. Content-Type: ${response.headers['content-type']}` });
            }
        } catch (e) {
            console.timeEnd('Fetch HTML');
            console.timeEnd('SEO Report Generation Time');
            logger.error(`Failed to fetch HTML: ${e.message}`);
            if (e.code === 'ECONNABORTED') {
                return res.status(408).json({ detail: "Request timeout while fetching the website" });
            }
            if (e.response) {
                return res.status(e.response.status).json({ detail: `HTTP ${e.response.status}: Failed to fetch the website` });
            }
            return res.status(400).json({ detail: `Failed to connect to the website: ${e.message}` });
        }
        console.timeEnd('Fetch HTML');

        console.time('HTML Parsing');
        const $ = load(response.data);
        logger.info("HTML parsed successfully");
        console.timeEnd('HTML Parsing');

        console.time('Get PageSpeed Data');
        const pagespeedData = await fetchPageSpeedData(siteUrl);
        logger.info('PageSpeed Data:', {
            mobile: {
                performance_score: pagespeedData.mobile.performance_score,
                accessibility_score: pagespeedData.mobile.accessibility_score,
                seo_score: pagespeedData.mobile.seo_score,
                metrics: pagespeedData.mobile.metrics
            },
            desktop: {
                performance_score: pagespeedData.desktop.performance_score,
                accessibility_score: pagespeedData.desktop.accessibility_score,
                seo_score: pagespeedData.desktop.seo_score,
                metrics: pagespeedData.desktop.metrics
            }
        });
        console.timeEnd('Get PageSpeed Data');

        console.time('Get Visible Text');
        const visibleText = getVisibleText($, logger);
        console.timeEnd('Get Visible Text');

        // Metadata Analysis
        console.time('Metadata Analysis');
        const titleTag = safeGetText($('title'));
        const metaDescription = safeGetAttribute($('meta[name="description"]'), 'content');
        const metadataLengthAudit = analyzeMetadataLength(titleTag, metaDescription);
        const metadataAudit = {
            ...metadataLengthAudit,
            issues: []
        };
        if (!titleTag) {
            metadataAudit.issues.push("❌ Missing <title> tag.");
        } else if (metadataLengthAudit.title.status !== "Optimal") {
            metadataAudit.issues.push(`⚠️ Title: ${metadataLengthAudit.title.status}. ${metadataLengthAudit.title.recommendation}`);
        }
        if (!metaDescription) {
            metadataAudit.issues.push("❌ Missing meta description.");
        } else if (metadataLengthAudit.meta_description.status !== "Optimal") {
            metadataAudit.issues.push(`⚠️ Meta Description: ${metadataLengthAudit.meta_description.status}. ${metadataLengthAudit.meta_description.recommendation}`);
        }
        console.timeEnd('Metadata Analysis');

        // Heading Analysis
        console.time('Heading Analysis');
        const h1Tags = $('h1').map((i, el) => $(el).text().trim()).get();
        const h2Tags = $('h2').map((i, el) => $(el).text().trim()).get();
        const h3Tags = $('h3').map((i, el) => $(el).text().trim()).get();
        const h1Count = h1Tags.length;
        const h2Count = h2Tags.length;
        const h3Count = h3Tags.length;
        const headingOrder = $('h1, h2, h3, h4, h5, h6').map((i, el) => ({ tag: el.tagName.toLowerCase(), text: $(el).text().trim() })).get();
        const headingAudit = {
            h1_count: h1Count,
            h2_count: h2Count,
            h3_count: h3Count,
            heading_order: headingOrder,
            issues: []
        };
        let foundH1InOrder = false;
        if (h1Count === 0) {
            headingAudit.issues.push("❌ Missing <h1> tag.");
        } else if (h1Count > 1) {
            headingAudit.issues.push("⚠️ Multiple <h1> tags found. Ideally, there should be only one.");
        }
        for (const heading of headingOrder) {
            if (heading.tag === 'h1') {
                foundH1InOrder = true;
            } else if (heading.tag === 'h2' && !foundH1InOrder) {
                headingAudit.issues.push("❌ Found <h2> before <h1>.");
                break;
            } else if (heading.tag === 'h3' && !foundH1InOrder && !headingOrder.slice(0, headingOrder.indexOf(heading)).some(h => h.tag === 'h2')) {
                headingAudit.issues.push("❌ Found <h3> before <h1> or <h2>.");
                break;
            }
        }
        console.timeEnd('Heading Analysis');

        // Content Analysis
        console.time('Content Analysis');
        const words = visibleText.toLowerCase().match(/\b\w+\b/g) || [];
        const totalWordCount = words.length;
        const stopwords = new Set(getStopWords());
        const filteredWords = words.filter(w => !stopwords.has(w) && w.length > 2);
        const keywordCounts = filteredWords.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        const topKeywords = Object.entries(keywordCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([keyword, count]) => ({
                keyword,
                frequency: count,
                density: totalWordCount > 0 ? parseFloat(((count / totalWordCount) * 100).toFixed(2)) : 0
            }));
        const keywordPresenceAnalysis = analyzeKeywordPresence(topKeywords, titleTag, metaDescription, h1Tags, visibleText, siteUrl);
        const keywordSuggestions = getKeywordSuggestions(words, topKeywords, titleTag, metaDescription, getStopWords);
        let readabilityScore = 0.0;
        try {
            const sentences = visibleText.split(/[.!?]+/g).filter(s => s.trim());
            const sentenceCount = sentences.length;
            const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
            if (sentenceCount > 0 && totalWordCount > 0) {
                readabilityScore = 206.835 - 1.015 * (totalWordCount / sentenceCount) - 84.6 * (syllableCount / totalWordCount);
                readabilityScore = parseFloat(readabilityScore.toFixed(2));
            }
        } catch (e) {
            logger.warn(`Error calculating readability: ${e.message}`);
        }
        const uniquenessAnalysis = await analyzeContentUniqueness($, visibleText, siteUrl);
        const contentAnalysis = {
            total_word_count: totalWordCount,
            top_keywords: topKeywords,
            keyword_analysis: keywordPresenceAnalysis,
            keyword_suggestions: keywordSuggestions,
            readability_score: readabilityScore,
            uniqueness_analysis: uniquenessAnalysis
        };
        logger.info('Content Analysis:', {
            total_word_count: totalWordCount,
            readability_score: readabilityScore,
            uniqueness_analysis: uniquenessAnalysis
        });
        console.timeEnd('Content Analysis');

        // Image Analysis
        console.time('Image Analysis');
        const imageAnalysis = analyzeImages($, visibleText);
        console.timeEnd('Image Analysis');

        // Speed Audit
        console.time('Speed Audit');
        const speedAuditResult = {
            external_css_count: 0,
            external_js_count: 0,
            has_inline_styles: false,
            has_inline_scripts: false,
            large_images: [],
            issues: []
        };
        const externalCssCount = $('link[rel="stylesheet"][href]').length;
        const externalJsCount = $('script[src]').length;
        const hasInlineStyles = $('style').length > 0 || $('[style]').length > 0;
        const hasInlineScripts = $('script:not([src])').length > 0;
        speedAuditResult.external_css_count = externalCssCount;
        speedAuditResult.external_js_count = externalJsCount;
        speedAuditResult.has_inline_styles = hasInlineStyles;
        speedAuditResult.has_inline_scripts = hasInlineScripts;

        $('img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && src.match(/\.(jpg|jpeg|png|gif)$/i)) {
                speedAuditResult.large_images.push(src);
            }
        });

        if (externalCssCount > 5) {
            speedAuditResult.issues.push(`⚠️ High number of external CSS files (${externalCssCount}). Consider consolidating.`);
        }
        if (externalJsCount > 5) {
            speedAuditResult.issues.push(`⚠️ High number of external JS files (${externalJsCount}). Consider consolidating or deferring.`);
        }
        if (hasInlineStyles) {
            speedAuditResult.issues.push("⚠️ Inline styles detected. Consider moving to external CSS for better caching.");
        }
        if (hasInlineScripts) {
            speedAuditResult.issues.push("⚠️ Inline scripts detected. Consider moving to external JS with defer/async.");
        }
        if (speedAuditResult.large_images.length > 0) {
            speedAuditResult.issues.push(`⚠️ Potential large images detected (${speedAuditResult.large_images.length}). Optimize image sizes.`);
        }
        if (pagespeedData.mobile.performance_score !== null && pagespeedData.mobile.performance_score < 50) {
            speedAuditResult.issues.push(`❌ Low mobile performance score (${pagespeedData.mobile.performance_score}). Optimize loading times.`);
        }
        if (pagespeedData.desktop.performance_score !== null && pagespeedData.desktop.performance_score < 50) {
            speedAuditResult.issues.push(`❌ Low desktop performance score (${pagespeedData.desktop.performance_score}). Optimize loading times.`);
        }
        console.timeEnd('Speed Audit');

        // Mobile Responsiveness Audit
        console.time('Mobile Responsiveness Audit');
        const mobileResponsivenessAudit = {
            viewport_tag: false,
            uses_responsive_units: false,
            touch_target_issues: [],
            issues: []
        };
        const viewportTag = $('meta[name="viewport"]').length > 0;
        mobileResponsivenessAudit.viewport_tag = viewportTag;
        if (!viewportTag) {
            mobileResponsivenessAudit.issues.push("❌ Missing viewport meta tag. Critical for mobile responsiveness.");
        } else {
            const viewportContent = safeGetAttribute($('meta[name="viewport"]'), 'content');
            if (!viewportContent.includes('width=device-width') || !viewportContent.includes('initial-scale=1')) {
                mobileResponsivenessAudit.issues.push("⚠️ Viewport meta tag lacks 'width=device-width, initial-scale=1'.");
            }
        }

        const cssRules = $('style').text() + $('link[rel="stylesheet"]').map((i, el) => $(el).attr('href')).get().join('');
        mobileResponsivenessAudit.uses_responsive_units = cssRules.match(/(\bvw\b|\bvh\b|\brem\b|\bem\b|\b%\b)/i) !== null;
        if (!mobileResponsivenessAudit.uses_responsive_units) {
            mobileResponsivenessAudit.issues.push("⚠️ Limited use of responsive units (vw, vh, rem, em, %) detected.");
        }

        $('a, button').each((i, el) => {
            const $el = $(el);
            const style = $el.attr('style') || '';
            const computedSize = style.match(/width:\s*(\d+)px/i) || style.match(/height:\s*(\d+)px/i);
            if (computedSize && parseInt(computedSize[1]) < 44) {
                mobileResponsivenessAudit.touch_target_issues.push(`Small touch target: ${$el.text().trim() || $el.attr('href') || 'element'}`);
            }
        });
        if (mobileResponsivenessAudit.touch_target_issues.length > 0) {
            mobileResponsivenessAudit.issues.push(`⚠️ ${mobileResponsivenessAudit.touch_target_issues.length} small touch targets detected. Ensure minimum 44x44px.`);
        }
        if (pagespeedData.mobile.accessibility_score !== null && pagespeedData.mobile.accessibility_score < 70) {
            mobileResponsivenessAudit.issues.push(`❌ Low mobile accessibility score (${pagespeedData.mobile.accessibility_score}). Improve for better UX.`);
        }
        console.timeEnd('Mobile Responsiveness Audit');

        // Social Media Tags
        console.time('Social Media Tags Analysis');
        const socialMediaTags = analyzeOpenGraphTwitter($);
        console.timeEnd('Social Media Tags Analysis');

        // Structured Data Audit
        console.time('Structured Data Audit');
        const structuredDataAudit = await analyzeStructuredData($, siteUrl);
        console.timeEnd('Structured Data Audit');

        // Local SEO Audit
        console.time('Local SEO Audit');
        const localSeoAudit = auditLocalSeo($, visibleText);
        console.timeEnd('Local SEO Audit');

        // Crawlability and Indexability Audit
        console.time('Crawlability and Indexability Audit');
        const robotsTxtAudit = await analyzeRobotsTxt(siteUrl);
        const metaRobotsAudit = analyzeMetaRobots($);
        const sitemapAudit = await validateSitemapUrls(robotsTxtAudit.sitemap_path);
        const internalLinks = $('a[href]').map((i, el) => {
            const href = $(el).attr('href');
            try {
                return new URL(href, siteUrl).href;
            } catch {
                return null;
            }
        }).get().filter(href => href && href.startsWith(siteUrl));
        const httpStatusAndRedirects = await analyzeHttpStatusAndRedirects(siteUrl, internalLinks);
        const crawlabilityAndIndexabilityAudit = {
            robots_txt: robotsTxtAudit,
            meta_robots: metaRobotsAudit,
            sitemap: sitemapAudit,
            http_status_and_redirects: httpStatusAndRedirects,
            issues: [
                ...robotsTxtAudit.issues,
                ...metaRobotsAudit.issues,
                ...sitemapAudit.issues,
                ...Object.values(httpStatusAndRedirects).flatMap(result => result.issues)
            ]
        };
        console.timeEnd('Crawlability and Indexability Audit');

        // HTTPS Audit
        console.time('HTTPS Audit');
        const httpsAudit = {
            https_enabled: siteUrl.startsWith('https://'),
            issues: []
        };
        if (!httpsAudit.https_enabled) {
            httpsAudit.issues.push("❌ Page is not served over HTTPS.");
        }
        console.timeEnd('HTTPS Audit');

        // Compile Final Report
        console.time('Compile Report');
        const report = {
            url: siteUrl,
            timestamp: new Date().toISOString(),
            https_audit: httpsAudit,
            metadata_audit: metadataAudit,
            heading_audit: headingAudit,
            content_analysis: contentAnalysis,
            image_analysis: imageAnalysis,
            speed_audit: speedAuditResult,
            pagespeed_audit: pagespeedData,
            mobile_responsiveness_audit: mobileResponsivenessAudit,
            social_media_tags: socialMediaTags,
            structured_data_audit: structuredDataAudit,
            local_seo_audit: localSeoAudit,
            crawlability_and_indexability_audit: crawlabilityAndIndexabilityAudit
        };

        report.overall_score = calculateOverallScore(report);
        logger.info('Overall Score:', { overall_score: report.overall_score });
        console.timeEnd('Compile Report');
        console.timeEnd('SEO Report Generation Time');

        logger.info(`SEO report generated successfully for ${siteUrl}`);
        return res.status(200).json(report);

    } catch (e) {
        console.timeEnd('SEO Report Generation Time');
        logger.error(`Unexpected error during SEO analysis: ${e.message}`, { stack: e.stack });
        return res.status(500).json({ detail: `Internal server error: ${e.message}` });
    }
});

export default router;