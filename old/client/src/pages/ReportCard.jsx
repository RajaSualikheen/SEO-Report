import React, { useState } from 'react';
import {
    CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, Link as LinkIcon,
    ExternalLink, MinusCircle, Smartphone, Code, Info, MapPin, Phone, Shield, TerminalSquare,
    Globe, Rss, Layers, FileText, AlignLeft, BarChart2, Zap, Repeat as RepeatIcon, Link2, Lightbulb, CodeIcon, FileSearch, FileText as FileTextIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ReportCard = ({
    title, status, explanation, action,
    contentAnalysisData, onOpenTopKeywordsModal, onOpenSuggestionsModal,
    headingCounts, headingOrder, headingIssues, onOpenHeadingsModal,
    speedAuditData, sitemapData, linkAuditData, onOpenBrokenLinksModal,
    ogTwitterData, mobileResponsivenessData, onOpenFixedWidthElementsModal, onOpenResponsivenessIssuesModal,
    structuredDataAuditData, metadataLengthData, localSeoAuditData, keywordReportData, overallScore,
    // CRAWLABILITY PROPS
    robotsTxtData, metaRobotsData, httpStatusAndRedirectsData, sitemapValidationData, onOpenRedirectsModal,
    canonicalTagData,
    // NEW PAGESPEED PROP
    pagespeedData,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    let statusIcon, statusColorClass, statusText, badgeColorClass;
    switch (status) {
        case 'good':
            statusIcon = <CheckCircle className="w-8 h-8 text-green-500" />;
            statusColorClass = 'text-green-500';
            statusText = 'Good';
            badgeColorClass = 'bg-green-500';
            break;
        case 'warning':
            statusIcon = <AlertTriangle className="w-8 h-8 text-orange-500" />;
            statusColorClass = 'text-orange-500';
            statusText = 'Needs Fix';
            badgeColorClass = 'bg-orange-500';
            break;
        case 'bad':
            statusIcon = <AlertTriangle className="w-8 h-8 text-red-500" />;
            statusColorClass = 'text-red-500';
            statusText = 'Critical Issue';
            badgeColorClass = 'bg-red-500';
            break;
        default:
            statusIcon = null;
            statusColorClass = 'text-gray-500';
            statusText = 'N/A';
            badgeColorClass = 'bg-gray-500';
    }

    const getReadabilityStatusText = (score) => {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    };

    const getReadabilityColorClass = (score) => {
        if (score >= 70) return 'text-green-500';
        if (score >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const getAuditIcon = (condition) => {
        return condition ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
    };

    const getAuditIssueIcon = (issueText) => {
        if (issueText.startsWith('❌')) return <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
        if (issueText.startsWith('⚠️')) return <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />;
        return <CheckCircle className="w-5 h-5 text-green-500 mr-2" />;
    };
    
    // Function to map a card title to a specific icon
    const getCardTitleIcon = (cardTitle) => {
        switch (cardTitle) {
            case 'Title Optimization': return <FileText className="w-5 h-5 text-indigo-500" />;
            case 'Meta Description': return <AlignLeft className="w-5 h-5 text-indigo-500" />;
            case 'Content Structure': return <Layers className="w-5 h-5 text-indigo-500" />;
            case 'Keyword Analysis': return <BarChart2 className="w-5 h-5 text-indigo-500" />;
            case 'Content Quality Analysis': return <BookOpen className="w-5 h-5 text-indigo-500" />;
            case 'Image Accessibility': return <Lightbulb className="w-5 h-5 text-green-500" />;
            case 'Speed Performance': return <Zap className="w-5 h-5 text-green-500" />;
            case 'Page Speed & Core Web Vitals': return <Zap className="w-5 h-5 text-green-500" />;
            case 'Link Profile': return <Link2 className="w-5 h-5 text-green-500" />;
            case 'Structured Data Schema': return <CodeIcon className="w-5 h-5 text-green-500" />;
            case 'Local SEO': return <MapPin className="w-5 h-5 text-green-500" />;
            case 'Mobile Experience': return <Smartphone className="w-5 h-5 text-yellow-500" />;
            case 'Social Media Integration': return <Rss className="w-5 h-5 text-yellow-500" />;
            case 'Canonical URL': return <LinkIcon className="w-5 h-5 text-red-500" />;
            case 'HTTPS Usage': return <Shield className="w-5 h-5 text-red-500" />;
            case 'Favicon': return <FileCode className="w-5 h-5 text-red-500" />;
            case 'Robots.txt Analysis': return <FileSearch className="w-5 h-5 text-purple-500" />;
            case 'Meta Robots Tag': return <Layers className="w-5 h-5 text-purple-500" />;
            case 'HTTP Status & Redirects': return <RepeatIcon className="w-5 h-5 text-purple-500" />;
            case 'Sitemap Validation': return <Globe className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const defaultSocialImage = 'https://via.placeholder.com/600x315?text=Social+Image+Preview';

    // Helper to get score icon
    const getPageSpeedIcon = (score) => {
        if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (score >= 50) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    };

    // Keyword Density Chart Data
    const keywordChartData = contentAnalysisData?.top_keywords?.length > 0 ? {
        labels: contentAnalysisData.top_keywords.map(kw => kw.keyword),
        datasets: [{
            label: 'Keyword Density (%)',
            data: contentAnalysisData.top_keywords.map(kw => kw.density),
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
        }]
    } : null;

    const keywordChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top Keywords Density', color: '#0F172A' },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Density (%)', color: '#0F172A' },
                ticks: { color: '#0F172A' },
            },
            x: {
                ticks: { color: '#0F172A', autoSkip: false, maxRotation: 45, minRotation: 45 },
            },
        },
    };

    // Tooltip Component
    const Tooltip = ({ children, text }) => {
        const [showTooltip, setShowTooltip] = useState(false);
        return (
            <div className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
                {children}
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 dark:bg-gray-200 dark:text-gray-800"
                    >
                        {text}
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <motion.div
            className={`w-full relative bg-white p-6 rounded-xl shadow-md flex flex-col text-left border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-lg`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <span className={`absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full text-white ${badgeColorClass}`}>
                {statusText}
            </span>

            <div className="flex items-center mb-2">
                <span className={`p-2 rounded-full`}>
                    {getCardTitleIcon(title)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 ml-2 leading-tight">
                    {title}
                </h3>
            </div>

            <p className={`text-sm text-gray-600 mb-4 flex-shrink-0`}>
                {explanation || `Click "View Details" for more.`}
            </p>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-600 mb-4"
                        style={{ overflow: 'visible' }}
                    >
                        {title === 'Title Optimization' && metadataLengthData && (
                            <div className="space-y-2 py-2">
                                <p className="flex items-center text-sm">
                                    <Info className="w-4 h-4 mr-1 text-gray-500" />
                                    **Char Count:** {metadataLengthData.char_count} characters
                                </p>
                                <p className="text-sm italic">
                                    **Status:** <span className={
                                        metadataLengthData.status.toLowerCase() === 'optimal' ? 'text-green-500' :
                                        metadataLengthData.status.toLowerCase() === 'too short' ? 'text-orange-500' :
                                        'text-red-500'
                                    }>{metadataLengthData.status}</span>
                                </p>
                                <p className="text-sm">
                                    **Recommendation:** {metadataLengthData.recommendation}
                                </p>
                                {metadataLengthData.text && metadataLengthData.status.toLowerCase() !== 'optimal' && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Meta Description' && metadataLengthData && (
                            <div className="space-y-2 py-2">
                                <p className="flex items-center text-sm">
                                    <Info className="w-4 h-4 mr-1 text-gray-500" />
                                    **Char Count:** {metadataLengthData.char_count} characters
                                </p>
                                <p className="text-sm italic">
                                    **Status:** <span className={
                                        metadataLengthData.status.toLowerCase() === 'optimal' ? 'text-green-500' :
                                        metadataLengthData.status.toLowerCase() === 'too short' ? 'text-orange-500' :
                                        'text-red-500'
                                    }>{metadataLengthData.status}</span>
                                </p>
                                <p className="text-sm">
                                    **Recommendation:** {metadataLengthData.recommendation}
                                </p>
                                {metadataLengthData.text && metadataLengthData.status.toLowerCase() !== 'optimal' && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Keyword Analysis' && keywordReportData && (
                            <div className="space-y-4 py-2">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <p className="flex items-center">
                                        {getAuditIcon(keywordReportData.presence?.inTitle)}
                                        Title: {keywordReportData.presence?.inTitle ? 'Present' : 'Missing'}
                                    </p>
                                    <p className="flex items-center">
                                        {getAuditIcon(keywordReportData.presence?.inMetaDescription)}
                                        Meta Description: {keywordReportData.presence?.inMetaDescription ? 'Present' : 'Missing'}
                                    </p>
                                    <p className="flex items-center">
                                        {getAuditIcon(keywordReportData.presence?.inH1)}
                                        H1: {keywordReportData.presence?.inH1 ? 'Present' : 'Missing'}
                                    </p>
                                    <p className="flex items-center">
                                        {getAuditIcon(keywordReportData.presence?.inUrl)}
                                        URL: {keywordReportData.presence?.inUrl ? 'Present' : 'Missing'}
                                    </p>
                                    <p className="flex items-center">
                                        {getAuditIcon(keywordReportData.presence?.inContent)}
                                        Content: {keywordReportData.presence?.inContent ? 'Present' : 'Missing'}
                                    </p>
                                    <p className="flex items-center">
                                        <Info className="w-4 h-4 mr-1 text-gray-500" />
                                        Density: {keywordReportData.density?.density || 0}%
                                    </p>
                                </div>
                                {keywordReportData.density?.recommendation && (
                                    <p className="text-sm italic text-gray-600">
                                        **Recommendation:** {keywordReportData.density.recommendation}
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Content Quality Analysis' && contentAnalysisData && (
                            <div className="space-y-4 py-2">
                                <div className="bg-gray-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                                    <div className="flex-1 mb-2 md:mb-0">
                                        <p className="text-xs font-medium text-gray-700 flex items-center justify-center md:justify-start">
                                            <Hash className="w-4 h-4 mr-1 text-gray-500" />
                                            <span className="font-bold text-gray-900">Word Count:</span>
                                        </p>
                                        <p className="text-xl font-extrabold text-indigo-700 mt-1">
                                            {contentAnalysisData.total_word_count || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0 md:pl-4">
                                        <p className="text-xs font-medium text-gray-700 flex items-center justify-center md:justify-start">
                                            <BookOpen className="w-4 h-4 mr-1 text-gray-500" />
                                            <span className="font-bold text-gray-900">Readability:</span>
                                        </p>
                                        <p className={`text-xl font-extrabold ${getReadabilityColorClass(contentAnalysisData.flesch_reading_ease_score)} mt-1`}>
                                            {getReadabilityStatusText(contentAnalysisData.flesch_reading_ease_score)}
                                            <span className="text-sm text-gray-500 ml-1">
                                                ({contentAnalysisData.flesch_reading_ease_score || 'N/A'})
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {contentAnalysisData.top_keywords && contentAnalysisData.top_keywords.length > 0 && onOpenTopKeywordsModal && (
                                    <button
                                        onClick={() => onOpenTopKeywordsModal(contentAnalysisData?.top_keywords)}
                                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-2" /> View Top Keywords
                                    </button>
                                )}
                                {contentAnalysisData.keyword_suggestions && contentAnalysisData.keyword_suggestions.length > 0 && onOpenSuggestionsModal && (
                                    <button
                                        onClick={() => onOpenSuggestionsModal(contentAnalysisData?.keyword_suggestions)}
                                        className="w-full bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-purple-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                                    >
                                        <BookOpen className="w-4 h-4 mr-2" /> View Suggestions
                                    </button>
                                )}
                            </div>
                        )}

                        {title === 'Content Structure' && headingCounts && (
                            <div className="space-y-4 py-2">
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div><p className="font-medium">H1</p><p className="text-xl font-bold text-indigo-600">{headingCounts.h1_count}</p></div>
                                    <div><p className="font-medium">H2</p><p className="text-xl font-bold text-indigo-600">{headingCounts.h2_count}</p></div>
                                    <div><p className="font-medium">H3</p><p className="text-xl font-bold text-indigo-600">{headingCounts.h3_count}</p></div>
                                </div>
                                {headingOrder && headingOrder.length > 0 && onOpenHeadingsModal && (
                                    <button
                                        onClick={() => onOpenHeadingsModal(headingOrder, headingIssues)}
                                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <AlignLeft className="w-4 h-4 mr-2" /> View Full Structure
                                    </button>
                                )}
                                {headingIssues && headingIssues.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                                        <ul className="list-disc list-inside text-red-600 text-sm">
                                            {headingIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Image Accessibility' && explanation && (
                            <div className="space-y-2 py-2">
                                <p className="text-sm">{explanation}</p>
                            </div>
                        )}

                        {title === 'Speed Performance' && speedAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center">
                                    {getAuditIcon(!speedAuditData.has_inline_styles)}
                                    Inline Styles: {speedAuditData.has_inline_styles ? 'Found' : 'None'}
                                </p>
                                <p className="flex items-center">
                                    {getAuditIcon(!speedAuditData.has_inline_scripts)}
                                    Inline Scripts: {speedAuditData.has_inline_scripts ? 'Found' : 'None'}
                                </p>
                                <p className="flex items-center text-green-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    External CSS: {speedAuditData.external_css_count} files
                                </p>
                                <p className="flex items-center text-green-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                    External JS: {speedAuditData.external_js_count} files
                                </p>
                                {speedAuditData.issues && speedAuditData.issues.length > 0 && (
                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-yellow-700 mb-1">Speed Issues:</h5>
                                        <ul className="list-disc list-inside text-yellow-600 text-sm">
                                            {speedAuditData.issues.map((issue, index) => (
                                                <li key={index} className="flex items-start">
                                                    {getAuditIssueIcon(issue)}
                                                    <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NEW SECTION: Page Speed & Core Web Vitals */}
                        {title === 'Page Speed & Core Web Vitals' && pagespeedData && (
                            <div className="space-y-4 py-2 text-sm">
                                {pagespeedData.mobile ? (
                                    <div className="space-y-2">
                                        <p className="flex items-center font-bold">
                                            {getPageSpeedIcon(pagespeedData.mobile.performance_score)}
                                            Mobile Performance: <span className="ml-1">{pagespeedData.mobile.performance_score}</span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-xs ml-7">
                                            <p>LCP: {pagespeedData.mobile.metrics.LCP}</p>
                                            <p>FID: {pagespeedData.mobile.metrics.FID}</p>
                                            <p>CLS: {pagespeedData.mobile.metrics.CLS}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-red-500">Mobile data not available.</p>
                                )}
                                {pagespeedData.desktop ? (
                                    <div className="space-y-2 pt-4">
                                        <p className="flex items-center font-bold">
                                            {getPageSpeedIcon(pagespeedData.desktop.performance_score)}
                                            Desktop Performance: <span className="ml-1">{pagespeedData.desktop.performance_score}</span>
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 text-xs ml-7">
                                            <p>LCP: {pagespeedData.desktop.metrics.LCP}</p>
                                            <p>FID: {pagespeedData.desktop.metrics.FID}</p>
                                            <p>CLS: {pagespeedData.desktop.metrics.CLS}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-red-500">Desktop data not available.</p>
                                )}
                            </div>
                        )}

                        {title === 'Link Profile' && linkAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center">
                                    <LinkIcon className="w-4 h-4 text-blue-500 mr-2" />
                                    Internal Links: {linkAuditData.internal_links_count}
                                </p>
                                <p className="flex items-center">
                                    <ExternalLink className="w-4 h-4 text-blue-500 mr-2" />
                                    External Links: {linkAuditData.external_links_count}
                                </p>
                                {linkAuditData.broken_links_count > 0 && onOpenBrokenLinksModal ? (
                                    <>
                                        <p className="flex items-center text-red-600 font-semibold">
                                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                            Broken Links: {linkAuditData.broken_links_count} found
                                        </p>
                                        <button
                                            onClick={() => onOpenBrokenLinksModal(linkAuditData.broken_links)}
                                            className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-red-600 transition duration-300 flex items-center justify-center text-sm"
                                        >
                                            <MinusCircle className="w-4 h-4 mr-2" /> View Broken Links
                                        </button>
                                    </>
                                ) : (
                                    <p className="flex items-center text-green-600 font-semibold">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                        No broken links found.
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Structured Data Schema' && structuredDataAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                {structuredDataAuditData.ld_json_found ? (
                                    structuredDataAuditData.schema_types.length > 0 ? (
                                        <>
                                            <p className="flex items-center text-green-600 font-semibold">
                                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                Schema Found:
                                            </p>
                                            <ul className="list-disc list-inside ml-7">
                                                {structuredDataAuditData.schema_types.map((type, index) => (
                                                    <li key={index} className="text-gray-700">
                                                        `@type`: {type}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    ) : (
                                        <p className="flex items-center text-orange-600 font-semibold">
                                            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                                            JSON-LD found, but no `@type` property detected or types were empty.
                                        </p>
                                    )
                                ) : (
                                    <p className="flex items-center text-red-600 font-semibold">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                        No structured data (JSON-LD) schema found.
                                    </p>
                                )}
                                {structuredDataAuditData.issues && structuredDataAuditData.issues.length > 0 && (
                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-yellow-700 mb-1">Structured Data Issues:</h5>
                                        <ul className="list-disc list-inside text-yellow-600 text-sm">
                                            {structuredDataAuditData.issues.map((issue, index) => (
                                                <li key={index} className="flex items-start">
                                                    {getAuditIssueIcon(issue)}
                                                    <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Local SEO' && localSeoAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="font-semibold text-base mb-2">Key Local SEO Elements:</p>
                                <p className="flex items-center">
                                    {getAuditIcon(localSeoAuditData.local_business_schema_found || localSeoAuditData.organization_schema_found)}
                                    Schema Markup: {localSeoAuditData.local_business_schema_found ? 'LocalBusiness' : localSeoAuditData.organization_schema_found ? 'Organization' : 'Not Found'}
                                </p>
                                <p className="flex items-center">
                                    {getAuditIcon(localSeoAuditData.physical_address_found)}
                                    Physical Address: {localSeoAuditData.physical_address_found ? 'Found' : 'Missing'}
                                </p>
                                <p className="flex items-center">
                                    {getAuditIcon(localSeoAuditData.phone_number_found)}
                                    Phone Number: {localSeoAuditData.phone_number_found ? 'Found' : 'Missing'}
                                </p>
                                {localSeoAuditData.geo_coordinates_found && (
                                    <p className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                        Geo Coordinates: Found in schema
                                    </p>
                                )}
                                {localSeoAuditData.issues && localSeoAuditData.issues.length > 0 && (
                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-yellow-700 mb-1">Local SEO Issues & Tips:</h5>
                                        <ul className="list-disc list-inside text-yellow-600 text-sm">
                                            {localSeoAuditData.issues.map((issue, index) => (
                                                <li key={index} className="flex items-start">
                                                    {getAuditIssueIcon(issue)}
                                                    <span>{issue.replace('❌ ', '').replace('⚠️ ', '').replace('ℹ️ ', '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Social Media Integration' && ogTwitterData && (
                            <div className="space-y-3 py-2 text-sm">
                                {(ogTwitterData.open_graph?.title?.present || ogTwitterData.twitter_cards?.title?.present) && (ogTwitterData.open_graph?.image?.present || ogTwitterData.twitter_cards?.image?.present) ? (
                                    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                                        <img
                                            src={ogTwitterData.open_graph?.image?.content || ogTwitterData.twitter_cards?.image?.content || 'https://via.placeholder.com/600x315?text=Social+Image+Preview'}
                                            alt="Social Media Preview"
                                            className="w-full h-auto object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x315?text=Social+Image+Preview'; }}
                                        />
                                        <div className="p-3 bg-gray-50">
                                            <p className="text-md font-bold text-gray-900 mb-1">
                                                {ogTwitterData.open_graph?.title?.content || ogTwitterData.twitter_cards?.title?.content || 'No Title Provided'}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {ogTwitterData.open_graph?.description?.content || ogTwitterData.twitter_cards?.description?.content || 'No Description Provided'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="flex items-center text-red-600 font-semibold text-center">
                                        <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                                        No social meta preview found.
                                    </p>
                                )}
                                {ogTwitterData.issues && ogTwitterData.issues.length > 0 && (
                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-yellow-700 mb-1">Social Meta Issues:</h5>
                                        <ul className="list-disc list-inside text-yellow-600 text-sm">
                                            {ogTwitterData.issues.map((issue, index) => (
                                                <li key={index} className="flex items-start">
                                                    {getAuditIssueIcon(issue)}
                                                    <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Mobile Experience' && mobileResponsivenessData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center">
                                    {getAuditIcon(mobileResponsivenessData.has_viewport_meta)}
                                    Viewport Meta: {mobileResponsivenessData.has_viewport_meta ? 'Found' : 'Missing'}
                                </p>
                                {mobileResponsivenessData.has_viewport_meta && (
                                    <p className="ml-7 text-xs text-gray-600 break-all">
                                        Content: "{mobileResponsivenessData.viewport_content || 'N/A'}"
                                    </p>
                                )}
                                {mobileResponsivenessData.fixed_width_elements.length > 0 && onOpenFixedWidthElementsModal ? (
                                    <>
                                        <p className="flex items-center text-red-600 font-semibold">
                                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                            Fixed-Width Elements: {mobileResponsivenessData.fixed_width_elements.length}
                                        </p>
                                        <button
                                            onClick={() => onOpenFixedWidthElementsModal(mobileResponsivenessData.fixed_width_elements)}
                                            className="w-full bg-amber-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-amber-600 transition duration-300 flex items-center justify-center text-sm"
                                        >
                                            <FileCode className="w-4 h-4 mr-2" /> View Fixed Elements
                                        </button>
                                    </>
                                ) : (
                                    <p className="flex items-center text-green-600 font-semibold">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                        No fixed-width elements.
                                    </p>
                                )}
                                {mobileResponsivenessData.issues && mobileResponsivenessData.issues.length > 0 && onOpenResponsivenessIssuesModal ? (
                                    <>
                                        <p className="flex items-center text-yellow-600 font-semibold mt-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                                            Responsiveness Issues: {mobileResponsivenessData.issues.length}
                                        </p>
                                        <button
                                            onClick={() => onOpenResponsivenessIssuesModal(mobileResponsivenessData.issues)}
                                            className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-yellow-600 transition duration-300 flex items-center justify-center text-sm"
                                        >
                                            <Smartphone className="w-4 h-4 mr-2" /> View Issues
                                        </button>
                                    </>
                                ) : (
                                    <p className="flex items-center text-green-600 font-semibold mt-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                        No responsiveness issues.
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Canonical URL' && canonicalTagData && (
                            <div className="space-y-2 py-2">
                                <p className="text-sm">{explanation}</p>
                                <p className="flex items-center text-sm">
                                    <Info className="w-4 h-4 mr-1 text-gray-500" />
                                    **Canonical URL:** {canonicalTagData.url || 'Not Found'}
                                </p>
                            </div>
                        )}
                        
                        {title === 'HTTPS Usage' && explanation && (
                            <div className="space-y-2 py-2">
                                <p className="text-sm">{explanation}</p>
                            </div>
                        )}
                        
                        {title === 'Favicon' && explanation && (
                            <div className="space-y-2 py-2">
                                <p className="text-sm">{explanation}</p>
                            </div>
                        )}

                        {/* CRAWLABILITY & INDEXABILITY DETAILS */}
                        {title === 'Robots.txt Analysis' && robotsTxtData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center font-semibold">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${robotsTxtData.present ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    File Status: {robotsTxtData.present ? 'Found' : 'Not Found'}
                                </p>
                                {robotsTxtData.present && (
                                    <>
                                        <p className="font-semibold mt-2">Parsed Rules (User-agent: *):</p>
                                        {robotsTxtData.rules['*'] && (
                                            <div className="ml-4 p-2 bg-gray-100 rounded-md">
                                                {robotsTxtData.rules['*'].disallow.map((rule, j) => (
                                                    <p key={j} className="text-red-500 font-mono">Disallow: {rule}</p>
                                                ))}
                                                {robotsTxtData.rules['*'].allow.map((rule, k) => (
                                                    <p key={k} className="text-green-500 font-mono">Allow: {rule}</p>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                                {robotsTxtData.sitemap_path && (
                                    <p className="flex items-center mt-3">
                                        <LinkIcon className="w-4 h-4 mr-2" /> Sitemap: <a href={robotsTxtData.sitemap_path} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline ml-1 break-all">{robotsTxtData.sitemap_path}</a>
                                    </p>
                                )}
                                {robotsTxtData.issues && robotsTxtData.issues.length > 0 && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                                        <ul className="list-disc list-inside text-red-600 text-sm">
                                            {robotsTxtData.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Meta Robots Tag' && metaRobotsData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center font-semibold">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${metaRobotsData.present ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    Tag Status: {metaRobotsData.present ? 'Present' : 'Not Found'}
                                </p>
                                {metaRobotsData.present && (
                                    <p className="ml-4 font-mono text-gray-700 break-all">
                                        Content: "{metaRobotsData.content}"
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${metaRobotsData.is_noindex ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {metaRobotsData.is_noindex ? '❌ Noindex' : '✅ Index'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${metaRobotsData.is_nofollow ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                        {metaRobotsData.is_nofollow ? '⚠️ Nofollow' : '✅ Follow'}
                                    </span>
                                </div>
                                {metaRobotsData.issues && metaRobotsData.issues.length > 0 && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                                        <ul className="list-disc list-inside text-red-600 text-sm">
                                            {metaRobotsData.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'HTTP Status & Redirects' && httpStatusAndRedirectsData && (
                            <div className="space-y-3 py-2 text-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.keys(httpStatusAndRedirectsData).slice(0, 2).map((url, index) => {
                                        const chain = httpStatusAndRedirectsData[url];
                                        const isGood = chain.final_status_code >= 200 && chain.final_status_code < 300 && chain.redirect_chain.length <= 2;
                                        const statusColor = isGood ? 'bg-green-100 text-green-800' : chain.final_status_code >= 400 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
                                        const statusText = chain.final_status_code === 200 ? '200 OK' : chain.final_status_code >= 300 && chain.final_status_code < 400 ? `${chain.final_status_code} Redirect` : `${chain.final_status_code} Error`;
                                        const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').substring(0, 30) + '...';

                                        return (
                                            <div key={index} className="p-3 bg-gray-100 rounded-lg">
                                                <p className="font-semibold text-gray-900 truncate">{url.length > 40 ? displayUrl : url}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{statusText}</span>
                                                    {chain.has_redirect_chain && (
                                                        <span className="text-gray-500 text-xs flex items-center">
                                                            <RepeatIcon className="w-3 h-3 mr-1" /> {chain.redirect_chain.length - 1} Hops
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {onOpenRedirectsModal && (
                                    <button
                                        onClick={onOpenRedirectsModal}
                                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <TerminalSquare className="w-4 h-4 mr-2" /> View Redirects
                                    </button>
                                )}
                            </div>
                        )}

                        {title === 'Sitemap Validation' && sitemapValidationData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center font-semibold">
                                    {sitemapValidationData.found ? (
                                        <>
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                            Sitemap Found: <span className="ml-1 text-green-500">{sitemapValidationData.url_count} URLs</span>
                                        </>
                                    ) : (
                                        <span className="flex items-center text-red-500">
                                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                            Sitemap Status: <span className="ml-1 text-red-500">Not Found</span>
                                        </span>
                                    )}
                                </p>
                                {sitemapValidationData.found && (
                                    <p className="flex items-center ml-7 text-gray-600">
                                        <FileCode className="w-4 h-4 mr-1" />
                                        XML Status: {sitemapValidationData.url_count > 0 ? 'Valid XML ✅' : 'Invalid XML ❌'}
                                    </p>
                                )}
                                {sitemapValidationData.invalid_urls?.length > 0 && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-red-700 mb-1">Invalid URLs found ({sitemapValidationData.invalid_urls.length}):</h5>
                                        <ul className="list-disc list-inside text-red-600 text-sm">
                                            {sitemapValidationData.invalid_urls.slice(0, 3).map((url, index) => <li key={index} className="truncate">{url.url} ({url.reason})</li>)}
                                            {sitemapValidationData.invalid_urls.length > 3 && (
                                                <li className="italic text-gray-500">...and {sitemapValidationData.invalid_urls.length - 3} more.</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-200"
            >
                {isExpanded ? 'Collapse Details' : 'View Details'}
            </button>
        </motion.div>
    );
};

export default ReportCard;