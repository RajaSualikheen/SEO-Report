export const analyzeKeywordPresence = (keywords, titleTag, metaDescription, h1Tags, contentText, url) => {
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
            const keywordPhrase = keywordWords.join(' ');
            const regex = new RegExp('\\b' + keywordPhrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g');
            matches = (text.toLowerCase().match(regex) || []).length;
        }
        
        return words.length > 0 ? parseFloat(((matches / words.length) * 100).toFixed(2)) : 0;
    };

    for (const keywordData of keywords.slice(0, 10)) {
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

        if (analysis.density > 4.0) {
            analysis.recommendations.push("Keyword density is too high - reduce usage to avoid keyword stuffing");
        } else if (analysis.density < 0.5 && analysis.frequency > 1) {
            analysis.recommendations.push("Keyword density is very low - consider using this keyword more naturally");
        }

        keywordAnalysis.push(analysis);
    }

    return keywordAnalysis;
};

export const getKeywordSuggestions = (allWords, topKeywords, titleTag, metaDescription, getStopWords) => {
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