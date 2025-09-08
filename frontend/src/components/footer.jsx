import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const floatingAnimation = {
        animate: {
            y: [0, -5, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        // The footer background is already dark, so it does not need a dark: prefix.
        <footer className="bg-gradient-to-b from-slate-900 to-blue-900 text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Subtle SVG Background */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 800 400">
                    <defs>
                        <linearGradient id="footerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <filter id="footerGlow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <g fill="url(#footerGradient)" filter="url(#footerGlow)" opacity="0.3">
                        <circle cx="100" cy="100" r="8"/>
                        <circle cx="300" cy="80" r="6"/>
                        <circle cx="500" cy="120" r="10"/>
                        <circle cx="700" cy="90" r="7"/>
                    </g>
                    <g stroke="url(#footerGradient)" strokeWidth="1" fill="none" opacity="0.2">
                        <line x1="100" y1="100" x2="300" y2="80"/>
                        <line x1="300" y1="80" x2="500" y2="120"/>
                        <line x1="500" y1="120" x2="700" y2="90"/>
                    </g>
                </svg>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div 
                    className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 dark:border-white/10 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h3 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        CrestNova.Sol
                    </h3>
                    <p className="text-blue-100 text-base mb-6 leading-relaxed">
                        Empowering websites with cutting-edge AI-driven SEO insights.
                    </p>
                    <div className="flex justify-center space-x-4 mb-6">
                        {[
                            { href: "https://facebook.com/crestnovasol", icon: <Facebook className="w-6 h-6" /> },
                            { href: "https://twitter.com/crestnovasol", icon: <Twitter className="w-6 h-6" /> },
                            { href: "https://linkedin.com/company/crestnovasol", icon: <Linkedin className="w-6 h-6" /> },
                            { href: "https://instagram.com/crestnovasol", icon: <Instagram className="w-6 h-6" /> },
                            { href: "mailto:support@crestnovasol.com", icon: <Mail className="w-6 h-6" /> }
                        ].map((social, index) => (
                            <motion.a
                                key={index}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-200 hover:text-white transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {social.icon}
                            </motion.a>
                        ))}
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 mb-6">
                        {[
                            { name: "Features", path: "/features" },
                            { name: "Pricing", path: "/pricing" },
                            { name: "Contact", path: "/contact" },
                            // { name: "Support", path: "/support" }
                        ].map((item, index) => (
                            <Link
                                key={index}
                                to={item.path}
                                className="text-blue-200 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:bg-clip-text hover:text-transparent transition-all"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                    <p className="text-sm text-blue-200">
                        &copy; {currentYear} CrestNova.Sol. All rights reserved.
                    </p>
                </motion.div>
            </div>

            {/* Floating Crystal Decoration */}
            <motion.div 
                className="absolute bottom-4 right-4 w-8 h-8 opacity-20"
                variants={floatingAnimation}
                animate="animate"
            >
                <svg viewBox="0 0 50 50" className="w-full h-full">
                    <defs>
                        <linearGradient id="footerShard" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                    <polygon points="25,10 35,25 25,40 15,25" fill="url(#footerShard)" />
                </svg>
            </motion.div>
        </footer>
    );
};

export default Footer;