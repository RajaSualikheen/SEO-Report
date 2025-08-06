import React from 'react';
import { FileText } from 'lucide-react';

export const getCategoryIcon = (categoryName) => {
    switch (categoryName) {
        case 'Technical SEO': return <FileText className="w-6 h-6 text-indigo-500" />;
        case 'Page Speed & Core Web Vitals': return <FileText className="w-6 h-6 text-blue-500" />;
        case 'Content': return <FileText className="w-6 h-6 text-green-500" />;
        case 'Crawlability & Indexability': return <FileText className="w-6 h-6 text-purple-500" />;
        case 'User Experience': return <FileText className="w-6 h-6 text-yellow-500" />;
        case 'Security': return <FileText className="w-6 h-6 text-red-500" />;
        default: return <FileText className="w-6 h-6 text-gray-500" />;
    }
};

export const ElegantDivider = ({ categoryName }) => (
    <div className="flex items-center space-x-4">
        {getCategoryIcon(categoryName)}
        <h2 className="text-2xl font-bold text-slate-900">{categoryName}</h2>
        <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
    </div>
);

export const getCategoryStatus = (sections) => {
    if (!sections || sections.length === 0) return 'bad';
    const hasCritical = sections.some(section => section.status === 'bad');
    const hasWarning = sections.some(section => section.status === 'warning');
    if (hasCritical) return 'bad';
    if (hasWarning) return 'warning';
    return 'good';
};

export const calculateSectionScore = (section, backendData) => {
    let score = 100;

    if (section.id === 'pagespeed-audit') {
        const mobileScore = backendData.pagespeed_audit?.mobile?.performance_score || 0;
        const desktopScore = backendData.pagespeed_audit?.desktop?.performance_score || 0;
        score = Math.round((mobileScore + desktopScore) / 2);
    } else if (section.id === 'title-optimization') {
        if (section.metadataLengthData?.status?.toLowerCase() === 'optimal') score = 100;
        else if (section.metadataLengthData?.status?.toLowerCase() === 'too short' || section.metadataLengthData?.status?.toLowerCase() === 'too long') score = 50;
        else score = 0;
    } else if (section.id === 'meta-description') {
        if (section.metadataLengthData?.status?.toLowerCase() === 'optimal') score = 100;
        else if (section.metadataLengthData?.status?.toLowerCase() === 'too short' || section.metadataLengthData?.status?.toLowerCase() === 'too long') score = 50;
        else score = 0;
    } else if (section.id === 'heading-structure') {
        const h1Count = section.headingCounts?.h1_count || 0;
        if (h1Count === 0) score = 0;
        else if (h1Count > 1 || section.headingIssues?.length > 0) score = 50;
        else score = 100;
    } else if (section.id === 'content-quality-analysis') {
        const readabilityScore = section.contentAnalysisData?.readability_score || 0;
        const hasKeywords = section.contentAnalysisData?.top_keywords?.length > 0;
        const isUnique = section.contentAnalysisData?.uniqueness_analysis?.is_unique;
        score = readabilityScore;
        if (!hasKeywords) score -= 20;
        if (!isUnique) score -= 30;
        score = Math.max(0, score);
    } else if (section.id === 'keyword-analysis') {
        const hasIssues = section.keywordPresenceAnalysis?.some(k => k.recommendations?.length > 0);
        score = hasIssues ? 50 : 100;
    } else if (section.id === 'image-accessibility') {
        const imagesWithoutAlt = section.imageAnalysisData?.images_without_alt || 0;
        score = imagesWithoutAlt > 0 ? 50 : 100;
    } else if (section.id === 'structured-data-schema') {
        score = section.structuredDataAuditData?.ld_json_found ? 100 : 0;
        if (section.structuredDataAuditData?.invalid_schemas?.length > 0) score = 50;
    } else if (section.id === 'local-seo-audit') {
        score = section.localSeoAuditData?.status?.toLowerCase().includes('present') ? 100 : section.localSeoAuditData?.status?.toLowerCase().includes('partial') ? 50 : 0;
    } else if (section.id === 'social-media-integration') {
        const hasOg = section.ogTwitterData?.open_graph?.title?.present && section.ogTwitterData?.open_graph?.image?.present;
        score = hasOg ? 100 : section.ogTwitterData?.open_graph?.title?.present || section.ogTwitterData?.open_graph?.image?.present ? 50 : 0;
    } else if (section.id === 'mobile-responsiveness-audit') {
        score = section.mobileResponsivenessData?.viewport_tag ? 100 : 0;
        if (section.mobileResponsivenessData?.issues?.length > 0) score = 50;
    } else if (section.id === 'https-usage') {
        score = section.httpsAuditData?.https_enabled ? 100 : 0;
    } else if (section.id === 'robots-txt-analysis') {
        score = section.robotsTxtData?.present ? 100 : 0;
        if (section.robotsTxtData?.issues?.length > 0) score = 50;
    } else if (section.id === 'meta-robots-analysis') {
        score = section.metaRobotsData?.is_noindex ? 0 : section.metaRobotsData?.is_nofollow ? 50 : 100;
    } else if (section.id === 'http-status-and-redirects') {
        score = Object.values(section.httpStatusAndRedirectsData || {}).some(r => r.issues.some(i => i.includes('❌'))) ? 0 : Object.values(section.httpStatusAndRedirectsData || {}).some(r => r.issues.some(i => i.includes('⚠️'))) ? 50 : 100;
    } else if (section.id === 'sitemap-validation') {
        score = section.sitemapValidationData?.found ? 100 : 0;
        if (section.sitemapValidationData?.invalid_urls?.length > 0) score = 50;
    } else if (section.id === 'link-audit') {
        score = section.linkAuditData?.broken_links?.length > 0 ? 50 : 100;
    }

    return Math.round(score);
};