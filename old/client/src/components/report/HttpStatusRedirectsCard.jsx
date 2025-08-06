import React from 'react';
import { RepeatIcon } from 'lucide-react';

export const HttpStatusRedirectsCard = ({ httpStatusAndRedirectsData, onOpenRedirectsModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">HTTP Status</p>
                    <p className={`text-xl font-extrabold ${Object.values(httpStatusAndRedirectsData || {}).some(r => r.issues.some(i => i.includes('❌'))) ? 'text-red-500' : Object.values(httpStatusAndRedirectsData || {}).some(r => r.issues.some(i => i.includes('⚠️'))) ? 'text-orange-500' : 'text-green-500'}`}>
                        {Object.values(httpStatusAndRedirectsData || {}).some(r => r.issues.some(i => i.includes('❌'))) ? 'Issues Found' : 'OK'}
                    </p>
                </div>
                {httpStatusAndRedirectsData && onOpenRedirectsModal && (
                    <button
                        onClick={() => onOpenRedirectsModal(httpStatusAndRedirectsData)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <RepeatIcon className="w-4 h-4 mr-2" /> View Redirect Details
                    </button>
                )}
            </div>
        )
    );
};