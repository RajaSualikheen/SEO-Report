/**
 * Utility to check metadata length and provide status + recommendations
 */
const evaluateLength = (text, min, max, label) => {
    if (!text) {
        return {
            text: "",
            char_count: 0,
            status: "Missing",
            recommendation: `Provide a ${label}. Aim for ${min}-${max} characters.`
        };
    }

    const len = text.length;
    let status = "Optimal";
    let recommendation = "";

    if (len < min) {
        status = "Too Short";
        recommendation = `Expand with relevant keywords. Aim for ${min}-${max} characters (currently ${len}).`;
    } else if (len > max) {
        status = "Too Long";
        recommendation = `Condense to under ${max} characters (currently ${len}).`;
    } else {
        recommendation = `Good length. (${len} characters)`;
    }

    return { text, char_count: len, status, recommendation };
};

/**
 * Approximates pixel width (Google truncates at ~580px for titles).
 * Rough heuristic: avg. character ≈ 7px.
 */
const estimatePixelWidth = (text) => {
    if (!text) return 0;
    return Math.round(text.length * 7);
};

/**
 * Analyze SEO metadata (title + description).
 */
export const analyzeMetadataLength = (title, metaDescription) => {
    const metadataAnalysis = {
        title: evaluateLength(title, 30, 60, "title"),
        meta_description: evaluateLength(metaDescription, 50, 160, "meta description"),
        issues: []
    };

    // Extra: Pixel-based truncation warning for title
    const titlePixels = estimatePixelWidth(title);
    if (titlePixels > 580) {
        metadataAnalysis.issues.push(
            `⚠️ Title may be truncated in SERPs (~${titlePixels}px wide, limit ≈580px).`
        );
    }

    if (!title) {
        metadataAnalysis.issues.push("❌ Missing <title> tag.");
    }
    if (!metaDescription) {
        metadataAnalysis.issues.push("❌ Missing <meta name=\"description\"> tag.");
    }

    return metadataAnalysis;
};
