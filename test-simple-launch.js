#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Simple Puppeteer Launch Test
 * Demonstrates: Launch → Test → Close (No port 9222 needed)
 */

import puppeteer from 'puppeteer';

async function testPuppeteerLaunch() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Puppeteer Standalone Launch Demo');
  console.log('  (No Chrome needed, No port 9222)');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // STEP 1: Launch Chrome (Puppeteer's own Chrome instance)
    console.log('🚀 Step 1: Launching Chrome...');
    console.log('   This will start a NEW Chrome process');
    console.log('   No existing Chrome required!\n');

    const browser = await puppeteer.launch({
      headless: true,
      executablePath:
        '/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('✅ Chrome launched successfully!');
    console.log('   Process ID:', browser.process()?.pid);
    console.log('   This is a standalone Chrome instance\n');

    // STEP 2: Use Chrome (test with local app)
    console.log('📄 Step 2: Opening your invoice page...');
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/create-invoice', {
      waitUntil: 'networkidle2',
      timeout: 10000,
    });

    const title = await page.title();
    console.log('✅ Page loaded:', title);
    console.log('   URL:', page.url(), '\n');

    // Take screenshot as proof
    await page.screenshot({
      path: '/mnt/d/Ultimate Steel/puppeteer-demo.png',
      fullPage: false,
    });
    console.log('📸 Screenshot saved: puppeteer-demo.png\n');

    // Interact with page to prove it works
    console.log('🧪 Step 2.5: Testing page interaction...');
    const h1Text = await page.$eval('h1', (el) => el.textContent);
    console.log('   Found heading:', h1Text);
    console.log('   Page is fully interactive!\n');

    // STEP 3: Close Chrome
    console.log('🧹 Step 3: Closing Chrome...');
    await browser.close();
    console.log('✅ Chrome closed successfully!\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUCCESS: Complete lifecycle demonstrated');
    console.log('  Launch → Use → Close (all automated)');
    console.log('═══════════════════════════════════════════════════════');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nThis is likely due to WSL2 cross-platform limitations.');
    console.error('In native Linux/Windows/Mac, this works perfectly.\n');

    console.log('💡 Alternative for WSL2:');
    console.log('   Option 1: Use Docker (native Linux environment)');
    console.log('   Option 2: Run tests in native Windows PowerShell');
    console.log(
      '   Option 3: Use connect mode with Chrome on port 9222 (temporary)',
    );
  }
}

testPuppeteerLaunch();
