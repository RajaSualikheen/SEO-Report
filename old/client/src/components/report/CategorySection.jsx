import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportCard from './ReportCard';
import { ElegantDivider } from './utils';

export const CategorySection = ({ categoryName, sections, backendData, onOpenModal, calculateSectionScore }) => {
    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <ElegantDivider categoryName={categoryName} />
            </motion.div>
            <section className="flex flex-col space-y-6 mt-6">
                <AnimatePresence mode="wait">
                    {sections?.map((section, index) => (
                        <ReportCard
                            key={section.id}
                            title={section.title}
                            status={section.status}
                            explanation={section.explanation}
                            action={section.action}
                            contentAnalysisData={section.id === 'content-quality-analysis' ? section.contentAnalysisData : null}
                            keywordAnalysis={section.id === 'keyword-analysis' ? section.keywordPresenceAnalysis : null}
                            onOpenTopKeywordsModal={section.id === 'content-quality-analysis' ? () => onOpenModal('showTopKeywordsModal', section.contentAnalysisData?.top_keywords || []) : null}
                            onOpenSuggestionsModal={section.id === 'content-quality-analysis' ? () => onOpenModal('showSuggestionsModal', section.contentAnalysisData?.keyword_suggestions || []) : null}
                            headingAuditData={section.id === 'heading-structure' ? { 
                                h1_count: section.headingCounts?.h1_count || 0, 
                                h2_count: section.headingCounts?.h2_count || 0, 
                                h3_count: section.headingCounts?.h3_count || 0, 
                                heading_order: section.headingOrder || [], 
                                issues: section.headingIssues || [] 
                            } : null}
                            onOpenHeadingsModal={section.id === 'heading-structure' ? () => onOpenModal('showHeadingsModal', { heading_order: section.headingOrder || [], issues: section.headingIssues || [] }) : null}
                            linkAuditData={section.id === 'link-audit' ? section.linkAuditData : null}
                            onOpenBrokenLinksModal={section.id === 'link-audit' ? () => onOpenModal('showBrokenLinksModal', section.linkAuditData?.broken_links || []) : null}
                            ogTwitterData={section.id === 'social-media-integration' ? section.ogTwitterData : null}
                            mobileResponsivenessData={section.id === 'mobile-responsiveness-audit' ? section.mobileResponsivenessData : null}
                            onOpenFixedWidthElementsModal={section.id === 'mobile-responsiveness-audit' ? () => onOpenModal('showFixedWidthElementsModal', section.mobileResponsivenessData?.fixed_width_elements || []) : null}
                            onOpenResponsivenessIssuesModal={section.id === 'mobile-responsiveness-audit' ? () => onOpenModal('showResponsivenessIssuesModal', section.mobileResponsivenessData?.issues || []) : null}
                            structuredDataAuditData={section.id === 'structured-data-schema' ? section.structuredDataAuditData : null}
                            localSeoAuditData={section.id === 'local-seo-audit' ? section.localSeoAuditData : null}
                            metadataLengthData={section.metadataLengthData}
                            imageAnalysisData={section.id === 'image-accessibility' ? section.imageAnalysisData : null}
                            onOpenImageIssuesModal={section.id === 'image-accessibility' ? () => onOpenModal('showImageIssuesModal', section.imageAnalysisData) : null}
                            robotsTxtData={section.id === 'robots-txt-analysis' ? section.robotsTxtData : null}
                            metaRobotsData={section.id === 'meta-robots-analysis' ? section.metaRobotsData : null}
                            httpStatusAndRedirectsData={section.id === 'http-status-and-redirects' ? section.httpStatusAndRedirectsData : null}
                            onOpenRedirectsModal={section.id === 'http-status-and-redirects' ? () => onOpenModal('showRedirectsModal', section.httpStatusAndRedirectsData) : null}
                            sitemapValidationData={section.id === 'sitemap-validation' ? section.sitemapValidationData : null}
                            onOpenSitemapIssuesModal={section.id === 'sitemap-validation' ? () => onOpenModal('showSitemapIssuesModal', section.sitemapValidationData) : null}
                            pagespeedData={section.id === 'pagespeed-audit' ? section.pagespeedData : null}
                            onOpenStructuredDataIssuesModal={section.id === 'structured-data-schema' ? () => onOpenModal('showStructuredDataIssuesModal', section.structuredDataAuditData) : null}
                            onOpenLocalSeoIssuesModal={section.id === 'local-seo-audit' ? () => onOpenModal('showLocalSeoIssuesModal', section.localSeoAuditData) : null}
                            sectionScore={calculateSectionScore(section, backendData)}
                        />
                    ))}
                </AnimatePresence>
            </section>
        </div>
    );
};