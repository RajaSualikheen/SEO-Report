import React from 'react';
import { CodeIcon } from 'lucide-react';

export const StructuredDataCard = ({ structuredDataAuditData, onOpenStructuredDataIssuesModal, isExpanded }) => {
    return (
        isExpanded && (
            <div className="space-y-2 py-2">
                <div className="bg-slate-100 p-4 rounded-lg text-center">
                    <p className="text-xs font-medium text-slate-700">Structured Data Found</p>
                    <p className={`text-xl font-extrabold ${structuredDataAuditData?.ld_json_found ? 'text-green-500' : 'text-red-500'}`}>
                        {structuredDataAuditData?.ld_json_found ? 'Yes' : 'No'}
                    </p>
                </div>
                {structuredDataAuditData?.invalid_schemas?.length > 0 && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h5 className="text-md font-semibold text-red-700 mb-1">Invalid Schemas:</h5>
                        <ul className="list-disc list-inside text-red-600 text-sm">
                            {structuredDataAuditData.invalid_schemas.map((schema, index) => (
                                <li key={index}>{schema}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {onOpenStructuredDataIssuesModal && structuredDataAuditData?.issues?.length > 0 && (
                    <button
                        onClick={() => onOpenStructuredDataIssuesModal(structuredDataAuditData)}
                        className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm mt-2"
                    >
                        <CodeIcon className="w-4 h-4 mr-2" /> View Structured Data Issues
                    </button>
                )}
            </div>
        )
    );
};