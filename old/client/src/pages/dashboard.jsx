// D:\My-Web\seo-report-generator\old\client\src\pages\dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LogOut, Settings, FileText, Trash2, Edit, Camera,
    Palette, Globe, RefreshCcw, Search, ExternalLink,
    Home, Info, LogIn, ChevronDown, ChevronUp, BarChart, Sun, Moon,
    DollarSign, Share2, ThumbsUp, Star, MessageSquare, Bell, MapPin, TrendingUp,Menu, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Start of Firebase Configuration and AuthService ---
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, updateEmail, updatePassword, signInWithCustomToken, signInAnonymously, updateProfile } from "firebase/auth";
import {
    getFirestore, doc, collection, query, orderBy, onSnapshot,
    addDoc, deleteDoc, setDoc
} from "firebase/firestore";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// AuthService functions
const logoutUser = async () => {
    await signOut(auth);
};

// --- End of Firebase Configuration and AuthService ---

// Custom Modal Component (replaces alert/confirm)
const CustomModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        </div>
    );
};


// Reusable Navbar component - Keep this outside the Dashboard component
const Navbar = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const navVariants = {
        hidden: { y: -100, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
    };

    const linkVariants = {
        hover: { scale: 1.05, color: '#DBEAFE', transition: { duration: 0.2 } },
        tap: { scale: 0.95 },
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <motion.nav
            className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 shadow-lg dark:from-gray-900 dark:to-gray-950"
            variants={navVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="container mx-auto flex justify-between items-center">
                <motion.div
                    className="text-white text-2xl font-bold tracking-wide cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    onClick={() => window.location.href = '/'}
                >
                    CrestNova.Sol
                </motion.div>
                <div className="flex items-center space-x-6">
                    <motion.a
                        onClick={() => window.location.href = '/'}
                        className="text-white flex items-center cursor-pointer"
                        variants={linkVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Home className="w-5 h-5 mr-1" /> Home
                    </motion.a>
                    <motion.a
                        onClick={() => window.location.href = '/about'}
                        className="text-white flex items-center cursor-pointer"
                        variants={linkVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <Info className="w-5 h-5 mr-1" /> About
                    </motion.a>
                    {user ? (
                        <div className="relative">
                            <motion.button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center text-white p-2 rounded-full hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <User className="w-6 h-6" />
                                {showDropdown ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                            </motion.button>
                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-600"
                                    >
                                        <a
                                            onClick={() => { window.location.href = '/profile'; setShowDropdown(false); }}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                        >
                                            <User className="w-4 h-4 mr-2" /> Profile
                                        </a>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.button
                            onClick={() => window.location.href = '/login'}
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center hover:from-blue-700 hover:to-indigo-800 shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5"
                            variants={linkVariants}
                            whileHover="hover"
                            whileTap="tap"
                        >
                            <LogIn className="w-5 h-5 mr-1" /> Login
                        </motion.button>
                    )}
                </div>
                <div className="md:hidden flex items-center space-x-2">
                    <button onClick={toggleMenu} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                        {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                    </button>
                </div>
            </div>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -50, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -50, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-4 shadow-xl"
                >
                    <div className="px-2 pt-2 pb-3 space-y-2">
                        {[
                            { name: "Home", path: "/" },
                            { name: "Features", path: "/features" },
                            { name: "Pricing", path: "/pricing" },
                            { name: "Contact", path: "/contact" },
                        ].map((item) => (
                            <RouterLink
                                key={item.name}
                                to={item.path}
                                className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </RouterLink>
                        ))}
                        <hr className="border-gray-200 dark:border-gray-700 my-2" />
                        <RouterLink
                            to="/login"
                            className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            onClick={() => setIsOpen(false)}
                        >
                            Login
                        </RouterLink>
                        <RouterLink
                            to="/signup"
                            className="block px-4 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center shadow-md mt-2"
                            onClick={() => setIsOpen(false)}
                        >
                            Sign Up
                        </RouterLink>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
};


// Main Dashboard Component
const Dashboard = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook
    const [currentUser, setCurrentUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [lastScannedUrl, setLastScannedUrl] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [agencyLogo, setAgencyLogo] = useState(null); // For file object
    const [agencyLogoPreview, setAgencyLogoPreview] = useState(null); // For image URL
    const [darkMode, setDarkMode] = useState(false); // State for dark mode
    const [language, setLanguage] = useState('en');
    const [updateEmailInput, setUpdateEmailInput] = useState('');
    const [updatePasswordInput, setUpdatePasswordInput] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [activeSection, setActiveSection] = useState('overview'); // State to control active section

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalAction, setModalAction] = useState(null); // Function to execute on confirm
    const [modalConfirmText, setModalConfirmText] = useState('Confirm');
    const [modalCancelText, setModalCancelText] = useState('Cancel');

    // Quick Scan specific messages
    const [scanMessage, setScanMessage] = useState('');
    const [scanError, setScanError] = useState('');

    // Ref for the hidden file input
    const fileInputRef = useRef(null);

    // NEW: Helper function to save branding data to localStorage
    const saveBrandingToLocalStorage = (name, logoUrl) => {
        try {
            localStorage.setItem('agencyName', name);
            localStorage.setItem('agencyLogoPreview', logoUrl || '');
            console.log("Branding saved to localStorage:", { name, logoUrl });
        } catch (error) {
            console.error("Error saving branding to local storage:", error);
        }
    };

    // Function to open the custom modal
    const openModal = (title, message, action = null, confirmText = 'Confirm', cancelText = 'Cancel') => {
        setModalTitle(title);
        setModalMessage(message);
        setModalAction(() => action); // Store the function to be called on confirm
        setModalConfirmText(confirmText);
        setModalCancelText(cancelText);
        setShowModal(true);
    };

    // Function to close the custom modal
    const closeModal = () => {
        setShowModal(false);
        setModalTitle('');
        setModalMessage('');
        setModalAction(null);
        setModalConfirmText('Confirm');
        setModalCancelText('Cancel');
    };

    // Function to handle modal confirmation
    const handleModalConfirm = () => {
        if (modalAction) {
            modalAction();
        }
        closeModal();
    };

    // Effect to apply/remove 'dark' class to html element
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);


    // Authentication Listener and Initial Sign-in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // If an initial custom token is provided by the Canvas environment, use it
                // Only attempt to sign in with custom token if the user is currently anonymous
                if (initialAuthToken && user.isAnonymous) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log("Signed in with custom token.");
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        // Fallback to anonymous if custom token fails (e.g., expired)
                        await signInAnonymously(auth);
                        console.log("Signed in anonymously as fallback.");
                    }
                }
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
    }, []); // Empty dependency array means this effect runs only once on mount


    // Fetch Reports History using onSnapshot for real-time updates
    useEffect(() => {
        let unsubscribe = () => {}; // Initialize with a no-op function

        if (currentUser && currentUser.uid) {
            // Use the correct Firestore path for user-specific data in Canvas environment
            const userReportsRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/reports`);
            const q = query(userReportsRef, orderBy('timestamp', 'desc')); // Use 'timestamp' as defined in saveReportToFirestore

            unsubscribe = onSnapshot(q, (snapshot) => {
                const reportsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore Timestamp object to a readable string
                    createdAt: doc.data().timestamp ? doc.data().timestamp.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'
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
    }, [currentUser]); // Re-run when currentUser changes
    
    // NEW: Effect to load branding data from localStorage on mount
    useEffect(() => {
        const storedName = localStorage.getItem('agencyName');
        const storedLogo = localStorage.getItem('agencyLogoPreview');
        if (storedName) setAgencyName(storedName);
        if (storedLogo) setAgencyLogoPreview(storedLogo);
    }, []); // Empty dependency array ensures this runs only once on mount

    // Handle Logout
    const handleLogout = async () => {
        openModal(
            'Confirm Logout',
            'Are you sure you want to log out?',
            async () => {
                try {
                    await logoutUser();
                    console.log('User logged out successfully');
                    navigate('/login'); // Redirect to login page after logout
                } catch (error) {
                    console.error('Error logging out:', error);
                    openModal('Logout Failed', `There was an error logging out: ${error.message}`, null, 'OK');
                }
            },
            'Logout',
            'Cancel'
        );
    };

    // Handle Quick Scan (now navigates to Report page)
    const handleQuickScan = () => {
        setScanMessage('');
        setScanError('');
        if (!lastScannedUrl) {
            setScanError("Please enter a URL to scan.");
            return;
        }
        // Navigate to the report page, passing the URL as state
        navigate('/report', { state: { websiteUrl: lastScannedUrl } });
        // Optionally, clear the input field after navigation
        setLastScannedUrl('');
    };

    // Handle Delete Report
    const handleDeleteReport = async (reportId) => {
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
                } catch (error) {
                    console.error("Error deleting report:", error);
                    openModal('Deletion Failed', `Failed to delete report: ${error.message}`, null, 'OK');
                }
            },
            'Delete',
            'Cancel'
        );
    };

    // Handle Logo Upload Preview (for agency branding)
    const handleLogoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAgencyLogo(file);
            const logoUrl = URL.createObjectURL(file);
            setAgencyLogoPreview(logoUrl);
            // NEW: Save logo preview URL to localStorage
            saveBrandingToLocalStorage(agencyName, logoUrl);
        } else {
            setAgencyLogo(null);
            setAgencyLogoPreview(null);
            // NEW: Clear logo from localStorage
            saveBrandingToLocalStorage(agencyName, '');
        }
    };

    // Handle Profile Picture Update
    const handleProfilePicChange = async (event) => {
        const file = event.target.files[0];
        if (file && currentUser) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                // For now, just update the local state to show the preview
                setCurrentUser({ ...currentUser, photoURL: reader.result });
                openModal(
                    'Profile Picture Update',
                    'Profile picture updated locally for preview. For persistent storage, a cloud storage solution (like Firebase Storage) is required to get a short public URL.',
                    null,
                    'OK'
                );
            };
            reader.readAsDataURL(file);
        } else if (!currentUser) {
            openModal('Authentication Required', 'Please log in to update your profile picture.', null, 'OK');
        }
    };

    // Trigger the hidden file input click
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };


    // Handle Update Email/Password
    const handleUpdateAuth = async (type) => {
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
                navigate('/login');
            } else if (type === 'password' && updatePasswordInput) {
                await updatePassword(currentUser, updatePasswordInput);
                setUpdateMessage("Password updated successfully!");
                setUpdatePasswordInput('');
            } else {
                setUpdateError("Please provide input for the update.");
            }
        } catch (error) {
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
    };


    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    // Sidebar navigation items
    const navItems = [
        { name: 'Home', icon: Home, section: 'home' }, // Added Home to sidebar
        { name: 'Overview', icon: BarChart, section: 'overview' },
        { name: 'Reports', icon: FileText, section: 'reports' },
        { name: 'Quick Scan', icon: Search, section: 'quick-scan' },
        { name: 'Branding', icon: Palette, section: 'branding' },
        { name: 'Settings', icon: Settings, section: 'settings' },
    ];

    // Get the most recent report's score for "Overall Health"
    const mostRecentScore = reports.length > 0 ? (reports[0].overallScore || 0) : 0;

    // Define radius for the circle
    const circleRadius = 40;
    const circumference = 2 * Math.PI * circleRadius;


    // These percentages are for the overall health legend, not the single score circle
    const goodPercentage = reports.length > 0 ? (reports.filter(r => r.overallScore >= 80).length / reports.length) * 100 : 0;
    const warningPercentage = reports.length > 0 ? (reports.filter(r => r.overallScore >= 60 && r.overallScore < 80).length / reports.length) * 100 : 0;
    const badPercentage = reports.length > 0 ? (reports.filter(r => r.overallScore < 60).length / reports.length) * 100 : 0;


    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans transition-colors duration-500">
            {/* Custom Modal */}
            <CustomModal
                show={showModal}
                title={modalTitle}
                message={modalMessage}
                onConfirm={modalAction ? handleModalConfirm : null}
                onCancel={modalAction ? closeModal : null} // Only show cancel if there's an action
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
                    <div className="relative w-30   h-30 rounded-full bg-blue-700 dark:bg-gray-700 flex items-center justify-center mb-3 border-4 border-blue-500 dark:border-gray-600 overflow-hidden">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-14   h-14 text-blue-200 dark:text-gray-300" />
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
                    {/* Removed email display */}
                    {/* Removed User ID display */}
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
                                <a
                                    href={item.section === 'home' ? '/' : `#${item.section}`}
                                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                                        activeSection === item.section ? 'bg-blue-700 dark:bg-indigo-700 text-white shadow-md' : 'text-blue-100 hover:text-white'
                                    }`}
                                    onClick={(e) => {
                                        if (item.section === 'home') {
                                            navigate('/'); // Navigate to root for Home
                                        } else {
                                            e.preventDefault();
                                            setActiveSection(item.section);
                                            document.querySelector('main.flex-1').scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.name}
                                </a>
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
                {/* Top Navbar component call */}
                

                {/* Dashboard Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-gray-900 transition-colors duration-500 custom-scrollbar">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-8">
                        Welcome, {currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Guest')) : 'Guest'}!
                    </h1>

                    {/* Conditional Rendering of Sections */}

                    {/* Overview Section */}
                    {activeSection === 'overview' && (
                        <motion.div
                            key="overview-section"
                            initial="hidden"
                            animate="visible"
                            variants={sectionVariants}
                        >
                            {/* Top Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"> {/* Adjusted to 2 columns */}
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
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-all">{lastScannedUrl || 'N/A'}</h3> {/* Changed to break-all for long URLs */}
                                    </div>
                                    <Search className="w-10 h-10 text-green-500 dark:text-green-400 self-end mt-2" />
                                </motion.div>
                            </div>

                            {/* Overall Health Chart (now takes full width) */}
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
                                    onChange={(e) => {
                                        setLastScannedUrl(e.target.value);
                                        setScanError(''); // Clear error on input change
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
                                                            onClick={() => { navigate('/report', { state: { websiteUrl: report.url } }); }}
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
                                        onChange={(e) => {
                                            setAgencyName(e.target.value);
                                            // NEW: Save to localStorage whenever the name changes
                                            saveBrandingToLocalStorage(e.target.value, agencyLogoPreview);
                                        }}
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
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                <Settings className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-2" /> Settings
                            </h2>
                            <div className="space-y-4">
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
                                        onChange={(e) => setLanguage(e.target.value)}
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
                                                onChange={(e) => setUpdateEmailInput(e.target.value)}
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
                                                onChange={(e) => setUpdatePasswordInput(e.target.value)}
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

                </main>
            </div>
        </div>
    );
};

export default Dashboard;