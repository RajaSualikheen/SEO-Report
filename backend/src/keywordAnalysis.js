/**
 * Analyze how well keywords are integrated into key SEO elements
 */
export const analyzeKeywordPresence = (keywords, titleTag, metaDescription, h1Tags, contentText, url) => {
    const keywordAnalysis = [];

    const escapeRegex = str => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const normalize = text => (text || "").toLowerCase();

    const isPresent = (keyword, text) => {
        if (!text) return false;
        const regex = new RegExp(`\\b${escapeRegex(keyword.toLowerCase())}\\b`, "i");
        return regex.test(normalize(text));
    };

    const calculateDensity = (keyword, text) => {
        if (!text) return 0;
        const words = normalize(text).match(/\b\w+\b/g) || [];
        const keywordWords = keyword.toLowerCase().split(/\s+/);

        if (keywordWords.length === 1) {
            const count = words.filter(word => word === keywordWords[0]).length;
            return words.length ? parseFloat(((count / words.length) * 100).toFixed(2)) : 0;
        }

        const phrase = escapeRegex(keywordWords.join(" "));
        const matches = (normalize(text).match(new RegExp(`\\b${phrase}\\b`, "g")) || []).length;
        return words.length ? parseFloat(((matches / words.length) * 100).toFixed(2)) : 0;
    };

    for (const { keyword, frequency, density } of keywords.slice(0, 10)) {
        const analysis = {
            keyword,
            frequency,
            density,
            presence: {
                title: isPresent(keyword, titleTag),
                meta_description: isPresent(keyword, metaDescription),
                h1: h1Tags.some(h1 => isPresent(keyword, h1)),
                content: isPresent(keyword, contentText),
                url: isPresent(keyword, url)
            },
            recommendations: []
        };

        // Recommendations based on absence in key elements
        if (!analysis.presence.title && density >= 1.0) {
            analysis.recommendations.push("Consider including this keyword in your title tag");
        }
        if (!analysis.presence.meta_description && density >= 1.0) {
            analysis.recommendations.push("Consider including this keyword in your meta description");
        }
        if (!analysis.presence.h1 && density >= 1.5) {
            analysis.recommendations.push("Consider including this keyword in your H1 tag");
        }
        if (!analysis.presence.url && density >= 2.0) {
            analysis.recommendations.push("Consider including this keyword in your URL slug");
        }

        // Density checks
        if (density > 4.0) {
            analysis.recommendations.push("Keyword density is too high - reduce usage to avoid keyword stuffing");
        } else if (density < 0.5 && frequency > 1) {
            analysis.recommendations.push("Keyword density is very low - consider using this keyword more naturally");
        }

        keywordAnalysis.push(analysis);
    }

    return keywordAnalysis;
};

/**
 * Generate keyword improvement suggestions for SEO
 */
export const getKeywordSuggestions = (allWords, topKeywords, titleTag, metaDescription, STOP_WORDS) => {
    const suggestions = [];
    const contentText = allWords.join(" ");
    const stopWords = STOP_WORDS;

    const escapeRegex = str => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const normalize = text => (text || "").toLowerCase();

    const isPresent = (keyword, text) => {
        if (!text) return false;
        const regex = new RegExp(`\\b${escapeRegex(keyword.toLowerCase())}\\b`, "i");
        return regex.test(normalize(text));
    };

    // Identify potential focus keywords
    const potentialFocusKeywords = topKeywords.filter(({ keyword, density }) => {
        const wordCount = keyword.split(" ").length;
        if (wordCount > 1 && density >= 1.0 && density <= 4.0) return true;
        if (wordCount === 1 && density >= 1.5 && keyword.length > 3) return true;
        return false;
    }).map(k => k.keyword);

    if (!potentialFocusKeywords.length && topKeywords.length) {
        const highestFreqWord = topKeywords.find(({ keyword }) =>
            // FIX: Changed .includes to .has for the Set object
            keyword.split(" ").length === 1 && !stopWords.has(keyword.toLowerCase())
        );
        if (highestFreqWord) {
            suggestions.push(`Consider '${highestFreqWord.keyword}' as a potential focus keyword and ensure it's prominently featured in your content.`);
        }
    } else {
        for (const pk of potentialFocusKeywords.slice(0, 2)) {
            if (!isPresent(pk, titleTag) || !isPresent(pk, metaDescription)) {
                suggestions.push(`Ensure the key phrase '${pk}' is naturally integrated into your page title and meta description.`);
            }
        }
    }

    // Suggest secondary keywords
    const secondaryKeywords = topKeywords.slice(3, 10).map(k => k.keyword);
    if (secondaryKeywords.length) {
        suggestions.push(
            `Integrate secondary keywords like '${secondaryKeywords.slice(0, 3).join(", ")}' to enrich your content and capture long-tail searches.`
        );
    }

    // Ensure title keywords are present in content
    if (titleTag) {
        const titleWords = normalize(titleTag).match(/\b\w+\b/g) || [];
        // FIX: Changed .includes to .has for the Set object
        const relevantWords = titleWords.filter(w => !stopWords.has(w) && w.length > 2);
        for (const word of relevantWords) {
            if (!isPresent(word, contentText)) {
                suggestions.push(`The word '${word}' from your title should be present and relevant within your content body.`);
            }
        }
    }

    // Content length suggestion
    if (allWords.length < 500) {
        suggestions.push("Expand on key topics. More comprehensive content often ranks better and provides more value to users.");
    }

    // Fallback positive suggestion
    if (!suggestions.length) {
        suggestions.push("Your keyword usage appears natural and well-distributed. Keep up the good work!");
    }

    return [...new Set(suggestions)]; // deduplicate
};