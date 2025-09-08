// src/pages/SERPAnalysis.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Hash, Layers, ListChecks, MessageSquare, ExternalLink } from 'lucide-react';

const SERPAnalysis = ({ serpData }) => {
    if (!serpData || serpData.status !== 'completed') {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-6 rounded-2xl shadow-md border border-slate-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Competitive Analysis</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                    {serpData?.reason || "This analysis could not be run. Please ensure a target keyword was provided."}
                </p>
            </div>
        );
    }

    const { contentGap, peopleAlsoAsk, competitors } = serpData;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Content Gap */}
                <div className="lg:col-span-1 space-y-6">
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" />
                        Content Gap Analysis
                    </h4>
                    <div className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Word Count</p>
                        <div className="flex items-baseline justify-between mt-2">
                            <div>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{contentGap.userWordCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Your Page</p>
                            </div>
                            <p className="text-slate-400 dark:text-slate-500 text-lg">vs</p>
                            <div>
                                <p className="text-2xl font-bold text-indigo-500">{contentGap.competitorAverageWordCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Competitor Avg.</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-2 flex items-center">
                            <ListChecks className="w-4 h-4 mr-2 text-indigo-500" />
                            Common Competitor Topics
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {contentGap.commonCompetitorHeadings.map((term, i) => (
                                <span key={i} className="px-3 py-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">{term}</span>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h5 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-2 flex items-center">
                            <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                            Common Competitor Schemas
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {contentGap.commonCompetitorSchemas.map((type, i) => (
                                <span key={i} className="px-3 py-1 text-xs bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 rounded-full font-mono">{type}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: People Also Ask */}
                <div className="lg:col-span-2 space-y-4">
                     <h4 className="font-bold text-slate-800 dark:text-white text-lg flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-teal-500" />
                        People Also Ask (Content Ideas)
                    </h4>
                    <div className="space-y-3">
                        {peopleAlsoAsk.map((question, i) => (
                            <p key={i} className="text-sm p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg text-slate-700 dark:text-slate-300 border-l-4 border-teal-400">
                                {question}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Competitor Table */}
            <div className="mt-8">
                <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Top 5 Competitors Analyzed</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700">
                     <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
                        <thead className="bg-slate-50 dark:bg-gray-700/80">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Title</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Word Count</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Link</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-200 dark:divide-gray-700">
                            {competitors.map((comp, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">{comp.title}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-semibold">{comp.wordCount || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                                            Visit <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default SERPAnalysis;