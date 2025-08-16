export const analyzeMetadataLength = (title, metaDescription) => {
    const metadataAnalysis = {
        title: { text: title, char_count: 0, status: "Missing", recommendation: "Aim for 30-60 characters." },
        meta_description: { text: metaDescription, char_count: 0, status: "Missing", recommendation: "Aim for 50-160 characters." }
    };

    if (title) {
        const titleLen = title.length;
        metadataAnalysis.title.char_count = titleLen;
        if (titleLen < 30) {
            metadataAnalysis.title.status = "Too Short";
            metadataAnalysis.title.recommendation = `Expand with keywords. Aim for 30-60 characters (${titleLen} currently).`;
        } else if (titleLen <= 60) {
            metadataAnalysis.title.status = "Optimal";
        } else {
            metadataAnalysis.title.status = "Too Long";
            metadataAnalysis.title.recommendation = `Condense to under 60 characters (${titleLen} currently).`;
        }
    }

    if (metaDescription) {
        const metaDescLen = metaDescription.length;
        metadataAnalysis.meta_description.char_count = metaDescLen;
        if (metaDescLen < 50) {
            metadataAnalysis.meta_description.status = "Too Short";
            metadataAnalysis.meta_description.recommendation = `Provide more detail. Aim for 50-160 characters (${metaDescLen} currently).`;
        } else if (metaDescLen <= 160) {
            metadataAnalysis.meta_description.status = "Optimal";
        } else {
            metadataAnalysis.meta_description.status = "Too Long";
            metadataAnalysis.meta_description.recommendation = `Reduce to under 160 characters (${metaDescLen} currently).`;
        }
    }

    return metadataAnalysis;
};