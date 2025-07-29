// components/AppModals.tsx
'use client'; // This component uses useState, useEffect, useRef, and ReactDOM.createPortal

import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle } from 'lucide-react'; // Assuming these icons are used

// Define interfaces for the data types that AppModals will display
interface KeywordData {
  keyword: string;
  frequency: number;
  density: number;
}

interface HeadingsData {
  tag: string;
  text: string;
}

interface BrokenLinkData {
  url: string;
  reason: string;
}

interface FixedWidthElementData {
  tag: string;
  value: string;
  source: string;
}

interface ResponsivenessIssueData {
  issue: string; // The issue text, e.g., "❌ Missing viewport meta tag"
}

interface AppModalsProps {
  showKeywordsModal: boolean;
  setShowKeywordsModal: (show: boolean) => void;
  keywordsData: { top_keywords: KeywordData[] } | null;

  showHeadingsModal: boolean;
  setShowHeadingsModal: (show: boolean) => void;
  headingsData: HeadingsData[] | null;

  showBrokenLinksModal: boolean;
  setShowBrokenLinksModal: (show: boolean) => void;
  brokenLinksData: BrokenLinkData[] | null;

  showFixedWidthElementsModal: boolean;
  setShowFixedWidthElementsModal: (show: boolean) => void;
  fixedWidthElementsData: FixedWidthElementData[] | null;

  showResponsivenessIssuesModal: boolean;
  setShowResponsivenessIssuesModal: (show: boolean) => void;
  responsivenessIssuesData: string[] | null; // Raw string issues
}

const AppModals: React.FC<AppModalsProps> = ({
  showKeywordsModal, setShowKeywordsModal, keywordsData,
  showHeadingsModal, setShowHeadingsModal, headingsData,
  showBrokenLinksModal, setShowBrokenLinksModal, brokenLinksData,
  showFixedWidthElementsModal, setShowFixedWidthElementsModal, fixedWidthElementsData,
  showResponsivenessIssuesModal, setShowResponsivenessIssuesModal, responsivenessIssuesData
}) => {
  const modalRef = useRef<HTMLDivElement>(null); // Specify type for useRef
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Ensure the 'modal-root' div exists in your app/layout.tsx or public/index.html
    const root = document.getElementById('modal-root');
    if (root) {
      setPortalRoot(root);
      console.log('✅ #modal-root found in DOM for AppModals.');
    } else {
      console.error('❌ Error: #modal-root NOT found in the DOM. Please ensure it is present in your app/layout.tsx or public/index.html.');
    }
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showKeywordsModal || showHeadingsModal || showBrokenLinksModal || showFixedWidthElementsModal || showResponsivenessIssuesModal;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'; // Prevent scrolling on body
      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus(); // Focus the modal for accessibility
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset'; // Restore scrolling
    }
    // Cleanup function to ensure overflow is reset even if component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [
    showKeywordsModal, showHeadingsModal, showBrokenLinksModal,
    showFixedWidthElementsModal, showResponsivenessIssuesModal
  ]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { // Type event as KeyboardEvent
      if (event.key === 'Escape') {
        setShowKeywordsModal(false);
        setShowHeadingsModal(false);
        setShowBrokenLinksModal(false);
        setShowFixedWidthElementsModal(false);
        setShowResponsivenessIssuesModal(false);
      }
    };
    const isAnyModalOpen = showKeywordsModal || showHeadingsModal || showBrokenLinksModal || showFixedWidthElementsModal || showResponsivenessIssuesModal;

    if (isAnyModalOpen) {
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [
    showKeywordsModal, setShowKeywordsModal, showHeadingsModal, setShowHeadingsModal,
    showBrokenLinksModal, setShowBrokenLinksModal, showFixedWidthElementsModal, setShowFixedWidthElementsModal,
    showResponsivenessIssuesModal, setShowResponsivenessIssuesModal
  ]);

  if (!portalRoot) {
    return null; // Don't render modals if portal root is not found
  }

  const modalTransitionClasses = 'transition-opacity duration-300 ease-out transform';
  const modalActiveClasses = 'opacity-100 scale-100';
  const modalInactiveClasses = 'opacity-0 scale-95';

  return (
    <>
      {/* Keywords Modal */}
      {showKeywordsModal && keywordsData && (
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showKeywordsModal ? modalActiveClasses : modalInactiveClasses}`}
            onClick={() => setShowKeywordsModal(false)}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                         w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                         border border-gray-200 dark:border-gray-700
                         ${modalTransitionClasses} ${showKeywordsModal ? modalActiveClasses : modalInactiveClasses}`}
              role="dialog"
              aria-modal="true"
              tabIndex={-1} // Use -1 for programmatic focus
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowKeywordsModal(false)}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Top Keywords</h3>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Keyword</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Frequency</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Density</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {keywordsData.top_keywords.map((kw, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                        <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-gray-100">{kw.keyword}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200">{kw.frequency}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200">{kw.density}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          portalRoot
        )
      )}

      {/* Headings Modal */}
      {showHeadingsModal && headingsData && (
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showHeadingsModal ? modalActiveClasses : modalInactiveClasses}`}
            onClick={() => setShowHeadingsModal(false)}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                         w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                         border border-gray-200 dark:border-gray-700
                         ${modalTransitionClasses} ${showHeadingsModal ? modalActiveClasses : modalInactiveClasses}`}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowHeadingsModal(false)}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Full Heading Order</h3>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Tag</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Text</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {headingsData.map((h, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                        <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-gray-100">&lt;{h.tag}&gt;</td>
                        <td className="px-4 py-3 whitespace-normal text-base text-gray-700 dark:text-gray-200">{h.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          portalRoot
        )
      )}

      {/* Broken Links Modal */}
      {showBrokenLinksModal && brokenLinksData && (
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showBrokenLinksModal ? modalActiveClasses : modalInactiveClasses}`}
            onClick={() => setShowBrokenLinksModal(false)}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                         w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                         border border-gray-200 dark:border-gray-700
                         ${modalTransitionClasses} ${showBrokenLinksModal ? modalActiveClasses : modalInactiveClasses}`}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowBrokenLinksModal(false)}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Broken Links Found</h3>

              {brokenLinksData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Link URL</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {brokenLinksData.map((link, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {link.url}
                            </a>
                          </td>
                          <td className="px-4 py-3 whitespace-normal text-sm text-red-700 dark:text-red-300">{link.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-green-600 dark:text-green-300 text-center text-xl py-8">No broken links found. Great job!</p>
              )}
            </div>
          </div>,
          portalRoot
        )
      )}

      {/* Fixed-Width Elements Modal */}
      {showFixedWidthElementsModal && fixedWidthElementsData && (
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showFixedWidthElementsModal ? modalActiveClasses : modalInactiveClasses}`}
            onClick={() => setShowFixedWidthElementsElementsModal(false)}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                         w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                         border border-gray-200 dark:border-gray-700
                         ${modalTransitionClasses} ${showFixedWidthElementsModal ? modalActiveClasses : modalInactiveClasses}`}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowFixedWidthElementsElementsModal(false)}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Fixed-Width Elements</h3>

              {fixedWidthElementsData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-lg">Tag</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Value</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-lg">Source</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {fixedWidthElementsData.map((element, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                          <td className="px-4 py-3 whitespace-nowrap text-base font-medium text-gray-900 dark:text-gray-100">&lt;{element.tag}&gt;</td>
                          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-700 dark:text-gray-200">{element.value}</td>
                          <td className="px-4 py-3 whitespace-normal text-base text-gray-700 dark:text-gray-200">{element.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-green-600 dark:text-green-300 text-center text-xl py-8">No fixed-width elements found. Great job!</p>
              )}
            </div>
          </div>,
          portalRoot
        )
      )}

      {/* Responsiveness Issues Modal */}
      {showResponsivenessIssuesModal && responsivenessIssuesData && (
        ReactDOM.createPortal(
          <div
            className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 ${modalTransitionClasses} ${showResponsivenessIssuesModal ? modalActiveClasses : modalInactiveClasses}`}
            onClick={() => setShowResponsivenessIssuesModal(false)}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 lg:p-10
                         w-11/12 max-w-7xl max-h-[95vh] overflow-y-auto relative
                         border border-gray-200 dark:border-gray-700
                         ${modalTransitionClasses} ${showResponsivenessIssuesModal ? modalActiveClasses : modalInactiveClasses}`}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowResponsivenessIssuesModal(false)}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Responsiveness Issues</h3>

              {responsivenessIssuesData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 p-4">
                    {responsivenessIssuesData.map((issue, index) => (
                      <li key={index} className="flex items-start mb-2">
                        {issue.startsWith('❌') ? <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0" />}
                        <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-green-600 dark:text-green-300 text-center text-xl py-8">No specific responsiveness issues found.</p>
              )}
            </div>
          </div>,
          portalRoot
        )
      )}
    </>
  );
};

export default AppModals;
