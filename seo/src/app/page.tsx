// src/app/page.tsx
'use client';

import React, { useState, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Search, FileText, Code, Lightbulb, ShieldCheck, Link as LucideLink, Smartphone, Zap, MapPin,
    ArrowRight, PlayCircle, Star, DollarSign, CheckCircle, XCircle, BarChart2, ExternalLink,
    Maximize, TrendingUp, Cpu, Users, Layers, Cloud, Globe, Target
} from "lucide-react";

// Define types for demoReportPreview
interface CategoryScore {
    score: number;
    max: number;
    percentage: number;
}

interface DemoReportPreview {
    overallScore: number;
    categoryScores: {
        Content: CategoryScore;
        Technical: CategoryScore;
        'User Experience': CategoryScore;
        Security: CategoryScore;
        'Off-Page': CategoryScore;
    };
}

// Inline helper for the Circular Progress Bar for demoReportPreview
interface CircleProps {
    percent: number;
    strokeWidth: number;
    strokeColor: string;
    trailColor: string;
    trailWidth: number;
    strokeLinecap: 'butt' | 'round' | 'square';
}

const Circle: React.FC<CircleProps> = ({
    percent,
    strokeWidth,
    strokeColor,
    trailColor,
    trailWidth,
    strokeLinecap,
}) => {
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={trailColor}
                strokeWidth={trailWidth}
            />
            <motion.circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeLinecap={strokeLinecap}
                transform="rotate(-90 50 50)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
        </svg>
    );
};


const Landing: React.FC = () => {
    const [url, setUrl] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [showDemoResults, setShowDemoResults] = useState<boolean>(false);
    const [isClient, setIsClient] = useState<boolean>(false); // New state for client-side rendering
    const router = useRouter();

    // Set isClient to true once the component mounts on the client
    useEffect(() => {
        setIsClient(true);
    }, []);

    const demoReportPreview: DemoReportPreview = {
        overallScore: 82,
        categoryScores: {
            Content: { score: 28, max: 30, percentage: (28 / 30) * 100 },
            Technical: { score: 24, max: 25, percentage: (24 / 25) * 100 },
            'User Experience': { score: 20, max: 25, percentage: (20 / 25) * 100 },
            Security: { score: 14, max: 15, percentage: (14 / 15) * 100 },
            'Off-Page': { score: 4, max: 5, percentage: (4 / 5) * 100 },
        }
    };

    const handleGenerateReport = (): void => {
        if (!url.trim()) {
            alert("Please enter a valid URL");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push(`/report?url=${encodeURIComponent(url.trim())}`);
        }, 2500);
    };

    const handleRunDemoAudit = (): void => {
        setShowDemoResults(true);
    };

    // Framer Motion variants
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] } },
    };

    const staggerContainer = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            },
        },
    };

    const itemSlideUp = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
    };

    const gradientShift = {
        animate: {
            backgroundPosition: ['0% 0%', '100% 100%'],
            transition: {
                duration: 40,
                repeat: Infinity,
                ease: "linear",
                repeatType: "mirror" as const
            }
        }
    };

    // Data for generating bubbles
    const numberOfBubbles: number = 40;
    const bubbleSizes: number[] = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
    const bubbleColors: string[] = ['bg-blue-300', 'bg-purple-300', 'bg-blue-500', 'bg-purple-500', 'bg-white'];


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-500 overflow-hidden">
            <header className="relative pt-24 pb-48 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden min-h-[750px] md:min-h-[850px] lg:min-h-[900px] bg-gradient-to-br from-gray-900 to-black dark:from-gray-950 dark:to-black-900">
                {/* Background Layer 1: Deep, Shifting Gradient Background */}
                <motion.div
                    className="absolute inset-0 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    style={{
                        background: `radial-gradient(circle at 10% 20%, rgba(26,32,44,0.8), transparent),
                                     radial-gradient(circle at 90% 80%, rgba(74,0,224,0.4), transparent),
                                     radial-gradient(circle at 50% 10%, rgba(59,130,246,0.2), transparent)`,
                        backgroundBlendMode: 'screen',
                        backgroundSize: '200% 200%'
                    }}
                    variants={gradientShift}
                    animate="animate"
                />

                {/* Background Layer 2: Animated Bubbles (Conditionally rendered on client) */}
                {isClient && ( // Only render this block on the client
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {Array.from({ length: numberOfBubbles }).map((_, i) => {
                            const size = bubbleSizes[Math.floor(Math.random() * bubbleSizes.length)];
                            const startX = Math.random() * 100;
                            const duration = 20 + Math.random() * 20;
                            const delay = Math.random() * 8;
                            const colorClass = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
                            const opacityBase = 0.05 + Math.random() * 0.1;

                            return (
                                <motion.div
                                    key={i}
                                    className={`absolute rounded-full ${colorClass}`}
                                    style={{
                                        width: size,
                                        height: size,
                                        left: `${startX}%`,
                                        bottom: `-${size}px`,
                                        filter: `blur(${size / 15}px)`,
                                        opacity: opacityBase
                                    }}
                                    initial={{ y: 0, x: 0, opacity: 0 }}
                                    animate={{
                                        y: [`0vh`, `-120vh`],
                                        x: [`${startX}%`, `${startX + (Math.random() - 0.5) * 30}%`],
                                        scale: [1, 1 + Math.random() * 0.3, 1],
                                        opacity: [0, opacityBase + Math.random() * 0.1, opacityBase + Math.random() * 0.05, 0],
                                    }}
                                    transition={{
                                        duration: duration,
                                        ease: "linear",
                                        repeat: Infinity,
                                        delay: delay,
                                    }}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Layer 3: Floating, Blurred Orbs/Glows (Conditionally rendered on client) */}
                {isClient && ( // Only render this block on the client
                    <>
                        <motion.div
                            className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-subtle-float animation-delay-0"
                        />
                        <motion.div
                            className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-subtle-float animation-delay-3000"
                        />
                    </>
                )}

                {/* Main Content */}
                <motion.div
                    className="relative z-30 flex flex-col items-center max-w-6xl px-4 py-12"
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                >
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-7 drop-shadow-3xl tracking-tight lg:tracking-tighter">
                        <motion.span
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300"
                        >
                            AI-Powered SEO Mastery
                        </motion.span> <br />
                        <motion.span
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="inline-block text-white"
                        >
                            Elevate Your Digital Presence.
                        </motion.span>
                    </h1>
                    <p className="text-xl sm:text-2xl lg:text-2xl text-blue-100 opacity-90 mb-14 max-w-4xl font-light leading-relaxed drop-shadow-lg tracking-wide">
                        Unleash the full potential of your website with deep analytics, actionable strategies, and real-time performance insights.
                    </p>

                    {/* Input & Button Container (Premium Frosted Glass) */}
                    <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-6 backdrop-filter backdrop-blur-xl bg-white/5 dark:bg-gray-800/10 p-6 rounded-3xl shadow-4xl border border-white/10 dark:border-gray-700/20">
                        <input
                            type="url"
                            placeholder="Enter your website URL (e.g., https://yourbrand.com)"
                            value={url}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                            className="flex-grow p-4 md:p-5 bg-white/5 dark:bg-gray-700/10 text-white placeholder-blue-100 dark:placeholder-gray-400 rounded-xl shadow-inner focus:ring-4 focus:ring-blue-300 focus:border-transparent transition duration-300 w-full text-lg outline-none backdrop-blur-sm border border-white/5 dark:border-gray-700/5"
                            aria-label="Website URL input"
                        />
                        <motion.button
                            onClick={handleGenerateReport}
                            className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-extrabold py-4 md:py-5 px-10 rounded-xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition duration-300 ease-in-out text-xl w-full sm:w-auto flex items-center justify-center space-x-3 group relative overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-300"
                            whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.4)" }}
                            whileTap={{ scale: 0.97 }}
                            disabled={loading}
                        >
                            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <span>Initiate Deep Scan</span>
                                    <ArrowRight className="w-6 h-6 ml-3 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </motion.button>
                    </div>
                    {loading && <p className="mt-10 text-white font-medium text-lg opacity-90 drop-shadow-md">Processing cutting-edge SEO metrics...</p>}
                </motion.div>
            </header>

            {/* Rest of the Landing.jsx content (Live Demo, Features, How it Works, Testimonials, Pricing, Final CTA) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
                <motion.div
                    className="container mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                        Experience the Power: Instant Preview
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto">
                        Run a quick, anonymized audit on a sample domain and see the depth of analysis you'll unlock.
                    </p>

                    <motion.button
                        onClick={handleRunDemoAudit}
                        className="bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-3.5 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 ease-in-out text-lg flex items-center justify-center mx-auto mb-12 group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <PlayCircle className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                        Run Demo Audit for example.com
                        <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                    </motion.button>

                    {showDemoResults && (
                        <motion.div
                            className="bg-white dark:bg-gray-950 p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-5xl mx-auto overflow-hidden relative"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-left">
                                Audit Snapshot for <a href="https://example.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">example.com</a>
                            </h3>
                            <div className="flex flex-col md:flex-row items-center justify-around space-y-8 md:space-y-0 md:space-x-12">
                                {/* Overall Score Circular Progress */}
                                <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0">
                                    <Circle
                                        percent={demoReportPreview.overallScore}
                                        strokeWidth={10}
                                        strokeColor="#3b82f6"
                                        trailColor="#e0e0e0"
                                        trailWidth={8}
                                        strokeLinecap="round"
                                    />
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                        <span className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">{demoReportPreview.overallScore}</span>
                                        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2">Overall Score</p>
                                    </div>
                                </div>

                                {/* Category Breakdown Bars (Mini Version) */}
                                <div className="w-full md:flex-grow space-y-3">
                                    {Object.entries(demoReportPreview.categoryScores).map(([categoryName, data]) => (
                                        <div key={categoryName} className="flex items-center space-x-3">
                                            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.percentage >= 80 ? '#22C55E' : data.percentage >= 60 ? '#F97316' : '#EF4444' }}></span>
                                            <span className="flex-grow text-base font-medium text-gray-700 dark:text-gray-300 text-left">{categoryName}</span>
                                            <div className="relative w-32 bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                                                <motion.div
                                                    className="h-3 rounded-full"
                                                    style={{
                                                        width: `${data.percentage}%`,
                                                        backgroundColor: data.percentage >= 80 ? '#22C55E' : data.percentage >= 60 ? '#F97316' : '#EF4444',
                                                    }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${data.percentage}%` }}
                                                    transition={{ duration: 0.6, delay: 0.3 }}
                                                />
                                            </div>
                                            <span className="w-12 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
                                                {data.score}/{data.max}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-10 text-center">
                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                                    This glimpse reveals your site's potential. Unlock comprehensive data, actionable steps, and advanced features with a full audit.
                                </p>
                                <motion.button
                                    onClick={() => router.push("/signup")}
                                    className="bg-purple-600 text-white font-bold py-3.5 px-10 rounded-full shadow-lg hover:bg-purple-700 transform hover:-translate-y-1 transition duration-300 ease-in-out text-lg group"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Get Your Personalized Free Audit
                                    <ArrowRight className="w-5 h-5 ml-3 transition-transform group-hover:translate-x-1" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* Visual Feature Grid */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
                <motion.div
                    className="container mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                        Comprehensive Toolset for Every SEO Need
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto">
                        From technical deep dives to content optimization, CrestNova.Sol provides the clarity you need to succeed.
                    </p>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        variants={staggerContainer}
                    >
                        {[
                            { icon: BarChart2, title: "Deep Site Audit", description: "Comprehensive analysis of your website's SEO health with actionable reports." },
                            { icon: TrendingUp, title: "Advanced Keyword Insights", description: "Uncover high-potential keywords and analyze competitive landscape with precision." },
                            { icon: Cpu, title: "Technical SEO Mastery", description: "Diagnose and fix critical technical issues affecting crawlability and indexing." },
                            { icon: Smartphone, title: "Mobile Experience Optimization", description: "Ensure seamless user experience and performance across all mobile devices." },
                            { icon: ShieldCheck, title: "Robust Security Audit", description: "Verify HTTPS, robots.txt, and other security measures that impact SEO and trust." },
                            { icon: MapPin, title: "Local SEO Dominance", description: "Optimize your presence for local searches with NAP data, schema, and map integrations." },
                            { icon: LucideLink, title: "Backlink Opportunities", description: "Analyze your link profile and identify opportunities to build high-quality backlinks." },
                            { icon: Zap, title: "Performance Optimization", description: "Get actionable insights to reduce load times and improve overall site performance." },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center text-center border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition duration-300 ease-in-out group"
                                variants={itemSlideUp}
                                whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
                            >
                                {/* Subtle background hover effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                <div className="mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors relative z-10 shadow-md">
                                    {React.createElement(feature.icon, { className: "w-9 h-9" })}
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 relative z-10">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base relative z-10">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* How it Works */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
                <motion.div
                    className="container mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-12 leading-tight">
                        Your Path to SEO Excellence in 3 Steps
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: 1, title: "Analyze Your Site", description: "Effortlessly input your URL and let our intelligent algorithms scan every detail." },
                            { step: 2, title: "Receive Actionable Insights", description: "Get a beautifully presented, comprehensive report with clear, prioritized recommendations." },
                            { step: 3, title: "Optimize & Outrank", description: "Implement our expert guidance to fix issues, improve performance, and climb search rankings." },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="flex flex-col items-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg relative overflow-hidden group"
                                variants={itemSlideUp}
                                whileHover={{ scale: 1.03, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                            >
                                <span className="absolute inset-0 bg-blue-500/10 dark:bg-blue-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-4xl font-extrabold mb-6 shadow-xl relative z-10">
                                    {item.step}
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 relative z-10">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-xs text-base relative z-10">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Screenshots Preview (Conceptual) */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
                <motion.div
                    className="container mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                        Your Data, Beautifully Presented
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto">
                        Access intuitive dashboards and crystal-clear visualizations to monitor your SEO progress with ease.
                    </p>
                    <motion.div
                        className="bg-gray-100 dark:bg-gray-950 rounded-xl shadow-2xl p-6 md:p-10 border border-gray-200 dark:border-gray-800 relative overflow-hidden"
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {/* Mock Dashboard Image - Use a visually rich placeholder */}
                        <img
                            src="https://via.placeholder.com/1600x900/4a00e0/8e29e0?text=CrestNova.Sol+Dashboard+Preview"
                            alt="SEO Dashboard Preview"
                            className="rounded-lg shadow-xl w-full h-auto object-cover border border-gray-300 dark:border-gray-700"
                        />
                        {/* Animated overlay for effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0"
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.div>
                </motion.div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 transition-colors duration-500">
                <motion.div
                    className="container mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-12 leading-tight">
                        Hear What Our Users Say
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {[
                            {
                                quote: "CrestNova.Sol is an absolute game-changer. The depth of analysis and actionable advice propelled our organic traffic beyond expectations!",
                                author: "Eleanor Vance",
                                title: "Head of Digital Strategy at 'Quantum Innovations'",
                                avatar: "https://randomuser.me/api/portraits/women/6.jpg"
                            },
                            {
                                quote: "As a small business, understanding SEO was daunting. CrestNova.Sol made it incredibly simple, leading to tangible growth in just weeks.",
                                author: "Marcus Thorne",
                                title: "Founder of 'GreenBloom Organics'",
                                avatar: "https://randomuser.me/api/portraits/men/7.jpg"
                            },
                            {
                                quote: "Their reports are not just comprehensive; they're genuinely intelligent. It's like having a senior SEO consultant on demand.",
                                author: "Sophia Renaldi",
                                title: "Lead SEO Analyst at 'Converge Digital'",
                                avatar: "https://randomuser.me/api/portraits/women/8.jpg"
                            },
                        ].map((testimonial, index) => (
                            <motion.div
                                key={index}
                                className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center border border-gray-200 dark:border-gray-700 flex flex-col items-center transform hover:-translate-y-2 transition duration-300 ease-in-out group relative overflow-hidden"
                                variants={itemSlideUp}
                                whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
                            >
                                {/* Subtle quote background */}
                                <div className="absolute inset-0 bg-blue-500/5 dark:bg-purple-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                <img
                                    src={testimonial.avatar}
                                    alt={`Avatar of ${testimonial.author}`}
                                    className="w-24 h-24 rounded-full mb-6 object-cover border-4 border-blue-300 dark:border-purple-600 shadow-md relative z-10"
                                />
                                <div className="flex text-yellow-500 mb-4 relative z-10">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 fill-current" />
                                    ))}
                                </div>
                                <p className="text-xl italic text-gray-700 dark:text-gray-300 mb-5 relative z-10 leading-relaxed">
                                    "{testimonial.quote}"
                                </p>
                                <p className="font-extrabold text-lg text-gray-900 dark:text-gray-100 relative z-10">
                                    {testimonial.author}
                                </p>
                                <p className="text-base text-blue-600 dark:text-blue-300 relative z-10">
                                    {testimonial.title}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Pricing Plans Preview */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
                <motion.div
                    className="container mx-auto text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                >
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                        Flexible Plans for Every Ambition
                    </h2>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto">
                        Start with a powerful free audit or unlock our complete suite of advanced features for unparalleled growth.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <motion.div
                            className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-xl border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transform hover:-translate-y-2 transition duration-300 ease-in-out relative overflow-hidden group"
                            variants={itemSlideUp}
                            whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.15)" }}
                        >
                            {/* Subtle background glow on hover */}
                            <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 relative z-10">Basic Free</h3>
                            <p className="text-6xl font-extrabold text-blue-600 mb-8 flex items-center justify-center relative z-10">
                                $0<span className="text-2xl font-medium text-gray-500 ml-3">/month</span>
                            </p>
                            <ul className="text-left space-y-4 mb-10 text-lg relative z-10">
                                <li className="flex items-center text-gray-700 dark:text-gray-300">
                                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />1 Site Audit / day
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-gray-300">
                                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />Top Keyword Insights
                                </li>
                                <li className="flex items-center text-gray-700 dark:text-gray-300">
                                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />Mobile Responsiveness Check
                                </li>
                                <li className="flex items-center text-gray-500 dark:text-gray-400 opacity-60">
                                    <XCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />Advanced Analytics
                                </li>
                                <li className="flex items-center text-gray-500 dark:text-gray-400 opacity-60">
                                    <XCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />Competitor Monitoring
                                </li>
                            </ul>
                            <motion.button
                                onClick={() => router.push("/signup")}
                                className="w-full bg-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-md hover:bg-blue-700 transform hover:-translate-y-1 transition duration-300 ease-in-out text-xl relative z-10"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Start Your Free Journey
                            </motion.button>
                        </motion.div>

                        {/* Premium Plan */}
                        <motion.div
                            className="bg-gradient-to-br from-blue-600 to-purple-700 text-white p-10 rounded-xl shadow-2xl border-2 border-blue-400 transform hover:scale-102 transition duration-300 ease-in-out relative overflow-hidden group"
                            variants={itemSlideUp}
                            whileHover={{ boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                        >
                            <span className="absolute top-0 right-0 bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-bl-lg">Most Popular</span>
                            <h3 className="text-3xl font-extrabold mb-4 relative z-10">Pro Unlimited</h3>
                            <p className="text-6xl font-extrabold mb-8 flex items-center justify-center relative z-10">
                                $39<span className="text-2xl font-medium text-blue-100 ml-3">/month</span>
                            </p>
                            <ul className="text-left space-y-4 mb-10 text-lg relative z-10">
                                <li className="flex items-center text-blue-100">
                                    <CheckCircle className="w-6 h-6 text-green-300 mr-3 flex-shrink-0" />All Basic Features
                                </li>
                                <li className="flex items-center text-blue-100">
                                    <CheckCircle className="w-6 h-6 text-green-300 mr-3 flex-shrink-0" />Unlimited Audits & Reports
                                </li>
                                <li className="flex items-center text-blue-100">
                                    <CheckCircle className="w-6 h-6 text-green-300 mr-3 flex-shrink-0" />Advanced Keyword Tools
                                </li>
                                <li className="flex items-center text-blue-100">
                                    <CheckCircle className="w-6 h-6 text-green-300 mr-3 flex-shrink-0" />Competitor Analysis
                                </li>
                                <li className="flex items-center text-blue-100">
                                    <CheckCircle className="w-6 h-6 text-green-300 mr-3 flex-shrink-0" />Priority Support
                                </li>
                            </ul>
                            <motion.button
                                onClick={() => router.push("/signup")}
                                className="w-full bg-white text-purple-700 font-bold py-4 px-8 rounded-lg shadow-md hover:bg-gray-100 transform hover:-translate-y-1 transition duration-300 ease-in-out text-xl relative z-10"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Unlock Pro Power
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Final Call to Action - Expanded and Prominent */}
            <motion.section
                className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-700 to-purple-800 dark:from-gray-800 dark:to-gray-900 text-white text-center shadow-inner"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
                    Ready to Revolutionize Your Rankings?
                </h2>
                <p className="text-xl sm:text-2xl opacity-90 mb-12 max-w-4xl mx-auto font-light drop-shadow-md">
                    Join thousands of satisfied users who are already outranking their competition with CrestNova.Sol.
                </p>
                <motion.button
                    onClick={() => router.push("/signup")}
                    className="bg-white text-blue-700 font-extrabold py-5 px-12 rounded-full shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition duration-300 ease-in-out text-2xl flex items-center justify-center mx-auto group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Get Your FREE, Advanced SEO Audit Now!
                    <ArrowRight className="w-7 h-7 ml-4 transition-transform group-hover:translate-x-2" />
                </motion.button>
            </motion.section>
        </div>
    );
};

export default Landing;