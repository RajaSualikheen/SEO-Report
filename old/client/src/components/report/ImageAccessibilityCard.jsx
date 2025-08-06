import React from 'react';
import { Lightbulb } from 'lucide-react';

export const ImageAccessibilityCard = ({ imageAnalysisData, onOpenImageIssuesModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                    <div className="flex-1 mb-2 md:mb-0">
                        <p className="text-xs font-medium text-slate-700">Total Images</p>
                        <p className="text-xl font-extrabold text-indigo-600">{imageAnalysisData?.content_images || 0}</p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700">Images without Alt Text</p>
                        <p className="text-xl font-extrabold text-red-600">{imageAnalysisData?.images_without_alt || 0}</p>
                    </div>
                </div>
                {imageAnalysisData?.detailed_issues?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {imageAnalysisData.detailed_issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {onOpenImageIssuesModal && (
                    <button
                        onClick={() => onOpenImageIssuesModal(imageAnalysisData)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <Lightbulb className="w-4 h-4 mr-2" /> View Image Issues
                    </button>
                )}
            </div>
        )
    );
};