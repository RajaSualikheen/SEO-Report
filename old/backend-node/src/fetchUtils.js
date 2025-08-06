import axios from 'axios';
import { URL } from 'url';

export const fetchUrlHead = async (url) => {
    try {
        const response = await axios.head(url, { timeout: 5000, maxRedirects: 10 });
        const contentLength = response.headers['content-length'] ? parseInt(response.headers['content-length'], 10) : 0;
        return { url, statusCode: response.status, contentLength, success: true };
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
        const response = await axios.get(url, { timeout: 5000 });
        return { url, statusCode: response.status, content: response.data, success: true };
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
        return { finalUrl: url, statusCode: null, redirectChain, error: 'Max redirects exceeded' };
    }

    try {
        const response = await axios.get(url, {
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400,
            timeout: 5000
        });
        return { finalUrl: response.request.res.responseUrl, statusCode: response.status, redirectChain: [...redirectChain, response.request.res.responseUrl] };
    } catch (error) {
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const newUrl = error.response.headers.location;
            if (newUrl) {
                return followRedirects(new URL(newUrl, url).href, maxRedirects, redirectChain);
            }
        }
        return { finalUrl: url, statusCode: error.response ? error.response.status : null, redirectChain, error: error.message };
    }
};