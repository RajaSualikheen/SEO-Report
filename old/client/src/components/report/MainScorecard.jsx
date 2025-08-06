import React from 'react';
import { motion } from 'framer-motion';
import { Circle, Line } from 'rc-progress';
import { Info } from 'lucide-react';
import { getCategoryStatus } from './utils';

export const MainScorecard = ({ reportData }) => {
    const { overallScore, groupedSections = {}, backendData = {} } = reportData;

    const getScoreColor = (score) => {
        if (score >= 80) return '#22C55E';
        if (score >= 60) return '#F97316';
        return '#EF4444';
    };

    const getScoreBadgeClass = (totalIssues) => {
        if (totalIssues >= 5) return 'bg-red-500 text-white';
        if (totalIssues >= 2) return 'bg-orange-500 text-white';
        return 'bg-green-500 text-white';
    };

    const getCategoryIssueCount = (categoryName, groupedSections, backendData) => {
        const sections = groupedSections?.[categoryName] || [];
        return sections.reduce((count, section) => {
            const issues = backendData[section.dataKey]?.issues || [];
            return count + issues.length;
        }, 0);
    };

    const totalIssueCount = Object.values(groupedSections).reduce((acc, sections) => {
        return acc + sections.reduce((count, section) => {
            const issues = backendData[section.dataKey]?.issues || [];
            return count + issues.length;
        }, 0);
    }, 0);
    const issueStatus = totalIssueCount >= 5 ? 'Critical' : totalIssueCount >= 2 ? 'Warning' : 'Good';

    return (
        <motion.div
            className="bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-lg flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="flex-1 flex flex-col space-y-4 w-full">
                <div className="flex justify-between items-center text-gray-600 font-semibold mb-4">
                    <span className="text-lg">On-page score</span>
                    <div className="flex items-center space-x-2">
                        <span>Issues: {totalIssueCount}</span>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${getScoreBadgeClass(totalIssueCount)}`}>
                            {issueStatus}
                        </span>
                        <Info className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
                <div className="flex items-center space-x-8">
                    <div className="relative w-40 h-40 flex-shrink-0">
                        {isNaN(overallScore) ? (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <span className="text-4xl font-extrabold text-red-500">N/A</span>
                                <p className="text-xs text-gray-500 mt-1">Score Unavailable</p>
                            </div>
                        ) : (
                            <>
                                <Circle
                                    percent={overallScore}
                                    strokeWidth={7}
                                    strokeColor={overallScore >= 80 ? '#67C924' : overallScore >= 60 ? '#FFD166' : '#EF4444'}
                                    trailColor="#E5E7EB"
                                    trailWidth={7}
                                />
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <span className="text-4xl font-extrabold text-gray-900">{overallScore}%</span>
                                    <p className="text-xs text-gray-500 mt-1">On-page score</p>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        {Object.keys(groupedSections).map((categoryName, index) => (
                            <div key={index} className="flex flex-col space-y-1">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-gray-700">{categoryName}</span>
                                    <span className="text-gray-900 font-bold">{getCategoryIssueCount(categoryName, groupedSections, backendData)} issues</span>
                                </div>
                                <Line
                                    percent={getCategoryIssueCount(categoryName, groupedSections, backendData) === 0 ? 100 : getCategoryIssueCount(categoryName, groupedSections, backendData) <= 2 ? 80 : 60}
                                    strokeWidth={3}
                                    strokeColor={getCategoryStatus(groupedSections[categoryName]) === 'good' ? '#22C55E' : getCategoryStatus(groupedSections[categoryName]) === 'warning' ? '#F97316' : '#EF4444'}
                                    trailColor="#E5E7EB"
                                    trailWidth={3}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};