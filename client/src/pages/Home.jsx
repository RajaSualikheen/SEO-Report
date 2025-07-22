import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Code,
  BriefcaseBusiness,
  Home,
  Info,
} from "lucide-react";
import { motion } from "framer-motion"; // Import motion from framer-motion
import Navbar from "../components/navbar.jsx";
import Footer from "../components/footer.jsx"; // Import Footer component

const Landing = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerateReport = () => {
    if (!url.trim()) {
      alert("Please enter a valid URL");
      return;
    }

    setLoading(true);

    // Simulate delay before navigating
    setTimeout(() => {
      setLoading(false);
      navigate("/report", {
        state: { websiteUrl: url.trim() },
      });
    }, 1000);
  };
  // Framer Motion variants for navbar elements

  // Framer Motion variants for background SVGs
  const svgVariants = {
    initial: { opacity: 0, scale: 0.8, rotate: 0 },
    animate: {
      opacity: 0.1,
      scale: 1,
      rotate: [0, 10, -10, 0], // Subtle rotation animation
      transition: {
        duration: 8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
  };

  return (
    <div
      className="min-h-screen bg-white font-sans text-gray-800"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Navbar />
      {/* Hero Section */}
      <header className="relative py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle background graphics */}
        {/* Original graphics with Framer Motion */}
        <motion.div
          className="absolute top-1/4 left-1/4 opacity-10 transform -translate-x-1/2 -translate-y-1/2"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <svg
            className="w-48 h-48 text-blue-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.15l7 3.11v5.34c0 4.12-2.78 7.9-7 9.07-4.22-1.17-7-4.95-7-9.07V6.26l7-3.11z" />
          </svg>
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 right-1/4 opacity-10 transform translate-x-1/2 translate-y-1/2"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <Search className="w-48 h-48 text-indigo-500" />
        </motion.div>
        <motion.div
          className="absolute top-1/2 right-1/4 opacity-10 transform translate-x-1/2 -translate-y-1/2"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <svg
            className="w-48 h-48 text-blue-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </motion.div>

        {/* New background SVGs - Half Circles/Abstract Shapes */}
        <motion.div
          className="absolute top-0 left-0 w-64 h-64 overflow-hidden"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <svg
            className="w-full h-full text-blue-400 opacity-10"
            fill="currentColor"
            viewBox="0 0 100 100"
          >
            <circle cx="0" cy="0" r="100" /> {/* Top-left quarter circle */}
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-0 right-0 w-64 h-64 overflow-hidden"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <svg
            className="w-full h-full text-indigo-400 opacity-10"
            fill="currentColor"
            viewBox="0 0 100 100"
          >
            <circle cx="100" cy="100" r="100" />{" "}
            {/* Bottom-right quarter circle */}
          </svg>
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-1/4 w-48 h-48 opacity-5"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <svg
            className="w-full h-full text-blue-300"
            fill="currentColor"
            viewBox="0 0 200 200"
          >
            <path d="M100 0 A100 100 0 0 1 200 100 L100 100 Z" />{" "}
            {/* Abstract quarter circle/wave */}
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-1/3 right-1/3 w-40 h-40 opacity-5"
          variants={svgVariants}
          initial="initial"
          animate="animate"
        >
          <svg
            className="w-full h-full text-indigo-300"
            fill="currentColor"
            viewBox="0 0 200 200"
          >
            <path d="M0 100 A100 100 0 0 0 100 200 L100 100 Z" />{" "}
            {/* Abstract quarter circle/wave */}
          </svg>
        </motion.div>

        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight z-10">
          {" "}
          {/* Added z-10 to ensure text is above SVGs */}
          Unlock Your Website's Full Potential
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl z-10">
          {" "}
          {/* Added z-10 */}
          Get comprehensive SEO insights and actionable recommendations to boost
          your online visibility.
        </p>

        <div className="w-full max-w-xl flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 z-10">
          {" "}
          {/* Added z-10 */}
          <input
            type="url"
            placeholder="Enter your website URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow p-4 border border-gray-300 rounded-xl shadow-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 w-full"
            aria-label="Website URL input"
          />
          <button
            onClick={handleGenerateReport}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 ease-in-out text-lg w-full sm:w-auto"
          >
            Generate SEO Report
          </button>
          {loading && <p className="mt-6 text-blue-600 font-semibold">Generating report...</p>}



        </div>
      </header>

      {/* Features Summary */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center transform hover:scale-105 transition duration-300 ease-in-out">
            <FileText className="w-16 h-16 text-blue-500 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Plain-English SEO Reports
            </h3>
            <p className="text-gray-500">
              Understand complex SEO data with clear, concise, and easy-to-read
              reports.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center transform hover:scale-105 transition duration-300 ease-in-out">
            <Code className="w-16 h-16 text-indigo-500 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No Coding Needed
            </h3>
            <p className="text-gray-500">
              Our intuitive interface makes SEO analysis accessible to everyone,
              no technical skills required.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center transform hover:scale-105 transition duration-300 ease-in-out">
            <BriefcaseBusiness className="w-16 h-16 text-blue-500 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Agency-Ready Exports
            </h3>
            <p className="text-gray-500">
              Export professional-grade reports ready for clients or internal
              presentations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
