import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { CheckCircle, AlertTriangle, FileDown } from 'lucide-react';
import StatusBadge from './StatusBadge';
import CardTitleIcon from './CardTitleIcon';
import Tooltip from './Tooltip';
import ContentQualityCard from './ContentQualityCard';
import KeywordAnalysisCard from './KeywordAnalysisCard';
import ContentStructureCard from './ContentStructureCard';
import ImageAccessibilityCard from './ImageAccessibilityCard';
import PageSpeedCard from './PageSpeedCard';
import LinkProfileCard from './LinkProfileCard';
import StructuredDataCard from './StructuredDataCard';
import LocalSeoCard from './LocalSeoCard';
import SocialMediaCard from './SocialMediaCard';
import MobileExperienceCard from './MobileExperienceCard';
import HttpsUsageCard from './HttpsUsageCard';
import RobotsTxtCard from './RobotsTxtCard';
import MetaRobotsCard from './MetaRobotsCard';
import HttpStatusRedirectsCard from './HttpStatusRedirectsCard';
import SitemapValidationCard from './SitemapValidationCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const ReportCard = ({
    title, status, explanation, action, sectionScore,
    contentAnalysisData, onOpenTopKeywordsModal, onOpenSuggestionsModal,
    headingAuditData, onOpenHeadingsModal,
    linkAuditData, onOpenBrokenLinksModal,
    ogTwitterData, mobileResponsivenessData, onOpenFixedWidthElementsModal, onOpenResponsivenessIssuesModal,
    structuredDataAuditData, metadataLengthData, localSeoAuditData, keywordAnalysis,
    robotsTxtData, metaRobotsData, httpStatusAndRedirectsData, sitemapValidationData, onOpenRedirectsModal,
    pagespeedData, imageAnalysisData, onOpenImageIssuesModal, onOpenSitemapIssuesModal, onOpenStructuredDataIssuesModal, onOpenLocalSeoIssuesModal,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderCardContent = () => {
        switch (title) {
            case 'Content Quality Analysis':
                return (
                    <ContentQualityCard
                        contentAnalysisData={contentAnalysisData}
                        onOpenTopKeywordsModal={onOpenTopKeywordsModal}
                        onOpenSuggestionsModal={onOpenSuggestionsModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Keyword Analysis':
                return (
                    <KeywordAnalysisCard
                        keywordAnalysis={keywordAnalysis}
                        onOpenTopKeywordsModal={onOpenTopKeywordsModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Content Structure':
                return (
                    <ContentStructureCard
                        headingAuditData={headingAuditData}
                        onOpenHeadingsModal={onOpenHeadingsModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Image Accessibility':
                return (
                    <ImageAccessibilityCard
                        imageAnalysisData={imageAnalysisData}
                        onOpenImageIssuesModal={onOpenImageIssuesModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Page Speed & Core Web Vitals':
                return (
                    <PageSpeedCard
                        pagespeedData={pagespeedData}
                        isExpanded={isExpanded}
                    />
                );
            case 'Link Profile':
                return (
                    <LinkProfileCard
                        linkAuditData={linkAuditData}
                        onOpenBrokenLinksModal={onOpenBrokenLinksModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Structured Data Schema':
                return (
                    <StructuredDataCard
                        structuredDataAuditData={structuredDataAuditData}
                        onOpenStructuredDataIssuesModal={onOpenStructuredDataIssuesModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Local SEO':
                return (
                    <LocalSeoCard
                        localSeoAuditData={localSeoAuditData}
                        onOpenLocalSeoIssuesModal={onOpenLocalSeoIssuesModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Social Media Integration':
                return (
                    <SocialMediaCard
                        ogTwitterData={ogTwitterData}
                        isExpanded={isExpanded}
                    />
                );
            case 'Mobile Experience':
                return (
                    <MobileExperienceCard
                        mobileResponsivenessData={mobileResponsivenessData}
                        onOpenFixedWidthElementsModal={onOpenFixedWidthElementsModal}
                        onOpenResponsivenessIssuesModal={onOpenResponsivenessIssuesModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'HTTPS Usage':
                return (
                    <HttpsUsageCard
                        explanation={explanation}
                        isExpanded={isExpanded}
                    />
                );
            case 'Robots.txt Analysis':
                return (
                    <RobotsTxtCard
                        robotsTxtData={robotsTxtData}
                        isExpanded={isExpanded}
                    />
                );
            case 'Meta Robots Tag':
                return (
                    <MetaRobotsCard
                        metaRobotsData={metaRobotsData}
                        isExpanded={isExpanded}
                    />
                );
            case 'HTTP Status & Redirects':
                return (
                    <HttpStatusRedirectsCard
                        httpStatusAndRedirectsData={httpStatusAndRedirectsData}
                        onOpenRedirectsModal={onOpenRedirectsModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Sitemap Validation':
                return (
                    <SitemapValidationCard
                        sitemapValidationData={sitemapValidationData}
                        onOpenSitemapIssuesModal={onOpenSitemapIssuesModal}
                        isExpanded={isExpanded}
                    />
                );
            case 'Title Optimization':
            case 'Meta Description':
                return (
                    <div className="space-y-2 py-2">
                        <p className="flex items-center text-sm">
                            <Info className="w-4 h-4 mr-1 text-slate-500" />
                            **Char Count:** {metadataLengthData.char_count || 'N/A'} characters
                        </p>
                        <p className="text-sm italic">
                            **Status:** <span className={
                                metadataLengthData.status?.toLowerCase() === 'optimal' ? 'text-green-500' :
                                metadataLengthData.status?.toLowerCase() === 'too short' ? 'text-orange-500' :
                                'text-red-500'
                            }>{metadataLengthData.status || 'N/A'}</span>
                        </p>
                        <p className="text-sm">
                            **Recommendation:** {metadataLengthData.recommendation || 'No recommendation provided.'}
                        </p>
                        {metadataLengthData.text && metadataLengthData.status?.toLowerCase() !== 'optimal' && (
                            <p className="text-xs text-slate-500 mt-2">
                                Current: "{metadataLengthData.text.substring(0, 100)}{metadataLengthData.text.length > 100 ? '...' : ''}"
                            </p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            className={`w-full relative bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-md flex flex-col text-left border border-slate-200 transition-all duration-300 ease-in-out hover:shadow-lg`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <StatusBadge status={status} />
            <div className="flex items-center mb-2">
                <CardTitleIcon title={title} />
                <h3 className="text-lg font-bold text-slate-900 ml-2 leading-tight">{title}</h3>
            </div>
            <p className={`text-sm text-slate-600 mb-4 flex-shrink-0`}>
                {explanation || `Click "View Details" for more.`}
                {sectionScore !== undefined && (
                    <span className="ml-2 font-semibold">
                        Score: <span className={status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-orange-500' : 'text-red-500'}>{sectionScore}%</span>
                    </span>
                )}
            </p>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-slate-600 mb-4"
                        style={{ overflow: 'visible' }}
                    >
                        {renderCardContent()}
                    </motion.div>
                )}
            </AnimatePresence>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full mt-4 text-sm font-medium text-blue-600 hover:text-purple-600 transition-colors duration-200"
            >
                {isExpanded ? 'Collapse Details' : 'View Details'}
            </button>
        </motion.div>
    );
};