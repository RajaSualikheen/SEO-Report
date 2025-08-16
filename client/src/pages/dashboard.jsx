/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LogOut, Settings, FileText, Trash2, Edit, Camera,
    Palette, Globe, RefreshCcw, Search, ExternalLink,
    Home, Info, LogIn, ChevronDown, ChevronUp, BarChart, Sun, Moon,
    DollarSign, Share2, ThumbsUp, Star, MessageSquare, Bell, MapPin, TrendingUp, Menu, X, PieChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, updateEmail, updatePassword, signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { auth, db, firebaseConfig } from "../firebase";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

const logoutUser = async () => {
    await signOut(auth);
};

const CustomModal = ({ show, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isSuccess = false }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl p-6 w-full max-w-sm text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text dark:from-cyan-400 dark:to-blue-400 mb-4">{title}</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    {!isSuccess && onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-200"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-colors duration-200 shadow-md"
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
    const [currentUser, setCurrentUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [lastScannedUrl, setLastScannedUrl] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [agencyLogo, setAgencyLogo] = useState(null);
    const [agencyLogoPreview, setAgencyLogoPreview] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
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

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? user.uid : 'No user');
            if (user) {
                setCurrentUser(user);
                if (user.isAnonymous && initialAuthToken) {
                    console.log('User is anonymous, checking custom token');
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log('Signed in with custom token');
                    } catch (error) {
                        console.error('Custom token sign-in error:', error);
                        await signInAnonymously(auth);
                        console.log('Signed in anonymously');
                    }
                }
            } else {
                console.log('No user, signing in anonymously');
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error('Anonymous sign-in error:', error);
                    openModal('Error', `Failed to sign in: ${error.message}`, null, 'OK');
                }
            }
        });
        return () => {
            console.log('Unsubscribing from auth listener');
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        let unsubscribe = () => {};

        if (currentUser && currentUser.uid) {
            console.log('Fetching reports for user:', currentUser.uid);
            console.log('Firestore path:', `artifacts/${firebaseConfig.projectId}/users/${currentUser.uid}/reports`);
            
            const userReportsRef = collection(db, `artifacts/${firebaseConfig.projectId}/users/${currentUser.uid}/reports`);
            const q = query(userReportsRef, orderBy('timestamp', 'desc'));

            unsubscribe = onSnapshot(q, (snapshot) => {
                console.log('Firestore snapshot received:', snapshot.docs.length, 'documents');
                const reportsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log('Report document:', doc.id, data);
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
                console.log('Processed reports:', reportsData);
                if (reportsData.length > 0) {
                    setLastScannedUrl(reportsData[0].url);
                } else {
                    setLastScannedUrl('');
                }
            }, (error) => {
                console.error('Firestore error:', error.code, error.message);
                openModal('Error', `Failed to fetch reports: ${error.message}`, null, 'OK');
            });
        } else {
            console.log('No user authenticated, skipping Firestore query');
        }

        return () => {
            console.log('Unsubscribing from Firestore listener');
            unsubscribe();
        };
    }, [currentUser]);

    useEffect(() => {
        const storedName = localStorage.getItem('agencyName');
        const storedLogo = localStorage.getItem('agencyLogoPreview');
        if (storedName) setAgencyName(storedName);
        if (storedLogo) setAgencyLogoPreview(storedLogo);
    }, []);

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
        hidden: { opacity: 0, y: 50 },
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
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
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
            backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
            hoverOffset: 4
        }]
    };

    console.log('Rendering with reports:', reports);
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 font-sans transition-colors duration-500">
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
                className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-in-out w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex flex-col p-6 shadow-2xl z-30 border-r border-gray-200 dark:border-gray-700`}
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="flex justify-end md:hidden mb-4">
                    <button onClick={() => setSidebarOpen(false)}>
                        <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        className="relative w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 overflow-hidden ring-4 ring-indigo-500/20"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-indigo-500" />
                        )}
                        <motion.button
                            onClick={triggerFileInput}
                            className="absolute bottom-0 right-0 bg-indigo-500 p-1.5 rounded-full shadow-md hover:bg-indigo-600 transition-colors duration-200"
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
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                        {currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Guest')) : 'Guest'}
                    </h3>
                </div>

                <nav className="flex-grow">
                    <ul>
                        {navItems.map((item, index) => (
                            <motion.li
                                key={item.section}
                                className="mb-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <a
                                    href={item.section === 'home' ? '/' : `#${item.section}`}
                                    className={`flex items-center p-3 rounded-xl transition-colors duration-200 ${
                                        activeSection === item.section ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
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
                                    <item.icon className="w-5 h-5 mr-3 text-indigo-500" />
                                    {item.name}
                                </a>
                            </motion.li>
                        ))}
                    </ul>
                </nav>

                <motion.button
                    onClick={handleLogout}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-300 flex items-center justify-center shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                </motion.button>
            </motion.div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-md border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 flex items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Dashboard
                        <BarChart className="w-8 h-8 ml-3 text-indigo-500" />
                    </motion.h1>

                    {activeSection === 'overview' && (
                        <motion.div
                            key="overview-section"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <motion.div
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
                                        <h3 className="text-3xl font-bold text-indigo-600">{reports.length}</h3>
                                    </div>
                                    <FileText className="w-10 h-10 text-indigo-400 opacity-80" />
                                </motion.div>
                                <motion.div
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: 0.2 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                                        <h3 className="text-3xl font-bold text-indigo-600">{averageScore}%</h3>
                                    </div>
                                    <TrendingUp className="w-10 h-10 text-indigo-400 opacity-80" />
                                </motion.div>
                                <motion.div
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    transition={{ delay: 0.3 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Scan</p>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{lastScannedUrl || 'N/A'}</h3>
                                    </div>
                                    <Search className="w-10 h-10 text-indigo-400 opacity-80 self-end mt-2" />
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <motion.div
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                        Score Trend
                                        <TrendingUp className="w-5 h-5 ml-2 text-indigo-500" />
                                    </h2>
                                    <div className="h-64">
                                        <Line data={scoreTrendData} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                y: { min: 0, max: 100 }
                                            },
                                            plugins: {
                                                legend: { display: false }
                                            }
                                        }} />
                                    </div>
                                </motion.div>
                                <motion.div
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                        Score Distribution
                                        <PieChart className="w-5 h-5 ml-2 text-indigo-500" />
                                    </h2>
                                    <div className="h-64 flex items-center justify-center">
                                        <Doughnut data={categoryDistribution} options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'bottom' }
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
                            className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.01 }}
                        >
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Search className="w-8 h-8 text-indigo-500 mr-3" /> Quick SEO Scan
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
                                Analyze any website's SEO performance instantly.
                            </p>
                            <div className="w-full max-w-xl flex flex-col sm:flex-row gap-3">
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={lastScannedUrl}
                                    onChange={(e) => {
                                        setLastScannedUrl(e.target.value);
                                        setScanError('');
                                        setScanMessage('');
                                    }}
                                    className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 transition duration-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                                <motion.button
                                    onClick={handleQuickScan}
                                    className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center justify-center font-semibold shadow-md"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <RefreshCcw className="w-5 h-5 mr-2" /> Scan
                                </motion.button>
                            </div>
                            {scanError && <p className="text-red-500 text-sm mt-2">{scanError}</p>}
                            {scanMessage && <p className="text-green-500 text-sm mt-2">{scanMessage}</p>}
                        </motion.section>
                    )}

                    {activeSection === 'reports' && (
                        <motion.section
                            key="reports-section"
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <FileText className="w-6 h-6 text-indigo-500 mr-2" /> Report History
                            </h2>
                            {reports.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">URL</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {reports.map((report) => (
                                                <motion.tr
                                                    key={report.id}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200"
                                                    whileHover={{ backgroundColor: 'rgba(99,102,241,0.05)' }}
                                                >
                                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{report.createdAt}</td>
                                                    <td className="px-6 py-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                                                        <a href={report.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                            {report.url} <ExternalLink className="w-4 h-4 ml-1" />
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            report.overallScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                                            report.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                                                        }`}>
                                                            {report.overallScore ? `${report.overallScore}%` : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <button
                                                            onClick={() => { navigate('/report', { state: { websiteUrl: report.url } }); }}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReport(report.id)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reports available. Start a scan to generate one.</p>
                            )}
                        </motion.section>
                    )}

                    {activeSection === 'branding' && (
                        <motion.section
                            key="branding-section"
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Palette className="w-6 h-6 text-indigo-500 mr-2" /> Branding Settings
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agency Name</label>
                                    <input
                                        type="text"
                                        value={agencyName}
                                        onChange={(e) => {
                                            setAgencyName(e.target.value);
                                            saveBrandingToLocalStorage(e.target.value, agencyLogoPreview);
                                        }}
                                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agency Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 dark:file:bg-gray-800 dark:file:text-indigo-300"
                                    />
                                </div>
                                {agencyLogoPreview && (
                                    <img src={agencyLogoPreview} alt="Logo Preview" className="mt-4 max-h-32 rounded-lg shadow-md" />
                                )}
                            </div>
                        </motion.section>
                    )}

                    {activeSection === 'settings' && (
                        <motion.section
                            key="settings-section"
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col"
                            variants={sectionVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Settings className="w-6 h-6 text-indigo-500 mr-2" /> Account Settings
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                                    <button
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Update Email</label>
                                    <input
                                        type="email"
                                        value={updateEmailInput}
                                        onChange={(e) => setUpdateEmailInput(e.target.value)}
                                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => handleUpdateAuth('email')}
                                        className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                                    >
                                        Update
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Update Password</label>
                                    <input
                                        type="password"
                                        value={updatePasswordInput}
                                        onChange={(e) => setUpdatePasswordInput(e.target.value)}
                                        className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => handleUpdateAuth('password')}
                                        className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                                    >
                                        Update
                                    </button>
                                </div>
                                {updateMessage && <p className="text-green-500">{updateMessage}</p>}
                                {updateError && <p className="text-red-500">{updateError}</p>}
                            </div>
                        </motion.section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;