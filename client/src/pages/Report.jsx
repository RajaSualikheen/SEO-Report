import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, BookOpen, Hash, Percent, X, TrendingUp } from 'lucide-react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportCard from './ReportCard';
import ReactDOM from 'react-dom';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { saveReportToFirestore } from '../firebase/firebaseService';

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

// AppModals component (NO FRAMER MOTION HERE)
const AppModals = ({
    showKeywordsModal, setShowKeywordsModal, keywordsData,
    showHeadingsModal, setShowHeadingsModal, headingsData,
    showBrokenLinksModal, setShowBrokenLinksModal, brokenLinksData
}) => {
    const modalRef = React.useRef(null);
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        const root = document.getElementById('modal-root');
        if (root) {
            setPortalRoot(root);
            console.log('✅ #modal-root found in DOM for AppModals.');
        } else {
            console.error('❌ Error: #modal-root NOT found in the DOM. Please ensure it is present in your index.html.');
        }
    }, []);

    useEffect(() => {
        if (showKeywordsModal || showHeadingsModal || showBrokenLinksModal) {
            document.body.style.overflow = 'hidden';
            const timer = setTimeout(() => {
                if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 50);
            return () => clearTimeout(timer);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showKeywordsModal, setShowKeywordsModal, showHeadingsModal, setShowHeadingsModal, showBrokenLinksModal, setShowBrokenLinksModal]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowKeywordsModal(false);
                setShowHeadingsModal(false);
                setShowBrokenLinksModal(false);
            }
        };
        if (showKeywordsModal || showHeadingsModal || showBrokenLinksModal) {
            document.addEventListener('keydown', handleEscape);
        } else {
            document.removeEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showKeywordsModal, setShowKeywordsModal, showHeadingsModal, setShowHeadingsModal, showBrokenLinksModal, setShowBrokenLinksModal]);

    if (!portalRoot) {
        return null;
    }

    const modalTransitionClasses = 'transition-opacity duration-300 ease-out transform';
    const modalActiveClasses = 'opacity-100 scale-100';
    const modalInactiveClasses = 'opacity-0 scale-95';

    return (
        <>
            {/* Keywords Modal */}
            {showKeywordsModal && keywordsData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showKeywordsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={() => setShowKeywordsModal(false)}
                    >
                        <div
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                                       w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                                       border border-gray-200 dark:border-gray-700
                                       ${modalTransitionClasses} ${showKeywordsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowKeywordsModal(false)}
                                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Top Keywords</h3>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Keyword</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Frequency</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Density</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {keywordsData.top_keywords.map((kw, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                                                <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200">{kw.frequency}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200">{kw.density}%</td>
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

            {/* Headings Modal */}
            {showHeadingsModal && headingsData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showHeadingsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={() => setShowHeadingsModal(false)}
                    >
                        <div
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                                       w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                                       border border-gray-200 dark:border-gray-700
                                       ${modalTransitionClasses} ${showHeadingsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowHeadingsModal(false)}
                                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Full Heading Order</h3>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Tag</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Text</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {headingsData.map((h, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                                                <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-gray-100">&lt;{h.tag}&gt;</td>
                                                <td className="px-4 py-3 whitespace-normal text-base text-gray-700 dark:text-gray-200">{h.text}</td>
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

            {/* Broken Links Modal */}
            {showBrokenLinksModal && brokenLinksData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showBrokenLinksModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={() => setShowBrokenLinksModal(false)}
                    >
                        <div
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                                       w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                                       border border-gray-200 dark:border-gray-700
                                       ${modalTransitionClasses} ${showBrokenLinksModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowBrokenLinksModal(false)}
                                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Broken Links Found</h3>

                            {brokenLinksData.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Link URL</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {brokenLinksData.map((link, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                            {link.url}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-normal text-sm text-red-700 dark:text-red-300">{link.reason}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-green-600 dark:text-green-300 text-center text-xl py-8">No broken links found. Great job!</p>
                            )}
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

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    const [showKeywordsModal, setShowKeywordsModal] = useState(false);
    const [keywordsModalData, setKeywordsModalData] = useState(null);
    const [showHeadingsModal, setShowHeadingsModal] = useState(false);
    const [headingsModalData, setHeadingsModalData] = useState(null);

    const [showBrokenLinksModal, setShowBrokenLinksModal] = useState(false);
    const [brokenLinksModalData, setBrokenLinksModalData] = useState(null);


    const handleOpenKeywordsModal = (data) => {
        setKeywordsModalData(data);
        setShowKeywordsModal(true);
    };

    const handleOpenHeadingsModal = (data) => {
        setHeadingsModalData(data);
        setShowHeadingsModal(true);
    };

    const handleOpenBrokenLinksModal = (data) => {
        setBrokenLinksModalData(data);
        setShowBrokenLinksModal(true);
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!websiteUrl) {
            setError('No website URL provided. Please go back to the homepage and enter a URL.');
            setLoading(false);
            return;
        }

        const fetchReport = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await fetch('http://localhost:8000/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: websiteUrl }),
                });

                if (!response.ok) {
                    let errorMsg = `Failed to fetch report: ${response.status} ${response.statusText}`;
                    try {
                        const errorDetail = await response.json();
                        if (errorDetail?.detail) {
                            errorMsg += ` - ${errorDetail.detail}`;
                        }
                    } catch (jsonError) {
                        const rawText = await response.text();
                        errorMsg += ` - ${rawText.substring(0, 100)}...`;
                    }
                    throw new Error(errorMsg);
                }

                const backendData = await response.json();
                console.log("Backend Data:", backendData);

                const sections = [];
                let goodCount = 0;

                const getStatus = (value, isBoolean = false) => {
                    if (isBoolean) return value ? 'good' : 'bad';
                    if (value === 'Missing' || value === false || value === 0 || (Array.isArray(value) && value.length === 0)) return 'bad';
                    return 'good';
                };

                const getReadabilityStatus = (score) => {
                    if (score >= 90) return { text: 'Very Easy', status: 'good' };
                    if (score >= 80) return { text: 'Easy', status: 'good' };
                    if (score >= 70) return { text: 'Fairly Easy', status: 'good' };
                    if (score >= 60) return { text: 'Standard', status: 'warning' };
                    if (score >= 50) return { text: 'Fairly Difficult', status: 'warning' };
                    if (score >= 30) return { text: 'Difficult', status: 'bad' };
                    return { text: 'Very Difficult', status: 'bad' };
                };

                sections.push({
                    id: 'title-tag',
                    title: 'Title Tag',
                    status: getStatus(backendData.title_tag),
                    explanation: backendData.title_tag === 'Missing' ? 'Missing title tag. This is important for SEO and user experience.' : `Title tag found: "${backendData.title_tag}"`
                });

                sections.push({
                    id: 'meta-description',
                    title: 'Meta Description',
                    status: getStatus(backendData.meta_description),
                    explanation: backendData.meta_description === 'Missing' ? 'Missing meta description. This affects click-through rates from search results.' : `Meta description found: "${backendData.meta_description}"`
                });

                const h1Count = backendData.h1_count;
                const h2Count = backendData.h2_count;
                const h3Count = backendData.h3_count;
                const headingOrder = backendData.heading_order || [];
                const headingIssues = backendData.heading_issues || [];

                let headingStatus = 'good';
                if (h1Count === 0 || headingIssues.some(issue => issue.startsWith('❌'))) {
                    headingStatus = 'bad';
                } else if (h1Count > 1 || headingIssues.some(issue => issue.startsWith('⚠️'))) {
                    headingStatus = 'warning';
                }

                sections.push({
                    id: 'heading-structure',
                    title: 'Heading Structure',
                    status: headingStatus,
                    explanation: h1Count === 0 ? 'Missing H1 tag. This is crucial for content hierarchy and SEO.' : h1Count === 1 && headingIssues.length === 0 ? 'Heading structure looks good!' : 'Potential issues found in heading structure. See details below.',
                    headingCounts: { h1_count: h1Count, h2_count: h2Count, h3_count: h3Count },
                    headingOrder: headingOrder,
                    headingIssues: headingIssues,
                });

                let withAlt = 0;
                let total = 0;
                if (backendData.alt_image_ratio) {
                    if (typeof backendData.alt_image_ratio === 'string') {
                        const parts = backendData.alt_image_ratio.split('/');
                        if (parts.length === 2) {
                            withAlt = parseInt(parts[0]) || 0;
                            total = parseInt(parts[1]) || 0;
                        }
                    } else if (typeof backendData.alt_image_ratio === 'object') {
                        withAlt = backendData.alt_image_ratio.withAlt || 0;
                        total = backendData.alt_image_ratio.total || 0;
                    }
                }
                const imageStatus = total === 0 ? 'good' : withAlt === total ? 'good' : 'warning';
                sections.push({
                    id: 'image-alt',
                    title: 'Image Alt Tags',
                    status: imageStatus,
                    explanation: total === 0 ? 'No images found on the page.' : withAlt === total ? `All ${total} images have alt attributes. Great job!` : `${withAlt} out of ${total} images have alt attributes. Add alt text for better accessibility and SEO.`
                });

                sections.push({
                    id: 'canonical',
                    title: 'Canonical URL',
                    status: getStatus(backendData.canonical),
                    explanation: backendData.canonical === 'Missing' ? 'Missing canonical URL tag. This helps prevent duplicate content issues.' : `Canonical URL found: ${backendData.canonical}`
                });

                sections.push({
                    id: 'responsive',
                    title: 'Mobile Responsive',
                    status: getStatus(backendData.responsive, true),
                    explanation: backendData.responsive ? 'Page has proper viewport meta tag for mobile devices.' : 'Missing or incomplete viewport meta tag. This affects mobile user experience.'
                });

                sections.push({
                    id: 'https',
                    title: 'HTTPS Security',
                    status: getStatus(backendData.uses_https, true),
                    explanation: backendData.uses_https ? 'Site is using HTTPS. Good for security and SEO.' : 'Site is not using HTTPS. This affects security and search rankings.'
                });

                sections.push({
                    id: 'robots',
                    title: 'Robots.txt',
                    status: getStatus(backendData.has_robots_txt, true),
                    explanation: backendData.has_robots_txt ? 'robots.txt file found. Good for search engine crawling control.' : 'Missing or inaccessible robots.txt file.'
                });

                sections.push({
                    id: 'favicon',
                    title: 'Favicon',
                    status: getStatus(backendData.has_favicon, true),
                    explanation: backendData.has_favicon ? 'Favicon found. Important for branding and user experience.' : 'Missing favicon.ico file.'
                });

                const speedAudit = backendData.speed_audit || {};
                const speedAuditStatus = (speedAudit.issues && speedAudit.issues.length === 0) ? 'good' : 'warning';
                sections.push({
                    id: 'speed-heuristics',
                    title: 'Speed Heuristics',
                    status: speedAuditStatus,
                    explanation: null,
                    speedAuditData: speedAudit
                });
                
                const sitemap = backendData.sitemap || {};
                let sitemapStatus = 'bad';
                if (sitemap.found && sitemap.url_count > 0) {
                    sitemapStatus = 'good';
                } else if (sitemap.found && sitemap.url_count === 0) {
                    sitemapStatus = 'warning';
                }
                sections.push({
                    id: 'sitemap-validator',
                    title: 'Sitemap Validator',
                    status: sitemapStatus,
                    explanation: null,
                    sitemapData: sitemap
                });

                const linkAudit = backendData.link_audit || {};
                const linkAuditStatus = (linkAudit.broken_links_count === 0) ? 'good' : 'bad';
                sections.push({
                    id: 'link-audit',
                    title: 'Link Audit',
                    status: linkAuditStatus,
                    explanation: null,
                    linkAuditData: linkAudit
                });

                const contentAnalysis = backendData.content_analysis || {};
                const readabilityInfo = getReadabilityStatus(contentAnalysis.flesch_reading_ease_score);
                sections.push({
                    id: 'content-analysis',
                    title: 'Content Analysis',
                    status: readabilityInfo.status,
                    explanation: null,
                });

                goodCount = sections.filter(section => section.status === 'good').length;

                const processedReportData = {
                    url: websiteUrl,
                    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                    overallScore: backendData.score || Math.round((goodCount / sections.length) * 100),
                    sections: sections,
                    content_analysis: backendData.content_analysis,
                    h1_count: backendData.h1_count,
                    h2_count: backendData.h2_count,
                    h3_count: backendData.h3_count,
                    heading_order: backendData.heading_order,
                    heading_issues: backendData.heading_issues,
                    speed_audit: backendData.speed_audit,
                    sitemap: backendData.sitemap,
                    link_audit: backendData.link_audit,
                };

                setReportData(processedReportData);

                if (currentUser && currentUser.uid) {
                    try {
                        await saveReportToFirestore(db, appId, currentUser.uid, websiteUrl, processedReportData);
                        console.log("Report saved to Firestore successfully from Report page.");
                    } catch (saveError) {
                        console.error("Error saving report from Report page:", saveError);
                    }
                } else {
                    console.warn("User not logged in, report not saved to history.");
                }

            } catch (err) {
                console.error("Error fetching report:", err);
                setError(err.message || 'Something went wrong while fetching the report.');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [websiteUrl, currentUser]);

    const getScoreColorClass = (score) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-orange-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 animate-pulse">
                    Generating your SEO report...
                </p>
            </div>
        );
    }

    if (error || !reportData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-500">
                <p className="text-red-500 text-lg font-semibold text-center mb-4">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-600 transform hover:-translate-y-1 transition"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    const { url, timestamp, overallScore, sections = [], content_analysis, heading_order, heading_issues, speed_audit, sitemap, link_audit } = reportData;

    const scoreBarWidth = `${overallScore}%`;
    const scoreColorClass = getScoreColorClass(overallScore);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-500">
            <Navbar />

            <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <motion.section
                    className="bg-white p-8 rounded-xl shadow-lg mb-10 text-center dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                        SEO Report for <span className="text-blue-600 dark:text-blue-400">{url}</span>
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">Scanned on {timestamp}</p>
                </motion.section>

                <motion.section
                    className="bg-white p-8 rounded-xl shadow-lg mb-10 text-center dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Overall SEO Score
                    </h2>
                    <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 shadow-inner">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                strokeWidth="10"
                                className="stroke-gray-200 dark:stroke-gray-600"
                                fill="transparent"
                            />
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                strokeWidth="10"
                                className={`stroke-current ${scoreColorClass}`}
                                fill="transparent"
                                strokeDasharray="282.74"
                                strokeDashoffset={282.74 - (282.74 * overallScore) / 100}
                                initial={{ strokeDashoffset: 282.74 }}
                                animate={{
                                    strokeDashoffset: 282.74 - (282.74 * overallScore) / 100,
                                }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                            />
                        </svg>
                        <span className="absolute text-5xl font-extrabold text-gray-900 dark:text-gray-100">
                            {overallScore}
                            <span className="text-3xl text-gray-600 dark:text-gray-400">/100</span>
                        </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mx-auto max-w-md">
                        <motion.div
                            className={`h-full rounded-full ${scoreColorClass}`}
                            style={{ width: scoreBarWidth }}
                            initial={{ width: 0 }}
                            animate={{ width: scoreBarWidth }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                    </div>
                </motion.section>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sections.map((section) => (
                        <ReportCard
                            key={section.id}
                            title={section.title}
                            status={section.status}
                            explanation={section.explanation}
                            onOpenKeywordsModal={section.id === 'content-analysis' ? handleOpenKeywordsModal : null}
                            contentAnalysisData={section.id === 'content-analysis' ? content_analysis : null}
                            onOpenHeadingsModal={section.id === 'heading-structure' ? handleOpenHeadingsModal : null}
                            headingCounts={section.id === 'heading-structure' ? section.headingCounts : null}
                            headingOrder={section.id === 'heading-structure' ? section.headingOrder : null}
                            headingIssues={section.id === 'heading-structure' ? section.headingIssues : null}
                            speedAuditData={section.id === 'speed-heuristics' ? speed_audit : null}
                            sitemapData={section.id === 'sitemap-validator' ? sitemap : null}
                            linkAuditData={section.id === 'link-audit' ? link_audit : null}
                            onOpenBrokenLinksModal={section.id === 'link-audit' ? handleOpenBrokenLinksModal : null}
                        />
                    ))}
                </section>

                <motion.section
                    className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <button className="bg-gray-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg cursor-not-allowed opacity-75 dark:bg-gray-600">
                        Download PDF (Coming Soon)
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-600 transform hover:-translate-y-1 transition dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        Back to Home
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-600 transform hover:-translate-y-1 transition dark:bg-indigo-600 dark:hover:bg-indigo-700"
                    >
                        Rescan Website
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-600 transform hover:-translate-y-1 transition dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        Fix Issues
                    </button>
                </motion.section>
            </main>

            <AppModals
                showKeywordsModal={showKeywordsModal}
                setShowKeywordsModal={setShowKeywordsModal}
                keywordsData={keywordsModalData}
                showHeadingsModal={showHeadingsModal}
                setShowHeadingsModal={setShowHeadingsModal}
                headingsData={headingsModalData}
                showBrokenLinksModal={showBrokenLinksModal}
                setShowBrokenLinksModal={setShowBrokenLinksModal}
                brokenLinksData={brokenLinksModalData}
            />

            <Footer />
        </div>
    );
};

export default Report;