// app/dashboard/page.tsx
'use client'; // This component uses hooks and interacts with the DOM

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Settings, FileText, Trash2, Edit, Camera,
  Palette, Globe, RefreshCcw, Search, ExternalLink,
  Home, Info, LogIn, ChevronDown, ChevronUp, BarChart, Sun, Moon,
  DollarSign, Share2, ThumbsUp, Star, MessageSquare, Bell, MapPin, TrendingUp
} from 'lucide-react';

// Use Next.js's useRouter for navigation
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // For internal navigation where direct anchor tags aren't sufficient

// --- Firebase Configuration and AuthService ---
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth, Auth, User as FirebaseUser, onAuthStateChanged, signOut,
  updateEmail, updatePassword, signInWithCustomToken, signInAnonymously, updateProfile
} from "firebase/auth";
import {
  getFirestore, Firestore, doc, collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, setDoc, DocumentData, QuerySnapshot, Unsubscribe
} from "firebase/firestore";
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for correct type

// Define the shape of your Firebase config
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Retrieve Firebase config from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-Messaginger-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "dummy-measurement-id",
};

// Retrieve app ID from environment (for Firestore path)
const appId: string = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';

// Initialize Firebase (ensure this runs only once)
let firebaseAppInstance: FirebaseApp;
let firebaseAuthInstance: Auth;
let firestoreDbInstance: Firestore;

if (typeof window !== 'undefined' && !firebaseAppInstance) {
  // Check if window is defined to ensure it's client-side (for Firebase init)
  // Also, prevent re-initialization on hot-reload by checking a global flag or similar.
  // A common pattern is to check if an app already exists.
  try {
    firebaseAppInstance = initializeApp(firebaseConfig);
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    firestoreDbInstance = getFirestore(firebaseAppInstance);
  } catch (error) {
    // Firebase might already be initialized if hot-reloading in dev.
    // This is a common warning in development. We can safely ignore it.
    console.warn("Firebase app already initialized. Skipping re-initialization.", error);
    // If you need to access existing instances:
    // firebaseAppInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    // firebaseAuthInstance = getAuth(firebaseAppInstance);
    // firestoreDbInstance = getFirestore(firebaseAppInstance);
  }
}

// Ensure instances are available or define fallback (though this setup should prevent issues)
const auth = firebaseAuthInstance!; // Use non-null assertion as it's initialized client-side
const db = firestoreDbInstance!; // Use non-null assertion

// AuthService functions
const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Define interface for Report data
interface Report {
  id: string;
  url: string;
  overallScore: number;
  timestamp: Timestamp; // Firestore Timestamp type
  createdAt: string; // Readable string derived from timestamp
}

// Custom Modal Component
interface CustomModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        {show && ( // Only animate when `show` is true
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
            <div className="flex justify-center space-x-4">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  {cancelText}
                </button>
              )}
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  {confirmText}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// Main Dashboard Component
const Dashboard: React.FC = () => {
  const router = useRouter(); // Initialize useRouter hook for Next.js navigation
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]); // Typed reports array
  const [lastScannedUrl, setLastScannedUrl] = useState<string>('');
  const [agencyName, setAgencyName] = useState<string>('');
  const [agencyLogo, setAgencyLogo] = useState<File | null>(null); // For file object
  const [agencyLogoPreview, setAgencyLogoPreview] = useState<string | null>(null); // For image URL
  const [darkMode, setDarkMode] = useState<boolean>(false); // State for dark mode
  const [language, setLanguage] = useState<string>('en');
  const [updateEmailInput, setUpdateEmailInput] = useState<string>('');
  const [updatePasswordInput, setUpdatePasswordInput] = useState<string>('');
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [updateError, setUpdateError] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('overview'); // State to control active section

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalAction, setModalAction] = useState<(() => Promise<void> | void) | null>(null); // Function to execute on confirm
  const [modalConfirmText, setModalConfirmText] = useState<string>('Confirm');
  const [modalCancelText, setModalCancelText] = useState<string>('Cancel');

  // Quick Scan specific messages
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to open the custom modal
  const openModal = useCallback((
    title: string,
    message: string,
    action: (() => Promise<void> | void) | null = null,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): void => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action); // Store the function to be called on confirm
    setModalConfirmText(confirmText);
    setModalCancelText(cancelText);
    setShowModal(true);
  }, []); // useCallback for memoization

  // Function to close the custom modal
  const closeModal = useCallback((): void => {
    setShowModal(false);
    setModalTitle('');
    setModalMessage('');
    setModalAction(null);
    setModalConfirmText('Confirm');
    setModalCancelText('Cancel');
  }, []); // useCallback for memoization

  // Function to handle modal confirmation
  const handleModalConfirm = useCallback(async (): Promise<void> => {
    if (modalAction) {
      await modalAction(); // Await the action if it's async
    }
    closeModal();
  }, [modalAction, closeModal]); // Dependencies for useCallback

  // Effect to apply/remove 'dark' class to html element
  useEffect(() => {
    if (typeof document !== 'undefined') { // Ensure document is available
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);


  // Authentication Listener and Initial Sign-in
  useEffect(() => {
    // Only run if auth is available (i.e., client-side)
    if (!auth) return;

    const unsubscribe: Unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser(user);
        // If an initial custom token is provided by the Canvas environment, use it
        // Only attempt to sign in with custom token if the user is currently anonymous
        // This part needs specific `__initial_auth_token` if it's not a standard Firebase setup
        // If you don't have this, you might remove this block.
        // const initialAuthToken = typeof window !== 'undefined' && typeof (window as any).__initial_auth_token !== 'undefined' ? (window as any).__initial_auth_token : null;
        // if (initialAuthToken && user.isAnonymous) {
        //   try {
        //     await signInWithCustomToken(auth, initialAuthToken);
        //     console.log("Signed in with custom token.");
        //   } catch (error) {
        //     console.error("Error signing in with custom token:", error);
        //     await signInAnonymously(auth);
        //     console.log("Signed in anonymously as fallback.");
        //   }
        // }
      } else {
        setCurrentUser(null);
        // If no user, sign in anonymously for basic app functionality
        try {
          await signInAnonymously(auth);
          console.log("Signed in anonymously.");
        } catch (error) {
          console.error("Error signing in anonymously:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);


  // Fetch Reports History using onSnapshot for real-time updates
  useEffect(() => {
    let unsubscribe: Unsubscribe = () => { }; // Initialize with a no-op function

    if (currentUser && currentUser.uid && db) { // Ensure db is also available
      // Use the correct Firestore path for user-specific data in Canvas environment
      const userReportsRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/reports`);
      const q = query(userReportsRef, orderBy('timestamp', 'desc'));

      unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        const reportsData: Report[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Report, 'id' | 'createdAt'>, // Type assertion for doc.data()
          // Convert Firestore Timestamp object to a readable string
          createdAt: doc.data().timestamp ? (doc.data().timestamp as Timestamp).toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'
        }));
        setReports(reportsData);
        if (reportsData.length > 0) {
          setLastScannedUrl(reportsData[0].url); // Set last scanned URL from history
        }
      }, (error) => {
        console.error("Error fetching reports:", error);
        // Optionally show an error message to the user
      });
    }
    return () => unsubscribe(); // Clean up the listener on unmount or currentUser change
  }, [currentUser, db, appId]); // Re-run when currentUser or db changes

  // Handle Logout
  const handleLogout = useCallback(async (): Promise<void> => {
    openModal(
      'Confirm Logout',
      'Are you sure you want to log out?',
      async () => {
        try {
          await logoutUser();
          console.log('User logged out successfully');
          router.push('/login'); // Redirect to login page after logout
        } catch (error: any) { // Type 'any' for error for flexibility, but can be more specific
          console.error('Error logging out:', error);
          openModal('Logout Failed', `There was an error logging out: ${error.message}`, null, 'OK');
        }
      },
      'Logout',
      'Cancel'
    );
  }, [openModal, router]); // Dependencies for useCallback

  // Handle Quick Scan (now navigates to Report page)
  const handleQuickScan = useCallback((): void => {
    setScanMessage('');
    setScanError('');
    if (!lastScannedUrl) {
      setScanError("Please enter a URL to scan.");
      return;
    }
    // Navigate to the report page, passing the URL as state
    router.push(`/report?url=${encodeURIComponent(lastScannedUrl)}`); // Pass via query param
    // Optionally, clear the input field after navigation
    setLastScannedUrl('');
  }, [lastScannedUrl, router]);


  // Handle Delete Report
  const handleDeleteReport = useCallback(async (reportId: string): Promise<void> => {
    if (!currentUser || !currentUser.uid) {
      openModal('Authentication Required', 'Please log in to delete reports.', null, 'OK');
      return;
    }

    openModal(
      'Confirm Deletion',
      'Are you sure you want to delete this report from your history?',
      async () => {
        try {
          // Directly use deleteDoc with the correct Firestore path
          const reportDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/reports`, reportId);
          await deleteDoc(reportDocRef);
          openModal('Success', 'Report deleted successfully!', null, 'OK');
        } catch (error: any) {
          console.error("Error deleting report:", error);
          openModal('Deletion Failed', `Failed to delete report: ${error.message}`, null, 'OK');
        }
      },
      'Delete',
      'Cancel'
    );
  }, [currentUser, db, appId, openModal]); // Dependencies for useCallback

  // Handle Logo Upload Preview (for agency branding)
  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]; // Use optional chaining
    if (file) {
      setAgencyLogo(file);
      setAgencyLogoPreview(URL.createObjectURL(file));
    } else {
      setAgencyLogo(null);
      setAgencyLogoPreview(null);
    }
  }, []); // useCallback for memoization

  // Handle Profile Picture Update
  const handleProfilePicChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // In a real application, you would upload this file to Firebase Storage
        // and then get the download URL to update the user's photoURL.
        // For this Canvas environment, we'll just set a local preview and
        // show a message about the limitation.
        try {
          // We are intentionally NOT calling updateProfile here with reader.result
          // because it causes the "Photo URL too long" error in this environment.
          // In a real app, you'd upload to Firebase Storage and get a public URL.

          // For now, just update the local state to show the preview
          setCurrentUser({ ...currentUser, photoURL: reader.result as string }); // Type assertion for reader.result
          openModal(
            'Profile Picture Update',
            'Profile picture updated locally for preview. For persistent storage, a cloud storage solution (like Firebase Storage) is required to get a short public URL.',
            null,
            'OK'
          );
        } catch (error: any) {
          console.error("Error processing profile picture:", error);
          openModal('Update Failed', `Failed to process profile picture: ${error.message}`, null, 'OK');
        }
      };
      reader.readAsDataURL(file);
    } else if (!currentUser) {
      openModal('Authentication Required', 'Please log in to update your profile picture.', null, 'OK');
    }
  }, [currentUser, openModal]); // Dependencies for useCallback

  // Trigger the hidden file input click
  const triggerFileInput = useCallback((): void => {
    fileInputRef.current?.click(); // Use optional chaining
  }, []); // useCallback for memoization


  // Handle Update Email/Password
  const handleUpdateAuth = useCallback(async (type: 'email' | 'password'): Promise<void> => {
    setUpdateMessage('');
    setUpdateError('');
    if (!currentUser) {
      setUpdateError("You must be logged in to update your profile.");
      return;
    }

    try {
      if (type === 'email' && updateEmailInput) {
        await updateEmail(currentUser, updateEmailInput);
        setUpdateMessage("Email updated successfully! Please re-login.");
        setUpdateEmailInput('');
        // Force re-login after email update for security
        await logoutUser();
        router.push('/login');
      } else if (type === 'password' && updatePasswordInput) {
        await updatePassword(currentUser, updatePasswordInput);
        setUpdateMessage("Password updated successfully!");
        setUpdatePasswordInput('');
      } else {
        setUpdateError("Please provide input for the update.");
      }
    } catch (error: any) {
      console.error("Error updating auth:", error);
      let msg = "Failed to update. Please re-login if you haven't recently.";
      if (error.code === 'auth/requires-recent-login') {
        msg = "For security, please re-login to update your email/password.";
      } else if (error.code === 'auth/invalid-email') {
        msg = "Invalid email format.";
      } else if (error.code === 'auth/weak-password') {
        msg = "Password is too weak (min 6 characters).";
      }
      setUpdateError(msg);
    }
  }, [currentUser, updateEmailInput, updatePasswordInput, router]); // Dependencies for useCallback


  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // Sidebar navigation items
  // Note: For 'Home', we'll use Link from 'next/link'
  const navItems = [
    { name: 'Home', icon: Home, section: 'home', isLink: true }, // Added Home to sidebar
    { name: 'Overview', icon: BarChart, section: 'overview', isLink: false },
    { name: 'Reports', icon: FileText, section: 'reports', isLink: false },
    { name: 'Quick Scan', icon: Search, section: 'quick-scan', isLink: false },
    { name: 'Branding', icon: Palette, section: 'branding', isLink: false },
    { name: 'Settings', icon: Settings, section: 'settings', isLink: false },
  ];

  // Get the most recent report's score for "Overall Health"
  const mostRecentScore: number = reports.length > 0 ? (reports[0].overallScore || 0) : 0;

  // Define radius for the circle
  const circleRadius: number = 40;
  const circumference: number = 2 * Math.PI * circleRadius;


  // These percentages are for the overall health legend, not the single score circle
  const goodPercentage: number = reports.length > 0 ? (reports.filter(r => r.overallScore >= 80).length / reports.length) * 100 : 0;
  const warningPercentage: number = reports.length > 0 ? (reports.filter(r => r.overallScore >= 60 && r.overallScore < 80).length / reports.length) * 100 : 0;
  const badPercentage: number = reports.length > 0 ? (reports.filter(r => r.overallScore < 60).length / reports.length) * 100 : 0;


  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-500">
      {/* Custom Modal */}
      <CustomModal
        show={showModal}
        title={modalTitle}
        message={modalMessage}
        onConfirm={modalAction ? handleModalConfirm : undefined} // Pass undefined if no action to hide button
        onCancel={modalAction ? closeModal : undefined} // Only show cancel if there's an action
        confirmText={modalConfirmText}
        cancelText={modalCancelText}
      />

      {/* Left Sidebar */}
      <motion.div
        className="w-64 bg-blue-900 dark:bg-gray-950 text-white flex flex-col p-6 shadow-lg relative z-20"
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* User Profile in Sidebar */}
        <div className="flex flex-col items-center mb-10 mt-4">
          <div className="relative w-30 h-30 rounded-full bg-blue-700 dark:bg-gray-700 flex items-center justify-center mb-3 border-4 border-blue-500 dark:border-gray-600 overflow-hidden">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-14 h-14 text-blue-200 dark:text-gray-300" />
            )}
            <motion.button
              onClick={triggerFileInput}
              className="absolute bottom-3 right-3 bg-blue-500 p-1 rounded-full border-2 border-white dark:border-gray-800 shadow-md hover:bg-blue-600 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Update Profile Picture"
            >
              <Camera className="w-4 h-4 text-white" />
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <h3 className="text-xl font-bold text-white text-center">
            {currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Guest')) : 'Guest'}
          </h3>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-grow">
          <ul>
            {navItems.map((item) => (
              <motion.li
                key={item.section}
                className="mb-3"
                whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                {item.isLink ? ( // Use Next.js Link for internal routes
                  <Link
                    href={item.section === 'home' ? '/' : `/${item.section}`} // Direct path for 'home' to root, others to section name
                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                      activeSection === item.section ? 'bg-blue-700 dark:bg-indigo-700 text-white shadow-md' : 'text-blue-100 hover:text-white'
                    }`}
                    onClick={() => setActiveSection(item.section)} // Keep active section updated for highlighting
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                ) : ( // For internal anchor links within the same page
                  <a
                    href={`#${item.section}`} // Still use anchor for same-page section navigation
                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                      activeSection === item.section ? 'bg-blue-700 dark:bg-indigo-700 text-white shadow-md' : 'text-blue-100 hover:text-white'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSection(item.section);
                      // Scroll to top of main content area, or specific section if needed
                      document.querySelector('main.flex-1.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                )}
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Logout Button in Sidebar */}
        <motion.button
          onClick={handleLogout}
          className="w-full bg-blue-700 dark:bg-gray-700 text-white py-2.5 px-4 rounded-lg hover:bg-blue-800 dark:hover:bg-gray-600 transition duration-300 flex items-center justify-center shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </motion.button>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* The global Navbar in app/layout.tsx will cover this.
            If you need a dashboard-specific smaller header, you can add it here.
            But typically, the main Navbar is not repeated inside pages.
        */}

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-gray-900 transition-colors duration-500 custom-scrollbar">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-8">
            Welcome, {currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Guest')) : 'Guest'}!
          </h1>

          {/* Conditional Rendering of Sections */}
          <AnimatePresence mode="wait"> {/* Use AnimatePresence for section transitions */}
            {activeSection === 'overview' && (
              <motion.div
                key="overview-section"
                initial="hidden"
                animate="visible"
                exit="hidden" // Add exit animation
                variants={sectionVariants}
              >
                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <motion.div
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex items-center justify-between border border-gray-200 dark:border-gray-700"
                    variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
                  >
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{reports.length}</h3>
                    </div>
                    <FileText className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                  </motion.div>
                  <motion.div
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md flex flex-col justify-between border border-gray-200 dark:border-gray-700"
                    variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}
                  >
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Scan URL</p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-all">{lastScannedUrl || 'N/A'}</h3>
                    </div>
                    <Search className="w-10 h-10 text-green-500 dark:text-green-400 self-end mt-2" />
                  </motion.div>
                </div>

                {/* Overall Health Chart */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <motion.section
                    className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700"
                    variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.6 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Overall Health</h2>
                    <div className="relative w-48 h-48 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle cx="50" cy="50" r={circleRadius} fill="transparent" stroke="#e0e0e0" strokeWidth="10" className="dark:stroke-gray-600" />
                        {/* Score segment (based on mostRecentScore) */}
                        <motion.circle
                          cx="50" cy="50" r={circleRadius} fill="transparent" stroke={
                            mostRecentScore >= 80 ? '#10B981' : // green
                              mostRecentScore >= 60 ? '#F59E0B' : // orange
                                '#EF4444' // red
                          } strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={circumference - (circumference * mostRecentScore) / 100}
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset: circumference - (circumference * mostRecentScore) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <span className="absolute text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {mostRecentScore}<span className="text-xl text-gray-600 dark:text-gray-400">/100</span>
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-4">Score of Most Recent Scan</p>
                    <div className="flex justify-center text-sm text-gray-600 dark:text-gray-300 mt-2 space-x-4">
                      <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span> Good: {goodPercentage.toFixed(0)}%</span>
                      <span><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1"></span> Warn: {warningPercentage.toFixed(0)}%</span>
                      <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span> Bad: {badPercentage.toFixed(0)}%</span>
                    </div>
                  </motion.section>
                </div>
              </motion.div>
            )}

            {/* Quick SEO Scan Section */}
            {activeSection === 'quick-scan' && (
              <motion.section
                key="quick-scan-section"
                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl flex flex-col items-center text-center border border-gray-200 dark:border-gray-700"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Search className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mr-3" /> Perform a Quick SEO Scan
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
                  Enter a website URL below to generate an instant SEO report.
                </p>
                <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={lastScannedUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setLastScannedUrl(e.target.value);
                      setScanError('');
                      setScanMessage('');
                    }}
                    className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button
                    onClick={handleQuickScan}
                    className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center justify-center font-semibold shadow-md dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    <RefreshCcw className="w-5 h-5 mr-2" /> Scan Now
                  </button>
                </div>
                {scanError && <p className="text-red-500 text-sm mt-2">{scanError}</p>}
                {scanMessage && <p className="text-green-500 text-sm mt-2">{scanMessage}</p>}
                {lastScannedUrl && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Last scanned: <span className="font-semibold">{lastScannedUrl}</span></p>
                )}
              </motion.section>
            )}

            {/* SEO Reports History Section */}
            {activeSection === 'reports' && (
              <motion.section
                key="reports-section"
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FileText className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" /> SEO Reports History
                </h2>
                {reports.length > 0 ? (
                  <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            URL
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Score
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {reports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {report.createdAt}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {/* Using a normal anchor tag for external links, Next.js Link for internal */}
                              <a href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                {report.url} <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                report.overallScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  report.overallScore >= 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {report.overallScore ? `${report.overallScore}/100` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => { router.push(`/report?url=${encodeURIComponent(report.url)}`); }} // Pass URL as query param
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No reports generated yet. Use the "Quick SEO Scan" section to get started!</p>
                )}
              </motion.section>
            )}

            {/* Custom Branding Section */}
            {activeSection === 'branding' && (
              <motion.section
                key="branding-section"
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Palette className="w-6 h-6 text-indigo-500 dark:text-indigo-400 mr-2" /> Custom Branding
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Customize your reports with your agency's branding.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agency Name</label>
                    <input
                      type="text"
                      id="agencyName"
                      value={agencyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgencyName(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="Your Agency Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="agencyLogo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agency Logo</label>
                    <input
                      type="file"
                      id="agencyLogo"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
                    />
                  </div>
                  {agencyLogoPreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo Preview:</p>
                      <img src={agencyLogoPreview} alt="Agency Logo Preview" className="max-w-[150px] h-auto rounded-md shadow-md" />
                    </div>
                  )}
                </div>
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">White-Label Report Preview:</p>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm border border-gray-200 dark:border-gray-600">
                    {agencyLogoPreview && <img src={agencyLogoPreview} alt="Branded Logo" className="h-8 mb-2" />}
                    <p className="text-lg font-bold text-gray-900 dark:text-text-gray-100">{agencyName || 'Your Agency Name'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SEO Report powered by CrestNova.Sol</p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
              <motion.section
                key="settings-section"
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col border border-gray-200 dark:border-gray-700"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Settings className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" /> Settings
                </h2>
                <div className="space-y-4">
                  {/* Dark Mode Toggle - Removed as it's now handled by the global Navbar component */}
                  {/* Your Navbar component already includes a theme toggle.
                      It's best practice to centralize theme management in a global context or the top-level layout.
                      If you uncomment this, ensure it's integrated with a global theme state/context.
                  */}
                  {/* <div>
                    <label htmlFor="darkModeToggle" className="flex items-center cursor-pointer">
                      <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="darkModeToggle"
                          className="sr-only"
                          checked={darkMode}
                          onChange={() => setDarkMode(!darkMode)}
                        />
                        <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform"
                          style={{ transform: darkMode ? 'translateX(100%)' : 'translateX(0)' }}
                        ></div>
                      </div>
                    </label>
                  </div> */}

                  <div>
                    <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                    <select
                      id="languageSelect"
                      value={language}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
                      className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish (Dummy)</option>
                      <option value="fr">French (Dummy)</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Account Security</h3>
                    {updateMessage && <p className="text-green-600 dark:text-green-400 text-sm mb-2">{updateMessage}</p>}
                    {updateError && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{updateError}</p>}

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="updateEmail" className="sr-only">New Email</label>
                        <input
                          type="email"
                          id="updateEmail"
                          value={updateEmailInput}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdateEmailInput(e.target.value)}
                          className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="New Email"
                        />
                        <button
                          onClick={() => handleUpdateAuth('email')}
                          className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 text-sm dark:bg-blue-600 dark:hover:bg-blue-700"
                          disabled={!currentUser}
                        >
                          Update Email
                        </button>
                      </div>
                      <div>
                        <label htmlFor="updatePassword" className="sr-only">New Password</label>
                        <input
                          type="password"
                          id="updatePassword"
                          value={updatePasswordInput}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpdatePasswordInput(e.target.value)}
                          className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="New Password"
                        />
                        <button
                          onClick={() => handleUpdateAuth('password')}
                          className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 text-sm dark:bg-blue-600 dark:hover:bg-blue-700"
                          disabled={!currentUser}
                        >
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;