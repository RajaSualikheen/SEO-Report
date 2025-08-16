// D:\My-Web\seo-report-generator\old\client\src\firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, collection, query, orderBy, onSnapshot, deleteDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

export const  firebaseConfig = {
  apiKey: "AIzaSyCiYeMcuPhdQDop6Umt2K10ulyAEhbN108",
  authDomain: "seoanalyzerauth.firebaseapp.com",
  projectId: "seoanalyzerauth",
  storageBucket: "seoanalyzerauth.firebasestorage.app",
  messagingSenderId: "512042912695",
  appId: "1:512042912695:web:54fce8a18bdcec2ff73632",
  measurementId: "G-6W2LCZKH66"
};

// FIX: Check if an app already exists before initializing
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Export all necessary Firestore functions for use in other components
export { doc, collection, query, orderBy, onSnapshot, deleteDoc };
