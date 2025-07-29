'use client'; // This component uses useState and interacts with the DOM

import { useState } from 'react'; // Only import useState, no need for React itself in new React versions
import Link from 'next/link'; // Import Next.js's Link component
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion from framer-motion

const Navbar = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false); // Explicitly type isOpen as boolean
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Explicitly type isDarkMode as boolean

    const toggleMenu = (): void => { // Explicitly type return as void
        setIsOpen(!isOpen);
    };

    const toggleTheme = (): void => { // Explicitly type return as void
        const newDarkModeState = !isDarkMode;
        setIsDarkMode(newDarkModeState);
        // Implement actual theme toggling logic here (e.g., add/remove 'dark' class from html)
        if (typeof document !== 'undefined') { // Check if document is defined (prevents SSR errors)
            document.documentElement.classList.toggle('dark', newDarkModeState);
        }
    };

    return (
        <nav className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-md shadow-lg transition-all duration-500 sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                {/* Logo */}
                <div className="flex-shrink-0">
                    <Link href="/" className="text-3xl font-extrabold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        CrestNova.Sol
                    </Link>
                </div>

                {/* Desktop Menu Links */}
                <div className="hidden md:flex items-center space-x-10">
                    {[
                        { name: "Home", path: "/" },
                        { name: "Features", path: "/features" },
                        { name: "Pricing", path: "/pricing" },
                        { name: "Contact", path: "/contact" },
                    ].map((item) => (
                        <Link
                            key={item.name}
                            href={item.path} // Use href instead of to for Next.js Link
                            className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
                        >
                            {item.name}
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                        </Link>
                    ))}
                </div>

                {/* Auth/CTA Buttons & Theme Toggle (Desktop) */}
                <div className="hidden md:flex items-center space-x-6">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
                        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                    <Link href="/login" className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Login
                    </Link>
                    <Link
                        href="/signup"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
                    >
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Menu Button & Theme Toggle (Mobile) */}
                <div className="md:hidden flex items-center space-x-2">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
                        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                    <button onClick={toggleMenu} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                        {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu (Collapsible) */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -50, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -50, height: 0 }} // Note: exit animations need <AnimatePresence> from framer-motion
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-4 shadow-xl"
                >
                    <div className="px-2 pt-2 pb-3 space-y-2">
                        {[
                            { name: "Home", path: "/" },
                            { name: "Features", path: "/features" },
                            { name: "Pricing", path: "/pricing" },
                            { name: "Contact", path: "/contact" },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setIsOpen(false)} // Close menu on click
                            >
                                {item.name}
                            </Link>
                        ))}
                        <hr className="border-gray-200 dark:border-gray-700 my-2" />
                        <Link
                            href="/login"
                            className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            onClick={() => setIsOpen(false)}
                        >
                            Login
                        </Link>
                        <Link
                            href="/signup"
                            className="block px-4 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center shadow-md mt-2"
                            onClick={() => setIsOpen(false)}
                        >
                            Sign Up
                        </Link>
                    </div>
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;