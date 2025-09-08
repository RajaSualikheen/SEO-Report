/**
 * Utility functions for SEO analysis and content processing
 */

/**
 * Estimate syllable count in a word (approximation).
 * @param {string} word
 * @returns {number}
 */
export const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/128.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.107 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.107 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.107 Mobile Safari/537.36',
];

/**
 * Generates a random delay between 500ms and 2000ms.
 * @returns {Promise<void>}
 */
export const delay = (min = 500, max = 2000) => {
    const randomTime = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, randomTime));
};
export const countSyllables = (word) => {
    try {
        if (!word) return 1;
        let w = word.toLowerCase();

        if (w.length <= 3) return 1;

        // Common English word ending reductions
        w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
        w = w.replace(/^y/, "");

        const matches = w.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    } catch {
        return 1;
    }
};

/**
 * Interpret Flesch Reading Ease score into human-friendly category.
 * @param {number} score
 * @returns {string}
 */
export const interpretReadability = (score) => {
    if (score >= 90) return "Very Easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly Easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly Difficult";
    if (score >= 30) return "Difficult";
    return "Very Difficult";
};

/**
 * Extract visible text from a cheerio-loaded DOM, removing non-content elements.
 * @param {CheerioStatic} soup
 * @param {object} logger
 * @returns {string}
 */
export const getVisibleText = (soup, logger) => {
    try {
        // Remove non-content & hidden elements
        soup(
            "script, style, noscript, nav, header, footer, aside, form, button, input, select, textarea"
        ).remove();
        soup(
            '[aria-hidden="true"], [role="presentation"], [style*="display:none"], [style*="visibility:hidden"]'
        ).remove();

        return soup.text().replace(/\s+/g, " ").trim();
    } catch (e) {
        if (logger?.warn) logger.warn(`Error extracting visible text: ${e}`);
        return "";
    }
};

/**
 * Common English stop words (deduplicated).
 * Exported as a Set for fast lookups.
 */
export const STOP_WORDS = new Set([
    "a", "about", "above", "after", "again", "all", "am", "an", "and", "any",
    "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
    "her", "here", "here's", "hers", "herself", "him", "himself", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
    "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
    "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
    "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
    "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll",
    "they're", "they've", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
    "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "yours",
    "yourself", "yourselves"
]);

/**
 * Safely extract text content from a cheerio element.
 * @param {Cheerio} element
 * @returns {string}
 */
export const safeGetText = (element) => {
    try {
        return element?.text()?.trim() || "";
    } catch {
        return "";
    }
};

/**
 * Safely extract an attribute from a cheerio element.
 * @param {Cheerio} element
 * @param {string} attribute
 * @returns {string}
 */
export const safeGetAttribute = (element, attribute) => {
    try {
        return element?.attr(attribute) || "";
    } catch {
        return "";
    }
};
