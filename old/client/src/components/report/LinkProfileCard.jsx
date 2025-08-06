import React from 'react';
import { Link2 } from 'lucide-react';

export const LinkProfileCard = ({ linkAuditData, onOpenBrokenLinksModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                    <div className="flex-1 mb-2 md:mb-0">
                        <p className="text-xs font-medium text-slate-700">Internal Links</p>
                        <p className="text-xl font-extrabold text-indigo-600">{linkAuditData?.internal_links || 0}</p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700">External Links</p>
                        <p className="text-xl font-extrabold text-indigo-600">{linkAuditData?.external_links || 0}</p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700">Broken Links</p>
                        <p className="text-xl font-extrabold text-red-600">{linkAuditData?.broken_links?.length || 0}</p>
                    </div>
                </div>
                {linkAuditData?.broken_links?.length > 0 && (
                    <button
                        onClick={() => onOpenBrokenLinksModal(linkAuditData.broken_links)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <Link2 className="w-4 h-4 mr-2" /> View Broken Links
                    </button>
                )}
            </div>
        )
    );
};