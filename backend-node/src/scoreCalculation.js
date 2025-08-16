import logger from './logger.js';

export const calculateOverallScore = (backendData) => {
    const pagespeedScore = backendData.pagespeed_audit?.mobile?.performance_score;
    const accessibilityScore = backendData.pagespeed_audit?.mobile?.accessibility_score;
    const lighthouseSeoScore = backendData.pagespeed_audit?.mobile?.seo_score;
    
    // --- INTEGRATED BACKLINK SCORING LOGIC ---
    const { domain_authority, referring_domains, toxic_backlinks, issues: backlinkIssues } = backendData.backlink_audit || {};
    // Let's declare the variable once.
    let backlinkScore;
    const backlinkRecommendations = [];

    // Penalize score heavily for any critical issues from the API call itself
    if (backlinkIssues?.some(issue => issue.startsWith('❌'))) {
        backlinkScore = 50;
        backlinkRecommendations.push("Critical error retrieving backlink data. Check API key or service provider.");
    }
    
    // Base score on Domain Authority (DA)
    if (domain_authority !== undefined) {
        backlinkScore = domain_authority;
    } else {
        backlinkScore = 0;
        backlinkRecommendations.push("Failed to retrieve Domain Authority. Check the backlink API connection.");
    }

    // Apply adjustments based on other metrics
    if (referring_domains < 10) {
        backlinkScore -= 20;
        backlinkRecommendations.push("Build more high-quality backlinks from a diverse set of referring domains.");
    } else if (referring_domains < 50) {
        backlinkScore -= 10;
        backlinkRecommendations.push("Increase your number of referring domains to improve authority.");
    }

    // Apply a severe penalty for toxic backlinks
    if (toxic_backlinks > 0) {
        backlinkScore -= (toxic_backlinks > 100 ? 50 : 20); // Heuristic penalty
        backlinkRecommendations.push("Disavow toxic backlinks to protect your site's reputation.");
    }
    backlinkScore = Math.max(0, Math.min(100, backlinkScore));
    
    // Combine backlink issues into the recommendations list
    if (backlinkIssues) {
        backlinkIssues.forEach(issue => backlinkRecommendations.push(issue));
    }
    // --------------------------------------------------

    // --- NEW: A11Y Scoring ---
    const a11yScore = backendData.a11y_audit?.score ?? 50; // Use a default of 50 if the audit failed
    // --- END NEW ---

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
            ...backendData.crawlability_and_indexability_audit.issues,
            ...backlinkRecommendations,
            ...backendData.a11y_audit?.issues // Include accessibility issues
        ];
        if (backendData.crawl_audit?.orphan_pages?.length > 0) {
            allIssues.push(`⚠️ Found ${backendData.crawl_audit.orphan_pages.length} potential orphan pages.`);
        }
        const deductionMap = { '❌': 5, '⚠️': 2 };
        for (const issue of allIssues) {
            const prefix = issue.substring(0, 2);
            heuristicScore -= deductionMap[prefix] || 0;
        }
        return Math.min(Math.max(heuristicScore, 70), 100);
    }

    let weightedScore = 0;
    const weights = {
        pagespeed: 0.35,
        accessibility: 0.05,
        lighthouseSeo: 0.10,
        customMobile: 0.15,
        customStructuredData: 0.10,
        customSecurity: 0.10,
        customCrawlability: 0.05,
        backlinks: 0.10,
        crawlAudit: 0.05,
        a11y: 0.10 // New weight for Accessibility
    };

    const customCrawlAuditScore = backendData.crawl_audit?.orphan_pages?.length > 0 ? 50 : 100;
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
    weightedScore += (backlinkScore * weights.backlinks);
    weightedScore += (customCrawlAuditScore * weights.crawlAudit);
    weightedScore += (a11yScore * weights.a11y); // Add the accessibility score

    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

    return Math.max(Math.min(Math.round(weightedScore / totalWeight), 100), 70);
};
