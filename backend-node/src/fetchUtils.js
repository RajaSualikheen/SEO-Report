import axios from 'axios';
import { URL } from 'url';
import puppeteer from 'puppeteer';
import logger from './logger.js';

let browser;
(async () => {
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-gpu',
            ]
        });
        logger.info('Puppeteer browser started for dynamic content fetching');
    } catch (error) {
        logger.error('Failed to launch Puppeteer browser:', error);
    }
})();

export const fetchPageContent = async (url) => {
    let page;
    try {
        if (!browser) {
            throw new Error('Puppeteer browser instance not available.');
        }
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

        page.on('dialog', async dialog => {
            logger.warn(`Dismissing dialog of type: ${dialog.type}`);
            await dialog.dismiss();
        });

        // The response object contains the status code.
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        const contentSelector = 'main, .product-grid, h1, .main-content';
        try {
            await page.waitForSelector(contentSelector, { timeout: 30000 });
            logger.info(`Successfully waited for a key content selector: ${contentSelector}`);
        } catch (selectorError) {
            logger.warn('Key content selector not found or timed out. Falling back to a hard wait.');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        const finalUrl = page.url();
        // CORRECTED: Get status from the response object, not the page object.
       const responseStatus = response.status();
        const html = await page.content();
        await page.close();

        if (responseStatus >= 400) {
            return { html: null, pageUrl: finalUrl, statusCode: responseStatus, error: `HTTP ${responseStatus}: Failed to load page.` };
        }
        return { html, pageUrl: finalUrl, statusCode: responseStatus, error: null };

    } catch (error) {
        if (page && !page.isClosed()) {
            await page.close();
        }
        const errorMessage = `Failed to fetch page content: ${error.message}`;
        logger.error(errorMessage);
        if (error.name === 'TimeoutError') {
             return { html: null, pageUrl: url, statusCode: 408, error: `Request timed out. The website took too long to respond or render.` };
        }
        return { html: null, pageUrl: url, statusCode: 500, error: errorMessage };
    }
};

// Original functions (kept for compatibility if needed elsewhere)
export const fetchUrlHead = async (url) => {
    try {
        const response = await axios.head(url, {
            timeout: 5000,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0 Safari/537.36',
            }
        });
        const contentLength = response.headers['content-length']
            ? parseInt(response.headers['content-length'], 10)
            : 0;

        return {
            url,
            statusCode: response.status,
            contentLength,
            success: true
        };
    } catch (error) {
        return {
            url,
            statusCode: error.response ? error.response.status : null,
            error: error.message,
            success: false
        };
    }
};

export const fetchUrlGet = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Connection': 'keep-alive'
            }
        });

        return {
            url,
            statusCode: response.status,
            content: response.data,
            success: true
        };
    } catch (error) {
        return {
            url,
            statusCode: error.response ? error.response.status : null,
            error: error.message,
            success: false
        };
    }
};

export const followRedirects = async (url, maxRedirects = 10, redirectChain = []) => {
    redirectChain.push(url);
    if (redirectChain.length > maxRedirects) {
        return {
            finalUrl: url,
            statusCode: null,
            redirectChain,
            error: 'Max redirects exceeded'
        };
    }

    try {
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400,
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0 Safari/537.36'
            }
        });

        return {
            finalUrl: response.request.res.responseUrl,
            statusCode: response.status,
            redirectChain: [...redirectChain, response.request.res.responseUrl]
        };
    } catch (error) {
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const newUrl = error.response.headers.location;
            if (newUrl) {
                return followRedirects(new URL(newUrl, url).href, maxRedirects, redirectChain);
            }
        }

        return {
            finalUrl: url,
            statusCode: error.response ? error.response.status : null,
            redirectChain,
            error: error.message
        };
    }
};