// routers/seo_report.js
import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import { URL, URLSearchParams } from 'url';
import xml2js from 'xml2js';
import winston from 'winston';

const logger = winston;

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

// New helper function to follow and log redirections
const followRedirects = async (url, maxRedirects = 10, redirectChain = []) => {
    redirectChain.push(url);
    if (redirectChain.length > maxRedirects) {
        return { finalUrl: url, statusCode: null, redirectChain, error: 'Max redirects exceeded' };
    }

    try {
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400,
            timeout: 5000
        });
        return { finalUrl: response.request.res.responseUrl, statusCode: response.status, redirectChain: [...redirectChain, response.request.res.responseUrl] };
    } catch (error) {
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const newUrl = error.response.headers.location;
            if (newUrl) {
                return followRedirects(new URL(newUrl, url).href, maxRedirects, redirectChain);
            }
        }
        return { finalUrl: url, statusCode: error.response ? error.response.status : null, redirectChain, error: error.message };
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

// Enhanced keyword analysis function
const analyzeKeywordPresence = (keywords, titleTag, metaDescription, h1Tags, contentText, url) => {
    const keywordAnalysis = [];
    
    const isPresent = (keyword, text) => {
        if (!text) return false;
        const regex = new RegExp('\\b' + keyword.toLowerCase().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
        return regex.test(text.toLowerCase());
    };

    const calculateDensity = (keyword, text) => {
        if (!text) return 0;
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        let matches = 0;
        
        if (keywordWords.length === 1) {
            matches = words.filter(word => word === keywordWords[0]).length;
        } else {
            // For multi-word keywords
            const keywordPhrase = keywordWords.join(' ');
            const textLower = text.toLowerCase();
            const regex = new RegExp('\\b' + keywordPhrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g');
            matches = (textLower.match(regex) || []).length;
        }
        
        return words.length > 0 ? parseFloat(((matches / words.length) * 100).toFixed(2)) : 0;
    };

    // Analyze top keywords for presence and density
    for (const keywordData of keywords.slice(0, 10)) { // Top 10 keywords
        const keyword = keywordData.keyword;
        const analysis = {
            keyword: keyword,
            frequency: keywordData.frequency,
            density: keywordData.density,
            presence: {
                title: isPresent(keyword, titleTag),
                meta_description: isPresent(keyword, metaDescription),
                h1: h1Tags.some(h1 => isPresent(keyword, h1)),
                content: isPresent(keyword, contentText),
                url: isPresent(keyword, url)
            },
            recommendations: []
        };

        // Generate recommendations based on presence
        if (!analysis.presence.title && analysis.density >= 1.0) {
            analysis.recommendations.push("Consider including this keyword in your title tag");
        }
        if (!analysis.presence.meta_description && analysis.density >= 1.0) {
            analysis.recommendations.push("Consider including this keyword in your meta description");
        }
        if (!analysis.presence.h1 && analysis.density >= 1.5) {
            analysis.recommendations.push("Consider including this keyword in your H1 tag");
        }
        if (!analysis.presence.url && analysis.density >= 2.0) {
            analysis.recommendations.push("Consider including this keyword in your URL slug");
        }

        // Density recommendations
        if (analysis.density > 4.0) {
            analysis.recommendations.push("Keyword density is too high - reduce usage to avoid keyword stuffing");
        } else if (analysis.density < 0.5 && analysis.frequency > 1) {
            analysis.recommendations.push("Keyword density is very low - consider using this keyword more naturally");
        }

        keywordAnalysis.push(analysis);
    }

    return keywordAnalysis;
};

// Enhanced image analysis function
const analyzeImages = (soup) => {
    const imageAnalysis = {
        total_images: 0,
        images_with_alt: 0,
        images_without_alt: 0,
        empty_alt_tags: 0,
        missing_alt_tags: 0,
        alt_ratio: "0%",
        detailed_issues: []
    };

    const allImages = soup('img');
    imageAnalysis.total_images = allImages.length;

    if (imageAnalysis.total_images === 0) {
        imageAnalysis.detailed_issues.push("No images found on the page");
        return imageAnalysis;
    }

    allImages.each((i, el) => {
        const img = soup(el);
        const altText = img.attr('alt');
        const src = img.attr('src') || 'unknown';
        const filename = src.split('/').pop() || src;

        if (altText === undefined) {
            imageAnalysis.missing_alt_tags++;
            imageAnalysis.detailed_issues.push(`Missing alt attribute: ${filename}`);
        } else if (altText.trim() === '') {
            imageAnalysis.empty_alt_tags++;
            imageAnalysis.detailed_issues.push(`Empty alt attribute: ${filename}`);
        } else {
            imageAnalysis.images_with_alt++;
        }
    });

    imageAnalysis.images_without_alt = imageAnalysis.missing_alt_tags + imageAnalysis.empty_alt_tags;
    imageAnalysis.alt_ratio = imageAnalysis.total_images > 0
        ? `${Math.round((imageAnalysis.images_with_alt / imageAnalysis.total_images) * 100)}%`
        : "0%";

    return imageAnalysis;
};

// Enhanced Open Graph and Twitter Cards analysis
const analyzeOpenGraphTwitter = (soup) => {
    const ogTwitterAnalysis = {
        open_graph: {
            title: { present: false, content: "", length: 0, status: "Missing" },
            description: { present: false, content: "", length: 0, status: "Missing" },
            image: { present: false, content: "", status: "Missing" },
            url: { present: false, content: "", status: "Missing" },
            type: { present: false, content: "", status: "Missing" },
            site_name: { present: false, content: "", status: "Missing" }
        },
        twitter_cards: {
            card: { present: false, content: "", status: "Missing" },
            title: { present: false, content: "", length: 0, status: "Missing" },
            description: { present: false, content: "", length: 0, status: "Missing" },
            image: { present: false, content: "", status: "Missing" },
            creator: { present: false, content: "", status: "Missing" },
            site: { present: false, content: "", status: "Missing" }
        },
        issues: [],
        recommendations: []
    };

    // Analyze Open Graph tags
    const ogTitle = safeGetAttribute(soup('meta[property="og:title"]'), 'content');
    if (ogTitle) {
        ogTwitterAnalysis.open_graph.title = {
            present: true,
            content: ogTitle,
            length: ogTitle.length,
            status: ogTitle.length >= 30 && ogTitle.length <= 60 ? "Optimal" :
                    ogTitle.length < 30 ? "Too Short" : "Too Long"
        };
    }

    const ogDescription = safeGetAttribute(soup('meta[property="og:description"]'), 'content');
    if (ogDescription) {
        ogTwitterAnalysis.open_graph.description = {
            present: true,
            content: ogDescription,
            length: ogDescription.length,
            status: ogDescription.length >= 50 && ogDescription.length <= 160 ? "Optimal" :
                    ogDescription.length < 50 ? "Too Short" : "Too Long"
        };
    }

    const ogImage = safeGetAttribute(soup('meta[property="og:image"]'), 'content');
    if (ogImage) {
        ogTwitterAnalysis.open_graph.image = {
            present: true,
            content: ogImage,
            status: ogImage.trim() !== "" ? "Present" : "Empty"
        };
    }

    const ogUrl = safeGetAttribute(soup('meta[property="og:url"]'), 'content');
    if (ogUrl) {
        ogTwitterAnalysis.open_graph.url = {
            present: true,
            content: ogUrl,
            status: "Present"
        };
    }

    const ogType = safeGetAttribute(soup('meta[property="og:type"]'), 'content');
    if (ogType) {
        ogTwitterAnalysis.open_graph.type = {
            present: true,
            content: ogType,
            status: "Present"
        };
    }

    const ogSiteName = safeGetAttribute(soup('meta[property="og:site_name"]'), 'content');
    if (ogSiteName) {
        ogTwitterAnalysis.open_graph.site_name = {
            present: true,
            content: ogSiteName,
            status: "Present"
        };
    }

    // Analyze Twitter Cards
    const twitterCard = safeGetAttribute(soup('meta[name="twitter:card"]'), 'content');
    if (twitterCard) {
        ogTwitterAnalysis.twitter_cards.card = {
            present: true,
            content: twitterCard,
            status: ["summary", "summary_large_image", "app", "player"].includes(twitterCard) ? "Valid" : "Invalid"
        };
    }

    const twitterTitle = safeGetAttribute(soup('meta[name="twitter:title"]'), 'content');
    if (twitterTitle) {
        ogTwitterAnalysis.twitter_cards.title = {
            present: true,
            content: twitterTitle,
            length: twitterTitle.length,
            status: twitterTitle.length >= 30 && twitterTitle.length <= 70 ? "Optimal" :
                    twitterTitle.length < 30 ? "Too Short" : "Too Long"
        };
    }

    const twitterDescription = safeGetAttribute(soup('meta[name="twitter:description"]'), 'content');
    if (twitterDescription) {
        ogTwitterAnalysis.twitter_cards.description = {
            present: true,
            content: twitterDescription,
            length: twitterDescription.length,
            status: twitterDescription.length >= 50 && twitterDescription.length <= 200 ? "Optimal" :
                    twitterDescription.length < 50 ? "Too Short" : "Too Long"
        };
    }

    const twitterImage = safeGetAttribute(soup('meta[name="twitter:image"]'), 'content');
    if (twitterImage) {
        ogTwitterAnalysis.twitter_cards.image = {
            present: true,
            content: twitterImage,
            status: twitterImage.trim() !== "" ? "Present" : "Empty"
        };
    }

    const twitterCreator = safeGetAttribute(soup('meta[name="twitter:creator"]'), 'content');
    if (twitterCreator) {
        ogTwitterAnalysis.twitter_cards.creator = {
            present: true,
            content: twitterCreator,
            status: "Present"
        };
    }

    const twitterSite = safeGetAttribute(soup('meta[name="twitter:site"]'), 'content');
    if (twitterSite) {
        ogTwitterAnalysis.twitter_cards.site = {
            present: true,
            content: twitterSite,
            status: "Present"
        };
    }

    // Generate issues and recommendations
    if (!ogTwitterAnalysis.open_graph.title.present) {
        ogTwitterAnalysis.issues.push("Missing Open Graph title (og:title)");
        ogTwitterAnalysis.recommendations.push("Add og:title meta tag for better social media sharing");
    }

    if (!ogTwitterAnalysis.open_graph.description.present) {
        ogTwitterAnalysis.issues.push("Missing Open Graph description (og:description)");
        ogTwitterAnalysis.recommendations.push("Add og:description meta tag to control social media preview text");
    }

    if (!ogTwitterAnalysis.open_graph.image.present) {
        ogTwitterAnalysis.issues.push("Missing Open Graph image (og:image)");
        ogTwitterAnalysis.recommendations.push("Add og:image meta tag with a high-quality image (1200x630px recommended)");
    }

    if (!ogTwitterAnalysis.twitter_cards.card.present) {
        ogTwitterAnalysis.issues.push("Missing Twitter Card type (twitter:card)");
        ogTwitterAnalysis.recommendations.push("Add twitter:card meta tag (recommend 'summary_large_image')");
    }

    if (!ogTwitterAnalysis.twitter_cards.image.present && ogTwitterAnalysis.open_graph.image.present) {
        ogTwitterAnalysis.recommendations.push("Consider adding twitter:image or it will fallback to og:image");
    }

    return ogTwitterAnalysis;
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
        const scriptContent = $(el).html();
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

    if (soup('iframe[src*="googleusercontent.com/maps.google.com/0"], iframe[src*="googleusercontent.com/maps.google.com/1"]').length ||
        soup('a[href*="googleusercontent.com/maps.google.com/0"], a[href*="googleusercontent.com/maps.google.com/1"]').length) {
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

// --- NEW CRAWLABILITY & INDEXABILITY FUNCTIONS ---

/**
 * Checks for the presence and rules of the robots.txt file.
 * @param {string} baseUrl The base URL of the site.
 * @returns {Promise<object>} An object containing the robots.txt analysis.
 */
const analyzeRobotsTxt = async (baseUrl) => {
    const robotsTxtUrl = new URL('/robots.txt', baseUrl).href;
    const robotsResult = {
        present: false,
        rules: {},
        sitemap_path: null,
        issues: []
    };

    try {
        const response = await fetchUrlGet(robotsTxtUrl);
        if (response.success && response.statusCode === 200) {
            robotsResult.present = true;
            const content = response.content;
            const lines = content.split('\n');
            let currentUserAgent = null;

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    continue; // Skip comments and empty lines
                }

                const [key, value] = trimmedLine.split(':').map(s => s.trim());
                if (!key || !value) continue;

                if (key.toLowerCase() === 'user-agent') {
                    currentUserAgent = value;
                    if (!robotsResult.rules[currentUserAgent]) {
                        robotsResult.rules[currentUserAgent] = { allow: [], disallow: [] };
                    }
                } else if (currentUserAgent) {
                    if (key.toLowerCase() === 'disallow') {
                        robotsResult.rules[currentUserAgent].disallow.push(value);
                    } else if (key.toLowerCase() === 'allow') {
                        robotsResult.rules[currentUserAgent].allow.push(value);
                    }
                } else if (key.toLowerCase() === 'sitemap') {
                    robotsResult.sitemap_path = value;
                }
            }

            // Check for general user-agent rules
            if (!robotsResult.rules['*'] && Object.keys(robotsResult.rules).length > 0) {
                robotsResult.issues.push('⚠️ No general User-agent (*) rule found. This might lead to unexpected crawling behavior for unspecified bots.');
            } else if (robotsResult.rules['*']) {
                const wildCardRules = robotsResult.rules['*'];
                if (wildCardRules.disallow.includes('/')) {
                    robotsResult.issues.push('❌ Crawling is disallowed for all bots by `Disallow: /` rule in robots.txt.');
                }
            }

        } else {
            robotsResult.issues.push('❌ robots.txt file not found or inaccessible.');
        }
    } catch (e) {
        logger.warn(`Error analyzing robots.txt: ${e.message}`);
        robotsResult.issues.push('⚠️ An error occurred while fetching or parsing robots.txt.');
    }
    return robotsResult;
};

/**
 * Checks the meta robots tag for noindex and nofollow directives.
 * @param {object} soup The cheerio object of the page.
 * @returns {object} An object with the meta robots analysis.
 */
const analyzeMetaRobots = (soup) => {
    const metaRobotsTag = soup('meta[name="robots"]');
    const result = {
        present: false,
        content: null,
        is_noindex: false,
        is_nofollow: false,
        issues: []
    };

    if (metaRobotsTag.length) {
        result.present = true;
        const content = safeGetAttribute(metaRobotsTag, 'content') || '';
        result.content = content;

        if (content.toLowerCase().includes('noindex')) {
            result.is_noindex = true;
            result.issues.push('❌ Meta robots tag contains `noindex` directive. This page will not be indexed by search engines.');
        }
        if (content.toLowerCase().includes('nofollow')) {
            result.is_nofollow = true;
            result.issues.push('⚠️ Meta robots tag contains `nofollow` directive. All links on this page will not pass link equity.');
        }
    } else {
        result.issues.push('✅ No meta robots tag found. The page is likely indexable and crawlable by default.');
    }

    return result;
};

/**
 * Enhances sitemap validation by checking if the URLs inside it return HTTP 200.
 * @param {string} sitemapUrl The absolute URL of the sitemap.
 * @returns {Promise<object>} The enhanced sitemap validation result.
 */
const validateSitemapUrls = async (sitemapUrl) => {
    const sitemapResult = {
        found: false,
        url_count: 0,
        valid_urls: 0,
        invalid_urls: [],
        status: "❌ Sitemap not found or invalid",
        issues: []
    };

    if (!sitemapUrl) {
        return sitemapResult;
    }

    try {
        const sitemapResponse = await fetchUrlGet(sitemapUrl);
        if (sitemapResponse.success && sitemapResponse.statusCode === 200) {
            const parser = new xml2js.Parser();
            const parsedXml = await parser.parseStringPromise(sitemapResponse.content);
            const urlset = parsedXml.urlset && parsedXml.urlset.url;

            sitemapResult.found = true;
            if (urlset) {
                sitemapResult.url_count = urlset.length;
                sitemapResult.status = `✅ Sitemap Found with ${urlset.length} URLs.`;
                if (urlset.length === 0) {
                    sitemapResult.status = "❌ Sitemap found but contains no URLs.";
                    sitemapResult.issues.push("❌ Sitemap is empty.");
                } else if (urlset.length > 50000) {
                    sitemapResult.issues.push("⚠️ Sitemap contains over 50,000 URLs, consider splitting it.");
                }

                // Check a sample of URLs for performance
                const urlsToCheck = urlset.slice(0, 10);
                const urlCheckTasks = urlsToCheck.map(urlObj => {
                    const url = urlObj.loc[0];
                    return fetchUrlHead(url);
                });

                const urlCheckResults = await Promise.allSettled(urlCheckTasks);
                for (const result of urlCheckResults) {
                    if (result.status === 'fulfilled' && result.value.success && result.value.statusCode === 200) {
                        sitemapResult.valid_urls++;
                    } else {
                        const reason = result.value.error || `Status ${result.value.statusCode}`;
                        sitemapResult.invalid_urls.push({ url: result.value.url, reason });
                        sitemapResult.issues.push(`❌ URL in sitemap returns an error: ${result.value.url} (${reason})`);
                    }
                }
                
                if (sitemapResult.invalid_urls.length > 0) {
                    sitemapResult.status = `⚠️ Sitemap contains ${sitemapResult.invalid_urls.length} invalid URLs.`;
                }

            } else {
                sitemapResult.status = "❌ Sitemap found but is invalid XML.";
                sitemapResult.issues.push("❌ Sitemap found but is invalid XML.");
            }
        } else {
            sitemapResult.issues.push("❌ Sitemap not found or inaccessible.");
        }
    } catch (e) {
        logger.warn(`Error validating sitemap: ${e.message}`);
        sitemapResult.status = "⚠️ Error occurred while checking sitemap";
        sitemapResult.issues.push("⚠️ An error occurred while checking sitemap.");
    }
    return sitemapResult;
};

/**
 * Detects HTTP status codes and redirection chains for key URLs.
 * @param {string} baseUrl The root URL to check.
 * @param {array} internalLinks A few internal links to check.
 * @returns {Promise<object>} An object with the status and redirection analysis.
 */
const analyzeHttpStatusAndRedirects = async (baseUrl, internalLinks) => {
    const redirectionResults = {};
    const urlsToCheck = [baseUrl, ...internalLinks.slice(0, 3)];

    for (const url of urlsToCheck) {
        try {
            const result = await followRedirects(url);
            redirectionResults[url] = {
                final_url: result.finalUrl,
                final_status_code: result.statusCode,
                redirect_chain: result.redirectChain,
                has_redirect_chain: result.redirectChain.length > 1,
                issues: []
            };

            if (result.redirectChain.length > 2) {
                redirectionResults[url].issues.push(`⚠️ Long redirect chain detected (${result.redirectChain.length - 1} hops). Consider simplifying.`);
            }
            if (result.statusCode && result.statusCode >= 400) {
                redirectionResults[url].issues.push(`❌ Final URL returns a ${result.statusCode} status code.`);
            }

        } catch (e) {
            logger.warn(`Error checking redirection for ${url}: ${e.message}`);
            redirectionResults[url] = {
                final_url: url,
                final_status_code: null,
                redirect_chain: [url],
                has_redirect_chain: false,
                issues: [`❌ Failed to check URL: ${e.message}`]
            };
        }
    }
    return redirectionResults;
};

// Replace your existing fetchPageSpeedData function with this improved version
const fetchPageSpeedData = async (url) => {
    const API_KEY = process.env.PAGESPEED_API_KEY; 
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
    const categories = ['performance'];
    const strategies = ['mobile', 'desktop'];
    const results = {};

    // Enhanced logging
    logger.info(`PageSpeed API Key present: ${!!API_KEY}`);
    logger.info(`PageSpeed API Key length: ${API_KEY ? API_KEY.length : 0}`);
    
    if (!API_KEY) {
        logger.error("PAGESPEED_API_KEY is not set in environment variables.");
        return { 
            error: 'PageSpeed Insights API key is missing from environment variables.',
            mobile: { error: 'API key not configured' },
            desktop: { error: 'API key not configured' }
        };
    }

    for (const strategy of strategies) {
        try {
            const params = new URLSearchParams({
                url: encodeURIComponent(url), // Properly encode the URL
                key: API_KEY,
                strategy: strategy,
                category: categories.join(',')
            });

            const apiUrl = `${psiUrl}?${params.toString()}`;
            logger.info(`Making PageSpeed API request for ${strategy}`);
            logger.info(`Request URL: ${apiUrl.replace(API_KEY, 'API_KEY_HIDDEN')}`);

            const response = await axios.get(apiUrl, { 
                timeout: 30000,
                headers: {
                    'User-Agent': 'SEO-Analyzer-Tool/1.0'
                }
            });

            logger.info(`PageSpeed API response status for ${strategy}: ${response.status}`);

            if (!response.data || !response.data.lighthouseResult) {
                throw new Error('Invalid response structure from PageSpeed API');
            }

            const data = response.data.lighthouseResult;

            results[strategy] = {
                performance_score: Math.round(data.categories.performance.score * 100),
                metrics: {
                    LCP: data.audits['largest-contentful-paint']?.displayValue || 'N/A',
                    FID: data.audits['first-input-delay']?.displayValue || 'N/A',
                    CLS: data.audits['cumulative-layout-shift']?.displayValue || 'N/A',
                    FCP: data.audits['first-contentful-paint']?.displayValue || 'N/A',
                    TTI: data.audits['interactive']?.displayValue || 'N/A',
                    Speed_Index: data.audits['speed-index']?.displayValue || 'N/A'
                },
                status: 'success'
            };
            
            logger.info(`Successfully fetched PageSpeed data for ${strategy}: Score ${results[strategy].performance_score}`);
            
        } catch (error) {
            logger.error(`Error fetching PageSpeed data for ${strategy}:`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: url
            });

            // Log the actual API error response for debugging
            if (error.response?.data) {
                logger.error(`PageSpeed API Error Response:`, error.response.data);
            }

            results[strategy] = {
                error: `Failed to retrieve PageSpeed data: ${error.message}`,
                status_code: error.response?.status || null,
                performance_score: null,
                metrics: {
                    LCP: 'Error',
                    FID: 'Error', 
                    CLS: 'Error',
                    FCP: 'Error',
                    TTI: 'Error',
                    Speed_Index: 'Error'
                },
                status: 'error'
            };

            // More specific error messages
            if (error.response?.status === 403) {
                logger.error('PageSpeed API returned 403 - Check API key validity and restrictions');
                results[strategy].error = 'API key invalid or restricted';
            } else if (error.response?.status === 400) {
                logger.error('PageSpeed API returned 400 - Check URL format');
                results[strategy].error = 'Invalid URL format or parameters';
            } else if (error.response?.status === 429) {
                logger.error('PageSpeed API returned 429 - Rate limit exceeded');
                results[strategy].error = 'API rate limit exceeded';
            }
        }
    }

    return results;
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

        const $ = load(response.data);

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
        const canonicalStatus = canonicalLink ? "Present" : "Missing";
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
        
        // --- Enhanced Image Analysis ---
        const imageAnalysis = analyzeImages($);
        const altImageRatio = imageAnalysis.alt_ratio;
        
        if (imageAnalysis.total_images > 0 && imageAnalysis.images_without_alt > 0) {
            deductions.push(`⚠️ ${imageAnalysis.images_without_alt} out of ${imageAnalysis.total_images} images are missing or have empty alt attributes.`);
            currentScore -= Math.min(imageAnalysis.images_without_alt * 2, 15);
        }
        if (imageAnalysis.total_images === 0) {
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

        // --- Enhanced Keyword Presence Analysis ---
        const keywordPresenceAnalysis = analyzeKeywordPresence(
            topKeywords, 
            titleTag, 
            metaDescription, 
            h1Tags, 
            visibleText, 
            siteUrl
        );
        
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
        
        // Get images for processing (limit to first 20 for performance)
        const allImgTags = $('img');
        const imagesForProcessing = allImgTags.filter((i, el) => $(el).attr('src')).get();
        
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
        const sitemapUrlFromHtml = safeGetAttribute($('link[rel="sitemap"]'), 'href');
        const sitemapUrl = sitemapUrlFromHtml ? new URL(sitemapUrlFromHtml, siteUrl).href : new URL('/sitemap.xml', siteUrl).href;
        const sitemapResult = await validateSitemapUrls(sitemapUrl);
        if (sitemapResult.issues.length) {
             sitemapResult.issues.forEach(issue => {
                 if (issue.startsWith('❌')) currentScore -= 10;
                 else if (issue.startsWith('⚠️')) currentScore -= 5;
                 deductions.push(issue);
             });
        }
        
        // --- Link Audit ---
        const linkAuditResult = {
            internal_links_count: 0,
            external_links_count: 0,
            broken_links_count: 0,
            broken_links: [],
            status: "✅ No broken links found."
        };
        const internalLinksToCheck = [];
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
                    internalLinksToCheck.push(cleanUrl);
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

        // --- Enhanced Social Media Tags Audit (Open Graph & Twitter Cards) ---
        const ogTwitterAuditResult = analyzeOpenGraphTwitter($);
        
        // Add deductions based on social media analysis
        for (const issue of ogTwitterAuditResult.issues) {
            if (issue.includes("Missing Open Graph title") || issue.includes("Missing Open Graph image")) {
                deductions.push(`❌ ${issue}`);
                currentScore -= 5;
            } else if (issue.includes("Missing Open Graph description")) {
                deductions.push(`❌ ${issue}`);
                currentScore -= 3;
            } else if (issue.includes("Missing Twitter Card")) {
                deductions.push(`⚠️ ${issue}`);
                currentScore -= 3;
            } else {
                deductions.push(`⚠️ ${issue}`);
                currentScore -= 2;
            }
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

        // --- NEW Crawlability & Indexability Audits ---
        const crawlabilityAuditResult = {};

        // Robots.txt analysis
        const robotsTxtAnalysis = await analyzeRobotsTxt(siteUrl);
        crawlabilityAuditResult.robots_txt = robotsTxtAnalysis;
        deductions.push(...robotsTxtAnalysis.issues);
        if (robotsTxtAnalysis.issues.some(issue => issue.startsWith('❌'))) {
            currentScore -= 10;
        }
        
        // Meta Robots analysis
        const metaRobotsAnalysis = analyzeMetaRobots($);
        crawlabilityAuditResult.meta_robots = metaRobotsAnalysis;
        deductions.push(...metaRobotsAnalysis.issues);
        if (metaRobotsAnalysis.is_noindex) {
            currentScore -= 20; // High deduction for noindex
        }
        if (metaRobotsAnalysis.is_nofollow) {
            currentScore -= 5;
        }

        // Sitemap validation
        // Use the sitemap URL found in robots.txt if available, otherwise default
        const sitemapUrlToValidate = robotsTxtAnalysis.sitemap_path 
            ? new URL(robotsTxtAnalysis.sitemap_path, siteUrl).href 
            : sitemapUrl;
            
        const sitemapValidationResult = await validateSitemapUrls(sitemapUrlToValidate);
        crawlabilityAuditResult.sitemap = sitemapValidationResult;
        deductions.push(...sitemapValidationResult.issues);
        if (sitemapValidationResult.issues.some(issue => issue.startsWith('❌'))) {
            currentScore -= 10;
        }

        // HTTP Status and Redirects analysis
        const httpStatusAndRedirects = await analyzeHttpStatusAndRedirects(siteUrl, internalLinksToCheck);
        crawlabilityAuditResult.http_status_and_redirects = httpStatusAndRedirects;
        
        for (const url in httpStatusAndRedirects) {
            const result = httpStatusAndRedirects[url];
            if (result.has_redirect_chain) {
                deductions.push(`⚠️ Long redirect chain for ${url}. Chain: ${result.redirect_chain.join(' -> ')}`);
                currentScore -= 5;
            }
            if (result.final_status_code && result.final_status_code >= 400) {
                 deductions.push(`❌ URL ${url} leads to a ${result.final_status_code} error.`);
                 currentScore -= 10;
            }
        }
        
        // --- NEW PAGESPEED AUDIT ---
        const pagespeedData = await fetchPageSpeedData(siteUrl);

        // Deduct points based on PageSpeed scores
        if (pagespeedData.mobile && pagespeedData.mobile.performance_score < 50) {
            deductions.push(`❌ Mobile performance score is critically low (${pagespeedData.mobile.performance_score}).`);
            currentScore -= 20;
        } else if (pagespeedData.mobile && pagespeedData.mobile.performance_score < 90) {
            deductions.push(`⚠️ Mobile performance score is suboptimal (${pagespeedData.mobile.performance_score}).`);
            currentScore -= 10;
        }

        // Ensure score doesn't go below 0
        currentScore = Math.max(currentScore, 0);
        
        // Prepare final response
        const finalReport = {
            seo_score: currentScore,
            deductions,
            title_tag: titleTag || "Missing",
            meta_description: metaDescription || "Missing",
            metadata_length_audit: metadataLengthAudit,
            h1_tags: h1Tags,
            h1_count: h1Count,
            h2_count: h2Count,
            h3_count: h3Count,
            heading_order: headingOrder,
            heading_issues: headingIssues,
            canonical: {
                status: canonicalStatus,
                url: canonicalLink || "Missing",
                present: !!canonicalLink
            },
            uses_https: isHttps,
            has_robots_txt: hasRobots,
            has_favicon: hasFavicon,
            image_analysis: imageAnalysis,
            alt_image_ratio: altImageRatio,
            content_analysis: {
                total_word_count: totalWordCount,
                top_keywords: topKeywords,
                flesch_reading_ease_score: readabilityScore,
                keyword_suggestions: keywordSuggestions,
                keyword_presence_analysis: keywordPresenceAnalysis,
            },
            speed_audit: speedAuditResult,
            pagespeed_audit: pagespeedData, // Add the new PageSpeed data here
            sitemap: sitemapResult,
            link_audit: linkAuditResult,
            social_media_tags: ogTwitterAuditResult,
            og_twitter_audit: ogTwitterAuditResult,
            mobile_responsiveness_audit: mobileResponsivenessAuditResult,
            structured_data_audit: structuredDataAuditResult,
            local_seo_audit: localSeoAuditResult,
            crawlability_and_indexability_audit: crawlabilityAuditResult
        };

        logger.info("SEO report generation completed successfully");
        res.json(finalReport);


    } catch (e) {
        logger.error(`Unexpected error in generate-report: ${e.message}`);
        res.status(500).json({ detail: `Unexpected server error: ${e.message}` });
    }
});

export default router;