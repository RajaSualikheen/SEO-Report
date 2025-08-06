import React from 'react';
import { Rss } from 'lucide-react';

export const SocialMediaCard = ({ ogTwitterData, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                    <div className="flex-1 mb-2 md:mb-0">
                        <p className="text-xs font-medium text-slate-700">Open Graph Tags</p>
                        <p className={`text-xl font-extrabold ${ogTwitterData?.open_graph?.title?.present && ogTwitterData?.open_graph?.image?.present ? 'text-green-500' : 'text-red-500'}`}>
                            {ogTwitterData?.open_graph?.title?.present && ogTwitterData?.open_graph?.image?.present ? 'Present' : 'Missing'}
                        </p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4">
                        <p className="text-xs font-medium text-slate-700">Twitter Cards</p>
                        <p className={`text-xl font-extrabold ${ogTwitterData?.twitter_cards?.title?.present && ogTwitterData?.twitter_cards?.image?.present ? 'text-green-500' : 'text-red-500'}`}>
                            {ogTwitterData?.twitter_cards?.title?.present && ogTwitterData?.twitter_cards?.image?.present ? 'Present' : 'Missing'}
                        </p>
                    </div>
                </div>
                {ogTwitterData?.issues?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Issues:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {ogTwitterData.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )
    );
};