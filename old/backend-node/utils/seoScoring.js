import winston from 'winston';

const logger = winston.createLogger({
    transports: [new winston.transports.Console({ format: winston.format.simple() })],
    level: 'debug',
});

/**
 * Calculates a single, overall SEO score based on various audit results.
 * @param {object} backendData The complete SEO audit report object.
 * @returns {number} The calculated score from 0-100.
 */
export const calculateOverallScore = (backendData) => {
    const pagespeedScore = backendData.pagespeed_audit?.mobile?.performance_score;
    const accessibilityScore = backendData.pagespeed_audit?.mobile?.accessibility_score;
    const lighthouseSeoScore = backendData.pagespeed_audit?.mobile?.seo_score;

    if (pagespeedScore === null || pagespeedScore === undefined || isNaN(pagespeedScore)) {
        logger.warn('PageSpeed data is missing, falling back to heuristic scoring.');
        let heuristicScore = 100;
        const allIssues = [
            ...backendData.metadata_audit.issues,
            ...backendData.heading_audit.issues,
            ...backendData.image_analysis.detailed_issues,
            ...backendData.social_media_tags.issues,
            ...backendData.mobile_responsiveness_audit.issues,
            ...backendData.structured_data_audit.issues,
            ...backendData.local_seo_audit.issues,
            ...backendData.crawlability_and_indexability_audit.issues
        ];
        const deductionMap = { '❌': 5, '⚠️': 2 };
        for (const issue of allIssues) {
            const prefix = issue.substring(0, 2);
            heuristicScore -= deductionMap[prefix] || 0;
        }
        return Math.min(Math.max(heuristicScore, 70), 100);
    }

    let weightedScore = 0;
    let totalWeight = 0;

    const weights = {
        pagespeed: 0.35,
        accessibility: 0.05,
        lighthouseSeo: 0.10,
        customMobile: 0.20,
        customStructuredData: 0.10,
        customSecurity: 0.15,
        customCrawlability: 0.05
    };

    const customContentScore = backendData.content_analysis.total_word_count > 500 && backendData.content_analysis.uniqueness_analysis.is_unique ? 100 : 50;
    const customImageScore = backendData.image_analysis.images_without_alt === 0 ? 100 : 70;
    const customSocialScore = backendData.social_media_tags.issues.length === 0 ? 100 : 70;
    const customMobileScore = backendData.mobile_responsiveness_audit.issues.length === 0 ? 100 : 70;
    const customStructuredDataScore = backendData.structured_data_audit.invalid_schemas.length === 0 ? 100 : 70;
    const customLocalSeoScore = backendData.local_seo_audit.status === '✅ Present' ? 100 : 70;
    const customCrawlabilityScore = backendData.crawlability_and_indexability_audit.issues.length === 0 ? 100 : 70;
    const customSecurityScore = backendData.https_audit?.https_enabled ? 100 : 50;

    weightedScore += (pagespeedScore * weights.pagespeed);
    weightedScore += (accessibilityScore * weights.accessibility);
    weightedScore += (lighthouseSeoScore * weights.lighthouseSeo);
    weightedScore += (customMobileScore * weights.customMobile);
    weightedScore += (customStructuredDataScore * weights.customStructuredData);
    weightedScore += (customSecurityScore * weights.customSecurity);
    weightedScore += (customCrawlabilityScore * weights.customCrawlability);

    totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    return Math.max(Math.min(Math.round(weightedScore / totalWeight), 100), 70);
};
