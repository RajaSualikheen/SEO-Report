import { safeGetText, safeGetAttribute } from './utils.js';

export const analyzeOpenGraphTwitter = (soup) => {
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