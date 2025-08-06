import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Circle } from 'rc-progress';
import Navbar from '../Navbar';
import Footer from '../Footer';
import PDFReport from '../PDFReport';
import PremiumLoadingScreen from '../PremiumLoadingScreen';
import MainScorecard from './MainScorecard';
import CategorySection from './CategorySection';
import AppModals from './AppModals';
import { getCategoryIcon, ElegantDivider, getCategoryStatus, calculateSectionScore } from './utils';

// Firebase Config
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

export const Report = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const websiteUrl = location.state?.websiteUrl;
    const targetKeyword = location.state?.targetKeyword;

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [currentUser, setCurrentUser] = useState(undefined);
    const [agencyName, setAgencyName] = useState('');
    const [agencyLogoPreview, setAgencyLogoPreview] = useState(null);

    const [modalStates, setModalStates] = useState({
        showTopKeywordsModal: false,
        showSuggestionsModal: false,
        showHeadingsModal: false,
        showBrokenLinksModal: false,
        showFixedWidthElementsModal: false,
        showResponsivenessIssuesModal: false,
        showRedirectsModal: false,
        showSitemapIssuesModal: false,
        showStructuredDataIssuesModal: false,
        showLocalSeoIssuesModal: false,
        showImageIssuesModal: false,
        keywordsModalData: { top_keywords: [], keyword_suggestions: [] },
        headingsModalData: null,
        brokenLinksModalData: null,
        fixedWidthElementsModalData: null,
        responsivenessIssuesModalData: null,
        redirectsModalData: null,
        sitemapIssuesModalData: null,
        structuredDataIssuesModalData: null,
        localSeoIssuesModalData: null,
        imageIssuesModalData: null,
    });

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
                setProgress(0);

                const startTime = Date.now();
                const totalDuration = 25000;
                let animationFrameId;

                const animateProgress = () => {
                    const elapsedTime = Date.now() - startTime;
                    const newProgress = Math.min((elapsedTime / totalDuration) * 95, 95);
                    setProgress(newProgress);
                    if (newProgress < 95) {
                        animationFrameId = requestAnimationFrame(animateProgress);
                    }
                };
                animationFrameId = requestAnimationFrame(animateProgress);

                const response = await fetch('http://localhost:4000/api/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: websiteUrl, keyword: targetKeyword }),
                });

                cancelAnimationFrame(animationFrameId);

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

                const metadataAudit = backendData.metadata_audit || {};
                const pagespeedAudit = backendData.pagespeed_audit || {};
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

                const headingAudit = backendData.heading_audit || {};
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

                const contentAnalysis = backendData.content_analysis || {};
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

                const keywordAnalysis = backendData.content_analysis?.keyword_analysis;
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

                const imageAnalysis = backendData.image_analysis || {};
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

                const structuredDataAudit = backendData.structured_data_audit || {};
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

                const httpsAudit = backendData.https_audit || {};
                groupedSections.Security.push({
                    id: 'https-usage',
                    title: 'HTTPS Usage',
                    status: httpsAudit.https_enabled ? 'good' : 'bad',
                    explanation: httpsAudit.https_enabled ? 'Site is using HTTPS. Good for security and SEO.' : 'Site is not using HTTPS. This affects security and search rankings.',
                    httpsAuditData: httpsAudit
                });

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

                const processedReportData = {
                    url: websiteUrl,
                    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                    overallScore: backendData.overall_score || 0,
                    groupedSections: groupedSections,
                    backendData: backendData || {},
                };

                setReportData(processedReportData);
                setProgress(100);

                setTimeout(() => {
                    setLoading(false);
                }, 500);

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
                setLoading(false);
                setProgress(0);
            }
        };
        fetchReport();
    }, [websiteUrl, targetKeyword, currentUser]);

    const handleOpenModal = (modalType, data) => {
        setModalStates(prev => ({ ...prev, [modalType]: true, [`${modalType.replace('show', '').toLowerCase()}Data`]: data }));
    };

    const loadingMessages = [
        'Fetching website HTML...',
        'Analyzing content structure...',
        'Performing technical audits...',
        'Requesting PageSpeed Insights data...',
        'Checking Core Web Vitals...',
        'Analyzing crawlability and redirects...',
        'Generating final report...'
    ];

    if (loading) {
        return <PremiumLoadingScreen progress={progress} messages={loadingMessages} />;
    }

    if (error || !reportData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-500">
                <p className="text-red-500 text-lg font-semibold text-center mb-4">{error}</p>
                <button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition">Back to Home</button>
            </div>
        );
    }

    const { url: reportUrl, overallScore, groupedSections = {}, backendData = {} } = reportData;

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
                <MainScorecard reportData={reportData} />
                <div className="space-y-12 mt-12">
                    {Object.keys(groupedSections).map(categoryName => (
                        <CategorySection
                            key={categoryName}
                            categoryName={categoryName}
                            sections={groupedSections[categoryName]}
                            backendData={backendData}
                            onOpenModal={handleOpenModal}
                            calculateSectionScore={calculateSectionScore}
                        />
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
            <AppModals modalStates={modalStates} setModalStates={setModalStates} />
            <Footer />
        </div>
    );
};