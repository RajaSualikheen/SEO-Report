import React from 'react';
import { Shield } from 'lucide-react';

export const HttpsUsageCard = ({ explanation, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">HTTPS Status</p>
                    <p className={`text-xl font-extrabold ${explanation.includes('using HTTPS') ? 'text-green-500' : 'text-red-500'}`}>
                        {explanation.includes('using HTTPS') ? 'Enabled' : 'Disabled'}
                    </p>
                </div>
                <p className="text-sm text-slate-600">{explanation}</p>
            </div>
        )
    );
};