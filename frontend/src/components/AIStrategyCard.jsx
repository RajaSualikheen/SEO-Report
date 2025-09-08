// old/client/src/components/AIStrategyCard.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, AlertOctagon, ArrowRight, Lightbulb, Info } from 'lucide-react';

// Progress Bar Component
const ProgressBar = ({ score }) => {
    const getColor = (value) => {
        if (value >= 90) return "bg-green-500";
        if (value >= 70) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="w-full mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SEO Score</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{score}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                    className={`h-3 rounded-full ${getColor(score)}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    );
};

// Issue Item Component
const IssueItem = ({ item, onScrollToAction, severity }) => {
    const colors = {
        critical: {
            icon: <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />,
            borderColor: 'border-red-500',
        },
        warning: {
            icon: <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />,
            borderColor: 'border-orange-500',
        },
    };

    const severityConfig = colors[severity];

    return (
        <div className={`p-4 bg-white/60 dark:bg-gray-700/50 rounded-lg border-l-4 ${severityConfig.borderColor} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
            <div className="flex-grow">
                <div className="flex items-center">
                    {severityConfig.icon}
                    <p className="ml-2 font-semibold text-gray-800 dark:text-gray-100">{item.title}</p>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 sm:pl-7">{item.explanation}</p>
                {item.recommendation && (
                    <p className="mt-1 text-sm text-green-700 dark:text-green-400 sm:pl-7 italic">
                        {item.recommendation}
                    </p>
                )}
            </div>
            {item.relevantCardId && (
                <button
                    onClick={() => onScrollToAction(item.relevantCardId)}
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start sm:self-center inline-flex items-center flex-shrink-0"
                >
                    View Details <ArrowRight className="w-4 h-4 ml-1" />
                </button>
            )}
        </div>
    );
};

const AIStrategyCard = ({ strategy, onScrollToAction }) => {
    if (!strategy || typeof strategy !== 'object' || !strategy.summary) {
        return null;
    }

    const { summary, critical_issues = [], high_priority_warnings = [], content_strategy, score_rationale, overall_score } = strategy;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 dark:from-gray-800/50 dark:via-purple-900/20 dark:to-blue-900/20 p-6 sm:p-8 rounded-2xl border border-indigo-200 dark:border-gray-700 shadow-lg"
        >
            {/* Header */}
            <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white mr-4 shadow-md">
                    <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AI SEO Strategist</h2>
            </div>

            {/* SEO Score Progress Bar */}
            {typeof overall_score === 'number' && <ProgressBar score={overall_score} />}

            {/* Executive Summary */}
            <div className="bg-white/50 dark:bg-gray-900/20 p-4 rounded-lg mb-4">
                <p className="text-gray-700 dark:text-gray-200">{summary}</p>
            </div>

            {/* Score Rationale */}
            {score_rationale && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border-l-4 border-blue-400 dark:border-blue-600 flex items-start">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-300">{score_rationale}</p>
                </div>
            )}

            <div className="space-y-6">
                {/* Critical Issues */}
                {critical_issues.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3 flex items-center">
                            <AlertOctagon className="w-5 h-5 mr-2" />
                            Critical Issues
                        </h3>
                        <div className="space-y-3">
                            {critical_issues.map((item, index) => (
                                <IssueItem key={`crit-${index}`} item={item} onScrollToAction={onScrollToAction} severity="critical" />
                            ))}
                        </div>
                    </div>
                )}

                {/* High-Priority Warnings */}
                {high_priority_warnings.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            High-Priority Warnings
                        </h3>
                        <div className="space-y-3">
                            {high_priority_warnings.map((item, index) => (
                                <IssueItem key={`warn-${index}`} item={item} onScrollToAction={onScrollToAction} severity="warning" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Strategy */}
                {content_strategy && (
                    <div>
                        <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3 flex items-center">
                            <Lightbulb className="w-5 h-5 mr-2" />
                            Content Strategy
                        </h3>
                        <div className="p-4 bg-white/60 dark:bg-gray-700/50 rounded-lg border-l-4 border-teal-500">
                             <p className="text-gray-600 dark:text-gray-300">{content_strategy}</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AIStrategyCard;