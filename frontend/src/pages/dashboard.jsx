/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp as TrendingUpIcon,  User, LogOut, Settings, FileText, Trash2, Edit, Camera,
    Palette, Globe, RefreshCcw, Search, ExternalLink,
    Home, Info, LogIn, ChevronDown, ChevronUp, BarChart, Sun, Moon,
    DollarSign, Share2, ThumbsUp, Star, MessageSquare, Bell, MapPin, TrendingUp, Menu, X, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, updateEmail, updatePassword, signInWithCustomToken } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { auth, db, firebaseConfig } from "../firebase";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement,Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// FIX: Import the useTheme hook from your context
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(ArcElement, ChartTooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement,Filler);

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const logoutUser = async () => {
    await signOut(auth);
};

const CustomModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isSuccess = false }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <motion.div
                className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl p-8 w-full max-w-md text-center border border-gray-200/50 dark:border-gray-800/50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    {!isSuccess && onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 font-medium"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-colors duration-300 shadow-sm font-medium"
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    // FIX: Get theme state and toggle function from the global context
    const { isDarkMode, toggleTheme } = useTheme();

    const [currentUser, setCurrentUser] = useState(null);
    const [reports, setReports] = useState([]);
    // ✅ ---  State for GSC Data ---
    const [gscSites, setGscSites] = useState([]);
    const [gscLoading, setGscLoading] = useState(false);
    const [gscError, setGscError] = useState('');
    // ✅ ---  State for Performance Data ---
    const [selectedSite, setSelectedSite] = useState('');
    const [keywords, setKeywords] = useState([]);
    const [keywordsLoading, setKeywordsLoading] = useState(false);
    const [keywordsError, setKeywordsError] = useState('');
     // --- END ---
    const [lastScannedUrl, setLastScannedUrl] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [agencyLogo, setAgencyLogo] = useState(null);
    const [agencyLogoPreview, setAgencyLogoPreview] = useState(null);
    
    // REMOVED: Local darkMode state, which conflicted with the global context
    // const [darkMode, setDarkMode] = useState(...);

    const [language, setLanguage] = useState('en');
    const [updateEmailInput, setUpdateEmailInput] = useState('');
    const [updatePasswordInput, setUpdatePasswordInput] = useState('');
    const [updateMessage, setUpdateMessage] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalAction, setModalAction] = useState(null);
    const [modalConfirmText, setModalConfirmText] = useState('Confirm');
    const [modalCancelText, setModalCancelText] = useState('Cancel');
    const [isModalSuccess, setIsModalSuccess] = useState(false);
    const [scanMessage, setScanMessage] = useState('');
    const [scanError, setScanError] = useState('');
    const fileInputRef = useRef(null);

    const saveBrandingToLocalStorage = (name, logoUrl) => {
        try {
            localStorage.setItem('agencyName', name);
            localStorage.setItem('agencyLogoPreview', logoUrl || '');
        } catch (error) {
            console.error("Error saving branding to local storage:", error);
        }
    };

    const openModal = (title, message, action = null, confirmText = 'Confirm', cancelText = 'Cancel', isSuccess = false) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalAction(() => action);
        setModalConfirmText(confirmText);
        setModalCancelText(cancelText);
        setIsModalSuccess(isSuccess);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalTitle('');
        setModalMessage('');
        setModalAction(null);
        setModalConfirmText('Confirm');
        setModalCancelText('Cancel');
        setIsModalSuccess(false);
    };

    const handleModalConfirm = () => {
        if (modalAction) {
            modalAction();
        } else {
            closeModal();
        }
    };
const fetchGscSites = async () => {
        if (!currentUser) return; // Don't fetch if no user is logged in

        setGscLoading(true);
        setGscError('');

        try {
            // 1. Get the Firebase ID token for the current user
            const token = await currentUser.getIdToken();

            // 2. Fetch data from your secure backend endpoint
            const response = await fetch('http://localhost:4000/api/gsc/sites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch GSC sites');
            }

            const sites = await response.json();
            setGscSites(sites);

        } catch (error) {
            console.error("Error fetching GSC sites:", error);
            setGscError(error.message);
        } finally {
            setGscLoading(false);
        }
    };
    const fetchPerformanceData = async (siteUrl) => {
        if (!currentUser || !siteUrl) return;

        setKeywordsLoading(true);
        setKeywordsError('');
        setKeywords([]); // Clear previous results

        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('http://localhost:4000/api/gsc/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ siteUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch performance data.');
            }

            const performanceData = await response.json();
            setKeywords(performanceData);

        } catch (error) {
            console.error("Error fetching GSC performance data:", error);
            setKeywordsError(error.message);
        } finally {
            setKeywordsLoading(false);
        }
    };
    // REMOVED: Redundant useEffect for toggling dark class. ThemeContext handles this globally.
    // useEffect(() => {
    //   if (darkMode) { ... }
    // }, [darkMode]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // if (user.isAnonymous && initialAuthToken) {
                //     try {
                //         await signInWithCustomToken(auth, initialAuthToken);
                //     } catch (error) {
                //         console.error('Custom token sign-in error:', error);
                //         await signInAnonymously(auth);
                //     }
                // }
            } else {
                setCurrentUser(null);
                // try {
                //     await signInAnonymously(auth);
                // } catch (error) {
                //     console.error('Anonymous sign-in error:', error);
                //     openModal('Error', `Failed to sign in: ${error.message}`, null, 'OK');
                // }
            }
        });
        return () => unsubscribe();
    }, []);
useEffect(() => {
        if (currentUser) {
            fetchGscSites();
        }
    }, [currentUser]);
    useEffect(() => {
        if (selectedSite) {
            fetchPerformanceData(selectedSite);
        }
    }, [selectedSite]);
    useEffect(() => {
        let unsubscribe = () => {};

        if (currentUser && currentUser.uid) {
            const userReportsRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${currentUser.uid}/reports`);
            const q = query(userReportsRef, orderBy('timestamp', 'desc'));

            unsubscribe = onSnapshot(q, (snapshot) => {
                const reportsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let reportDate;
                    if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                        reportDate = data.timestamp.toDate();
                    } else if (typeof data.timestamp === 'string') {
                        reportDate = new Date(data.timestamp);
                    } else {
                        reportDate = null;
                    }
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: reportDate ? reportDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'
                    };
                });
                setReports(reportsData);
                if (reportsData.length > 0) {
                    setLastScannedUrl(reportsData[0].url);
                } else {
                    setLastScannedUrl('');
                }
            }, (error) => {
                console.error('Firestore error:', error.code, error.message);
                openModal('Error', `Failed to fetch reports: ${error.message}`, null, 'OK');
            });
        }

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        const storedName = localStorage.getItem('agencyName');
        const storedLogo = localStorage.getItem('agencyLogoPreview');
        if (storedName) setAgencyName(storedName);
        if (storedLogo) setAgencyLogoPreview(storedLogo);
    }, []);
useEffect(() => {
        const handleCustomTokenLogin = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('firebase_token');
            const gscError = params.get('gsc_status');

            if (token) {
                console.log("Found Firebase custom token in URL. Attempting to sign in...");
                try {
                    await signInWithCustomToken(auth, token);
                    console.log("✅ Successfully signed in with custom token.");
                    // Clean the URL
                    navigate('/dashboard', { replace: true });
                    openModal(
                        'Connection Successful',
                        'You have successfully connected your Google account for GSC.',
                        null, 'Great!', null, true
                    );
                } catch (error) {
                    console.error("❌ Failed to sign in with custom token:", error);
                    navigate('/dashboard', { replace: true }); // Clean URL even on error
                    openModal('Authentication Failed', `There was an error signing you in: ${error.message}`, null, 'OK');
                }
            } else if (gscError) {
                 console.error("GSC authentication flow returned an error.");
                 navigate('/dashboard', { replace: true }); // Clean URL
                 openModal('Connection Failed', 'The Google Search Console connection process failed. Please try again.', null, 'OK');
            }
        };

        handleCustomTokenLogin();
    }, [navigate]);
    const handleLogout = async () => {
        openModal(
            'Confirm Logout',
            'Are you sure you want to log out?',
            async () => {
                try {
                    await logoutUser();
                    navigate('/login');
                } catch (error) {
                    console.error('Error logging out:', error);
                    openModal('Logout Failed', `There was an error logging out: ${error.message}`, null, 'OK');
                }
            },
            'Logout',
            'Cancel'
        );
    };

    const handleQuickScan = () => {
        setScanMessage('');
        setScanError('');
        if (!lastScannedUrl) {
            setScanError("Please enter a URL to scan.");
            return;
        }
        navigate('/report', { state: { websiteUrl: lastScannedUrl } });
        setLastScannedUrl('');
    };

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
                    const reportDocRef = doc(db, `artifacts/${firebaseConfig.projectId}/users/${currentUser.uid}/reports`, reportId);
                    await deleteDoc(reportDocRef);
                    setModalTitle('Success');
                    setModalMessage('Report deleted successfully!');
                    setModalAction(null);
                    setModalConfirmText('OK');
                    setModalCancelText('');
                    setIsModalSuccess(true);
                } catch (error) {
                    console.error("Error deleting report:", error);
                    openModal('Deletion Failed', `Failed to delete report: ${error.message}`, null, 'OK');
                }
            },
            'Delete',
            'Cancel'
        );
    };

    const handleLogoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setAgencyLogo(file);
            const logoUrl = URL.createObjectURL(file);
            setAgencyLogoPreview(logoUrl);
            saveBrandingToLocalStorage(agencyName, logoUrl);
        } else {
            setAgencyLogo(null);
            setAgencyLogoPreview(null);
            saveBrandingToLocalStorage(agencyName, '');
        }
    };

    const handleProfilePicChange = async (event) => {
        const file = event.target.files[0];
        if (file && currentUser) {
            const reader = new FileReader();
            reader.onloadend = async () => {
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

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

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
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    const navItems = [
        { name: 'Home', icon: Home, section: 'home' },
        { name: 'Overview', icon: BarChart, section: 'overview' },
        { name: 'Reports', icon: FileText, section: 'reports' },
        { name: 'Quick Scan', icon: Search, section: 'quick-scan' },
        { name: 'Branding', icon: Palette, section: 'branding' },
        { name: 'Settings', icon: Settings, section: 'settings' },
    ];

    const mostRecentScore = reports.length > 0 ? (reports[0].overallScore || 0) : 0;
    const averageScore = reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + (r.overallScore || 0), 0) / reports.length) : 0;
    const scoreTrendData = {
        labels: reports.slice(0, 5).reverse().map(r => r.createdAt.split(',')[0]),
        datasets: [{
            label: 'SEO Score',
            data: reports.slice(0, 5).reverse().map(r => r.overallScore || 0),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
        }]
    };

    const categoryDistribution = {
        labels: ['Good', 'Warning', 'Bad'],
        datasets: [{
            data: [
                reports.filter(r => (r.overallScore || 0) >= 80).length,
                reports.filter(r => (r.overallScore || 0) >= 50 && (r.overallScore || 0) < 80).length,
                reports.filter(r => (r.overallScore || 0) < 50).length
            ],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            hoverOffset: 4
        }]
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <CustomModal
                show={showModal}
                title={modalTitle}
                message={modalMessage}
                onConfirm={handleModalConfirm}
                onCancel={isModalSuccess ? null : closeModal}
                confirmText={modalConfirmText}
                cancelText={modalCancelText}
                isSuccess={isModalSuccess}
            />

            <motion.div
                className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-900 dark:text-gray-100 flex flex-col p-8 shadow-xl z-30 border-r border-gray-200/50 dark:border-gray-700/50`}
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="flex justify-end md:hidden mb-6">
                    <button onClick={() => setSidebarOpen(false)}>
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        className="relative w-20 h-20 rounded-full bg-gray-100/50 dark:bg-gray-700/50 flex items-center justify-center mb-4 overflow-hidden ring-2 ring-indigo-200/50 dark:ring-indigo-800/50"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-indigo-500" />
                        )}
                        <motion.button
                            onClick={triggerFileInput}
                            className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300 border border-gray-200 dark:border-gray-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Update Profile Picture"
                        >
                            <Camera className="w-4 h-4 text-indigo-500" />
                        </motion.button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleProfilePicChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                        {currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Guest')) : 'Guest'}
                    </h3>
                </div>

                <nav className="flex-grow">
                    <ul className="space-y-2">
                        {navItems.map((item, index) => (
                            <motion.li
                                key={item.section}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <a
                                    href={item.section === 'home' ? '/' : `#${item.section}`}
                                    className={`flex items-center p-4 rounded-xl transition-colors duration-300 text-base font-medium ${
                                        activeSection === item.section ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                                    }`}
                                    onClick={(e) => {
                                        if (item.section === 'home') {
                                            navigate('/');
                                        } else {
                                            e.preventDefault();
                                            setActiveSection(item.section);
                                            setSidebarOpen(false);
                                            document.querySelector('main.flex-1').scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    <item.icon className="w-5 h-5 mr-4 text-indigo-500" />
                                    {item.name}
                                </a>
                            </motion.li>
                        ))}
                    </ul>
                </nav>

                <motion.button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition duration-300 flex items-center justify-center shadow-sm font-medium mt-8"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                </motion.button>
            </motion.div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-4 shadow-sm border-b border-gray-200/50 dark:border-gray-700/50">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-7xl mx-auto w-full space-y-12">
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Dashboard
                    </motion.h1>

                    {activeSection === 'overview' && (
                        <motion.div
                            key="overview-section"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-12"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <motion.div
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: 0.1 }}
                                   whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
    }}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Reports</p>
                                        <h3 className="text-4xl font-bold text-indigo-600 mt-2">{reports.length}</h3>
                                    </div>
                                    <FileText className="w-12 h-12 text-indigo-300 opacity-70" />
                                </motion.div>
                                <motion.div
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: 0.2 }}
                                    whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
    }}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Average Score</p>
                                        <h3 className="text-4xl font-bold text-indigo-600 mt-2">{averageScore}%</h3>
                                    </div>
                                    <TrendingUp className="w-12 h-12 text-indigo-300 opacity-70" />
                                </motion.div>
                                <motion.div
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-col justify-between"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: 0.3 }}
                                    whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
    }}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Scan</p>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate mt-2">{lastScannedUrl || 'N/A'}</h3>
                                    </div>
                                    <Search className="w-12 h-12 text-indigo-300 opacity-70 self-end mt-4" />
                                </motion.div>
                            </div>
                            <motion.div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                    <Globe className="w-5 h-5 mr-2 text-indigo-500" />
                                    Google Search Console Properties
                                </h2>
                                <div className="min-h-[50px]">
                                    {gscLoading && <p className="text-gray-500">Loading your sites...</p>}
                                    {gscError && <p className="text-red-500">Error: {gscError}</p>}
                                    
                                    {!gscLoading && !gscError && (
                                        gscSites.length > 0 ? (
                                            <select
                                                value={selectedSite}
                                                onChange={(e) => setSelectedSite(e.target.value)}
                                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">-- Select a Property to Analyze --</option>
                                                {gscSites.map(site => (
                                                    <option key={site.siteUrl} value={site.siteUrl}>
                                                        {site.siteUrl}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400">No GSC sites found for your account.</p>
                                        )
                                    )}
                                </div>
                            </motion.div>
                            {selectedSite && (
                                <motion.div
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                        <TrendingUpIcon className="w-5 h-5 mr-2 text-green-500" />
                                        "Striking Distance" Keywords
                                    </h2>
                                    <div className="overflow-x-auto">
                                        {keywordsLoading && <p className="text-gray-500">Fetching performance data...</p>}
                                        {keywordsError && <p className="text-red-500">Error: {keywordsError}</p>}
                                        
                                        {!keywordsLoading && !keywordsError && (
                                            keywords.length > 0 ? (
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Keyword</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Position</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Impressions</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CTR</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                        {keywords.map(row => (
                                                            <tr key={row.keys[0]}>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{row.keys[0]}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{Math.round(row.position)}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{row.impressions}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{(row.ctr * 100).toFixed(2)}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400">No "striking distance" keywords found for this property in the last 90 days.</p>
                                            )
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <motion.div
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                        Score Trend
                                        <TrendingUp className="w-5 h-5 ml-2 text-indigo-500" />
                                    </h2>
                                    <div className="h-80">
                                        <Line data={scoreTrendData} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                                                x: { grid: { color: 'rgba(0,0,0,0.05)' } }
                                            },
                                            plugins: {
                                                legend: { display: false }
                                            }
                                        }} />
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                        Score Distribution
                                        <PieChart className="w-5 h-5 ml-2 text-indigo-500" />
                                    </h2>
                                    <div className="h-80 flex items-center justify-center">
                                        <Doughnut data={categoryDistribution} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'bottom', labels: { color: 'currentColor' } }
                                            }
                                        }} />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'quick-scan' && (
                        <motion.section
                            key="quick-scan-section"
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-12 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex flex-col items-center text-center max-w-3xl mx-auto"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.01 }}
                        >
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                Quick SEO Scan
                            </h2>
                            <p className="text-base text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
                                Analyze any website's SEO performance instantly.
                            </p>
                            <div className="w-full flex flex-col sm:flex-row gap-4">
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={lastScannedUrl}
                                    onChange={(e) => {
                                        setLastScannedUrl(e.target.value);
                                        setScanError('');
                                        setScanMessage('');
                                    }}
                                    className="flex-grow p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition duration-300 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-inner"
                                />
                                <motion.button
                                    onClick={handleQuickScan}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 px-8 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition duration-300 flex items-center justify-center font-medium shadow-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <RefreshCcw className="w-5 h-5 mr-2" /> Scan
                                </motion.button>
                            </div>
                            {scanError && <p className="text-red-500 text-sm mt-4">{scanError}</p>}
                            {scanMessage && <p className="text-green-500 text-sm mt-4">{scanMessage}</p>}
                        </motion.section>
                    )}

                    {activeSection === 'reports' && (
                        <motion.section
                            key="reports-section"
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                Report History
                            </h2>
                            {reports.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                        <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                            {reports.map((report) => (
                                                <motion.tr
                                                    key={report.id}
                                                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition duration-300"
                                                    whileHover={{ backgroundColor: 'rgba(99,102,241,0.03)' }}
                                                >
                                                    <td className="px-6 py-5 text-sm text-gray-900 dark:text-white">{report.createdAt}</td>
                                                    <td className="px-6 py-5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                                        <a href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                            {report.url} <ExternalLink className="w-4 h-4 ml-2" />
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm">
                                                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                                                            report.overallScore >= 80 ? 'bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            report.overallScore >= 60 ? 'bg-yellow-100/50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                            'bg-red-100/50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                            {report.overallScore ? `${report.overallScore}%` : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm space-x-4">
                                                        <button
                                                                onClick={() => navigate(`/report/${report.id}`)}
                                                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium"

                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReport(report.id)}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-12 text-base">No reports available. Start a scan to generate one.</p>
                            )}
                        </motion.section>
                    )}

                    {activeSection === 'branding' && (
                        <motion.section
                            key="branding-section"
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                Branding Settings
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agency Name</label>
                                    <input
                                        type="text"
                                        value={agencyName}
                                        onChange={(e) => {
                                            setAgencyName(e.target.value);
                                            saveBrandingToLocalStorage(e.target.value, agencyLogoPreview);
                                        }}
                                        className="block w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition duration-300 bg-transparent text-gray-900 dark:text-white shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agency Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:py-3 file:px-6 file:rounded-lg file:border-0 file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-900 dark:file:text-white file:font-medium file:transition-colors file:hover:bg-gray-200 dark:file:hover:bg-gray-600"
                                    />
                                </div>
                                {agencyLogoPreview && (
                                    <img src={agencyLogoPreview} alt="Logo Preview" className="mt-6 max-h-40 rounded-lg shadow-md mx-auto" />
                                )}
                            </div>
                        </motion.section>
                    )}

                    {activeSection === 'settings' && (
                        <motion.section
                            key="settings-section"
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                Account Settings
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="block w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition duration-300 bg-transparent text-gray-900 dark:text-white shadow-inner"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                                    {/* FIX: Use the global toggleTheme function */}
                                    <button
                                        onClick={toggleTheme}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Email</label>
                                    <input
                                        type="email"
                                        value={updateEmailInput}
                                        onChange={(e) => setUpdateEmailInput(e.target.value)}
                                        className="block w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition duration-300 bg-transparent text-gray-900 dark:text-white shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleUpdateAuth('email')}
                                        className="mt-3 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition duration-300 font-medium shadow-sm"
                                    >
                                        Update
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Update Password</label>
                                    <input
                                        type="password"
                                        value={updatePasswordInput}
                                        onChange={(e) => setUpdatePasswordInput(e.target.value)}
                                        className="block w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition duration-300 bg-transparent text-gray-900 dark:text-white shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleUpdateAuth('password')}
                                        className="mt-3 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition duration-300 font-medium shadow-sm"
                                    >
                                        Update
                                    </button>
                                </div>
                                {updateMessage && <p className="text-green-500 text-sm">{updateMessage}</p>}
                                {updateError && <p className="text-red-500 text-sm">{updateError}</p>}
                            </div>
                        </motion.section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;