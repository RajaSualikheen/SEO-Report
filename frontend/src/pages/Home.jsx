import { motion, AnimatePresence, useInView, useAnimation, useSpring, useTransform, useMotionValue } from "framer-motion";
import {
    Search, BarChart3, Zap, Shield, Globe, TrendingUp,
    CheckCircle, Star, ArrowRight, Play, X,
    Target, User, Mail, MessageSquare
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// --- Firebase Imports ---
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";



// --- New Components ---

// Animated Background Components
const FloatingParticles = () => (
    <div className="absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full bg-blue-500/20 dark:bg-cyan-400/30"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    height: `${Math.random() * 4 + 2}px`,
                    width: `${Math.random() * 4 + 2}px`,
                }}
                animate={{
                    x: [0, Math.random() * 100 - 50, 0],
                    y: [0, Math.random() * 100 - 50, 0],
                    opacity: [0.3, 1, 0.3]
                }}
                transition={{
                    duration: Math.random() * 20 + 15,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />
        ))}
    </div>
);

const AnimatedOrbs = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-cyan-400/20 blur-xl"
                style={{
                    width: `${200 + Math.random() * 300}px`,
                    height: `${200 + Math.random() * 300}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                }}
                animate={{
                    x: [0, 100, -100, 0],
                    y: [0, -100, 100, 0],
                    scale: [1, 1.2, 0.8, 1],
                }}
                transition={{
                    duration: 20 + Math.random() * 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        ))}
    </div>
);

// New component for the subtle circuit background
const CircuitBackground = () => (
    <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" preserveAspectRatio="xMidYMid slice">
        <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <path
                    d="M10,10 L90,10 M10,50 L50,50 L50,90 M90,50 L50,50"
                    stroke="#3B82F6"
                    strokeWidth="1"
                    fill="none"
                />
                <circle cx="10" cy="10" r="2" fill="#3B82F6" />
                <circle cx="90" cy="10" r="2" fill="#3B82F6" />
                <circle cx="50" cy="50" r="2" fill="#3B82F6" />
                <circle cx="50" cy="90" r="2" fill="#3B82F6" />
                <circle cx="90" cy="50" r="2" fill="#3B82F6" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
    </svg>
);


// Corrected Card Component without 3D tilt
const ModernCard = ({ children, className = "", ...props }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`relative h-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-gray-600/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};


const Home = () => {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDemoResults, setShowDemoResults] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const navigate = useNavigate();

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };
    
    const staggerContainer = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.3 }
        }
    };

    const handleGenerateReport = () => {
        if (!url.trim()) {
            alert("Please enter a valid URL");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // Replaced alert with navigate to a new route.
            navigate('/report', { state: { websiteUrl: url } })
        }, 2500);
    };

    const handleRunDemoAudit = () => {
        setShowDemoResults(true);
    };

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContactForm(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you shortly.');
        setContactForm({ name: '', email: '', message: '' });
    };

    const demoReportPreview = {
        overallScore: 82,
        categoryScores: {
            Content: { score: 28, max: 30, percentage: (28 / 30) * 100 },
            Technical: { score: 24, max: 25, percentage: (24 / 25) * 100 },
            'User Experience': { score: 20, max: 25, percentage: (20 / 25) * 100 },
            Security: { score: 14, max: 15, percentage: (14 / 15) * 100 },
            'Off-Page': { score: 4, max: 5, percentage: (4 / 5) * 100 },
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 relative transition-all duration-700">
            <FloatingParticles />
            <AnimatedOrbs />
            <CircuitBackground />
            
           
            {/* Hero Section - Height and Spacing Corrected */}
            <section id="home" className="relative min-h-[80vh] flex items-center justify-center px-4 overflow-hidden pt-10 pb-12">
                <div className="relative z-10 text-center max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                       <div className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full mb-8 shadow-sm">
                            <Star className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">
                                Next-Generation SEO Intelligence
                            </span>
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                    >
                        <span className="text-gray-900 dark:text-white">ILLUMINATE</span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                            YOUR SEO
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                    >
                        Unleash the power of AI-driven analytics and real-time insights to dominate search rankings with unprecedented precision.
                    </motion.p>

                    <motion.div
                        className="relative max-w-4xl mx-auto mb-12"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-2xl border border-white/30 dark:border-gray-600/30 rounded-2xl p-3 shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-6 h-6" />
                                    <input
                                        type="url"
                                        placeholder="Enter your website URL for deep analysis"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full pl-16 pr-6 py-6 text-lg bg-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                                        aria-label="Website URL"
                                    />
                                </div>
                                <motion.button
                                    onClick={handleGenerateReport}
                                    disabled={loading}
                                    className="group relative px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-bold text-lg rounded-xl overflow-hidden shadow-lg hover:shadow-2xl disabled:opacity-50 transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="relative flex items-center gap-3">
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>INITIATE DEEP SCAN</span>
                                                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.button
                        onClick={handleRunDemoAudit}
                        className="inline-flex items-center gap-3 text-blue-600 dark:text-cyan-400 font-semibold text-lg hover:text-blue-700 dark:hover:text-cyan-300 transition-colors group"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5" />
                        </div>
                        <span>Experience Demo Audit</span>
                    </motion.button>
                </div>

                {/* Floating geometric shapes */}
                <motion.div
                    className="absolute top-20 left-10 w-20 h-20 border-2 border-blue-500/30 dark:border-blue-400/50 rounded-full"
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute bottom-32 right-16 w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-400/30 dark:to-pink-400/30 rounded-lg rotate-45"
                    animate={{ rotate: [45, 225, 45], y: [-10, 10, -10] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
            </section>

            {/* Demo Results Modal */}
            <AnimatePresence>
                {showDemoResults && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDemoResults(false)}
                    >
                        <motion.div
                            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full max-h-[100vh] overflow-y-auto border border-white/30 dark:border-gray-600/30 shadow-2xl"
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Demo Audit Results
                                </h3>
                                <button
                                    onClick={() => setShowDemoResults(false)}
                                    className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                                    aria-label="Close demo results"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-8 rounded-2xl border border-green-200 dark:border-green-800">
                                    <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Overall Score</h4>
                                    <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-4">
                                        {demoReportPreview.overallScore}/100
                                    </div>
                                    <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3">
                                        <motion.div
                                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${demoReportPreview.overallScore}%` }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 p-8 rounded-2xl border border-blue-200 dark:border-blue-800">
                                    <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Category Breakdown</h4>
                                    <div className="space-y-4">
                                        {Object.entries(demoReportPreview.categoryScores).map(([categoryName, data]) => (
                                            <div key={categoryName} className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{categoryName}</span>
                                                <span className="font-bold text-lg" style={{ color: data.percentage >= 80 ? '#10B981' : data.percentage >= 60 ? '#F59E0B' : '#EF4444' }}>
                                                    {data.score}/{data.max}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-10 text-center">
                                <motion.button
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Get Your Complete Analysis
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Features Section */}
            <motion.section
                id="features"
                className="py-24 px-4 sm:px-6 lg:px-8 relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div variants={fadeInUp} className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-8">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                PRECISION TOOLS
                            </span>
                            <br />
                            FOR SEO MASTERY
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                            Advanced AI-powered analytics meet intuitive design to deliver actionable insights that drive real results.
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: <BarChart3 className="w-8 h-8" />, title: "Deep Site Audit", description: "Comprehensive analysis with AI-powered insights and actionable optimization strategies.", gradient: "from-blue-500 to-cyan-500" },
                            { icon: <TrendingUp className="w-8 h-8" />, title: "Keyword Intelligence", description: "Advanced keyword research with competitive analysis and opportunity identification.", gradient: "from-green-500 to-emerald-500" },
                            { icon: <Zap className="w-8 h-8" />, title: "Performance Optimization", description: "Speed and performance analysis with detailed recommendations for maximum impact.", gradient: "from-yellow-500 to-orange-500" },
                            { icon: <Shield className="w-8 h-8" />, title: "Security Audit", description: "Comprehensive security analysis including HTTPS, headers, and vulnerability detection.", gradient: "from-red-500 to-pink-500" },
                            { icon: <Globe className="w-8 h-8" />, title: "Backlink Analysis", description: "In-depth link profile analysis with quality assessment and opportunity mapping.", gradient: "from-purple-500 to-indigo-500" },
                            { icon: <Target className="w-8 h-8" />, title: "Local SEO", description: "Complete local search optimization with NAP consistency and schema markup analysis.", gradient: "from-teal-500 to-cyan-500" }
                        ].map((feature, index) => (
                            <ModernCard key={index} variants={fadeInUp} className="h-full">
                                <div className="flex items-start mb-6">
                                    <div className={`flex-shrink-0 inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg`}>
                                        {feature.icon}
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </ModernCard>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <motion.section
                className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-blue-900 dark:from-gray-950 dark:to-purple-950 relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
            >
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
                
                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <motion.h2
                        variants={fadeInUp}
                        className="text-5xl md:text-6xl font-black text-white mb-16 tracking-tight"
                    >
                        TRUSTED BY
                        <br />
                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            INDUSTRY LEADERS
                        </span>
                    </motion.h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        {[
                            { number: "50K+", label: "Websites Analyzed", icon: <Globe className="w-8 h-8" /> },
                            { number: "2.5M+", label: "Pages Crawled", icon: <Search className="w-8 h-8" /> },
                            { number: "99.9%", label: "Uptime Guarantee", icon: <Shield className="w-8 h-8" /> },
                            { number: "24/7", label: "Expert Support", icon: <Zap className="w-8 h-8" /> }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="group"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <div className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-gray-600/20 hover:border-cyan-400/50 transition-all duration-500 shadow-xl">
                                    <div className="text-cyan-400 mb-4 flex justify-center group-hover:scale-110 transition-transform">
                                        {stat.icon}
                                    </div>
                                    <div className="text-4xl md:text-5xl font-black text-white mb-3 group-hover:text-cyan-400 transition-colors">
                                        {stat.number}
                                    </div>
                                    <div className="text-blue-200 text-lg font-medium uppercase tracking-wide">
                                        {stat.label}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Testimonials Section */}
            <motion.section
                className="py-24 px-4 sm:px-6 lg:px-8 relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div variants={fadeInUp} className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-8">
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                SUCCESS STORIES
                            </span>
                            <br />
                            FROM OUR USERS
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
                            Join thousands of satisfied users who transformed their digital presence with our platform.
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Eleanor Vance",
                                role: "Head of Digital Strategy",
                                company: "Quantum Innovations",
                                avatar: "https://randomuser.me/api/portraits/women/6.jpg",
                                rating: 5,
                                text: "CrestNova.Sol transformed our SEO strategy completely. The depth of analysis and actionable insights led to 300% organic growth in just 6 months.",
                                gradient: "from-blue-500 to-purple-500"
                            },
                            {
                                name: "Marcus Thorne",
                                role: "Founder",
                                company: "GreenBloom Organics",
                                avatar: "https://randomuser.me/api/portraits/men/7.jpg",
                                rating: 5,
                                text: "As a small business owner, understanding SEO felt impossible. This platform made it intuitive and delivered measurable results within weeks.",
                                gradient: "from-green-500 to-teal-500"
                            },
                            {
                                name: "Sophia Renaldi",
                                role: "Lead SEO Analyst",
                                company: "Converge Digital",
                                avatar: "https://randomuser.me/api/portraits/women/8.jpg",
                                rating: 5,
                                text: "The intelligence behind these reports is remarkable. It's like having a senior SEO consultant available 24/7 with unprecedented accuracy.",
                                gradient: "from-purple-500 to-pink-500"
                            }
                        ].map((testimonial, index) => (
                            <ModernCard key={index} variants={fadeInUp} className="h-full">
                                <div className="flex items-center mb-6">
                                    <div className="relative">
                                        <img
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            className="w-16 h-16 rounded-full border-2 border-white/50 dark:border-gray-600/50 shadow-lg"
                                        />
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-300 text-sm">
                                            {testimonial.role} at {testimonial.company}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex mb-6">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                
                                <blockquote className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-lg">
                                    "{testimonial.text}"
                                </blockquote>
                            </ModernCard>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Pricing Section */}
            <motion.section
                id="pricing"
                className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-purple-900 relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div variants={fadeInUp} className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-8">
                            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                FLEXIBLE PLANS
                            </span>
                            <br />
                            FOR EVERY AMBITION
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
                            Start with powerful free insights or unlock the complete suite of advanced features.
                        </p>
                    </motion.div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {[
                            {
                                name: "BASIC FREE",
                                price: "$0",
                                period: "forever",
                                description: "Perfect for small websites and beginners",
                                features: ["1 Site Audit per day", "Essential keyword insights", "Mobile responsiveness check", "Basic SEO recommendations", "Email support"],
                                cta: "Start Your Journey",
                                popular: false,
                                gradient: "from-gray-600 to-gray-800"
                            },
                            {
                                name: "PRO UNLIMITED",
                                price: "$39",
                                period: "per month",
                                description: "Best for growing businesses and agencies",
                                features: ["Unlimited audits & reports", "Advanced keyword intelligence", "Competitor analysis suite", "White-label reporting", "Priority 24/7 support"],
                                cta: "Unlock Pro Power",
                                popular: true,
                                gradient: "from-blue-600 to-purple-600"
                            }
                        ].map((plan, index) => (
                            <ModernCard key={index} variants={fadeInUp} className={`h-full ${plan.popular ? 'border-blue-500/50 dark:border-purple-500/50 scale-105' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                            MOST POPULAR
                                        </div>
                                    </div>
                                )}
                                
                                <div className="text-center mb-10">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-wider">
                                        {plan.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                                        {plan.description}
                                    </p>
                                    <div className="flex items-baseline justify-center">
                                        <span className={`text-6xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                                            {plan.price}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400 ml-3 text-lg">
                                            /{plan.period}
                                        </span>
                                    </div>
                                </div>
                                
                                <ul className="space-y-6 mb-10">
                                    {plan.features.map((feature, featureIndex) => (
                                        <motion.li
                                            key={featureIndex}
                                            className="flex items-start"
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: featureIndex * 0.1 }}
                                        >
                                            <div className={`flex-shrink-0 w-6 h-6 bg-gradient-to-r ${plan.gradient} rounded-full flex items-center justify-center mr-4 mt-1`}>
                                                <CheckCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                                {feature}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                                
                                <motion.button
                                    className={`w-full py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {plan.cta}
                                </motion.button>
                            </ModernCard>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Contact Section */}
            <motion.section
                id="contact"
                className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 to-purple-900 dark:from-gray-950 dark:to-blue-950 relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div variants={fadeInUp} className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-black text-white mb-8">
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                GET IN TOUCH
                            </span>
                            <br />
                            WITH OUR EXPERTS
                        </h2>
                        <p className="text-xl text-blue-200 max-w-4xl mx-auto">
                            Ready to transform your digital presence? Our team is here to guide your SEO journey.
                        </p>
                    </motion.div>
                    
                    <motion.form
                        variants={fadeInUp}
                        onSubmit={handleContactSubmit}
                        className="max-w-4xl mx-auto bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-3xl p-12 border border-white/20 dark:border-gray-600/20 shadow-2xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="relative group">
                                <User className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Your Name"
                                    value={contactForm.name}
                                    onChange={handleContactChange}
                                    required
                                    className="w-full pl-16 pr-6 py-6 bg-white/5 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-lg backdrop-blur-sm"
                                />
                            </div>
                            
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Your Email"
                                    value={contactForm.email}
                                    onChange={handleContactChange}
                                    required
                                    className="w-full pl-16 pr-6 py-6 bg-white/5 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-lg backdrop-blur-sm"
                                />
                            </div>
                        </div>
                        
                        <div className="relative group mb-8">
                            <MessageSquare className="absolute left-6 top-6 text-gray-400 w-6 h-6 group-focus-within:text-cyan-400 transition-colors" />
                            <textarea
                                name="message"
                                placeholder="Tell us about your project and goals..."
                                value={contactForm.message}
                                onChange={handleContactChange}
                                required
                                rows="6"
                                className="w-full pl-16 pr-6 py-6 bg-white/5 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-lg backdrop-blur-sm resize-none"
                            />
                        </div>
                        
                        <div className="text-center">
                            <motion.button
                                type="submit"
                                className="px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Send Message
                            </motion.button>
                        </div>
                    </motion.form>
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
            >
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <motion.h2
                        variants={fadeInUp}
                        className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 leading-tight"
                    >
                        READY TO
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                            DOMINATE SEARCH?
                        </span>
                    </motion.h2>
                    
                    <motion.p
                        variants={fadeInUp}
                        className="text-2xl text-gray-600 dark:text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed"
                    >
                        Join thousands of successful businesses that transformed their digital presence with our platform.
                    </motion.p>
                    
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row gap-8 justify-center items-center"
                    >
                        <motion.button
                            className="group px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3"
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>Get FREE Advanced Audit</span>
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                        
                        <motion.button
                            className="px-12 py-6 bg-white/20 dark:bg-gray-800/40 backdrop-blur-xl border border-white/30 dark:border-gray-600/30 text-gray-700 dark:text-white font-bold text-xl rounded-2xl hover:bg-white/30 dark:hover:bg-gray-700/40 transition-all duration-300"
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Schedule Demo
                        </motion.button>
                    </motion.div>
                </div>
                
                <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl" />
                <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl" />
            </motion.section>

            
        </div>
    );
};

export default Home;