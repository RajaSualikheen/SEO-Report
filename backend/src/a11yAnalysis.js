import { load } from 'cheerio';
import logger from './logger.js';

/**
 * Accessibility analysis (fast, resilient).
 * Returns the same shape as before:
 * {
 *   score: number,
 *   status: 'excellent'|'good'|'fair'|'poor'|'critical',
 *   issues: string[],
 *   recommendations: string[]
 * }
 */

/** Category deduction caps to keep scoring fair on large pages */
const CAPS = {
  TITLE: 10,
  HTML_LANG: 8,
  HEADINGS_BASE: 16,          // h1 missing/multiple + hierarchy
  IMAGES: 20,
  FORMS: 25,
  LINKS: 20,
  BUTTONS: 20,
  TABLES: 16,
  LANDMARKS: 8,
};

/** Limits for how many detailed examples to include in issues to avoid bloat */
const EXAMPLE_LIMITS = {
  FORMS: 3,
  LINKS: 5,
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/** Safe section runner — never lets one section crash the whole audit */
const safeRun = async (label, fn, a11yAudit) => {
  try {
    await fn();
  } catch (err) {
    logger.error(`${label} check failed: ${err.message}`);
    a11yAudit.issues.push(`⚠️ Skipped ${label} check due to an internal error`);
  }
};

/** Compute final status from score */
const statusFromScore = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
};

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
    const $ = load(html);
    logger.info('HTML loaded for accessibility analysis');

    // Cache common selections once
    const $html = $('html');
    const $title = $('title');
    const $headings = $('h1, h2, h3, h4, h5, h6');
    const $h1s = $('h1');
    const $imgs = $('img');
    const $forms = $('form');
    const $formControls = $(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'
    );
    const $links = $('a[href]');
    const $buttons = $('button, input[type="button"], input[type="submit"], input[type="reset"]');
    const $tables = $('table');
    const $landmarks = $('main, nav, header, footer, aside, section, article');
    const $ariaLandmarks = $(
      '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
    );
    const $inlineStyled = $('[style*="color"], [style*="background"]');

    // 1) Document Structure
    await safeRun('Document Structure', async () => {
      // Title checks (capped)
      const titleText = ($title.first().text() || '').trim();
      let titlePenalty = 0;

      if (!titleText) {
        a11yAudit.issues.push('❌ Missing page title');
        a11yAudit.recommendations.push(
          'Add a descriptive <title> tag to improve SEO and accessibility'
        );
        titlePenalty += 10;
      } else {
        const len = titleText.length;
        if (len < 10) {
          a11yAudit.issues.push(`⚠️ Page title is very short: "${titleText}" (${len} characters)`);
          a11yAudit.recommendations.push(
            'Use a more descriptive page title (10+ characters recommended)'
          );
          titlePenalty += 5;
        } else if (len > 60) {
          a11yAudit.issues.push(`⚠️ Page title is very long: ${len} characters`);
          a11yAudit.recommendations.push('Consider shortening the title for better SERP display');
          titlePenalty += 2;
        } else {
          a11yAudit.issues.push(`✅ Good page title: "${titleText}"`);
        }
      }
      a11yAudit.score -= clamp(titlePenalty, 0, CAPS.TITLE);

      // lang attribute (capped)
      const langAttr = $html.attr('lang');
      if (!langAttr) {
        a11yAudit.issues.push('❌ Missing lang attribute on <html> element');
        a11yAudit.recommendations.push('Add lang attribute to <html> element (e.g., lang="en")');
        a11yAudit.score -= CAPS.HTML_LANG;
      } else {
        a11yAudit.issues.push(`✅ Language declared: "${langAttr}"`);
      }
    }, a11yAudit);

    // 2) Headings & hierarchy
    await safeRun('Headings', async () => {
      if ($headings.length === 0) {
        a11yAudit.issues.push('❌ No heading tags found');
        a11yAudit.recommendations.push('Use proper heading structure (h1–h6) to organize content');
        a11yAudit.score -= 15; // baseline (within HEADINGS_BASE cap overall)
        return;
      }

      let penalty = 0;

      // h1 presence & count
      const h1Count = $h1s.length;
      if (h1Count === 0) {
        a11yAudit.issues.push('❌ No h1 tag found');
        a11yAudit.recommendations.push('Add an h1 tag as the main page heading');
        penalty += 10;
      } else if (h1Count === 1) {
        const h1Text = ($h1s.first().text() || '').trim();
        a11yAudit.issues.push(`✅ Proper h1 structure: "${h1Text}"`);
      } else {
        a11yAudit.issues.push(`⚠️ Multiple h1 tags found (${h1Count})`);
        a11yAudit.recommendations.push(
          'Use only one h1 tag per page for better SEO and accessibility'
        );
        penalty += 6;
      }

      // hierarchy violations
      const headingLevels = $headings
        .toArray()
        .map((el) => ({ level: parseInt(el.tagName.charAt(1), 10), text: ($(el).text() || '').trim() }));
      let hierarchyViolations = 0;
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i].level > headingLevels[i - 1].level + 1) hierarchyViolations++;
      }
      if (hierarchyViolations > 0) {
        a11yAudit.issues.push(`⚠️ ${hierarchyViolations} heading hierarchy violations`);
        a11yAudit.recommendations.push(
          "Ensure headings follow sequential order (don't skip from h1 to h3)"
        );
        penalty += Math.min(10, hierarchyViolations * 3);
      } else if ($headings.length > 1) {
        a11yAudit.issues.push(`✅ Good heading hierarchy with ${$headings.length} headings`);
      }

      a11yAudit.score -= clamp(penalty, 0, CAPS.HEADINGS_BASE);
    }, a11yAudit);

    // 3) Images
    await safeRun('Images', async () => {
      const total = $imgs.length;
      if (total === 0) {
        a11yAudit.issues.push('ℹ️ No images found on this page');
        return;
      }

      let missingAlt = 0;
      let emptyAlt = 0;
      let meaningfulAlt = 0;

      // Iterate once
      $imgs.each((_, el) => {
        const alt = el.attribs?.alt;
        if (alt === undefined) missingAlt++;
        else if ((alt || '').trim() === '') emptyAlt++;
        else meaningfulAlt++;
      });

      let penalty = 0;
      if (missingAlt > 0) {
        a11yAudit.issues.push(`❌ ${missingAlt} images missing alt attributes`);
        a11yAudit.recommendations.push(
          'Add alt text to all images (use alt="" for decorative images only)'
        );
        penalty += Math.min(CAPS.IMAGES, missingAlt * 4);
      }
      if (meaningfulAlt > 0) a11yAudit.issues.push(`✅ ${meaningfulAlt} images have meaningful alt text`);
      if (emptyAlt > 0) a11yAudit.issues.push(`ℹ️ ${emptyAlt} images marked as decorative (empty alt)`);

      const altCoverage = ((total - missingAlt) / Math.max(1, total)) * 100;
      a11yAudit.issues.push(
        `📊 Alt text coverage: ${altCoverage.toFixed(1)}% (${total - missingAlt}/${total})`
      );

      a11yAudit.score -= clamp(penalty, 0, CAPS.IMAGES);
    }, a11yAudit);

    // 4) Forms & controls
    await safeRun('Forms', async () => {
      const controls = $formControls.toArray();
      if (controls.length === 0) {
        a11yAudit.issues.push('ℹ️ No form controls found on this page');
        return;
      }

      let unlabeled = 0;
      const examples = [];

      const labelsByFor = new Map();
      $('label[for]').each((_, el) => {
        const f = el.attribs?.for;
        if (f) labelsByFor.set(f, true);
      });

      controls.forEach((el) => {
        const $el = $(el);
        const type = ($el.attr('type') || $el.prop('tagName') || '').toLowerCase();
        const id = $el.attr('id');
        const name = $el.attr('name');

        const hasLabel = id && labelsByFor.has(id);
        const hasAriaLabel = !!$el.attr('aria-label');
        const hasAriaLabelledBy = !!$el.attr('aria-labelledby');
        const inFieldsetWithLegend =
          $el.closest('fieldset').length > 0 && $el.closest('fieldset').find('legend').length > 0;

        const labeled = hasLabel || hasAriaLabel || hasAriaLabelledBy || inFieldsetWithLegend;

        if (!labeled) {
          unlabeled++;
          if (examples.length < EXAMPLE_LIMITS.FORMS) {
            examples.push(
              `${type}${name ? ` (name: ${name})` : ''}${id ? ` (id: ${id})` : ''}`
            );
          }
        }
      });

      if (unlabeled > 0) {
        a11yAudit.issues.push(`❌ ${unlabeled} form controls lack proper labels`);
        a11yAudit.recommendations.push(
          'Associate all form controls with descriptive labels using <label>, aria-label, or aria-labelledby'
        );
        examples.forEach((d) => a11yAudit.issues.push(`  - Unlabeled ${d}`));
        const remaining = unlabeled - examples.length;
        if (remaining > 0) a11yAudit.issues.push(`  - ... and ${remaining} more`);
        a11yAudit.score -= clamp(unlabeled * 5, 0, CAPS.FORMS);
      } else {
        a11yAudit.issues.push(`✅ All ${controls.length} form controls have proper labels`);
      }
    }, a11yAudit);

    // 5) Links
    await safeRun('Links', async () => {
      const links = $links.toArray();
      if (links.length === 0) {
        a11yAudit.issues.push('ℹ️ No links found on this page');
        return;
      }

      let problematic = 0;
      const examples = [];

      // Precompute a set of vague terms
      const vague = new Set(['click here', 'read more', 'more', 'here', 'link']);

      links.forEach((el) => {
        const $el = $(el);
        const text = ($el.text() || '').trim().toLowerCase();
        const ariaLabel = $el.attr('aria-label');
        const title = $el.attr('title');
        const href = $el.attr('href');

        const hasAccessibleName = !!ariaLabel || !!title || (text && text.length >= 3);
        const hasVagueText = text && vague.has(text);
        const isEmptyHref = !href || href === '#' || href.trim() === '';

        if (!hasAccessibleName || hasVagueText || isEmptyHref) {
          problematic++;
          if (examples.length < EXAMPLE_LIMITS.LINKS) {
            let issue = '';
            if (!hasAccessibleName) issue = 'No accessible name';
            else if (hasVagueText) issue = `Vague text: "${text}"`;
            else if (isEmptyHref) issue = 'Empty or invalid href';
            examples.push(`${issue} - href: "${href || ''}"`);
          }
        }
      });

      if (problematic > 0) {
        a11yAudit.issues.push(`❌ ${problematic} links have accessibility issues`);
        a11yAudit.recommendations.push(
          'Use descriptive link text that explains the destination or purpose'
        );
        examples.forEach((e) => a11yAudit.issues.push(`  - ${e}`));
        const remaining = problematic - examples.length;
        if (remaining > 0) a11yAudit.issues.push(`  - ... and ${remaining} more issues`);
        a11yAudit.score -= clamp(problematic * 2, 0, CAPS.LINKS);
      } else {
        a11yAudit.issues.push(`✅ All ${links.length} links have descriptive text`);
      }
    }, a11yAudit);

    // 6) Buttons
    await safeRun('Buttons', async () => {
      const btns = $buttons.toArray();
      if (btns.length === 0) {
        a11yAudit.issues.push('ℹ️ No buttons found on this page');
        return;
      }

      let bad = 0;
      btns.forEach((el) => {
        const $el = $(el);
        const text = ($el.text() || '').trim();
        const value = $el.attr('value');
        const ariaLabel = $el.attr('aria-label');
        const title = $el.attr('title');
        const hasAccessibleName = !!text || !!value || !!ariaLabel || !!title;
        if (!hasAccessibleName) bad++;
      });

      if (bad > 0) {
        a11yAudit.issues.push(`❌ ${bad} buttons without accessible text`);
        a11yAudit.recommendations.push(
          'Ensure all buttons have descriptive text, value, or ARIA labels'
        );
        a11yAudit.score -= clamp(bad * 5, 0, CAPS.BUTTONS);
      } else {
        a11yAudit.issues.push(`✅ All ${btns.length} buttons have accessible text`);
      }
    }, a11yAudit);

    // 7) Tables
    await safeRun('Tables', async () => {
      const tables = $tables.toArray();
      if (tables.length === 0) {
        a11yAudit.issues.push('ℹ️ No tables found on this page');
        return;
      }

      let inaccessible = 0;
      tables.forEach((el) => {
        const $table = $(el);
        const hasCaption = $table.find('caption').length > 0;
        const hasHeaders = $table.find('th').length > 0;
        const hasHeadersAttr = $table.find('[headers]').length > 0;
        const hasScope = $table.find('[scope]').length > 0;

        const isAccessible = hasCaption || hasHeaders || hasHeadersAttr || hasScope;
        if (!isAccessible) inaccessible++;
      });

      if (inaccessible > 0) {
        a11yAudit.issues.push(`❌ ${inaccessible} tables lack proper structure`);
        a11yAudit.recommendations.push(
          'Add table headers (th), captions, or scope attributes for data tables'
        );
        a11yAudit.score -= clamp(inaccessible * 4, 0, CAPS.TABLES);
      } else {
        a11yAudit.issues.push(`✅ All ${tables.length} tables have proper structure`);
      }
    }, a11yAudit);

    // 8) Landmarks & ARIA
    await safeRun('Landmarks', async () => {
      const count = $landmarks.length + $ariaLandmarks.length;
      if (count === 0) {
        a11yAudit.issues.push('⚠️ No semantic landmarks found');
        a11yAudit.recommendations.push(
          'Use semantic HTML5 elements (main, nav, header, footer) or ARIA landmarks'
        );
        a11yAudit.score -= CAPS.LANDMARKS;
      } else {
        a11yAudit.issues.push(`✅ Found ${count} semantic landmarks`);
      }
    }, a11yAudit);

    // 9) Color/contrast indicators (heuristic)
    await safeRun('Color/Contrast', async () => {
      const styled = $inlineStyled.length;
      if (styled > 0) {
        a11yAudit.issues.push(`ℹ️ ${styled} elements use inline color styles`);
        a11yAudit.recommendations.push(
          'Ensure color contrast meets WCAG (4.5:1 normal text, 3:1 large text)'
        );
      }
    }, a11yAudit);

    // Finalize score & status
    a11yAudit.score = clamp(Math.round(a11yAudit.score), 0, 100);
    a11yAudit.status = statusFromScore(a11yAudit.score);

    // Summary guidance
    if (a11yAudit.status === 'excellent') {
      a11yAudit.recommendations.push(
        'Great accessibility! Consider periodic manual testing with screen readers'
      );
    } else if (a11yAudit.status === 'good') {
      a11yAudit.recommendations.push(
        'Good accessibility foundation. Address remaining issues for better compliance'
      );
    } else {
      a11yAudit.recommendations.unshift(
        'Priority: Fix critical accessibility issues to improve UX for people with disabilities'
      );
    }

    // Lightweight end-of-run logging
    const criticalIssues = a11yAudit.issues.filter((i) => i.includes('❌')).length;
    const warningIssues = a11yAudit.issues.filter((i) => i.includes('⚠️')).length;
    const successItems = a11yAudit.issues.filter((i) => i.includes('✅')).length;

    logger.info(
      `Accessibility analysis completed. Score: ${a11yAudit.score}/100, Status: ${a11yAudit.status}`
    );
    logger.info(`Issue summary → ❌ ${criticalIssues}, ⚠️ ${warningIssues}, ✅ ${successItems}`);

    return a11yAudit;
  } catch (error) {
    logger.error('Error during accessibility analysis:', { error: error.message, stack: error.stack });
    throw new Error(`Accessibility analysis failed: ${error.message}`);
  }
};
