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
import { analyzeRobotsTxt, analyzeMetaRobots, analyzeHttpStatusAndRedirects } from '../src/crawlabilityAnalysis.js';
import { analyzeStructuredData } from '../src/structuredDataAnalysis.js';
import { analyzeContentUniqueness } from '../src/contentUniqueness.js';
import { fetchPageSpeedData } from '../src/pageSpeedAnalysis.js';
import { calculateOverallScore } from '../src/scoreCalculation.js';
import { analyzeLinks } from '../src/linkAnalysis.js';
import { crawlSite } from '../src/crawler.js';
import { analyzeCompetitorWordCount } from '../src/competitorAnalysis.js';
import { analyzeFullSitemap } from '../src/sitemapAnalysis.js';
import { analyzeAccessibility } from '../src/a11yAnalysis.js';
import admin from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { fetchPageContent } from '../src/fetchUtils.js';
// Initialize Firebase Admin SDK if not already done
import dotenv from "dotenv";

dotenv.config();

const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase Admin SDK initialized successfully");

const db = getFirestore();
const GSC_API_TOKEN = process.env.GSC_API_TOKEN;

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
    retryCondition: (error) => error.response?.status === 429
});

const router = express.Router();

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
            { url: "https://example.com/blog", is_toxic: false },
            { url: "https://trusted-site.org", is_toxic: false },
            ...(toxicBacklinks > 0 ? [{ url: "http://spammy-site.ru", is_toxic: true }] : [])
        ]
    };
};

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
        logger.info("GSC API token detected. Attempting to fetch backlink data.");
        try {
            backlinkData = await fetchGscBacklinks();
            backlinkData.issues.push("✅ Backlink data retrieved from Google Search Console (Simulated).");
        } catch (error) {
            logger.error("Failed to fetch backlink data from GSC:", error);
            backlinkData.issues.push("⚠️ Failed to retrieve backlink data from GSC. Please check your connection.");
        }
    } else if (manualLinks.length > 0) {
        logger.info("Analyzing manually provided backlinks.");
        backlinkData.total_backlinks = manualLinks.length;
        backlinkData.referring_domains = new Set(manualLinks.map(link => new URL(link).hostname)).size;
        backlinkData.issues.push("✅ Backlink data is based on manual input.");

        const toxicKeywords = ['spam', 'casino', 'poker', 'adult'];
        backlinkData.toxic_backlinks = manualLinks.filter(link =>
            toxicKeywords.some(keyword => link.includes(keyword))
        ).length;
        if (backlinkData.toxic_backlinks > 0) {
            backlinkData.issues.push(`⚠️ ${backlinkData.toxic_backlinks} potentially toxic backlinks found in manual list.`);
        }
    } else {
        backlinkData.issues.push("ℹ️ Backlink data is not available. Connect GSC or paste links manually for insights.");
    }

    return backlinkData;
};

const saveReportToHistory = async (userId, reportSummary, appId) => {
    try {
        const userDocRef = db.collection(`artifacts/${appId}/users/${userId}/reports`).doc();
        await userDocRef.set(reportSummary);
        logger.info(`Report history for user ${userId} saved successfully.`);
    } catch (e) {
        logger.error(`Failed to save report history for user ${userId}: ${e.message}`);
    }
};

router.post('/generate-report', async (req, res) => {
    console.time('SEO Report Generation Time');
    logger.info(`Received request for SEO report: ${JSON.stringify(req.body)}`);
    const { url, keyword, userId, manualBacklinks, appId } = req.body;
    let siteUrl = url;
    
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
        const { html, pageUrl, statusCode, error: fetchError } = await fetchPageContent(siteUrl);
        if (fetchError) {
            console.timeEnd('Fetch HTML');
            console.timeEnd('SEO Report Generation Time');
            logger.error(`Failed to fetch HTML with Puppeteer: ${fetchError}`);
            return res.status(statusCode || 500).json({ detail: fetchError });
        }
        console.timeEnd('Fetch HTML');
        
        console.time('HTML Parsing');
        const $ = load(html);
        logger.info("HTML parsed successfully");
        console.timeEnd('HTML Parsing');
        
        const visibleText = getVisibleText($, logger);
        const targetWordCount = (visibleText.match(/\b\w+\b/g) || []).length;
        
        console.time('Heavy Async Analysis');
        const [
            pagespeedDataResult,
            competitorWordCountAuditResult,
            uniquenessAnalysisResult,
            robotsTxtAuditResult,
            linkAuditResult,
            structuredDataAuditResult,
            crawlAuditResult,
            a11yAuditResult,
            backlinkAuditResult
        ] = await Promise.allSettled([
            fetchPageSpeedData(siteUrl),
            analyzeCompetitorWordCount(keyword, targetWordCount),
            analyzeContentUniqueness($, visibleText, siteUrl),
            analyzeRobotsTxt(siteUrl),
            analyzeLinks($, siteUrl),
            analyzeStructuredData($, siteUrl),
            crawlSite(siteUrl),
            analyzeAccessibility(html), // Use raw HTML for a11y analysis
            analyzeBacklinks(siteUrl, manualBacklinks)
        ]);
        console.timeEnd('Heavy Async Analysis');

        const pagespeedData = pagespeedDataResult.status === 'fulfilled' ? pagespeedDataResult.value : { mobile: {}, desktop: {} };
        const competitorWordCountAudit = competitorWordCountAuditResult.status === 'fulfilled' ? competitorWordCountAuditResult.value : { issues: ["⚠️ Competitor analysis failed to run."] };
        const uniquenessAnalysis = uniquenessAnalysisResult.status === 'fulfilled' ? uniquenessAnalysisResult.value : { issues: ["⚠️ Uniqueness analysis failed to run."] };
        const robotsTxtAudit = robotsTxtAuditResult.status === 'fulfilled' ? robotsTxtAuditResult.value : { issues: ["⚠️ robots.txt analysis failed to run."] };
        const linkAudit = linkAuditResult.status === 'fulfilled' ? linkAuditResult.value : { issues: ["⚠️ Link analysis failed to run."] };
        const structuredDataAudit = structuredDataAuditResult.status === 'fulfilled' ? structuredDataAuditResult.value : { issues: ["⚠️ Structured data analysis failed to run."] };
        const crawlAudit = crawlAuditResult.status === 'fulfilled' ? crawlAuditResult.value : { issues: ["⚠️ Site crawl failed to run."] };
        const a11yAudit = a11yAuditResult.status === 'fulfilled' ? a11yAuditResult.value : { issues: ["⚠️ Accessibility analysis failed to run."], score: 50 };
        const backlinkAudit = backlinkAuditResult.status === 'fulfilled' ? backlinkAuditResult.value : { issues: ["⚠️ Backlink analysis failed to run."] };

        console.time('Final Sync Analysis');
        const metadataLengthAudit = analyzeMetadataLength(safeGetText($('title')), safeGetAttribute($('meta[name="description"]'), 'content'));
        const metadataAudit = {
            ...metadataLengthAudit,
            issues: []
        };
        if (!metadataLengthAudit.title.text) {
            metadataAudit.issues.push("❌ Missing <title> tag.");
        } else if (metadataLengthAudit.title.status !== "Optimal") {
            metadataAudit.issues.push(`⚠️ Title: ${metadataLengthAudit.title.status}. ${metadataLengthAudit.title.recommendation}`);
        }
        if (!metadataLengthAudit.meta_description.text) {
            metadataAudit.issues.push("❌ Missing meta description.");
        } else if (metadataLengthAudit.meta_description.status !== "Optimal") {
            metadataAudit.issues.push(`⚠️ Meta Description: ${metadataLengthAudit.meta_description.status}. ${metadataLengthAudit.meta_description.recommendation}`);
        }

        const h1Tags = $('h1').map((i, el) => $(el).text().trim()).get();
        const h2Tags = $('h2').map((i, el) => $(el).text().trim()).get();
        const h3Tags = $('h3').map((i, el) => $(el).text().trim()).get();
        const headingOrder = $('h1, h2, h3, h4, h5, h6').map((i, el) => ({ tag: el.tagName.toLowerCase(), text: $(el).text().trim() })).get();
        const headingAudit = {
            h1_count: h1Tags.length,
            h2_count: h2Tags.length,
            h3_count: h3Tags.length,
            heading_order: headingOrder,
            issues: []
        };
        let foundH1InOrder = false;
        if (h1Tags.length === 0) {
            headingAudit.issues.push("❌ Missing <h1> tag.");
        } else if (h1Tags.length > 1) {
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
        
        const words = visibleText.toLowerCase().match(/\b\w+\b/g) || [];
        const totalWordCount = words.length;
        const stopwords = new Set(getStopWords());
        const filteredWords = words.filter(w => !stopwords.has(w) && w.length > 2);
        const keywordCounts = filteredWords.reduce((acc, word) => { acc[word] = (acc[word] || 0) + 1; return acc; }, {});
        const topKeywords = Object.entries(keywordCounts).sort(([, a], [, b]) => b - a).slice(0, 15).map(([keyword, count]) => ({ keyword, frequency: count, density: totalWordCount > 0 ? parseFloat(((count / totalWordCount) * 100).toFixed(2)) : 0, search_volume: null, keyword_difficulty: null, competition: null }));
        const keywordPresenceAnalysis = analyzeKeywordPresence(topKeywords, metadataLengthAudit.title.text, metadataLengthAudit.meta_description.text, h1Tags, visibleText, siteUrl);
        const keywordSuggestions = getKeywordSuggestions(words, topKeywords, metadataLengthAudit.title.text, metadataLengthAudit.meta_description.text, getStopWords);
        
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
        console.timeEnd('Final Sync Analysis');
        
        console.time('Image Analysis');
        const imageAnalysis = analyzeImages($, visibleText);
        console.timeEnd('Image Analysis');
    
        console.time('Speed Audit');
        const speedAuditResult = { external_css_count: $('link[rel="stylesheet"][href]').length, external_js_count: $('script[src]').length, has_inline_styles: $('style').length > 0 || $('[style]').length > 0, has_inline_scripts: $('script:not([src])').length > 0, large_images: [], issues: [] };
        $('img').each((i, el) => { const src = $(el).attr('src') || $(el).attr('data-src'); if (src && src.match(/\.(jpg|jpeg|png|gif)$/i)) { speedAuditResult.large_images.push(src); } });
        if (speedAuditResult.external_css_count > 5) { speedAuditResult.issues.push(`⚠️ High number of external CSS files (${speedAuditResult.external_css_count}). Consider consolidating.`); }
        if (speedAuditResult.external_js_count > 5) { speedAuditResult.issues.push(`⚠️ High number of external JS files (${speedAuditResult.external_js_count}). Consider consolidating or deferring.`); }
        if (speedAuditResult.has_inline_styles) { speedAuditResult.issues.push("⚠️ Inline styles detected. Consider moving to external CSS for better caching."); }
        if (speedAuditResult.has_inline_scripts) { speedAuditResult.issues.push("⚠️ Inline scripts detected. Consider moving to external JS with defer/async."); }
        if (speedAuditResult.large_images.length > 0) { speedAuditResult.issues.push(`⚠️ Potential large images detected (${speedAuditResult.large_images.length}). Optimize image sizes.`); }
        if (pagespeedData?.mobile?.performance_score !== null && pagespeedData?.mobile?.performance_score < 50) { speedAuditResult.issues.push(`❌ Low mobile performance score (${pagespeedData?.mobile?.performance_score}). Optimize loading times.`); }
        if (pagespeedData?.desktop?.performance_score !== null && pagespeedData?.desktop?.performance_score < 50) { speedAuditResult.issues.push(`❌ Low desktop performance score (${pagespeedData?.desktop?.performance_score}). Optimize loading times.`); }
        console.timeEnd('Speed Audit');

        console.time('Mobile Responsiveness Audit');
        const mobileResponsivenessAudit = { viewport_tag: $('meta[name="viewport"]').length > 0, viewport_content: safeGetAttribute($('meta[name="viewport"]'), 'content'), fixed_width_elements: [], issues: [] };
        if (!mobileResponsivenessAudit.viewport_tag) { mobileResponsivenessAudit.issues.push("❌ Missing viewport meta tag. This is critical for mobile responsiveness."); }
        else if (!mobileResponsivenessAudit.viewport_content.includes('width=device-width') || !mobileResponsivenessAudit.viewport_content.includes('initial-scale=1')) { mobileResponsivenessAudit.issues.push("❌ Viewport meta tag is present but not configured for responsive design."); }
        if (pagespeedData?.mobile?.tap_targets_audit?.length > 0) { mobileResponsivenessAudit.issues.push(`❌ Found ${pagespeedData.mobile.tap_targets_audit.length} small or close tap targets. Fix these for a better user experience.`); }
        if (pagespeedData?.mobile?.font_size_audit?.length > 0) { mobileResponsivenessAudit.issues.push(`❌ Text is too small to read on mobile. Fix font legibility issues.`); }
        if (pagespeedData?.mobile?.accessibility_score < 0.9) { mobileResponsivenessAudit.issues.push(`⚠️ Mobile accessibility score is low (${Math.round(pagespeedData?.mobile?.accessibility_score * 100)}%).`); }
        console.timeEnd('Mobile Responsiveness Audit');

        console.time('Social Media Tags Analysis');
        const socialMediaTags = analyzeOpenGraphTwitter($);
        console.timeEnd('Social Media Tags Analysis');

        console.time('Crawlability and Indexability Audit');
        let crawlabilityAndIndexabilityAudit;
        let fullSitemapAudit;
        const robotsTxt = await analyzeRobotsTxt(siteUrl);
        let sitemapPath = robotsTxt.sitemap_path;
        
        if (sitemapPath && sitemapPath.startsWith('/')) {
            sitemapPath = new URL(sitemapPath, siteUrl).href;
        }

        const fallbackLocations = ['/sitemap.xml', '/sitemap_index.xml', '/sitemaps/sitemap.xml'];
        if (!sitemapPath) {
            logger.info("No sitemap found in robots.txt. Trying fallback locations.");
            for (const loc of fallbackLocations) {
                const potentialPath = new URL(loc, siteUrl).href;
                try {
                    const headCheck = await axios.head(potentialPath, { timeout: 5000 });
                    if (headCheck.status === 200) {
                        sitemapPath = potentialPath;
                        logger.info(`Fallback sitemap found at: ${sitemapPath}`);
                        break;
                    }
                } catch (headError) {
                    logger.warn(`Fallback sitemap check for ${potentialPath} failed: ${headError.message}`);
                }
            }
        }
            
        fullSitemapAudit = await analyzeFullSitemap(sitemapPath, robotsTxt.rules);
        const internalLinks = $('a[href]').map((i, el) => {
            try { return new URL($(el).attr('href'), siteUrl).href; } catch { return null; }
        }).get().filter(href => href && href.startsWith(siteUrl));
        const httpStatusAndRedirects = await analyzeHttpStatusAndRedirects(siteUrl, internalLinks);

        crawlabilityAndIndexabilityAudit = {
            robots_txt: robotsTxt,
            meta_robots: analyzeMetaRobots($),
            http_status_and_redirects: httpStatusAndRedirects,
            issues: [
                ...robotsTxt.issues,
                ...analyzeMetaRobots($).issues,
                ...(fullSitemapAudit.summary.status !== 'good' ? [fullSitemapAudit.summary.message] : []),
                ...Object.values(httpStatusAndRedirects).flatMap(result => result.issues)
            ]
        };
        
        console.timeEnd('Crawlability and Indexability Audit');
        
        console.time('HTTPS Audit');
        const httpsAudit = {
            https_enabled: siteUrl.startsWith('https://'),
            issues: []
        };
        if (!httpsAudit.https_enabled) {
            httpsAudit.issues.push("❌ Page is not served over HTTPS.");
        }
        console.timeEnd('HTTPS Audit');

        console.time('Backlink Audit');
        console.timeEnd('Backlink Audit');

        console.time('Link Analysis');
        console.timeEnd('Link Analysis');

        console.time('Crawl Depth Audit');
        console.timeEnd('Crawl Depth Audit');

        console.time('Compile Report');
        const report = {
            reportId: uuidv4(),
            url: siteUrl,
            timestamp: new Date().toISOString(),
            https_audit: httpsAudit,
            a11y_audit: a11yAudit,
            metadata_audit: metadataAudit,
            heading_audit: headingAudit,
            content_analysis: contentAnalysis,
            image_analysis: imageAnalysis,
            speed_audit: speedAuditResult,
            pagespeed_audit: pagespeedData,
            mobile_responsiveness_audit: mobileResponsivenessAudit,
            social_media_tags: socialMediaTags,
            structured_data_audit: structuredDataAudit,
            local_seo_audit: auditLocalSeo($, visibleText),
            crawlability_and_indexability_audit: crawlabilityAndIndexabilityAudit,
            backlink_audit: backlinkAudit,
            link_audit: linkAudit,
            crawl_audit: crawlAudit,
            competitor_word_count_audit: competitorWordCountAudit,
            full_sitemap_audit: fullSitemapAudit,
        };

        report.overall_score = calculateOverallScore(report);
        logger.info('Overall Score:', { overall_score: report.overall_score });
        console.timeEnd('Compile Report');

        if (userId && appId) {
            const reportSummary = {
                id: report.reportId,
                url: report.url,
                overallScore: report.overall_score,
                timestamp: Timestamp.fromDate(new Date()),
            };
            await saveReportToHistory(userId, reportSummary, appId);
        }
        
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