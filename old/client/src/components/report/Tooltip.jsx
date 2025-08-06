import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const Tooltip = ({ children, text }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative inline-block" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            {children}
            {showTooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 dark:bg-slate-200 dark:text-slate-800"
                >
                    {text}
                </motion.div>
            )}
        </div>
    );
};