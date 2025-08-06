import React from 'react';
import { Layers } from 'lucide-react';

export const MetaRobotsCard = ({ metaRobotsData, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">Meta Robots Status</p>
                    <p className={`text-xl font-extrabold ${metaRobotsData?.is_noindex ? 'text-red-500' : metaRobotsData?.is_nofollow ? 'text-orange-500' : 'text-green-500'}`}>
                        {metaRobotsData?.is_noindex ? 'Noindex' : metaRobotsData?.is_nofollow ? 'Nofollow' : 'Indexable'}
                    </p>
                </div>
                {metaRobotsData?.issues?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {metaRobotsData.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )
    );
};