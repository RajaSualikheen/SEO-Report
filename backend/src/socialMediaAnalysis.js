import { safeGetAttribute } from './utils.js';

/**
 * Create a default metadata field structure
 */
const defaultField = () => ({
    present: false,
    content: "",
    length: 0,
    status: "Missing"
});

/**
 * Evaluate length-based status
 */
const evaluateLength = (value, min, max) => {
    if (!value) return "Missing";
    if (value.length < min) return "Too Short";
    if (value.length > max) return "Too Long";
    return "Optimal";
};

/**
 * Extract a meta tag value
 */
const extractMetaTag = (soup, selector, type = "content") =>
    safeGetAttribute(soup(selector), type);

/**
 * Analyze Open Graph + Twitter metadata
 */
export const analyzeOpenGraphTwitter = (soup) => {
    const analysis = {
        open_graph: {
            title: defaultField(),
            description: defaultField(),
            image: defaultField(),
            url: defaultField(),
            type: defaultField(),
            site_name: defaultField(),
        },
        twitter_cards: {
            card: defaultField(),
            title: defaultField(),
            description: defaultField(),
            image: defaultField(),
            creator: defaultField(),
            site: defaultField(),
        },
        issues: [],
        recommendations: []
    };

    // -------------------
    // OPEN GRAPH
    // -------------------
    const ogTitle = extractMetaTag(soup, 'meta[property="og:title"]');
    if (ogTitle) {
        analysis.open_graph.title = {
            present: true,
            content: ogTitle,
            length: ogTitle.length,
            status: evaluateLength(ogTitle, 30, 60)
        };
    }

    const ogDescription = extractMetaTag(soup, 'meta[property="og:description"]');
    if (ogDescription) {
        analysis.open_graph.description = {
            present: true,
            content: ogDescription,
            length: ogDescription.length,
            status: evaluateLength(ogDescription, 50, 160)
        };
    }

    const ogImage = extractMetaTag(soup, 'meta[property="og:image"]');
    if (ogImage) {
        analysis.open_graph.image = {
            present: true,
            content: ogImage,
            status: ogImage.trim() !== "" ? "Present" : "Empty"
        };
    }

    ["url", "type", "site_name"].forEach((prop) => {
        const value = extractMetaTag(soup, `meta[property="og:${prop}"]`);
        if (value) {
            analysis.open_graph[prop] = {
                present: true,
                content: value,
                status: "Present"
            };
        }
    });

    // -------------------
    // TWITTER
    // -------------------
    const twitterCard = extractMetaTag(soup, 'meta[name="twitter:card"]');
    if (twitterCard) {
        analysis.twitter_cards.card = {
            present: true,
            content: twitterCard,
            status: ["summary", "summary_large_image", "app", "player"].includes(twitterCard)
                ? "Valid"
                : "Invalid"
        };
    }

    const twitterTitle = extractMetaTag(soup, 'meta[name="twitter:title"]');
    if (twitterTitle) {
        analysis.twitter_cards.title = {
            present: true,
            content: twitterTitle,
            length: twitterTitle.length,
            status: evaluateLength(twitterTitle, 30, 70)
        };
    }

    const twitterDescription = extractMetaTag(soup, 'meta[name="twitter:description"]');
    if (twitterDescription) {
        analysis.twitter_cards.description = {
            present: true,
            content: twitterDescription,
            length: twitterDescription.length,
            status: evaluateLength(twitterDescription, 50, 200)
        };
    }

    const twitterImage = extractMetaTag(soup, 'meta[name="twitter:image"]');
    if (twitterImage) {
        analysis.twitter_cards.image = {
            present: true,
            content: twitterImage,
            status: twitterImage.trim() !== "" ? "Present" : "Empty"
        };
    }

    ["creator", "site"].forEach((prop) => {
        const value = extractMetaTag(soup, `meta[name="twitter:${prop}"]`);
        if (value) {
            analysis.twitter_cards[prop] = {
                present: true,
                content: value,
                status: "Present"
            };
        }
    });

    // -------------------
    // ISSUES & RECOMMENDATIONS
    // -------------------
    if (!analysis.open_graph.title.present) {
        analysis.issues.push("Missing Open Graph title (og:title)");
        analysis.recommendations.push("Add og:title meta tag for better social media sharing");
    }

    if (!analysis.open_graph.description.present) {
        analysis.issues.push("Missing Open Graph description (og:description)");
        analysis.recommendations.push("Add og:description meta tag to control social media preview text");
    }

    if (!analysis.open_graph.image.present) {
        analysis.issues.push("Missing Open Graph image (og:image)");
        analysis.recommendations.push("Add og:image meta tag with a high-quality image (1200x630px recommended)");
    }

    if (!analysis.twitter_cards.card.present) {
        analysis.issues.push("Missing Twitter Card type (twitter:card)");
        analysis.recommendations.push("Add twitter:card meta tag (recommend 'summary_large_image')");
    }

    if (!analysis.twitter_cards.image.present && analysis.open_graph.image.present) {
        analysis.recommendations.push("Consider adding twitter:image or it will fallback to og:image");
    }

    return analysis;
};
