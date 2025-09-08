/* eslint-disable no-irregular-whitespace */
// src/pages/Features.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart3, Zap, Shield, Globe, TrendingUp, Target,
    Layers, SearchCode, Bot, Users, ArrowRight
} from "lucide-react";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

// Assume these components are extracted from Home.jsx for reusability
import {
    AnimatedBackgrounds, // Component combining FloatingParticles, AnimatedOrbs, CircuitBackground
    ModernCard, // Reusable card component with backdrop-blur
    fadeInUp, // Framer Motion variants
    staggerContainer
} from "../components/reusableComponents"; // Place these in a new file

// Firebase initialization



const Features = () => {
   
    const navigate = useNavigate();

    

    

    const featureCategories = [
        {
            category: "On-Page & Technical SEO",
            headingGradient: "from-purple-600 to-pink-600",
            description: "Everything you need to ensure your website is technically sound and perfectly optimized.",
            items: [
                { icon: <BarChart3 className="w-8 h-8" />, title: "Deep Site Audit", description: "Comprehensive analysis of your website's SEO health with actionable, prioritized reports.", gradient: "from-blue-500 to-cyan-500" },
                { icon: <Zap className="w-8 h-8" />, title: "Performance Optimization", description: "Get insights to reduce load times, optimize images, and improve Core Web Vitals.", gradient: "from-green-500 to-emerald-500" },
                { icon: <Shield className="w-8 h-8" />, title: "Robust Security Audit", description: "Verify HTTPS, robots.txt, sitemaps, and other security measures that impact SEO and trust.", gradient: "from-yellow-500 to-orange-500" },
                { icon: <SearchCode className="w-8 h-8" />, title: "Schema & Meta Analysis", description: "Ensure your meta tags and structured data are correctly implemented for rich results.", gradient: "from-red-500 to-pink-500" },
            ]
        },
        {
            category: "Keyword & Content Strategy",
            headingGradient: "from-green-600 to-blue-600",
            description: "Discover opportunities and create content that ranks higher and engages your audience.",
            items: [
                { icon: <TrendingUp className="w-8 h-8" />, title: "Advanced Keyword Insights", description: "Uncover high-potential keywords, analyze their difficulty, and track your rankings over time.", gradient: "from-purple-500 to-indigo-500" },
                { icon: <Layers className="w-8 h-8" />, title: "Competitor Content Analysis", description: "Analyze top-ranking pages to understand their content structure and keyword strategy.", gradient: "from-teal-500 to-cyan-500" },
                { icon: <Bot className="w-8 h-8" />, title: "AI-Powered Content Ideas", description: "Generate topic clusters and content ideas based on your target keywords and audience.", gradient: "from-orange-500 to-yellow-500" },
                { icon: <Users className="w-8 h-8" />, title: "Readability & SEO Score", description: "Optimize your content for both search engines and human readers with real-time feedback.", gradient: "from-pink-500 to-purple-500" },
            ]
        },
        {
            category: "Off-Page & Local SEO",
            headingGradient: "from-blue-600 to-cyan-600",
            description: "Build authority and dominate local search to attract customers in your area.",
            items: [
                { icon: <Globe className="w-8 h-8" />, title: "Backlink Opportunities", description: "Analyze your link profile, spy on competitors, and identify opportunities for high-quality backlinks.", gradient: "from-cyan-500 to-blue-500" },
                { icon: <Target className="w-8 h-8" />, title: "Local SEO Dominance", description: "Optimize your presence for local searches with NAP data, schema, and map integrations.", gradient: "from-indigo-500 to-purple-500" },
            ]
        }
    ];


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 relative transition-all duration-700">
            <AnimatedBackgrounds />
            
           

            <main className="relative z-10">
                {/* Hero Section */}
                <motion.section
                    className="py-20 px-4 sm:px-6 lg:px-8 text-center"
                    initial="hidden" animate="visible" variants={staggerContainer}
                >
                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                        THE COMPLETE
                        <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                            SEO TOOLKIT
                        </span>
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Explore our full suite of features, meticulously crafted to provide you with the data and insights you need to climb the search rankings.
                    </motion.p>
                </motion.section>

                {/* Detailed Features Section */}
                <div className="space-y-20 pb-20">
                    {featureCategories.map((category, catIndex) => (
                         <motion.section
                            key={catIndex}
                            className="px-4 sm:px-6 lg:px-8"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={staggerContainer}
                        >
                            <div className="max-w-7xl mx-auto">
                                <motion.div variants={fadeInUp} className="text-center mb-12">
                                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                                        <span className={`bg-gradient-to-r ${category.headingGradient} bg-clip-text text-transparent`}>{category.category}</span>
                                    </h2>
                                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{category.description}</p>
                                </motion.div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                                    {category.items.map((feature, index) => (
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
                    ))}
                </div>

                {/* CTA Section (Copied from Home) */}
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
            </main>

            
        </div>
    );
};

export default Features;