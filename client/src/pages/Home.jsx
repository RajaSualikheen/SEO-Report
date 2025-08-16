import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Search, BarChart3, Zap, Shield, Globe, TrendingUp, 
    CheckCircle, Star, ArrowRight, Play, X,
    Target
} from "lucide-react";

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";

const firebaseConfig = {
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

const Home = () => {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [showDemoResults, setShowDemoResults] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

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
        }
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

    const handleGenerateReport = () => {
        if (!url.trim()) {
            alert("Please enter a valid URL");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate("/report", { state: { websiteUrl: url.trim() } });
        }, 2500);
    };

    const handleRunDemoAudit = () => {
        setShowDemoResults(true);
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } }
    };

    const staggerContainer = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const floatingAnimation = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 overflow-hidden relative">
            {/* Elegant SVG Background Decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <svg className="absolute -bottom-40 -left-40 w-[600px] h-[600px] opacity-10" viewBox="0 0 500 500">
                    <defs>
                        <linearGradient id="geo1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <pattern id="hexPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <polygon points="30,5 50,20 50,40 30,55 10,40 10,20" fill="none" stroke="url(#geo1)" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="500" height="500" fill="url(#hexPattern)" opacity="0.4"/>
                    <g fill="url(#geo1)" opacity="0.1">
                        <polygon points="250,100 300,130 300,190 250,220 200,190 200,130"/>
                        <polygon points="250,200 300,230 300,290 250,320 200,290 200,230"/>
                    </g>
                </svg>
                <motion.svg 
                    className="absolute top-20 left-1/4 w-12 h-12 opacity-20"
                    viewBox="0 0 50 50"
                    variants={floatingAnimation}
                    animate="animate"
                >
                    <defs>
                        <linearGradient id="shard1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <polygon points="25,5 40,20 25,35 10,20" fill="url(#shard1)"/>
                </motion.svg>
                <motion.svg 
                    className="absolute top-1/3 right-1/3 w-8 h-8 opacity-15"
                    viewBox="0 0 50 50"
                    variants={floatingAnimation}
                    animate="animate"
                    transition={{ delay: 1.5 }}
                >
                    <defs>
                        <linearGradient id="shard2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                    <polygon points="25,10 35,25 25,40 15,25" fill="url(#shard2)"/>
                </motion.svg>
                <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-5" viewBox="0 0 800 400">
                    <defs>
                        <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <path d="M0,200 Q200,100 400,200 T800,200" stroke="url(#wave2)" strokeWidth="2" fill="none" opacity="0.8"/>
                    <path d="M0,180 Q200,80 400,180 T800,180" stroke="url(#wave2)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                </svg>
                <motion.div 
                    className="absolute top-1/5 right-1/5 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30"
                    variants={floatingAnimation}
                    animate="animate"
                    transition={{ delay: 2.2 }}
                />
                <motion.div 
                    className="absolute top-2/3 left-1/4 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-20"
                    variants={floatingAnimation}
                    animate="animate"
                    transition={{ delay: 1.8 }}
                />
            </div>

            <Navbar user={currentUser} handleLogout={handleLogout} />

            {/* Hero Section */}
            <motion.section 
                className="relative z-10 py-20 px-4 sm:px-6 lg:px-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div variants={fadeInUp} className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
                        <Star className="w-4 h-4 mr-2" />
                        Trusted by thousands of websites worldwide
                    </motion.div>
                    <motion.h1 
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight"
                    >
                        Unlock Your Website's
                        <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                            SEO Potential
                        </span>
                    </motion.h1>
                    <motion.p 
                        variants={fadeInUp}
                        className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed"
                    >
                        Unleash the full potential of your website with deep analytics, actionable strategies, and real-time performance insights.
                    </motion.p>
                    <motion.div 
                        variants={fadeInUp}
                        className="max-w-3xl mx-auto mb-10"
                    >
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/50">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="url"
                                        placeholder="Enter your website URL (e.g., https://yourbrand.com)"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white/90 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                                        aria-label="Website URL input"
                                    />
                                </div>
                                <motion.button
                                    onClick={handleGenerateReport}
                                    disabled={loading}
                                    className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:-translate-y-1 transition-all text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                            <span>Analyzing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Initiate Deep Scan</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                            <p className="text-sm text-slate-500 mt-4 text-center">
                                Free analysis • No signup required • Instant results
                            </p>
                        </div>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <button
                            onClick={handleRunDemoAudit}
                            className="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                            aria-label="Run demo audit"
                        >
                            <Play className="w-5 h-5" />
                            <span>Run Demo Audit for example.com</span>
                        </button>
                    </motion.div>
                </div>
            </motion.section>

            {/* Demo Results Modal */}
            {showDemoResults && (
                <motion.div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowDemoResults(false)}
                >
                    <motion.div 
                        className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-900">
                                Audit Snapshot for <a href="https://example.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">example.com</a>
                            </h3>
                            <button 
                                onClick={() => setShowDemoResults(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-slate-800">Overall Score</h4>
                                    <div className="text-3xl font-bold text-green-600">{demoReportPreview.overallScore}/100</div>
                                </div>
                                <div className="w-full bg-green-200 rounded-full h-2">
                                    <motion.div 
                                        className="bg-green-500 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${demoReportPreview.overallScore}%` }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                                <h4 className="font-semibold text-slate-800 mb-4">Category Breakdown</h4>
                                <div className="space-y-3">
                                    {Object.entries(demoReportPreview.categoryScores).map(([categoryName, data]) => (
                                        <div key={categoryName} className="flex justify-between">
                                            <span className="text-slate-600">{categoryName}</span>
                                            <span className="font-semibold" style={{ color: data.percentage >= 80 ? '#22C55E' : data.percentage >= 60 ? '#F97316' : '#EF4444' }}>
                                                {data.score}/{data.max}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center">
                            <motion.button
                                onClick={() => navigate("/signup")}
                                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Get Your Personalized Free Audit
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Features Section */}
            <motion.section 
                id="features"
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div variants={fadeInUp} className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                            Everything You Need for
                            <span className="block text-blue-600">SEO Success</span>
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            From technical deep dives to content optimization, CrestNova.Sol provides the clarity you need to succeed.
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="w-8 h-8" />,
                                title: "Deep Site Audit",
                                description: "Comprehensive analysis of your website's SEO health with actionable reports.",
                                color: "from-blue-500 to-cyan-500"
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8" />,
                                title: "Advanced Keyword Insights",
                                description: "Uncover high-potential keywords and analyze competitive landscape with precision.",
                                color: "from-green-500 to-emerald-500"
                            },
                            {
                                icon: <Zap className="w-8 h-8" />,
                                title: "Performance Optimization",
                                description: "Get actionable insights to reduce load times and improve overall site performance.",
                                color: "from-yellow-500 to-orange-500"
                            },
                            {
                                icon: <Shield className="w-8 h-8" />,
                                title: "Robust Security Audit",
                                description: "Verify HTTPS, robots.txt, and other security measures that impact SEO and trust.",
                                color: "from-red-500 to-pink-500"
                            },
                            {
                                icon: <Globe className="w-8 h-8" />,
                                title: "Backlink Opportunities",
                                description: "Analyze your link profile and identify opportunities to build high-quality backlinks.",
                                color: "from-purple-500 to-indigo-500"
                            },
                            {
                                icon: <Target className="w-8 h-8" />,
                                title: "Local SEO Dominance",
                                description: "Optimize your presence for local searches with NAP data, schema, and map integrations.",
                                color: "from-teal-500 to-cyan-500"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 group"
                                whileHover={{ y: -5 }}
                            >
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Stats Section */}
            <motion.section 
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-50 to-purple-50 relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
            >
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="crystalBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                            </linearGradient>
                        </defs>
                        <polygon points="0,150 50,80 100,120 150,60 200,100 250,40 300,80 350,120 400,90" fill="url(#crystalBg)" opacity="0.3"/>
                        <g fill="url(#crystalBg)" opacity="0.15">
                            <polygon points="100,50 110,40 120,50 110,60" transform="rotate(45 110 50)"/>
                        </g>
                    </svg>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto text-center">
                    <motion.h2 
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-bold text-slate-900 mb-12"
                    >
                        Trusted by Industry Leaders
                    </motion.h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { number: "50K+", label: "Websites Analyzed" },
                            { number: "2.5M+", label: "Pages Crawled" },
                            { number: "99.9%", label: "Uptime" },
                            { number: "24/7", label: "Support" }
                        ].map((stat, index) => (
                            <motion.div 
                                key={index} 
                                variants={fadeInUp} 
                                className="text-center"
                            >
                                <div className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">{stat.number}</div>
                                <div className="text-blue-600 text-lg">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <motion.div 
                    className="absolute top-20 right-10 w-10 h-10 opacity-20"
                    variants={floatingAnimation}
                    animate="animate"
                >
                    <svg viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="statShard" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,5 40,20 25,35 10,20" fill="url(#statShard)" />
                    </svg>
                </motion.div>
            </motion.section>

            {/* Testimonials Section */}
            <motion.section 
                className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        variants={fadeInUp} 
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                            What Our Users Say
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            Join thousands of satisfied users who are already outranking their competition with CrestNova.Sol.
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
                                text: "CrestNova.Sol is an absolute game-changer. The depth of analysis and actionable advice propelled our organic traffic beyond expectations!"
                            },
                            {
                                name: "Marcus Thorne",
                                role: "Founder",
                                company: "GreenBloom Organics",
                                avatar: "https://randomuser.me/api/portraits/men/7.jpg",
                                rating: 5,
                                text: "As a small business, understanding SEO was daunting. CrestNova.Sol made it incredibly simple, leading to tangible growth in just weeks."
                            },
                            {
                                name: "Sophia Renaldi",
                                role: "Lead SEO Analyst",
                                company: "Converge Digital",
                                avatar: "https://randomuser.me/api/portraits/women/8.jpg",
                                rating: 5,
                                text: "Their reports are not just comprehensive; they're genuinely intelligent. It's like having a senior SEO consultant on demand."
                            }
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="flex items-center mb-6">
                                    <img 
                                        src={testimonial.avatar} 
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full mr-4"
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                                        <div className="text-slate-600 text-sm">{testimonial.role} at {testimonial.company}</div>
                                    </div>
                                </div>
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-slate-700 leading-relaxed">"{testimonial.text}"</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Screenshots Preview (Conceptual) */}
            <motion.section 
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        variants={fadeInUp} 
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                            Your Data, Beautifully Presented
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            Access intuitive dashboards and crystal-clear visualizations to monitor your SEO progress with ease.
                        </p>
                    </motion.div>
                    <motion.div
                        variants={fadeInUp}
                        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 border border-white/50 hover:shadow-2xl transition-all duration-300"
                    >
                        <img
                            src="https://via.placeholder.com/1600x900/4a00e0/8e29e0?text=CrestNova.Sol+Dashboard+Preview"
                            alt="SEO Dashboard Preview"
                            className="rounded-lg w-full h-auto object-cover border border-slate-200"
                        />
                    </motion.div>
                </div>
                <motion.div 
                    className="absolute top-20 left-10 w-10 h-10 opacity-20"
                    variants={floatingAnimation}
                    animate="animate"
                >
                    <svg viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="screenshotShard" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,5 40,20 25,35 10,20" fill="url(#screenshotShard)" />
                    </svg>
                </motion.div>
            </motion.section>

            {/* Pricing Section */}
            <motion.section 
                id="pricing"
                className="py-20 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 800 400">
                        <defs>
                            <linearGradient id="pricingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                            </linearGradient>
                            <filter id="pricingGlow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge> 
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <g fill="url(#pricingGradient)" filter="url(#pricingGlow)" opacity="0.4">
                            <polygon points="100,100 150,50 200,100 150,150" />
                            <polygon points="500,150 550,100 600,150 550,200" />
                            <circle cx="700" cy="200" r="10" />
                        </g>
                        <g stroke="url(#pricingGradient)" strokeWidth="1" fill="none" opacity="0.2">
                            <line x1="100" y1="100" x2="200" y2="100" />
                            <line x1="500" y1="150" x2="600" y2="150" />
                        </g>
                    </svg>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto">
                    <motion.div 
                        variants={fadeInUp} 
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                            Flexible Plans for Every Ambition
                        </h2>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                            Start with a powerful free audit or unlock our complete suite of advanced features for unparalleled growth.
                        </p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                name: "Basic Free",
                                price: "$0",
                                period: "forever",
                                description: "Perfect for small websites and beginners",
                                features: [
                                    "1 Site Audit / day",
                                    "Top Keyword Insights",
                                    "Mobile Responsiveness Check",
                                    "Basic SEO Recommendations",
                                    "Email Support"
                                ],
                                cta: "Start Your Free Journey",
                                popular: false
                            },
                            {
                                name: "Pro Unlimited",
                                price: "$39",
                                period: "per month",
                                description: "Best for growing businesses and agencies",
                                features: [
                                    "All Basic Features",
                                    "Unlimited Audits & Reports",
                                    "Advanced Keyword Tools",
                                    "Competitor Analysis",
                                    "Priority Support"
                                ],
                                cta: "Unlock Pro Power",
                                popular: true
                            }
                        ].map((plan, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className={`relative bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 ${
                                    plan.popular 
                                        ? 'border-blue-500 transform scale-105' 
                                        : 'hover:border-blue-300'
                                } transition-all duration-300 hover:shadow-2xl`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <p className="text-slate-600 mb-4">{plan.description}</p>
                                    <div className="flex items-baseline justify-center">
                                        <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                                        <span className="text-slate-600 ml-2">/{plan.period}</span>
                                    </div>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <span className="text-slate-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <motion.button
                                    onClick={() => navigate("/signup")}
                                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:-translate-y-1'
                                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {plan.cta}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>
                </div>
                <motion.div 
                    className="absolute top-20 left-10 w-10 h-10 opacity-20"
                    variants={floatingAnimation}
                    animate="animate"
                >
                    <svg viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="pricingShard1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,5 40,20 25,35 10,20" fill="url(#pricingShard1)" />
                    </svg>
                </motion.div>
                <motion.div 
                    className="absolute bottom-20 right-10 w-12 h-12 opacity-15"
                    variants={floatingAnimation}
                    animate="animate"
                    transition={{ delay: 1.5 }}
                >
                    <svg viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="pricingShard2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,10 35,25 25,40 15,25" fill="url(#pricingShard2)" />
                    </svg>
                </motion.div>
            </motion.section>

            {/* CTA Section */}
            <motion.section 
                className="py-20 px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
            >
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 800 400">
                        <defs>
                            <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                            </linearGradient>
                            <filter id="ctaGlow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge> 
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <g fill="url(#ctaGradient)" filter="url(#ctaGlow)" opacity="0.4">
                            <polygon points="100,100 150,50 200,100 150,150" />
                            <polygon points="500,150 550,100 600,150 550,200" />
                            <circle cx="700" cy="200" r="10" />
                        </g>
                        <g stroke="url(#ctaGradient)" strokeWidth="1" fill="none" opacity="0.2">
                            <line x1="100" y1="100" x2="200" y2="100" />
                            <line x1="500" y1 ="150" x2="600" y2="150" />
                        </g>
                    </svg>
                </div>
                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <motion.h2 
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight"
                    >
                        Ready to Revolutionize Your Rankings?
                    </motion.h2>
                    <motion.p 
                        variants={fadeInUp}
                        className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        Join thousands of satisfied users who are already outranking their competition with CrestNova.Sol.
                    </motion.p>
                    <motion.div 
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <motion.button
                            onClick={() => navigate("/signup")}
                            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all text-lg flex items-center space-x-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Get free SEO audit"
                        >
                            <span>Get Your FREE, Advanced SEO Audit Now!</span>
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                            className="px-6 py-4 bg-gray-100 text-slate-900 font-semibold rounded-xl hover:bg-gray-200 border border-gray-300 transform hover:-translate-y-1 transition-all text-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Schedule a demo"
                        >
                            Schedule Demo
                        </motion.button>
                    </motion.div>
                </div>
                <motion.div 
                    className="absolute top-20 left-10 w-12 h-12 opacity-20"
                    variants={floatingAnimation}
                    animate="animate"
                >
                    <svg viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="ctaShard1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,5 40,20 25,35 10,20" fill="url(#ctaShard1)" />
                    </svg>
                </motion.div>
                <motion.div 
                    className="absolute bottom-20 right-10 w-10 h-10 opacity-15"
                    variants={floatingAnimation}
                    animate="animate"
                    transition={{ delay: 1.5 }}
                >
                    <svg viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="ctaShard2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,10 35,25 25,40 15,25" fill="url(#ctaShard2)" />
                    </svg>
                </motion.div>
            </motion.section>

            <Footer />
        </div>
    );
};

export default Home;