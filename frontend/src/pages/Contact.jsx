/* eslint-disable no-irregular-whitespace */
// src/pages/Contact.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, User, MessageSquare } from "lucide-react";
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { useNavigate } from "react-router-dom";

// Assume these components are extracted from Home.jsx for reusability
import {
    AnimatedBackgrounds, // Component combining FloatingParticles, AnimatedOrbs, CircuitBackground
    ModernCard, // Reusable card component with backdrop-blur
    fadeInUp, // Framer Motion variants
    staggerContainer
} from "../components/reusableComponents.jsx"; // Place these in a new file

// Firebase initialization



const Contact = () => {
    
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    

    
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        // Mock submission
        setTimeout(() => {
            setSubmitting(false);
            alert("Thank you for your message! We'll get back to you shortly.");
            setFormData({ name: '', email: '', message: '' });
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 relative transition-all duration-700">
            <AnimatedBackgrounds />

            

            <main className="relative z-10">
                <motion.section
                    className="py-20 px-4 sm:px-6 lg:px-8"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <div className="max-w-6xl mx-auto">
                        <motion.div variants={fadeInUp} className="text-center mb-16">
                            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 leading-tight">
                                LET'S
                                <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                    CONNECT
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                                Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            {/* Contact Form */}
                            <ModernCard variants={fadeInUp}>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Send us a Message</h2>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="relative group">
                                        <User className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-cyan-400 transition-colors" />
                                        <input type="text" name="name" placeholder="Your Name" required value={formData.name} onChange={handleInputChange} className="w-full pl-16 pr-6 py-5 bg-white/5 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-lg backdrop-blur-sm" />
                                    </div>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-cyan-400 transition-colors" />
                                        <input type="email" name="email" placeholder="Your Email" required value={formData.email} onChange={handleInputChange} className="w-full pl-16 pr-6 py-5 bg-white/5 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-lg backdrop-blur-sm" />
                                    </div>
                                    <div className="relative group">
                                        <MessageSquare className="absolute left-6 top-6 text-gray-400 w-6 h-6 group-focus-within:text-cyan-400 transition-colors" />
                                        <textarea name="message" placeholder="Tell us about your project and goals..." rows="6" required value={formData.message} onChange={handleInputChange} className="w-full pl-16 pr-6 py-6 bg-white/5 dark:bg-gray-700/20 border border-white/20 dark:border-gray-600/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all text-lg backdrop-blur-sm resize-none" />
                                    </div>
                                    <motion.button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center space-x-2 disabled:opacity-50"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {submitting ? (
                                            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                        ) : (
                                            <><span>Send Message</span> <Send className="w-5 h-5" /></>
                                        )}
                                    </motion.button>
                                </form>
                            </ModernCard>

                            {/* Contact Info */}
                            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 mt-12 lg:mt-0">
                                <ModernCard variants={fadeInUp}>
                                    <div className="flex items-start space-x-6">
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg flex-shrink-0">
                                            <Mail/>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Email Us</h3>
                                            <p className="text-gray-600 dark:text-gray-400">Our team is here to help.</p>
                                            <a href="mailto:support@crestnovasol.com" className="text-blue-500 hover:underline font-medium">support@crestnovasol.com</a>
                                        </div>
                                    </div>
                                </ModernCard>
                                <ModernCard variants={fadeInUp}>
                                    <div className="flex items-start space-x-6">
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg flex-shrink-0">
                                            <Phone/>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Call Us</h3>
                                            <p className="text-gray-600 dark:text-gray-400">Mon-Fri from 8am to 5pm.</p>
                                            <a href="tel:+1234567890" className="text-blue-500 hover:underline font-medium">+1 (234) 567-890</a>
                                        </div>
                                    </div>
                                </ModernCard>
                                <ModernCard variants={fadeInUp}>
                                    <div className="flex items-start space-x-6">
                                        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg flex-shrink-0">
                                            <MapPin/>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Visit Us</h3>
                                            <p className="text-gray-600 dark:text-gray-400">Find us at our headquarters.</p>
                                            <p className="text-gray-700 dark:text-gray-300 font-medium">123 Innovation Drive, Tech City, 45678</p>
                                        </div>
                                    </div>
                                </ModernCard>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>
            </main>

            
        </div>
    );
};

export default Contact;