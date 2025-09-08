/* eslint-disable no-irregular-whitespace */
// src/pages/Pricing.jsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useInView, useAnimation } from "framer-motion";
import { CheckCircle, ChevronDown } from "lucide-react";

import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// Assume these components are extracted from Home.jsx for reusability
import {
    AnimatedBackgrounds, // Component combining FloatingParticles, AnimatedOrbs, CircuitBackground
    ModernCard, // Reusable card component with backdrop-blur
    fadeInUp, // Framer Motion variants
    staggerContainer
} from "../components/reusableComponents"; // Place these in a new file

// Firebase initialization



const AccordionItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-white/20 dark:border-gray-600/20 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-6 text-left font-semibold text-gray-900 dark:text-white"
            >
                <span>{question}</span>
                <ChevronDown className={`w-5 h-5 text-blue-600 dark:text-blue-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pb-6 text-gray-700 dark:text-gray-300"
                    >
                        {answer}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Pricing = () => {
   
    const navigate = useNavigate();

    
    
    const plans = [
        { name: "BASIC FREE", price: "$0", period: "forever", description: "Perfect for small websites and beginners.", cta: "Start Your Journey", popular: false, features: ["1 Site Audit / day", "Top Keyword Insights", "Mobile Responsiveness Check", "Basic SEO Recommendations", "Email Support"], gradient: "from-gray-600 to-gray-800" },
        { name: "PRO UNLIMITED", price: "$39", period: "per month", description: "Best for growing businesses and agencies.", cta: "Unlock Pro Power", popular: true, features: ["All Basic Features", "Unlimited Audits & Reports", "Advanced Keyword Tools", "Competitor Analysis", "Priority Support"], gradient: "from-blue-600 to-purple-600" },
        { name: "ENTERPRISE", price: "Custom", period: "annually", description: "For large-scale operations requiring custom solutions.", cta: "Contact Sales", popular: false, features: ["All Pro Features", "Dedicated Account Manager", "API Access", "White-label Reports", "Custom Integrations"], gradient: "from-blue-800 to-cyan-800" }
    ];

    const faqs = [
        { question: "Can I upgrade or downgrade my plan anytime?", answer: "Yes, you can change your plan at any time from your account dashboard. The changes will be prorated." },
        { question: "What payment methods do you accept?", answer: "We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also support bank transfers." },
        { question: "Is there a free trial for the Pro plan?", answer: "We offer a 7-day free trial for our Pro plan. You can explore all the advanced features with no commitment." },
        { question: "What happens if I cancel my subscription?", answer: "You can cancel your subscription at any time. You will retain access to your plan's features until the end of the current billing period." }
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
                        FIND YOUR
                        <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                            PERFECT PLAN
                        </span>
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Transparent pricing for businesses of all sizes. No hidden fees, ever.
                    </motion.p>
                </motion.section>

                {/* Pricing Cards */}
                <motion.section 
                    id="pricing"
                    className="py-10 px-4 sm:px-6 lg:px-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={staggerContainer}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {plans.map((plan, index) => (
                            <ModernCard key={index} className={`h-full ${plan.popular ? 'border-blue-500/50 dark:border-purple-500/50 scale-105' : ''}`}>
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
                                    onClick={() => navigate(plan.cta === "Contact Sales" ? "/contact" : "/signup")}
                                    className={`w-full py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 ${
                                        plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105'
                                            : 'bg-white/20 dark:bg-gray-800/40 border border-white/30 dark:border-gray-600/30 text-gray-700 dark:text-white hover:bg-white/30 dark:hover:bg-gray-700/40'
                                    }`}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {plan.cta}
                                </motion.button>
                            </ModernCard>
                        ))}
                    </div>
                </motion.section>

                {/* FAQ Section */}
                <motion.section 
                    className="py-20 px-4 sm:px-6 lg:px-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={staggerContainer}
                >
                    <div className="max-w-4xl mx-auto">
                        <motion.div variants={fadeInUp} className="text-center mb-12">
                            <h2 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-8">
                                YOUR QUESTIONS,
                                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    ANSWERED
                                </span>
                            </h2>
                        </motion.div>
                        <ModernCard className="p-8">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </ModernCard>
                    </div>
                </motion.section>

            </main>
            
        </div>
    );
};

export default Pricing;