// routers/seo_report.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL, URLSearchParams } = require('url');
const xml2js = require('xml2js');
const logger = require('winston'); // Using a simple logger like Winston

// Set up logger
logger.configure({
    transports: [
        new logger.transports.Console({
            format: logger.format.simple()
        })
    ]
});

const router = express.Router();

// Helper functions
const countSyllables = (word) => {
    try {
        word = word.toLowerCase();
        let syllables = 0;
        const vowels = "aeiouy";
        let prevCharWasVowel = false;
        for (const char of word) {
            if (vowels.includes(char)) {
                if (!prevCharWasVowel) {
                    syllables++;
                }
                prevCharWasVowel = true;
            } else {
                prevCharWasVowel = false;
            }
        }
        if (word.endsWith("e") && syllables > 1) {
            syllables--;
        }
        return syllables || 1;
    } catch (e) {
        return 1;
    }
};

const interpretReadability = (score) => {
    if (score >= 90) return "Very Easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly Easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly Difficult";
    if (score >= 30) return "Difficult";
    return "Very Difficult";
};

const getVisibleText = (soup) => {
    try {
        // Cheerio's .remove() is the equivalent of BeautifulSoup's .decompose()
        soup('script, style, noscript, nav, header, footer, aside, form, button, input, select, textarea').remove();
        // Get text and normalize whitespace
        return soup.text().replace(/\s+/g, ' ').trim();
    } catch (e) {
        logger.warn(`Error extracting visible text: ${e}`);
        return "";
    }
};

const getStopWords = () => {
    return [
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is",
        "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there",
        "these", "they", "this", "to", "was", "will", "with", "he", "she", "it", "you", "we",
        "i", "me", "him", "her", "us", "my", "your", "his", "its", "our", "them", "can", "could",
        "would", "should", "may", "might", "must", "do", "does", "did", "have", "has", "had",
        "from", "about", "above", "after", "again", "all", "am", "any", "are", "aren't", "as",
        "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
        "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
        "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had",
        "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
        "her", "here", "here's", "hers", "herself", "him", "himself", "how", "how's", "i",
        "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its",
        "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not",
        "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
        "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
        "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
        "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
        "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up",
        "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
        "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
        "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
        "you're", "yours", "yourself", "yourselves"
    ];
};

const fetchUrlHead = async (url) => {
    try {
        const response = await axios.head(url, { timeout: 5000, maxRedirects: 10 });
        const contentLength = response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0;
        return { url, statusCode: response.status, contentLength, success: true };
    } catch (error) {
        return {
            url,
            statusCode: error.response ? error.response.status : null,
            error: error.message,
            success: false
        };
    }
};

const fetchUrlGet = async (url) => {
    try {
        const response = await axios.get(url, { timeout: 5000 });
        return { url, statusCode: response.status, content: response.data, success: true };
    } catch (error) {
        return {
            url,
            statusCode: error.response ? error.response.status : null,
            error: error.message,
            success: false
        };
    }
};

const safeGetText = (element) => {
    try {
        return element ? element.text().trim() : "";
    } catch (e) {
        return "";
    }
};

const safeGetAttribute = (element, attribute) => {
    try {
        return element ? element.attr(attribute) || "" : "";
    } catch (e) {
        return "";
    }
};

const analyzeMetadataLength = (title, metaDescription) => {
    const metadataAnalysis = {
        title: {
            text: title,
            char_count: 0,
            status: "Missing",
            recommendation: "A compelling title tag is crucial for SEO. Aim for 30-60 characters."
        },
        meta_description: {
            text: metaDescription,
            char_count: 0,
            status: "Missing",
            recommendation: "A concise meta description improves click-through rates. Aim for 50-160 characters."
        }
    };

    if (title) {
        const titleLen = title.length;
        metadataAnalysis.title.char_count = titleLen;
        if (titleLen < 30) {
            metadataAnalysis.title.status = "Too Short";
            metadataAnalysis.title.recommendation = `Title is too short (${titleLen} characters). Expand with relevant keywords. Aim for 30-60 characters.`;
        } else if (titleLen <= 60) {
            metadataAnalysis.title.status = "Optimal";
            metadataAnalysis.title.recommendation = "Title length is optimal.";
        } else {
            metadataAnalysis.title.status = "Too Long";
            metadataAnalysis.title.recommendation = `Title is too long (${titleLen} characters). Condense for better display in search results. Aim for under 60 characters.`;
        }
    }

    if (metaDescription) {
        const metaDescLen = metaDescription.length;
        metadataAnalysis.meta_description.char_count = metaDescLen;
        if (metaDescLen < 50) {
            metadataAnalysis.meta_description.status = "Too Short";
            metadataAnalysis.meta_description.recommendation = `Meta description is too short (${metaDescLen} characters). Provide more detail to entice clicks. Aim for 50-160 characters.`;
        } else if (metaDescLen <= 160) {
            metadataAnalysis.meta_description.status = "Optimal";
            metadataAnalysis.meta_description.recommendation = "Meta description length is optimal.";
        } else {
            metadataAnalysis.meta_description.status = "Too Long";
            metadataAnalysis.meta_description.recommendation = `Meta description is too long (${metaDescLen} characters). It may be truncated in search results. Aim for under 160 characters.`;
        }
    }

    return metadataAnalysis;
};

const getKeywordSuggestions = (allWords, topKeywords, titleTag, metaDescription) => {
    const suggestions = [];
    const contentText = allWords.join(' ');

    const isPresent = (keyword, text) => {
        const regex = new RegExp('\\b' + keyword.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
        return regex.test(text.toLowerCase());
    };

    const potentialFocusKeywords = [];
    for (const kwData of topKeywords) {
        const keyword = kwData.keyword;
        const density = kwData.density;
        const wordCount = keyword.split(' ').length;
        if (wordCount > 1 && density >= 1.0 && density <= 4.0) {
            potentialFocusKeywords.push(keyword);
        } else if (wordCount === 1 && density >= 1.5 && keyword.length > 3) {
            potentialFocusKeywords.push(keyword);
        }
    }

    if (!potentialFocusKeywords.length && topKeywords.length) {
        const highestFreqWord = topKeywords.find(kwData => kwData.keyword.split(' ').length === 1 && !getStopWords().includes(kwData.keyword.toLowerCase()));
        if (highestFreqWord) {
            suggestions.push(`Consider '${highestFreqWord.keyword}' as a potential focus keyword and ensure it's prominently featured in your content.`);
        }
    } else if (potentialFocusKeywords.length) {
        for (const pk of potentialFocusKeywords.slice(0, 2)) {
            if (!isPresent(pk, titleTag || "") || !isPresent(pk, metaDescription || "")) {
                suggestions.push(`Ensure the key phrase '${pk}' is naturally integrated into your page title and meta description.`);
            }
        }
    }

    const secondaryKeywords = [];
    if (topKeywords.length > 3) {
        for (const kwData of topKeywords.slice(3, 10)) {
            secondaryKeywords.push(kwData.keyword);
        }
    }

    if (secondaryKeywords.length) {
        suggestions.push(`Integrate secondary keywords like '${secondaryKeywords.slice(0, 3).join(', ')}' to enrich your content and capture long-tail searches.`);
    }

    if (titleTag) {
        const titleWords = titleTag.toLowerCase().match(/\b\w+\b/g) || [];
        const titleRelevantWords = titleWords.filter(w => !getStopWords().includes(w) && w.length > 2);
        for (const tWord of titleRelevantWords) {
            if (!isPresent(tWord, contentText)) {
                suggestions.push(`The word '${tWord}' from your title should be present and relevant within your content body.`);
            }
        }
    }

    if (allWords.length < 500) {
        suggestions.push("Expand on key topics. More comprehensive content often ranks better and provides more value to users.");
    }
    
    if (!suggestions.length) {
        suggestions.push("Your keyword usage appears natural and well-distributed. Keep up the good work!");
    }

    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions;
};

const auditLocalSeo = (soup, visibleText) => {
    const localSeoResult = {
        local_business_schema_found: false,
        organization_schema_found: false,
        schema_types_found: [],
        physical_address_found: false,
        phone_number_found: false,
        geo_coordinates_found: false,
        Maps_embed_found: false,
        status: "❌ Missing",
        issues: []
    };

    const ldJsonScripts = soup('script[type="application/ld+json"]');
    ldJsonScripts.each((i, el) => {
        const scriptContent = cheerio(el).html();
        if (scriptContent) {
            try {
                const json_data = JSON.parse(scriptContent);
                const schemasToCheck = Array.isArray(json_data) ? json_data : [json_data];

                for (const item of schemasToCheck) {
                    if (item && item['@type']) {
                        const schemaType = item['@type'];
                        const types = Array.isArray(schemaType) ? schemaType : [schemaType];
                        for (const s_t of types) {
                            localSeoResult.schema_types_found.push(s_t);
                            if (s_t.includes('LocalBusiness')) {
                                localSeoResult.local_business_schema_found = true;
                            }
                            if (s_t.includes('Organization') && !s_t.includes('LocalBusiness')) {
                                localSeoResult.organization_schema_found = true;
                            }
                        }
                        
                        if (localSeoResult.local_business_schema_found || localSeoResult.organization_schema_found) {
                            if (item.address && item.address.streetAddress) {
                                localSeoResult.physical_address_found = true;
                                if (!visibleText.match(/\d{5}(-\d{4})?|\w+\s+\w+\s+(St|Ave|Rd)/i)) {
                                    localSeoResult.issues.push("⚠️ LocalBusiness schema has address, but text on page is less clear.");
                                }
                            }
                            if (item.telephone) {
                                localSeoResult.phone_number_found = true;
                                if (!visibleText.match(/(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/)) {
                                    localSeoResult.issues.push("⚠️ LocalBusiness schema has phone, but text on page is less clear.");
                                }
                            }
                            if (item.geo) {
                                localSeoResult.geo_coordinates_found = true;
                            }
                        }
                    }
                }
            } catch (e) {
                logger.warn(`Invalid JSON-LD during Local SEO audit: ${e}`);
            }
        }
    });

    const addressPatterns = [
        /\d{1,5}\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl|Court|Ct|Circle|Cir)/i,
        /\d{5}(-\d{4})?/
    ];
    if (!localSeoResult.physical_address_found) {
        for (const pattern of addressPatterns) {
            if (visibleText.match(pattern)) {
                localSeoResult.physical_address_found = true;
                break;
            }
        }
    }

    const phonePattern = /(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
    if (!localSeoResult.phone_number_found && visibleText.match(phonePattern)) {
        localSeoResult.phone_number_found = true;
    }

    if (soup('iframe[src*="maps.google.com"], iframe[src*="google.com/maps"]').length ||
        soup('a[href*="maps.google.com"], a[href*="google.com/maps"]').length) {
        localSeoResult.Maps_embed_found = true;
    }

    if (localSeoResult.local_business_schema_found && localSeoResult.physical_address_found && localSeoResult.phone_number_found) {
        localSeoResult.status = "✅ Present";
    } else if (localSeoResult.physical_address_found || localSeoResult.phone_number_found || localSeoResult.local_business_schema_found || localSeoResult.organization_schema_found) {
        localSeoResult.status = "⚠️ Partial";
        if (!localSeoResult.local_business_schema_found && !localSeoResult.organization_schema_found) {
            localSeoResult.issues.push("⚠️ Consider adding LocalBusiness or Organization Schema.org markup.");
        }
        if (!localSeoResult.physical_address_found) {
            localSeoResult.issues.push("⚠️ Physical address not clearly found on the page text or in schema.");
        }
        if (!localSeoResult.phone_number_found) {
            localSeoResult.issues.push("⚠️ Phone number not clearly found on the page text or in schema.");
        }
    } else {
        localSeoResult.status = "❌ Missing";
        localSeoResult.issues.push("❌ No key local SEO elements (schema, address, phone) detected.");
    }
    
    if (localSeoResult.Maps_embed_found) {
        localSeoResult.issues.push("ℹ️ Google Maps embed/link found (Good for local visibility).");
    } else {
        localSeoResult.issues.push("⚠️ Consider embedding a Google Map for better local context.");
    }

    return localSeoResult;
};

router.post('/generate-report', async (req, res) => {
    let siteUrl = req.body.url;

    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
        siteUrl = 'https://' + siteUrl;
    }

    logger.info(`Processing SEO report for: ${siteUrl}`);

    try {
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
                return res.status(400).json({ detail: `URL does not return HTML content. Content-Type: ${response.headers['content-type']}` });
            }
        } catch (e) {
            logger.error(`Failed to fetch HTML: ${e.message}`);
            if (e.code === 'ECONNABORTED') {
                return res.status(408).json({ detail: "Request timeout while fetching the website" });
            }
            if (e.response) {
                return res.status(e.response.status).json({ detail: `HTTP ${e.response.status}: Failed to fetch the website` });
            }
            return res.status(400).json({ detail: `Failed to connect to the website: ${e.message}` });
        }

        const $ = cheerio.load(response.data);
        logger.info("HTML parsed successfully");

        let currentScore = 100;
        const deductions = [];
        const visibleText = getVisibleText($);

        // --- Basic SEO checks ---
        const titleTag = safeGetText($('title'));
        if (!titleTag) {
            deductions.push("❌ Missing <title> tag.");
            currentScore -= 10;
        }

        const metaDescription = safeGetAttribute($('meta[name="description"]'), 'content');
        if (!metaDescription) {
            deductions.push("❌ Missing meta description.");
            currentScore -= 10;
        }

        const metadataLengthAudit = analyzeMetadataLength(titleTag, metaDescription);
        if (metadataLengthAudit.title.status !== "Optimal") {
            deductions.push(`⚠️ Title: ${metadataLengthAudit.title.status}. Recommendation: ${metadataLengthAudit.title.recommendation}`);
            currentScore -= 5;
        }
        if (metadataLengthAudit.meta_description.status !== "Optimal") {
            deductions.push(`⚠️ Meta Description: ${metadataLengthAudit.meta_description.status}. Recommendation: ${metadataLengthAudit.meta_description.recommendation}`);
            currentScore -= 5;
        }

        // --- Heading Analysis ---
        const h1Tags = $('h1').map((i, el) => $(el).text().trim()).get();
        const h2Tags = $('h2').map((i, el) => $(el).text().trim()).get();
        const h3Tags = $('h3').map((i, el) => $(el).text().trim()).get();
        const h1Count = h1Tags.length;
        const h2Count = h2Tags.length;
        const h3Count = h3Tags.length;
        const headingIssues = [];

        if (h1Count === 0) {
            headingIssues.push("❌ Missing <h1> tag.");
            currentScore -= 10;
        } else if (h1Count > 1) {
            headingIssues.push("⚠️ Multiple <h1> tags found. Ideally, there should be only one.");
            currentScore -= 5;
        }

        const headingOrder = $('h1, h2, h3, h4, h5, h6').map((i, el) => ({ tag: el.tagName.toLowerCase(), text: $(el).text().trim() })).get();
        let foundH1InOrder = false;
        for (const heading of headingOrder) {
            if (heading.tag === 'h1') {
                foundH1InOrder = true;
            } else if (heading.tag === 'h2' && !foundH1InOrder) {
                headingIssues.push("❌ Found <h2> before <h1>.");
                currentScore -= 5;
                break;
            } else if (heading.tag === 'h3' && !foundH1InOrder && !headingOrder.slice(0, headingOrder.indexOf(heading)).some(h => h.tag === 'h2')) {
                headingIssues.push("❌ Found <h3> before <h1> or 2.");
                currentScore -= 5;
                break;
            }
        }
        deductions.push(...headingIssues);

        // --- Technical & Site Health ---
        const canonicalLink = safeGetAttribute($('link[rel="canonical"]'), 'href');
        if (!canonicalLink) {
            deductions.push("⚠️ Missing canonical link.");
            currentScore -= 5;
        }

        const isHttps = siteUrl.startsWith("https://");
        if (!isHttps) {
            deductions.push("❌ Site does not use HTTPS.");
            currentScore -= 10;
        }

        let hasRobots = false;
        try {
            const robotsUrl = new URL('/robots.txt', siteUrl).href;
            const robotsResponse = await axios.head(robotsUrl, { timeout: 5000 });
            hasRobots = robotsResponse.status === 200;
        } catch (e) {
            logger.warn(`Error checking robots.txt: ${e.message}`);
        }
        if (!hasRobots) {
            deductions.push("⚠️ Missing robots.txt file.");
            currentScore -= 5;
        }

        const hasFavicon = !!$('link[rel*="icon"]').attr('href');
        if (!hasFavicon) {
            deductions.push("⚠️ Missing favicon.");
            currentScore -= 5;
        }
        
        // --- Image Analysis ---
        const allImgTags = $('img');
        const imagesForProcessing = allImgTags.filter((i, el) => $(el).attr('src')).get();
        const totalImages = imagesForProcessing.length;
        const imagesWithAlt = allImgTags.filter((i, el) => $(el).attr('alt')).get();
        const altImageRatio = totalImages > 0 ? `${imagesWithAlt.length} / ${totalImages}` : "No images found";
        
        if (totalImages > 0 && imagesWithAlt.length < totalImages) {
            deductions.push(`⚠️ ${totalImages - imagesWithAlt.length} out of ${totalImages} images are missing alt attributes.`);
            currentScore -= 5;
        }
        if (totalImages === 0) {
            deductions.push("ℹ️ No images found on the page.");
        }

        // --- Content Analysis ---
        const words = visibleText.toLowerCase().match(/\b\w+\b/g) || [];
        const totalWordCount = words.length;

        if (totalWordCount < 200) {
            deductions.push(`⚠️ Low word count (${totalWordCount} words). Aim for more comprehensive content.`);
            currentScore -= 5;
        }

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
        
        const keywordSuggestions = getKeywordSuggestions(words, topKeywords, titleTag, metaDescription);
        if (!topKeywords.length) {
            deductions.push("⚠️ No significant keywords found in content.");
            currentScore -= 5;
        }
        if (!keywordSuggestions.includes("Your keyword usage appears natural and well-distributed. Keep up the good work!")) {
            for (const suggestion of keywordSuggestions) {
                if (suggestion.startsWith("Ensure the key phrase") || suggestion.startsWith("Consider") || suggestion.startsWith("Integrate secondary keywords")) {
                    deductions.push(`⚠️ ${suggestion}`);
                    currentScore -= 2;
                } else if (suggestion.startsWith("The word") || suggestion.startsWith("Expand on key topics")) {
                    deductions.push(`⚠️ ${suggestion}`);
                    currentScore -= 3;
                }
            }
        }
        
        // --- Readability Analysis ---
        let readabilityScore = 0.0;
        let readabilityLabel = "Unknown";
        try {
            const sentences = visibleText.split(/[.!?]+/g).filter(s => s.trim());
            const sentenceCount = sentences.length;
            const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
            
            if (sentenceCount > 0 && totalWordCount > 0) {
                readabilityScore = 206.835 - 1.015 * (totalWordCount / sentenceCount) - 84.6 * (syllableCount / totalWordCount);
                readabilityScore = parseFloat(readabilityScore.toFixed(2));
                readabilityLabel = interpretReadability(readabilityScore);
            }
            if (readabilityScore < 50) {
                deductions.push(`⚠️ Readability score is low (${readabilityScore}). Content might be too complex.`);
                currentScore -= 5;
            }
        } catch(e) {
            logger.warn(`Error calculating readability: ${e.message}`);
        }

        // --- Speed Audit ---
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
        
        const KB_THRESHOLD = 500 * 1024;
        const MB_THRESHOLD = 2 * 1024 * 1024;
        
        const imageTasks = imagesForProcessing.slice(0, 20).map(img => {
            const imgUrl = new URL($(img).attr('src'), siteUrl).href;
            return fetchUrlHead(imgUrl);
        });

        const imageResults = await Promise.allSettled(imageTasks);
        for (const result of imageResults) {
            if (result.status === 'fulfilled' && result.value.success && result.value.contentLength > 0) {
                if (result.value.contentLength >= MB_THRESHOLD) {
                    const sizeStr = `${(result.value.contentLength / (1024 * 1024)).toFixed(2)}MB`;
                    speedAuditResult.large_images.push({ src: result.value.url, size: sizeStr });
                    speedAuditResult.issues.push(`❌ Image >2MB: ${result.value.url.split('/').pop()} (${sizeStr})`);
                } else if (result.value.contentLength >= KB_THRESHOLD) {
                    const sizeStr = `${(result.value.contentLength / 1024).toFixed(2)}KB`;
                    speedAuditResult.large_images.push({ src: result.value.url, size: sizeStr });
                    speedAuditResult.issues.push(`⚠️ Image >500KB: ${result.value.url.split('/').pop()} (${sizeStr})`);
                }
            } else {
                logger.warn(`Failed to check image (during speed audit): ${result.reason}`);
            }
        }
        
        if (hasInlineStyles) {
            deductions.push("❌ Found inline styles. Consider external CSS for better caching.");
            currentScore -= 5;
        }
        if (hasInlineScripts) {
            deductions.push("❌ Found inline scripts. Consider external JavaScript for better caching.");
            currentScore -= 5;
        }
        if (externalCssCount > 5) {
            deductions.push(`⚠️ High number of external CSS files (${externalCssCount}).`);
            currentScore -= 3;
        }
        if (externalJsCount > 10) {
            deductions.push(`⚠️ High number of external JavaScript files (${externalJsCount}).`);
            currentScore -= 3;
        }
        if (speedAuditResult.large_images.length) {
            deductions.push(`❌ Found ${speedAuditResult.large_images.length} large images. Optimize for faster loading.`);
            currentScore -= Math.min(speedAuditResult.large_images.length * 2, 20);
        }

        // --- Sitemap Check ---
        const sitemapResult = { found: false, url_count: 0, status: "❌ Sitemap not found or invalid" };
        try {
            const sitemapUrl = new URL('/sitemap.xml', siteUrl).href;
            const sitemapResponse = await fetchUrlGet(sitemapUrl);
            if (sitemapResponse.success) {
                const parser = new xml2js.Parser();
                const parsedXml = await parser.parseStringPromise(sitemapResponse.content);
                const urlset = parsedXml.urlset && parsedXml.urlset.url;
                if (urlset) {
                    sitemapResult.found = true;
                    sitemapResult.url_count = urlset.length;
                    sitemapResult.status = `✅ Sitemap Found with ${urlset.length} URLs`;
                    if (urlset.length === 0) {
                        sitemapResult.status = "❌ Sitemap found but contains no URLs";
                        deductions.push("❌ Sitemap is empty.");
                        currentScore -= 5;
                    }
                    if (urlset.length > 50000) {
                        deductions.push("⚠️ Sitemap contains over 50,000 URLs.");
                        currentScore -= 5;
                    }
                } else {
                    sitemapResult.status = "❌ Sitemap found but is invalid XML";
                    deductions.push("❌ Sitemap found but is invalid XML.");
                    currentScore -= 10;
                }
            } else {
                deductions.push("❌ Sitemap not found.");
                currentScore -= 10;
            }
        } catch (e) {
            logger.warn(`Error checking sitemap: ${e.message}`);
            sitemapResult.status = "⚠️ Error occurred while checking sitemap";
            deductions.push("⚠️ Error occurred while checking sitemap.");
            currentScore -= 5;
        }

        // --- Link Audit ---
        const linkAuditResult = {
            internal_links_count: 0,
            external_links_count: 0,
            broken_links_count: 0,
            broken_links: [],
            status: "✅ No broken links found."
        };
        try {
            const baseDomain = new URL(siteUrl).hostname;
            const linkCheckTasks = [];
            const uniqueLinkUrlsToCheck = new Set();
            
            $('a[href]').slice(0, 50).each((i, el) => {
                const href = $(el).attr('href');
                if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
                    return;
                }
                const absoluteUrl = new URL(href, siteUrl).href;
                const parsedAbsoluteUrl = new URL(absoluteUrl);
                const cleanUrl = parsedAbsoluteUrl.hash ? parsedAbsoluteUrl.href.replace(parsedAbsoluteUrl.hash, '') : parsedAbsoluteUrl.href;

                if (!cleanUrl || uniqueLinkUrlsToCheck.has(cleanUrl)) {
                    return;
                }
                
                uniqueLinkUrlsToCheck.add(cleanUrl);
                
                const linkDomain = new URL(cleanUrl).hostname;
                if (linkDomain === baseDomain) {
                    linkAuditResult.internal_links_count++;
                } else {
                    linkAuditResult.external_links_count++;
                }
                
                linkCheckTasks.push(fetchUrlHead(cleanUrl));
            });

            const linkResults = await Promise.allSettled(linkCheckTasks);
            for (const result of linkResults) {
                if (result.status === 'fulfilled' && !result.value.success && result.value.statusCode >= 400) {
                    const reason = result.value.error || `Status ${result.value.statusCode}`;
                    linkAuditResult.broken_links.push({ url: result.value.url, reason });
                }
            }
            linkAuditResult.broken_links_count = linkAuditResult.broken_links.length;
            if (linkAuditResult.broken_links_count > 0) {
                linkAuditResult.status = "❌ Broken links detected!";
                deductions.push(`❌ Found ${linkAuditResult.broken_links_count} broken links.`);
                currentScore -= Math.min(linkAuditResult.broken_links_count * 2, 20);
            }
        } catch (e) {
            logger.warn(`Error during link audit: ${e.message}`);
            linkAuditResult.status = "⚠️ Error occurred during link analysis";
            deductions.push("⚠️ Error occurred during link analysis.");
            currentScore -= 5;
        }

        // --- Social Media Tags Audit (Open Graph & Twitter Cards) ---
        const ogTwitterAuditResult = {
            og_title_found: !!$('meta[property="og:title"]').attr('content'),
            og_title_content: safeGetAttribute($('meta[property="og:title"]'), 'content'),
            og_image_found: !!$('meta[property="og:image"]').attr('content'),
            og_image_url: safeGetAttribute($('meta[property="og:image"]'), 'content'),
            twitter_title_found: !!$('meta[name="twitter:title"]').attr('content'),
            twitter_title_content: safeGetAttribute($('meta[name="twitter:title"]'), 'content'),
            twitter_image_found: !!$('meta[name="twitter:image"]').attr('content'),
            twitter_image_url: safeGetAttribute($('meta[name="twitter:image"]'), 'content'),
            issues: []
        };
        
        if (!ogTwitterAuditResult.og_title_found) {
            ogTwitterAuditResult.issues.push("❌ Missing Open Graph Title (og:title)");
            deductions.push("❌ Missing Open Graph Title.");
            currentScore -= 3;
        }
        if (!ogTwitterAuditResult.og_image_found) {
            ogTwitterAuditResult.issues.push("❌ Missing Open Graph Image (og:image)");
            deductions.push("❌ Missing Open Graph Image.");
            currentScore -= 5;
        } else if (!ogTwitterAuditResult.og_image_url) {
            ogTwitterAuditResult.issues.push("⚠️ og:image tag found but URL is empty.");
            deductions.push("⚠️ Empty og:image URL.");
            currentScore -= 2;
        }
        if (!ogTwitterAuditResult.twitter_title_found) {
            ogTwitterAuditResult.issues.push("⚠️ Missing Twitter Title (twitter:title)");
            deductions.push("⚠️ Missing Twitter Title.");
            currentScore -= 2;
        }
        if (!ogTwitterAuditResult.twitter_image_found) {
            ogTwitterAuditResult.issues.push("⚠️ Missing Twitter Image (twitter:image)");
            deductions.push("⚠️ Missing Twitter Image.");
            currentScore -= 3;
        } else if (!ogTwitterAuditResult.twitter_image_url) {
            ogTwitterAuditResult.issues.push("⚠️ twitter:image tag found but URL is empty.");
            deductions.push("⚠️ Empty twitter:image URL.");
            currentScore -= 1;
        }

        // --- Mobile Responsiveness Audit ---
        const mobileResponsivenessAuditResult = {
            has_viewport_meta: false,
            viewport_content: null,
            fixed_width_elements: [],
            issues: []
        };
        const viewportMeta = $('meta[name="viewport"]');
        if (viewportMeta.length) {
            mobileResponsivenessAuditResult.has_viewport_meta = true;
            mobileResponsivenessAuditResult.viewport_content = safeGetAttribute(viewportMeta, 'content');
            if (!mobileResponsivenessAuditResult.viewport_content.includes('width=device-width')) {
                mobileResponsivenessAuditResult.issues.push("❌ Viewport meta tag missing 'width=device-width'. Ensure proper configuration.");
                deductions.push("❌ Viewport meta tag is not correctly configured for responsiveness.");
                currentScore -= 10;
            }
        } else {
            mobileResponsivenessAuditResult.issues.push("❌ Missing viewport meta tag. Essential for mobile responsiveness.");
            deductions.push("❌ Missing viewport meta tag.");
            currentScore -= 10;
        }

        const fixedWidthElements = [];
        const FIXED_WIDTH_REGEX = /width:\s*(\d+(\.\d+)?(px|pt))\b/i;
        $('[width]').each((i, el) => {
            const widthAttr = $(el).attr('width');
            if (/^\d+$/.test(widthAttr) || /\d+(\.\d+)?(px|pt)$/i.test(widthAttr)) {
                fixedWidthElements.push({ tag: el.tagName.toLowerCase(), source: `attribute: width='${widthAttr}'`, value: widthAttr });
                mobileResponsivenessAuditResult.issues.push(`⚠️ Fixed width attribute on <${el.tagName.toLowerCase()}>: width='${widthAttr}'. Use responsive units (%, em, rem, vw) instead.`);
                deductions.push(`⚠️ Fixed width on <${el.tagName.toLowerCase()}>.`);
                currentScore -= 2;
            }
        });
        $('[style]').each((i, el) => {
            const styleAttr = $(el).attr('style');
            const match = styleAttr.match(FIXED_WIDTH_REGEX);
            if (match) {
                fixedWidthElements.push({ tag: el.tagName.toLowerCase(), source: `inline style: '${match[0]}'`, value: match[1] });
                mobileResponsivenessAuditResult.issues.push(`⚠️ Fixed width in inline style on <${el.tagName.toLowerCase()}>: ${match[0]}. Use responsive units (%, em, rem, vw) instead.`);
                deductions.push(`⚠️ Fixed width in inline style on <${el.tagName.toLowerCase()}>.`);
                currentScore -= 2;
            }
        });
        mobileResponsivenessAuditResult.fixed_width_elements = fixedWidthElements;

        // --- Structured Data Audit ---
        const structuredDataAuditResult = { ld_json_found: false, schema_types: [], issues: [] };
        const ldJsonScripts = $('script[type="application/ld+json"]');
        if (ldJsonScripts.length) {
            structuredDataAuditResult.ld_json_found = true;
            ldJsonScripts.each((i, el) => {
                const scriptContent = $(el).html();
                try {
                    const jsonData = JSON.parse(scriptContent);
                    const items = Array.isArray(jsonData) ? jsonData : [jsonData];
                    for (const item of items) {
                        if (item && item['@type']) {
                            const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
                            structuredDataAuditResult.schema_types.push(...types);
                        }
                    }
                } catch (e) {
                    structuredDataAuditResult.issues.push(`❌ Invalid JSON-LD found: ${e.message}`);
                    deductions.push("❌ Invalid JSON-LD found on page.");
                    currentScore -= 5;
                }
            });
        }
        if (!structuredDataAuditResult.ld_json_found) {
            structuredDataAuditResult.issues.push("⚠️ No JSON-LD structured data found. Consider adding it for rich snippets.");
            deductions.push("⚠️ No structured data (JSON-LD) found.");
            currentScore -= 5;
        } else if (!structuredDataAuditResult.schema_types.length) {
            structuredDataAuditResult.issues.push("⚠️ JSON-LD found, but no @type property detected.");
            deductions.push("⚠️ JSON-LD found, but no schema types detected.");
            currentScore -= 3;
        }

        // --- Local SEO Audit ---
        const localSeoAuditResult = auditLocalSeo($, visibleText);
        if (localSeoAuditResult.status === "❌ Missing") {
            deductions.push("❌ Local SEO essentials missing. Implement schema, address, and phone.");
            currentScore -= 15;
        } else if (localSeoAuditResult.status === "⚠️ Partial") {
            deductions.push("⚠️ Local SEO partially implemented. Review details for improvements.");
            currentScore -= 7;
        }
        deductions.push(...localSeoAuditResult.issues.filter(issue => issue.startsWith('❌') || issue.startsWith('⚠️')));

        // Ensure score doesn't go below 0
        currentScore = Math.max(currentScore, 0);

        logger.info("SEO report generation completed successfully");

        res.json({
            title_tag: titleTag || "Missing",
            meta_description: metaDescription || "Missing",
            metadata_length_audit: metadataLengthAudit,
            h1_tags: h1Tags,
            h1_count: h1Count,
            h2_count: h2Count,
            h3_count: h3Count,
            heading_order: headingOrder,
            heading_issues: headingIssues,
            canonical: canonicalLink || "Missing",
            uses_https: isHttps,
            has_robots_txt: hasRobots,
            has_favicon: hasFavicon,
            alt_image_ratio: altImageRatio,
            score: currentScore,
            deductions,
            readability_label: readabilityLabel,
            content_analysis: {
                total_word_count: totalWordCount,
                top_keywords: topKeywords,
                flesch_reading_ease_score: readabilityScore,
                keyword_suggestions: keywordSuggestions
            },
            speed_audit: speedAuditResult,
            sitemap: sitemapResult,
            link_audit: linkAuditResult,
            og_twitter_audit: ogTwitterAuditResult,
            mobile_responsiveness_audit: mobileResponsivenessAuditResult,
            structured_data_audit: structuredDataAuditResult,
            local_seo_audit: localSeoAuditResult
        });

    } catch (e) {
        logger.error(`Unexpected error in generate-report: ${e.message}`);
        res.status(500).json({ detail: `Unexpected server error: ${e.message}` });
    }
});

module.exports = router;