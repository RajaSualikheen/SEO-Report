import React from 'react';
import { MapPin } from 'lucide-react';

export const LocalSeoCard = ({ localSeoAuditData, onOpenLocalSeoIssuesModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">Local SEO Status</p>
                    <p className={`text-xl font-extrabold ${localSeoAuditData?.status?.toLowerCase().includes('present') ? 'text-green-500' : localSeoAuditData?.status?.toLowerCase().includes('partial') ? 'text-orange-500' : 'text-red-500'}`}>
                        {localSeoAuditData?.status || 'N/A'}
                    </p>
                </div>
                {localSeoAuditData?.issues?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {localSeoAuditData.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {onOpenLocalSeoIssuesModal && localSeoAuditData?.issues?.length > 0 && (
                    <button
                        onClick={() => onOpenLocalSeoIssuesModal(localSeoAuditData)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <MapPin className="w-4 h-4 mr-2" /> View Local SEO Issues
                    </button>
                )}
            </div>
        )
    );
};