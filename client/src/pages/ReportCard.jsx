import React from 'react';
import { CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, Link as LinkIcon, ExternalLink, MinusCircle } from 'lucide-react'; // Added LinkIcon, ExternalLink, MinusCircle

import { motion } from 'framer-motion';

const ReportCard = ({
    title, status, explanation,
    contentAnalysisData, onOpenKeywordsModal,
    headingCounts, headingOrder, headingIssues, onOpenHeadingsModal,
    speedAuditData,
    sitemapData,
    linkAuditData, // NEW PROP for link audit
    onOpenBrokenLinksModal // NEW PROP: function to open broken links modal
}) => {
    let statusIcon;
    let statusColorClass;
    let statusText;

    switch (status) {
        case 'good':
            statusIcon = <CheckCircle className="w-6 h-6 text-green-500" />;
            statusColorClass = 'text-green-500';
            statusText = 'Good';
            break;
        case 'warning':
            statusIcon = <AlertTriangle className="w-6 h-6 text-orange-500" />;
            statusColorClass = 'text-orange-500';
            statusText = 'Needs Fix';
            break;
        case 'bad':
            statusIcon = <AlertTriangle className="w-6 h-6 text-red-500" />;
            statusColorClass = 'text-red-500';
            statusText = 'Critical Issue';
            break;
        default:
            statusIcon = null;
            statusColorClass = 'text-gray-500';
            statusText = 'N/A';
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

    // Helper for status icons in various audits
    const getAuditIcon = (condition) => {
        return condition ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
    };
    const getAuditIssueIcon = (issueText) => {
        if (issueText.startsWith('❌')) return <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
        if (issueText.startsWith('⚠️')) return <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />;
        return <CheckCircle className="w-5 h-5 text-green-500 mr-2" />;
    };

    return (
        <motion.div
            className="bg-white p-6 rounded-xl shadow-lg flex flex-col text-left dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{
                scale: 1.02,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }}
        >
            <div className="flex items-center mb-3">
                {statusIcon}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-2">{title}</h3>
            </div>
            <p className={`text-sm font-medium ${statusColorClass} mb-4`}>
                Status: {statusText}
            </p>
            <div className="text-gray-600 dark:text-gray-300 flex-grow mb-6">
                {explanation && <p>{explanation}</p>}

                {title === 'Content Analysis' && contentAnalysisData && (
                    <div className="space-y-6 mt-4">
                        <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg shadow-inner border border-blue-100 dark:border-gray-600 flex flex-col md:flex-row md:justify-around md:items-center text-center md:text-left">
                            <div className="flex-1 mb-4 md:mb-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center md:justify-start">
                                    <Hash className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    <span className="font-bold text-gray-900 dark:text-gray-100">Total Word Count:</span>{' '}
                                </p>
                                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                                    {contentAnalysisData.total_word_count || 'N/A'}
                                </p>
                            </div>
                            <div className="flex-1 border-t md:border-t-0 md:border-l border-blue-200 dark:border-gray-600 pt-4 md:pt-0 md:pl-6">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center md:justify-start">
                                    <BookOpen className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    <span className="font-bold text-gray-900 dark:text-gray-100">Readability (Flesch):</span>{' '}
                                </p>
                                <p className={`text-2xl font-extrabold ${getReadabilityColorClass(contentAnalysisData.flesch_reading_ease_score)} mt-1`}>
                                    {getReadabilityStatusText(contentAnalysisData.flesch_reading_ease_score)}
                                    <span className="text-base text-gray-500 dark:text-gray-400 ml-2">
                                        ({contentAnalysisData.flesch_reading_ease_score || 'N/A'})
                                    </span>
                                </p>
                            </div>
                        </div>

                        {contentAnalysisData.top_keywords && contentAnalysisData.top_keywords.length > 0 && onOpenKeywordsModal ? (
                            <button
                                onClick={() => onOpenKeywordsModal(contentAnalysisData)}
                                className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
                            >
                                <TrendingUp className="w-5 h-5 mr-2" /> See Top Keywords
                            </button>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 p-2 text-center">No significant keywords found for this page.</p>
                        )}
                    </div>
                )}

                {title === 'Heading Structure' && headingCounts && (
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">H1 Count</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{headingCounts.h1_count}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">H2 Count</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{headingCounts.h2_count}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">H3 Count</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{headingCounts.h3_count}</p>
                            </div>
                        </div>

                        {headingOrder && headingOrder.length > 0 && onOpenHeadingsModal ? (
                            <button
                                onClick={() => onOpenHeadingsModal(headingOrder)}
                                className="w-full bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-600 transition duration-300 flex items-center justify-center mt-4"
                            >
                                <BookOpen className="w-5 h-5 mr-2" /> View Full Heading Order
                            </button>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 p-2 text-center">No heading order data available.</p>
                        )}

                        {headingIssues && headingIssues.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                                <h4 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Issues Detected:</h4>
                                <ul className="list-disc list-inside text-red-600 dark:text-red-300">
                                    {headingIssues.map((issue, index) => (
                                        <li key={index}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {title === 'Speed Heuristics' && speedAuditData && (
                    <div className="space-y-4 mt-4 text-gray-700 dark:text-gray-300">
                        <p className="flex items-center">
                            {getAuditIcon(!speedAuditData.has_inline_styles)}
                            {speedAuditData.has_inline_styles ? 'Found inline styles' : 'No inline styles found'}
                        </p>
                        <p className="flex items-center">
                            {getAuditIcon(!speedAuditData.has_inline_scripts)}
                            {speedAuditData.has_inline_scripts ? 'Found inline scripts' : 'No inline scripts found'}
                        </p>
                        <p className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            External CSS Files: {speedAuditData.external_css_count}
                        </p>
                        <p className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            External JS Files: {speedAuditData.external_js_count}
                        </p>

                        {speedAuditData.issues && speedAuditData.issues.length > 0 && (
                            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                <h4 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Speed Issues:</h4>
                                <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300">
                                    {speedAuditData.issues.map((issue, index) => (
                                        <li key={index} className="flex items-start">
                                            {getAuditIssueIcon(issue)}
                                            <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {(!speedAuditData.issues || speedAuditData.issues.length === 0) && (
                            <p className="text-green-600 dark:text-green-300 text-center">No significant speed issues found!</p>
                        )}
                    </div>
                )}

                {title === 'Sitemap Validator' && sitemapData && (
                    <div className="space-y-4 mt-4 text-gray-700 dark:text-gray-300">
                        <p className="flex items-center text-lg font-semibold">
                            {sitemapData.status.startsWith('✅') ? (
                                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                            )}
                            <span>{sitemapData.status.replace('✅ ', '').replace('❌ ', '').replace('⚠️ ', '')}</span>
                        </p>
                        {sitemapData.found && sitemapData.url_count > 0 && (
                            <p className="flex items-center text-sm ml-8 text-gray-600 dark:text-gray-400">
                                <FileCode className="w-4 h-4 mr-1" />
                                Contains {sitemapData.url_count} URLs.
                            </p>
                        )}
                    </div>
                )}

                {/* NEW: Link Audit Section */}
                {title === 'Link Audit' && linkAuditData && (
                    <div className="space-y-4 mt-4 text-gray-700 dark:text-gray-300">
                        <p className="flex items-center">
                            <LinkIcon className="w-5 h-5 text-blue-500 mr-2" />
                            Internal Links: {linkAuditData.internal_links_count}
                        </p>
                        <p className="flex items-center">
                            <ExternalLink className="w-5 h-5 text-blue-500 mr-2" />
                            External Links: {linkAuditData.external_links_count}
                        </p>

                        {linkAuditData.broken_links_count > 0 && onOpenBrokenLinksModal ? (
                            <>
                                <p className="flex items-center text-red-600 font-semibold">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                    Broken Links Found: {linkAuditData.broken_links_count}
                                </p>
                                <button
                                    onClick={() => onOpenBrokenLinksModal(linkAuditData.broken_links)}
                                    className="w-full bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-600 transition duration-300 flex items-center justify-center mt-2"
                                >
                                    <MinusCircle className="w-5 h-5 mr-2" /> View Broken Links
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
            </div>
        </motion.div>
    );
};

export default ReportCard;