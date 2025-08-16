import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        if (showDropdown) {
            setShowDropdown(false);
        }
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark', !isDarkMode);
    };

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
    };

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
        <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 border-b border-blue-200/50 shadow-lg">
            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                {/* Subtle SVG Decoration */}
                <motion.div
                    className="absolute top-0 left-0 w-12 h-12 opacity-15"
                    variants={floatingAnimation}
                    animate="animate"
                >
                    <svg viewBox="0 0 50 50" className="w-full h-full">
                        <defs>
                            <linearGradient id="navShard" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <polygon points="25,5 40,20 25,35 10,20" fill="url(#navShard)" />
                    </svg>
                </motion.div>

                {/* Logo */}
                <div className="flex-shrink-0">
                    <RouterLink
                        to="/"
                        className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
                    >
                        CrestNova.Sol
                    </RouterLink>
                </div>

                {/* Desktop Menu Links */}
                <div className="hidden md:flex items-center space-x-8">
                    {[
                        { name: "Home", path: "/" },
                        { name: "Features", path: "/features" },
                        { name: "Pricing", path: "/pricing" },
                        { name: "Contact", path: "/contact" },
                    ].map((item) => (
                        <RouterLink
                            key={item.name}
                            to={item.path}
                            className="text-lg font-medium text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group"
                        >
                            {item.name}
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                        </RouterLink>
                    ))}
                </div>

                {/* Auth/CTA Buttons & Theme Toggle (Desktop) */}
                <div className="hidden md:flex items-center space-x-6">
                    <motion.button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </motion.button>
                    {user ? (
                        <div className="relative">
                            <motion.button
                                onClick={toggleDropdown}
                                className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <User className="w-5 h-5" />
                                {showDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </motion.button>
                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        className="absolute right-0 mt-2 w-48 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 dark:border-slate-700/50 py-1 z-20"
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <RouterLink
                                            to="/dashboard"
                                            onClick={() => setShowDropdown(false)}
                                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <User className="w-4 h-4 mr-2" /> Profile
                                        </RouterLink>
                                        <button
                                            onClick={() => { handleLogout(); setShowDropdown(false); }}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <RouterLink
                                to="/login"
                                className="text-lg font-medium text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            >
                                Login
                            </RouterLink>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <RouterLink
                                    to="/signup"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-xl transition-all"
                                >
                                    Sign Up
                                </RouterLink>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button & Theme Toggle (Mobile) */}
                <div className="md:hidden flex items-center space-x-4">
                    <motion.button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </motion.button>
                    <motion.button
                        onClick={toggleMenu}
                        className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu (Collapsible) */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -50, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -50, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white/50 dark:border-slate-700/50 shadow-xl"
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
                                className="block px-4 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </RouterLink>
                        ))}
                        <hr className="border-white/50 dark:border-slate-700/50 my-2" />
                        {user ? (
                            <>
                                <RouterLink
                                    to="/dashboard"
                                    className="flex items-center px-4 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User className="w-5 h-5 mr-2" /> Profile
                                </RouterLink>
                                <button
                                    onClick={() => { handleLogout(); setIsOpen(false); }}
                                    className="flex items-center w-full text-left px-4 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                >
                                    <LogOut className="w-5 h-5 mr-2" /> Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <RouterLink
                                    to="/login"
                                    className="block px-4 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </RouterLink>
                                <RouterLink
                                    to="/signup"
                                    className="block px-4 py-2 rounded-xl text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-center shadow-md"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Sign Up
                                </RouterLink>
                            </>
                        )}
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;