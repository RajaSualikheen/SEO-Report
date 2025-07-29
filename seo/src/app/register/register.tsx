// app/register/page.tsx
'use client'; // This component uses hooks (useState) and Framer Motion, so it must be a Client Component

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, User } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter from Next.js
import Link from 'next/link'; // Import Next.js Link for navigation

// Import CustomModal component from its new shared location
import CustomModal from '@/components/CustomModal';

// --- Start of Firebase Configuration and AuthService (Moved Here) ---
import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth, createUserWithEmailAndPassword, UserCredential } from "firebase/auth";

// Define the shape of your Firebase config
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Retrieve Firebase config from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "dummy-measurement-id",
};

// Initialize Firebase (ensure this runs only once, especially in dev with hot-reloads)
let firebaseAppInstance: FirebaseApp;
let firebaseAuthInstance: Auth;

if (typeof window !== 'undefined') { // Ensure this runs only on the client-side
    if (!getApps().length) { // Check if no Firebase apps are already initialized
        firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
        firebaseAppInstance = getApp(); // Get the existing app if it's already initialized
    }
    firebaseAuthInstance = getAuth(firebaseAppInstance);
}

// Export auth instance for use in components
const auth = firebaseAuthInstance!; // Use non-null assertion as it's initialized client-side

// AuthService functions
const registerUser = async (email: string, password: string): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential;
};
// --- End of Firebase Configuration and AuthService ---


const Register: React.FC = () => {
  const router = useRouter(); // Initialize useRouter hook for Next.js navigation
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalAction, setModalAction] = useState<(() => Promise<void> | void) | null>(null);

  // Function to open the custom modal
  const openModal = useCallback((title: string, message: string, action: (() => Promise<void> | void) | null = null): void => {
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(() => action);
    setShowModal(true);
  }, []);

  // Function to close the custom modal
  const closeModal = useCallback((): void => {
    setShowModal(false);
    setModalTitle('');
    setModalMessage('');
    setModalAction(null);
  }, []);

  // Function to handle modal confirmation
  const handleModalConfirm = useCallback(async (): Promise<void> => {
    if (modalAction) {
      await modalAction();
    }
    closeModal();
  }, [modalAction, closeModal]);


  const handleRegister = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
      const userCredential = await registerUser(email, password);
      console.log('User registered successfully:', userCredential.user);

      openModal('Registration Successful', 'Your account has been created! Please log in.', () => router.push('/login'), 'OK');

    } catch (err: any) { // Use 'any' for error for now, can be more specific (e.g., FirebaseError)
      console.error('Firebase registration error:', err);
      let errorMessage: string = 'An unexpected error occurred during registration.';
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
    borderColor: '#3B82F6', // blue-500
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)', // blue-500 with opacity
    transition: { duration: 0.2 }
  };

  // Animation for the glow effect around the card
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
        repeatType: "mirror" as const, // Type assertion for repeatType
        ease: "easeInOut",
      },
    },
  };

  // SVG animation for the illustration side
  const illustrationSvgVariants = {
    animate: {
      scale: [0.98, 1.02, 0.98],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
      },
    },
  };

  const circleAnimation = {
    animate: {
      y: [0, 5, 0],
      x: [0, 5, 0],
      transition: { repeat: Infinity, duration: 5, ease: "easeInOut" as const }
    }
  };

  const pathAnimation = {
    animate: {
      scale: [0.8, 1.05, 0.8],
      transition: { repeat: Infinity, duration: 8, repeatType: "mirror" as const, ease: "easeInOut" as const }
    }
  };

  const rotateAnimation = {
    animate: {
      rotate: 360,
      transition: { repeat: Infinity, duration: 15, ease: "linear" as const }
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans text-gray-900 relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <CustomModal
        show={showModal}
        title={modalTitle}
        message={modalMessage}
        onConfirm={modalAction ? handleModalConfirm : undefined}
        onCancel={modalAction ? closeModal : undefined}
      />

      {/* Main Card Container */}
      <motion.div
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="animate" // Apply glow on hover of the whole card
        style={{ width: '90%', maxWidth: '800px', height: 'auto', minHeight: '500px' }}
      >
        {/* Left Side: Registration Form */}
        <div className="py-6 px-8 sm:py-8 sm:px-10 flex flex-col justify-center bg-white text-gray-900">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Register
            </h2>
            <p className="text-gray-500 text-sm">Create your CrestNova.Sol account</p>
          </div>

          {error && (
            <motion.div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
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
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-200 text-gray-900"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
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
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-200 text-gray-900"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-200 text-gray-900"
                  placeholder="Password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-200 text-gray-900"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                />
              </motion.div>
            </div>

            <motion.button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
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

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition duration-200">
              Login here
            </Link>
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