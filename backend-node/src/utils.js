export const countSyllables = (word) => {
    try {
        word = word.toLowerCase();
        if (word.length <= 3) {
            return 1;
        }
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return (matches && matches.length) || 1;
    } catch (e) {
        return 1;
    }
};

export const interpretReadability = (score) => {
    if (score >= 90) return "Very Easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly Easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly Difficult";
    if (score >= 30) return "Difficult";
    return "Very Difficult";
};

export const getVisibleText = (soup, logger) => {
    try {
        soup('script, style, noscript, nav, header, footer, aside, form, button, input, select, textarea').remove();
        soup('[aria-hidden="true"], [role="presentation"], [style*="display:none"], [style*="visibility:hidden"]').remove();
        return soup.text().replace(/\s+/g, ' ').trim();
    } catch (e) {
        logger.warn(`Error extracting visible text: ${e}`);
        return "";
    }
};

export const getStopWords = () => {
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

export const safeGetText = (element) => {
    try {
        return element ? element.text().trim() : "";
    } catch (e) {
        return "";
    }
};

export const safeGetAttribute = (element, attribute) => {
    try {
        return element ? element.attr(attribute) || "" : "";
    } catch (e) {
        return "";
    }
};