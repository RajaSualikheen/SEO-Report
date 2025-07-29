// src/app/api/generate-report/route.ts
// This file contains the backend logic for your SEO report generation.

import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom'; // For XML parsing (sitemap.xml)
import { URL } from 'url'; // Node.js native URL module
import { performance } from 'perf_hooks'; // For basic timing (optional)

// --- Helper Functions (Converted from Python) ---

// Python equivalent of `safe_get_text`
function safeGetText(element: cheerio.Element | null | undefined, $: cheerio.CheerioAPI, strip: boolean = true): string {
    if (!element) return "";
    try {
        const text = $(element).text();
        return strip ? text.trim().replace(/\s+/g, ' ') : text;
    } catch (e) {
        console.warn(`Error getting text from element: ${e}`);
        return "";
    }
}

// Python equivalent of `safe_get_attribute`
function safeGetAttribute(element: cheerio.Element | null | undefined, $: cheerio.CheerioAPI, attribute: string): string {
    if (!element) return "";
    try {
        return $(element).attr(attribute) || "";
    } catch (e) {
        console.warn(`Error getting attribute ${attribute} from element: ${e}`);
        return "";
    }
}

function countSyllables(word: string): number {
    try {
        word = word.toLowerCase();
        let syllables = 0;
        const vowels = "aeiouy";
        let prevCharWasVowel = false;
        for (const char of word) {
            if (vowels.includes(char)) {
                if (!prevCharWasVowel) {
                    syllables += 1;
                }
                prevCharWasVowel = true;
            } else {
                prevCharWasVowel = false;
            }
        }
        if (word.endsWith("e") && syllables > 1) {
            syllables -= 1;
        }
        if (syllables === 0) {
            syllables = 1;
        }
        return syllables;
    } catch (error) {
        // console.warn(`Error counting syllables for word '${word}': ${error}`);
        return 1;
    }
}

function interpretReadability(score: number): string {
    if (score >= 90) return "Very Easy";
    else if (score >= 80) return "Easy";
    else if (score >= 70) return "Fairly Easy";
    else if (score >= 60) return "Standard";
    else if (score >= 50) return "Fairly Difficult";
    else if (score >= 30) return "Difficult";
    else return "Very Difficult";
}

function getVisibleText($: cheerio.CheerioAPI): string {
    try {
        // Clone the body to avoid modifying the original soup
        const body = $.html();
        const temp$ = cheerio.load(body); // Create a temporary cheerio instance

        // Elements to remove from visible text
        const selectorsToRemove = [
            'script', 'style', 'noscript', 'nav', 'header', 'footer', 'aside',
            'form', 'button', 'input', 'select', 'textarea'
        ];

        selectorsToRemove.forEach(selector => {
            temp$(selector).remove();
        });

        // Get text and normalize whitespace
        const text = temp$('body').text();
        return text.replace(/\s+/g, ' ').trim();
    } catch (e) {
        console.warn(`Error extracting visible text: ${e}`);
        return "";
    }
}

function getStopWords(): string[] {
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
}

interface MetadataAnalysisResult {
    title: { text: string | null; char_count: number; status: string; recommendation: string; };
    meta_description: { text: string | null; char_count: number; status: string; recommendation: string; };
}

function analyzeMetadataLength(title: string | null, meta_description: string | null): MetadataAnalysisResult {
    const metadataAnalysis: MetadataAnalysisResult = {
        title: {
            text: title,
            char_count: 0,
            status: "Missing",
            recommendation: "A compelling title tag is crucial for SEO. Aim for 30-60 characters."
        },
        meta_description: {
            text: meta_description,
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
        } else if (titleLen >= 30 && titleLen <= 60) {
            metadataAnalysis.title.status = "Optimal";
            metadataAnalysis.title.recommendation = "Title length is optimal.";
        } else {
            metadataAnalysis.title.status = "Too Long";
            metadataAnalysis.title.recommendation = `Title is too long (${titleLen} characters). Condense for better display in search results. Aim for under 60 characters.`;
        }
    }

    if (meta_description) {
        const metaDescLen = meta_description.length;
        metadataAnalysis.meta_description.char_count = metaDescLen;
        if (metaDescLen < 50) {
            metadataAnalysis.meta_description.status = "Too Short";
            metadataAnalysis.meta_description.recommendation = `Meta description is too short (${metaDescLen} characters). Provide more detail to entice clicks. Aim for 50-160 characters.`;
        } else if (metaDescLen >= 50 && metaDescLen <= 160) {
            metadataAnalysis.meta_description.status = "Optimal";
            metadataAnalysis.meta_description.recommendation = "Meta description length is optimal.";
        } else {
            metadataAnalysis.meta_description.status = "Too Long";
            metadataAnalysis.meta_description.recommendation = `Meta description is too long (${metaDescLen} characters). It may be truncated in search results. Aim for under 160 characters.`;
        }
    }

    return metadataAnalysis;
}

interface KeywordData {
    keyword: string;
    frequency: number;
    density: number;
}

function getKeywordSuggestions(allWords: string[], topKeywords: KeywordData[], titleTag: string | null, metaDescription: string | null): string[] {
    const suggestions: string[] = [];
    const contentText = allWords.join(" ");
    const stopWords = new Set(getStopWords());

    const isPresent = (keyword: string, text: string): boolean => {
        return new RegExp(`\\b${keyword.toLowerCase()}\\b`).test(text.toLowerCase());
    };

    const potentialFocusKeywords: string[] = [];
    for (const kwData of topKeywords) {
        const keyword = kwData.keyword;
        const density = kwData.density;
        const wordCount = keyword.split(' ').length;

        if (wordCount > 1 && density >= 1.0 && density <= 4.0) {
            potentialFocusKeywords.push(keyword);
        } else if (wordCount === 1 && density >= 1.5 && keyword.length > 3 && !stopWords.has(keyword.toLowerCase())) {
            potentialFocusKeywords.push(keyword);
        }
    }

    if (!potentialFocusKeywords.length && topKeywords.length) {
        const highestFreqWord = topKeywords.find(kwData =>
            kwData.keyword.split(' ').length === 1 && !stopWords.has(kwData.keyword.toLowerCase())
        )?.keyword;
        if (highestFreqWord) {
            suggestions.push(`Consider '${highestFreqWord}' as a potential focus keyword and ensure it's prominently featured in your content.`);
        }
    } else {
        for (const pk of potentialFocusKeywords.slice(0, 2)) {
            const inTitle = titleTag && isPresent(pk, titleTag);
            const inMeta = metaDescription && isPresent(pk, metaDescription);
            if (!inTitle || !inMeta) {
                suggestions.push(`Ensure the key phrase '${pk}' is naturally integrated into your page title and meta description.`);
            }
        }
    }

    const secondaryKeywords: string[] = [];
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
        const titleRelevantWords = titleWords.filter(w => !stopWords.has(w) && w.length > 2);
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

    // Deduplicate suggestions
    const uniqueSuggestions = Array.from(new Set(suggestions));

    return uniqueSuggestions;
}

interface LocalSeoAuditResult {
    local_business_schema_found: boolean;
    organization_schema_found: boolean;
    schema_types_found: string[];
    physical_address_found: boolean;
    phone_number_found: boolean;
    geo_coordinates_found: boolean;
    Maps_embed_found: boolean;
    status: string; // e.g., "✅ Present", "⚠️ Partial", "❌ Missing"
    issues: string[];
}

function auditLocalSeo($: cheerio.CheerioAPI, visibleText: string): LocalSeoAuditResult {
    const localSeoResult: LocalSeoAuditResult = {
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

    // 1. Check for Schema.org LocalBusiness or Organization types in JSON-LD
    const ldJsonScripts = $('script[type="application/ld+json"]');
    ldJsonScripts.each((_i, el) => {
        const scriptContent = $(el).text().trim();
        if (scriptContent) {
            try {
                const json_data = JSON.parse(scriptContent);
                const schemas_to_check: any[] = Array.isArray(json_data) ? json_data : [json_data];

                for (const item of schemas_to_check) {
                    if (typeof item === 'object' && item !== null && '@type' in item) {
                        const schema_type = item["@type"];
                        const typesArray = Array.isArray(schema_type) ? schema_type : [schema_type];

                        for (const s_t of typesArray) {
                            if (typeof s_t === 'string') {
                                localSeoResult.schema_types_found.push(s_t);
                                if (s_t.includes("LocalBusiness")) {
                                    localSeoResult.local_business_schema_found = true;
                                }
                                if (s_t.includes("Organization") && !s_t.includes("LocalBusiness")) {
                                    localSeoResult.organization_schema_found = true;
                                }
                            }
                        }

                        // Check for address and phone within the schema if LocalBusiness/Organization
                        if (localSeoResult.local_business_schema_found || localSeoResult.organization_schema_found) {
                            if (item.address && typeof item.address === 'object' && item.address.streetAddress) {
                                localSeoResult.physical_address_found = true;
                                if (!/(\d{5}(-\d{4})?|\w+\s+\w+\s+(St|Ave|Rd))/i.test(visibleText)) {
                                    localSeoResult.issues.push("⚠️ LocalBusiness schema has address, but text on page is less clear.");
                                }
                            }
                            if (item.telephone) {
                                localSeoResult.phone_number_found = true;
                                if (!/(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/.test(visibleText)) {
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
                console.warn(`Invalid JSON-LD during Local SEO audit: ${e}`);
            }
        }
    });

    // 2. Check for physical address and phone number on the page text
    const addressPatterns = [
        /\d{1,5}\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Place|Pl|Court|Ct|Circle|Cir)/i,
        /\d{5}(-\d{4})?/ // Zip code like
    ];
    if (!localSeoResult.physical_address_found) {
        for (const pattern of addressPatterns) {
            if (pattern.test(visibleText)) {
                localSeoResult.physical_address_found = true;
                break;
            }
        }
    }

    const phonePattern = /(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/;
    if (!localSeoResult.phone_number_found && phonePattern.test(visibleText)) {
        localSeoResult.phone_number_found = true;
    }

    // 3. Check for Google Maps embed or link
    if ($('iframe[src*="maps.google.com"], iframe[src*="google.com/maps"]').length > 0 ||
        $('a[href*="maps.google.com"], a[href*="google.com/maps"]').length > 0) {
        localSeoResult.Maps_embed_found = true;
    }

    // Determine overall status
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
}

// --- Main API Route Handler ---

// Define the shape of the request body
interface ReportRequest {
    url: string;
}

export async function POST(request: Request) {
    const startTime = performance.now();
    let siteUrl: string;

    try {
        const body: ReportRequest = await request.json();
        siteUrl = body.url.trim();

        if (!siteUrl) {
            return NextResponse.json({ detail: "URL is required" }, { status: 400 });
        }

        if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
            siteUrl = 'https://' + siteUrl;
        }

        console.log(`[INFO] Processing SEO report for: ${siteUrl}`);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        };

        // Use native fetch API
        let response: Response;
        try {
            console.log("[INFO] Fetching initial HTML...");
            response = await fetch(siteUrl, {
                method: 'GET',
                headers: headers,
                signal: AbortSignal.timeout(15000), // 15 seconds timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ERROR] HTTP Error fetching HTML: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
                return NextResponse.json(
                    { detail: `Failed to fetch website: HTTP ${response.status} ${response.statusText}` },
                    { status: response.status }
                );
            }

            const contentType = response.headers.get('content-type')?.toLowerCase() || '';
            if (!contentType.includes('text/html')) {
                console.error(`[ERROR] URL does not return HTML content. Content-Type: ${contentType}`);
                return NextResponse.json(
                    { detail: `URL does not return HTML content. Content-Type: ${contentType}` },
                    { status: 400 }
                );
            }

        } catch (e: any) {
            console.error(`[ERROR] Failed to connect or fetch website: ${e.message}`);
            if (e.name === 'TimeoutError') {
                return NextResponse.json({ detail: "Request timeout while fetching the website" }, { status: 408 });
            }
            return NextResponse.json({ detail: `Failed to connect to the website: ${e.message}` }, { status: 400 });
        }

        const htmlContent = await response.text();
        const $ = cheerio.load(htmlContent);
        console.log("[INFO] HTML parsed successfully with Cheerio.");

        let currentScore = 100;
        const deductions: string[] = [];
        const visibleText = getVisibleText($);

        // --- SEO Analysis Logic ---
        let titleTag: string | null = null;
        try {
            const titleElement = $('head title').first();
            if (titleElement.length > 0) {
                titleTag = titleElement.text().trim();
            }
        } catch (e) {
            console.warn(`[WARN] Error extracting title: ${e}`);
        }

        if (!titleTag) {
            deductions.push("❌ Missing <title> tag.");
            currentScore -= 10;
        }

        let metaDescription: string | null = null;
        try {
            const metaDescTag = $('head meta[name="description"]').first();
            if (metaDescTag.length > 0) {
                metaDescription = metaDescTag.attr('content')?.trim() || null;
            }
        } catch (e) {
            console.warn(`[WARN] Error extracting meta description: ${e}`);
        }

        if (!metaDescription) {
            deductions.push("❌ Missing meta description.");
            currentScore -= 10;
        }

        // Metadata Length Analysis
        const metadataLengthAudit = analyzeMetadataLength(titleTag, metaDescription);

        if (metadataLengthAudit.title.status !== "Optimal") {
            deductions.push(`⚠️ Title: ${metadataLengthAudit.title.status}. Recommendation: ${metadataLengthAudit.title.recommendation}`);
            currentScore -= 5;
        }

        if (metadataLengthAudit.meta_description.status !== "Optimal") {
            deductions.push(`⚠️ Meta Description: ${metadataLengthAudit.meta_description.status}. Recommendation: ${metadataLengthAudit.meta_description.recommendation}`);
            currentScore -= 5;
        }

        // Heading Analysis
        const h1Elements = $('h1');
        const h2Elements = $('h2');
        const h3Elements = $('h3');

        const h1Count = h1Elements.length;
        const h2Count = h2Elements.length;
        const h3Count = h3Elements.length;

        const headingOrder: { tag: string; text: string }[] = [];
        const headingIssues: string[] = [];

        $('h1, h2, h3, h4, h5, h6').each((_i, el) => {
            const tag = $(el).prop('tagName').toLowerCase(); // Use prop('tagName')
            const text = $(el).text().trim();
            if (text) {
                headingOrder.push({ tag, text });
            }
        });

        if (h1Count === 0) {
            headingIssues.push("❌ Missing <h1> tag.");
            currentScore -= 10;
        } else if (h1Count > 1) {
            headingIssues.push("⚠️ Multiple <h1> tags found. Ideally, there should be only one.");
            currentScore -= 5;
        }

        let foundH1InOrder = false;
        for (const heading of headingOrder) {
            if (heading.tag === 'h1') {
                foundH1InOrder = true;
            } else if (heading.tag === 'h2' && !foundH1InOrder) {
                headingIssues.push("❌ Found <h2> before <h1>.");
                currentScore -= 5;
                break;
            } else if (heading.tag === 'h3' && !foundH1InOrder && !headingOrder.slice(0, headingOrder.indexOf(heading)).some(h => h.tag === 'h2')) {
                headingIssues.push("❌ Found <h3> before <h1> or <h2>.");
                currentScore -= 5;
                break;
            }
        }
        deductions.push(...headingIssues);

        let canonicalLink: string | null = null;
        try {
            const canonicalLinkTag = $('head link[rel="canonical"]').first();
            if (canonicalLinkTag.length > 0) {
                canonicalLink = canonicalLinkTag.attr('href')?.trim() || null;
            }
        } catch (e) {
            console.warn(`[WARN] Error extracting canonical link: ${e}`);
        }

        if (!canonicalLink) {
            deductions.push("⚠️ Missing canonical link.");
            currentScore -= 5;
        }

        const isHttps = siteUrl.startsWith("https://");
        if (!isHttps) {
            deductions.push("❌ Site does not use HTTPS.");
            currentScore -= 10;
        }

        let hasRobotsTxt = false;
        try {
            const robotsUrl = new URL('/robots.txt', siteUrl).toString();
            const robotsResponse = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
            hasRobotsTxt = robotsResponse.ok;
        } catch (e) {
            console.warn(`[WARN] Error checking robots.txt: ${e}`);
        }

        if (!hasRobotsTxt) {
            deductions.push("⚠️ Missing robots.txt file.");
            currentScore -= 5;
        }

        let hasFavicon = false;
        try {
            const faviconTag = $('head link[rel*="icon"]').first();
            hasFavicon = faviconTag.length > 0 && !!faviconTag.attr('href');
        } catch (e) {
            console.warn(`[WARN] Error checking favicon: ${e}`);
        }

        if (!hasFavicon) {
            deductions.push("⚠️ Missing favicon.");
            currentScore -= 5;
        }

        // Image analysis
        const allImgTags = $('img');
        const imagesForProcessing: cheerio.Element[] = [];
        allImgTags.each((_i, el) => {
            if ($(el).attr('src')) {
                imagesForProcessing.push(el);
            }
        });

        const totalImages = imagesForProcessing.length;
        const imagesWithAlt = imagesForProcessing.filter(img => $(img).attr('alt')).length;
        const altImageRatio = totalImages ? `${imagesWithAlt} / ${totalImages}` : "No images found";

        if (totalImages > 0 && imagesWithAlt < totalImages) {
            deductions.push(`⚠️ ${totalImages - imagesWithAlt} out of ${totalImages} images are missing alt attributes.`);
            currentScore -= 5;
        } else if (totalImages === 0) {
            deductions.push("ℹ️ No images found on the page.");
        }

        // Content analysis
        const words = visibleText ? (visibleText.toLowerCase().match(/\b\w+\b/g) || []) : [];
        const totalWordCount = words.length;

        if (totalWordCount < 200) {
            deductions.push(`⚠️ Low word count (${totalWordCount} words). Aim for more comprehensive content.`);
            currentScore -= 5;
        }

        // Keyword analysis
        let topKeywords: KeywordData[] = [];
        let keywordSuggestions: string[] = [];

        try {
            if (words.length > 0) {
                const stopwords = new Set(getStopWords());
                const filteredWords = words.filter(w => !stopwords.has(w) && w.length > 2);
                const keywordCounts: { [key: string]: number } = {};
                filteredWords.forEach(word => {
                    keywordCounts[word] = (keywordCounts[word] || 0) + 1;
                });

                const originalCaseMap: { [key: string]: string } = {};
                (visibleText.match(/\b\w+\b/g) || []).forEach(word => {
                    originalCaseMap[word.toLowerCase()] = word;
                });

                const sortedKeywords = Object.entries(keywordCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 15);

                topKeywords = sortedKeywords.map(([keyword, count]) => {
                    const original = originalCaseMap[keyword] || keyword;
                    const density = (count / totalWordCount) * 100;
                    return { keyword: original, frequency: count, density: parseFloat(density.toFixed(2)) };
                });

                keywordSuggestions = getKeywordSuggestions(words, topKeywords, titleTag, metaDescription);
            }
        } catch (e) {
            console.warn(`[WARN] Error analyzing keywords: ${e}`);
        }

        if (!topKeywords.length) {
            deductions.push("⚠️ No significant keywords found in content.");
            currentScore -= 5;
        }

        for (const suggestion of keywordSuggestions) {
            if (suggestion.startsWith("Your keyword usage appears natural")) {
                // This is a positive message, not a deduction
            } else {
                deductions.push(`⚠️ ${suggestion}`);
                if (suggestion.startsWith("Ensure the key phrase") || suggestion.startsWith("Consider") || suggestion.startsWith("Integrate secondary keywords")) {
                    currentScore -= 2;
                } else if (suggestion.startsWith("The word") || suggestion.startsWith("Expand on key topics")) {
                    currentScore -= 3;
                }
            }
        }

        // Readability analysis
        let readabilityScore = 0.0;
        let readabilityLabel = "Unknown";
        try {
            const sentences = visibleText.match(/[^.!?]+[.!?]+/g) || []; // More robust sentence split
            const sentenceCount = sentences.length;
            const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);

            if (sentenceCount > 0 && totalWordCount > 0) {
                readabilityScore = 206.835 - 1.015 * (totalWordCount / sentenceCount) - 84.6 * (syllableCount / totalWordCount);
                readabilityScore = parseFloat(readabilityScore.toFixed(2));
                readabilityLabel = interpretReadability(readabilityScore);
            }

            if (readabilityScore < 50 && totalWordCount > 0) { // Only deduct if content exists
                deductions.push(`⚠️ Readability score is low (${readabilityScore}). Content might be too complex.`);
                currentScore -= 5;
            }
        } catch (e) {
            console.warn(`[WARN] Error calculating readability: ${e}`);
        }

        // Speed audit
        const speedAuditResult = {
            external_css_count: 0,
            external_js_count: 0,
            has_inline_styles: false,
            has_inline_scripts: false,
            large_images: [],
            issues: []
        };

        try {
            speedAuditResult.external_css_count = $('link[rel="stylesheet"][href]').length;
            speedAuditResult.external_js_count = $('script[src]').length;
            speedAuditResult.has_inline_styles = $('style').length > 0 || $('[style]').length > 0;
            speedAuditResult.has_inline_scripts = $('script:not([src])').length > 0;

            const KB_THRESHOLD = 500 * 1024;
            const MB_THRESHOLD = 2 * 1024 * 1024;

            const imageCheckPromises: Promise<any>[] = [];
            const uniqueImageUrls = new Set<string>();

            // Limit to first 20 images
            imagesForProcessing.slice(0, 20).forEach(imgTag => {
                const imgSrc = $(imgTag).attr('src');
                if (imgSrc) {
                    try {
                        const absoluteImgUrl = new URL(imgSrc, siteUrl).toString();
                        if (!uniqueImageUrls.has(absoluteImgUrl)) {
                            uniqueImageUrls.add(absoluteImgUrl);
                            imageCheckPromises.push(
                                fetch(absoluteImgUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
                                    .then(res => ({
                                        url: absoluteImgUrl,
                                        ok: res.ok,
                                        status: res.status,
                                        content_length: res.headers.get('content-length') ? parseInt(res.headers.get('content-length')!) : 0
                                    }))
                                    .catch(err => {
                                        console.warn(`[WARN] Failed to HEAD image ${absoluteImgUrl}: ${err.message}`);
                                        return { url: absoluteImgUrl, ok: false, error: err.message };
                                    })
                            );
                        }
                    } catch (e) {
                        console.warn(`[WARN] Invalid image URL encountered: ${imgSrc} - ${e}`);
                    }
                }
            });

            const imageResults = await Promise.all(imageCheckPromises);

            for (const result of imageResults) {
                if (result.ok && result.content_length > 0) {
                    if (result.content_length >= MB_THRESHOLD) {
                        const sizeStr = `${(result.content_length / (1024 * 1024)).toFixed(2)}MB`;
                        speedAuditResult.large_images.push({ src: result.url, size: sizeStr });
                        speedAuditResult.issues.push(`❌ Image >2MB: ${result.url.split('/').pop()} (${sizeStr})`);
                    } else if (result.content_length >= KB_THRESHOLD) {
                        const sizeStr = `${(result.content_length / 1024).toFixed(2)}KB`;
                        speedAuditResult.large_images.push({ src: result.url, size: sizeStr });
                        speedAuditResult.issues.push(`⚠️ Image >500KB: ${result.url.split('/').pop()} (${sizeStr})`);
                    }
                }
            }

            if (speedAuditResult.has_inline_styles) {
                speedAuditResult.issues.push("❌ Found inline styles. Consider external CSS for better caching and maintainability.");
                currentScore -= 5;
            }
            if (speedAuditResult.has_inline_scripts) {
                speedAuditResult.issues.push("❌ Found inline scripts. Consider external JavaScript for better caching and maintainability.");
                currentScore -= 5;
            }
            if (speedAuditResult.external_css_count > 5) {
                speedAuditResult.issues.push(`⚠️ High number of external CSS files (${speedAuditResult.external_css_count}). Consider minification/bundling.`);
                currentScore -= 3;
            }
            if (speedAuditResult.external_js_count > 10) {
                speedAuditResult.issues.push(`⚠️ High number of external JavaScript files (${speedAuditResult.external_js_count}). Consider minification/bundling.`);
                currentScore -= 3;
            }
            if (speedAuditResult.large_images.length > 0) {
                speedAuditResult.issues.push(`❌ Found ${speedAuditResult.large_images.length} large images. Optimize for faster loading.`);
                currentScore -= Math.min(speedAuditResult.large_images.length * 2, 20);
            }

        } catch (e) {
            console.warn(`[WARN] Error during speed audit: ${e}`);
            speedAuditResult.issues.push("⚠️ Error occurred during speed analysis.");
            currentScore -= 5;
        }

        // Sitemap check
        const sitemapResult = {
            found: false,
            url_count: 0,
            status: "❌ Sitemap not found or invalid",
            url: undefined as string | undefined, // Added url field
            issues: [] as string[], // Added issues field
        };

        try {
            const sitemapUrl = new URL('/sitemap.xml', siteUrl).toString();
            const sitemapResponse = await fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) });

            if (sitemapResponse.ok) {
                const sitemapContent = await sitemapResponse.text();
                sitemapResult.found = true;
                sitemapResult.url = sitemapUrl;
                try {
                    // Use JSDOM for XML parsing in a Node.js environment
                    const dom = new JSDOM(sitemapContent, { contentType: 'application/xml' });
                    const parser = dom.window.document;
                    const urls = parser.querySelectorAll('url');
                    sitemapResult.url_count = urls.length;

                    if (sitemapResult.url_count === 0) {
                        sitemapResult.status = "❌ Sitemap found but contains no URLs";
                        sitemapResult.issues.push("❌ Sitemap is empty.");
                        currentScore -= 5;
                    } else if (sitemapResult.url_count > 50000) {
                        sitemapResult.issues.push("⚠️ Sitemap contains over 50,000 URLs, consider splitting.");
                        currentScore -= 5;
                    } else {
                        sitemapResult.status = `✅ Sitemap Found with ${sitemapResult.url_count} URLs`;
                    }
                } catch (xmlError) {
                    sitemapResult.status = "❌ Sitemap found but is invalid XML";
                    sitemapResult.issues.push("❌ Sitemap found but is invalid XML.");
                    currentScore -= 10;
                    console.warn(`[WARN] Error parsing sitemap XML: ${xmlError}`);
                }
            } else {
                sitemapResult.issues.push("❌ Sitemap not found.");
                currentScore -= 10;
            }
        } catch (e) {
            console.warn(`[WARN] Error checking sitemap: ${e}`);
            sitemapResult.status = "⚠️ Error occurred while checking sitemap";
            sitemapResult.issues.push("⚠️ Error occurred while checking sitemap.");
            currentScore -= 5;
        }

        // Link audit
        const linkAuditResult = {
            internal_links_count: 0,
            external_links_count: 0,
            broken_links_count: 0,
            broken_links: [] as BrokenLinkData[],
            status: "✅ No broken links found."
        };

        try {
            const linkCheckPromises: Promise<any>[] = [];
            const uniqueLinkUrlsToCheck = new Set<string>();
            const baseDomain = new URL(siteUrl).hostname;

            // Limit link checking to first 50 unique anchor tags with href
            $('a[href]').slice(0, 50).each((_i, el) => {
                const href = $(el).attr('href')?.trim();
                if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
                    return;
                }

                try {
                    const absoluteUrl = new URL(href, siteUrl).toString();
                    const parsedAbsoluteUrl = new URL(absoluteUrl);
                    const cleanUrl = parsedAbsoluteUrl.protocol + '//' + parsedAbsoluteUrl.hostname + parsedAbsoluteUrl.pathname + parsedAbsoluteUrl.search; // Remove fragment

                    if (!uniqueLinkUrlsToCheck.has(cleanUrl)) {
                        uniqueLinkUrlsToCheck.add(cleanUrl);
                        const linkDomain = parsedAbsoluteUrl.hostname;

                        if (linkDomain === baseDomain) {
                            linkAuditResult.internal_links_count++;
                        } else {
                            linkAuditResult.external_links_count++;
                        }

                        linkCheckPromises.push(
                            fetch(cleanUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
                                .then(res => ({ url: cleanUrl, ok: res.ok, status: res.status }))
                                .catch(err => ({ url: cleanUrl, ok: false, error: err.message }))
                        );
                    }
                } catch (e) {
                    console.warn(`[WARN] Invalid link URL encountered: ${href} - ${e}`);
                }
            });

            const linkResults = await Promise.all(linkCheckPromises);

            for (const result of linkResults) {
                if (!result.ok) {
                    const reason = result.error || `HTTP Status ${result.status}`;
                    linkAuditResult.broken_links.push({ url: result.url, reason });
                }
            }

            linkAuditResult.broken_links_count = linkAuditResult.broken_links.length;
            if (linkAuditResult.broken_links_count > 0) {
                linkAuditResult.status = "❌ Broken links detected!";
                deductions.push(`❌ Found ${linkAuditResult.broken_links_count} broken links.`);
                currentScore -= Math.min(linkAuditResult.broken_links_count * 2, 20);
            } else {
                linkAuditResult.status = "✅ No broken links found.";
            }

        } catch (e) {
            console.warn(`[WARN] Error during link audit: ${e}`);
            linkAuditResult.status = "⚠️ Error occurred during link analysis";
            deductions.push("⚠️ Error occurred during link analysis.");
            currentScore -= 5;
        }

        // Open Graph and Twitter Cards Audit
        const ogTwitterAuditResult: OgTwitterAuditData = {
            og_title_found: false,
            og_title_content: undefined,
            og_image_found: false,
            og_image_url: undefined,
            twitter_title_found: false,
            twitter_title_content: undefined,
            twitter_image_found: false,
            twitter_image_url: undefined,
            issues: []
        };

        try {
            const ogTitleTag = $('head meta[property="og:title"]').first();
            if (ogTitleTag.length > 0) {
                ogTwitterAuditResult.og_title_found = true;
                ogTwitterAuditResult.og_title_content = ogTitleTag.attr('content');
            } else {
                ogTwitterAuditResult.issues.push("❌ Missing Open Graph Title (og:title)");
                deductions.push("❌ Missing Open Graph Title.");
                currentScore -= 3;
            }

            const ogImageTag = $('head meta[property="og:image"]').first();
            if (ogImageTag.length > 0) {
                ogTwitterAuditResult.og_image_found = true;
                ogTwitterAuditResult.og_image_url = ogImageTag.attr('content');
                if (!ogTwitterAuditResult.og_image_url) {
                    ogTwitterAuditResult.issues.push("⚠️ og:image tag found but URL is empty.");
                    deductions.push("⚠️ Empty og:image URL.");
                    currentScore -= 2;
                }
            } else {
                ogTwitterAuditResult.issues.push("❌ Missing Open Graph Image (og:image)");
                deductions.push("❌ Missing Open Graph Image.");
                currentScore -= 5;
            }

            const twitterTitleTag = $('head meta[name="twitter:title"]').first();
            if (twitterTitleTag.length > 0) {
                ogTwitterAuditResult.twitter_title_found = true;
                ogTwitterAuditResult.twitter_title_content = twitterTitleTag.attr('content');
            } else {
                ogTwitterAuditResult.issues.push("⚠️ Missing Twitter Title (twitter:title)");
                deductions.push("⚠️ Missing Twitter Title.");
                currentScore -= 2;
            }

            const twitterImageTag = $('head meta[name="twitter:image"]').first();
            if (twitterImageTag.length > 0) {
                ogTwitterAuditResult.twitter_image_found = true;
                ogTwitterAuditResult.twitter_image_url = twitterImageTag.attr('content');
                if (!ogTwitterAuditResult.twitter_image_url) {
                    ogTwitterAuditResult.issues.push("⚠️ twitter:image tag found but URL is empty.");
                    deductions.push("⚠️ Empty twitter:image URL.");
                    currentScore -= 1;
                }
            } else {
                ogTwitterAuditResult.issues.push("⚠️ Missing Twitter Image (twitter:image)");
                deductions.push("⚠️ Missing Twitter Image.");
                currentScore -= 3;
            }
        } catch (e) {
            console.warn(`[WARN] Error during Open Graph/Twitter audit: ${e}`);
            ogTwitterAuditResult.issues.push("⚠️ Error occurred during Open Graph/Twitter audit.");
            deductions.push("⚠️ Error occurred during Open Graph/Twitter audit.");
            currentScore -= 5;
        }

        // Mobile Responsiveness Audit
        const mobileResponsivenessAuditResult: MobileResponsivenessAuditData = {
            has_viewport_meta: false,
            viewport_content: undefined,
            fixed_width_elements: [],
            issues: []
        };

        try {
            const viewportMeta = $('head meta[name="viewport"]').first();
            if (viewportMeta.length > 0) {
                mobileResponsivenessAuditResult.has_viewport_meta = true;
                mobileResponsivenessAuditResult.viewport_content = viewportMeta.attr('content');
                if (!mobileResponsivenessAuditResult.viewport_content?.includes("width=device-width")) {
                    mobileResponsivenessAuditResult.issues.push("❌ Viewport meta tag missing 'width=device-width'. Ensure proper configuration.");
                    deductions.push("❌ Viewport meta tag is not correctly configured for responsiveness.");
                    currentScore -= 10;
                }
            } else {
                mobileResponsivenessAuditResult.has_viewport_meta = false;
                mobileResponsivenessAuditResult.issues.push("❌ Missing viewport meta tag. Essential for mobile responsiveness.");
                deductions.push("❌ Missing viewport meta tag.");
                currentScore -= 10;
            }

            const FIXED_WIDTH_REGEX = /width:\s*(\d+(\.\d+)?(px|pt))\b/i;

            $('*').each((_i, el) => {
                const tag = $(el).prop('tagName').toLowerCase();
                const styleAttr = $(el).attr('style');
                const widthAttr = $(el).attr('width');

                // Check for 'width' attribute (e.g., <table width="500">)
                if (widthAttr && (widthAttr.match(/^\d+(\.\d+)?(px|pt)?$/i) || widthAttr.match(/^\d+$/))) {
                    mobileResponsivenessAuditResult.fixed_width_elements.push({
                        tag: tag,
                        source: `attribute: width='${widthAttr}'`,
                        value: widthAttr
                    });
                    mobileResponsivenessAuditResult.issues.push(`⚠️ Fixed width attribute on <${tag}>: width='${widthAttr}'. Use responsive units (%, em, rem, vw) instead.`);
                    currentScore -= 2;
                }

                // Check for 'style' attribute with fixed width
                if (styleAttr) {
                    const match = FIXED_WIDTH_REGEX.exec(styleAttr);
                    if (match) {
                        const fixedWidthValue = match[0]; // e.g., "width:600px"
                        mobileResponsivenessAuditResult.fixed_width_elements.push({
                            tag: tag,
                            source: `inline style: '${fixedWidthValue}'`,
                            value: match[1] // e.g., "600px"
                        });
                        mobileResponsivenessAuditResult.issues.push(`⚠️ Fixed width in inline style on <${tag}>: ${fixedWidthValue}. Use responsive units (%, em, rem, vw) instead.`);
                        currentScore -= 2;
                    }
                }
            });

        } catch (e) {
            console.warn(`[WARN] Error during mobile responsiveness audit: ${e}`);
            mobileResponsivenessAuditResult.issues.push("⚠️ Error occurred during mobile responsiveness analysis.");
            deductions.push("⚠️ Error occurred during mobile responsiveness audit.");
            currentScore -= 5;
        }

        // Structured Data (Schema) Audit
        const structuredDataAuditResult: StructuredDataAuditData = {
            ld_json_found: false,
            schema_types: [],
            issues: []
        };
        try {
            const ldJsonScripts = $('script[type="application/ld+json"]');
            if (ldJsonScripts.length > 0) {
                structuredDataAuditResult.ld_json_found = true;
                ldJsonScripts.each((_i, el) => {
                    const scriptContent = $(el).text().trim();
                    if (scriptContent) {
                        try {
                            const json_data = JSON.parse(scriptContent);
                            const schemasToCheck = Array.isArray(json_data) ? json_data : [json_data];
                            for (const item of schemasToCheck) {
                                if (typeof item === 'object' && item !== null && '@type' in item) {
                                    const schemaType = item["@type"];
                                    const typesArray = Array.isArray(schemaType) ? schemaType : [schemaType];
                                    structuredDataAuditResult.schema_types.push(...typesArray.filter(t => typeof t === 'string'));
                                }
                            }
                        } catch (e) {
                            structuredDataAuditResult.issues.push(`❌ Invalid JSON-LD found: ${e}`);
                            deductions.push("❌ Invalid JSON-LD found on page.");
                            currentScore -= 5;
                        }
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
        } catch (e) {
            console.warn(`[WARN] Error during structured data audit: ${e}`);
            structuredDataAuditResult.issues.push("⚠️ Error occurred during structured data analysis.");
            deductions.push("⚠️ Error occurred during structured data audit.");
            currentScore -= 5;
        }

        // Local SEO Audit
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

        console.log("[INFO] SEO report generation completed successfully.");

        const endTime = performance.now();
        console.log(`[INFO] Report generation took ${(endTime - startTime).toFixed(2)} ms`);

        return NextResponse.json({
            title_tag: titleTag || "Missing",
            meta_description: metaDescription || "Missing",
            metadata_length_audit: metadataLengthAudit,
            h1_count: h1Count,
            h2_count: h2Count,
            h3_count: h3Count,
            heading_order: headingOrder,
            heading_issues: headingIssues,
            canonical: canonicalLink || "Missing",
            uses_https: isHttps,
            has_robots_txt: hasRobotsTxt,
            has_favicon: hasFavicon,
            alt_image_ratio: altImageRatio,
            score: currentScore,
            deductions: deductions,
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
        }, { status: 200 });

    } catch (e: any) {
        console.error(`[ERROR] Unexpected error in generate_report: ${e.message}`, e.stack);
        return NextResponse.json(
            { detail: `Unexpected server error: ${e.message}` },
            { status: 500 }
        );
    }
}