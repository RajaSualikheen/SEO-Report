// firebaseConfig.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCiYeMcuPhdQDop6Umt2K10ulyAEhbN108",
  authDomain: "seoanalyzerauth.firebaseapp.com",
  projectId: "seoanalyzerauth",
  storageBucket: "seoanalyzerauth.appspot.com", // fixed small typo in original
  messagingSenderId: "512042912695",
  appId: "1:512042912695:web:54fce8a18bdcec2ff73632",
  measurementId: "G-6W2LCZKH66"
};

// ✅ Only initialize if not already initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };
