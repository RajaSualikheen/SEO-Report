import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, Link as LinkIcon, ExternalLink, MinusCircle, Smartphone, Code, Info, Sun, Repeat, FileDown } from 'lucide-react';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import { useLocation, useNavigate } from 'react-router-dom';
import ReportCard from './ReportCard';
import ReactDOM from 'react-dom';
import { Circle } from 'rc-progress';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFReport from '../components/PDFReport';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

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


const AppModals = ({
    showKeywordsModal, setShowKeywordsModal, keywordsData,
    showHeadingsModal, setShowHeadingsModal, headingsData,
    showBrokenLinksModal, setShowBrokenLinksModal, brokenLinksData,
    showFixedWidthElementsModal, setShowFixedWidthElementsModal, fixedWidthElementsData,
    showResponsivenessIssuesModal, setShowResponsivenessIssuesModal, responsivenessIssuesData
}) => {
    const modalRef = useRef(null);
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        const root = document.getElementById('modal-root');
        if (root) {
            setPortalRoot(root);
        } else {
            console.error('❌ Error: #modal-root NOT found in the DOM.');
        }
    }, []);

    useEffect(() => {
        if (showKeywordsModal || showHeadingsModal || showBrokenLinksModal || showFixedWidthElementsModal || showResponsivenessIssuesModal) {
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
    }, [showKeywordsModal, setShowKeywordsModal, showHeadingsModal, setShowHeadingsModal, showBrokenLinksModal, setShowBrokenLinksModal, showFixedWidthElementsModal, setShowFixedWidthElementsModal, showResponsivenessIssuesModal, setShowResponsivenessIssuesModal]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowKeywordsModal(false);
                setShowHeadingsModal(false);
                setShowBrokenLinksModal(false);
                setShowFixedWidthElementsModal(false);
                setShowResponsivenessIssuesModal(false);
            }
        };
        if (showKeywordsModal || showHeadingsModal || showBrokenLinksModal || showFixedWidthElementsModal || showResponsivenessIssuesModal) {
            document.addEventListener('keydown', handleEscape);
        } else {
            document.removeEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showKeywordsModal, setShowKeywordsModal, showHeadingsModal, setShowHeadingsModal, showBrokenLinksModal, setShowBrokenLinksModal, showFixedWidthElementsModal, setShowFixedWidthElementsModal, showResponsivenessIssuesModal, setShowResponsivenessIssuesModal]);

    if (!portalRoot) {
        return null;
    }

    const modalTransitionClasses = 'transition-opacity duration-300 ease-out transform';
    const modalActiveClasses = 'opacity-100 scale-100';
    const modalInactiveClasses = 'opacity-0 scale-95';

    return (
        <>
            {showKeywordsModal && keywordsModalData && (
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
                                        {keywordsModalData?.top_keywords?.map((kw, index) => (
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
            {showHeadingsModal && headingsModalData && (
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
                                        {headingsModalData?.map((h, index) => (
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
            {showBrokenLinksModal && brokenLinksModalData && (
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

                            {brokenLinksModalData.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Link URL</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {brokenLinksModalData.map((link, index) => (
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

            {/* Fixed-Width Elements Modal */}
            {showFixedWidthElementsModal && fixedWidthElementsModalData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showFixedWidthElementsModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={() => setShowFixedWidthElementsModal(false)}
                    >
                        <div
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                                    w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                                    border border-gray-200 dark:border-gray-700
                                    ${modalTransitionClasses} ${showFixedWidthElementsModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowFixedWidthElementsModal(false)}
                                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Fixed-Width Elements</h3>

                            {fixedWidthElementsModalData.length > 0 ? (
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
                                            {fixedWidthElementsModalData.map((element, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-gray-100">&lt;{element.tag}&gt;</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200">{element.value}</td>
                                                    <td className="px-4 py-3 whitespace-normal text-base text-gray-700 dark:text-gray-200">{element.source}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-green-600 dark:text-green-300 text-center text-xl py-8">No fixed-width elements found. Great job!</p>
                            )}
                        </div>
                    </div>,
                    portalRoot
                )
            )}

            {/* Responsiveness Issues Modal */}
            {showResponsivenessIssuesModal && responsivenessIssuesModalData && (
                ReactDOM.createPortal(
                    <div
                        className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showResponsivenessIssuesModal ? modalActiveClasses : modalInactiveClasses}`}
                        onClick={() => setShowResponsivenessIssuesModal(false)}
                    >
                        <div
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                                    w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                                    border border-gray-200 dark:border-gray-700
                                    ${modalTransitionClasses} ${showResponsivenessIssuesModal ? modalActiveClasses : modalInactiveClasses}`}
                            role="dialog"
                            aria-modal="true"
                            tabIndex="-1"
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowResponsivenessIssuesModal(false)}
                                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Responsiveness Issues</h3>

                            {responsivenessIssuesModalData.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 p-4">
                                        {responsivenessIssuesModalData.map((issue, index) => (
                                            <li key={index} className="flex items-start mb-2">
                                                {issue.startsWith('❌') ? <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0" />}
                                                <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-green-600 dark:text-green-300 text-center text-xl py-8">No specific responsiveness issues found.</p>
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
    const [currentUser, setCurrentUser] = useState(undefined);
    const [activeTab, setActiveTab] = useState('Content');
    
    const [agencyName, setAgencyName] = useState('');
    const [agencyLogoPreview, setAgencyLogoPreview] = useState(null);

    const reportRef = useRef(null);

    // MODAL STATES AND HANDLERS - THESE MUST BE DECLARED HERE
    const [showKeywordsModal, setShowKeywordsModal] = useState(false);
    const [keywordsModalData, setKeywordsModalData] = useState(null);
    const [showHeadingsModal, setShowHeadingsModal] = useState(false);
    const [headingsModalData, setHeadingsModalData] = useState(null);
    const [showBrokenLinksModal, setShowBrokenLinksModal] = useState(false);
    const [brokenLinksModalData, setBrokenLinksModalData] = useState(null);
    const [showFixedWidthElementsModal, setShowFixedWidthElementsModal] = useState(false);
    const [fixedWidthElementsModalData, setFixedWidthElementsModalData] = useState(null);
    const [showResponsivenessIssuesModal, setShowResponsivenessIssuesModal] = useState(false);
    const [responsivenessIssuesModalData, setResponsivenessIssuesModalData] = useState(null);

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

    const handleOpenFixedWidthElementsModal = (data) => {
        setFixedWidthElementsModalData(data);
        setShowFixedWidthElementsModal(true);
    };

    const handleOpenResponsivenessIssuesModal = (data) => {
        setResponsivenessIssuesModalData(data);
        setShowResponsivenessIssuesModal(true);
    };
    // END MODAL STATES AND HANDLERS

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
        if (!websiteUrl || typeof currentUser === 'undefined') {
            return;
        }
        
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

                const groupedSections = {
                    Content: [],
                    Technical: [],
                    'User Experience': [],
                    Security: [],
                };

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

                const getMobileResponsivenessDisplayStatus = (auditData) => {
                    const { has_viewport_meta, fixed_width_elements } = auditData;
                    if (has_viewport_meta && fixed_width_elements.length === 0) {
                        return 'good';
                    } else if (has_viewport_meta && fixed_width_elements.length > 0) {
                        return 'warning';
                    } else {
                        return 'bad';
                    }
                };

                const getMobileResponsivenessExplanation = (auditData) => {
                    const { has_viewport_meta, viewport_content, fixed_width_elements, issues } = auditData;
                    let explanationText = '';

                    if (!has_viewport_meta) {
                        explanationText += 'Missing viewport meta tag. This is crucial for proper scaling on mobile devices. ';
                    } else if (!viewport_content || !viewport_content.includes("width=device-width")) {
                        explanationText += `Viewport meta tag found but is not correctly configured (content: "${viewport_content || 'N/A'}"). Ensure "width=device-width" is present. `;
                    } else {
                        explanationText += 'Viewport meta tag is correctly configured. ';
                    }

                    if (fixed_width_elements.length > 0) {
                        explanationText += `Found ${fixed_width_elements.length} HTML elements with fixed pixel widths, which can hinder responsive design. Consider using fluid units (%, em, rem, vw).`;
                    } else {
                        explanationText += 'No fixed-width HTML elements detected.';
                    }

                    return explanationText;
                };

                const metadataLengthAudit = backendData.metadata_length_audit || {};

                // --- Content Group ---
                let titleStatus = metadataLengthAudit.title?.status.toLowerCase() || 'bad';
                let titleExplanation = metadataLengthAudit.title?.recommendation || 'Title tag analysis failed.';
                groupedSections.Content.push({
                    id: 'title-optimization',
                    title: 'Title Optimization',
                    status: titleStatus,
                    explanation: titleExplanation,
                    metadataLengthData: metadataLengthAudit.title
                });

                let metaDescriptionStatus = metadataLengthAudit.meta_description?.status.toLowerCase() || 'bad';
                let metaDescriptionExplanation = metadataLengthAudit.meta_description?.recommendation || 'Meta description analysis failed.';
                groupedSections.Content.push({
                    id: 'meta-description',
                    title: 'Meta Description',
                    status: metaDescriptionStatus,
                    explanation: metaDescriptionExplanation,
                    metadataLengthData: metadataLengthAudit.meta_description
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
                const readabilityInfo = getReadabilityStatus(contentAnalysis.flesch_reading_ease_score);
                let contentAnalysisStatus = readabilityInfo.status;
                if (!contentAnalysis.top_keywords || contentAnalysis.top_keywords.length === 0) {
                    contentAnalysisStatus = 'bad';
                } else if (contentAnalysis.keyword_suggestions && contentAnalysis.keyword_suggestions.some(s => s.startsWith('❌') || s.startsWith('⚠️'))) {
                    if (contentAnalysisStatus === 'good') contentAnalysisStatus = 'warning';
                }
                groupedSections.Content.push({
                    id: 'content-analysis',
                    title: 'Content Quality Analysis',
                    status: contentAnalysisStatus,
                    explanation: null,
                    contentAnalysisData: contentAnalysis,
                });

                // --- Technical Group ---
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
                groupedSections.Technical.push({
                    id: 'image-alt',
                    title: 'Image Accessibility',
                    status: imageStatus,
                    explanation: total === 0 ? 'No images found on the page.' : withAlt === total ? `All ${total} images have alt attributes. Great job!` : `${withAlt} out of ${total} images have alt attributes. Add alt text for better accessibility and SEO.`,
                });

                const speedAudit = backendData.speed_audit || {};
                const speedAuditStatus = (speedAudit.issues && speedAudit.issues.length === 0) ? 'good' : 'warning';
                groupedSections.Technical.push({
                    id: 'speed-heuristics',
                    title: 'Speed Performance',
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
                groupedSections.Technical.push({
                    id: 'sitemap-validator',
                    title: 'Sitemap & Crawling',
                    status: sitemapStatus,
                    explanation: null,
                    sitemapData: sitemap
                });

                const linkAudit = backendData.link_audit || {};
                const linkAuditStatus = (linkAudit.broken_links_count === 0) ? 'good' : 'bad';
                groupedSections.Technical.push({
                    id: 'link-audit',
                    title: 'Link Profile',
                    status: linkAuditStatus,
                    explanation: null,
                    linkAuditData: linkAudit
                });

                const structuredDataAudit = backendData.structured_data_audit || {};
                let structuredDataStatus = 'bad';
                let structuredDataExplanation = '';
                if (structuredDataAudit.ld_json_found && structuredDataAudit.schema_types.length > 0 && structuredDataAudit.issues.length === 0) {
                    structuredDataStatus = 'good';
                    structuredDataExplanation = `Schema Found — Type(s): ${structuredDataAudit.schema_types.join(', ')}`;
                } else if (structuredDataAudit.ld_json_found && structuredDataAudit.issues.length > 0) {
                    structuredDataStatus = 'warning';
                    structuredDataExplanation = `Schema found with issues or no explicit types detected.`;
                } else if (structuredDataAudit.ld_json_found && structuredDataAudit.schema_types.length === 0) {
                    structuredDataStatus = 'warning';
                    structuredDataExplanation = `JSON-LD found, but no @type property detected.`;
                } else {
                    structuredDataStatus = 'bad';
                    structuredDataExplanation = 'No structured data schema found. Consider adding JSON-LD for rich snippets.';
                }
                groupedSections.Technical.push({
                    id: 'structured-data-schema',
                    title: 'Structured Data Schema',
                    status: structuredDataStatus,
                    explanation: structuredDataExplanation,
                    structuredDataAuditData: structuredDataAudit
                });

                const localSeoAudit = backendData.local_seo_audit || {};
                let localSeoStatus = localSeoAudit.status.toLowerCase().includes('present') ? 'good' :
                                           localSeoAudit.status.toLowerCase().includes('partial') ? 'warning' : 'bad';
                
                let localSeoExplanation = '';
                if (localSeoAudit.status === "✅ Present") {
                    localSeoExplanation = "Key local SEO elements (schema, address, phone) are present.";
                } else if (localSeoAudit.status === "⚠️ Partial") {
                    localSeoExplanation = "Local SEO implementation is partial. Review details for improvements.";
                } else {
                    localSeoExplanation = "Local SEO essentials are missing. Consider implementing schema, physical address, and phone number.";
                }

                groupedSections.Technical.push({
                    id: 'local-seo-audit',
                    title: 'Local SEO',
                    status: localSeoStatus,
                    explanation: localSeoExplanation,
                    localSeoAuditData: localSeoAudit
                });


                // --- User Experience Group ---
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

                const ogTwitterAudit = backendData.og_twitter_audit || {};
                let socialMetaStatus = 'bad';
                if (ogTwitterAudit.og_title_found && ogTwitterAudit.og_image_found && ogTwitterAudit.og_image_url && ogTwitterAudit.og_image_url.trim() !== '') {
                    socialMetaStatus = 'good';
                } else if (ogTwitterAudit.og_title_found || ogTwitterAudit.og_image_found || ogTwitterAudit.twitter_title_found || ogTwitterAudit.twitter_image_found) {
                    socialMetaStatus = 'warning';
                } else {
                    socialMetaStatus = 'bad';
                }
                groupedSections['User Experience'].push({
                    id: 'social-meta-preview',
                    title: 'Social Media Integration',
                    status: socialMetaStatus,
                    explanation: null,
                    ogTwitterData: ogTwitterAudit
                });

                // --- Security Group ---
                groupedSections.Security.push({
                    id: 'canonical',
                    title: 'Canonical URL',
                    status: getStatus(backendData.canonical),
                    explanation: backendData.canonical === 'Missing' ? 'Missing canonical URL tag. This helps prevent duplicate content issues.' : `Canonical URL found: ${backendData.canonical}`
                });

                groupedSections.Security.push({
                    id: 'https',
                    title: 'HTTPS Usage',
                    status: getStatus(backendData.uses_https, true),
                    explanation: backendData.uses_https ? 'Site is using HTTPS. Good for security and SEO.' : 'Site is not using HTTPS. This affects security and search rankings.'
                });

                groupedSections.Security.push({
                    id: 'robots',
                    title: 'Robots.txt',
                    status: getStatus(backendData.has_robots_txt, true),
                    explanation: backendData.has_robots_txt ? 'robots.txt file found. Good for search engine crawling control.' : 'Missing or inaccessible robots.txt file.'
                });

                groupedSections.Security.push({
                    id: 'favicon',
                    title: 'Favicon',
                    status: getStatus(backendData.has_favicon, true),
                    explanation: backendData.has_favicon ? 'Favicon found. Important for branding and user experience.' : 'Missing favicon.ico file.'
                });

                const allSections = Object.values(groupedSections).flat();
                const goodCount = allSections.filter(section => section.status === 'good').length;
                const calculatedOverallScore = Math.round((goodCount / (allSections.length || 1)) * 100);

                const processedReportData = {
                    url: websiteUrl,
                    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                    overallScore: backendData.score || calculatedOverallScore,
                    groupedSections: groupedSections,
                    backendData: backendData,
                    metadata_length_audit: backendData.metadata_length_audit,
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
                                summary: {
                                    overallScore: processedReportData.overallScore,
                                },
                            };
                            const updatedHistory = [newReportEntry, ...existingHistory.slice(0, 9)];

                            await updateDoc(userDocRef, {
                                reportHistory: updatedHistory,
                            });
                            console.log("Report history updated in Firestore.");
                        } else {
                            console.log("User document not found.");
                        }
                    } catch (saveError) {
                        console.error("Error saving report from Report page:", saveError);
                    }
                } else if (currentUser === null) {
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
    }, [websiteUrl, currentUser, db]);
    
    // The handleDownloadPdf function is no longer needed with PDFDownloadLink
    
    const getScoreColor = (score) => {
        if (score >= 80) return '#22C55E';
        if (score >= 60) return '#F97316';
        return '#EF4444';
    };

    const calculateCategoryScore = (categoryName) => {
        const sections = reportData?.groupedSections?.[categoryName] || [];
        const totalSections = sections.length;
        if (totalSections === 0) return { score: 0, max: 0, percentage: 0 };
        let goodCount = 0;
        sections.forEach(section => {
            if (section.status === 'good') {
                goodCount++;
            }
        });
        const percentage = Math.round((goodCount / totalSections) * 100);
        return { score: goodCount, max: totalSections, percentage: percentage };
    };

    const getTabStatusCounts = (tabSections) => {
        const counts = { good: 0, warning: 0, bad: 0 };
        tabSections.forEach(section => {
            counts[(section.status || 'bad')]++;
        });
        return counts;
    };


    const {
        url: reportUrl,
        overallScore = 0,
        groupedSections = {},
        backendData = {}
    } = reportData || {};

    const categoryBreakdownData = [
        { name: 'Overall SEO Score', id: 'overall', color: '#3b82f6' },
        { name: 'Content', id: 'content', color: '#22C55E' },
        { name: 'Technical', id: 'technical', color: '#22C55E' },
        { name: 'User Experience', id: 'user_experience', color: '#FACC15' },
        { name: 'Security', id: 'security', color: '#84CC16' },
        { name: 'Off-Page', id: 'off_page', color: '#A855F7' },
    ].map(category => {
        let scoreData;
        if (category.id === 'overall') {
            scoreData = { score: overallScore, max: 100, percentage: overallScore };
        } else if (category.id === 'off_page') {
             scoreData = { score: 0, max: 5, percentage: 0 };
        }
        else {
            scoreData = calculateCategoryScore(category.name);
        }

        return {
            ...category,
            currentScore: scoreData.score,
            maxScore: scoreData.max,
            percentage: scoreData.percentage
        };
    });

    const tabNames = Object.keys(groupedSections);


    if (loading) {
        const brandColors = {
            primary: '#8A4AF3',
            secondary: '#3B82F6',
            accent: '#C084FC'
        };

        const Dot = ({ delay }) => (
            <motion.span
                className="inline-block w-3 h-3 mx-1 rounded-full bg-gradient-to-br from-purple-400 to-blue-500"
                variants={{
                    animate: {
                        y: ["0%", "-50%", "0%"],
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8]
                    },
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay,
                }}
            />
        );

        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 text-gray-800 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 transition-colors duration-500 relative overflow-hidden"
            >
                <motion.div
                    className="absolute inset-0 z-0 opacity-10"
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{ scale: 1.1, rotate: 5 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear", repeatType: "mirror" }}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20ZM40 40V20L20 40Z'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '80px 80px',
                    }}
                ></motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-11/12"
                >
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                        <span style={{ color: brandColors.primary }}>CrestNova.Sol</span>
                    </h1>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
                        Generating your Premium SEO report...
                    </p>

                    <div className="flex justify-center items-center h-12 mb-4">
                        <Dot delay={0} />
                        <Dot delay={0.2} />
                        <Dot delay={0.4} />
                    </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Analyzing over 50+ SEO parameters for optimal performance.
                    </p>
                </motion.div>
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


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-500">
            <Navbar user={currentUser} handleLogout={handleLogout} />

            <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div ref={reportRef}>
                    <motion.section
                        className="bg-white p-6 rounded-xl shadow-lg mb-8 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                CrestNova.Sol
                            </h2>
                            <div className="flex items-center space-x-2">
                                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                    <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    title="Rescan Website"
                                >
                                    <Repeat className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
                            Premium SEO Report
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 items-center">
                            <div className="md:col-span-1 flex flex-col items-center justify-center p-4">
                                <div className="relative w-40 h-40">
                                    <Circle
                                        percent={overallScore}
                                        strokeWidth={8}
                                        strokeColor="#3b82f6"
                                        trailColor="#e0e0e0"
                                        trailWidth={8}
                                        strokeLinecap="round"
                                    />
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                                            {overallScore}
                                        </span>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total score</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 lg:col-span-1 space-y-3 p-4">
                                {categoryBreakdownData.map((category) => (
                                    <div key={category.name} className="flex items-center space-x-3">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }}></span>
                                        <span className="flex-grow text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                                        <div className="relative w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <motion.div
                                                className="h-2.5 rounded-full"
                                                style={{
                                                    width: `${category.percentage}%`,
                                                    backgroundColor: category.color,
                                                }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${category.percentage}%` }}
                                                transition={{ duration: 0.8 }}
                                            />
                                        </div>
                                        <span className="w-10 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {category.currentScore}/{category.maxScore}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="hidden lg:block lg:col-span-1"></div>
                        </div>

                        <div className="mt-8 flex flex-wrap justify-between items-center space-y-4 sm:space-y-0">
                            <div className="flex-grow flex flex-wrap justify-center sm:justify-start">
                                <nav className="flex space-x-2 sm:space-x-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    {tabNames.map((tab) => {
                                        const counts = getTabStatusCounts(groupedSections?.[tab] || []);
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`
                                                    ${activeTab === tab
                                                        ? 'bg-white text-indigo-600 dark:bg-gray-900 dark:text-indigo-400 shadow'
                                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}
                                                    relative px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ease-in-out flex items-center
                                                `}
                                            >
                                                {tab}
                                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    counts.bad > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    counts.warning > 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    }`}>
                                                    {counts.bad + counts.warning + counts.good}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>

                            <div className="flex-shrink-0 flex space-x-2">
                                {reportData && (
                                    <PDFDownloadLink
                                        document={
                                            <PDFReport
                                                reportData={reportData}
                                                agencyName={agencyName}
                                                agencyLogoPreview={agencyLogoPreview}
                                            />
                                        }
                                        fileName={`SEO_Report_${(reportData?.url || 'untitled').replace(/https?:\/\//, '').replace(/\//g, '_')}.pdf`}
                                    >
                                        {({ loading }) => (
                                            <motion.button
                                                disabled={loading}
                                                className={`py-2.5 px-5 rounded-lg shadow-md font-bold text-sm flex items-center justify-center transition-colors duration-200
                                                    ${loading
                                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'}`
                                                    }
                                                whileHover={{ scale: loading ? 1 : 1.02 }}
                                                whileTap={{ scale: loading ? 1 : 0.98 }}
                                            >
                                                <FileDown className="w-4 h-4 mr-2" />
                                                {loading ? 'Generating PDF...' : 'Download Report'}
                                            </motion.button>
                                        )}
                                    </PDFDownloadLink>
                                )}
                                <motion.button
                                    className="bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:bg-blue-700 transform hover:-translate-y-0.5 transition flex items-center justify-center text-sm"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Fix Critical Issues
                                </motion.button>
                            </div>
                        </div>
                    </motion.section>

                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {groupedSections?.[activeTab]?.map((section) => (
                            <ReportCard
                                key={section.id}
                                title={section.title}
                                status={section.status}
                                explanation={section.explanation}
                                action={section.action}
                                onOpenKeywordsModal={section.id === 'content-analysis' ? handleOpenKeywordsModal : null}
                                contentAnalysisData={section.id === 'content-analysis' ? backendData.content_analysis : null}
                                onOpenHeadingsModal={section.id === 'heading-structure' ? handleOpenHeadingsModal : null}
                                headingCounts={section.id === 'heading-structure' ? section.headingCounts : null}
                                headingOrder={section.id === 'heading-structure' ? section.headingOrder : null}
                                headingIssues={section.id === 'heading-structure' ? section.headingIssues : null}
                                speedAuditData={section.id === 'speed-heuristics' ? backendData.speed_audit : null}
                                sitemapData={section.id === 'sitemap-validator' ? backendData.sitemap : null}
                                linkAuditData={section.id === 'link-audit' ? backendData.link_audit : null}
                                onOpenBrokenLinksModal={section.id === 'link-audit' ? handleOpenBrokenLinksModal : null}
                                ogTwitterData={section.id === 'social-meta-preview' ? backendData.og_twitter_audit : null}
                                mobileResponsivenessData={section.id === 'mobile-responsiveness-audit' ? backendData.mobile_responsiveness_audit : null}
                                onOpenFixedWidthElementsModal={section.id === 'mobile-responsiveness-audit' ? handleOpenFixedWidthElementsModal : null}
                                onOpenResponsivenessIssuesModal={section.id === 'mobile-responsiveness-audit' ? handleOpenResponsivenessIssuesModal : null}
                                structuredDataAuditData={section.id === 'structured-data-schema' ? backendData.structured_data_audit : null}
                                localSeoAuditData={section.id === 'local-seo-audit' ? backendData.local_seo_audit : null}
                                metadataLengthData={section.metadataLengthData}
                                overallScore={overallScore}
                            />
                        ))}
                    </section>
                </div>
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
                showFixedWidthElementsModal={showFixedWidthElementsModal}
                setShowFixedWidthElementsModal={setShowFixedWidthElementsModal}
                fixedWidthElementsModalData={fixedWidthElementsModalData}
                showResponsivenessIssuesModal={showResponsivenessIssuesModal}
                setShowResponsivenessIssuesModal={setShowResponsivenessIssuesModal}
                responsivenessIssuesModalData={responsivenessIssuesModalData}
            />

            <Footer />
        </div>
    );
};

export default Report;