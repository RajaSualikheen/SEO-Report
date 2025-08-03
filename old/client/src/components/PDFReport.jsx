import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#F5F5F5',
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 12,
        color: '#333333',
    },
    header: {
        textAlign: 'center',
        marginBottom: 30,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 10,
        border: '1px solid #E0E0E0',
    },
    logo: {
        maxHeight: 50,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222222',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#555555',
    },
    reportSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        border: '1px solid #E0E0E0',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4F46E5', // Indigo color
        marginBottom: 15,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#666666',
    },
    categoryBars: {
        width: '50%',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    categoryName: {
        fontSize: 12,
        color: '#444444',
        flexGrow: 1,
    },
    categoryBar: {
        height: 6,
        backgroundColor: '#E0E0E0',
        width: '50%',
        borderRadius: 3,
        overflow: 'hidden',
    },
    categoryBarFill: {
        height: 6,
        borderRadius: 3,
    },
    list: {
        marginLeft: 10,
    },
    listItem: {
        fontSize: 12,
        marginBottom: 4,
        color: '#444444',
    },
    status: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    statusGood: {
        color: '#22C55E',
    },
    statusWarn: {
        color: '#F97316',
    },
    statusBad: {
        color: '#EF4444',
    },
    socialPreviewContainer: {
        border: '1px solid #ccc',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 10,
    },
    socialPreviewImage: {
        width: '100%',
        height: 150,
        objectFit: 'cover',
    },
    socialPreviewText: {
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    socialPreviewTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    socialPreviewDescription: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    localSeoContainer: {
        marginTop: 10,
    },
    localSeoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    localSeoIcon: {
        width: 12,
        height: 12,
        marginRight: 5,
    }
});

const getStatusIndicator = (status) => {
    switch (status) {
        case 'good': return { text: '✅ Good', style: styles.statusGood };
        case 'warning': return { text: '⚠️ Needs Fix', style: styles.statusWarn };
        case 'bad': return { text: '❌ Critical', style: styles.statusBad };
        default: return { text: '', style: {} };
    }
};

const PDFReport = ({ reportData, agencyName, agencyLogoPreview }) => {
    const backendData = reportData.backendData;
    const ogImage = backendData?.og_twitter_audit?.og_image_url || backendData?.og_twitter_audit?.twitter_image_url || 'https://via.placeholder.com/600x315?text=Social+Image+Preview';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    {agencyLogoPreview && <Image src={agencyLogoPreview} style={styles.logo} />}
                    {agencyName && <Text style={styles.title}>{agencyName}</Text>}
                    <Text style={styles.title}>Premium SEO Audit Report</Text>
                    <Text style={styles.subtitle}>Report for: {reportData.url}</Text>
                </View>

                {/* Overall Score Section */}
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Overall Score</Text>
                    <View style={styles.scoreContainer}>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreText}>{reportData.overallScore}</Text>
                            <Text style={styles.scoreLabel}>Total Score</Text>
                        </View>
                        <View style={styles.categoryBars}>
                            {Object.entries(reportData.groupedSections).map(([categoryName, sections]) => {
                                const scoreData = { score: sections.filter(s => s.status === 'good').length, max: sections.length };
                                const percentage = (scoreData.score / scoreData.max) * 100 || 0;
                                const color = percentage >= 80 ? '#22C55E' : percentage >= 60 ? '#F97316' : '#EF4444';

                                return (
                                    <View key={categoryName} style={styles.categoryRow}>
                                        <View style={[styles.categoryColor, { backgroundColor: color }]} />
                                        <Text style={styles.categoryName}>{categoryName}</Text>
                                        <View style={styles.categoryBar}>
                                            <View style={[styles.categoryBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* On-Page Content Audit Section */}
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>On-Page Content</Text>
                    {backendData.metadata_length_audit && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Title Tag</Text>
                            <Text style={styles.listItem}>Content: {backendData.metadata_length_audit.title.text || 'Missing'}</Text>
                            <Text style={styles.listItem}>Char Count: {backendData.metadata_length_audit.title.char_count}</Text>
                            <Text style={[styles.listItem, getStatusIndicator(backendData.metadata_length_audit.title.status.toLowerCase()).style]}>
                                Status: {backendData.metadata_length_audit.title.status}
                            </Text>
                            <Text style={{ fontSize: 10, marginTop: 5 }}>Recommendation: {backendData.metadata_length_audit.title.recommendation}</Text>
                        </View>
                    )}
                    {backendData.metadata_length_audit && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Meta Description</Text>
                            <Text style={styles.listItem}>Content: {backendData.metadata_length_audit.meta_description.text || 'Missing'}</Text>
                            <Text style={styles.listItem}>Char Count: {backendData.metadata_length_audit.meta_description.char_count}</Text>
                            <Text style={[styles.listItem, getStatusIndicator(backendData.metadata_length_audit.meta_description.status.toLowerCase()).style]}>
                                Status: {backendData.metadata_length_audit.meta_description.status}
                            </Text>
                            <Text style={{ fontSize: 10, marginTop: 5 }}>Recommendation: {backendData.metadata_length_audit.meta_description.recommendation}</Text>
                        </View>
                    )}
                    {backendData.h1_tags && (
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Heading Structure</Text>
                            <Text style={styles.listItem}>H1 Count: {backendData.h1_tags.length}</Text>
                            <Text style={styles.listItem}>H1 Text: {backendData.h1_tags.join(', ') || 'N/A'}</Text>
                            {backendData.heading_issues.length > 0 && (
                                <Text style={[styles.listItem, styles.statusWarn]}>Issues: {backendData.heading_issues.join('; ')}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Keyword Analysis Section */}
                {backendData.content_analysis?.keyword_report && (
                    <View style={styles.reportSection}>
                        <Text style={styles.sectionTitle}>Keyword Analysis</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5 }}>Target Keyword: {backendData.content_analysis.keyword_report.target_keyword}</Text>
                        <Text style={styles.listItem}>Keyword Density: {backendData.content_analysis.keyword_report.density.density}%</Text>
                        <Text style={styles.listItem}>Presence in Title: {backendData.content_analysis.keyword_report.presence.inTitle ? 'Yes' : 'No'}</Text>
                        <Text style={styles.listItem}>Presence in H1: {backendData.content_analysis.keyword_report.presence.inH1 ? 'Yes' : 'No'}</Text>
                        <Text style={styles.listItem}>Presence in URL: {backendData.content_analysis.keyword_report.presence.inUrl ? 'Yes' : 'No'}</Text>
                        <Text style={styles.listItem}>Presence in Content: {backendData.content_analysis.keyword_report.presence.inContent ? 'Yes' : 'No'}</Text>
                    </View>
                )}

                {/* Technical Audit Section */}
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Technical Audit</Text>
                    {backendData.canonical_tag && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Canonical Tag</Text>
                            <Text style={styles.listItem}>Status: {backendData.canonical_tag.status}</Text>
                            {backendData.canonical_tag.url && (
                                <Text style={styles.listItem}>URL: {backendData.canonical_tag.url}</Text>
                            )}
                        </View>
                    )}
                    {backendData.alt_image_tags && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Image Alt Tags</Text>
                            <Text style={styles.listItem}>Total Images: {backendData.alt_image_tags.totalImages}</Text>
                            <Text style={styles.listItem}>Missing Alt Tags: {backendData.alt_image_tags.missingAltCount}</Text>
                            <Text style={styles.listItem}>Empty Alt Tags: {backendData.alt_image_tags.emptyAltCount}</Text>
                        </View>
                    )}
                    {backendData.structured_data_audit && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Structured Data</Text>
                            <Text style={styles.listItem}>JSON-LD Found: {backendData.structured_data_audit.ld_json_found ? 'Yes' : 'No'}</Text>
                            {backendData.structured_data_audit.schema_types?.length > 0 && (
                                <Text style={styles.listItem}>Schema Types: {backendData.structured_data_audit.schema_types.join(', ')}</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Social Media Preview Section */}
                {backendData.og_twitter_audit && (
                    <View style={styles.reportSection}>
                        <Text style={styles.sectionTitle}>Social Media Integration</Text>
                        <View style={styles.socialPreviewContainer}>
                            <Image style={styles.socialPreviewImage} src={ogImage} />
                            <View style={styles.socialPreviewText}>
                                <Text style={styles.socialPreviewTitle}>
                                    {backendData.og_twitter_audit.og_title_content || backendData.og_twitter_audit.twitter_title_content || 'No Title Provided'}
                                </Text>
                                <Text style={styles.socialPreviewDescription}>
                                    {backendData.og_twitter_audit.og_description || backendData.og_twitter_audit.twitter_description || 'No description provided.'}
                                </Text>
                            </View>
                        </View>
                        {backendData.og_twitter_audit.issues.length > 0 && (
                            <View style={styles.list}>
                                <Text style={[styles.listItem, styles.statusWarn]}>Issues:</Text>
                                {backendData.og_twitter_audit.issues.map((issue, i) => (
                                    <Text key={i} style={styles.listItem}>{issue}</Text>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Mobile Responsiveness Section */}
                {backendData.mobile_responsiveness_audit && (
                    <View style={styles.reportSection}>
                        <Text style={styles.sectionTitle}>Mobile-Friendliness</Text>
                        <Text style={styles.listItem}>Viewport Meta: {backendData.mobile_responsiveness_audit.has_viewport_meta ? 'Yes' : 'No'}</Text>
                        <Text style={styles.listItem}>Fixed-Width Elements: {backendData.mobile_responsiveness_audit.fixed_width_elements.length} found</Text>
                        {backendData.mobile_responsiveness_audit.issues?.length > 0 && (
                             <Text style={[styles.listItem, styles.statusWarn]}>Issues: {backendData.mobile_responsiveness_audit.issues.join('; ')}</Text>
                        )}
                    </View>
                )}
            </Page>
        </Document>
    );
};

export default PDFReport;