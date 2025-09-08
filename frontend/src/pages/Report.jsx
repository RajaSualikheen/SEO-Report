/* eslint-disable no-irregular-whitespace */
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, Link as LinkIcon,
    ExternalLink, MinusCircle, Smartphone, Code, Info, Sun, Repeat, FileDown, Shield,
    TerminalSquare, Layout, Server, Zap, Globe, HardDrive, MapPin, Phone, Rss, Layers,
    FileText, Lightbulb, AlignLeft, BarChart2, RepeatIcon, CodeIcon, FileSearch, FileTextIcon, Link2, Accessibility
} from 'lucide-react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReportCard from './ReportCard';
import ReactDOM from 'react-dom';
import { Circle, Line } from 'rc-progress';
import { PDFDownloadLink } from '@react-pdf/renderer'
import PDFReport from '../components/PDFReport';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import PremiumLoadingScreen from '../components/PremiumLoadingScreen';
import CrawlGraph from '../components/CrawlGraph';
// Firebase Imports
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseConfig } from "../firebase";
import axios from 'axios';
import AIStrategyCard from '../components/AIStrategyCard';
ChartJS.register(ArcElement, ChartTooltip, Legend);

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

// Helper Functions
const getCategoryIcon = (category) => {
    switch (category) {
        case 'Content':
            return <BookOpen className="w-5 h-5 text-indigo-500" />;
        case 'Technical SEO':
            return <Server className="w-5 h-5 text-green-500" />;
        case 'Page Speed & Core Web Vitals':
            return <Zap className="w-5 h-5 text-blue-500" />;
        case 'User Experience':
            return <Lightbulb className="w-5 h-5 text-yellow-500" />;
        case 'Security':
            return <Shield className="w-5 h-5 text-red-500" />;
        case 'Crawlability & Indexability':
            return <Globe className="w-5 h-5 text-purple-500" />;
        case 'Crawlability & Architecture':
            return <Link2 className="w-5 h-5 text-purple-500" />;
        case 'Accessibility Analysis':
            return <Accessibility className="w-5 h-5 text-teal-500" />;
        default:
            return <Info className="w-5 h-5" />;
    }
};

const ElegantDivider = ({ categoryName }) => (
    <div className="flex items-center space-x-3 mb-6 mt-12">
        <span className="w-full h-px bg-gradient-to-r from-gray-300 via-gray-200 to-gray-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900"></span>
        <div className="flex-shrink-0 flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            {getCategoryIcon(categoryName)}
            <span className="text-sm font-semibold uppercase">{categoryName}</span>
        </div>
        <span className="w-full h-px bg-gradient-to-l from-gray-300 via-gray-200 to-gray-50 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900"></span>
    </div>
);

const getReadabilityStatus = (score) => {
    if (score >= 90) return { text: 'Very Easy', status: 'good', score: 100 };
    if (score >= 80) return { text: 'Easy', status: 'good', score: 90 };
    if (score >= 70) return { text: 'Fairly Easy', status: 'good', score: 80 };
    if (score >= 60) return { text: 'Standard', status: 'warning', score: 70 };
    if (score >= 50) return { text: 'Fairly Difficult', status: 'warning', score: 60 };
    if (score >= 30) return { text: 'Difficult', status: 'bad', score: 50 };
    return { text: 'Very Difficult', status: 'bad', score: 40 };
};

const getPageSpeedStatus = (score) => {
    if (score >= 90) return 'good';
    if (score >= 50) return 'warning';
    return 'bad';
};

const calculateSectionScore = (section, backendData, pagespeedData) => {
    if (section.id === 'content-quality-analysis') {
        const readabilityScore = getReadabilityStatus(backendData.content_analysis?.readability_score || 0).score;
        const uniquenessScore = backendData.content_analysis?.uniqueness_analysis?.is_unique ? 100 : 30;
        const wordCountScore = backendData.content_analysis?.total_word_count > 500 ? 100 : backendData.content_analysis?.total_word_count > 200 ? 70 : 40;
        // NEW: Incorporate competitor word count into the content score
        const competitorWordCount = backendData.competitor_word_count_audit || {};
        const isWordCountGood = competitorWordCount.issues?.some(issue => issue.includes('✅')) || false;
        const wordCountComparisonScore = isWordCountGood ? 100 : 70;
        
        return Math.round(readabilityScore * 0.3 + uniquenessScore * 0.3 + wordCountScore * 0.2 + wordCountComparisonScore * 0.2);
    }
    if (section.id === 'keyword-analysis') {
        const keywordAnalysis = backendData.content_analysis?.keyword_analysis?.[0] || {};
        let score = 0;
        if (keywordAnalysis.presence?.title) score += 20;
        if (keywordAnalysis.presence?.meta_description) score += 20;
        if (keywordAnalysis.presence?.h1) score += 20;
        if (keywordAnalysis.presence?.url) score += 20;
        if (keywordAnalysis.presence?.content) score += 20;
        if (keywordAnalysis.recommendations?.some(r => r.includes('too high'))) score -= 30;
        return Math.max(score, 0);
    }
    if (section.id === 'pagespeed-audit') {
        const mobileScore = pagespeedData?.mobile?.performance_score || 0;
        const desktopScore = pagespeedData?.desktop?.performance_score || 0;
        return Math.round((mobileScore + desktopScore) / 2);
    }
    if (section.id === 'structured-data-schema') {
        if (!backendData.structured_data_audit?.ld_json_found) return 0;
        if (backendData.structured_data_audit?.invalid_schemas?.length > 0) return 50;
        return 100;
    }
    if (section.id === 'image-accessibility') {
        const totalContentImages = backendData.image_analysis?.content_images || 0;
        const imagesWithAlt = backendData.image_analysis?.images_with_alt || 0;
        if (totalContentImages === 0) return 100;
        return Math.round((imagesWithAlt / totalContentImages) * 100);
    }
    if (section.id === 'local-seo-audit') {
        const localSeoData = backendData.local_seo_audit;
        if (localSeoData.status.includes('Present')) return 100;
        if (localSeoData.status.includes('Partial')) return 60;
        return 0;
    }
    if (section.id === 'https-usage') {
        return backendData.https_audit?.https_enabled ? 100 : 0;
    }
    if (section.id === 'robots-txt-analysis') {
        const robotsData = backendData.crawlability_and_indexability_audit?.robots_txt;
        if (!robotsData?.present) return 20;
        if (robotsData?.issues.some(i => i.includes('disallowed for all bots'))) return 0;
        return 100;
    }
    if (section.id === 'meta-robots-analysis') {
        const metaRobotsData = backendData.crawlability_and_indexability_audit?.meta_robots;
        if (metaRobotsData?.is_noindex) return 0;
        if (metaRobotsData?.is_nofollow) return 50;
        return 100;
    }
    if (section.id === 'http-status-and-redirects') {
        const redirectsData = backendData.crawlability_and_indexability_audit?.http_status_and_redirects;
        if (!redirectsData) return 100;
        const issues = Object.values(redirectsData).flatMap(r => r.issues);
        if (issues.some(i => i.includes('400') || i.includes('error'))) return 0;
        if (issues.some(i => i.includes('long redirect chain'))) return 60;
        return 100;
    }
    if (section.id === 'sitemap-validation') {
        const sitemapData = backendData.full_sitemap_audit;
        if (sitemapData?.summary?.status === 'bad') return 20;
        if (sitemapData?.summary?.status === 'warning') return 60;
        return 100;
    }
    if (section.id === 'link-audit') {
        const brokenCount = backendData.link_audit?.broken_links_count || 0;
        if (brokenCount === 0) return 100;
        if (brokenCount < 5) return 80;
        return 50;
    }
    if (section.id === 'crawl-audit') {
        const crawlAudit = backendData.crawl_audit || {};
        if (crawlAudit.issues?.some(issue => issue.includes('failed'))) return 0;
        const orphanCount = crawlAudit.orphan_pages?.length || 0;
        if (orphanCount === 0) return 100;
        return 60;
    }

    if (section.status === 'good') return 100;
    if (section.status === 'warning') return 60;
    return 20;
};

const getCategoryStatus = (sections) => {
    if (sections.some(s => s.status === 'bad' || s.status === 'critical' || s.status === 'poor')) return 'bad';
    if (sections.some(s => s.status === 'warning' || s.status === 'fair')) return 'warning';
    return 'good';
};


const AppModals = ({
    showTopKeywordsModal, setShowTopKeywordsModal, keywordsModalData,
    showSuggestionsModal, setShowSuggestionsModal,
    showHeadingsModal, setShowHeadingsModal, headingsData,
    showBrokenLinksModal, setShowBrokenLinksModal, brokenLinksData,
    showFixedWidthElementsModal, setShowFixedWidthElementsModal, fixedWidthElementsModalData,
    showResponsivenessIssuesModal, setShowResponsivenessIssuesModal, responsivenessIssuesModalData,
    showRedirectsModal, setShowRedirectsModal, redirectsModalData,
    showSitemapIssuesModal, setShowSitemapIssuesModal, sitemapIssuesModalData,
    showStructuredDataIssuesModal, setShowStructuredDataIssuesModal, structuredDataAuditData,
    showLocalSeoIssuesModal, setShowLocalSeoIssuesModal, localSeoAuditData,
    showImageIssuesModal, setShowImageIssuesModal, imageIssuesModalData,
    showMobileIssuesModal, setShowMobileIssuesModal, mobileIssuesModalData,
    showCrawlGraphModal, setShowCrawlGraphModal, crawlGraphData,
    showA11yIssuesModal, setShowA11yIssuesModal, a11yAuditData,
}) => {
    const [sitemapFilter, setSitemapFilter] = useState('all');
    const modalRef = useRef(null);
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        const root = document.getElementById('modal-root');
        setPortalRoot(root || null);
    }, []);

    useEffect(() => {
        const handleOverflow = () => {
            const modalsOpen = showTopKeywordsModal || showSuggestionsModal || showHeadingsModal || showBrokenLinksModal || showFixedWidthElementsModal || showResponsivenessIssuesModal || showRedirectsModal || showSitemapIssuesModal || showStructuredDataIssuesModal || showLocalSeoIssuesModal || showImageIssuesModal || showMobileIssuesModal || showCrawlGraphModal || showA11yIssuesModal;
            document.body.style.overflow = modalsOpen ? 'hidden' : 'unset';
        };
        handleOverflow();
        const timer = setTimeout(() => {
            if (modalRef.current) modalRef.current.focus();
        }, 50);
        return () => {
            clearTimeout(timer);
            handleOverflow();
        };
    }, [showTopKeywordsModal, showSuggestionsModal, showHeadingsModal, showBrokenLinksModal, showFixedWidthElementsModal, showResponsivenessIssuesModal, showRedirectsModal, showSitemapIssuesModal, showStructuredDataIssuesModal, showLocalSeoIssuesModal, showImageIssuesModal, showMobileIssuesModal, showCrawlGraphModal, showA11yIssuesModal]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowTopKeywordsModal(false);
                setShowSuggestionsModal(false);
                setShowHeadingsModal(false);
                setShowBrokenLinksModal(false);
                setShowFixedWidthElementsModal(false);
                setShowResponsivenessIssuesModal(false);
                setShowRedirectsModal(false);
                setShowSitemapIssuesModal(false);
                setShowStructuredDataIssuesModal(false);
                setShowLocalSeoIssuesModal(false);
                setShowImageIssuesModal(false);
                setShowMobileIssuesModal(false);
                setShowCrawlGraphModal(false);
                setShowA11yIssuesModal(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setShowTopKeywordsModal, setShowSuggestionsModal, setShowHeadingsModal, setShowBrokenLinksModal, setShowFixedWidthElementsModal, setShowResponsivenessIssuesModal, setShowRedirectsModal, setShowSitemapIssuesModal, setShowStructuredDataIssuesModal, setShowLocalSeoIssuesModal, setShowImageIssuesModal, setShowMobileIssuesModal, setShowCrawlGraphModal, setShowA11yIssuesModal]);

    if (!portalRoot) return null;

    const modalTransitionClasses = 'transition-opacity duration-300 ease-out transform';

    const handleCloseModal = () => {
        setShowTopKeywordsModal(false);
        setShowSuggestionsModal(false);
        setShowHeadingsModal(false);
        setShowBrokenLinksModal(false);
        setShowFixedWidthElementsModal(false);
        setShowResponsivenessIssuesModal(false);
        setShowRedirectsModal(false);
        setShowSitemapIssuesModal(false);
        setShowStructuredDataIssuesModal(false);
        setShowLocalSeoIssuesModal(false);
        setShowImageIssuesModal(false);
        setShowMobileIssuesModal(false);
        setShowCrawlGraphModal(false);
        setShowA11yIssuesModal(false);
    };

    const renderModal = (show, title, data, renderContent) => {
        if (!show || !data) return null;

        return ReactDOM.createPortal(
            <motion.div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
            >
                <motion.div
                    className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 dark:border-gray-700 ${modalTransitionClasses}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    role="dialog"
                    aria-modal="true"
                    tabIndex="-1"
                    ref={modalRef}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleCloseModal}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label="Close modal"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">{title}</h3>
                    {renderContent(data)}
                </motion.div>
            </motion.div>,
            portalRoot
        );
    };
    const renderSitemapModalContent = (data) => {
        const filters = ['all', 'errors', 'noindex', 'disallowed'];
        const filteredUrls = data.audited_urls?.filter(url => {
            if (sitemapFilter === 'errors') return url.http_status >= 400;
            if (sitemapFilter === 'noindex') return url.is_noindexed;
            if (sitemapFilter === 'disallowed') return url.is_disallowed;
            return true;
        }) || [];

        return (
            <div>
                <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-4">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setSitemapFilter(filter)}
                            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${sitemapFilter === filter ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="overflow-auto max-h-[65vh]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        {/* ... table headers: URL, Status, Details ... */}
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">HTTP Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUrls.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 break-all">
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{item.url}</a>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">
                                        <span className={
                                            item.http_status >= 400 ? 'text-red-600 dark:text-red-400' :
                                                item.http_status >= 300 ? 'text-orange-500 dark:text-orange-300' : 'text-green-600 dark:text-green-400'
                                        }>
                                            {item.http_status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex flex-col space-y-1">
                                            {item.is_disallowed && <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">Disallowed by robots.txt</span>}
                                            {item.is_noindexed && <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-300">Meta Noindex</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUrls.length === 0 && <p className="text-center p-8 text-gray-500 dark:text-gray-400">No URLs match the selected filter.</p>}
                </div>
            </div>
        );
    };
    
    const renderA11yIssuesModalContent = (data) => {
        return (
            <div className="space-y-4">
                <p className={`font-bold text-lg ${data.status === 'good' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {data.issues.length > 0 ? 'Found Issues' : 'No Major Issues Found'}
                </p>
                {data.issues.length > 0 && (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                        {data.issues.map((issue, index) => (
                            <li key={index} className="mb-2">{issue}</li>
                        ))}
                    </ul>
                )}
                {data.recommendations.length > 0 && (
                    <>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Recommendations</p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                            {data.recommendations.map((rec, index) => (
                                <li key={index} className="mb-2">{rec}</li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            {renderModal(
                showTopKeywordsModal && keywordsModalData?.top_keywords?.length > 0,
                "Top Keywords",
                keywordsModalData.top_keywords,
                (data) => (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Keyword</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        <Tooltip text="Estimated monthly search volume.">
                                            <span>Volume</span>
                                        </Tooltip>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        <Tooltip text="Keyword Difficulty score from 0-100. Higher is harder to rank for.">
                                            <span>Difficulty</span>
                                        </Tooltip>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Frequency</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Density (%)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((kw, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{kw.keyword}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{kw.frequency}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{kw.density}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
            {renderModal(
                showSuggestionsModal && keywordsModalData?.keyword_suggestions?.length > 0,
                "Keyword Suggestions",
                keywordsModalData.keyword_suggestions,
                (data) => (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                        {data.map((suggestion, index) => (
                            <li key={index} className="mb-2">
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                )
            )}
            {renderModal(
                showHeadingsModal && headingsData,
                "Heading Structure",
                headingsData,
                (data) => (
                    data.heading_order?.length > 0 || data.issues?.length > 0 ? (
                        <div className="p-4">
                            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">All Headings</h4>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4">
                                {data.heading_order.map((heading, index) => (
                                    <li key={index} className="mb-1">
                                        &lt;{heading.tag}&gt; {heading.text}
                                    </li>
                                ))}
                            </ul>
                            {data.issues.length > 0 && (
                                <>
                                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Issues</h4>
                                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                                        {data.issues.map((issue, index) => (
                                            <li key={index} className="mb-1">
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-green-600 dark:text-green-400 text-center text-xl py-8">No heading issues or headings found.</p>
                    )
                )
            )}
            {renderModal(
                showBrokenLinksModal && brokenLinksData?.length > 0,
                "Broken Links Found",
                brokenLinksData,
                (data) => (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Link URL</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Anchor Text</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((link, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white break-all">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                                {link.url}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 whitespace-normal text-sm text-red-700 dark:text-red-300">{link.statusCode}</td>
                                        <td className="px-4 py-3 whitespace-normal text-sm text-gray-500 dark:text-gray-400">{link.anchorText}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
            {renderModal(
                showFixedWidthElementsModal && fixedWidthElementsModalData?.length > 0,
                "Fixed-Width Elements",
                fixedWidthElementsModalData,
                (data) => (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Tag</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Value</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Source</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {data.map((element, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                        <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-white">&lt;{element.tag}&gt;</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-300">{element.value}</td>
                                        <td className="px-4 py-3 whitespace-normal text-base text-gray-700 dark:text-gray-300">{element.source}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
            {renderModal(
                showResponsivenessIssuesModal && responsivenessIssuesModalData?.length > 0,
                "Responsiveness Issues",
                responsivenessIssuesModalData,
                (data) => (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                        {data.map((issue, index) => (
                            <li key={index} className="mb-2">
                                {issue}
                            </li>
                        ))}
                    </ul>
                )
            )}
            {renderModal(
                showRedirectsModal && redirectsModalData,
                "Redirect Chains",
                redirectsModalData,
                (data) => (
                    <div className="space-y-4">
                        {Object.keys(data).map((url, index) => {
                            const chain = data[url];
                            const isGood = chain.final_status_code >= 200 && chain.final_status_code < 300 && chain.redirect_chain.length <= 2;
                            const statusColor = isGood ? 'text-green-500 dark:text-green-400' : chain.final_status_code >= 400 ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-300';
                            return (
                                <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-900 dark:text-white break-all mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Original URL:</span> {url}
                                    </p>
                                    <p className="flex items-center text-sm font-medium">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${isGood ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        Final Status: <span className={`ml-1 font-bold ${statusColor}`}>{chain.final_status_code || 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                        <span className="font-semibold">Redirect Path:</span>
                                        <span className="break-all block md:inline">
                                            {chain.redirect_chain.map((link, i) => (
                                                <span key={i} className="text-xs md:text-sm">
                                                    {i > 0 && <span className="mx-1">→</span>}
                                                    <span className="text-blue-500 dark:text-blue-400 hover:underline">{link}</span>
                                                </span>
                                            ))}
                                        </span>
                                    </p>
                                    {chain.issues.length > 0 && (
                                        <ul className="mt-2 list-disc list-inside text-red-500 dark:text-red-400 text-xs">
                                            {chain.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            )}
            {renderModal(
                showSitemapIssuesModal,
                "Sitemap URL Audit",
                sitemapIssuesModalData,
                renderSitemapModalContent
            )}

            {renderModal(
                showStructuredDataIssuesModal && structuredDataAuditData?.issues?.length > 0,
                "Structured Data Issues",
                structuredDataAuditData,
                (data) => (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                        {data.issues.map((issue, index) => (
                            <li key={index} className="mb-2">
                                {issue}
                            </li>
                        ))}
                    </ul>
                )
            )}
            {renderModal(
                showLocalSeoIssuesModal && localSeoAuditData?.issues?.length > 0,
                "Local SEO Issues",
                localSeoAuditData,
                (data) => (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                        {data.issues.map((issue, index) => (
                            <li key={index} className="mb-2">
                                {issue}
                            </li>
                        ))}
                    </ul>
                )
            )}
            {renderModal(
                showImageIssuesModal && (imageIssuesModalData?.detailed_issues?.length > 0 || imageIssuesModalData?.recommendations?.length > 0),
                "Image Issues",
                imageIssuesModalData,
                (data) => (
                    <div className="space-y-4">
                        {data.detailed_issues.length > 0 && (
                            <>
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Issues</h4>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                                    {data.detailed_issues.map((issue, index) => (
                                        <li key={index} className="mb-2">
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {data.recommendations.length > 0 && (
                            <>
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Recommendations</h4>
                                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                                    {data.recommendations.map((rec, index) => (
                                        <li key={index} className="mb-2">{rec}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )
            )}
            {renderModal(
                showMobileIssuesModal && mobileIssuesModalData,
                "Mobile Experience Issues",
                mobileIssuesModalData,
                (data) => (
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 p-4">
                        {data.map((issue, index) => (
                            <li key={index} className="mb-2">
                                {issue}
                            </li>
                        ))}
                    </ul>
                )
            )}
            {renderModal(
                showCrawlGraphModal && crawlGraphData,
                "Crawl Depth & Internal Linking Graph",
                crawlGraphData,
                (data) => (
                    <div className="h-[600px] w-full">
                        {data?.nodes && data.edges ? (
                            <CrawlGraph nodes={data.nodes} links={data.edges} orphanPages={data.orphan_pages} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 dark:text-gray-400">No crawl data to display.</p>
                            </div>
                        )}
                    </div>
                )
            )}
            {renderModal(
                showA11yIssuesModal,
                "Accessibility Issues",
                a11yAuditData,
                renderA11yIssuesModalContent
            )}
        </>
    );
};

const Report = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reportId } = useParams();
    const websiteUrl = location.state?.websiteUrl;
    const targetKeyword = location.state?.targetKeyword;

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('Initializing analysis...');
    const [currentUser, setCurrentUser] = useState(undefined);
    const [highlightedCard, setHighlightedCard] = useState(null); // State for highlighting

    const [agencyName, setAgencyName] = useState('');
    const [agencyLogoPreview, setAgencyLogoPreview] = useState(null);

    const [showTopKeywordsModal, setShowTopKeywordsModal] = useState(false);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const [keywordsModalData, setKeywordsModalData] = useState({ top_keywords: [], keyword_suggestions: [] });
    const [showHeadingsModal, setShowHeadingsModal] = useState(false);
    const [headingsModalData, setHeadingsModalData] = useState(null);
    const [showBrokenLinksModal, setShowBrokenLinksModal] = useState(false);
    const [brokenLinksModalData, setBrokenLinksModalData] = useState(null);
    const [showFixedWidthElementsModal, setShowFixedWidthElementsModal] = useState(false);
    const [fixedWidthElementsModalData, setFixedWidthElementsModalData] = useState(null);
    const [showResponsivenessIssuesModal, setShowResponsivenessIssuesModal] = useState(false);
    const [responsivenessIssuesModalData, setResponsivenessIssuesModalData] = useState(null);
    const [showRedirectsModal, setShowRedirectsModal] = useState(false);
    const [redirectsModalData, setRedirectsModalData] = useState(null);
    const [showSitemapIssuesModal, setShowSitemapIssuesModal] = useState(false);
    const [sitemapIssuesModalData, setSitemapIssuesModalData] = useState(null);
    const [showStructuredDataIssuesModal, setShowStructuredDataIssuesModal] = useState(false);
    const [structuredDataIssuesModalData, setStructuredDataIssuesModalData] = useState(null);
    const [showLocalSeoIssuesModal, setShowLocalSeoIssuesModal] = useState(false);
    const [localSeoIssuesModalData, setLocalSeoIssuesModalData] = useState(null);
    const [showImageIssuesModal, setShowImageIssuesModal] = useState(false);
    const [imageIssuesModalData, setImageIssuesModalData] = useState(null);
    const [showMobileIssuesModal, setShowMobileIssuesModal] = useState(false);
    const [mobileIssuesModalData, setMobileIssuesModalData] = useState(useState(null));
    // NEW STATE FOR CRAWL GRAPH MODAL
    const [showCrawlGraphModal, setShowCrawlGraphModal] = useState(false);
    const [crawlGraphData, setCrawlGraphData] = useState(null);
    // NEW STATE FOR A11Y MODAL
    const [showA11yIssuesModal, setShowA11yIssuesModal] = useState(false);
    const [a11yIssuesModalData, setA11yIssuesModalData] = useState(null);


    const reportRef = useRef(null);
    const sectionRefs = useRef({});

    const handleScrollToAction = (cardId) => {
        const cardRef = sectionRefs.current[cardId];
        if (cardRef) {
            cardRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setHighlightedCard(cardId);
            setTimeout(() => {
                setHighlightedCard(null);
            }, 2500); // Highlight lasts for 2.5 seconds
        }
    };
    

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
            setError("Failed to log out.");
        }
    };
        const handleDownload = async () => {
      try {
        const response = await axios.post('https://seo-report-11.onrender.com/generate-pdf', {
          reportData,
          agencyName,
          agencyLogoPreview,
        }, { responseType: 'blob' });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'seo_report.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('Download Error:', error);
        alert('Failed to download report.');
      }
    };
    
    // ⭐ 4. Extract your report processing logic into a reusable function
    const processAndGroupReportData = (fullReportData) => {
        const groupedSections = {
            'Competitive Analysis': [],
            'Technical SEO': [],
            'Page Speed & Core Web Vitals': [],
            'Content': [],
            'Crawlability & Indexability': [],
            'User Experience': [],
            'Security': [],
            'Accessibility Analysis': []
        };

        let parsedStrategy = null;
        try {
            if (typeof fullReportData.ai_strategy === 'string' && fullReportData.ai_strategy) {
                // For older reports where strategy might be a string
                parsedStrategy = JSON.parse(fullReportData.ai_strategy);
            } else {
                // For new reports, it's already an object
                parsedStrategy = fullReportData.ai_strategy;
            }
        } catch (e) {
            console.error("Failed to parse AI strategy JSON:", e);
            parsedStrategy = {
                summary: "Could not load AI analysis. The data might be malformed.",
                critical_issues: [],
                high_priority_warnings: [],
                content_strategy: ""
            };
        }
        
        // Create a new object with the correctly parsed/handled strategy
        const backendDataWithParsedStrategy = { ...fullReportData, ai_strategy: parsedStrategy };

        const getStatusFromBackend = (statusText) => {
            if (typeof statusText !== 'string') return 'bad';
            const lowerStatus = statusText.toLowerCase();
            if (lowerStatus.includes('optimal') || lowerStatus.includes('good') || lowerStatus.includes('present') || lowerStatus.includes('found')) return 'good';
            if (lowerStatus.includes('partial') || lowerStatus.includes('warning') || lowerStatus.includes('too short') || lowerStatus.includes('too long') || lowerStatus.includes('multiple')) return 'warning';
            return 'bad';
        };
        
        const getMobileResponsivenessDisplayStatus = (auditData) => {
            const hasViewportMeta = auditData?.viewport_tag;
            const issues = auditData?.issues || [];
            if (hasViewportMeta && issues.length === 0) return 'good';
            else if (hasViewportMeta) return 'warning';
            else return 'bad';
        };

        const getMobileResponsivenessExplanation = (auditData) => {
            const hasViewportMeta = auditData?.viewport_tag;
            const viewportContent = auditData?.viewport_content;
            const issues = auditData?.issues || [];
            let explanationText = '';
            if (issues.length > 0) explanationText = issues.join('; ');
            else if (!hasViewportMeta) explanationText = 'Missing viewport meta tag. This is crucial for proper scaling on mobile devices.';
            else if (!viewportContent || !viewportContent.includes("width=device-width")) explanationText = `Viewport meta tag found but is not correctly configured (content: "${viewportContent || 'N/A'}"). Ensure "width=device-width" is present.`;
            else explanationText = 'No significant mobile responsiveness issues found.';
            return explanationText;
        };
        
        const metadataAudit = fullReportData.metadata_audit || {};
        const pagespeedAudit = fullReportData.pagespeed_audit || {};
        const overallScore = fullReportData.overall_score || 0;
        const mobileScore = pagespeedAudit?.mobile?.performance_score;
        let pagespeedStatus = 'good';
        let pagespeedExplanation = 'Page speed and Core Web Vitals scores are excellent.';
        if (mobileScore !== undefined && mobileScore !== null) {
            if (mobileScore < 50) {
                pagespeedStatus = 'bad';
                pagespeedExplanation = 'Mobile performance is critically low. This will negatively impact user experience and search rankings.';
            } else if (mobileScore < 90) {
                pagespeedStatus = 'warning';
                pagespeedExplanation = 'Mobile performance is moderate. Consider optimizing to improve user experience and SEO.';
            }
        } else {
            pagespeedStatus = 'warning';
            pagespeedExplanation = 'Could not fetch PageSpeed data. Check your API key or try again later.';
        }
        groupedSections['Page Speed & Core Web Vitals'].push({
            id: 'pagespeed-audit',
            title: 'Page Speed & Core Web Vitals',
            status: pagespeedStatus,
            explanation: pagespeedExplanation,
            pagespeedData: pagespeedAudit
        });

        const titleStatus = getStatusFromBackend(metadataAudit.title?.status);
        const titleExplanation = metadataAudit.title?.recommendation || 'Title tag analysis failed.';
        groupedSections.Content.push({
            id: 'title-optimization',
            title: 'Title Optimization',
            status: titleStatus,
            explanation: titleExplanation,
            metadataLengthData: metadataAudit.title
        });
        
        const metaDescriptionStatus = getStatusFromBackend(metadataAudit.meta_description?.status);
        const metaDescriptionExplanation = metadataAudit.meta_description?.recommendation || 'Meta description analysis failed.';
        groupedSections.Content.push({
            id: 'meta-description',
            title: 'Meta Description',
            status: metaDescriptionStatus,
            explanation: metaDescriptionExplanation,
            metadataLengthData: metadataAudit.meta_description
        });
        
        const headingAudit = fullReportData.heading_audit || {};
        const h1Count = headingAudit.h1_count || 0;
        const headingIssues = headingAudit.issues || [];
        let headingStatus = 'good';
        if (h1Count === 0 || headingIssues.some(issue => issue.startsWith('❌'))) headingStatus = 'bad';
        else if (h1Count > 1 || headingIssues.some(issue => issue.startsWith('⚠️'))) headingStatus = 'warning';
        groupedSections.Content.push({
            id: 'heading-structure',
            title: 'Content Structure',
            status: headingStatus,
            explanation: h1Count === 0 ? 'Missing H1 tag. This is crucial for content hierarchy and SEO.' : h1Count === 1 && headingIssues.length === 0 ? 'Heading structure looks good!' : 'Potential issues found in heading structure. See details below.',
            headingCounts: { h1_count: h1Count, h2_count: headingAudit.h2_count || 0, h3_count: headingAudit.h3_count || 0 },
            headingOrder: headingAudit.heading_order || [],
            headingIssues: headingIssues,
        });
        
        const contentAnalysis = fullReportData.content_analysis || {};
        const readabilityInfo = getReadabilityStatus(contentAnalysis.readability_score || 0);
        const uniquenessStatus = contentAnalysis.uniqueness_analysis?.is_unique ? 'good' : 'bad';
        let contentAnalysisStatus = readabilityInfo.status;
        if (!contentAnalysis.top_keywords || contentAnalysis.top_keywords.length === 0) contentAnalysisStatus = 'bad';
        else if (contentAnalysis.keyword_suggestions && contentAnalysis.keyword_suggestions.some(s => s.startsWith('❌') || s.startsWith('⚠️'))) {
            if (contentAnalysisStatus === 'good') contentAnalysisStatus = 'warning';
        }
        if (uniquenessStatus === 'bad') contentAnalysisStatus = 'bad';
        groupedSections.Content.push({
            id: 'content-quality-analysis',
            title: 'Content Quality Analysis',
            status: contentAnalysisStatus,
            explanation: contentAnalysis.keyword_suggestions?.length > 0 ? contentAnalysis.keyword_suggestions.join('; ') : 'Content analysis completed. See details.',
            contentAnalysisData: contentAnalysis,
        });

        const keywordAnalysis = fullReportData.content_analysis?.keyword_analysis;
        let keywordAnalysisStatus = 'good';
        if (keywordAnalysis?.some(k => k.recommendations.length > 0)) {
            keywordAnalysisStatus = 'warning';
            if (keywordAnalysis?.some(k => k.recommendations.some(r => r.includes('too high')))) keywordAnalysisStatus = 'bad';
        }
        groupedSections.Content.push({
            id: 'keyword-analysis',
            title: 'Keyword Analysis',
            status: keywordAnalysisStatus,
            explanation: keywordAnalysisStatus === 'good' ? `Keywords appear well-optimized.` : `Issues found with keyword presence or density. See details.`,
            keywordPresenceAnalysis: keywordAnalysis
        });

        const imageAnalysis = fullReportData.image_analysis || {};
        let imageStatus = 'good';
        if (imageAnalysis.images_without_alt > 0 || (imageAnalysis.detailed_issues && imageAnalysis.detailed_issues.some(i => i.includes('❌')))) imageStatus = 'bad';
        else if (imageAnalysis.detailed_issues && imageAnalysis.detailed_issues.some(i => i.includes('⚠️'))) imageStatus = 'warning';
        groupedSections['Technical SEO'].push({
            id: 'image-accessibility',
            title: 'Image Accessibility',
            status: imageStatus,
            explanation: `Found ${imageAnalysis.images_without_alt} images with missing/empty alt text out of ${imageAnalysis.content_images} content images.`,
            imageAnalysisData: imageAnalysis,
        });
        
        const structuredDataAudit = fullReportData.structured_data_audit || {};
        let structuredDataStatus = 'good';
        let structuredDataExplanation = 'Structured data is present and valid.';
        if (!structuredDataAudit.ld_json_found) {
            structuredDataStatus = 'bad';
            structuredDataExplanation = 'No structured data schema found. Consider adding JSON-LD for rich snippets.';
        } else if (structuredDataAudit.invalid_schemas?.length > 0) {
            structuredDataStatus = 'bad';
            structuredDataExplanation = `Found ${structuredDataAudit.invalid_schemas.length} invalid structured data schemas.`;
        }
        groupedSections['Technical SEO'].push({
            id: 'structured-data-schema',
            title: 'Structured Data Schema',
            status: structuredDataStatus,
            explanation: structuredDataExplanation,
            structuredDataAuditData: structuredDataAudit
        });

        const localSeoAudit = fullReportData.local_seo_audit || {};
        let localSeoStatus = localSeoAudit.status?.toLowerCase().includes('present') ? 'good' :
            localSeoAudit.status?.toLowerCase().includes('partial') ? 'warning' : 'bad';
        let localSeoExplanation = localSeoAudit.status || 'No local SEO data available.';
        groupedSections['Technical SEO'].push({
            id: 'local-seo-audit',
            title: 'Local SEO',
            status: localSeoStatus,
            explanation: localSeoExplanation,
            localSeoAuditData: localSeoAudit
        });
        
        const a11yAudit = fullReportData.a11y_audit || {};
        const a11yStatus = a11yAudit.status;
        const a11yExplanation = a11yAudit.issues.length > 0
            ? `Found ${a11yAudit.issues.length} accessibility issues. Please review them.`
            : 'No major accessibility issues found.';
        groupedSections['Accessibility Analysis'].push({
            id: 'a11y-analysis',
            title: 'Accessibility Analysis',
            status: a11yStatus,
            explanation: a11yExplanation,
            a11yAuditData: a11yAudit
        });
        
        const mobileResponsivenessAudit = fullReportData.mobile_responsiveness_audit || {};
        const mobileResponsivenessStatus = getMobileResponsivenessDisplayStatus(mobileResponsivenessAudit);
        const mobileResponsivenessExplanation = getMobileResponsivenessExplanation(mobileResponsivenessAudit);
        groupedSections['User Experience'].push({
            id: 'mobile-responsiveness-audit',
            title: 'Mobile Experience',
            status: mobileResponsivenessStatus,
            explanation: mobileResponsivenessExplanation,
            mobileResponsivenessData: mobileResponsivenessAudit
        });
        
        const ogTwitterAudit = fullReportData.social_media_tags || {};
        let socialMetaStatus = 'bad';
        if (ogTwitterAudit?.open_graph?.title?.present && ogTwitterAudit?.open_graph?.image?.present) socialMetaStatus = 'good';
        else if (ogTwitterAudit?.open_graph?.title?.present || ogTwitterAudit?.open_graph?.image?.present || ogTwitterAudit?.twitter_cards?.title?.present || ogTwitterAudit?.twitter_cards?.image?.present) socialMetaStatus = 'warning';
        groupedSections['User Experience'].push({
            id: 'social-media-integration',
            title: 'Social Media Integration',
            status: socialMetaStatus,
            explanation: ogTwitterAudit?.issues?.length > 0 ? ogTwitterAudit.issues.join('; ') : 'All key social tags are present.',
            ogTwitterData: ogTwitterAudit
        });
        
        const httpsAudit = fullReportData.https_audit || {};
        groupedSections.Security.push({
            id: 'https-usage',
            title: 'HTTPS Usage',
            status: httpsAudit.https_enabled ? 'good' : 'bad',
            explanation: httpsAudit.https_enabled ? 'Site is using HTTPS. Good for security and SEO.' : 'Site is not using HTTPS. This affects security and search rankings.',
            httpsAuditData: httpsAudit
        });
        
        const crawlabilityData = fullReportData.crawlability_and_indexability_audit || {};
        let robotsTxtStatus = crawlabilityData.robots_txt?.present ? 'good' : 'bad';
        if (crawlabilityData.robots_txt?.issues?.some(i => i.includes('❌'))) robotsTxtStatus = 'bad';
        else if (crawlabilityData.robots_txt?.issues?.some(i => i.includes('⚠️'))) robotsTxtStatus = 'warning';
        groupedSections['Crawlability & Indexability'].push({
            id: 'robots-txt-analysis',
            title: 'Robots.txt Analysis',
            status: robotsTxtStatus,
            explanation: robotsTxtStatus === 'good' ? 'Robots.txt file found and appears valid.' : 'Robots.txt file not found or has critical issues.',
            robotsTxtData: crawlabilityData.robots_txt
        });

        const metaRobotsStatus = crawlabilityData.meta_robots?.is_noindex ? 'bad' : crawlabilityData.meta_robots?.is_nofollow ? 'warning' : 'good';
        groupedSections['Crawlability & Indexability'].push({
            id: 'meta-robots-analysis',
            title: 'Meta Robots Tag',
            status: metaRobotsStatus,
            explanation: crawlabilityData.meta_robots?.issues?.find(i => i.startsWith('❌')) || crawlabilityData.meta_robots?.issues?.find(i => i.includes('⚠️')) || 'Page is indexable and followable by default.',
            metaRobotsData: crawlabilityData.meta_robots
        });

        let httpStatus = 'good';
        if (Object.values(crawlabilityData.http_status_and_redirects || {}).some(r => r.issues.some(i => i.includes('❌')))) httpStatus = 'bad';
        else if (Object.values(crawlabilityData.http_status_and_redirects || {}).some(r => r.issues.some(i => i.includes('⚠️')))) httpStatus = 'warning';
        groupedSections['Crawlability & Indexability'].push({
            id: 'http-status-and-redirects',
            title: 'HTTP Status & Redirects',
            status: httpStatus,
            explanation: httpStatus === 'good' ? 'Main pages respond with 200 OK and no long redirect chains.' : 'Issues with HTTP status codes or redirects found.',
            httpStatusAndRedirectsData: crawlabilityData.http_status_and_redirects
        });
        
        const fullSitemapAudit = fullReportData.full_sitemap_audit || {};
        let sitemapAuditStatus = 'good';
        if (fullSitemapAudit?.summary?.status === 'bad') sitemapAuditStatus = 'bad';
        else if (fullSitemapAudit?.summary?.status === 'warning') sitemapAuditStatus = 'warning';
        groupedSections['Crawlability & Indexability'].push({
            id: 'sitemap-validation',
            title: 'Sitemap Validation',
            status: sitemapAuditStatus,
            explanation: fullSitemapAudit?.summary?.message || 'Sitemap validation failed.',
            sitemapValidationData: fullReportData.full_sitemap_audit
        });
        
        const linkAudit = fullReportData.link_audit || {};
        let linkStatus = 'good';
        if (linkAudit.broken_links_count > 0) {
            linkStatus = 'bad';
        }
        groupedSections['Technical SEO'].push({
            id: 'link-audit',
            title: 'Link Profile',
            status: linkStatus,
            explanation: linkAudit.broken_links_count > 0
                ? `${linkAudit.broken_links_count} broken links were found.`
                : 'No broken links found. Internal and external links are healthy.',
            linkAuditData: linkAudit
        });

        const crawlAudit = fullReportData.crawl_audit || {};
        let crawlStatus = 'good';
        let crawlExplanation = 'No crawl issues detected. Site architecture appears healthy.';
        if (crawlAudit.orphan_pages?.length > 0) {
            crawlStatus = 'warning';
            crawlExplanation = `Found ${crawlAudit.orphan_pages.length} potential orphan pages. These pages may be hard for search engines to discover.`;
        }
        if (crawlAudit.issues?.some(issue => issue.includes('failed'))) {
            crawlStatus = 'bad';
            crawlExplanation = crawlAudit.issues.find(issue => issue.includes('failed'));
        }
        groupedSections['Crawlability & Indexability'].push({
            id: 'crawl-audit',
            title: 'Crawl Depth & Architecture',
            status: crawlStatus,
            explanation: crawlExplanation,
            crawlAuditData: crawlAudit
        });

        const serpAnalysis = fullReportData.serp_analysis || { status: 'skipped', reason: 'No data available.' };

groupedSections['Competitive Analysis'].push({
    id: 'serp-analysis',
    title: 'SERP & Content Gap',
    status: serpAnalysis.status === 'completed' ? 'good' : 'warning',
    explanation: serpAnalysis.status === 'completed'
        ? `Analysis of top competitors for the keyword "${serpAnalysis.targetKeyword}".`
        : `SERP analysis was ${serpAnalysis.status}. Reason: ${serpAnalysis.reason || 'N/A'}.`,
    serpAnalysisData: serpAnalysis,
});
        return {
            url: fullReportData.url,
            timestamp: new Date(fullReportData.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            overallScore: fullReportData.overall_score,
            groupedSections: groupedSections,
            backendData: backendDataWithParsedStrategy,
        };
    };


    // ⭐ 3. Replace your entire main useEffect with this logic
useEffect(() => {
        if (typeof currentUser === 'undefined') return;

        const processSseMessage = (messageBlock) => {
            const lines = messageBlock.split('\n');
            let eventType = null;
            let data = '';

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    eventType = line.substring(7).trim();
                } else if (line.startsWith('data: ')) {
                    data += line.substring(6).trim();
                }
            }

            if (!eventType || !data) return;

            try {
                const jsonData = JSON.parse(data);
                if (eventType === 'progress') {
                    setProgress(jsonData.progress);
                    setLoadingMessage(jsonData.message);
                } else if (eventType === 'complete') {
                    const processedData = processAndGroupReportData(jsonData);
                    setReportData(processedData);
                    setProgress(100);
                    setTimeout(() => setLoading(false), 500);
                } else if (eventType === 'error') {
                    throw new Error(jsonData.detail);
                }
            } catch (e) {
                console.error("Failed to process SSE message:", e, "Data:", data);
                setError(`An error occurred while processing the report: ${e.message}`);
                setLoading(false);
            }
        };

        const fetchWithStreaming = async () => {
            setLoading(true);
            setError('');
            setProgress(0);
            setLoadingMessage('Connecting to analysis server...');

            try {
                const response = await fetch('https://seo-report-11.onrender.com/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: websiteUrl,
                        keyword: targetKeyword,
                        userId: currentUser.uid,
                        appId: firebaseConfig.projectId
                    })
                });

                if (!response.ok || !response.body) {
                    throw new Error(`Server returned status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (buffer.length > 0) processSseMessage(buffer);
                        break;
                    }
                    buffer += decoder.decode(value, { stream: true });

                    const messages = buffer.split('\n\n');
                    buffer = messages.pop();

                    for (const message of messages) {
                        if (message) processSseMessage(message);
                    }
                }

            } catch (err) {
                console.error("Error fetching report stream:", err);
                setError(err.message || 'Something went wrong while fetching the report.');
                setLoading(false);
            }
        };

        const fetchSavedReport = async () => {
            setLoading(true);
            setLoadingMessage('Loading saved report...');
            try {
                const token = await currentUser.getIdToken();
                const response = await axios.get(`http://localhost:4000/get-report/${reportId}`, {
                    params: {
                        userId: currentUser.uid,
                        appId: firebaseConfig.projectId
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const fullReportData = response.data;
                const processedData = processAndGroupReportData(fullReportData);
                setReportData(processedData);
                
            } catch (err) {
                console.error("Error fetching saved report:", err);
                setError(err.response?.data?.error || 'Failed to load the saved report.');
            } finally {
                setLoading(false);
            }
        };

        
        if (reportId && currentUser) {
            fetchSavedReport();
        } else if (websiteUrl && currentUser) {
            fetchWithStreaming();
        } else if (!reportId && !websiteUrl) {
            setError("No URL was provided to generate a report.");
            setLoading(false);
        }

    }, [reportId, websiteUrl, currentUser, navigate]);// Add reportId to dependency array

    if (loading) {
        return <PremiumLoadingScreen progress={progress} messages={[loadingMessage]} />;
    }

    if (error || !reportData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-500">
                <p className="text-red-500 text-lg font-semibold text-center mb-4">{error}</p>
                <button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition">Back to Home</button>
            </div>
        );
    }
    const { url: reportUrl, overallScore, groupedSections = {}, backendData = {} } = reportData || {};

    const categoryColors = {
        'Content': '#5C6BC0',
        'Technical SEO': '#42A5F5',
        'Page Speed & Core Web Vitals': '#3b82f6',
        'User Experience': '#FFCA28',
        'Security': '#EF5350',
        'Crawlability & Indexability': '#AB47BC',
        'Accessibility Analysis': '#14B8A6'
    };

    const categoryBreakdownData = Object.keys(groupedSections).map(categoryName => {
        const issueCount = groupedSections[categoryName]?.filter(s => s.status !== 'good').length || 0;
        const score = issueCount === 0 ? 100 : issueCount <= 2 ? 80 : 60;
        return { name: categoryName, score, color: categoryColors[categoryName] || '#9E9E90' };
    }).filter(cat => cat.score > 0);

    const totalIssueCount = Object.values(groupedSections).reduce((acc, sections) => {
        return acc + sections.filter(s => s.status !== 'good').length;
    }, 0);
    const issueStatus = totalIssueCount >= 5 ? 'Critical' : totalIssueCount >= 2 ? 'Warning' : 'Good';

    const handleOpenHeadingsModal = (headingOrder, headingIssues) => {
        setHeadingsModalData({ heading_order: headingOrder || [], issues: headingIssues || [] });
        setShowHeadingsModal(true);
    };

    const handleOpenBrokenLinksModal = (data) => {
        setBrokenLinksModalData(data || []);
        setShowBrokenLinksModal(true);
    };

    const handleOpenFixedWidthElementsModal = (data) => {
        setFixedWidthElementsModalData(data || []);
        setShowFixedWidthElementsModal(true);
    };

    const handleOpenResponsivenessIssuesModal = (data) => {
        setResponsivenessIssuesModalData(data || []);
        setShowResponsivenessIssuesModal(true);
    };

    const handleOpenRedirectsModal = (data) => {
        setRedirectsModalData(data || {});
        setShowRedirectsModal(true);
    };
    
    const handleOpenSitemapIssuesModal = (data) => {
        setSitemapIssuesModalData(data || { issues: [] });
        setShowSitemapIssuesModal(true);
    };
    
    const handleOpenStructuredDataIssuesModal = (data) => {
        setStructuredDataIssuesModalData(data || { issues: [] });
        setShowStructuredDataIssuesModal(true);
    };
    
    const handleOpenLocalSeoIssuesModal = (data) => {
        setLocalSeoIssuesModalData(data || { issues: [] });
        setShowLocalSeoIssuesModal(true);
    };

    const handleOpenImageIssuesModal = (data) => {
        setImageIssuesModalData(data || { detailed_issues: [], recommendations: [] });
        setShowImageIssuesModal(true);
    };

    const handleOpenTopKeywordsModal = (data) => {
        setKeywordsModalData(prev => ({ ...prev, top_keywords: data || [] }));
        setShowTopKeywordsModal(true);
    };

    const handleOpenSuggestionsModal = (data) => {
        setKeywordsModalData(prev => ({ ...prev, keyword_suggestions: data || [] }));
        setShowSuggestionsModal(true);
    };
    
    const handleOpenMobileIssuesModal = (issues) => {
        setMobileIssuesModalData(issues);
        setShowMobileIssuesModal(true);
    };

    const handleOpenCrawlGraphModal = (data) => {
        setCrawlGraphData(data);
        setShowCrawlGraphModal(true);
    };
    
    // NEW: Open A11y Modal
    const handleOpenA11yIssuesModal = (data) => {
        setA11yIssuesModalData(data);
        setShowA11yIssuesModal(true);
    };
    

    const MainScorecard = () => {
        const getStatusIcon = (status) => {
            switch (status) {
                case 'good':
                    return <CheckCircle className="w-5 h-5 text-green-500" />;
                case 'warning':
                    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
                case 'bad':
                    return <AlertTriangle className="w-5 h-5 text-red-500" />;
                default:
                    return <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
            }
        };

        const getCategoryStatus = (sections) => {
            if (sections.some(s => s.status === 'bad')) return 'bad';
            if (sections.some(s => s.status === 'warning')) return 'warning';
            return 'good';
        };

        const overallScore = reportData?.overallScore || 0;
        const groupedSections = reportData?.groupedSections || {};
        const backendData = reportData?.backendData || {};

        const totalIssueCount = Object.values(groupedSections).reduce((acc, sections) => {
            return acc + sections.reduce((count, section) => {
                if (section.status === 'bad' || section.status === 'warning') {
                    return count + 1;
                }
                return count;
            }, 0);
        }, 0);
        const issueStatus = totalIssueCount >= 5 ? 'Critical' : totalIssueCount >= 2 ? 'Warning' : 'Good';

        const getCategoryIssueCount = (categoryName) => {
            const sections = groupedSections?.[categoryName] || [];
            return sections.filter(section => section.status === 'bad' || section.status === 'warning').length;
        };

        const getScoreBadgeClass = (totalIssues) => {
            if (totalIssues >= 5) return 'bg-red-500 text-white';
            if (totalIssues >= 2) return 'bg-orange-500 text-white';
            return 'bg-green-500 text-white';
        };
        
        return (
            <motion.div
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center space-y-8 border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="relative w-40 h-40 flex-shrink-0">
                    {isNaN(overallScore) ? (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-red-500">N/A</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score Unavailable</p>
                        </div>
                    ) : (
                        <>
                            <Circle
                                percent={overallScore}
                                strokeWidth={7}
                                strokeColor={overallScore >= 80 ? '#67C924' : overallScore >= 60 ? '#FFD166' : '#EF4444'}
                                trailColor="#E5E7EB"
                                trailWidth={7}
                            />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{overallScore}%</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">On-page score</p>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="w-full mt-6">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 font-semibold mb-4">
                        <span className="text-lg">Overall Breakdown</span>
                        <div className="flex items-center space-x-2">
                            <span>Issues: {totalIssueCount}</span>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${getScoreBadgeClass(totalIssueCount)}`}>
                                {issueStatus}
                            </span>
                            <Tooltip text="The number of issues found across all categories.">
                                <Info className="w-4 h-4 text-gray-400 cursor-pointer dark:text-gray-500" />
                            </Tooltip>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(groupedSections).map((categoryName, index) => {
                            const categoryStatus = getCategoryStatus(groupedSections?.[categoryName]);
                            const issuesCount = getCategoryIssueCount(categoryName);
                            return (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <span className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
                                            {getCategoryIcon(categoryName)}
                                        </span>
                                        <span className="font-medium text-gray-800 dark:text-white">{categoryName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(categoryStatus)}
                                        <span className={`text-sm font-semibold ${categoryStatus === 'good' ? 'text-green-600 dark:text-green-400' : categoryStatus === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {issuesCount === 0 ? 'No issues' : `${issuesCount} issues`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
            
            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
               <AIStrategyCard 
                    strategy={reportData.backendData.ai_strategy} 
                    onScrollToAction={handleScrollToAction}
                />
                <MainScorecard />
                <div className="space-y-12 mt-12">
                    {Object.keys(groupedSections).map(categoryName => (
                        <div key={categoryName}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                                <ElegantDivider categoryName={categoryName} />
                            </motion.div>
                            
                                <section className="flex flex-col space-y-6 mt-6">
                                    <AnimatePresence mode="wait">
                                        {groupedSections?.[categoryName]?.map((section, index) => (
                                            <div ref={el => (sectionRefs.current[section.id] = el)} key={section.id}>
                                            <ReportCard
                                                key={section.id}
                                                title={section.title}
                                                status={section.status}
                                                explanation={section.explanation}
                                                action={section.action}
                                                serpAnalysisData={section.id === 'serp-analysis' ? backendData.serp_analysis : null}
                                                contentAnalysisData={section.id === 'content-quality-analysis' ? section.contentAnalysisData : null}
                                                keywordAnalysis={section.id === 'keyword-analysis' ? section.keywordPresenceAnalysis : null}
                                                onOpenTopKeywordsModal={section.id === 'content-quality-analysis' ? () => handleOpenTopKeywordsModal(section.contentAnalysisData?.top_keywords || []) : null}
                                                onOpenSuggestionsModal={section.id === 'content-quality-analysis' ? () => handleOpenSuggestionsModal(section.contentAnalysisData?.keyword_suggestions || []) : null}
                                                headingAuditData={section.id === 'heading-structure' ? {
                                                    h1_count: section.headingCounts?.h1_count || 0,
                                                    h2_count: section.headingCounts?.h2_count || 0,
                                                    h3_count: section.headingCounts?.h3_count || 0,
                                                    heading_order: section.headingOrder || [],
                                                    issues: section.headingIssues || []
                                                } : null}
                                                onOpenHeadingsModal={section.id === 'heading-structure' ? () => handleOpenHeadingsModal(section.headingOrder || [], section.headingIssues || []) : null}
                                                linkAuditData={section.id === 'link-audit' ? section.linkAuditData : null}
                                                onOpenBrokenLinksModal={section.id === 'link-audit' ? () => handleOpenBrokenLinksModal(section.linkAuditData?.broken_links || []) : null}
                                                ogTwitterData={section.id === 'social-media-integration' ? section.ogTwitterData : null}
                                                mobileResponsivenessData={section.id === 'mobile-responsiveness-audit' ? section.mobileResponsivenessData : null}
                                                onOpenFixedWidthElementsModal={section.id === 'mobile-responsiveness-audit' ? () => handleOpenFixedWidthElementsModal(section.mobileResponsivenessData?.fixed_width_elements || []) : null}
                                                onOpenResponsivenessIssuesModal={section.id === 'mobile-responsiveness-audit' ? () => handleOpenMobileIssuesModal(section.mobileResponsivenessData?.issues || []) : null}
                                                mobileScreenshot={section.id === 'mobile-responsiveness-audit' ? backendData.pagespeed_audit?.mobile?.screenshot : null}
                                                structuredDataAuditData={section.id === 'structured-data-schema' ? section.structuredDataAuditData : null}
                                                localSeoAuditData={section.id === 'local-seo-audit' ? section.localSeoAuditData : null}
                                                metadataLengthData={section.metadataLengthData}
                                                imageAnalysisData={section.id === 'image-accessibility' ? section.imageAnalysisData : null}
                                                onOpenImageIssuesModal={section.id === 'image-accessibility' ? () => handleOpenImageIssuesModal(section.imageAnalysisData) : null}
                                                robotsTxtData={section.id === 'robots-txt-analysis' ? section.robotsTxtData : null}
                                                metaRobotsData={section.id === 'meta-robots-analysis' ? section.metaRobotsData : null}
                                                httpStatusAndRedirectsData={section.id === 'http-status-and-redirects' ? section.httpStatusAndRedirectsData : null}
                                                onOpenRedirectsModal={section.id === 'http-status-and-redirects' ? () => handleOpenRedirectsModal(section.httpStatusAndRedirectsData) : null}
                                                sitemapValidationData={section.id === 'sitemap-validation' ? backendData.full_sitemap_audit : null}
                                                onOpenSitemapIssuesModal={section.id === 'sitemap-validation' ? () => handleOpenSitemapIssuesModal(backendData.full_sitemap_audit) : null}
                                                pagespeedData={section.id === 'pagespeed-audit' ? section.pagespeedData : null}
                                                onOpenStructuredDataIssuesModal={section.id === 'structured-data-schema' ? () => handleOpenStructuredDataIssuesModal(section.structuredDataAuditData) : null}
                                                onOpenLocalSeoIssuesModal={section.id === 'local-seo-audit' ? () => handleOpenLocalSeoIssuesModal(section.localSeoAuditData) : null}
                                                crawlAuditData={section.id === 'crawl-audit' ? backendData.crawl_audit : null}
                                                onOpenCrawlGraphModal={section.id === 'crawl-audit' ? () => handleOpenCrawlGraphModal(backendData.crawl_audit) : null}
                                                sectionScore={calculateSectionScore(section, backendData, backendData.pagespeed_audit)}
                                                a11yAuditData={section.id === 'a11y-analysis' ? section.a11yAuditData : null}
                                                onOpenA11yIssuesModal={section.id === 'a11y-analysis' ? () => handleOpenA11yIssuesModal(section.a11yAuditData) : null}
                                                isHighlighted={highlightedCard === section.id} // Pass highlight state
                                            />
                                            </div>
                                        ))}
                                    </AnimatePresence>
                                </section>
                            
                        </div>
                    ))}
                </div>
                <div className="mt-12 text-center">
    <button
        onClick={handleDownload}
        className="inline-flex items-center justify-center px-8 py-4 font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800"
    >
        <FileDown className="w-5 h-5 mr-3" />
        Download Full Report
    </button>
</div>

            </main>

            <AppModals
                showTopKeywordsModal={showTopKeywordsModal}
                setShowTopKeywordsModal={setShowTopKeywordsModal}
                keywordsModalData={keywordsModalData}
                showSuggestionsModal={showSuggestionsModal}
                setShowSuggestionsModal={setShowSuggestionsModal}
                showHeadingsModal={showHeadingsModal}
                setShowHeadingsModal={setShowHeadingsModal}
                headingsData={headingsModalData}
                showBrokenLinksModal={showBrokenLinksModal}
                setShowBrokenLinksModal={setShowBrokenLinksModal}
                brokenLinksModalData={brokenLinksModalData}
                showFixedWidthElementsModal={showFixedWidthElementsModal}
                setShowFixedWidthElementsModal={setShowFixedWidthElementsModal}
                fixedWidthElementsModalData={fixedWidthElementsModalData}
                showResponsivenessIssuesModal={showResponsivenessIssuesModal}
                setShowResponsivenessIssuesModal={setShowResponsivenessIssuesModal}
                responsivenessIssuesModalData={responsivenessIssuesModalData}
                showRedirectsModal={showRedirectsModal}
                setShowRedirectsModal={setShowRedirectsModal}
                redirectsModalData={redirectsModalData}
                showSitemapIssuesModal={showSitemapIssuesModal}
                setShowSitemapIssuesModal={setShowSitemapIssuesModal}
                sitemapIssuesModalData={sitemapIssuesModalData}
                showStructuredDataIssuesModal={showStructuredDataIssuesModal}
                setShowStructuredDataIssuesModal={setShowStructuredDataIssuesModal}
                structuredDataAuditData={backendData.structured_data_audit}
                showLocalSeoIssuesModal={showLocalSeoIssuesModal}
                setShowLocalSeoIssuesModal={setShowLocalSeoIssuesModal}
                localSeoIssuesModalData={backendData.local_seo_audit}
                showImageIssuesModal={showImageIssuesModal}
                setShowImageIssuesModal={setShowImageIssuesModal}
                imageIssuesModalData={imageIssuesModalData}
                showMobileIssuesModal={showMobileIssuesModal}
                setShowMobileIssuesModal={setShowMobileIssuesModal}
                mobileIssuesModalData={mobileIssuesModalData}
                showCrawlGraphModal={showCrawlGraphModal}
                setShowCrawlGraphModal={setShowCrawlGraphModal}
                crawlGraphData={crawlGraphData}
                showA11yIssuesModal={showA11yIssuesModal}
                setShowA11yIssuesModal={setShowA11yIssuesModal}
                a11yAuditData={backendData.a11y_audit}
            />
            
        </div>
    );
};

export default Report;