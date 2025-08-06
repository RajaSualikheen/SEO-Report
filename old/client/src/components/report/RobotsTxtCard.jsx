import React from 'react';
import { FileSearch } from 'lucide-react';

export const RobotsTxtCard = ({ robotsTxtData, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">Robots.txt Status</p>
                    <p className={`text-xl font-extrabold ${robotsTxtData?.present ? 'text-green-500' : 'text-red-500'}`}>
                        {robotsTxtData?.present ? 'Present' : 'Missing'}
                    </p>
                </div>
                {robotsTxtData?.issues?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {robotsTxtData.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )
    );
};