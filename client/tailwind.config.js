// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ensure Inter is loaded via Google Fonts or CSS import
      },
      colors: {
        // ... (keep your refined color palette from previous step) ...
        'gray-900': '#1A202C',
        'gray-950': '#0A0A0A',
        'blue-50': '#F0F8FF', 'blue-100': '#E0F2FE', 'blue-200': '#BFDBFE', 'blue-300': '#93C5FD', 'blue-400': '#60A5FA', 'blue-500': '#3B82F6', 'blue-600': '#2563EB', 'blue-700': '#1D4ED8', 'blue-800': '#1E40AF',
        'purple-50': '#F5F3FF', 'purple-100': '#EDE9FE', 'purple-200': '#DDD6FE', 'purple-300': '#C4B5FD', 'purple-400': '#A78BFA', 'purple-500': '#8B5CF6', 'purple-600': '#7C3AED', 'purple-700': '#6D28D9', 'purple-800': '#5B21B6',
      },
      boxShadow: {
        'xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '2xl': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
        '4xl': '0 50px 100px -20px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        "subtle-float": "subtleFloat 20s infinite ease-in-out", // For the larger glowing orbs
        // Removed specific bubble animations as they are now defined directly in Framer Motion for more control per bubble
      },
      keyframes: {
        "subtleFloat": { // For large blurred orbs
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(10px, -15px) scale(1.02)" },
          "50%": { transform: "translate(-10px, 15px) scale(0.98)" },
          "75%": { transform: "translate(5px, -10px) scale(1.01)" },
        },
        // Bubble-specific keyframes are now less critical here as Framer Motion handles it
        // but ensure any general utility keyframes are present if needed.
      },
    },
  },
  plugins: [
    function ({ addUtilities, addComponents, theme }) {
      // Custom utilities for animation delays
      addUtilities({
        ".animation-delay-0": { "animation-delay": "0s" },
        ".animation-delay-1000": { "animation-delay": "1s" },
        ".animation-delay-2000": { "animation-delay": "2s" },
        ".animation-delay-3000": { "animation-delay": "3s" },
        ".animation-delay-4000": { "animation-delay": "4s" },
        ".animation-delay-5000": { "animation-delay": "5s" },
      });

      // Enable backdrop-filter
      addComponents({
        '.backdrop-filter': {
          'backdrop-filter': 'blur(var(--tw-backdrop-blur, 0))',
          '-webkit-backdrop-filter': 'blur(var(--tw-backdrop-blur, 0))',
        },
        '.backdrop-blur-xl': {
          '--tw-backdrop-blur': '20px', // Increased blur strength for more glass effect
        },
        '.backdrop-blur-lg': {
          '--tw-backdrop-blur': '12px',
        },
        '.backdrop-blur-sm': {
            '--tw-backdrop-blur': '4px',
        }
      });

      // Add text-shadow utility for cleaner text depth
      addUtilities({
        '.drop-shadow-3xl': {
          'filter': 'drop-shadow(0 15px 12px rgb(0 0 0 / 0.25)) drop-shadow(0 8px 6px rgb(0 0 0 / 0.1))',
        },
      });
    },
  ],
};