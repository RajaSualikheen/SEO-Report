/* eslint-disable no-irregular-whitespace */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, User } from 'lucide-react'; // Icons for inputs and links
import { useNavigate } from 'react-router-dom';
import {  useEffect } from 'react';
// --- Start of Firebase Configuration and AuthService (Moved Here) ---
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase'; // Only need auth for email/pass registration


// AuthService functions
const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};
// --- End of Firebase Configuration and AuthService ---


const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


const handleRegister = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  if (!fullName || !email || !password || !confirmPassword) {
    setError('Please fill in all fields.');
    setLoading(false);
    return;
  }
  if (password !== confirmPassword) {
    setError('Passwords do not match.');
    setLoading(false);
    return;
  }
  if (password.length < 6) {
    setError('Password must be at least 6 characters long.');
    setLoading(false);
    return;
  }

  try {
    const user = await registerUser(email, password);
    console.log('User registered successfully:', user);
    
    // ✅ Redirect to login immediately after success
    navigate('/login');

  } catch (err) {
    console.error('Firebase registration error:', err);
    let errorMessage = 'An unexpected error occurred during registration.';
    if (err.code) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        default:
          errorMessage = err.message;
          break;
      }
    }
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};



  // Framer Motion variants for the main card container
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
  };

  // Animation for input field focus
  const inputFocusAnimation = {
    borderColor: ['#D1D5DB', '#3B82F6'], // blue-500
    boxShadow: ['0 0 0 1px #D1D5DB', '0 0 0 2px rgba(59, 130, 246, 0.5)'], // blue-500 with opacity
    transition: { duration: 0.2 }
  };

  // Animation for the glow effect around the card (adjusted for lighter background)
  const glowAnimation = {
    animate: {
      boxShadow: [
        '0 0 10px rgba(59, 130, 246, 0.3)', // blue-500
        '0 0 20px rgba(99, 102, 241, 0.4)', // indigo-500
        '0 0 10px rgba(59, 130, 246, 0.3)'
      ],
      transition: {
        duration: 5,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  // SVG animation for the illustration side (replicated from previous Register.jsx)
  const illustrationSvgVariants = {
    animate: {
      scale: [0.98, 1.02, 0.98],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  const circleAnimation = {
    animate: {
      y: [0, 5, 0],
      x: [0, 5, 0],
      transition: { repeat: Infinity, duration: 5, ease: "easeInOut" }
    }
  };

  const pathAnimation = {
    animate: {
      scale: [0.8, 1.05, 0.8],
      transition: { repeat: Infinity, duration: 8, repeatType: "mirror", ease: "easeInOut" }
    }
  };

  const rotateAnimation = {
    animate: {
      rotate: 360,
      transition: { repeat: Infinity, duration: 15, ease: "linear" }
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 relative overflow-hidden transition-colors duration-500" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Main Card Container */}
      <motion.div
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="animate" // Apply glow on hover of the whole card
        style={{ width: '90%', maxWidth: '800px', height: 'auto', minHeight: '500px' }} // Adjusted minHeight
      >
        {/* Left Side: Registration Form */}
        <div className="py-6 px-8 sm:py-8 sm:px-10 flex flex-col justify-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"> {/* Adjusted padding */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Register
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Create your CrestNova.Sol account</p>
          </div>

          {error && (
            <motion.div
              className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4"> {/* Adjusted space-y */}
            <div>
              <label htmlFor="fullName" className="sr-only">Full Name</label>
              <motion.div
                className="relative rounded-lg"
                whileFocus={inputFocusAnimation}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition duration-200 text-gray-900 dark:text-white"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </motion.div>
            </div>

            <div>
              <label htmlFor="email" className="sr-only">Email Address</label>
              <motion.div
                className="relative rounded-lg"
                whileFocus={inputFocusAnimation}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition duration-200 text-gray-900 dark:text-white"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </motion.div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <motion.div
                className="relative rounded-lg"
                whileFocus={inputFocusAnimation}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition duration-200 text-gray-900 dark:text-white"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </motion.div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <motion.div
                className="relative rounded-lg"
                whileFocus={inputFocusAnimation}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition duration-200 text-gray-900 dark:text-white"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </motion.div>
            </div>

            <motion.button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" /> Register
                </>
              )}
            </motion.button>
          </form>
          <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">Or continue with</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    <motion.a
                        href="http://localhost:4000/auth/google"
                        className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-md font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <svg className="w-5 h-5 mr-3" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.96 1.9-3.98 0-7.22-3.23-7.22-7.22s3.24-7.22 7.22-7.22c2.23 0 3.63.89 4.47 1.69l2.5-2.5C18.16 1.9 15.61 0 12.48 0 5.88 0 0 5.58 0 12.48s5.88 12.48 12.48 12.48c6.92 0 12-4.84 12-11.98 0-.64-.07-1.35-.2-2.04h-11.8z" fill="currentColor"/></svg>
                        Sign Up with Google
                    </motion.a>    
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition duration-200">
              Login here
            </a>
          </div>
        </div>

        {/* Right Side: Welcome/Illustration Section */}
        <div className="relative p-8 sm:p-10 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-center">
          {/* Abstract background shapes - replicating the image's style */}
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Large diagonal gradient effect, mimicking the image's split */}
            <defs>
              <linearGradient id="diagonalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#diagonalGradient)" />

            {/* Replicating the circles from the image with subtle animations */}
            <motion.circle
              cx="20" cy="20" r="15" fill="rgba(255,255,255,0.1)"
              animate="animate"
              variants={circleAnimation}
            />
            <motion.circle
              cx="80" cy="60" r="20" fill="rgba(255,255,255,0.15)"
              animate="animate"
              variants={circleAnimation}
              transition={{ delay: 1, duration: 6 }}
            />
            <motion.circle
              cx="40" cy="90" r="10" fill="rgba(255,255,255,0.1)"
              animate="animate"
              variants={circleAnimation}
              transition={{ delay: 2, duration: 7 }}
            />
            {/* Adding more abstract shapes to match the image's background */}
            <motion.path
              d="M0 0 Q 30 10 50 0 T 100 0 L 100 100 Q 70 90 50 100 T 0 100 Z"
              fill="rgba(255,255,255,0.05)"
              animate="animate"
              variants={pathAnimation}
            />
            <motion.path
              d="M0 50 Q 20 20 50 50 T 100 50 Q 80 80 50 50 T 0 50 Z"
              fill="rgba(255,255,255,0.03)"
              animate="animate"
              variants={rotateAnimation}
            />
          </motion.svg>

          <div className="relative z-10">
            <h3 className="text-4xl font-extrabold mb-4">WELCOME!</h3>
            <p className="text-lg opacity-90 leading-relaxed">
              Join CrestNova.Sol to unlock powerful SEO insights and elevate your online presence.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;