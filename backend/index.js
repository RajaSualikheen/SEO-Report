// old\backend-node\index.js
console.log("--- DEPLOYMENT TEST: RUNNING LATEST CODE ---");
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { chromium } from 'playwright-extra'; 
import StealthPlugin from 'playwright-extra-plugin-stealth';
import fetch from 'node-fetch';
import seoReportRouter from './routes/seoReport.js';
import { setBrowserInstance } from './src/fetchUtils.js';
import authRouter from './routes/auth.js';
const app = express();
const PORT = process.env.PORT || 4000;
import gscRouter from './routes/gsc.js';
// Middleware setup
app.use(cors()); // This allows requests from any origin for development

app.use(bodyParser.json({ limit: '50mb' }));

// Persistent Playwright browser instance
let browser;

(async () => {
  try {
    // 💡 Register the stealth plugin here
    

    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    console.log('Playwright browser started');
    // FIX: Pass the global browser instance to the utility module
    setBrowserInstance(browser);
  } catch (error) {
    console.error('Failed to launch Playwright browser:', error);
  }
})();

// Gracefully close browser on exit
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});
process.on('SIGTERM', async () => {
  if (browser) await browser.close();
  process.exit();
});

// Helper function to download and convert an image to a base64 string
async function toBase64(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.buffer();
    const mime = res.headers.get('content-type') || 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`Base64 conversion failed for ${url}:`, err);
    return url;
  }
}

// Helper function to generate HTML for the PDF report
async function generateHTML(reportData, agencyName, agencyLogoPreview) {
    const logoBase64 = agencyLogoPreview ? await toBase64(agencyLogoPreview) : '';

    const getStatusIcon = (status) => {
        switch (status) {
            case 'good':
                return '<span style="color: green;">✔</span>';
            case 'warning':
                return '<span style="color: orange;">⚠</span>';
            case 'bad':
                return '<span style="color: red;">✖</span>';
            default:
                return '';
        }
    };

    let sectionsHtml = '';
    if (reportData && reportData.groupedSections) {
        for (const category in reportData.groupedSections) {
            const sections = reportData.groupedSections[category];
            if (sections.length > 0) {
                sectionsHtml += `<div class="category"><h2>${category}</h2>`;
                sections.forEach(section => {
                    sectionsHtml += `
                        <div class="section">
                            <h3>${getStatusIcon(section.status)} ${section.title}</h3>
                            <p>${section.explanation}</p>
                        </div>
                    `;
                });
                sectionsHtml += `</div>`;
            }
        }
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${agencyName || 'SEO Report'} - ${reportData.url || ''}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .header img { max-width: 150px; max-height: 70px; margin-bottom: 10px; }
            .header h1 { color: #1a202c; margin: 0; }
            .header h2 { color: #4a5568; margin: 5px 0; font-weight: normal; }
            .header p { color: #718096; margin: 5px 0; }
            .score-circle { width: 150px; height: 150px; border-radius: 50%; background: #4F46E5; color: white; display: flex; align-items: center; justify-content: center; flex-direction: column; margin: 20px auto; font-size: 48px; font-weight: bold; }
            .score-circle span { font-size: 16px; font-weight: normal; }
            .category { margin-bottom: 30px; }
            .category h2 { color: #4F46E5; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #fdfdff; }
            .section h3 { margin-top: 0; color: #2d3748; display: flex; align-items: center; }
            .section h3 span { margin-right: 10px; font-size: 20px; }
            .section p { color: #4a5568; line-height: 1.6; }
        </style>
    </head>
    <body>
        <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Agency Logo"/>` : ''}
            <h1>${agencyName || 'Your SEO Agency'}</h1>
            <h2>SEO Audit Report for ${reportData.url || 'the website'}</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="score-circle">
            ${reportData.overallScore || 'N/A'}
            <span>Overall Score</span>
        </div>

        ${sectionsHtml}
    </body>
    </html>
    `;
}


app.post('/generate-pdf', async (req, res) => {
    try {
        const { reportData, agencyName, agencyLogoPreview } = req.body;
        
        if (!browser) {
            // This is a fallback in case the initial browser launch failed
            console.log("Relaunching browser for PDF generation...");
            
            browser = await chromium.launch({ headless: true });
        }

        const page = await browser.newPage();
        const html = await generateHTML(reportData, agencyName, agencyLogoPreview);
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });

        await page.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="seo_report.pdf"');
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.use('/', seoReportRouter);
app.use('/auth', authRouter);
app.use('/api/gsc', gscRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));