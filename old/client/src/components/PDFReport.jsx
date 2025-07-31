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
});

const getStatusIndicator = (status) => {
    switch (status) {
        case 'good': return { text: '✅ Good', style: styles.statusGood };
        case 'warning': return { text: '⚠️ Needs Fix', style: styles.statusWarn };
        case 'bad': return { text: '❌ Critical', style: styles.statusBad };
        default: return { text: '', style: {} };
    }
};

const PDFReport = ({ reportData, agencyName, agencyLogoPreview }) => (
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
            
            {/* Meta Info Section */}
            {reportData.metadata_length_audit ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Title & Meta Description</Text>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.listItem}>Title: {reportData.metadata_length_audit.title.text || 'Missing'}</Text>
                        <Text style={styles.listItem}>Char Count: {reportData.metadata_length_audit.title.char_count}</Text>
                        <Text style={[styles.listItem, getStatusIndicator(reportData.metadata_length_audit.title.status.toLowerCase()).style]}>
                            Status: {getStatusIndicator(reportData.metadata_length_audit.title.status.toLowerCase()).text}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.listItem}>Meta Description: {reportData.metadata_length_audit.meta_description.text || 'Missing'}</Text>
                        <Text style={styles.listItem}>Char Count: {reportData.metadata_length_audit.meta_description.char_count}</Text>
                        <Text style={[styles.listItem, getStatusIndicator(reportData.metadata_length_audit.meta_description.status.toLowerCase()).style]}>
                            Status: {getStatusIndicator(reportData.metadata_length_audit.meta_description.status.toLowerCase()).text}
                        </Text>
                    </View>
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Title & Meta Description</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}

            {/* Headings Section */}
            {reportData.backendData.heading_issues ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Headings (H1-H3)</Text>
                    <View>
                        <Text style={styles.listItem}>H1 Count: {reportData.backendData.h1_count}</Text>
                        {reportData.backendData.heading_issues.length > 0 ? (
                            <View style={styles.list}>
                                <Text style={[styles.listItem, styles.statusBad]}>❌ Issues Found:</Text>
                                {reportData.backendData.heading_issues.map((issue, i) => <Text key={i} style={styles.listItem}>{issue}</Text>)}
                            </View>
                        ) : (
                            <Text style={[styles.listItem, styles.statusGood]}>✅ No heading issues found.</Text>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Headings (H1-H3)</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}

            {/* Image Alt Tags Section */}
            {reportData.backendData.alt_image_ratio ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Image Alt Text</Text>
                    <Text style={styles.listItem}>
                        Status: {reportData.backendData.alt_image_ratio.includes('No') ? '✅ No Images Found' : (
                            reportData.backendData.alt_image_ratio.split('/')[0] === reportData.backendData.alt_image_ratio.split('/')[1]
                                ? '✅ All images have alt tags'
                                : `⚠️ ${reportData.backendData.alt_image_ratio.split('/')[1] - reportData.backendData.alt_image_ratio.split('/')[0]} images are missing alt tags`
                        )}
                    </Text>
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Image Alt Text</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}
            
            {/* Broken Links Section */}
            {reportData.backendData.link_audit ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Broken Links</Text>
                    <Text style={styles.listItem}>Found {reportData.backendData.link_audit.broken_links_count} broken links.</Text>
                    {reportData.backendData.link_audit.broken_links_count > 0 && (
                        <View style={styles.list}>
                            {reportData.backendData.link_audit.broken_links.map((link, i) => (
                                <Text key={i} style={styles.listItem}>{link.url} - {link.reason}</Text>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Broken Links</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}
            
            {/* Social Meta Tags Section */}
            {reportData.backendData.og_twitter_audit ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Social Meta Tags</Text>
                    <Text style={styles.listItem}>
                        OG Title Found: {reportData.backendData.og_twitter_audit.og_title_found ? '✅ Yes' : '❌ No'}
                    </Text>
                    <Text style={styles.listItem}>
                        OG Image Found: {reportData.backendData.og_twitter_audit.og_image_found ? '✅ Yes' : '❌ No'}
                    </Text>
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Social Meta Tags</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}
            
            {/* Structured Data Section */}
            {reportData.backendData.structured_data_audit ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Structured Data</Text>
                    <Text style={styles.listItem}>
                        JSON-LD Found: {reportData.backendData.structured_data_audit.ld_json_found ? '✅ Yes' : '❌ No'}
                    </Text>
                    {reportData.backendData.structured_data_audit.schema_types.length > 0 && (
                        <Text style={styles.listItem}>Schema Type(s): {reportData.backendData.structured_data_audit.schema_types.join(', ')}</Text>
                    )}
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Structured Data</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}

            {/* Mobile Responsiveness Section */}
            {reportData.backendData.mobile_responsiveness_audit ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Mobile-Friendliness</Text>
                    <Text style={styles.listItem}>
                        Mobile-friendly: {reportData.backendData.mobile_responsiveness_audit.has_viewport_meta ? '✅ Yes' : '❌ No'}
                    </Text>
                    {reportData.backendData.mobile_responsiveness_audit.fixed_width_elements.length > 0 && (
                        <Text style={styles.listItem}>
                            ⚠️ Fixed-width elements found. This may cause issues.
                        </Text>
                    )}
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Mobile-Friendliness</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}

            {/* Readability & Word Count Section */}
            {reportData.backendData.content_analysis ? (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Readability & Word Count</Text>
                    <Text style={styles.listItem}>Readability Score: {reportData.backendData.content_analysis.flesch_reading_ease_score.toFixed(2)}</Text>
                    <Text style={styles.listItem}>Word Count: {reportData.backendData.content_analysis.total_word_count}</Text>
                    {reportData.backendData.content_analysis.keyword_suggestions && (
                        <View style={styles.list}>
                            <Text style={styles.listItem}>Suggestions:</Text>
                            {reportData.backendData.content_analysis.keyword_suggestions.map((suggestion, i) => (
                                <Text key={i} style={styles.listItem}>{suggestion}</Text>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.reportSection}>
                    <Text style={styles.sectionTitle}>Readability & Word Count</Text>
                    <Text style={[styles.listItem, styles.statusWarn]}>⚠️ Data not found for this section.</Text>
                </View>
            )}
        </Page>
    </Document>
);

export default PDFReport;