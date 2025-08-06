import React from 'react';
import { Bar } from 'react-chartjs-2';
import { BookOpen, Hash, Layers, Lightbulb } from 'lucide-react';

export const ContentQualityCard = ({ contentAnalysisData, onOpenTopKeywordsModal, onOpenSuggestionsModal, isExpanded }) => {
    const getReadabilityStatusText = (score) => {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    };

    const getReadabilityColorClass = (score) => {
        if (score >= 70) return 'text-green-500';
        if (score >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const keywordChartData = contentAnalysisData?.top_keywords?.length > 0 ? {
        labels: contentAnalysisData.top_keywords.map(kw => kw.keyword),
        datasets: [{
            label: 'Keyword Density (%)',
            data: contentAnalysisData.top_keywords.map(kw => kw.density),
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
        }]
    } : null;

    const keywordChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top Keywords Density', color: '#0F172A' },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Density (%)', color: '#0F172A' },
                ticks: { color: '#0F172A' },
            },
            x: {
                ticks: { color: '#0F172A', autoSkip: false, maxRotation: 45, minRotation: 45 },
            },
        },
    };

    return (
        isExpanded && (
            <div className="space-y-4 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                    <div className="flex-1 mb-2 md:mb-0">
                        <p className="text-xs font-medium text-slate-700 flex items-center justify-center md:justify-start">
                            <Hash className="w-4 h-4 mr-1 text-slate-500" />
                            <span className="font-bold text-slate-900">Word Count:</span>
                        </p>
                        <p className="text-xl font-extrabold text-indigo-600 mt-1">
                            {contentAnalysisData.total_word_count || 'N/A'}
                        </p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700 flex items-center justify-center md:justify-start">
                            <BookOpen className="w-4 h-4 mr-1 text-slate-500" />
                            <span className="font-bold text-slate-900">Readability:</span>
                        </p>
                        <p className={`text-xl font-extrabold ${getReadabilityColorClass(contentAnalysisData.readability_score)} mt-1`}>
                            {getReadabilityStatusText(contentAnalysisData.readability_score)}
                            <span className="text-sm text-slate-500 ml-1">
                                ({contentAnalysisData.readability_score || 'N/A'})
                            </span>
                        </p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700 flex items-center justify-center md:justify-start">
                            <Layers className="w-4 h-4 mr-1 text-slate-500" />
                            <span className="font-bold text-slate-900">Uniqueness:</span>
                        </p>
                        <p className={`text-xl font-extrabold ${contentAnalysisData.uniqueness_analysis?.is_unique ? 'text-green-500' : 'text-red-500'} mt-1`}>
                            {contentAnalysisData.uniqueness_analysis?.is_unique ? 'Unique' : 'Duplicated'}
                        </p>
                    </div>
                </div>
                {contentAnalysisData.uniqueness_analysis?.duplication_issues?.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Duplication Issues:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {contentAnalysisData.uniqueness_analysis.duplication_issues.map((issue, index) => <li key={index}>{issue}</li>)}
                        </ul>
                    </div>
                )}
                {contentAnalysisData.keyword_suggestions?.length > 0 && onOpenSuggestionsModal && (
                    <button
                        onClick={() => onOpenSuggestionsModal(contentAnalysisData.keyword_suggestions)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <Lightbulb className="w-4 h-4 mr-2" /> View Suggestions
                    </button>
                )}
                {keywordChartData && (
                    <div className="mt-4 h-64">
                        <Bar data={keywordChartData} options={keywordChartOptions} />
                    </div>
                )}
            </div>
        )
    );
};