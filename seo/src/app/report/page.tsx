// app/report/page.tsx
'use client'; // This component uses hooks (useState, useEffect), Next.js router, and makes API calls

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, FileCode, Link as LinkIcon, ExternalLink, MinusCircle, Smartphone, Code, Info, Sun, Repeat } from 'lucide-react';
// No need to import Navbar and Footer here, as they are included in app/layout.tsx
import { useRouter, useSearchParams } from 'next/navigation'; // Use Next.js routing hooks
import { Circle } from 'rc-progress'; // Ensure rc-progress is installed

// Firebase Imports (Re-using the same initialization pattern as other pages)
import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirestore, Firestore, doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";

// Define Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "dummy-measurement-id",
};

const appId: string = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';

// Initialize Firebase (ensure this runs only once)
let firebaseAppInstance: FirebaseApp;
let firebaseAuthInstance: Auth;
let firestoreDbInstance: Firestore;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    firebaseAppInstance = initializeApp(firebaseConfig);
  } else {
    firebaseAppInstance = getApp();
  }
  firebaseAuthInstance = getAuth(firebaseAppInstance);
  firestoreDbInstance = getFirestore(firebaseAppInstance);
}

const auth = firebaseAuthInstance!;
const db = firestoreDbInstance!;


// Import AppModals (assuming it's in components folder)
import AppModals from '@/app/components/AppModals';

// Define interfaces for ReportCard and its data
interface ReportCardProps {
  title: string;
  status: 'good' | 'warning' | 'bad';
  explanation: string | null;
  action?: string | null; // e.g., "View Details"
  onOpenKeywordsModal?: (data: any) => void; // Using any for data for now, define specific types later
  contentAnalysisData?: ContentAnalysisData | null;
  onOpenHeadingsModal?: (data: any) => void;
  headingCounts?: { h1_count: number; h2_count: number; h3_count: number } | null;
  headingOrder?: HeadingData[] | null;
  headingIssues?: string[] | null;
  speedAuditData?: SpeedAuditData | null;
  sitemapData?: SitemapData | null;
  linkAuditData?: LinkAuditData | null;
  onOpenBrokenLinksModal?: (data: any) => void;
  ogTwitterData?: OgTwitterAuditData | null;
  mobileResponsivenessData?: MobileResponsivenessAuditData | null;
  onOpenFixedWidthElementsModal?: (data: any) => void;
  onOpenResponsivenessIssuesModal?: (data: any) => void;
  structuredDataAuditData?: StructuredDataAuditData | null;
  localSeoAuditData?: LocalSeoAuditData | null;
  metadataLengthData?: MetadataLengthData | null;
  overallScore?: number; // Pass overall score for context if needed
}

// Define interfaces for the complex data structures in the report
interface MetadataLengthData {
  status: string;
  recommendation: string;
  length?: number;
  min_length?: number;
  max_length?: number;
  content?: string;
}

interface KeywordData {
  keyword: string;
  frequency: number;
  density: number;
}

interface ContentAnalysisData {
  word_count: number;
  flesch_reading_ease_score: number;
  flesch_reading_ease_grade: string;
  top_keywords: KeywordData[];
  keyword_suggestions: string[];
}

interface HeadingData {
  tag: string;
  text: string;
}

interface SpeedAuditData {
  issues: string[]; // e.g., "⚠️ Large image files"
  // Add other speed metrics if available from backend
}

interface SitemapData {
  found: boolean;
  url_count: number;
  url?: string;
  issues?: string[];
}

interface BrokenLinkData {
  url: string;
  reason: string;
}

interface LinkAuditData {
  total_internal_links: number;
  total_external_links: number;
  broken_links_count: number;
  broken_links: BrokenLinkData[];
}

interface OgTwitterAuditData {
  og_title_found: boolean;
  og_title_content?: string;
  og_image_found: boolean;
  og_image_url?: string;
  twitter_title_found: boolean;
  twitter_title_content?: string;
  twitter_image_found: boolean;
  twitter_image_url?: string;
}

interface MobileResponsivenessAuditData {
  has_viewport_meta: boolean;
  viewport_content?: string;
  fixed_width_elements: { tag: string; value: string; source: string }[];
  issues: string[]; // e.g., "❌ Missing viewport meta tag"
}

interface StructuredDataAuditData {
  ld_json_found: boolean;
  schema_types: string[];
  issues: string[];
  raw_data?: any; // For raw JSON-LD if needed
}

interface LocalSeoAuditData {
  status: string; // e.g., "✅ Present", "⚠️ Partial", "❌ Missing"
  address?: string;
  phone?: string;
  gmb_link?: string;
  schema_present?: boolean;
  issues?: string[];
}

// Define a generic type for a section in groupedSections
interface ReportSection {
  id: string;
  title: string;
  status: 'good' | 'warning' | 'bad';
  explanation: string | null;
  // Include all possible data types that might be passed to ReportCard
  metadataLengthData?: MetadataLengthData;
  headingCounts?: { h1_count: number; h2_count: number; h3_count: number };
  headingOrder?: HeadingData[];
  headingIssues?: string[];
  contentAnalysisData?: ContentAnalysisData;
  speedAuditData?: SpeedAuditData;
  sitemapData?: SitemapData;
  linkAuditData?: LinkAuditData;
  ogTwitterData?: OgTwitterAuditData;
  mobileResponsivenessData?: MobileResponsivenessAuditData;
  structuredDataAuditData?: StructuredDataAuditData;
  localSeoAuditData?: LocalSeoAuditData;
}

// Define the overall structure of the processed report data
interface ProcessedReportData {
  url: string;
  timestamp: string;
  overallScore: number;
  groupedSections: {
    Content: ReportSection[];
    Technical: ReportSection[];
    'User Experience': ReportSection[];
    Security: ReportSection[];
    // 'Off-Page': ReportSection[]; // If you have data for Off-Page, uncomment
  };
  backendData: any; // The raw data from the backend
}

// ReportCard Component (assuming it's in components/ReportCard.tsx)
// If you don't have this file, you'll need to create it.
// I'm providing a basic structure for it here.
interface ReportCardProps {
  title: string;
  status: 'good' | 'warning' | 'bad';
  explanation: string | null;
  action?: string | null;
  // Modals and their data
  onOpenKeywordsModal?: (data: any) => void;
  contentAnalysisData?: ContentAnalysisData | null;
  onOpenHeadingsModal?: (data: any) => void;
  headingCounts?: { h1_count: number; h2_count: number; h3_count: number } | null;
  headingOrder?: HeadingData[] | null;
  headingIssues?: string[] | null;
  speedAuditData?: SpeedAuditData | null;
  sitemapData?: SitemapData | null;
  linkAuditData?: LinkAuditData | null;
  onOpenBrokenLinksModal?: (data: any) => void;
  ogTwitterData?: OgTwitterAuditData | null;
  mobileResponsivenessData?: MobileResponsivenessAuditData | null;
  onOpenFixedWidthElementsModal?: (data: any) => void;
  onOpenResponsivenessIssuesModal?: (data: any) => void;
  structuredDataAuditData?: StructuredDataAuditData | null;
  localSeoAuditData?: LocalSeoAuditData | null;
  metadataLengthData?: MetadataLengthData | null;
  overallScore?: number;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title, status, explanation, action,
  onOpenKeywordsModal, contentAnalysisData,
  onOpenHeadingsModal, headingCounts, headingOrder, headingIssues,
  speedAuditData, sitemapData, linkAuditData, onOpenBrokenLinksModal,
  ogTwitterData, mobileResponsivenessData, onOpenFixedWidthElementsModal, onOpenResponsivenessIssuesModal,
  structuredDataAuditData, localSeoAuditData, metadataLengthData, overallScore
}) => {
  const getStatusIcon = (currentStatus: string) => {
    switch (currentStatus) {
      case 'good': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'bad': return <MinusCircle className="w-6 h-6 text-red-500" />;
      default: return <Info className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusClasses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'good': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'bad': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const renderContent = () => {
    switch (title) {
      case 'Title Optimization':
      case 'Meta Description':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{explanation}</p>
            {metadataLengthData && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current: {metadataLengthData.content || 'N/A'} (Length: {metadataLengthData.length || 0})<br />
                Recommended: {metadataLengthData.min_length}-{metadataLengthData.max_length} characters
              </p>
            )}
          </>
        );
      case 'Content Structure':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{explanation}</p>
            {headingCounts && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                H1s: {headingCounts.h1_count}, H2s: {headingCounts.h2_count}, H3s: {headingCounts.h3_count}
              </p>
            )}
            {headingIssues && headingIssues.length > 0 && (
              <ul className="list-disc list-inside text-sm text-red-500 dark:text-red-300 mt-2">
                {headingIssues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
            {headingOrder && headingOrder.length > 0 && onOpenHeadingsModal && (
              <button
                onClick={() => onOpenHeadingsModal(headingOrder)}
                className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
              >
                View Full Heading Order <BookOpen className="w-4 h-4 ml-1" />
              </button>
            )}
          </>
        );
      case 'Content Quality Analysis':
        const readabilityInfo = contentAnalysisData?.flesch_reading_ease_score ? getReadabilityStatus(contentAnalysisData.flesch_reading_ease_score) : null;
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Word Count: {contentAnalysisData?.word_count || 'N/A'}
            </p>
            {readabilityInfo && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                Readability: {readabilityInfo.text} (Score: {contentAnalysisData?.flesch_reading_ease_score?.toFixed(1) || 'N/A'})
              </p>
            )}
            {contentAnalysisData?.keyword_suggestions && contentAnalysisData.keyword_suggestions.length > 0 && (
              <ul className="list-disc list-inside text-sm text-orange-500 dark:text-orange-300 mt-2">
                {contentAnalysisData.keyword_suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
              </ul>
            )}
            {contentAnalysisData?.top_keywords && contentAnalysisData.top_keywords.length > 0 && onOpenKeywordsModal && (
              <button
                onClick={() => onOpenKeywordsModal(contentAnalysisData)}
                className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
              >
                View Top Keywords <Hash className="w-4 h-4 ml-1" />
              </button>
            )}
          </>
        );
      case 'Image Accessibility':
        return (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{explanation}</p>
        );
      case 'Speed Performance':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {speedAuditData?.issues && speedAuditData.issues.length > 0
                ? 'Potential issues impacting page load speed found.'
                : 'Page speed heuristics look good.'}
            </p>
            {speedAuditData?.issues && speedAuditData.issues.length > 0 && (
              <ul className="list-disc list-inside text-sm text-orange-500 dark:text-orange-300 mt-2">
                {speedAuditData.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              For detailed speed metrics, consider using Google PageSpeed Insights.
            </p>
          </>
        );
      case 'Sitemap & Crawling':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              {sitemapData?.found ? `Sitemap found at: ${sitemapData.url}` : 'No sitemap.xml found.'}
            </p>
            {sitemapData?.found && sitemapData.url_count !== undefined && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                URLs listed in sitemap: {sitemapData.url_count}
              </p>
            )}
            {sitemapData?.issues && sitemapData.issues.length > 0 && (
              <ul className="list-disc list-inside text-sm text-orange-500 dark:text-orange-300 mt-2">
                {sitemapData.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
          </>
        );
      case 'Link Profile':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Total Internal Links: {linkAuditData?.total_internal_links || 'N/A'}<br />
              Total External Links: {linkAuditData?.total_external_links || 'N/A'}
            </p>
            {linkAuditData?.broken_links_count !== undefined && linkAuditData.broken_links_count > 0 ? (
              <>
                <p className="text-red-500 dark:text-red-300 text-sm mb-2">
                  Broken Links Found: {linkAuditData.broken_links_count}
                </p>
                {onOpenBrokenLinksModal && (
                  <button
                    onClick={() => onOpenBrokenLinksModal(linkAuditData.broken_links)}
                    className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                  >
                    View Broken Links <LinkIcon className="w-4 h-4 ml-1" />
                  </button>
                )}
              </>
            ) : (
              <p className="text-green-600 dark:text-green-300 text-sm">No broken links detected. Excellent!</p>
            )}
          </>
        );
      case 'Structured Data Schema':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{explanation}</p>
            {structuredDataAuditData?.schema_types && structuredDataAuditData.schema_types.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detected Types: {structuredDataAuditData.schema_types.join(', ')}
              </p>
            )}
            {structuredDataAuditData?.issues && structuredDataAuditData.issues.length > 0 && (
              <ul className="list-disc list-inside text-sm text-orange-500 dark:text-orange-300 mt-2">
                {structuredDataAuditData.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
          </>
        );
      case 'Local SEO':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{explanation}</p>
            {localSeoAuditData?.address && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Address: {localSeoAuditData.address}</p>
            )}
            {localSeoAuditData?.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone: {localSeoAuditData.phone}</p>
            )}
            {localSeoAuditData?.gmb_link && (
              <p className="text-sm text-gray-500 dark:text-gray-400">GMB Link: <a href={localSeoAuditData.gmb_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View</a></p>
            )}
            {localSeoAuditData?.issues && localSeoAuditData.issues.length > 0 && (
              <ul className="list-disc list-inside text-sm text-orange-500 dark:text-orange-300 mt-2">
                {localSeoAuditData.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            )}
          </>
        );
      case 'Mobile Experience':
        const mobileStatusText = mobileResponsivenessData?.has_viewport_meta ? 'Viewport meta tag found.' : 'Missing viewport meta tag.';
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{explanation}</p>
            {mobileResponsivenessData?.fixed_width_elements && mobileResponsivenessData.fixed_width_elements.length > 0 && onOpenFixedWidthElementsModal && (
              <button
                onClick={() => onOpenFixedWidthElementsModal(mobileResponsivenessData.fixed_width_elements)}
                className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
              >
                View Fixed-Width Elements <Code className="w-4 h-4 ml-1" />
              </button>
            )}
            {mobileResponsivenessData?.issues && mobileResponsivenessData.issues.length > 0 && onOpenResponsivenessIssuesModal && (
              <button
                onClick={() => onOpenResponsivenessIssuesModal(mobileResponsivenessData.issues)}
                className="mt-3 text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
              >
                View Responsiveness Issues <Smartphone className="w-4 h-4 ml-1" />
              </button>
            )}
          </>
        );
      case 'Social Media Integration':
        return (
          <>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              Open Graph Title: {ogTwitterData?.og_title_found ? ogTwitterData.og_title_content || 'Found' : 'Missing'} <br />
              Open Graph Image: {ogTwitterData?.og_image_found ? ogTwitterData.og_image_url || 'Found' : 'Missing'}
            </p>
            {ogTwitterData?.og_image_url && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">OG Image Preview:</p>
                <img src={ogTwitterData.og_image_url} alt="Open Graph Preview" className="max-w-[150px] h-auto rounded-md shadow-sm" onError={(e) => (e.currentTarget.src = `https://placehold.co/150x100/e0e0e0/000000?text=Image+Error`)} />
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Twitter Card Title: {ogTwitterData?.twitter_title_found ? ogTwitterData.twitter_title_content || 'Found' : 'Missing'} <br />
              Twitter Card Image: {ogTwitterData?.twitter_image_found ? ogTwitterData.twitter_image_url || 'Found' : 'Missing'}
            </p>
          </>
        );
      case 'HTTPS Usage':
      case 'Robots.txt':
      case 'Favicon':
      case 'Canonical URL':
        return (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{explanation}</p>
        );
      default:
        return <p className="text-gray-600 dark:text-gray-400 text-sm">{explanation || 'No detailed explanation available.'}</p>;
    }
  };

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-xl`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(status)}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex items-center mb-4">
        {getStatusIcon(status)}
        <p className="ml-3 text-lg font-medium text-gray-700 dark:text-gray-300 flex-grow">
          {title} Status
        </p>
      </div>
      <div className="flex-grow">
        {renderContent()}
      </div>
      {action && (
        <button
          onClick={() => { /* Implement specific action if needed */ }}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium self-start"
        >
          {action}
        </button>
      )}
    </motion.div>
  );
};


const Report: React.FC = () => {
  const router = useRouter(); // Next.js router
  const searchParams = useSearchParams(); // To get query parameters
  const websiteUrl = searchParams.get('url'); // Get URL from query param

  const [reportData, setReportData] = useState<ProcessedReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Content'); // State for active tab

  // Modal states and handlers
  const [showKeywordsModal, setShowKeywordsModal] = useState<boolean>(false);
  const [keywordsModalData, setKeywordsModalData] = useState<{ top_keywords: KeywordData[] } | null>(null);
  const [showHeadingsModal, setShowHeadingsModal] = useState<boolean>(false);
  const [headingsModalData, setHeadingsModalData] = useState<HeadingData[] | null>(null);
  const [showBrokenLinksModal, setShowBrokenLinksModal] = useState<boolean>(false);
  const [brokenLinksModalData, setBrokenLinksModalData] = useState<BrokenLinkData[] | null>(null);
  const [showFixedWidthElementsModal, setShowFixedWidthElementsModal] = useState<boolean>(false);
  const [fixedWidthElementsModalData, setFixedWidthElementsModalData] = useState<FixedWidthElementData[] | null>(null);
  const [showResponsivenessIssuesModal, setShowResponsivenessIssuesModal] = useState<boolean>(false);
  const [responsivenessIssuesModalData, setResponsivenessIssuesModalData] = useState<string[] | null>(null);

  const handleOpenKeywordsModal = useCallback((data: any) => { // Use specific type for data
    setKeywordsModalData(data);
    setShowKeywordsModal(true);
  }, []);

  const handleOpenHeadingsModal = useCallback((data: any) => { // Use specific type for data
    setHeadingsModalData(data);
    setShowHeadingsModal(true);
  }, []);

  const handleOpenBrokenLinksModal = useCallback((data: any) => { // Use specific type for data
    setBrokenLinksModalData(data);
    setShowBrokenLinksModal(true);
  }, []);

  const handleOpenFixedWidthElementsModal = useCallback((data: any) => { // Use specific type for data
    setFixedWidthElementsModalData(data);
    setShowFixedWidthElementsModal(true);
  }, []);

  const handleOpenResponsivenessIssuesModal = useCallback((data: any) => { // Use specific type for data
    setResponsivenessIssuesModalData(data);
    setShowResponsivenessIssuesModal(true);
  }, []);


  useEffect(() => {
    if (!auth) return; // Ensure auth is initialized

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

        // --- API Call to Next.js API Route ---
        // Assuming your Next.js API route will be at /api/generate-report
        const response = await fetch('/api/generate-report', {
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

        // --- BEGIN: RESTRUCTURE SECTIONS FOR TABS ---
        const groupedSections: ProcessedReportData['groupedSections'] = {
          Content: [],
          Technical: [],
          'User Experience': [],
          Security: [],
          // 'Off-Page': [], // If you have data for Off-Page, uncomment
        };

        const getStatus = (value: any, isBoolean: boolean = false): 'good' | 'warning' | 'bad' => {
          if (isBoolean) return value ? 'good' : 'bad';
          if (value === 'Missing' || value === false || value === 0 || (Array.isArray(value) && value.length === 0)) return 'bad';
          return 'good';
        };

        const getReadabilityStatus = (score: number | undefined) => {
          if (score === undefined || score === null) return { text: 'N/A', status: 'bad' };
          if (score >= 90) return { text: 'Very Easy', status: 'good' };
          if (score >= 80) return { text: 'Easy', status: 'good' };
          if (score >= 70) return { text: 'Fairly Easy', status: 'good' };
          if (score >= 60) return { text: 'Standard', status: 'warning' };
          if (score >= 50) return { text: 'Fairly Difficult', status: 'warning' };
          if (score >= 30) return { text: 'Difficult', status: 'bad' };
          return { text: 'Very Difficult', status: 'bad' };
        };

        const getMobileResponsivenessDisplayStatus = (auditData: MobileResponsivenessAuditData) => {
          const { has_viewport_meta, fixed_width_elements } = auditData;
          if (has_viewport_meta && fixed_width_elements.length === 0) {
            return 'good';
          } else if (has_viewport_meta && fixed_width_elements.length > 0) {
            return 'warning';
          } else {
            return 'bad';
          }
        };

        const getMobileResponsivenessExplanation = (auditData: MobileResponsivenessAuditData) => {
          const { has_viewport_meta, viewport_content, fixed_width_elements } = auditData;
          let explanationText = '';

          if (!has_viewport_meta) {
            explanationText += 'Missing viewport meta tag. This is crucial for proper scaling on mobile devices. ';
          } else if (!viewport_content || !viewport_content.includes("width=device-width")) {
            explanationText += `Viewport meta tag found but is not correctly configured (content: "${viewport_content || 'N/A'}"). Ensure "width=device-device" is present. `;
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
        // Title Optimization
        let titleStatus = (metadataLengthAudit.title?.status?.toLowerCase() || 'bad') as 'good' | 'warning' | 'bad';
        let titleExplanation = metadataLengthAudit.title?.recommendation || 'Title tag analysis failed.';
        groupedSections.Content.push({
          id: 'title-optimization',
          title: 'Title Optimization',
          status: titleStatus,
          explanation: titleExplanation,
          metadataLengthData: metadataLengthAudit.title
        });

        // Meta Description
        let metaDescriptionStatus = (metadataLengthAudit.meta_description?.status?.toLowerCase() || 'bad') as 'good' | 'warning' | 'bad';
        let metaDescriptionExplanation = metadataLengthAudit.meta_description?.recommendation || 'Meta description analysis failed.';
        groupedSections.Content.push({
          id: 'meta-description',
          title: 'Meta Description',
          status: metaDescriptionStatus,
          explanation: metaDescriptionExplanation,
          metadataLengthData: metadataLengthAudit.meta_description
        });

        // Content Structure
        const h1Count = backendData.h1_count || 0;
        const h2Count = backendData.h2_count || 0;
        const h3Count = backendData.h3_count || 0;
        const headingOrder = backendData.heading_order || [];
        const headingIssues = backendData.heading_issues || [];
        let headingStatus: 'good' | 'warning' | 'bad' = 'good';
        if (h1Count === 0 || headingIssues.some((issue: string) => issue.startsWith('❌'))) {
          headingStatus = 'bad';
        } else if (h1Count > 1 || headingIssues.some((issue: string) => issue.startsWith('⚠️'))) {
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

        // Content Quality Analysis (including Keywords & Readability)
        const contentAnalysis: ContentAnalysisData = backendData.content_analysis || {};
        const readabilityInfo = getReadabilityStatus(contentAnalysis.flesch_reading_ease_score);
        let contentAnalysisStatus: 'good' | 'warning' | 'bad' = readabilityInfo.status as 'good' | 'warning' | 'bad';
        if (!contentAnalysis.top_keywords || contentAnalysis.top_keywords.length === 0) {
          contentAnalysisStatus = 'bad';
        } else if (contentAnalysis.keyword_suggestions && contentAnalysis.keyword_suggestions.some((s: string) => s.startsWith('❌') || s.startsWith('⚠️'))) {
          if (contentAnalysisStatus === 'good') contentAnalysisStatus = 'warning';
        }
        groupedSections.Content.push({
          id: 'content-analysis',
          title: 'Content Quality Analysis',
          status: contentAnalysisStatus,
          explanation: null, // Explanation is handled within ReportCard for this section
          contentAnalysisData: contentAnalysis, // Pass the full content analysis data
        });

        // --- Technical Group ---
        // Image Accessibility
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
        const imageStatus: 'good' | 'warning' | 'bad' = total === 0 ? 'good' : withAlt === total ? 'good' : 'warning';
        groupedSections.Technical.push({
          id: 'image-alt',
          title: 'Image Accessibility',
          status: imageStatus,
          explanation: total === 0 ? 'No images found on the page.' : withAlt === total ? `All ${total} images have alt attributes. Great job!` : `${withAlt} out of ${total} images have alt attributes. Add alt text for better accessibility and SEO.`,
        });

        // Speed Performance
        const speedAudit: SpeedAuditData = backendData.speed_audit || {};
        const speedAuditStatus: 'good' | 'warning' | 'bad' = (speedAudit.issues && speedAudit.issues.length === 0) ? 'good' : 'warning';
        groupedSections.Technical.push({
          id: 'speed-heuristics',
          title: 'Speed Performance',
          status: speedAuditStatus,
          explanation: null,
          speedAuditData: speedAudit
        });

        // Sitemap & Crawling
        const sitemap: SitemapData = backendData.sitemap || {};
        let sitemapStatus: 'good' | 'warning' | 'bad' = 'bad';
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

        // Link Profile
        const linkAudit: LinkAuditData = backendData.link_audit || {};
        const linkAuditStatus: 'good' | 'warning' | 'bad' = (linkAudit.broken_links_count === 0) ? 'good' : 'bad';
        groupedSections.Technical.push({
          id: 'link-audit',
          title: 'Link Profile',
          status: linkAuditStatus,
          explanation: null,
          linkAuditData: linkAudit
        });

        // Structured Data Schema
        const structuredDataAudit: StructuredDataAuditData = backendData.structured_data_audit || {};
        let structuredDataStatus: 'good' | 'warning' | 'bad' = 'bad';
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

        // NEW: Local SEO Audit Section
        const localSeoAudit: LocalSeoAuditData = backendData.local_seo_audit || {};
        let localSeoStatus: 'good' | 'warning' | 'bad' = localSeoAudit.status?.toLowerCase().includes('present') ? 'good' :
          localSeoAudit.status?.toLowerCase().includes('partial') ? 'warning' : 'bad';

        let localSeoExplanation = '';
        if (localSeoAudit.status === "✅ Present") {
          localSeoExplanation = "Key local SEO elements (schema, address, phone) are present.";
        } else if (localSeoAudit.status === "⚠️ Partial") {
          localSeoExplanation = "Local SEO implementation is partial. Review details for improvements.";
        } else {
          localSeoExplanation = "Local SEO essentials are missing. Consider implementing schema, physical address, and phone number.";
        }

        groupedSections.Technical.push({ // Adding to Technical group
          id: 'local-seo-audit',
          title: 'Local SEO',
          status: localSeoStatus,
          explanation: localSeoExplanation,
          localSeoAuditData: localSeoAudit // Pass the full audit data
        });


        // --- User Experience Group ---
        // Mobile Experience
        const mobileResponsivenessAudit: MobileResponsivenessAuditData = backendData.mobile_responsiveness_audit || {};
        const mobileResponsivenessStatus: 'good' | 'warning' | 'bad' = getMobileResponsivenessDisplayStatus(mobileResponsivenessAudit);
        const mobileResponsivenessExplanation: string = getMobileResponsivenessExplanation(mobileResponsivenessAudit);
        groupedSections['User Experience'].push({
          id: 'mobile-responsiveness-audit',
          title: 'Mobile Experience',
          status: mobileResponsivenessStatus,
          explanation: mobileResponsivenessExplanation,
          mobileResponsivenessData: mobileResponsivenessAudit
        });

        // Social Media Integration
        const ogTwitterAudit: OgTwitterAuditData = backendData.og_twitter_audit || {};
        let socialMetaStatus: 'good' | 'warning' | 'bad' = 'bad';
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
        // Canonical (moved here for grouping consistency)
        groupedSections.Security.push({
          id: 'canonical',
          title: 'Canonical URL',
          status: getStatus(backendData.canonical),
          explanation: backendData.canonical === 'Missing' ? 'Missing canonical URL tag. This helps prevent duplicate content issues.' : `Canonical URL found: ${backendData.canonical}`
        });

        // HTTPS
        groupedSections.Security.push({
          id: 'https',
          title: 'HTTPS Usage',
          status: getStatus(backendData.uses_https, true),
          explanation: backendData.uses_https ? 'Site is using HTTPS. Good for security and SEO.' : 'Site is not using HTTPS. This affects security and search rankings.'
        });

        // Robots.txt
        groupedSections.Security.push({
          id: 'robots',
          title: 'Robots.txt',
          status: getStatus(backendData.has_robots_txt, true),
          explanation: backendData.has_robots_txt ? 'robots.txt file found. Good for search engine crawling control.' : 'Missing or inaccessible robots.txt file.'
        });

        // Favicon
        groupedSections.Security.push({
          id: 'favicon',
          title: 'Favicon',
          status: getStatus(backendData.has_favicon, true),
          explanation: backendData.has_favicon ? 'Favicon found. Important for branding and user experience.' : 'Missing favicon.ico file.'
        });

        // --- END: RESTRUCTURE SECTIONS FOR TABS ---

        // Calculate overall score based on all sections
        const allSections = Object.values(groupedSections).flat();
        const goodCount = allSections.filter(section => section.status === 'good').length;
        const calculatedOverallScore = Math.round((goodCount / (allSections.length || 1)) * 100);

        const processedReportData: ProcessedReportData = {
          url: websiteUrl,
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          overallScore: backendData.score || calculatedOverallScore,
          groupedSections: groupedSections,
          backendData: backendData,
        };

        setReportData(processedReportData);

        // Save report to Firestore
        if (currentUser && currentUser.uid && db) {
          try {
            // Use the correct Firestore path for user-specific data in Canvas environment
            const userReportsCollectionRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/reports`);
            await addDoc(userReportsCollectionRef, {
              url: websiteUrl,
              timestamp: Timestamp.now(), // Use Firestore Timestamp
              overallScore: processedReportData.overallScore,
              summary: {
                overallScore: processedReportData.overallScore,
              },
              // Optionally save more detailed report data if needed, but be mindful of document size limits (1MB)
              // detailedReport: backendData, // Only if backendData is small enough
            });
            console.log("Report saved to Firestore successfully.");
          } catch (saveError) {
            console.error("Error saving report to Firestore:", saveError);
          }
        } else {
          console.warn("User not logged in or Firestore not initialized, report not saved to history.");
        }

      } catch (err: any) {
        console.error("Error fetching report:", err);
        setError(err.message || 'Something went wrong while fetching the report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [websiteUrl, currentUser, db, appId]); // Add db and appId to dependencies

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E'; // green-500
    if (score >= 60) return '#F97316'; // orange-500
    return '#EF4444'; // red-500
  };

  // Helper to calculate a category score based on good/total sections
  const calculateCategoryScore = (categoryName: keyof ProcessedReportData['groupedSections']) => {
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

  // New helper to get status count for badges in tabs
  const getTabStatusCounts = (tabSections: ReportSection[]) => {
    const counts = { good: 0, warning: 0, bad: 0 };
    tabSections.forEach(section => {
      counts[(section.status || 'bad')]++;
    });
    return counts;
  };


  // Only attempt to access reportData properties if reportData is not null
  const {
    url: reportUrl,
    overallScore = 0,
    groupedSections = {},
    backendData = {}
  } = reportData || {};

  // Prepare category data for rendering the breakdown bars
  const categoryBreakdownData = [
    { name: 'Overall SEO Score', id: 'overall', color: '#3b82f6' },
    { name: 'Content', id: 'Content', color: '#22C55E' },
    { name: 'Technical', id: 'Technical', color: '#22C55E' },
    { name: 'User Experience', id: 'User Experience', color: '#FACC15' },
    { name: 'Security', id: 'Security', color: '#84CC16' },
    // { name: 'Off-Page', id: 'Off-Page', color: '#A855F7' }, // Uncomment if you have Off-Page data
  ].map(category => {
    let scoreData;
    if (category.id === 'overall') {
      scoreData = { score: overallScore, max: 100, percentage: overallScore };
    } else if (category.id === 'Off-Page') {
      // Placeholder for Off-Page if no data is available from backend yet
      scoreData = { score: 0, max: 5, percentage: 0 };
    }
    else {
      scoreData = calculateCategoryScore(category.name as keyof ProcessedReportData['groupedSections']);
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
    // --- NEW ELEGANT LOADING SCREEN ---
    const brandColors = {
      primary: '#8A4AF3', // Purple from CrestNova.Sol title
      secondary: '#3B82F6', // Blue
      accent: '#C084FC' // Lighter purple
    };

    const Dot = ({ delay }: { delay: number }) => (
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
        {/* Subtle Background Pattern/Animation */}
        <motion.div
          className="absolute inset-0 z-0 opacity-10"
          initial={{ scale: 1, rotate: 0 }}
          animate={{ scale: 1.1, rotate: 5 }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear", repeatType: "mirror" as const }}
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
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-600 transform hover:-translate-y-1 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-500">
      {/* Navbar is rendered in app/layout.tsx */}

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* NEW: Premium SEO Report Card */}
        <motion.section
          className="bg-white p-6 rounded-xl shadow-lg mb-8 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header of the new card */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              CrestNova.Sol
            </h2>
            <div className="flex items-center space-x-2">
              {/* Theme toggle placeholder - This should ideally be handled globally in Navbar/Layout */}
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              {/* Refresh/Rescan button */}
              <button
                onClick={() => window.location.reload()} // Full page reload for rescan
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
            {/* Left Side: Overall Score Circular Progress */}
            <div className="md:col-span-1 flex flex-col items-center justify-center p-4">
              <div className="relative w-40 h-40">
                <Circle
                  percent={overallScore}
                  strokeWidth={8}
                  strokeColor="#3b82f6" // A distinct blue for the progress
                  trailColor="#e0e0e0" // Lighter gray for the trail
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

            {/* Right Side: Category Breakdown Bars */}
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

            {/* Spacer for 3-column layout on large screens, or empty on 2-col */}
            <div className="hidden lg:block lg:col-span-1"></div>
          </div>

          {/* Bottom Section: Tabs and Fix Critical Issues Button */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Navigation Tabs */}
            <div className="flex-grow flex justify-center sm:justify-start">
              <nav className="flex space-x-2 sm:space-x-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {tabNames.map((tab) => {
                  const counts = getTabStatusCounts(groupedSections?.[tab as keyof ProcessedReportData['groupedSections']] || []); // Type assertion
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

            {/* Fix Critical Issues Button */}
            <div className="flex-shrink-0">
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

        {/* Render individual ReportCards based on active tab */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groupedSections?.[activeTab as keyof ProcessedReportData['groupedSections']]?.map((section) => (
            <ReportCard
              key={section.id}
              title={section.title}
              status={section.status}
              explanation={section.explanation}
              // Pass data and modal handlers conditionally
              onOpenKeywordsModal={section.id === 'content-analysis' ? handleOpenKeywordsModal : undefined}
              contentAnalysisData={section.id === 'content-analysis' ? section.contentAnalysisData : undefined}
              onOpenHeadingsModal={section.id === 'heading-structure' ? handleOpenHeadingsModal : undefined}
              headingCounts={section.id === 'heading-structure' ? section.headingCounts : undefined}
              headingOrder={section.id === 'heading-structure' ? section.headingOrder : undefined}
              headingIssues={section.id === 'heading-structure' ? section.headingIssues : undefined}
              speedAuditData={section.id === 'speed-heuristics' ? section.speedAuditData : undefined}
              sitemapData={section.id === 'sitemap-validator' ? section.sitemapData : undefined}
              linkAuditData={section.id === 'link-audit' ? section.linkAuditData : undefined}
              onOpenBrokenLinksModal={section.id === 'link-audit' ? handleOpenBrokenLinksModal : undefined}
              ogTwitterData={section.id === 'social-meta-preview' ? section.ogTwitterData : undefined}
              mobileResponsivenessData={section.id === 'mobile-responsiveness-audit' ? section.mobileResponsivenessData : undefined}
              onOpenFixedWidthElementsModal={section.id === 'mobile-responsiveness-audit' ? handleOpenFixedWidthElementsModal : undefined}
              onOpenResponsivenessIssuesModal={section.id === 'mobile-responsiveness-audit' ? handleOpenResponsivenessIssuesModal : undefined}
              structuredDataAuditData={section.id === 'structured-data-schema' ? section.structuredDataAuditData : undefined}
              localSeoAuditData={section.id === 'local-seo-audit' ? section.localSeoAuditData : undefined}
              metadataLengthData={section.metadataLengthData}
              overallScore={overallScore}
            />
          ))}
        </section>
      </main>

      {/* AppModals component */}
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
        fixedWidthElementsData={fixedWidthElementsModalData}
        showResponsivenessIssuesModal={showResponsivenessIssuesModal}
        setShowResponsivenessIssuesModal={setShowResponsivenessIssuesModal}
        responsivenessIssuesData={responsivenessIssuesModalData}
      />

      {/* Footer is rendered in app/layout.tsx */}
    </div>
  );
};

export default Report;
