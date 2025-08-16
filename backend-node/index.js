import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import seoReportRouter from './routes/seoReport.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware setup
app.use(cors({
  origin: [
    'https://seoanalyzerauth.web.app',
    'http://localhost:4000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '50mb' }));

// Persistent Puppeteer browser instance
let browser;

(async () => {
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Puppeteer browser started');
  } catch (error) {
    console.error('Failed to launch Puppeteer browser:', error);
  }
})();

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
  const logoBase64 = agencyLogoPreview
    ? await toBase64(agencyLogoPreview)
    : 'https://via.placeholder.com/150';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${agencyName || 'SEO Report'} - ${reportData.url || ''}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #4F46E5; }
        .header { text-align: center; }
        img { max-width: 150px; }
        hr { margin: 20px 0; }
        pre { background: #f9f9f9; padding: 10px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoBase64}" alt="Agency Logo"/>
        <h1>${agencyName || 'Your SEO Agency'}</h1>
        <h2>SEO Audit Report</h2>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <hr/>
      <pre>${JSON.stringify(reportData, null, 2)}</pre>
    </body>
    </html>
  `;
}

// Route to generate and download a PDF report
app.post('/generate-pdf', async (req, res) => {
  try {
    const { reportData, agencyName, agencyLogoPreview } = req.body;
    
    if (!browser) {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
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

// Mount the seoReportRouter for the main analysis
app.use('/', seoReportRouter);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));