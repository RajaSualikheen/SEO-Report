import React, { useState } from 'react';
import {
    CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, Link as LinkIcon,
    ExternalLink, MinusCircle, Smartphone, Code, Info, MapPin, Phone, Shield, TerminalSquare,
    Globe, Rss, Layers, FileText, AlignLeft, BarChart2, Zap, Repeat as RepeatIcon, Link2, Lightbulb, CodeIcon, FileSearch, Accessibility
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

// Global Tooltip Component
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
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 dark:bg-slate-200 dark:text-slate-800"
                >
                    {text}
                </motion.div>
            )}
        </div>
    );
};

const ReportCard = ({
    title, status, explanation, action,
    contentAnalysisData, onOpenTopKeywordsModal, onOpenSuggestionsModal,
    headingAuditData, onOpenHeadingsModal,
    linkAuditData, onOpenBrokenLinksModal,
    ogTwitterData, mobileResponsivenessData, onOpenFixedWidthElementsModal, onOpenResponsivenessIssuesModal,
    structuredDataAuditData, metadataLengthData, localSeoAuditData, keywordAnalysis, overallScore,
    robotsTxtData, metaRobotsData, httpStatusAndRedirectsData, sitemapValidationData, onOpenRedirectsModal,
    pagespeedData,
    imageAnalysisData, onOpenImageIssuesModal, onOpenSitemapIssuesModal, onOpenStructuredDataIssuesModal, onOpenLocalSeoIssuesModal,
    sectionScore,
    mobileScreenshot,
    crawlAuditData,
    onOpenCrawlGraphModal,
    competitorWordCountData,
    a11yAuditData,
    onOpenA11yIssuesModal
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    let statusIcon, statusColorClass, statusText, badgeColorClass;
    switch (status) {
    case 'excellent':
    case 'good':
        statusIcon = <CheckCircle className="w-8 h-8 text-green-500" />;
        statusColorClass = 'text-green-500';
        statusText = 'Good';
        badgeColorClass = 'bg-green-500';
        break;
    case 'fair':
    case 'warning':
        statusIcon = <AlertTriangle className="w-8 h-8 text-orange-500" />;
        statusColorClass = 'text-orange-500';
        statusText = 'Needs Fix';
        badgeColorClass = 'bg-orange-500';
        break;
    case 'poor':
    case 'critical':
    case 'bad':
        statusIcon = <AlertTriangle className="w-8 h-8 text-red-500" />;
        statusColorClass = 'text-red-500';
        statusText = 'Critical Issue';
        badgeColorClass = 'bg-red-500';
        break;
    default:
        statusIcon = null;
        statusColorClass = 'text-slate-500';
        statusText = 'N/A';
        badgeColorClass = 'bg-slate-500';
}

    const getReadabilityStatusText = (score) => {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        if (score > 0) return 'Very Difficult';
        return 'N/A - Insufficient Text';
    };

    const getReadabilityColorClass = (score) => {
        if (score >= 60) return 'text-green-500';
        if (score >= 30) return 'text-orange-500';
        return 'text-red-500';
    };

    const getAuditIcon = (condition) => {
        return condition ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
    };

    const getAuditIssueIcon = (issueText) => {
        if (issueText?.startsWith('❌')) return <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
        if (issueText?.startsWith('⚠️')) return <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />;
        return <CheckCircle className="w-5 h-5 text-green-500 mr-2" />;
    };

    const getCardTitleIcon = (cardTitle) => {
        switch (cardTitle) {
            case 'Title Optimization': return <FileText className="w-5 h-5 text-indigo-500" />;
            case 'Meta Description': return <AlignLeft className="w-5 h-5 text-indigo-500" />;
            case 'Content Structure': return <Layers className="w-5 h-5 text-indigo-500" />;
            case 'Keyword Analysis': return <BarChart2 className="w-5 h-5 text-indigo-500" />;
            case 'Content Quality Analysis': return <BookOpen className="w-5 h-5 text-indigo-500" />;
            case 'Image Accessibility': return <Lightbulb className="w-5 h-5 text-green-500" />;
            case 'Page Speed & Core Web Vitals': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'Link Profile': return <Link2 className="w-5 h-5 text-green-500" />;
            case 'Structured Data Schema': return <CodeIcon className="w-5 h-5 text-green-500" />;
            case 'Local SEO': return <MapPin className="w-5 h-5 text-green-500" />;
            case 'Mobile Experience': return <Smartphone className="w-5 h-5 text-yellow-500" />;
            case 'Social Media Integration': return <Rss className="w-5 h-5 text-yellow-500" />;
            case 'HTTPS Usage': return <Shield className="w-5 h-5 text-red-500" />;
            case 'Robots.txt Analysis': return <FileSearch className="w-5 h-5 text-purple-500" />;
            case 'Meta Robots Tag': return <Layers className="w-5 h-5 text-purple-500" />;
            case 'HTTP Status & Redirects': return <RepeatIcon className="w-5 h-5 text-purple-500" />;
            case 'Sitemap Validation': return <Globe className="w-5 h-5 text-purple-500" />;
            case 'Crawl Depth & Architecture': return <Link2 className="w-5 h-5 text-purple-500" />;
            case 'Accessibility Analysis': return <Accessibility className="w-5 h-5 text-teal-500" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const defaultSocialImage = 'https://via.placeholder.com/600x315?text=Social+Image+Preview';

    const getPageSpeedIcon = (score) => {
        if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (score >= 50) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    };

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
    
    const isMobilePageSpeedAvailable = pagespeedData?.mobile?.performance_score !== null && pagespeedData?.mobile?.performance_score !== undefined;
    
    return (
        <motion.div
            className={`w-full relative bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-md flex flex-col text-left border border-slate-200 transition-all duration-300 ease-in-out hover:shadow-lg`}
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
                <h3 className="text-lg font-bold text-slate-900 ml-2 leading-tight">
                    {title}
                </h3>
            </div>

            <p className={`text-sm text-slate-600 mb-4 flex-shrink-0`}>
                {explanation || `Click "View Details" for more.`}
                {sectionScore !== undefined && (
                    <span className="ml-2 font-semibold">
                        Score: <span className={statusColorClass}>{sectionScore}%</span>
                    </span>
                )}
            </p>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-slate-600 mb-4"
                        style={{ overflow: 'visible' }}
                    >
                        {title === 'Title Optimization' && metadataLengthData && (
                            <div className="space-y-2 py-2">
                                <p className="flex items-center text-sm">
                                    <Info className="w-4 h-4 mr-1 text-slate-500" />
                                    **Char Count:** {metadataLengthData.char_count || 'N/A'} characters
                                </p>
                                <p className="text-sm italic">
                                    **Status:** <span className={
                                        metadataLengthData.status?.toLowerCase() === 'optimal' ? 'text-green-500' :
                                        metadataLengthData.status?.toLowerCase() === 'too short' ? 'text-orange-500' :
                                        'text-red-500'
                                    }>{metadataLengthData.status || 'N/A'}</span>
                                </p>
                                <p className="text-sm">
                                    **Recommendation:** {metadataLengthData.recommendation || 'No recommendation provided.'}
                                </p>
                                {metadataLengthData.text && metadataLengthData.status?.toLowerCase() !== 'optimal' && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Meta Description' && metadataLengthData && (
                            <div className="space-y-2 py-2">
                                <p className="flex items-center text-sm">
                                    <Info className="w-4 h-4 mr-1 text-slate-500" />
                                    **Char Count:** {metadataLengthData.char_count || 'N/A'} characters
                                </p>
                                <p className="text-sm italic">
                                    **Status:** <span className={
                                        metadataLengthData.status?.toLowerCase() === 'optimal' ? 'text-green-500' :
                                        metadataLengthData.status?.toLowerCase() === 'too short' ? 'text-orange-500' :
                                        'text-red-500'
                                    }>{metadataLengthData.status || 'N/A'}</span>
                                </p>
                                <p className="text-sm">
                                    **Recommendation:** {metadataLengthData.recommendation || 'No recommendation provided.'}
                                </p>
                                {metadataLengthData.text && metadataLengthData.status?.toLowerCase() !== 'optimal' && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {title === 'Content Quality Analysis' && contentAnalysisData && (
                            <div className="space-y-4 py-2">
                                <div className="bg-slate-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                                    <div className="flex-1 mb-2 md:mb-0">
                                        <p className="text-xs font-medium text-slate-700 flex items-center justify-center md:justify-start">
                                            <Hash className="w-4 h-4 mr-1 text-slate-500" />
                                            <span className="font-bold text-slate-900">Word Count:</span>
                                        </p>
                                        <p className="text-xl font-extrabold text-indigo-600 mt-1">
                                            {contentAnalysisData.total_word_count || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                                        <p className="text-xs font-medium text-slate-700 flex items-center justify-center md:justify-start">
                                            <BookOpen className="w-4 h-4 mr-1 text-slate-500" />
                                            <span className="font-bold text-slate-900">Readability:</span>
                                        </p>
                                        <p className={`text-xl font-extrabold ${getReadabilityColorClass(contentAnalysisData.readability_score)} mt-1`}>
                                            {getReadabilityStatusText(contentAnalysisData.readability_score)}
                                            <span className="text-sm text-slate-500 ml-1">
                                                ({contentAnalysisData.readability_score || 'N/A'})
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                                        <p className="text-xs font-medium text-slate-700 flex items-center justify-center md:justify-start">
                                            <Layers className="w-4 h-4 mr-1 text-slate-500" />
                                            <span className="font-bold text-slate-900">Uniqueness:</span>
                                        </p>
                                        <p className={`text-xl font-extrabold ${contentAnalysisData.uniqueness_analysis?.is_unique ? 'text-green-500' : 'text-red-500'} mt-1`}>
                                            {contentAnalysisData.uniqueness_analysis?.is_unique ? 'Unique' : 'Duplicated'}
                                        </p>
                                    </div>
                                </div>
                                {/* NEW: Word Count vs. Competitors */}
                                {competitorWordCountData?.competitor_average > 0 && (
                                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <p className="font-semibold text-sm text-indigo-800 mb-2">Word Count vs. Competitors:</p>
                                        <div className="flex justify-between items-center text-xs">
                                            <p className="flex flex-col text-center">
                                                <span className="font-bold text-indigo-600 text-lg">{competitorWordCountData.target_word_count}</span>
                                                <span className="text-gray-600">Your Page</span>
                                            </p>
                                            <p className="flex flex-col text-center">
                                                <span className="font-bold text-indigo-600 text-lg">{competitorWordCountData.competitor_average}</span>
                                                <span className="text-gray-600">Competitor Average</span>
                                            </p>
                                            <p className="flex flex-col text-center">
                                                <span className="font-bold text-indigo-600 text-lg">{competitorWordCountData.ideal_range.min}-{competitorWordCountData.ideal_range.max}</span>
                                                <span className="text-gray-600">Ideal Range</span>
                                            </p>
                                        </div>
                                        {competitorWordCountData.issues?.length > 0 && (
                                            <div className="mt-3">
                                                {competitorWordCountData.issues.map((issue, i) => (
                                                    <p key={i} className={`text-sm flex items-center ${issue.startsWith('✅') ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {issue.startsWith('✅') ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                                        {issue.replace('✅ ', '').replace('⚠️ ', '')}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {keywordChartData && (
      <div className="mt-4 h-64">
        <Bar data={keywordChartData} options={keywordChartOptions} />
      </div>
    )}
                            </div>
                        )}

                        {title === 'Keyword Analysis' && keywordAnalysis && (
                            <div className="space-y-4 py-2">
                                {keywordAnalysis.map((kw, index) => (
                                    <div key={index} className="border-b last:border-b-0 border-slate-200 pb-4">
                                        <h4 className="font-bold text-base text-slate-900">{kw.keyword}</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                            <p className="flex items-center">
                                                {getAuditIcon(kw.presence?.title)}
                                                Title
                                            </p>
                                            <p className="flex items-center">
                                                {getAuditIcon(kw.presence?.meta_description)}
                                                Meta Description
                                            </p>
                                            <p className="flex items-center">
                                                {getAuditIcon(kw.presence?.h1)}
                                                H1
                                            </p>
                                            <p className="flex items-center">
                                                {getAuditIcon(kw.presence?.url)}
                                                URL
                                            </p>
                                            <p className="flex items-center">
                                                {getAuditIcon(kw.presence?.content)}
                                                Content
                                            </p>
                                            <p className="flex items-center">
                                                <Info className="w-4 h-4 mr-1 text-slate-500" />
                                                Density: {kw.density || 'N/A'}%
                                            </p>
                                        </div>
                                        {kw.recommendations?.length > 0 && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <p className="font-semibold text-sm text-yellow-700">Recommendations:</p>
                                                <ul className="list-disc list-inside text-yellow-600 text-xs">
                                                    {kw.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {keywordAnalysis.length > 0 && onOpenTopKeywordsModal && (
                                    <button
                                        onClick={onOpenTopKeywordsModal}
                                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-2" /> View Top Keywords
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {title === 'Content Structure' && headingAuditData && (
                            <div className="space-y-4 py-2">
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div><p className="font-medium">H1</p><p className="text-xl font-bold text-indigo-600">{headingAuditData.h1_count || 0}</p></div>
                                    <div><p className="font-medium">H2</p><p className="text-xl font-bold text-indigo-600">{headingAuditData.h2_count || 0}</p></div>
                                    <div><p className="font-medium">H3</p><p className="text-xl font-bold text-indigo-600">{headingAuditData.h3_count || 0}</p></div>
                                </div>
                                {onOpenHeadingsModal && (
                                    <button
                                        onClick={() => onOpenHeadingsModal(headingAuditData.heading_order, headingAuditData.issues)}
                                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <AlignLeft className="w-4 h-4 mr-2" /> View Full Structure
                                    </button>
                                )}
                                {headingAuditData.issues?.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                                        <ul className="list-disc list-inside text-red-600 text-sm">
                                            {headingAuditData.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Image Accessibility' && imageAnalysisData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="font-semibold">Image Summary:</p>
                                <ul className="list-disc list-inside ml-4 text-slate-700">
                                    <li>Total Images: {imageAnalysisData.total_images || 0}</li>
                                    <li>Content Images: {imageAnalysisData.content_images || 0}</li>
                                    <li>Decorative Images: {imageAnalysisData.decorative_images || 0}</li>
                                    <li>Images with Alt Text: {imageAnalysisData.images_with_alt || 0}</li>
                                    <li>Images without Alt Text: {imageAnalysisData.images_without_alt || 0}</li>
                                </ul>
                                {imageAnalysisData.detailed_issues?.length > 0 && onOpenImageIssuesModal && (
                                    <button
                                        onClick={() => onOpenImageIssuesModal(imageAnalysisData)}
                                        className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-orange-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <Lightbulb className="w-4 h-4 mr-2" /> View Issues & Recommendations
                                    </button>
                                )}
                            </div>
                        )}

                        {title === 'Page Speed & Core Web Vitals' && pagespeedData && (
                            <div className="space-y-6 py-2 text-sm">
                                {pagespeedData.mobile && (
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <p className="flex items-center font-semibold mb-2">
                                            {getPageSpeedIcon(pagespeedData.mobile.performance_score)}
                                            <span className="ml-2">Mobile Performance: {pagespeedData.mobile.performance_score}%</span>
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 ml-7">
                                            <p className="flex items-center">
                                                <Zap className="w-4 h-4 mr-2 text-blue-500" />
                                                LCP: {pagespeedData.mobile.metrics?.LCP || 'N/A'}
                                                <Tooltip text="Largest Contentful Paint - measures loading performance">
                                                    <Info className="w-4 h-4 ml-1 text-slate-400" />
                                                </Tooltip>
                                            </p>
                                            <p className="flex items-center">
                                                <Smartphone className="w-4 h-4 mr-2 text-blue-500" />
                                                INP: {pagespeedData.mobile.metrics?.INP || 'N/A'}
                                                <Tooltip text="Interaction to Next Paint - measures interactivity">
                                                    <Info className="w-4 h-4 ml-1 text-slate-400" />
                                                </Tooltip>
                                            </p>
                                            <p className="flex items-center">
                                                <BarChart2 className="w-4 h-4 mr-2 text-blue-500" />
                                                CLS: {pagespeedData.mobile.metrics?.CLS || 'N/A'}
                                                <Tooltip text="Cumulative Layout Shift - measures visual stability">
                                                    <Info className="w-4 h-4 ml-1 text-slate-400" />
                                                </Tooltip>
                                            </p>
                                            <p className="flex items-center">
                                                <Code className="w-4 h-4 mr-2 text-blue-500" />
                                                TBT: {pagespeedData.mobile.metrics?.TBT || 'N/A'}
                                                <Tooltip text="Total Blocking Time">
                                                    <Info className="w-4 h-4 ml-1 text-slate-400" />
                                                </Tooltip>
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {pagespeedData.desktop && (
                                    <div className="bg-slate-50 p-4 rounded-lg mt-4">
                                        <p className="flex items-center font-semibold mb-2">
                                            {getPageSpeedIcon(pagespeedData.desktop.performance_score)}
                                            <span className="ml-2">Desktop Performance: {pagespeedData.desktop.performance_score}%</span>
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 ml-7">
                                            <p className="flex items-center">
                                                <Zap className="w-4 h-4 mr-2 text-blue-500" />
                                                LCP: {pagespeedData.desktop.metrics?.LCP || 'N/A'}
                                            </p>
                                            <p className="flex items-center">
                                                <Smartphone className="w-4 h-4 mr-2 text-blue-500" />
                                                INP: {pagespeedData.desktop.metrics?.INP || 'N/A'}
                                            </p>
                                            <p className="flex items-center">
                                                <BarChart2 className="w-4 h-4 mr-2 text-blue-500" />
                                                CLS: {pagespeedData.desktop.metrics?.CLS || 'N/A'}
                                            </p>
                                            <p className="flex items-center">
                                                <Code className="w-4 h-4 mr-2 text-blue-500" />
                                                TBT: {pagespeedData.desktop.metrics?.TBT || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {title === 'Link Profile' && linkAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="font-semibold text-base mb-2">Link Summary:</p>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-3 bg-slate-100 rounded-lg">
                                        <p className="text-xs text-slate-700">Internal Links</p>
                                        <p className="text-xl font-bold text-indigo-600 mt-1">{linkAuditData.internal_links_count || 0}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 rounded-lg">
                                        <p className="text-xs text-slate-700">External Links</p>
                                        <p className="text-xl font-bold text-indigo-600 mt-1">{linkAuditData.external_links_count || 0}</p>
                                    </div>
                                </div>
                                {linkAuditData.broken_links_count > 0 && onOpenBrokenLinksModal ? (
                                    <>
                                        <p className="flex items-center text-red-600 font-semibold mt-4">
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
                                    <p className="flex items-center text-green-600 font-semibold mt-4">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                        No broken links found.
                                    </p>
                                )}
                            </div>
                        )}

                        {title === 'Structured Data Schema' && structuredDataAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                {structuredDataAuditData.ld_json_found ? (
                                    structuredDataAuditData.schema_types?.length > 0 ? (
                                        <>
                                            <p className="flex items-center text-green-600 font-semibold">
                                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                Schema Found:
                                            </p>
                                            <ul className="list-disc list-inside ml-7">
                                                {structuredDataAuditData.schema_types.map((type, index) => (
                                                    <li key={index} className="text-slate-700">
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
                                {structuredDataAuditData.issues?.length > 0 && onOpenStructuredDataIssuesModal && (
                                    <button
                                        onClick={() => onOpenStructuredDataIssuesModal(structuredDataAuditData)}
                                        className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-orange-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <CodeIcon className="w-4 h-4 mr-2" /> View Issues
                                    </button>
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
                                {localSeoAuditData.issues?.length > 0 && onOpenLocalSeoIssuesModal && (
                                    <button
                                        onClick={() => onOpenLocalSeoIssuesModal(localSeoAuditData)}
                                        className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-orange-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <MapPin className="w-4 h-4 mr-2" /> View Issues
                                    </button>
                                )}
                            </div>
                        )}

                        {title === 'Social Media Integration' && ogTwitterData && (
                            <div className="space-y-3 py-2 text-sm">
                                {(ogTwitterData.open_graph?.title?.present || ogTwitterData.twitter_cards?.title?.present) && (ogTwitterData.open_graph?.image?.present || ogTwitterData.twitter_cards?.image?.present) ? (
                                    <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                                        <img
                                            src={ogTwitterData.open_graph?.image?.content || ogTwitterData.twitter_cards?.image?.content || defaultSocialImage}
                                            alt="Social Media Preview"
                                            className="w-full h-auto object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = defaultSocialImage; }}
                                        />
                                        <div className="p-3 bg-slate-50">
                                            <p className="text-md font-bold text-slate-900 mb-1">
                                                {ogTwitterData.open_graph?.title?.content || ogTwitterData.twitter_cards?.title?.content || 'No Title Provided'}
                                            </p>
                                            <p className="text-xs text-slate-600">
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
                                {ogTwitterData.issues?.length > 0 && (
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
                            <div className="space-y-4 py-2 text-sm">
                                {mobileScreenshot ? (
                                    <>
                                        <p className="font-semibold text-base mb-2">Mobile Screenshot:</p>
                                        <div className="w-full h-auto overflow-hidden rounded-lg border border-slate-200 shadow-inner">
                                            <img
                                                src={`data:image/jpeg;base64,${mobileScreenshot}`}
                                                alt="Mobile screenshot preview"
                                                className="w-full"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-blue-50 p-4 rounded-lg text-center flex items-center justify-center">
                                        <Info className="w-6 h-6 mr-2 text-blue-500" />
                                        <p className="text-blue-700 font-semibold">
                                            Screenshot unavailable. The API may have failed to render the page.
                                        </p>
                                    </div>
                                )}
                                
                                <div className="mt-4">
                                    <p className="font-semibold text-base mb-2">Key Mobile Audits:</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-center">
                                            {getAuditIcon(mobileResponsivenessData.viewport_tag && mobileResponsivenessData.viewport_content?.includes('width=device-width'))}
                                            <span>
                                                Viewport Tag: {mobileResponsivenessData.viewport_tag ? 'Correctly configured' : 'Missing'}
                                            </span>
                                        </li>
                                        <li className="flex items-center">
                                            {getAuditIcon(mobileResponsivenessData.fixed_width_elements?.length === 0)}
                                            <span>
                                                Fixed-Width Elements: {mobileResponsivenessData.fixed_width_elements?.length > 0 ? `${mobileResponsivenessData.fixed_width_elements.length} found` : 'None found'}
                                            </span>
                                        </li>
                                        {pagespeedData?.mobile?.font_size_audit && (
                                            <li className="flex items-center">
                                                {getAuditIcon(pagespeedData.mobile.font_size_audit.length === 0)}
                                                <span>
                                                    Font Legibility: {pagespeedData.mobile.font_size_audit.length === 0 ? 'Good' : `${pagespeedData.mobile.font_size_audit.length} issues`}
                                                </span>
                                            </li>
                                        )}
                                        {pagespeedData?.mobile?.tap_targets_audit && (
                                            <li className="flex items-center">
                                                {getAuditIcon(pagespeedData.mobile.tap_targets_audit.length === 0)}
                                                <span>
                                                    Tap Targets: {pagespeedData.mobile.tap_targets_audit.length === 0 ? 'Adequate' : `${pagespeedData.mobile.tap_targets_audit.length} issues`}
                                                </span>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                                {mobileResponsivenessData.issues?.length > 0 && onOpenResponsivenessIssuesModal && (
                                    <button
                                        onClick={() => onOpenResponsivenessIssuesModal(mobileResponsivenessData.issues)}
                                        className="w-full mt-4 bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-yellow-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <Smartphone className="w-4 h-4 mr-2" /> View Detailed Issues
                                    </button>
                                )}
                            </div>
                        )}

                        {title === 'HTTPS Usage' && (
                            <div className="space-y-2 py-2">
                                <p className="text-sm">{explanation}</p>
                            </div>
                        )}

                        {title === 'Robots.txt Analysis' && robotsTxtData && (
                            <div className="space-y-3 py-2 text-sm">
                                <p className="flex items-center font-semibold">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${robotsTxtData.present ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    File Status: {robotsTxtData.present ? 'Found' : 'Not Found'}
                                </p>
                                {robotsTxtData.present && (
                                    <>
                                        <p className="font-semibold mt-2">Parsed Rules (User-agent: *):</p>
                                        {robotsTxtData.rules?.['*'] && (
                                            <div className="ml-4 p-2 bg-slate-100 rounded-md">
                                                {robotsTxtData.rules['*'].disallow?.map((rule, j) => (
                                                    <p key={j} className="text-red-500 font-mono">Disallow: {rule}</p>
                                                ))}
                                                {robotsTxtData.rules['*'].allow?.map((rule, k) => (
                                                    <p key={k} className="text-green-500 font-mono">Allow: {rule}</p>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                                {robotsTxtData.sitemap_path && (
                                    <p className="flex items-center mt-3">
                                        <LinkIcon className="w-4 h-4 mr-2" /> Sitemap: <a href={robotsTxtData.sitemap_path} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1 break-all">{robotsTxtData.sitemap_path}</a>
                                    </p>
                                )}
                                {robotsTxtData.issues?.length > 0 && (
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
                                    <p className="ml-4 font-mono text-slate-700 break-all">
                                        Content: "{metaRobotsData.content || 'N/A'}"
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
                                {metaRobotsData.issues?.length > 0 && (
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
                                        const isGood = chain.final_status_code >= 200 && chain.final_status_code < 300 && chain.redirect_chain?.length <= 2;
                                        const statusColor = isGood ? 'bg-green-100 text-green-800' : chain.final_status_code >= 400 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
                                        const statusText = chain.final_status_code === 200 ? '200 OK' : chain.final_status_code >= 300 && chain.final_status_code < 400 ? `${chain.final_status_code} Redirect` : `${chain.final_status_code} Error`;
                                        const displayUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').substring(0, 30) + '...';

                                        return (
                                            <div key={index} className="p-3 bg-slate-100 rounded-lg">
                                                <p className="font-semibold text-slate-900 truncate">{url.length > 40 ? displayUrl : url}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>{statusText}</span>
                                                    {chain.has_redirect_chain && (
                                                        <span className="text-slate-500 text-xs flex items-center">
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
                                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-600 transition duration-300 flex items-center justify-center text-sm"
                                    >
                                        <TerminalSquare className="w-4 h-4 mr-2" /> View Redirects
                                    </button>
                                )}
                            </div>
                        )}

                        
                        {title === 'Sitemap Validation' && sitemapValidationData && (
                            <div className="space-y-4 py-2 text-sm">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="font-semibold text-base text-slate-800 mb-3">Sitemap Audit Summary</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                        <div className="p-2 bg-white rounded-md shadow-sm">
                                            <p className="text-xs text-slate-500">Total URLs</p>
                                            <p className="text-xl font-bold text-indigo-600">{sitemapValidationData.total_urls_found !== undefined ? sitemapValidationData.total_urls_found : 'N/A'}</p>
                                        </div>
                                        <div className="p-2 bg-white rounded-md shadow-sm">
                                            <p className="text-xs text-slate-500">OK</p>
                                            <p className="text-xl font-bold text-green-600">{sitemapValidationData.summary?.ok_count !== undefined ? sitemapValidationData.summary?.ok_count : 'N/A'}</p>
                                        </div>
                                        <div className="p-2 bg-white rounded-md shadow-sm">
                                            <p className="text-xs text-slate-500">Errors</p>
                                            <p className="text-xl font-bold text-red-600">{sitemapValidationData.summary?.error_count !== undefined ? sitemapValidationData.summary?.error_count : 'N/A'}</p>
                                        </div>
                                        <div className="p-2 bg-white rounded-md shadow-sm">
                                            <p className="text-xs text-slate-500">Issues</p>
                                            <p className="text-xl font-bold text-orange-500">{
                                                (sitemapValidationData.summary?.disallowed_count ?? 0) +
                                                (sitemapValidationData.summary?.noindex_count ?? 0)
                                            }</p>
                                        </div>
                                    </div>
                                </div>
                                {sitemapValidationData.audited_urls?.length > 0 && onOpenSitemapIssuesModal && (
                                    <button
                                        onClick={() => onOpenSitemapIssuesModal(sitemapValidationData)}
                                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-600 transition duration-300 flex items-center justify-center text-sm mt-3"
                                    >
                                        <FileSearch className="w-4 h-4 mr-2" /> View Audited URLs
                                    </button>
                                )}
                            </div>
                        )}

                        {title === 'Crawl Depth & Architecture' && crawlAuditData && (
                            <div className="space-y-3 py-2 text-sm">
                                {crawlAuditData.issues.some(issue => issue.startsWith('❌')) && (
                                    <div className="bg-red-50 p-3 rounded-lg flex items-center mb-4">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                                        <p className="text-red-700 text-xs">
                                            {crawlAuditData.issues.find(issue => issue.startsWith('❌'))}
                                        </p>
                                    </div>
                                )}
                                {crawlAuditData.issues.some(issue => issue.startsWith('⚠️')) && (
                                    <div className="bg-orange-50 p-3 rounded-lg flex items-center mb-4">
                                        <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0" />
                                        <p className="text-orange-700 text-xs">
                                            {crawlAuditData.issues.find(issue => issue.startsWith('⚠️'))}
                                        </p>
                                    </div>
                                )}
                                <p className="font-semibold text-base mb-2">Crawl Summary:</p>
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="p-3 bg-slate-100 rounded-lg">
                                        <p className="text-xs text-slate-700">Pages Crawled</p>
                                        <p className="text-xl font-bold text-indigo-600 mt-1">{crawlAuditData.nodes?.length || 0}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${crawlAuditData.orphan_pages?.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                        <p className={`text-xs ${crawlAuditData.orphan_pages?.length > 0 ? 'text-red-700' : 'text-green-700'}`}>Orphan Pages</p>
                                        <p className={`text-xl font-bold ${crawlAuditData.orphan_pages?.length > 0 ? 'text-red-600' : 'text-green-600'} mt-1`}>{crawlAuditData.orphan_pages?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {onOpenCrawlGraphModal && (
                                        <button
                                            onClick={() => onOpenCrawlGraphModal(crawlAuditData)}
                                            className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-purple-700 transition duration-300 flex items-center justify-center text-sm"
                                        >
                                            <Link2 className="w-4 h-4 mr-2" /> Visualize Link Graph
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {title === 'Accessibility Analysis' && a11yAuditData && (
                            <div className="space-y-4 py-2">
                                <p className="font-semibold text-base mb-2">Issues Found: {a11yAuditData.issues.length}</p>
                                {a11yAuditData.issues.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <h5 className="text-md font-semibold text-red-700 mb-1">Accessibility Issues:</h5>
                                        <ul className="list-disc list-inside text-red-600 text-sm">
                                            {a11yAuditData.issues.map((issue, index) => <li key={index}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <div className="mt-4">
                                    {onOpenA11yIssuesModal && (
                                        <button
                                            onClick={() => onOpenA11yIssuesModal(a11yAuditData)}
                                            className="w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-teal-600 transition duration-300 flex items-center justify-center text-sm"
                                        >
                                            <Accessibility className="w-4 h-4 mr-2" /> View Detailed Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-4 text-sm font-medium text-blue-600 hover:text-purple-600 transition-colors duration-200"
            >
                {isExpanded ? 'Collapse Details' : 'View Details'}
            </button>
        </motion.div>
    );
};

export default React.memo( ReportCard);
