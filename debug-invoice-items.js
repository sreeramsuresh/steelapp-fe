/**
 * Debug script to test invoice line items loading
 * Run with: node debug-invoice-items.js
 */

import puppeteer from 'puppeteer';

// Use Windows path when running from PowerShell
const CHROMIUM_PATH = 'D:\\Ultimate Steel\\steelapp-fe\\chromium\\linux-1559273\\chrome-linux\\chrome';
const BASE_URL = 'http://localhost:5173';
const INVOICE_ID = 4428; // Invoice with 1 item

async function debugInvoiceItems() {
  console.log('Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Capture API responses
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/invoices/')) {
      try {
        const json = await response.json();
        apiResponses.push({ url, status: response.status(), data: json });
        console.log('\n=== API Response ===');
        console.log('URL:', url);
        console.log('Status:', response.status());
        console.log('Items count:', json.items?.length || 0);
        if (json.items?.length > 0) {
          console.log('First item:', JSON.stringify(json.items[0], null, 2));
        }
      } catch (e) {
        // Not JSON or failed to parse
      }
    }
  });

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('item') || text.includes('Item') || text.includes('invoice')) {
      console.log('Browser Console:', text);
    }
  });

  try {
    // Navigate to invoice edit page
    console.log(`\nNavigating to: ${BASE_URL}/invoices/${INVOICE_ID}/edit`);
    await page.goto(`${BASE_URL}/invoices/${INVOICE_ID}/edit`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to settle
    await page.waitForTimeout(2000);

    // Check if items table has any rows
    const itemRows = await page.$$('tbody tr');
    console.log('\n=== DOM Check ===');
    console.log('Number of table rows found:', itemRows.length);

    // Check for product autocomplete inputs
    const autocompletes = await page.$$('[data-testid^="product-autocomplete"]');
    console.log('Product autocomplete inputs found:', autocompletes.length);

    // Take screenshot
    await page.screenshot({
      path: '/mnt/d/Ultimate Steel/steelapp-fe/debug-invoice-screenshot.png',
      fullPage: true
    });
    console.log('\nScreenshot saved to: debug-invoice-screenshot.png');

    // Get page content for debugging
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Check for any error messages
    const errorElements = await page.$$('.error, .alert-error, [role="alert"]');
    if (errorElements.length > 0) {
      console.log('Error elements found:', errorElements.length);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }

  return apiResponses;
}

debugInvoiceItems()
  .then(responses => {
    console.log('\n=== Summary ===');
    console.log('Total API responses captured:', responses.length);
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
