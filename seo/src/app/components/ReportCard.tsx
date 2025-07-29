// components/ReportCard.tsx
'use client'; // This component uses useState and Framer Motion, so it must be a Client Component

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, BookOpen, Hash, TrendingUp, X, FileCode, Link as LinkIcon, ExternalLink, MinusCircle, Smartphone, Code, Info, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Define interfaces for the data types that ReportCard will display
// These interfaces should match the ones defined in app/report/page.tsx
interface MetadataLengthData {
  status: string;
  recommendation: string;
  length?: number;
  min_length?: number;
  max_length?: number;
  char_count?: number; // Added char_count as it's used
  content?: string; // Added content as it's used
  text?: string; // Added text as it's used
}

interface KeywordData {
  keyword: string;
  frequency: number;
  density: number;
}

interface ContentAnalysisData {
  word_count?: number; // Corrected to total_word_count as used in JSX
  total_word_count?: number; // Added total_word_count
  flesch_reading_ease_score?: number; // Made optional as it might be N/A
  flesch_reading_ease_grade?: string;
  top_keywords: KeywordData[];
  keyword_suggestions: string[];
}

interface HeadingData {
  tag: string;
  text: string;
}

interface SpeedAuditData {
  issues: string[];
  has_inline_styles?: boolean; // Added for speed audit
  has_inline_scripts?: boolean; // Added for speed audit
  external_css_count?: number; // Added for speed audit
  external_js_count?: number; // Added for speed audit
}

interface SitemapData {
  found: boolean;
  url_count: number;
  url?: string;
  issues?: string[];
}

interface BrokenLinkData {
  url: string;
  reason: string;
}

interface LinkAuditData {
  total_internal_links?: number; // Corrected to internal_links_count
  internal_links_count?: number; // Added for link audit
  total_external_links?: number; // Corrected to external_links_count
  external_links_count?: number; // Added for link audit
  broken_links_count: number;
  broken_links: BrokenLinkData[];
}

interface OgTwitterAuditData {
  og_title_found: boolean;
  og_title_content?: string;
  og_image_found: boolean;
  og_image_url?: string;
  twitter_title_found: boolean;
  twitter_title_content?: string;
  twitter_image_found: boolean;
  twitter_image_url?: string;
  issues?: string[]; // Added for social meta issues
}

interface MobileResponsivenessAuditData {
  has_viewport_meta: boolean;
  viewport_content?: string;
  fixed_width_elements: { tag: string; value: string; source: string }[];
  issues: string[];
}

interface StructuredDataAuditData {
  ld_json_found: boolean;
  schema_types: string[];
  issues: string[];
  raw_data?: any;
}

interface LocalSeoAuditData {
  status: string;
  address?: string;
  phone?: string;
  gmb_link?: string;
  schema_present?: boolean;
  issues?: string[];
  local_business_schema_found?: boolean; // Added for local SEO
  organization_schema_found?: boolean; // Added for local SEO
  physical_address_found?: boolean; // Added for local SEO
  phone_number_found?: boolean; // Added for local SEO
  Maps_embed_found?: boolean; // Added for local SEO
  geo_coordinates_found?: boolean; // Added for local SEO
}

// Define the props for the ReportCard component
interface ReportCardProps {
  title: string;
  status: 'good' | 'warning' | 'bad';
  explanation: string | null;
  action?: string | null;
  // Data for different sections
  contentAnalysisData?: ContentAnalysisData | null;
  onOpenKeywordsModal?: (data: ContentAnalysisData) => void; // Typed data
  headingCounts?: { h1_count: number; h2_count: number; h3_count: number } | null;
  headingOrder?: HeadingData[] | null;
  headingIssues?: string[] | null;
  onOpenHeadingsModal?: (data: HeadingData[]) => void; // Typed data
  speedAuditData?: SpeedAuditData | null;
  sitemapData?: SitemapData | null;
  linkAuditData?: LinkAuditData | null;
  onOpenBrokenLinksModal?: (data: BrokenLinkData[]) => void; // Typed data
  ogTwitterData?: OgTwitterAuditData | null;
  mobileResponsivenessData?: MobileResponsivenessAuditData | null;
  onOpenFixedWidthElementsModal?: (data: { tag: string; value: string; source: string }[]) => void; // Typed data
  onOpenResponsivenessIssuesModal?: (data: string[]) => void; // Typed data
  structuredDataAuditData?: StructuredDataAuditData | null;
  metadataLengthData?: MetadataLengthData | null;
  localSeoAuditData?: LocalSeoAuditData | null;
  overallScore?: number;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title, status, explanation, action,
  contentAnalysisData, onOpenKeywordsModal,
  headingCounts, headingOrder, headingIssues, onOpenHeadingsModal,
  speedAuditData,
  sitemapData,
  linkAuditData,
  onOpenBrokenLinksModal,
  ogTwitterData,
  mobileResponsivenessData,
  onOpenFixedWidthElementsModal,
  onOpenResponsivenessIssuesModal,
  structuredDataAuditData,
  metadataLengthData,
  localSeoAuditData,
  overallScore
}) => {
  // State for Accordion/Expandable Details
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  let statusIcon: JSX.Element;
  let statusColorClass: string;
  let statusText: string;

  switch (status) {
    case 'good':
      statusIcon = <CheckCircle className="w-8 h-8 text-green-500" />;
      statusColorClass = 'text-green-500';
      statusText = '✓ Good';
      break;
    case 'warning':
      statusIcon = <AlertTriangle className="w-8 h-8 text-orange-500" />;
      statusColorClass = 'text-orange-500';
      statusText = '⚠️ Needs Fix';
      break;
    case 'bad':
      statusIcon = <AlertTriangle className="w-8 h-8 text-red-500" />;
      statusColorClass = 'text-red-500';
      statusText = '❌ Critical Issue';
      break;
    default:
      statusIcon = <Info className="w-8 h-8 text-gray-500" />;
      statusColorClass = 'text-gray-500';
      statusText = 'N/A';
  }

  const getReadabilityStatusText = (score: number | undefined): string => {
    if (score === undefined || score === null) return 'N/A';
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  };

  const getReadabilityColorClass = (score: number | undefined): string => {
    if (score === undefined || score === null) return 'text-gray-500';
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getAuditIcon = (condition: boolean): JSX.Element => {
    return condition ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
  };

  const getAuditIssueIcon = (issueText: string): JSX.Element => {
    if (issueText.startsWith('❌')) return <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />;
    if (issueText.startsWith('⚠️')) return <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />;
    return <CheckCircle className="w-5 h-5 text-green-500 mr-2" />;
  };

  const defaultSocialImage: string = 'https://via.placeholder.com/600x315?text=Social+Image+Preview';

  // Helper for Tooltip
  interface TooltipProps {
    children: React.ReactNode;
    text: string;
  }
  const Tooltip: React.FC<TooltipProps> = ({ children, text }) => {
    const [showTooltip, setShowTooltip] = useState<boolean>(false);
    return (
      <div className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}>
        {children}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 dark:bg-gray-200 dark:text-gray-800"
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      className={`relative bg-white p-6 rounded-xl shadow-lg flex flex-col text-left dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700
                  min-h-[250px] group ${isExpanded ? 'h-auto' : 'h-[250px]'} overflow-hidden transition-all duration-300 ease-in-out`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.15), 0 5px 10px -5px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Colored Badge on top-right */}
      <span className={`absolute top-0 right-0 px-3 py-1 text-sm font-semibold rounded-bl-lg rounded-tr-xl
                       ${status === 'good' ? 'bg-green-500' : status === 'warning' ? 'bg-orange-500' : 'bg-red-500'}
                       text-white dark:text-gray-100`}>
        {statusText.replace('✓ ', '').replace('⚠️ ', '').replace('❌ ', '')}
      </span>

      <div className="flex items-center mb-3 pt-2">
        {statusIcon}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-2 leading-tight">
          {title}
          <Tooltip text={`Overall status: ${statusText}. Click to expand for details.`}>
            <Info className="w-4 h-4 ml-2 inline-block text-gray-400 hover:text-blue-500 cursor-help" />
          </Tooltip>
        </h3>
      </div>
      {/* Initial explanation or short summary */}
      <p className={`text-base font-medium ${statusColorClass} mb-4 flex-shrink-0`}>
        {explanation || `Click "View Details" for more.`}
      </p>

      {/* Expandable Content Area */}
      <div className="relative flex-grow">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-gray-600 dark:text-gray-300"
              style={{ overflow: 'visible' }} // Allow content to overflow during animation
            >
              {/* Content for Title Optimization */}
              {title === 'Title Optimization' && metadataLengthData && (
                <div className="space-y-2 py-2">
                  <p className="flex items-center text-sm">
                    <Info className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                    <strong>Char Count:</strong> {metadataLengthData.char_count} characters
                  </p>
                  <p className="text-sm italic">
                    <strong>Status:</strong> <span className={
                      metadataLengthData.status.toLowerCase() === 'optimal' ? 'text-green-500' :
                        metadataLengthData.status.toLowerCase() === 'too short' ? 'text-orange-500' :
                          'text-red-500'
                    }>{metadataLengthData.status}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Recommendation:</strong> {metadataLengthData.recommendation}
                  </p>
                  {metadataLengthData.text && metadataLengthData.status.toLowerCase() !== 'optimal' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                    </p>
                  )}
                </div>
              )}

              {/* Content for Meta Description */}
              {title === 'Meta Description' && metadataLengthData && (
                <div className="space-y-2 py-2">
                  <p className="flex items-center text-sm">
                    <Info className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                    <strong>Char Count:</strong> {metadataLengthData.char_count} characters
                  </p>
                  <p className="text-sm italic">
                    <strong>Status:</strong> <span className={
                      metadataLengthData.status.toLowerCase() === 'optimal' ? 'text-green-500' :
                        metadataLengthData.status.toLowerCase() === 'too short' ? 'text-orange-500' :
                          'text-red-500'
                    }>{metadataLengthData.status}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Recommendation:</strong> {metadataLengthData.recommendation}
                  </p>
                  {metadataLengthData.text && metadataLengthData.text.length > 0 && metadataLengthData.status.toLowerCase() !== 'optimal' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                    </p>
                  )}
                </div>
              )}

              {/* Content Quality Analysis (including Keywords & Readability) */}
              {title === 'Content Quality Analysis' && contentAnalysisData && (
                <div className="space-y-4 py-2">
                  <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg text-center flex flex-col md:flex-row md:justify-around md:items-center">
                    <div className="flex-1 mb-2 md:mb-0">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center md:justify-start">
                        <Hash className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-gray-900 dark:text-gray-100">Word Count:</span>{' '}
                      </p>
                      <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                        {contentAnalysisData.total_word_count || 'N/A'}
                      </p>
                    </div>
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-blue-200 dark:border-gray-600 pt-2 md:pt-0 md:pl-4">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center md:justify-start">
                        <BookOpen className="w-4 h-4 mr-1 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-gray-900 dark:text-gray-100">Readability:</span>{' '}
                      </p>
                      <p className={`text-xl font-extrabold ${getReadabilityColorClass(contentAnalysisData.flesch_reading_ease_score)} mt-1`}>
                        {getReadabilityStatusText(contentAnalysisData.flesch_reading_ease_score)}
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          ({contentAnalysisData.flesch_reading_ease_score?.toFixed(1) || 'N/A'})
                        </span>
                      </p>
                    </div>
                  </div>

                  {contentAnalysisData.top_keywords && contentAnalysisData.top_keywords.length > 0 && onOpenKeywordsModal && (
                    <button
                      onClick={() => onOpenKeywordsModal(contentAnalysisData)}
                      className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-600 transition duration-300 flex items-center justify-center text-sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" /> View Top Keywords
                    </button>
                  )}

                  {/* Keyword Strategy Suggestions */}
                  {contentAnalysisData.keyword_suggestions && contentAnalysisData.keyword_suggestions.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg">
                      <h5 className="text-md font-semibold text-purple-700 dark:text-purple-400 mb-2">Keyword Strategy:</h5>
                      <ul className="list-disc list-inside text-purple-600 dark:text-purple-300 text-sm">
                        {contentAnalysisData.keyword_suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start mb-1">
                            {suggestion.startsWith('❌') ? <AlertTriangle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" /> :
                              suggestion.startsWith('⚠️') ? <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" /> :
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />}
                            <span>{suggestion.replace('❌ ', '').replace('⚠️ ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Content Structure */}
              {title === 'Content Structure' && headingCounts && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div><p className="font-medium">H1</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{headingCounts.h1_count}</p></div>
                    <div><p className="font-medium">H2</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{headingCounts.h2_count}</p></div>
                    <div><p className="font-medium">H3</p><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{headingCounts.h3_count}</p></div>
                  </div>
                  {headingOrder && headingOrder.length > 0 && onOpenHeadingsModal && (
                    <button
                      onClick={() => onOpenHeadingsModal(headingOrder)}
                      className="w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-600 transition duration-300 flex items-center justify-center text-sm"
                    >
                      <BookOpen className="w-4 h-4 mr-2" /> View Full Structure
                    </button>
                  )}
                  {headingIssues && headingIssues.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                      <h5 className="text-md font-semibold text-red-700 dark:text-red-400 mb-1">Issues:</h5>
                      <ul className="list-disc list-inside text-red-600 dark:text-red-300 text-sm">
                        {headingIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Image Accessibility */}
              {title === 'Image Accessibility' && explanation && (
                <div className="space-y-2 py-2">
                  <p className="text-sm">{explanation}</p>
                </div>
              )}

              {/* Speed Performance */}
              {title === 'Speed Performance' && speedAuditData && (
                <div className="space-y-3 py-2 text-sm">
                  <p className="flex items-center">
                    {getAuditIcon(speedAuditData.has_inline_styles === false)} {/* Inverted logic: good if no inline styles */}
                    Inline Styles: {speedAuditData.has_inline_styles ? 'Found' : 'None'}
                  </p>
                  <p className="flex items-center">
                    {getAuditIcon(speedAuditData.has_inline_scripts === false)} {/* Inverted logic: good if no inline scripts */}
                    Inline Scripts: {speedAuditData.has_inline_scripts ? 'Found' : 'None'}
                  </p>
                  <p className="flex items-center text-green-600 dark:text-green-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    External CSS: {speedAuditData.external_css_count || 0} files
                  </p>
                  <p className="flex items-center text-green-600 dark:text-green-300">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    External JS: {speedAuditData.external_js_count || 0} files
                  </p>
                  {speedAuditData.issues && speedAuditData.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <h5 className="text-md font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Speed Issues:</h5>
                      <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300 text-sm">
                        {speedAuditData.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            {getAuditIssueIcon(issue)}
                            <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Sitemap & Crawling */}
              {title === 'Sitemap & Crawling' && sitemapData && (
                <div className="space-y-3 py-2 text-sm">
                  <p className="flex items-center text-base font-semibold">
                    {status === 'good' ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />}
                    <span>{statusText}</span>
                  </p>
                  {sitemapData.found && sitemapData.url_count !== undefined && sitemapData.url_count > 0 && (
                    <p className="flex items-center text-sm ml-7 text-gray-600 dark:text-gray-400">
                      <FileCode className="w-4 h-4 mr-1" />
                      Contains {sitemapData.url_count} URLs.
                    </p>
                  )}
                  {sitemapData.issues && sitemapData.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <h5 className="text-md font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Sitemap Issues:</h5>
                      <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300 text-sm">
                        {sitemapData.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            {getAuditIssueIcon(issue)}
                            <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Link Profile */}
              {title === 'Link Profile' && linkAuditData && (
                <div className="space-y-3 py-2 text-sm">
                  <p className="flex items-center">
                    <LinkIcon className="w-4 h-4 text-blue-500 mr-2" />
                    Internal Links: {linkAuditData.internal_links_count || 'N/A'}
                  </p>
                  <p className="flex items-center">
                    <ExternalLink className="w-4 h-4 text-blue-500 mr-2" />
                    External Links: {linkAuditData.external_links_count || 'N/A'}
                  </p>
                  {linkAuditData.broken_links_count > 0 && onOpenBrokenLinksModal ? (
                    <>
                      <p className="flex items-center text-red-600 font-semibold">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        Broken Links: {linkAuditData.broken_links_count} found
                      </p>
                      <button
                        onClick={() => onOpenBrokenLinksModal(linkAuditData.broken_links)}
                        className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-red-600 transition duration-300 flex items-center justify-center text-sm"
                      >
                        <MinusCircle className="w-4 h-4 mr-2" /> View Broken Links
                      </button>
                    </>
                  ) : (
                    <p className="flex items-center text-green-600 font-semibold">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      No broken links found.
                    </p>
                  )}
                </div>
              )}

              {/* Structured Data Schema */}
              {title === 'Structured Data Schema' && structuredDataAuditData && (
                <div className="space-y-3 py-2 text-sm">
                  {structuredDataAuditData.ld_json_found ? (
                    structuredDataAuditData.schema_types.length > 0 ? (
                      <>
                        <p className="flex items-center text-green-600 font-semibold">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          Schema Found:
                        </p>
                        <ul className="list-disc list-inside ml-7">
                          {structuredDataAuditData.schema_types.map((type, index) => (
                            <li key={index} className="text-gray-700 dark:text-gray-200">
                              `@type`: {type}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="flex items-center text-orange-600 font-semibold">
                        <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                        JSON-LD found, but no `@type` property detected or types were empty.
                      </p>
                    )
                  ) : (
                    <p className="flex items-center text-red-600 font-semibold">
                      <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                      No structured data (JSON-LD) schema found.
                    </p>
                  )}
                  {structuredDataAuditData.issues && structuredDataAuditData.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <h5 className="text-md font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Structured Data Issues:</h5>
                      <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300 text-sm">
                        {structuredDataAuditData.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            {getAuditIssueIcon(issue)}
                            <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* NEW: Local SEO Details */}
              {title === 'Local SEO' && localSeoAuditData && (
                <div className="space-y-3 py-2 text-sm">
                  <p className="font-semibold text-base mb-2">Key Local SEO Elements:</p>
                  <p className="flex items-center">
                    {getAuditIcon(localSeoAuditData.local_business_schema_found || localSeoAuditData.organization_schema_found)}
                    Schema Markup: {localSeoAuditData.local_business_schema_found ? 'LocalBusiness' : localSeoAuditData.organization_schema_found ? 'Organization' : 'Not Found'}
                  </p>
                  <p className="flex items-center">
                    {getAuditIcon(localSeoAuditData.physical_address_found)}
                    Physical Address: {localSeoAuditData.physical_address_found ? 'Found' : 'Missing'}
                  </p>
                  <p className="flex items-center">
                    {getAuditIcon(localSeoAuditData.phone_number_found)}
                    Phone Number: {localSeoAuditData.phone_number_found ? 'Found' : 'Missing'}
                  </p>
                  <p className="flex items-center">
                    {getAuditIcon(localSeoAuditData.Maps_embed_found)}
                    Google Maps Embed: {localSeoAuditData.Maps_embed_found ? 'Found' : 'Missing'}
                  </p>
                  {localSeoAuditData.geo_coordinates_found && (
                    <p className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Geo Coordinates: Found in schema
                    </p>
                  )}

                  {localSeoAuditData.issues && localSeoAuditData.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <h5 className="text-md font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Local SEO Issues & Tips:</h5>
                      <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300 text-sm">
                        {localSeoAuditData.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            {getAuditIssueIcon(issue)}
                            <span>{issue.replace('❌ ', '').replace('⚠️ ', '').replace('ℹ️ ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Social Media Integration */}
              {title === 'Social Media Integration' && ogTwitterData && (
                <div className="space-y-3 py-2 text-sm">
                  {(ogTwitterData.og_title_found || ogTwitterData.twitter_title_found) && (ogTwitterData.og_image_found || ogTwitterData.twitter_image_found) ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={ogTwitterData.og_image_url || ogTwitterData.twitter_image_url || defaultSocialImage}
                        alt="Social Media Preview"
                        className="w-full h-auto object-cover"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultSocialImage; }}
                      />
                      <div className="p-3 bg-gray-50 dark:bg-gray-700">
                        <p className="text-md font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {ogTwitterData.og_title_content || ogTwitterData.twitter_title_content || 'No Title Provided'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          A brief description of the content for social media.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="flex items-center text-red-600 font-semibold text-center">
                      <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                      No social meta preview found.
                    </p>
                  )}
                  {ogTwitterData.issues && ogTwitterData.issues.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <h5 className="text-md font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Social Meta Issues:</h5>
                      <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-300 text-sm">
                        {ogTwitterData.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            {getAuditIssueIcon(issue)}
                            <span>{issue.replace('❌ ', '').replace('⚠️ ', '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Experience */}
              {title === 'Mobile Experience' && mobileResponsivenessData && (
                <div className="space-y-3 py-2 text-sm">
                  <p className="flex items-center">
                    {getAuditIcon(mobileResponsivenessData.has_viewport_meta)}
                    Viewport Meta: {mobileResponsivenessData.has_viewport_meta ? 'Found' : 'Missing'}
                  </p>
                  {mobileResponsivenessData.has_viewport_meta && (
                    <p className="ml-7 text-xs text-gray-600 dark:text-gray-400 break-all">
                      Content: "{mobileResponsivenessData.viewport_content || 'N/A'}"
                    </p>
                  )}
                  {mobileResponsivenessData.fixed_width_elements.length > 0 && onOpenFixedWidthElementsModal ? (
                    <>
                      <p className="flex items-center text-red-600 font-semibold">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        Fixed-Width Elements: {mobileResponsivenessData.fixed_width_elements.length}
                      </p>
                      <button
                        onClick={() => onOpenFixedWidthElementsModal(mobileResponsivenessData.fixed_width_elements)}
                        className="w-full bg-amber-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-amber-600 transition duration-300 flex items-center justify-center text-sm"
                      >
                        <FileCode className="w-4 h-4 mr-2" /> View Fixed Elements
                      </button>
                    </>
                  ) : (
                    <p className="flex items-center text-green-600 font-semibold">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      No fixed-width elements.
                    </p>
                  )}
                  {mobileResponsivenessData.issues && mobileResponsivenessData.issues.length > 0 && onOpenResponsivenessIssuesModal ? (
                    <>
                      <p className="flex items-center text-yellow-600 font-semibold mt-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                        Responsiveness Issues: {mobileResponsivenessData.issues.length}
                      </p>
                      <button
                        onClick={() => onOpenResponsivenessIssuesModal(mobileResponsivenessData.issues)}
                        className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-yellow-600 transition duration-300 flex items-center justify-center text-sm"
                      >
                        <Smartphone className="w-4 h-4 mr-2" /> View Issues
                      </button>
                    </>
                  ) : (
                    <p className="flex items-center text-green-600 font-semibold mt-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      No responsiveness issues.
                    </p>
                  )}
                </div>
              )}

              {/* Generic Technical/Security Sections that don't have complex data structures to display */}
              {(title === 'Canonical URL' || title === 'HTTPS Usage' || title === 'Robots.txt' || title === 'Favicon') && explanation && (
                <div className="space-y-2 py-2">
                  <p className="text-sm">{explanation}</p>
                </div>
              )}

              {action && (
                <button className="w-full mt-4 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center text-base">
                  {action}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* "View Details" / "Collapse" Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-4 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-lg
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-sm"
      >
        {isExpanded ? 'Collapse Details' : 'View Details'}
      </button>
    </motion.div>
  );
};

export default ReportCard;
