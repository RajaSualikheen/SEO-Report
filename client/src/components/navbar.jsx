import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Info, LogIn, User, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
// Removed useNavigate import as it requires Router context

// --- Start of Firebase Configuration and AuthService (Moved Here for self-containment) ---
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCiYeMcuPhdQDop6Umt2K10ulyAEhbN108",
  authDomain: "seoanalyzerauth.firebaseapp.com",
  projectId: "seoanalyzerauth",
  storageBucket: "seoanalyzerauth.firebasestorage.app",
  messagingSenderId: "512042912695",
  appId: "1:512042912695:web:54fce8a18bdcec2ff73632",
  measurementId: "G-6W2LCZKH66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Setup auth
const auth = getAuth(app);

// AuthService functions (simplified for Navbar's needs)
const logoutUser = async () => {
  await signOut(auth);
};

const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
// --- End of Firebase Configuration and AuthService ---


export default function Navbar() {
  const [user, setUser] = useState(null); // State to hold authenticated user
  const [showDropdown, setShowDropdown] = useState(false); // State to control dropdown visibility
  // Removed useNavigate hook

  // Effect to listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser); // Update user state based on auth state
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      console.log('User logged out successfully');
      setShowDropdown(false); // Close dropdown after logout
      window.location.href = '/'; // Redirect to login page using window.location
    } catch (error) {
      console.error('Error logging out:', error);
      // Optionally show an error message to the user
    }
  };

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const linkVariants = {
    hover: { scale: 1.05, color: '#DBEAFE', transition: { duration: 0.2 } }, // blue-100
    tap: { scale: 0.95 },
  };

  return (
    <motion.nav
      className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 shadow-lg"
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto flex justify-between items-center">
        <motion.div
          className="text-white text-2xl font-bold tracking-wide cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          onClick={() => window.location.href = '/'} // Navigate to home on logo click using window.location
        >
          CrestNova.Sol
        </motion.div>
        <div className="flex items-center space-x-6">
          <motion.a
            onClick={() => window.location.href = '/'} // Changed to onClick using window.location
            className="text-white flex items-center cursor-pointer" // Added cursor-pointer
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Home className="w-5 h-5 mr-1" /> Home
          </motion.a>
          <motion.a
            onClick={() => window.location.href = '/about'} // Changed to onClick using window.location
            className="text-white flex items-center cursor-pointer" // Added cursor-pointer
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Info className="w-5 h-5 mr-1" /> About
          </motion.a>

          {user ? ( // Conditional rendering based on user state
            <div className="relative">
              <motion.button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center text-white p-2 rounded-full hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-6 h-6" />
                {showDropdown ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </motion.button>

              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20"
                >
                  <a
                    onClick={() => { window.location.href = '/dashboard'; setShowDropdown(false); }} // Changed to onClick using window.location
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer" // Added cursor-pointer
                  >
                    <User className="w-4 h-4 mr-2" /> Profile
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.button
              onClick={() => window.location.href = '/login'} // Navigate to login page using window.location
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center hover:from-blue-700 hover:to-indigo-800 shadow-md transition duration-300 ease-in-out transform hover:-translate-y-0.5" // Applied gradient and enhanced hover
              variants={linkVariants} // Keep existing link variants for consistency
              whileHover="hover"
              whileTap="tap"
            >
              <LogIn className="w-5 h-5 mr-1" /> Login
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
