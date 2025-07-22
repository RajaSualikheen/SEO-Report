import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Navbar from '../components/navbar'; // Ensure this path is correct
import Footer from '../components/footer'; // Ensure this path is correct
import { useLocation, useNavigate } from 'react-router-dom';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the save function from your firebaseService
import { saveReportToFirestore } from '../firebase/firebaseService'; // Adjust the path as necessary

// Global variables provided by Canvas environment (if available)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyCiYeMcuPhdQDop6Umt2K10ulyAEhbN108", // Dummy API Key
  authDomain: "seoanalyzerauth.firebaseapp.com",
  projectId: "seoanalyzerauth",
  storageBucket: "seoanalyzerauth.firebasestorage.app",
  messagingSenderId: "512042912695",
  appId: "1:512042912695:web:54fce8a18bdcec2ff73632",
  measurementId: "G-6W2LCZKH66"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase (only once)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Get Firestore instance

const ReportCard = ({ title, status, explanation }) => {
  let statusIcon, statusColorClass, statusText;

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
      <p className="text-gray-600 dark:text-gray-300 flex-grow mb-6">{explanation}</p>
    </motion.div>
  );
};

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const websiteUrl = location.state?.websiteUrl; // Get URL from navigation state

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // State to hold current authenticated user

  // Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // If there's an initial auth token, sign in with it (for Canvas environment)
        // This part is typically handled by the Canvas environment for initial auth,
        // but including it for robustness if not already signed in.
        // For general Firebase, you'd just set the user.
      } else {
        setCurrentUser(null);
        // Optionally redirect to login if not authenticated and trying to view reports
        // navigate('/login');
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

        // Process backend data to frontend format
        const sections = [];
        let goodCount = 0;

        // Helper function to determine status based on content
        const getStatus = (value, isBoolean = false) => {
          if (isBoolean) {
            return value ? 'good' : 'bad';
          }
          if (value === 'Missing' || value === 'No <h1> tags found') {
            return 'bad';
          }
          if (value === false || value === 0) {
            return 'bad';
          }
          if (Array.isArray(value) && value.length === 0) {
            return 'bad';
          }
          return 'good';
        };

        // Title Tag
        sections.push({
          id: 'title-tag',
          title: 'Title Tag',
          status: getStatus(backendData.title_tag),
          explanation: backendData.title_tag === 'Missing'
            ? 'Missing title tag. This is important for SEO and user experience.'
            : `Title tag found: "${backendData.title_tag}"`
        });

        // Meta Description
        sections.push({
          id: 'meta-description',
          title: 'Meta Description',
          status: getStatus(backendData.meta_description),
          explanation: backendData.meta_description === 'Missing'
            ? 'Missing meta description. This affects click-through rates from search results.'
            : `Meta description found: "${backendData.meta_description}"`
        });

        // H1 Tags
        const h1Tags = Array.isArray(backendData.h1_tags) ? backendData.h1_tags : [];
        sections.push({
          id: 'h1-tags',
          title: 'H1 Tags',
          status: h1Tags.length === 1 ? 'good' : 'warning',
          explanation: h1Tags.length === 0
            ? 'No H1 tags found. This is important for SEO and page structure.'
            : h1Tags.length === 1
              ? 'Perfect! Found exactly one H1 tag.'
              : `Found ${h1Tags.length} H1 tags. Ideally, there should be only one.`
        });

        // Image Alt Tags
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
          explanation: total === 0
            ? 'No images found on the page.'
            : withAlt === total
              ? `All ${total} images have alt attributes. Great job!`
              : `${withAlt} out of ${total} images have alt attributes. Add alt text for better accessibility and SEO.`
        });

        // Canonical URL
        sections.push({
          id: 'canonical',
          title: 'Canonical URL',
          status: getStatus(backendData.canonical),
          explanation: backendData.canonical === 'Missing'
            ? 'Missing canonical URL tag. This helps prevent duplicate content issues.'
            : `Canonical URL found: ${backendData.canonical}`
        });

        // Mobile Responsiveness
        sections.push({
          id: 'responsive',
          title: 'Mobile Responsive',
          status: backendData.responsive ? 'good' : 'bad',
          explanation: backendData.responsive
            ? 'Page has proper viewport meta tag for mobile devices.'
            : 'Missing or incomplete viewport meta tag. This affects mobile user experience.'
        });

        // HTTPS
        sections.push({
          id: 'https',
          title: 'HTTPS Security',
          status: backendData.uses_https ? 'good' : 'bad',
          explanation: backendData.uses_https
            ? 'Site is using HTTPS. Good for security and SEO.'
            : 'Site is not using HTTPS. This affects security and search rankings.'
        });

        // Robots.txt
        sections.push({
          id: 'robots',
          title: 'Robots.txt',
          status: backendData.has_robots_txt ? 'good' : 'warning',
          explanation: backendData.has_robots_txt
            ? 'robots.txt file found. Good for search engine crawling control.'
            : 'Missing or inaccessible robots.txt file.'
        });

        // Favicon
        sections.push({
          id: 'favicon',
          title: 'Favicon',
          status: backendData.has_favicon ? 'good' : 'warning',
          explanation: backendData.has_favicon
            ? 'Favicon found. Important for branding and user experience.'
            : 'Missing favicon.ico file.'
        });

        // Count good statuses for score calculation
        goodCount = sections.filter(section => section.status === 'good').length;

        const processedReportData = {
          url: websiteUrl,
          timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          overallScore: backendData.score || Math.round((goodCount / sections.length) * 100),
          sections: sections,
          // You might want to store the raw backendData too if you need it for full historical view
          // rawBackendData: backendData
        };

        setReportData(processedReportData);

        // Save report to Firestore if user is logged in
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

    // Only fetch report if currentUser is available (or if not strictly needed for auth, then remove currentUser check)
    // For now, fetch immediately and save if currentUser becomes available later.
    // Or, if report saving is critical, you might wait for currentUser:
    // if (currentUser) { fetchReport(); } else { /* handle not logged in state for saving */ }
    fetchReport();
  }, [websiteUrl, currentUser]); // Re-run effect if websiteUrl or currentUser changes

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

  const { url, timestamp, overallScore, sections = [] } = reportData;
  const scoreBarWidth = `${overallScore}%`;
  const scoreColorClass = getScoreColorClass(overallScore);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-500">
      <Navbar />

      <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
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

        {/* Score Chart */}
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

        {/* Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section) => (
            <ReportCard
              key={section.id}
              title={section.title}
              status={section.status}
              explanation={section.explanation}
            />
          ))}
        </section>

        {/* Actions */}
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
            onClick={() => navigate('/')} // Assuming "Fix Issues" navigates back to home or a specific fix page
            className="bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-blue-600 transform hover:-translate-y-1 transition dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Fix Issues
          </button>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default Report;
