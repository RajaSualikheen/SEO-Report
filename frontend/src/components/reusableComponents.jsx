/* eslint-disable no-irregular-whitespace */
import { motion, useInView } from "framer-motion";
import React, { useRef } from "react";
import { Star, CheckCircle } from "lucide-react"; // Only keeping the icons used in the reusable components

/**
 * Reusable animated background components.
 * This component combines FloatingParticles, AnimatedOrbs, and a CircuitBackground
 * to create the dynamic, tech-savvy background seen on the home page.
 */
export const AnimatedBackgrounds = () => (
    <>
        {/* FloatingParticles: Creates a subtle particle effect in the background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-blue-500/20 dark:bg-cyan-400/30"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        height: `${Math.random() * 4 + 2}px`,
                        width: `${Math.random() * 4 + 2}px`,
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, 0],
                        opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                        duration: Math.random() * 20 + 15,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            ))}
        </div>
        {/* AnimatedOrbs: Large, soft-glowing orbs that move slowly */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-cyan-400/20 blur-xl"
                    style={{
                        width: `${200 + Math.random() * 300}px`,
                        height: `${200 + Math.random() * 300}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        x: [0, 100, -100, 0],
                        y: [0, -100, 100, 0],
                        scale: [1, 1.2, 0.8, 1],
                    }}
                    transition={{
                        duration: 20 + Math.random() * 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
        {/* CircuitBackground: Adds a subtle circuit board pattern for a tech feel */}
        <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" preserveAspectRatio="xMidYMid slice">
            <defs>
                <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path
                        d="M10,10 L90,10 M10,50 L50,50 L50,90 M90,50 L50,50"
                        stroke="#3B82F6"
                        strokeWidth="1"
                        fill="none"
                    />
                    <circle cx="10" cy="10" r="2" fill="#3B82F6" />
                    <circle cx="90" cy="10" r="2" fill="#3B82F6" />
                    <circle cx="50" cy="50" r="2" fill="#3B82F6" />
                    <circle cx="50" cy="90" r="2" fill="#3B82F6" />
                    <circle cx="90" cy="50" r="2" fill="#3B82F6" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
    </>
);

/**
 * A modern card component with a transparent, blurred background,
 * rounded corners, and shadow effects. It also includes an on-scroll
 * fade-in animation.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the card.
 * @param {string} [props.className=""] - Optional additional CSS classes for styling.
 */
export const ModernCard = ({ children, className = "", ...props }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`relative h-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl p-8 border border-white/30 dark:border-gray-600/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/**
 * Animation variants for a staggered, sequential fade-in effect.
 * Use this on a parent element to apply the stagger effect to its children.
 */
export const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
};

/**
 * Animation variants for a single element to fade in and move up.
 * Use this on child elements within a parent that uses `staggerContainer`.
 */
export const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};
