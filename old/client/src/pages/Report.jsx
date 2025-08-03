import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, LinkIcon,
    ExternalLink, MinusCircle, Smartphone, Code, Info, Sun, Repeat, FileDown, Shield,
    TerminalSquare, Layout, Server, Zap, Globe, HardDrive, MapPin, Phone, Rss, Layers,
    FileText, Lightbulb, AlignLeft, BarChart2
} from 'lucide-react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportCard from './ReportCard';
import ReactDOM from 'react-dom';
import { Circle, Line } from 'rc-progress';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from '../components/PDFReport';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

ChartJS.register(ArcElement, Tooltip, Legend);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyCiYeMcuPhdQDop6Umt2K10ulyAEhbN108",
    authDomain: "seoanalyzerauth.firebaseapp.com",
    projectId: "seoanalyzerauth",
    storageBucket: "seoanalyzerauth.firebasestorage.app",
    messagingSenderId: "512042912695",
    appId: "1:512042912695:web:54fce8a18bdcec2ff73632",
    measurementId: "G-6W2LCZKH66"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to get an icon based on category name
const getCategoryIcon = (category) => {
    switch (category) {
        case 'Content':
            return <BookOpen className="w-5 h-5 text-indigo-500" />;
        case 'Technical SEO':
            return <Server className="w-5 h-5 text-green-500" />;
        case 'User Experience':
            return <Lightbulb className="w-5 h-5 text-yellow-500" />;
        case 'Security':
            return <Shield className="w-5 h-5 text-red-500" />;
        case 'Crawlability & Indexability':
            return <Globe className="w-5 h-5 text-purple-500" />;
        default:
            return <Info className="w-5 h-5" />;
    }
};

// Custom Divider Component
const ElegantDivider = ({ categoryName }) => (
    <div className="flex items-center space-x-3 mb-6 mt-12">
        <span className="w-full h-px bg-gradient-to-r from-gray-300 via-gray-200 to-gray-50"></span>
        <div className="flex-shrink-0 flex items-center space-x-2 text-gray-500">
            {getCategoryIcon(categoryName)}
            <span className="text-sm font-semibold uppercase">{categoryName}</span>
        </div>
        <span className="w-full h-px bg-gradient-to-l from-gray-300 via-gray-200 to-gray-50"></span>
    </div>
);

// Scoring Functions
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

const calculateSectionScore = (section, backendData) => {
    if (section.id === 'content-quality-analysis') {
        const readabilityScore = getReadabilityStatus(backendData.content_analysis?.flesch_reading_ease_score || 0).score;
        const keywordScore = backendData.content_analysis?.top_keywords?.length > 0 ? 80 : 20;
        return (readabilityScore + keywordScore) / 2;
    }
    if (section.id === 'keyword-analysis') {
        const presence = backendData.content_analysis?.keyword_report?.presence || {};
        const density = backendData.content_analysis?.keyword_report?.density?.density || 0;
        let score = 0;
        if (presence.inTitle) score += 20;
        if (presence.inMetaDescription) score += 20;
        if (presence.inH1) score += 20;
        if (presence.inUrl) score += 20;
        if (presence.inContent && density > 0) score += 20;
        return score;
    }
    if (section.id === 'pagespeed-audit') {
        const mobileScore = backendData.pagespeed_audit?.mobile?.performance_score || 0;
        const desktopScore = backendData.pagespeed_audit?.desktop?.performance_score || 0;
        return (mobileScore + desktopScore) / 2;
    }
    if (section.status === 'good') return 100;
    if (section.status === 'warning') return 60;
    return 20;
};

const calculateCategoryScore = (categoryName, groupedSections, backendData) => {
    const sections = groupedSections?.[categoryName] || [];
    const totalSections = sections.length;
    if (totalSections === 0) return { score: 0, max: 0, percentage: 0 };
    let totalScore = 0;
    sections.forEach(section => {
        totalScore += calculateSectionScore(section, backendData);
    });
    const percentage = Math.round((totalScore / (totalSections * 100)) * 100);
    return { score: totalScore, max: totalSections * 100, percentage };
};

const calculateOverallScore = (groupedSections, backendData) => {
    const backendScore = Number(backendData.seo_score);
    if (!isNaN(backendScore) && backendScore >= 0 && backendScore <= 100) {
        return backendScore;
    }
    const categoryScores = Object.keys(groupedSections).map(categoryName => {
        const { percentage } = calculateCategoryScore(categoryName, groupedSections, backendData);
        return percentage;
    });
    const weights = {
        Content: 0.4,
        'Technical SEO': 0.3,
        'User Experience': 0.2,
        Security: 0.1,
        'Crawlability & Indexability': 0.2
    };
    let weightedScore = 0;
    let totalWeight = 0;
    Object.keys(groupedSections).forEach(categoryName => {
        const { percentage } = calculateCategoryScore(categoryName, groupedSections, backendData);
        if (weights[categoryName]) {
            weightedScore += percentage * weights[categoryName];
            totalWeight += weights[categoryName];
        }
    });
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
};

// Modal Component
const AppModals = ({
    showTopKeywordsModal, setShowTopKeywordsModal,
    showSuggestionsModal, setShowSuggestionsModal,
    keywordsModalData,
    showHeadingsModal, setShowHeadingsModal,
    headingsData,
    showBrokenLinksModal, setShowBrokenLinksModal,
    brokenLinksData,
    showFixedWidthElementsModal, setShowFixedWidthElementsModal,
    fixedWidthElementsModalData,
    showResponsivenessIssuesModal, setShowResponsivenessIssuesModal,
    responsivenessIssuesModalData,
    showRedirectsModal, setShowRedirectsModal,
    redirectsModalData
}) => {
    const modalRef = useRef(null);
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        const root = document.getElementById('modal-root');
        setPortalRoot(root || null);
    }, []);

    useEffect(() => {
        const handleOverflow = () => {
            document.body.style.overflow = (showTopKeywordsModal || showSuggestionsModal || showHeadingsModal || showBrokenLinksModal || showFixedWidthElementsModal || showResponsivenessIssuesModal || showRedirectsModal) ? 'hidden' : 'unset';
        };
        handleOverflow();
        const timer = setTimeout(() => {
            if (modalRef.current) modalRef.current.focus();
        }, 50);
        return () => {
            clearTimeout(timer);
            handleOverflow();
        };
    }, [showTopKeywordsModal, showSuggestionsModal, showHeadingsModal, showBrokenLinksModal, showFixedWidthElementsModal, showResponsivenessIssuesModal, showRedirectsModal]);

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
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setShowTopKeywordsModal, setShowSuggestionsModal, setShowHeadingsModal, setShowBrokenLinksModal, setShowFixedWidthElementsModal, setShowResponsivenessIssuesModal, setShowRedirectsModal]);

    if (!portalRoot) return null;

    const modalTransitionClasses = 'transition-opacity duration-300 ease-out transform';
    const modalActiveClasses = 'opacity-100 scale-100';
    const modalInactiveClasses = 'opacity-0 scale-95';

    const handleCloseModal = () => {
        setShowTopKeywordsModal(false);
        setShowSuggestionsModal(false);
        setShowHeadingsModal(false);
        setShowBrokenLinksModal(false);
        setShowFixedWidthElementsModal(false);
        setShowResponsivenessIssuesModal(false);
        setShowRedirectsModal(false);
    };

    return (
        <>
            {showTopKeywordsModal && keywordsModalData?.top_keywords?.length > 0 && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showTopKeywordsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showTopKeywordsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Top Keywords</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Density (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {keywordsModalData.top_keywords.map((kw, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kw.keyword}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kw.frequency}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kw.density}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {showSuggestionsModal && keywordsModalData?.keyword_suggestions?.length > 0 && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showSuggestionsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showSuggestionsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Keyword Suggestions</h3>
                            <ul className="list-disc list-inside text-gray-700 p-4">
                                {keywordsModalData.keyword_suggestions.map((suggestion, index) => (
                                    <li key={index} className="mb-2">
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {showHeadingsModal && headingsData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showHeadingsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showHeadingsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Heading Structure</h3>
                            {headingsData.headingOrder.length > 0 || headingsData.headingIssues.length > 0 ? (
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold text-gray-700 mb-2">All Headings</h4>
                                    <ul className="list-disc list-inside text-gray-700 mb-4">
                                        {headingsData.headingOrder.map((heading, index) => (
                                            <li key={index} className="mb-1">
                                                &lt;{heading.tag}&gt; {heading.text}
                                            </li>
                                        ))}
                                    </ul>
                                    {headingsData.headingIssues.length > 0 && (
                                        <>
                                            <h4 className="text-lg font-semibold text-gray-700 mb-2">Issues</h4>
                                            <ul className="list-disc list-inside text-gray-700">
                                                {headingsData.headingIssues.map((issue, index) => (
                                                    <li key={index} className="mb-1">
                                                        {issue}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-green-600 text-center text-xl py-8">No heading issues or headings found.</p>
                            )}
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {showBrokenLinksModal && brokenLinksData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showBrokenLinksModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showBrokenLinksModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Broken Links Found</h3>
                            {brokenLinksData.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Link URL</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {brokenLinksData.map((link, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 break-all">
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            {link.url}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-normal text-sm text-red-700">{link.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-green-600 text-center text-xl py-8">No broken links found. Great job!</p>
                            )}
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {showFixedWidthElementsModal && fixedWidthElementsModalData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showFixedWidthElementsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showFixedWidthElementsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Fixed-Width Elements</h3>
                            {fixedWidthElementsModalData.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Tag</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Value</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Source</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {fixedWidthElementsModalData.map((element, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900">&lt;{element.tag}&gt;</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700">{element.value}</td>
                                                    <td className="px-4 py-3 whitespace-normal text-base text-gray-700">{element.source}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-green-600 text-center text-xl py-8">No fixed-width elements found. Great job!</p>
                            )}
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {showResponsivenessIssuesModal && responsivenessIssuesModalData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showResponsivenessIssuesModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showResponsivenessIssuesModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Responsiveness Issues</h3>
                            {responsivenessIssuesModalData.length > 0 ? (
                                <ul className="list-disc list-inside text-gray-700 p-4">
                                    {responsivenessIssuesModalData.map((issue, index) => (
                                        <li key={index} className="mb-2">
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-green-600 text-center text-xl py-8">No specific responsiveness issues found.</p>
                            )}
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {showRedirectsModal && redirectsModalData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showRedirectsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={handleCloseModal}
                    >
                        <div
                            className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses} ${showRedirectsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Redirect Chains</h3>
                            <div className="space-y-4">
                                {Object.keys(redirectsModalData).map((url, index) => {
                                    const chain = redirectsModalData[url];
                                    const isGood = chain.final_status_code >= 200 && chain.final_status_code < 300 && chain.redirect_chain.length <= 2;
                                    const statusColor = isGood ? 'text-green-500' : chain.final_status_code >= 400 ? 'text-red-500' : 'text-orange-500';
                                    return (
                                        <div key={index} className="bg-gray-100 p-4 rounded-lg">
                                            <p className="font-semibold text-gray-900 break-all mb-2">
                                                <span className="text-sm text-gray-500">Original URL:</span> {url}
                                            </p>
                                            <p className="flex items-center text-sm font-medium">
                                                <span className={`w-2 h-2 rounded-full mr-2 ${isGood ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                Final Status: <span className={`ml-1 font-bold ${statusColor}`}>{chain.final_status_code || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm text-gray-700 mt-2">
                                                <span className="font-semibold">Redirect Path:</span>
                                                <span className="break-all block md:inline">
                                                    {chain.redirect_chain.map((link, i) => (
                                                        <span key={i} className="text-xs md:text-sm">
                                                            {i > 0 && <span className="mx-1">→</span>}
                                                            <span className="text-blue-500 hover:underline">{link}</span>
                                                        </span>
                                                    ))}
                                                </span>
                                            </p>
                                            {chain.issues.length > 0 && (
                                                <ul className="mt-2 list-disc list-inside text-red-500 text-xs">
                                                    {chain.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>,
                    portalRoot
                )
            )}
        </>
    );
};

const Report = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const websiteUrl = location.state?.websiteUrl;
    const targetKeyword = location.state?.targetKeyword;

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(undefined);
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

    const reportRef = useRef(null);
    const sectionRefs = useRef({});

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

    useEffect(() => {
        if (!websiteUrl || typeof currentUser === 'undefined') return;

        const storedName = localStorage.getItem('agencyName');
        const storedLogo = localStorage.getItem('agencyLogoPreview');
        if (storedName) setAgencyName(storedName);
        if (storedLogo) setAgencyLogoPreview(storedLogo);

        const fetchReport = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch('https://seo-report-11.onrender.com/api/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: websiteUrl, keyword: targetKeyword }),
                });

                if (!response.ok) {
                    let errorMsg = `Failed to fetch report: ${response.status} ${response.statusText}`;
                    try {
                        const errorDetail = await response.json();
                        if (errorDetail?.detail) errorMsg += ` - ${errorDetail.detail}`;
                    } catch (jsonError) {
                        const rawText = await response.text();
                        errorMsg += ` - ${rawText.substring(0, 100)}...`;
                    }
                    throw new Error(errorMsg);
                }

                const backendData = await response.json();
                console.log("Backend Data:", backendData);

                const groupedSections = {
                    'Technical SEO': [],
                    'Page Speed & Core Web Vitals': [],
                    Content: [],
                    'Crawlability & Indexability': [],
                    'User Experience': [],
                    Security: [],
                };

                const getStatus = (value, isBoolean = false) => {
                    if (isBoolean) return value ? 'good' : 'bad';
                    if (value === 'Missing' || value === false || value === 0 || (Array.isArray(value) && value.length === 0)) return 'bad';
                    return 'good';
                };

                const getStatusFromBackend = (statusText) => {
                    if (typeof statusText !== 'string') return 'bad';
                    const lowerStatus = statusText.toLowerCase();
                    if (lowerStatus.includes('optimal') || lowerStatus.includes('good') || lowerStatus.includes('present') || lowerStatus.includes('found')) return 'good';
                    if (lowerStatus.includes('partial') || lowerStatus.includes('warning') || lowerStatus.includes('too short') || lowerStatus.includes('too long') || lowerStatus.includes('multiple')) return 'warning';
                    return 'bad';
                };

                const getMobileResponsivenessDisplayStatus = (auditData) => {
                    const hasViewportMeta = auditData?.has_viewport_meta;
                    const fixedWidthElements = auditData?.fixed_width_elements || [];
                    if (hasViewportMeta && fixedWidthElements.length === 0) return 'good';
                    else if (hasViewportMeta && fixedWidthElements.length > 0) return 'warning';
                    else return 'bad';
                };

                const getMobileResponsivenessExplanation = (auditData) => {
                    const hasViewportMeta = auditData?.has_viewport_meta;
                    const viewportContent = auditData?.viewport_content;
                    const fixedWidthElements = auditData?.fixed_width_elements || [];
                    const issues = auditData?.issues || [];
                    let explanationText = '';
                    if (issues.length > 0) explanationText = issues.find(issue => issue.includes('viewport meta tag')) || 'Multiple issues found.';
                    else if (!hasViewportMeta) explanationText = 'Missing viewport meta tag. This is crucial for proper scaling on mobile devices.';
                    else if (!viewportContent || !viewportContent.includes("width=device-width")) explanationText = `Viewport meta tag found but is not correctly configured (content: "${viewportContent || 'N/A'}"). Ensure "width=device-width" is present.`;
                    else if (fixedWidthElements.length > 0) explanationText = `Found ${fixedWidthElements.length} HTML elements with fixed pixel widths, which can hinder responsive design. Consider using fluid units (%, em, rem, vw).`;
                    else explanationText = 'No significant mobile responsiveness issues found.';
                    return explanationText;
                };

                const metadataLengthAudit = backendData.metadata_length_audit || {};

                // New PageSpeed & Core Web Vitals Section
                const pagespeedAudit = backendData.pagespeed_audit || {};
                const mobileScore = pagespeedAudit?.mobile?.performance_score;
                let pagespeedStatus = 'good';
                let pagespeedExplanation = 'Page speed and Core Web Vitals scores are excellent.';
                
                if (mobileScore !== undefined) {
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

                // Content Group
                const titleStatus = getStatusFromBackend(metadataLengthAudit.title?.status);
                const titleExplanation = metadataLengthAudit.title?.recommendation || 'Title tag analysis failed.';
                groupedSections.Content.push({
                    id: 'title-optimization',
                    title: 'Title Optimization',
                    status: titleStatus,
                    explanation: titleExplanation,
                    metadataLengthData: metadataLengthAudit.title
                });

                const metaDescriptionStatus = getStatusFromBackend(metadataLengthAudit.meta_description?.status);
                const metaDescriptionExplanation = metadataLengthAudit.meta_description?.recommendation || 'Meta description analysis failed.';
                groupedSections.Content.push({
                    id: 'meta-description',
                    title: 'Meta Description',
                    status: metaDescriptionStatus,
                    explanation: metaDescriptionExplanation,
                    metadataLengthData: metadataLengthAudit.meta_description
                });

                const h1Count = backendData.h1_tags?.length || 0;
                const h2Count = backendData.h2_count || 0;
                const h3Count = backendData.h3_count || 0;
                const headingOrder = backendData.heading_order || [];
                const headingIssues = backendData.heading_issues || [];
                let headingStatus = 'good';
                if (h1Count === 0 || headingIssues.some(issue => issue.startsWith('❌'))) headingStatus = 'bad';
                else if (h1Count > 1 || headingIssues.some(issue => issue.startsWith('⚠️'))) headingStatus = 'warning';
                groupedSections.Content.push({
                    id: 'heading-structure',
                    title: 'Content Structure',
                    status: headingStatus,
                    explanation: h1Count === 0 ? 'Missing H1 tag. This is crucial for content hierarchy and SEO.' : h1Count === 1 && headingIssues.length === 0 ? 'Heading structure looks good!' : 'Potential issues found in heading structure. See details below.',
                    headingCounts: { h1_count: h1Count, h2_count: h2Count, h3_count: h3Count },
                    headingOrder: headingOrder,
                    headingIssues: headingIssues,
                });

                const contentAnalysis = backendData.content_analysis || {};
                const readabilityInfo = getReadabilityStatus(contentAnalysis.flesch_reading_ease_score || 0);
                let contentAnalysisStatus = readabilityInfo.status;
                if (!contentAnalysis.top_keywords || contentAnalysis.top_keywords.length === 0) contentAnalysisStatus = 'bad';
                else if (contentAnalysis.keyword_suggestions && contentAnalysis.keyword_suggestions.some(s => s.startsWith('❌') || s.startsWith('⚠️'))) {
                    if (contentAnalysisStatus === 'good') contentAnalysisStatus = 'warning';
                }

                const keywordReportData = backendData.content_analysis?.keyword_report;
                if (keywordReportData) {
                    let keywordReportStatus = 'good';
                    if (!keywordReportData.presence?.inContent || !keywordReportData.presence?.inTitle || (keywordReportData.density?.density || 0) === 0) keywordReportStatus = 'bad';
                    else if (!keywordReportData.presence?.inH1 || !keywordReportData.presence?.inMetaDescription || !keywordReportData.presence?.inUrl) keywordReportStatus = 'warning';
                    if (backendData.deductions?.some(d => d.includes('Keyword density') && d.includes('too high'))) keywordReportStatus = 'bad';

                    groupedSections.Content.push({
                        id: 'keyword-analysis',
                        title: 'Keyword Analysis',
                        status: keywordReportStatus,
                        explanation: keywordReportStatus === 'good' ? `Target keyword '${targetKeyword}' is well-optimized.` : `Issues found with target keyword '${targetKeyword}'. See details.`,
                        keywordReportData: keywordReportData,
                    });
                }

                groupedSections.Content.push({
                    id: 'content-quality-analysis',
                    title: 'Content Quality Analysis',
                    status: contentAnalysisStatus,
                    explanation: contentAnalysis.keyword_suggestions?.length > 0 ? contentAnalysis.keyword_suggestions.join('; ') : 'Content analysis completed. See details.',
                    contentAnalysisData: contentAnalysis,
                });

                // Technical Group
                const imageAltAudit = backendData.image_analysis || {};
                const imageStatus = (imageAltAudit.missing_alt_tags === 0 && imageAltAudit.empty_alt_tags === 0) ? 'good' : 'bad';
                groupedSections['Technical SEO'].push({
                    id: 'image-accessibility',
                    title: 'Image Accessibility',
                    status: imageStatus,
                    explanation: `Found ${imageAltAudit.missing_alt_tags} missing and ${imageAltAudit.empty_alt_tags} empty alt tags out of ${imageAltAudit.total_images} images.`,
                    imageAltAuditData: imageAltAudit,
                });

                const speedAudit = backendData.speed_audit || {};
                const speedAuditStatus = (speedAudit.issues && speedAudit.issues.length === 0) ? 'good' : 'warning';
                groupedSections['Technical SEO'].push({
                    id: 'speed-heuristics',
                    title: 'Speed Performance',
                    status: speedAuditStatus,
                    explanation: speedAudit.issues?.length > 0 ? `Found ${speedAudit.issues.length} potential speed issues. Click for details.` : 'No major speed issues detected.',
                    speedAuditData: speedAudit
                });
                
                const linkAudit = backendData.link_audit || {};
                const linkAuditStatus = (linkAudit.broken_links_count === 0) ? 'good' : 'bad';
                groupedSections['Technical SEO'].push({
                    id: 'link-audit',
                    title: 'Link Profile',
                    status: linkAuditStatus,
                    explanation: linkAudit.broken_links_count > 0 ? `Found ${linkAudit.broken_links_count} broken links. A high number of broken links can negatively affect user experience and SEO.` : 'No broken links found.',
                    linkAuditData: linkAudit
                });

                const structuredDataAudit = backendData.structured_data_audit || {};
                let structuredDataStatus = getStatusFromBackend(structuredDataAudit.ld_json_found);
                let structuredDataExplanation = structuredDataAudit.issues?.length > 0 ? structuredDataAudit.issues.join('; ') : 'Structured data found and appears valid.';
                if (!structuredDataAudit.ld_json_found) {
                    structuredDataExplanation = 'No structured data schema found. Consider adding JSON-LD for rich snippets.';
                    structuredDataStatus = 'bad';
                } else if (structuredDataAudit.issues?.length > 0) structuredDataStatus = 'warning';
                groupedSections['Technical SEO'].push({
                    id: 'structured-data-schema',
                    title: 'Structured Data Schema',
                    status: structuredDataStatus,
                    explanation: structuredDataExplanation,
                    structuredDataAuditData: structuredDataAudit
                });

                const localSeoAudit = backendData.local_seo_audit || {};
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

                // User Experience Group
                const mobileResponsivenessAudit = backendData.mobile_responsiveness_audit || {};
                const mobileResponsivenessStatus = getMobileResponsivenessDisplayStatus(mobileResponsivenessAudit);
                const mobileResponsivenessExplanation = getMobileResponsivenessExplanation(mobileResponsivenessAudit);
                groupedSections['User Experience'].push({
                    id: 'mobile-responsiveness-audit',
                    title: 'Mobile Experience',
                    status: mobileResponsivenessStatus,
                    explanation: mobileResponsivenessExplanation,
                    mobileResponsivenessData: mobileResponsivenessAudit
                });

                const ogTwitterAudit = backendData.social_media_tags || {};
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

                // Security Group
                const canonicalTagData = backendData.canonical || {};
                let canonicalDisplayStatus = getStatusFromBackend(canonicalTagData?.status);
                let canonicalExplanation = canonicalTagData?.status || 'No canonical tag data available.';
                groupedSections.Security.push({
                    id: 'canonical-url',
                    title: 'Canonical URL',
                    status: canonicalDisplayStatus,
                    explanation: canonicalExplanation,
                    canonicalTagData: canonicalTagData
                });

                groupedSections.Security.push({
                    id: 'https-usage',
                    title: 'HTTPS Usage',
                    status: getStatus(backendData.uses_https, true),
                    explanation: backendData.uses_https ? 'Site is using HTTPS. Good for security and SEO.' : 'Site is not using HTTPS. This affects security and search rankings.'
                });

                groupedSections.Security.push({
                    id: 'favicon',
                    title: 'Favicon',
                    status: getStatus(backendData.has_favicon, true),
                    explanation: backendData.has_favicon ? 'Favicon found. Important for branding and user experience.' : 'Missing favicon.ico file.'
                });

                // Crawlability & Indexability Group
                const crawlabilityData = backendData.crawlability_and_indexability_audit || {};
                
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
                
                let sitemapAuditStatus = 'good';
                if (!crawlabilityData.sitemap?.found) sitemapAuditStatus = 'bad';
                else if (crawlabilityData.sitemap?.invalid_urls?.length > 0) sitemapAuditStatus = 'warning';
                groupedSections['Crawlability & Indexability'].push({
                    id: 'sitemap-validation',
                    title: 'Sitemap Validation',
                    status: sitemapAuditStatus,
                    explanation: crawlabilityData.sitemap?.status || 'Sitemap validation failed.',
                    sitemapValidationData: crawlabilityData.sitemap
                });

                const overallScore = calculateOverallScore(groupedSections, backendData);

                const processedReportData = {
                    url: websiteUrl,
                    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                    overallScore: overallScore,
                    groupedSections: groupedSections,
                    backendData: backendData,
                };

                setReportData(processedReportData);

                if (currentUser && currentUser.uid) {
                    try {
                        const userDocRef = doc(db, 'users', currentUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            const existingHistory = userData.reportHistory || [];
                            const newReportEntry = {
                                url: websiteUrl,
                                timestamp: new Date(),
                                overallScore: processedReportData.overallScore,
                                summary: { overallScore: processedReportData.overallScore },
                            };
                            const updatedHistory = [newReportEntry, ...existingHistory.slice(0, 9)];
                            await updateDoc(userDocRef, { reportHistory: updatedHistory });
                            console.log("Report history updated in Firestore.");
                        } else console.log("User document not found.");
                    } catch (saveError) {
                        console.error("Error saving report from Report page:", saveError);
                    }
                } else if (currentUser === null) console.warn("User not logged in, report not saved to history.");
            } catch (err) {
                console.error("Error fetching report:", err);
                setError(err.message || 'Something went wrong while fetching the report.');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [websiteUrl, targetKeyword, currentUser]);

    const getScoreColor = (score) => {
        if (score >= 80) return '#22C55E';
        if (score >= 60) return '#F97316';
        return '#EF4444';
    };

    const getStatusColorClass = (status) => {
        if (status === 'good') return 'bg-green-100 text-green-800 border-green-300';
        if (status === 'warning') return 'bg-orange-100 text-orange-800 border-orange-300';
        return 'bg-red-100 text-red-800 border-red-300';
    };

    const getScoreBadgeClass = (totalIssues) => {
        if (totalIssues >= 5) return 'bg-red-500 text-white';
        if (totalIssues >= 2) return 'bg-orange-500 text-white';
        return 'bg-green-500 text-white';
    };

    const getCategoryScorePercentage = (categoryName) => {
        const { percentage } = calculateCategoryScore(categoryName, groupedSections, backendData);
        return percentage;
    };

    const getCategoryStatus = (categoryName) => {
        const counts = getTabStatusCounts(groupedSections?.[categoryName] || []);
        if (counts.bad > 0) return 'bad';
        if (counts.warning > 0) return 'warning';
        return 'good';
    };

    const getTabStatusCounts = (tabSections) => {
        const counts = { good: 0, warning: 0, bad: 0 };
        tabSections.forEach(section => {
            counts[(section.status || 'bad')]++;
        });
        return counts;
    };

    const { url: reportUrl, overallScore = 0, groupedSections = {}, backendData = {} } = reportData || {};

    const categoryColors = {
        'Content': '#5C6BC0',
        'Technical SEO': '#42A5F5',
        'Page Speed & Core Web Vitals': '#3b82f6',
        'User Experience': '#FFCA28',
        'Security': '#EF5350',
        'Crawlability & Indexability': '#AB47BC'
    };

    const categoryBreakdownData = Object.keys(groupedSections).map(categoryName => {
        const { percentage } = calculateCategoryScore(categoryName, groupedSections, backendData);
        return { name: categoryName, score: percentage, color: categoryColors[categoryName] || '#9E9E9E' };
    }).filter(cat => cat.score > 0);

    const totalIssueCount = Object.values(groupedSections).reduce((acc, sections) => {
        const counts = getTabStatusCounts(sections);
        return acc + counts.bad + counts.warning;
    }, 0);
    const issueStatus = totalIssueCount >= 5 ? 'Critical' : totalIssueCount >= 2 ? 'Warning' : 'Good';

    const handleOpenHeadingsModal = (headingOrder, headingIssues) => {
        setHeadingsModalData({ headingOrder, headingIssues });
        setShowHeadingsModal(true);
    };

    const handleOpenBrokenLinksModal = (data) => {
        setBrokenLinksModalData(data);
        setShowBrokenLinksModal(true);
    };

    const handleOpenFixedWidthElementsModal = (data) => {
        setFixedWidthElementsModalData(data);
        setShowFixedWidthElementsModal(true);
    };

    const handleOpenResponsivenessIssuesModal = (data) => {
        setResponsivenessIssuesModalData(data);
        setShowResponsivenessIssuesModal(true);
    };

    const handleOpenRedirectsModal = (data) => {
        setRedirectsModalData(data);
        setShowRedirectsModal(true);
    };

    const handleOpenTopKeywordsModal = (data) => {
        setKeywordsModalData(prev => ({ ...prev, top_keywords: data }));
        setShowTopKeywordsModal(true);
    };

    const handleOpenSuggestionsModal = (data) => {
        setKeywordsModalData(prev => ({ ...prev, keyword_suggestions: data }));
        setShowSuggestionsModal(true);
    };

    if (loading) {
        const brandColors = { primary: '#8A4AF3', secondary: '#3B82F6', accent: '#C084FC' };
        const Dot = ({ delay }) => (
            <motion.span
                className="inline-block w-3 h-3 mx-1 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"
                variants={{ animate: { y: ["0%", "-50%", "0%"], scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay }}
            />
        );
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 transition-colors duration-500 relative overflow-hidden">
                <motion.div
                    className="absolute inset-0 z-0 opacity-10"
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{ scale: 1.1, rotate: 5 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear", repeatType: "mirror" }}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20ZM40 40V20L20 40Z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '80px 80px' }}
                />
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-11/12"
                >
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight"><span style={{ color: brandColors.primary }}>CrestNova.Sol</span></h1>
                    <p className="text-xl font-semibold text-gray-700 mb-6">Generating your Premium SEO report...</p>
                    <div className="flex justify-center items-center h-12 mb-4">
                        <Dot delay={0} /><Dot delay={0.2} /><Dot delay={0.4} />
                    </div>
                    <p className="text-sm text-gray-500">Analyzing over 50+ SEO parameters for optimal performance.</p>
                </motion.div>
            </div>
        );
    }

    if (error || !reportData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-500">
                <p className="text-red-500 text-lg font-semibold text-center mb-4">{error}</p>
                <button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition">Back to Home</button>
            </div>
        );
    }

    const MainScorecard = () => (
        <motion.div
            className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="flex-1 flex flex-col space-y-4 w-full">
                <div className="flex justify-between items-center text-gray-600 font-semibold mb-4">
                    <span className="text-lg">On-page score</span>
                    <div className="flex items-center space-x-2">
                        <span>Issues: {totalIssueCount}</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${getScoreBadgeClass(totalIssueCount)}`}>
                            {issueStatus}
                        </span>
                        <Info className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <div className="flex items-center space-x-8">
                    <div className="relative w-40 h-40 flex-shrink-0">
                        <Circle
                            percent={overallScore}
                            strokeWidth={7}
                            strokeColor={overallScore >= 80 ? '#67C924' : overallScore >= 60 ? '#FFD166' : '#EF4444'}
                            trailColor="#E5E7EB"
                            trailWidth={7}
                        />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <span className="text-4xl font-extrabold text-gray-900">{overallScore}%</span>
                            <p className="text-xs text-gray-500 mt-1">On-page score</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        {Object.keys(groupedSections).map((categoryName, index) => (
                            <div key={index} className="flex flex-col space-y-1">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-700">{categoryName}</span>
                                    <span className="text-gray-900 font-bold">{getCategoryScorePercentage(categoryName)}%</span>
                                </div>
                                <Line
                                    percent={getCategoryScorePercentage(categoryName)}
                                    strokeWidth={3}
                                    strokeColor={
                                        getCategoryStatus(categoryName) === 'good' ? '#22C55E' :
                                        getCategoryStatus(categoryName) === 'warning' ? '#F97316' :
                                        '#EF4444'
                                    }
                                    trailColor="#E5E7EB"
                                    trailWidth={3}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 font-sans text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 transition-colors duration-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 800 400">
                    <defs>
                        <linearGradient id="reportGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    <g fill="url(#reportGradient)" opacity="0.4">
                        <polygon points="100,100 150,50 200,100 150,150" />
                        <polygon points="500,150 550,100 600,150 550,200" />
                    </g>
                </svg>
            </div>
            <Navbar user={currentUser} handleLogout={handleLogout} />
            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
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
                                        <ReportCard
                                            key={section.id}
                                            title={section.title}
                                            status={section.status}
                                            explanation={section.explanation}
                                            action={section.action}
                                            contentAnalysisData={section.id === 'content-quality-analysis' ? section.contentAnalysisData : null}
                                            keywordReportData={section.id === 'keyword-analysis' ? section.keywordReportData : null}
                                            onOpenTopKeywordsModal={section.id === 'content-quality-analysis' ? () => handleOpenTopKeywordsModal(section.contentAnalysisData?.top_keywords || []) : null}
                                            onOpenSuggestionsModal={section.id === 'content-quality-analysis' ? () => handleOpenSuggestionsModal(section.contentAnalysisData?.keyword_suggestions || []) : null}
                                            headingCounts={section.id === 'heading-structure' ? section.headingCounts : null}
                                            headingOrder={section.id === 'heading-structure' ? section.headingOrder : null}
                                            headingIssues={section.id === 'heading-structure' ? section.headingIssues : null}
                                            onOpenHeadingsModal={section.id === 'heading-structure' ? () => handleOpenHeadingsModal(section.headingOrder || [], section.headingIssues || []) : null}
                                            speedAuditData={section.id === 'speed-heuristics' ? section.speedAuditData : null}
                                            linkAuditData={section.id === 'link-audit' ? section.linkAuditData : null}
                                            onOpenBrokenLinksModal={section.id === 'link-audit' ? () => handleOpenBrokenLinksModal(section.linkAuditData?.broken_links || []) : null}
                                            ogTwitterData={section.id === 'social-media-integration' ? section.ogTwitterData : null}
                                            mobileResponsivenessData={section.id === 'mobile-responsiveness-audit' ? section.mobileResponsivenessData : null}
                                            onOpenFixedWidthElementsModal={section.id === 'mobile-responsiveness-audit' ? () => handleOpenFixedWidthElementsModal(section.mobileResponsivenessData?.fixed_width_elements || []) : null}
                                            onOpenResponsivenessIssuesModal={section.id === 'mobile-responsiveness-audit' ? () => handleOpenResponsivenessIssuesModal(section.mobileResponsivenessData?.issues || []) : null}
                                            structuredDataAuditData={section.id === 'structured-data-schema' ? section.structuredDataAuditData : null}
                                            localSeoAuditData={section.id === 'local-seo-audit' ? section.localSeoAuditData : null}
                                            metadataLengthData={section.metadataLengthData}
                                            imageAltAuditData={section.id === 'image-accessibility' ? section.imageAltAuditData : null}
                                            canonicalTagData={section.id === 'canonical-url' ? section.canonicalTagData : null}
                                            overallScore={overallScore}
                                            robotsTxtData={section.id === 'robots-txt-analysis' ? section.robotsTxtData : null}
                                            metaRobotsData={section.id === 'meta-robots-analysis' ? section.metaRobotsData : null}
                                            httpStatusAndRedirectsData={section.id === 'http-status-and-redirects' ? section.httpStatusAndRedirectsData : null}
                                            sitemapValidationData={section.id === 'sitemap-validation' ? section.sitemapValidationData : null}
                                            onOpenRedirectsModal={section.id === 'http-status-and-redirects' ? () => handleOpenRedirectsModal(section.httpStatusAndRedirectsData) : null}
                                            // Pass new PageSpeed data
                                            pagespeedData={section.id === 'pagespeed-audit' ? section.pagespeedData : null}
                                        />
                                    ))}
                                </AnimatePresence>
                            </section>
                        </div>
                    ))}
                </div>
                <div className="mt-12 text-center">
                    <PDFDownloadLink
                        document={<PDFReport reportData={reportData} />}
                        fileName={`SEO-Report-${reportUrl.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all"
                    >
                        {({ loading }) => (loading ? 'Generating PDF...' : 'Download Full Report')}
                        <FileDown className="w-5 h-5 ml-2" />
                    </PDFDownloadLink>
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
            />

            <Footer />
        </div>
    );
};

export default Report;