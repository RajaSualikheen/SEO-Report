import React from 'react';
import { Globe } from 'lucide-react';

export const SitemapValidationCard = ({ sitemapValidationData, onOpenSitemapIssuesModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">Sitemap Status</p>
                    <p className={`text-xl font-extrabold ${sitemapValidationData?.found ? 'text-green-500' : 'text-red-500'}`}>
                        {sitemapValidationData?.found ? 'Found' : 'Not Found'}
                    </p>
                </div>
                {sitemapValidationData?.invalid_urls?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Invalid URLs:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {sitemapValidationData.invalid_urls.map((url, index) => (
                                <li key={index}>{url}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {onOpenSitemapIssuesModal && sitemapValidationData?.issues?.length > 0 && (
                    <button
                        onClick={() => onOpenSitemapIssuesModal(sitemapValidationData)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <Globe className="w-4 h-4 mr-2" /> View Sitemap Issues
                    </button>
                )}
            </div>
        )
    );
};