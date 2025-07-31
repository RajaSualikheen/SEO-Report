import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, LogOut, ChevronDown, ChevronUp } from 'lucide-react'; // Added User, LogOut, Chevron icons
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence

const Navbar = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    // NEW: State for the user dropdown menu
    const [showDropdown, setShowDropdown] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        // Close dropdown when mobile menu is toggled
        if (showDropdown) {
            setShowDropdown(false);
        }
    };
    
    // NEW: Toggle the user dropdown menu
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark', !isDarkMode);
    };
    
    // Dropdown animation variants
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
    };

    return (
        <nav className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-md shadow-lg transition-all duration-500 sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                {/* Logo */}
                <div className="flex-shrink-0">
                    <RouterLink to="/" className="text-3xl font-extrabold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        CrestNova.Sol
                    </RouterLink>
                </div>

                {/* Desktop Menu Links */}
                <div className="hidden md:flex items-center space-x-10">
                    {[
                        { name: "Home", path: "/" },
                        { name: "Features", path: "/features" },
                        { name: "Pricing", path: "/pricing" },
                        { name: "Contact", path: "/contact" },
                    ].map((item) => (
                        <RouterLink
                            key={item.name}
                            to={item.path}
                            className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
                        >
                            {item.name}
                            <span className="absolute left-0 bottom-0 w-full h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                        </RouterLink>
                    ))}
                </div>

                {/* Auth/CTA Buttons & Theme Toggle (Desktop) */}
                <div className="hidden md:flex items-center space-x-6">
                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
                        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                    {/* NEW: Conditional rendering for user login status */}
                    {user ? (
                        <div className="relative">
                            <button 
                                onClick={toggleDropdown} 
                                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                            >
                                <User className="w-6 h-6" />
                                {showDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            
                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700"
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <RouterLink
                                            to="/dashboard"
                                            onClick={() => setShowDropdown(false)} // Close dropdown on click
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <User className="w-4 h-4 mr-2" /> Profile
                                        </RouterLink>
                                        <button
                                            onClick={() => { handleLogout(); setShowDropdown(false); }}
                                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-2" /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <RouterLink to="/login" className="text-lg font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Login
                            </RouterLink>
                            <RouterLink
                                to="/signup"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
                            >
                                Sign Up
                            </RouterLink>
                        </>
                    )}
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
                    exit={{ opacity: 0, y: -50, height: 0 }}
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
                            <RouterLink
                                key={item.name}
                                to={item.path}
                                className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                                onClick={() => setIsOpen(false)} // Close menu on click
                            >
                                {item.name}
                            </RouterLink>
                        ))}
                        <hr className="border-gray-200 dark:border-gray-700 my-2" />
                        {user ? (
                            <>
                                <RouterLink
                                    to="/dashboard"
                                    className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="flex items-center"><User className="w-5 h-5 mr-2" /> Profile</span>
                                </RouterLink>
                                <button
                                    onClick={() => { handleLogout(); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    <span className="flex items-center"><LogOut className="w-5 h-5 mr-2" /> Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <RouterLink
                                    to="/login"
                                    className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </RouterLink>
                                <RouterLink
                                    to="/signup"
                                    className="block px-4 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 text-center shadow-md mt-2"
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