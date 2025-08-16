import { load } from 'cheerio';
import logger from './logger.js';

/**
 * Runs comprehensive manual accessibility analysis.
 * @param {string} html The raw HTML content of the page.
 * @returns {Promise<object>} Accessibility audit results.
 */
export const analyzeAccessibility = async (html) => {
    logger.info('Starting manual accessibility analysis.');

    if (!html || typeof html !== 'string' || !html.trim()) {
        throw new Error('No valid HTML provided for accessibility analysis.');
    }

    const a11yAudit = {
        score: 100,
        status: 'excellent',
        issues: [],
        recommendations: [],
    };

    try {
        // Load HTML with Cheerio for analysis
        const $ = load(html);
        logger.info('HTML loaded for accessibility analysis');

        // 1. Document Structure Checks
        logger.info('Checking document structure...');
        
        const title = $('title').text().trim();
        if (!title) {
            a11yAudit.issues.push('❌ Missing page title');
            a11yAudit.recommendations.push('Add a descriptive <title> tag to improve SEO and accessibility');
            a11yAudit.score -= 10;
        } else if (title.length < 10) {
            a11yAudit.issues.push(`⚠️ Page title is very short: "${title}" (${title.length} characters)`);
            a11yAudit.recommendations.push('Use a more descriptive page title (10+ characters recommended)');
            a11yAudit.score -= 5;
        } else if (title.length > 60) {
            a11yAudit.issues.push(`⚠️ Page title is very long: ${title.length} characters`);
            a11yAudit.recommendations.push('Consider shortening the title for better display in search results');
            a11yAudit.score -= 2;
        } else {
            a11yAudit.issues.push(`✅ Good page title: "${title}"`);
        }

        const langAttr = $('html').attr('lang');
        if (!langAttr) {
            a11yAudit.issues.push('❌ Missing lang attribute on <html> element');
            a11yAudit.recommendations.push('Add lang attribute to <html> element (e.g., lang="en")');
            a11yAudit.score -= 8;
        } else {
            a11yAudit.issues.push(`✅ Language declared: "${langAttr}"`);
        }

        // 2. Heading Structure Analysis
        logger.info('Analyzing heading structure...');
        
        const headings = $('h1, h2, h3, h4, h5, h6');
        const h1Count = $('h1').length;
        
        if (headings.length === 0) {
            a11yAudit.issues.push('❌ No heading tags found');
            a11yAudit.recommendations.push('Use proper heading structure (h1-h6) to organize content');
            a11yAudit.score -= 15;
        } else {
            if (h1Count === 0) {
                a11yAudit.issues.push('❌ No h1 tag found');
                a11yAudit.recommendations.push('Add an h1 tag as the main page heading');
                a11yAudit.score -= 10;
            } else if (h1Count === 1) {
                const h1Text = $('h1').first().text().trim();
                a11yAudit.issues.push(`✅ Proper h1 structure: "${h1Text}"`);
            } else {
                a11yAudit.issues.push(`⚠️ Multiple h1 tags found (${h1Count})`);
                a11yAudit.recommendations.push('Use only one h1 tag per page for better SEO and accessibility');
                a11yAudit.score -= 6;
            }

            // Check heading hierarchy
            const headingLevels = [];
            headings.each((i, el) => {
                const level = parseInt(el.tagName.charAt(1));
                headingLevels.push({ level, text: $(el).text().trim().substring(0, 50) });
            });

            let hierarchyViolations = 0;
            for (let i = 1; i < headingLevels.length; i++) {
                if (headingLevels[i].level > headingLevels[i-1].level + 1) {
                    hierarchyViolations++;
                }
            }

            if (hierarchyViolations > 0) {
                a11yAudit.issues.push(`⚠️ ${hierarchyViolations} heading hierarchy violations`);
                a11yAudit.recommendations.push('Ensure headings follow sequential order (don\'t skip from h1 to h3)');
                a11yAudit.score -= hierarchyViolations * 3;
            } else if (headings.length > 1) {
                a11yAudit.issues.push(`✅ Good heading hierarchy with ${headings.length} headings`);
            }
        }

        // 3. Image Accessibility
        logger.info('Checking image accessibility...');
        
        const totalImages = $('img').length;
        const imagesWithoutAlt = $('img:not([alt])').length;
        const imagesWithEmptyAlt = $('img[alt=""]').length;
        const imagesWithMeaningfulAlt = $('img[alt]').filter((i, el) => $(el).attr('alt').trim().length > 0).length;

        if (totalImages === 0) {
            a11yAudit.issues.push('ℹ️ No images found on this page');
        } else {
            if (imagesWithoutAlt > 0) {
                a11yAudit.issues.push(`❌ ${imagesWithoutAlt} images missing alt attributes`);
                a11yAudit.recommendations.push('Add alt text to all images (use alt="" for decorative images only)');
                a11yAudit.score -= imagesWithoutAlt * 4;
            }

            if (imagesWithMeaningfulAlt > 0) {
                a11yAudit.issues.push(`✅ ${imagesWithMeaningfulAlt} images have meaningful alt text`);
            }

            if (imagesWithEmptyAlt > 0) {
                a11yAudit.issues.push(`ℹ️ ${imagesWithEmptyAlt} images marked as decorative (empty alt)`);
            }

            const altCoverage = ((totalImages - imagesWithoutAlt) / totalImages) * 100;
            a11yAudit.issues.push(`📊 Alt text coverage: ${altCoverage.toFixed(1)}% (${totalImages - imagesWithoutAlt}/${totalImages})`);
        }

        // 4. Form Accessibility
        logger.info('Analyzing form accessibility...');
        
        const formControls = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea');
        let unlabeledControls = 0;
        const controlDetails = [];

        formControls.each((i, el) => {
            const $el = $(el);
            const type = $el.attr('type') || $el.prop('tagName').toLowerCase();
            const id = $el.attr('id');
            const name = $el.attr('name');
            
            const hasLabel = id && $(`label[for="${id}"]`).length > 0;
            const hasAriaLabel = $el.attr('aria-label');
            const hasAriaLabelledBy = $el.attr('aria-labelledby');
            const hasPlaceholder = $el.attr('placeholder');
            const isInLabeledFieldset = $el.closest('fieldset').length > 0 &&
                                    $el.closest('fieldset').find('legend').length > 0;

            const isLabeled = hasLabel || hasAriaLabel || hasAriaLabelledBy || isInLabeledFieldset;
            
            if (!isLabeled) {
                unlabeledControls++;
                controlDetails.push(`${type}${name ? ` (name: ${name})` : ''}${id ? ` (id: ${id})` : ''}`);
            }
        });

        if (formControls.length === 0) {
            a11yAudit.issues.push('ℹ️ No form controls found on this page');
        } else {
            if (unlabeledControls > 0) {
                a11yAudit.issues.push(`❌ ${unlabeledControls} form controls lack proper labels`);
                a11yAudit.recommendations.push('Associate all form controls with descriptive labels using <label>, aria-label, or aria-labelledby');
                a11yAudit.score -= unlabeledControls * 5;
                
                // Show details for first few unlabeled controls
                controlDetails.slice(0, 3).forEach(detail => {
                    a11yAudit.issues.push(`  - Unlabeled ${detail}`);
                });
                if (controlDetails.length > 3) {
                    a11yAudit.issues.push(`  - ... and ${controlDetails.length - 3} more`);
                }
            } else {
                a11yAudit.issues.push(`✅ All ${formControls.length} form controls have proper labels`);
            }
        }

        // 5. Link Accessibility
        logger.info('Checking link accessibility...');
        
        const links = $('a[href]');
        let problematicLinks = 0;
        const linkIssues = [];

        links.each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim().toLowerCase();
            const ariaLabel = $el.attr('aria-label');
            const title = $el.attr('title');
            const href = $el.attr('href');

            const hasAccessibleName = ariaLabel || title || (text && text.length >= 3);
            const hasVagueText = text && ['click here', 'read more', 'more', 'here', 'link'].includes(text);
            const isEmptyHref = !href || href === '#' || href === '';

            if (!hasAccessibleName || hasVagueText || isEmptyHref) {
                problematicLinks++;
                if (linkIssues.length < 5) { // Limit examples
                    let issue = '';
                    if (!hasAccessibleName) issue = 'No accessible name';
                    else if (hasVagueText) issue = `Vague text: "${text}"`;
                    else if (isEmptyHref) issue = 'Empty or invalid href';
                    
                    linkIssues.push(`${issue} - href: "${href}"`);
                }
            }
        });

        if (links.length === 0) {
            a11yAudit.issues.push('ℹ️ No links found on this page');
        } else {
            if (problematicLinks > 0) {
                a11yAudit.issues.push(`❌ ${problematicLinks} links have accessibility issues`);
                a11yAudit.recommendations.push('Use descriptive link text that explains the destination or purpose');
                a11yAudit.score -= problematicLinks * 2;
                
                linkIssues.forEach(issue => {
                    a11yAudit.issues.push(`  - ${issue}`);
                });
                if (problematicLinks > linkIssues.length) {
                    a11yAudit.issues.push(`  - ... and ${problematicLinks - linkIssues.length} more issues`);
                }
            } else {
                a11yAudit.issues.push(`✅ All ${links.length} links have descriptive text`);
            }
        }

        // 6. Button Accessibility
        logger.info('Analyzing button accessibility...');
        
        const buttons = $('button, input[type="button"], input[type="submit"], input[type="reset"]');
        let inaccessibleButtons = 0;

        buttons.each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const value = $el.attr('value');
            const ariaLabel = $el.attr('aria-label');
            const title = $el.attr('title');
            const type = $el.attr('type');

            const hasAccessibleName = text || value || ariaLabel || title;
            
            if (!hasAccessibleName) {
                inaccessibleButtons++;
            }
        });

        if (buttons.length === 0) {
            a11yAudit.issues.push('ℹ️ No buttons found on this page');
        } else {
            if (inaccessibleButtons > 0) {
                a11yAudit.issues.push(`❌ ${inaccessibleButtons} buttons without accessible text`);
                a11yAudit.recommendations.push('Ensure all buttons have descriptive text, value, or ARIA labels');
                a11yAudit.score -= inaccessibleButtons * 5;
            } else {
                a11yAudit.issues.push(`✅ All ${buttons.length} buttons have accessible text`);
            }
        }

        // 7. Table Accessibility
        logger.info('Checking table accessibility...');
        
        const tables = $('table');
        let inaccessibleTables = 0;

        tables.each((i, el) => {
            const $table = $(el);
            const hasCaption = $table.find('caption').length > 0;
            const hasHeaders = $table.find('th').length > 0;
            const hasHeadersAttr = $table.find('[headers]').length > 0;
            const hasScope = $table.find('[scope]').length > 0;

            // Consider table accessible if it has any of these
            const isAccessible = hasCaption || hasHeaders || hasHeadersAttr || hasScope;
            
            if (!isAccessible) {
                inaccessibleTables++;
            }
        });

        if (tables.length === 0) {
            a11yAudit.issues.push('ℹ️ No tables found on this page');
        } else {
            if (inaccessibleTables > 0) {
                a11yAudit.issues.push(`❌ ${inaccessibleTables} tables lack proper structure`);
                a11yAudit.recommendations.push('Add table headers (th), captions, or scope attributes for data tables');
                a11yAudit.score -= inaccessibleTables * 4;
            } else {
                a11yAudit.issues.push(`✅ All ${tables.length} tables have proper structure`);
            }
        }

        // 8. ARIA and Semantic Elements
        logger.info('Checking ARIA usage and semantic elements...');
        
        const landmarkElements = $('main, nav, header, footer, aside, section, article').length;
        const ariaLandmarks = $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]').length;
        
        if (landmarkElements + ariaLandmarks === 0) {
            a11yAudit.issues.push('⚠️ No semantic landmarks found');
            a11yAudit.recommendations.push('Use semantic HTML5 elements (main, nav, header, footer) or ARIA landmarks');
            a11yAudit.score -= 8;
        } else {
            a11yAudit.issues.push(`✅ Found ${landmarkElements + ariaLandmarks} semantic landmarks`);
        }

        // 9. Color and Contrast Indicators
        logger.info('Checking color usage indicators...');
        
        const elementsWithColor = $('[style*="color"], [style*="background"]').length;
        if (elementsWithColor > 0) {
            a11yAudit.issues.push(`ℹ️ ${elementsWithColor} elements use inline color styles`);
            a11yAudit.recommendations.push('Ensure color contrast meets WCAG standards (4.5:1 for normal text, 3:1 for large text)');
        }

        // Ensure score doesn't go below 0
        a11yAudit.score = Math.max(0, Math.round(a11yAudit.score));

        // Determine final status based on score
        if (a11yAudit.score >= 90) {
            a11yAudit.status = 'excellent';
        } else if (a11yAudit.score >= 75) {
            a11yAudit.status = 'good';
        } else if (a11yAudit.score >= 60) {
            a11yAudit.status = 'fair';
        } else if (a11yAudit.score >= 40) {
            a11yAudit.status = 'poor';
        } else {
            a11yAudit.status = 'critical';
        }

        // Add summary recommendations based on status
        if (a11yAudit.status === 'excellent') {
            a11yAudit.recommendations.push('Great accessibility! Consider periodic manual testing with screen readers');
        } else if (a11yAudit.status === 'good') {
            a11yAudit.recommendations.push('Good accessibility foundation. Address remaining issues for better compliance');
        } else {
            a11yAudit.recommendations.unshift('Priority: Fix critical accessibility issues to improve user experience for people with disabilities');
        }

        const criticalIssues = a11yAudit.issues.filter(issue => issue.includes('❌')).length;
        const warningIssues = a11yAudit.issues.filter(issue => issue.includes('⚠️')).length;
        const successItems = a11yAudit.issues.filter(issue => issue.includes('✅')).length;

        logger.info(`Accessibility analysis completed successfully. Score: ${a11yAudit.score}/100, Status: ${a11yAudit.status}`);
        logger.info(`Issues: ${criticalIssues} critical, ${warningIssues} warnings, ${successItems} successful checks`);

        return a11yAudit;

    } catch (error) {
        logger.error('Error during accessibility analysis:', { error: error.message, stack: error.stack });
        throw new Error(`Accessibility analysis failed: ${error.message}`);
    }
};