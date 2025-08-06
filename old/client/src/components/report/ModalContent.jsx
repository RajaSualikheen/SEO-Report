import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';

export const ModalContent = ({ title, data, type, onClose, modalRef, portalRoot }) => {
    const modalTransitionClasses = 'transition-opacity duration-300 ease-out transform';

    const renderContent = () => {
        switch (type) {
            case 'table':
                return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keyword</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Density (%)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((kw, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kw.keyword}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kw.frequency}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{kw.density}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'list':
                return (
                    <ul className="list-disc list-inside text-gray-700 p-4">
                        {data.map((item, index) => (
                            <li key={index} className="mb-2">{item}</li>
                        ))}
                    </ul>
                );
            case 'headings':
                return (
                    data.heading_order?.length > 0 || data.issues?.length > 0 ? (
                        <div className="p-4">
                            <h4 className="text-lg font-semibold text-gray-700 mb-2">All Headings</h4>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                {data.heading_order.map((heading, index) => (
                                    <li key={index} className="mb-1">&lt;{heading.tag}&gt; {heading.text}</li>
                                ))}
                            </ul>
                            {data.issues.length > 0 && (
                                <>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Issues</h4>
                                    <ul className="list-disc list-inside text-gray-700">
                                        {data.issues.map((issue, index) => (
                                            <li key={index} className="mb-1">{issue}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-green-600 text-center text-xl py-8">No heading issues or headings found.</p>
                    )
                );
            case 'brokenLinks':
                return (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Link URL</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((link, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 break-all">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link.url}</a>
                                        </td>
                                        <td className="px-4 py-3 whitespace-normal text-sm text-red-700">{link.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'fixedWidth':
                return (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Tag</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Value</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Source</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((element, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900">&lt;{element.tag}&gt;</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700">{element.value}</td>
                                        <td className="px-4 py-3 whitespace-normal text-base text-gray-700">{element.source}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'redirects':
                return (
                    <div className="space-y-4">
                        {Object.keys(data).map((url, index) => {
                            const chain = data[url];
                            const isGood = chain.final_status_code >= 200 && chain.final_status_code < 300 && chain.redirect_chain.length <= 2;
                            const statusColor = isGood ? 'text-green-500' : chain.final_status_code >= 400 ? 'text-red-500' : 'text-orange-500';
                            return (
                                <div key={index} className="bg-gray-100 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-900 break-all mb-2">
                                        <span className="text-sm text-gray-500">Original URL:</span> {url}
                                    </p>
                                    <p className="flex items-center text-sm font-medium">
                                        <span className={`w-2 h-2 rounded-full mr-2 ${isGood ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        Final Status: <span className={`ml-1 font-bold ${statusColor}`}>{chain.final_status_code || 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-gray-700 mt-2">
                                        <span className="font-semibold">Redirect Path:</span>
                                        <span className="break-all block md:inline">
                                            {chain.redirect_chain.map((link, i) => (
                                                <span key={i} className="text-xs md:text-sm">
                                                    {i > 0 && <span className="mx-1">→</span>}
                                                    <span className="text-blue-500 hover:underline">{link}</span>
                                                </span>
                                            ))}
                                        </span>
                                    </p>
                                    {chain.issues.length > 0 && (
                                        <ul className="mt-2 list-disc list-inside text-red-500 text-xs">
                                            {chain.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            case 'imageIssues':
                return (
                    <div className="space-y-4">
                        {data.detailed_issues.length > 0 && (
                            <>
                                <h4 className="text-lg font-semibold text-gray-700">Issues</h4>
                                <ul className="list-disc list-inside text-gray-700 p-4">
                                    {data.detailed_issues.map((issue, index) => (
                                        <li key={index} className="mb-2">{issue}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {data.recommendations.length > 0 && (
                            <>
                                <h4 className="text-lg font-semibold text-gray-700">Recommendations</h4>
                                <ul className="list-disc list-inside text-gray-700 p-4">
                                    {data.recommendations.map((rec, index) => (
                                        <li key={index} className="mb-2">{rec}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return ReactDOM.createPortal(
        <motion.div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 ${modalTransitionClasses}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={`bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative border border-gray-200 ${modalTransitionClasses}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                role="dialog"
                aria-modal="true"
                tabIndex="-1"
                ref={modalRef}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    aria-label="Close modal"
                >
                    <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">{title}</h3>
                {renderContent()}
            </motion.div>
        </motion.div>,
        portalRoot
    );
};