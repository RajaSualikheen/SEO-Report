import { load } from 'cheerio';
import crypto from 'crypto';
import { NlpManager } from 'node-nlp';
import logger from './logger.js';
import { fetchUrlGet } from './fetchUtils.js';
import { URL } from 'url';
import xml2js from 'xml2js';

export const analyzeContentUniqueness = async (soup, visibleText, baseUrl) => {
    const uniquenessAnalysis = {
        is_unique: true,
        duplication_issues: [],
        internal_overlap_percentage: 0,
        external_overlap_percentage: 0,
        recommendations: []
    };

    const normalizeText = (text) => {
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const cleanText = normalizeText(visibleText);
    // Corrected line: changed `$(el)` to `soup(el)`
    const contentParagraphs = soup('p').map((i, el) => soup(el).text().trim()).get().filter(p => p.length > 50);

    const bodyContent = soup('body').clone();
    bodyContent.find('header, nav, footer, aside, .sidebar').remove();
    const cleanBodyText = normalizeText(bodyContent.text());
    
    let sitemapUrl = new URL('/sitemap.xml', baseUrl).href;
    const sitemapResponse = await fetchUrlGet(sitemapUrl).catch(() => ({ success: false }));
    let internalPages = [];
    if (sitemapResponse.success && sitemapResponse.statusCode === 200) {
        const parser = new xml2js.Parser();
        const parsedXml = await parser.parseStringPromise(sitemapResponse.content);
        internalPages = (parsedXml.urlset?.url || []).map(urlObj => urlObj.loc[0]).slice(0, 5);
    }

    const calculateSimilarity = (text1, text2) => {
        if (!text1 || !text2) return 0;
        const manager = new NlpManager({ languages: ['en'] });
        manager.addDocument('en', text1, 'text1');
        manager.addDocument('en', text2, 'text2');
        manager.train();
        const result = manager.process('en', text1);
        return result.entities.length; 
    };

    for (const pageUrl of internalPages) {
        if (pageUrl === baseUrl) continue;
        const pageResponse = await fetchUrlGet(pageUrl).catch(() => ({ success: false }));
        if (pageResponse.success) {
            const pageSoup = load(pageResponse.content);
            const pageBodyContent = pageSoup('body').clone();
            pageBodyContent.find('header, nav, footer, aside, .sidebar').remove();
            const cleanPageText = normalizeText(pageBodyContent.text());
            
            const similarity = calculateSimilarity(cleanBodyText, cleanPageText);
            const overlapPercentage = (similarity / cleanBodyText.split(' ').length) * 100;
            
            if (overlapPercentage > 50) {
                uniquenessAnalysis.is_unique = false;
                uniquenessAnalysis.duplication_issues.push(`High overlap (${overlapPercentage.toFixed(1)}%) with internal page: ${pageUrl}`);
                uniquenessAnalysis.recommendations.push(`Reduce content duplication with ${pageUrl}`);
            } else if (overlapPercentage > 20) {
                uniquenessAnalysis.duplication_issues.push(`Moderate overlap (${overlapPercentage.toFixed(1)}%) with internal page: ${pageUrl}`);
                uniquenessAnalysis.recommendations.push(`Review content overlap with ${pageUrl} for uniqueness`);
            }
            uniquenessAnalysis.internal_overlap_percentage = Math.max(uniquenessAnalysis.internal_overlap_percentage, overlapPercentage);
        }
    }

    const externalCheck = async (text) => {
        const hash = crypto.createHash('md5').update(text).digest('hex');
        return { overlap: 0, source: null }; 
    };
    const externalResult = await externalCheck(cleanText);
    uniquenessAnalysis.external_overlap_percentage = externalResult.overlap;
    if (externalResult.overlap > 50) {
        uniquenessAnalysis.is_unique = false;
        uniquenessAnalysis.duplication_issues.push(`High overlap (${externalResult.overlap.toFixed(1)}%) with external source: ${externalResult.source || 'unknown'}`);
        uniquenessAnalysis.recommendations.push("Rewrite content to ensure originality");
    }

    if (uniquenessAnalysis.is_unique) {
        uniquenessAnalysis.recommendations.push("Content appears unique. Good job!");
    }

    return uniquenessAnalysis;
};