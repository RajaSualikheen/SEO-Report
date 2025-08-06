import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ReactDOM from 'react-dom';
import ModalContent from './ModalContent';

export const AppModals = ({ modalStates, setModalStates }) => {
    const modalRef = useRef(null);
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        const root = document.getElementById('modal-root');
        setPortalRoot(root || null);
    }, []);

    useEffect(() => {
        const handleOverflow = () => {
            const modalsOpen = Object.keys(modalStates).some(key => key.startsWith('show') && modalStates[key]);
            document.body.style.overflow = modalsOpen ? 'hidden' : 'unset';
        };
        handleOverflow();
        const timer = setTimeout(() => {
            if (modalRef.current) modalRef.current.focus();
        }, 50);
        return () => {
            clearTimeout(timer);
            handleOverflow();
        };
    }, [modalStates]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setModalStates(prev => ({
                    ...prev,
                    showTopKeywordsModal: false,
                    showSuggestionsModal: false,
                    showHeadingsModal: false,
                    showBrokenLinksModal: false,
                    showFixedWidthElementsModal: false,
                    showResponsivenessIssuesModal: false,
                    showRedirectsModal: false,
                    showSitemapIssuesModal: false,
                    showStructuredDataIssuesModal: false,
                    showLocalSeoIssuesModal: false,
                    showImageIssuesModal: false,
                }));
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [setModalStates]);

    if (!portalRoot) return null;

    const handleCloseModal = () => {
        setModalStates(prev => ({
            ...prev,
            showTopKeywordsModal: false,
            showSuggestionsModal: false,
            showHeadingsModal: false,
            showBrokenLinksModal: false,
            showFixedWidthElementsModal: false,
            showResponsivenessIssuesModal: false,
            showRedirectsModal: false,
            showSitemapIssuesModal: false,
            showStructuredDataIssuesModal: false,
            showLocalSeoIssuesModal: false,
            showImageIssuesModal: false,
        }));
    };

    const modalConfigs = [
        { show: modalStates.showTopKeywordsModal && modalStates.keywordsModalData?.top_keywords?.length > 0, title: 'Top Keywords', data: modalStates.keywordsModalData.top_keywords, type: 'table' },
        { show: modalStates.showSuggestionsModal && modalStates.keywordsModalData?.keyword_suggestions?.length > 0, title: 'Keyword Suggestions', data: modalStates.keywordsModalData.keyword_suggestions, type: 'list' },
        { show: modalStates.showHeadingsModal && modalStates.headingsModalData, title: 'Heading Structure', data: modalStates.headingsModalData, type: 'headings' },
        { show: modalStates.showBrokenLinksModal && modalStates.brokenLinksModalData?.length > 0, title: 'Broken Links Found', data: modalStates.brokenLinksModalData, type: 'brokenLinks' },
        { show: modalStates.showFixedWidthElementsModal && modalStates.fixedWidthElementsModalData?.length > 0, title: 'Fixed-Width Elements', data: modalStates.fixedWidthElementsModalData, type: 'fixedWidth' },
        { show: modalStates.showResponsivenessIssuesModal && modalStates.responsivenessIssuesModalData?.length > 0, title: 'Responsiveness Issues', data: modalStates.responsivenessIssuesModalData, type: 'list' },
        { show: modalStates.showRedirectsModal && modalStates.redirectsModalData, title: 'Redirect Chains', data: modalStates.redirectsModalData, type: 'redirects' },
        { show: modalStates.showSitemapIssuesModal && modalStates.sitemapIssuesModalData?.issues?.length > 0, title: 'Sitemap Issues', data: modalStates.sitemapIssuesModalData, type: 'list' },
        { show: modalStates.showStructuredDataIssuesModal && modalStates.structuredDataIssuesModalData?.issues?.length > 0, title: 'Structured Data Issues', data: modalStates.structuredDataIssuesModalData, type: 'list' },
        { show: modalStates.showLocalSeoIssuesModal && modalStates.localSeoIssuesModalData?.issues?.length > 0, title: 'Local SEO Issues', data: modalStates.localSeoIssuesModalData, type: 'list' },
        { show: modalStates.showImageIssuesModal && (modalStates.imageIssuesModalData?.detailed_issues?.length > 0 || modalStates.imageIssuesModalData?.recommendations?.length > 0), title: 'Image Issues', data: modalStates.imageIssuesModalData, type: 'imageIssues' },
    ];

    return (
        <>
            {modalConfigs.map((config, index) => (
                config.show && (
                    <ModalContent
                        key={index}
                        title={config.title}
                        data={config.data}
                        type={config.type}
                        onClose={handleCloseModal}
                        modalRef={modalRef}
                        portalRoot={portalRoot}
                    />
                )
            ))}
        </>
    );
};