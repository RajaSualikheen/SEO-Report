import React from 'react';
import { BarChart2 } from 'lucide-react';

export const KeywordAnalysisCard = ({ keywordAnalysis, onOpenTopKeywordsModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                {keywordAnalysis?.length > 0 ? (
                    <>
                        <p className="text-sm text-slate-600">Keyword presence and density analysis:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600">
                            {keywordAnalysis.map((kw, index) => (
                                <li key={index} className="mb-1">
                                    <span className="font-medium">{kw.keyword}</span>: {kw.frequency} occurrences, {kw.density}% density
                                    {kw.recommendations?.length > 0 && (
                                        <span className="text-orange-500"> ({kw.recommendations.join('; ')})</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {onOpenTopKeywordsModal && (
                            <button
                                onClick={() => onOpenTopKeywordsModal(keywordAnalysis)}
                                className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                            >
                                <BarChart2 className="w-4 h-4 mr-2" /> View Top Keywords
                            </button>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-slate-600">No keyword analysis data available.</p>
                )}
            </div>
        )
    );
};