// old/backend-node/routes/seoReport.js

import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import { URL } from 'url';
import axiosRetry from 'axios-retry';
import logger from '../src/logger.js';
import { getVisibleText, countSyllables, safeGetText, safeGetAttribute, STOP_WORDS } from '../src/utils.js';
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
import { analyzeSERPAndCompetitors } from '../src/competitorAnalysis.js';
import { analyzeFullSitemap } from '../src/sitemapAnalysis.js';
import { analyzeAccessibility } from '../src/a11yAnalysis.js';
import { analyzeBacklinks } from '../src/backlinkAnalysis.js';
import admin from 'firebase-admin';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { fetchPageContent } from '../src/fetchUtils.js';

const requiredFirebaseEnv = [
    'TYPE', 'PROJECT_ID', 'PRIVATE_KEY_ID', 'PRIVATE_KEY', 
    'CLIENT_EMAIL', 'CLIENT_ID', 'AUTH_URI', 'TOKEN_URI', 
    'AUTH_PROVIDER_X509_CERT_URL', 'CLIENT_X509_CERT_URL', 'UNIVERSE_DOMAIN'
];

const missingEnv = requiredFirebaseEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
    throw new Error(`FATAL ERROR: Missing required Firebase environment variables: ${missingEnv.join(', ')}. Check your .env file.`);
}
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

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
    retryCondition: (error) => error.response?.status === 429
});

const router = express.Router();

const saveReportToHistory = async (userId, report, appId) => {
    try {
        const reportId = report.reportId;
        if (!reportId) {
            throw new Error("Report ID is missing, cannot save to history.");
        }
        const reportDocRef = db.collection('artifacts')
                                .doc(appId)
                                .collection('users')
                                .doc(userId)
                                .collection('reports')
                                .doc(reportId);
        await reportDocRef.set(report); 
        logger.info(`Report history for user ${userId} with ID ${reportId} saved successfully.`);
        return reportId;
    } catch (e) {
        logger.error(`Failed to save report history for user ${userId}: ${e.message}`);
        throw e;
    }
};

const generateAiStrategy = async (report) => {
    const systemPrompt = `
You are a world-class SEO Analyst. Your job is to analyze a JSON SEO audit report and output a single valid JSON object only. 

The JSON object must have these keys: 
- "overall_score"
- "summary"
- "critical_issues"
- "high_priority_warnings"
- "content_strategy"
- "score_rationale"

### Guidelines:
1.  **overall_score**: Use the 'overall_score' value directly from the provided report data.

2.  **summary**: Write a concise, 2-sentence executive summary of the site's SEO health based on 'overall_score' and the number/severity of issues. Always sound professional and trustworthy.

3.  **critical_issues**: Create an array of objects for all severe problems found in the 'issues' object (e.g., missing title, missing meta description, inaccessible robots.txt, very low pagespeed score, broken links, 404 errors, missing H1 tag). 
    Each object in the array must include:
    - "title": A short, impactful title for the issue.
    - "explanation": A clear explanation of why this is critical for SEO (1–2 sentences).
    - "recommendation": A specific, actionable fix in plain language (e.g., "Add a meta description between 150–160 characters using primary keywords.").
    - "relevantCardId": Choose the MOST RELEVANT ID from this list: ['title-optimization', 'meta-description', 'heading-structure', 'pagespeed-audit', 'https-usage', 'robots-txt-analysis', 'crawl-audit', 'link-audit', 'mobile-responsiveness-audit', 'a11y-analysis'].

4.  **high_priority_warnings**: Create an array of objects for important but non-fatal issues (e.g., title too short/long, missing image alt attributes, no semantic landmarks, multiple H1 tags). 
    Each object must include the same "title", "explanation", "recommendation", and "relevantCardId" fields.

5.  **content_strategy**: Write a 2–3 sentence strategy paragraph. 
    - If 'serp_analysis.status' is 'completed', suggest content based on competitor gaps or keyword opportunities from the SERP analysis. 
    - Otherwise, suggest topics using the 'top_keywords' from 'content_analysis'. 
    - Always phrase suggestions as actionable ideas (e.g., "Consider publishing a detailed guide targeting the 'X' keyword to fill a content gap.").

6.  **score_rationale**: Write a short explanation (2–3 sentences) of how the overall score was likely determined, mentioning the most significant issues that reduced the score (e.g., "The score was primarily lowered by a non-existent meta description and multiple broken links, which are critical technical issues.").

### Rules:
- The output MUST be a single, strictly valid JSON object.
- DO NOT output any text, markdown, or comments outside the final JSON structure.
- Be specific and actionable in all recommendations.
`;

    const simplifiedReport = {
        overall_score: report.overall_score,
        url: report.url,
        issues: {
            pagespeed_issues: report.speed_audit.issues,
            metadata_issues: report.metadata_audit.issues,
            heading_issues: report.heading_audit.issues,
            crawlability_issues: report.crawlability_and_indexability_audit.issues,
            technical_issues: {
                structured_data: report.structured_data_audit.issues,
                image_accessibility: report.image_analysis.detailed_issues,
                broken_links: report.link_audit.broken_links_count > 0 ? [`Found ${report.link_audit.broken_links_count} broken links.`] : [],
            },
            mobile_experience_issues: report.mobile_responsiveness_audit.issues,
            accessibility_issues: report.a11y_audit.issues,
            local_seo_issues: report.local_seo_audit.issues,
            social_media_issues: report.social_media_tags.issues,
            security_issues: report.https_audit.issues,
        },
        content_analysis: {
            top_keywords: report.content_analysis.top_keywords.slice(0, 5).map(kw => kw.keyword),
        },
        serp_analysis: {
            status: report.serp_analysis?.status,
            targetKeyword: report.serp_analysis?.targetKeyword,
        },
    };

    const userPrompt = `
      Here is the SEO report in JSON format. Please analyze it and generate the strategy according to the system prompt rules:
      ${JSON.stringify(simplifiedReport, null, 2)}
    `;

    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is not set in the environment variables.");
        }
        
        console.log(`[AI DEBUG] Attempting to use Groq API Key: ${'Found a key ending in ...' + apiKey.slice(-4)}`);
        
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );
        
        return JSON.parse(response.data?.choices?.[0]?.message?.content || "{}");

    } catch (error) {
        logger.error(`AI Strategy Generation Failed: ${error.message}`);
        if (error.response) {
            logger.error(`AI API Response Data: ${JSON.stringify(error.response.data)}`);
        }
        return {
            summary: "Could not generate an AI strategy at this time.",
            critical_issues: [],
            high_priority_warnings: [],
            content_strategy: "AI analysis is currently unavailable. Please check the server logs for more details.",
            score_rationale: "Score rationale could not be generated."
        };
    }
};


router.post('/generate-report', async (req, res) => {
    console.time('SEO Report Generation Time');
    logger.info(`Received request for SEO report: ${JSON.stringify(req.body)}`);
    if (!process.env.PAGESPEED_API_KEY) {
        logger.error("FATAL: PAGESPEED_API_KEY is not set in the .env file.");
        return sendError("Server configuration error: PageSpeed API key is missing.");
    }
    if (!process.env.GROQ_API_KEY) {
        logger.error("FATAL: GROQ_API_KEY is not set in the .env file.");
        return sendError("Server configuration error: AI API key is missing.");
    }
    const { url, keyword, userId, manualBacklinks, appId } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendProgress = (progress, message, data = null) => {
        const payload = { progress, message, data };
        res.write(`event: progress\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    
    const sendCompletion = (report) => {
        res.write(`event: complete\n`);
        res.write(`data: ${JSON.stringify(report)}\n\n`);
        res.end();
    };

    const sendError = (detail) => {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ detail })}\n\n`);
        res.end();
    };
        try {
        let siteUrl = url;
        if (!siteUrl) {
            return sendError('URL is required');
        }
        console.time('URL Normalization');
        try {
            let decodedUrl = siteUrl.trim();
              while (decodedUrl.includes('%')) {
                const temp = decodeURIComponent(decodedUrl);
                if (temp === decodedUrl) break;
                decodedUrl = temp;
            }
            siteUrl = new URL(decodedUrl.match(/^https?:\/\//) ? decodedUrl : `https://${decodedUrl}`).href;
        } catch (error) {
            logger.error(`Invalid URL format: ${siteUrl}`, { error: error.message });
            return sendError(`Invalid URL format: ${error.message}`);
        }
    console.timeEnd('URL Normalization');
    const tasks = [
        { name: 'Fetching Page Content', weight: 10, fn: () => fetchPageContent(siteUrl) },
        { name: 'Analyzing Competitors (SERP)', weight: 15, fn: (ctx) => analyzeSERPAndCompetitors(ctx.effectiveKeyword, ctx.targetWordCount) },
        { name: 'Running PageSpeed Insights', weight: 20, fn: () => fetchPageSpeedData(siteUrl) },
        { name: 'Crawling Site & Sitemap', weight: 20, fn: (ctx) => Promise.allSettled([crawlSite(siteUrl, ctx.sitemapPath), analyzeFullSitemap(ctx.sitemapPath, ctx.robotsTxt.rules)]) },
        { name: 'Technical On-Page Analysis', weight: 15, fn: (ctx) => Promise.allSettled([analyzeContentUniqueness(ctx.$, ctx.visibleText, siteUrl), analyzeLinks(ctx.$, siteUrl), analyzeStructuredData(ctx.$, siteUrl)]) },
        { name: 'Checking Accessibility & Backlinks', weight: 10, fn: (ctx) => Promise.allSettled([analyzeAccessibility(ctx.html), analyzeBacklinks(siteUrl, manualBacklinks)]) },
    ];

        let cumulativeProgress = 0;
        const context = {};
      // --- 4. EXECUTE TASKS SEQUENTIALLY AND SEND UPDATES ---
        for (const task of tasks) {
            sendProgress(cumulativeProgress, `${task.name}...`);
            const taskResult = await task.fn(context);

            if (task.name === 'Fetching Page Content') {
                if (taskResult.error) {
                    logger.error(`Failed to fetch HTML: ${taskResult.error}`);
                    return sendError(taskResult.error);
                }
                context.html = taskResult.html;
                context.pageUrl = taskResult.pageUrl;
                context.statusCode = taskResult.statusCode;
                context.$ = load(context.html);
                context.visibleText = getVisibleText(context.$, logger);
                context.targetWordCount = (context.visibleText.match(/\b\w+\b/g) || []).length;

                let effectiveKeyword = keyword;
                if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
                    const titleText = safeGetText(context.$('title'));
                    effectiveKeyword = titleText || '';
                    if (effectiveKeyword) {
                        const fallbackWords = effectiveKeyword.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
                        effectiveKeyword = fallbackWords.slice(0, 3).join(' ');
                        logger.info(`Using sanitized fallback keyword for API: ${effectiveKeyword}`);
                    } else {
                        const words = context.visibleText.toLowerCase().match(/\b\w+\b/g) || [];
                        const stopwords = STOP_WORDS;
                        const keywordCounts = words.filter(w => !stopwords.has(w) && w.length > 2)
                            .reduce((acc, word) => { acc[word] = (acc[word] || 0) + 1; return acc; }, {});
                        const topKeyword = Object.entries(keywordCounts)
                            .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
                        effectiveKeyword = topKeyword;
                        logger.info(`Using top content keyword as fallback: ${topKeyword || 'none'}`);
                    }
                }
                context.effectiveKeyword = effectiveKeyword;
                context.robotsTxt = await analyzeRobotsTxt(siteUrl);
                context.sitemapPath = context.robotsTxt.sitemap_path;

            } else if (task.name === 'Analyzing Competitors (SERP)') {
                context.serpAnalysis = taskResult.status === 'fulfilled' ? taskResult.value : { status: 'failed', reason: 'SERP analysis task failed or timed out.' };
            } else if (task.name === 'Running PageSpeed Insights') {
                context.pagespeedData = taskResult || { mobile: {}, desktop: {} };
            } else if (task.name === 'Crawling Site & Sitemap') {
                const [crawlResult, sitemapResult] = taskResult;
                context.crawlAudit = crawlResult.status === 'fulfilled' ? crawlResult.value : { issues: ["⚠️ Site crawl failed."] };
                context.fullSitemapAudit = sitemapResult.status === 'fulfilled' ? sitemapResult.value : { summary: { status: 'bad', message: 'Sitemap analysis failed.' } };
            } else if (task.name === 'Technical On-Page Analysis') {
                const [uniquenessResult, linkResult, structuredResult] = taskResult;
                context.uniquenessAnalysis = uniquenessResult.status === 'fulfilled' ? uniquenessResult.value : {};
                context.linkAudit = linkResult.status === 'fulfilled' ? linkResult.value : {};
                context.structuredDataAudit = structuredResult.status === 'fulfilled' ? structuredResult.value : {};
            } else if (task.name === 'Checking Accessibility & Backlinks') {
                const [a11yResult, backlinkResult] = taskResult;
                context.a11yAudit = a11yResult.status === 'fulfilled' ? a11yResult.value : {};
                context.backlinkAudit = backlinkResult.status === 'fulfilled' ? backlinkResult.value : {};
            }

            cumulativeProgress += task.weight;
            sendProgress(cumulativeProgress, `${task.name} complete.`);
        }

        sendProgress(95, 'Compiling Final Report...');

        const { $, visibleText, html } = context;

        const metadataLengthAudit = analyzeMetadataLength(safeGetText($('title')), safeGetAttribute($('meta[name="description"]'), 'content'));
        const metadataAudit = {
            ...metadataLengthAudit,
            issues: []
        };
        metadataAudit.issues = [...metadataLengthAudit.issues];
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
        const stopwords = STOP_WORDS;
        const filteredWords = words.filter(w => !stopwords.has(w) && w.length > 2);
        const keywordCounts = filteredWords.reduce((acc, word) => { acc[word] = (acc[word] || 0) + 1; return acc; }, {});
        const topKeywords = Object.entries(keywordCounts).sort(([, a], [, b]) => b - a).slice(0, 15).map(([keyword, count]) => ({ keyword, frequency: count, density: totalWordCount > 0 ? parseFloat(((count / totalWordCount) * 100).toFixed(2)) : 0, search_volume: null, keyword_difficulty: null, competition: null }));
        const keywordPresenceAnalysis = analyzeKeywordPresence(topKeywords, metadataLengthAudit.title.text, metadataLengthAudit.meta_description.text, h1Tags, visibleText, siteUrl);
        const keywordSuggestions = getKeywordSuggestions(words, topKeywords, metadataLengthAudit.title.text, metadataLengthAudit.meta_description.text, STOP_WORDS);

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
            uniqueness_analysis: context.uniquenessAnalysis
        };

        const imageAnalysis = analyzeImages($, visibleText);

        const speedAuditResult = { external_css_count: $('link[rel="stylesheet"][href]').length, external_js_count: $('script[src]').length, has_inline_styles: $('style').length > 0 || $('[style]').length > 0, has_inline_scripts: $('script:not([src])').length > 0, large_images: [], issues: [] };
        $('img').each((i, el) => { const src = $(el).attr('src') || $(el).attr('data-src'); if (src && src.match(/\.(jpg|jpeg|png|gif)$/i)) { speedAuditResult.large_images.push(src); } });
        if (speedAuditResult.external_css_count > 5) { speedAuditResult.issues.push(`⚠️ High number of external CSS files (${speedAuditResult.external_css_count}). Consider consolidating.`); }
        if (speedAuditResult.external_js_count > 5) { speedAuditResult.issues.push(`⚠️ High number of external JS files (${speedAuditResult.external_js_count}). Consider consolidating or deferring.`); }
        if (context.pagespeedData?.mobile?.performance_score !== null && context.pagespeedData?.mobile?.performance_score < 50) { speedAuditResult.issues.push(`❌ Low mobile performance score (${context.pagespeedData?.mobile?.performance_score}). Optimize loading times.`); }
        
        const mobileResponsivenessAudit = { viewport_tag: $('meta[name="viewport"]').length > 0, viewport_content: safeGetAttribute($('meta[name="viewport"]'), 'content'), fixed_width_elements: [], issues: [] };
        if (!mobileResponsivenessAudit.viewport_tag) { mobileResponsivenessAudit.issues.push("❌ Missing viewport meta tag. This is critical for mobile responsiveness."); }
        else if (!mobileResponsivenessAudit.viewport_content.includes('width=device-width') || !mobileResponsivenessAudit.viewport_content.includes('initial-scale=1')) { mobileResponsivenessAudit.issues.push("❌ Viewport meta tag is present but not configured for responsive design."); }
        
        const socialMediaTags = analyzeOpenGraphTwitter($);
        
        const internalLinks = $('a[href]').map((i, el) => {
            try { return new URL($(el).attr('href'), siteUrl).href; } catch { return null; }
        }).get().filter(href => href && href.startsWith(siteUrl));
        const httpStatusAndRedirects = await analyzeHttpStatusAndRedirects(siteUrl, internalLinks);

        let crawlabilityAndIndexabilityAudit = {
            robots_txt: context.robotsTxt,
            meta_robots: analyzeMetaRobots($),
            http_status_and_redirects: httpStatusAndRedirects,
            issues: [
                ...context.robotsTxt.issues,
                ...analyzeMetaRobots($).issues,
                ...(context.fullSitemapAudit.summary.status !== 'good' ? [context.fullSitemapAudit.summary.message] : []),
                ...context.crawlAudit.issues,
                ...Object.values(httpStatusAndRedirects).flatMap(result => result.issues)
            ]
        };

        const httpsAudit = {
            https_enabled: siteUrl.startsWith('https://'),
            issues: []
        };
        if (!httpsAudit.https_enabled) {
            httpsAudit.issues.push("❌ Page is not served over HTTPS.");
        }

        const report = {
            reportId: uuidv4(),
            url: siteUrl,
            timestamp: new Date().toISOString(),
            https_audit: httpsAudit,
            a11y_audit: context.a11yAudit,
            metadata_audit: metadataAudit,
            heading_audit: headingAudit,
            content_analysis: contentAnalysis,
            image_analysis: imageAnalysis,
            speed_audit: speedAuditResult,
            pagespeed_audit: context.pagespeedData,
            mobile_responsiveness_audit: mobileResponsivenessAudit,
            social_media_tags: socialMediaTags,
            structured_data_audit: context.structuredDataAudit,
            local_seo_audit: auditLocalSeo($, visibleText),
            crawlability_and_indexability_audit: crawlabilityAndIndexabilityAudit,
            backlink_audit: context.backlinkAudit,
            link_audit: context.linkAudit,
            crawl_audit: context.crawlAudit,
            serp_analysis: context.serpAnalysis,
            full_sitemap_audit: context.fullSitemapAudit,
        };

        report.overall_score = calculateOverallScore(report);
        
        sendProgress(98, 'Generating AI Strategy...');
        report.ai_strategy = await generateAiStrategy(report);

        if (userId && appId) {
            await saveReportToHistory(userId, report, appId);
        }

        sendCompletion(report);
        console.timeEnd('SEO Report Generation Time');

    } catch (e) {
        logger.error(`Unexpected error during SEO analysis stream: ${e.message}`, { stack: e.stack });
        sendError(`Internal server error: ${e.message}`);
    }
});

router.get('/get-report/:reportId', async (req, res) => {
    logger.info(`Request to fetch report: ${req.params.reportId}`);
    const { reportId } = req.params;
    const { userId, appId } = req.query;

    if (!userId || !appId) {
        return res.status(400).json({ error: "User ID and App ID are required." });
    }

    try {
        const reportRef = db.collection('artifacts')
                                .doc(appId)
                                .collection('users')
                                .doc(userId)
                                .collection('reports')
                                .doc(reportId);

        const doc = await reportRef.get();

        if (!doc.exists) {
            logger.warn(`Report not found: ${reportId}`);
            return res.status(404).json({ error: 'Report not found.' });
        }
        
        logger.info(`Successfully fetched report: ${reportId}`);
        res.status(200).json({ id: doc.id, ...doc.data() });

    } catch (error) {
        logger.error(`Error fetching report ${reportId}:`, error);
        res.status(500).json({ error: 'Failed to fetch report data.' });
    }
});
export default router;