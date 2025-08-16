import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch'; // for downloading images as base64
import seoReportRouter from './routes/seoReport.js';
const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json({ limit: '50mb' }));

let browser; // Persistent Puppeteer instance
app.use(cors({
  origin: [
    'https://seoanalyzerauth.web.app',   // your Firebase hosting
    'http://localhost:4000'              // local dev frontend
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Start persistent browser when server starts
(async () => {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Puppeteer browser started');
})();
app.use('/', seoReportRouter);
// Helper: download image and return base64 string
async function toBase64(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.buffer();
    const mime = res.headers.get('content-type') || 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`Base64 conversion failed for ${url}:`, err);
    return url; // fallback to original if failed
  }
}

// Replace this with your *real styled HTML template* for the report
async function generateHTML(reportData, agencyName, agencyLogoPreview) {
  const logoBase64 = agencyLogoPreview
    ? await toBase64(agencyLogoPreview)
    : 'https://via.placeholder.com/150';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
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

// PDF generation route
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
    await page.setContent(html, { waitUntil: 'load' });

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

app.listen(4000, () => console.log('Server running on port 4000'));
