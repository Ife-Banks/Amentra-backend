import puppeteer from 'puppeteer';

export const generatePdfFromHtml = async (html, options = {}) => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return await page.pdf({
      format: options.format || 'A4',
      margin: options.margin || { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      printBackground: true,
    });
  } finally {
    await browser.close();
  }
};
