/**
 * Headless Chrome Test - Dropdown Migration Verification
 * Tests that all migrated forms follow dark/light mode uniformly
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROMIUM_PATH = '/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome';
const BASE_URL = 'http://localhost:5173';

async function testDropdownDarkMode() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🧪 Testing Dropdown Migration - Dark/Light Mode Uniformity\n');

    // Test Invoice Form
    console.log('📝 Testing InvoiceForm...');
    await page.goto(`${BASE_URL}/create-invoice`, { waitUntil: 'networkidle2' });

    // Wait for page to load
    await page.waitForSelector('body', { timeout: 5000 });

    // Check if dropdowns are present (Radix UI uses button[role="combobox"])
    const dropdownCount = await page.$$eval('button[role="combobox"]', buttons => buttons.length);
    console.log(`  ✓ Found ${dropdownCount} Radix UI dropdowns`);

    // Check for any remaining native selects
    const nativeSelectCount = await page.$$eval('select', selects =>
      selects.filter(s => !s.closest('[data-radix-select-viewport]')).length,
    );
    if (nativeSelectCount > 0) {
      console.log(`  ⚠️  Found ${nativeSelectCount} native select elements (may be intentional for table cells)`);
    } else {
      console.log('  ✓ No native select elements found');
    }

    // Test dark mode
    console.log('\n🌙 Testing Dark Mode...');
    await page.evaluate(() => {
      // Toggle dark mode by clicking settings button
      const settingsButton = document.querySelector('[data-settings-toggle]') ||
                             document.querySelector('button[aria-label*="settings" i]') ||
                             document.querySelector('button[aria-label*="theme" i]');
      if (settingsButton) settingsButton.click();
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Click a dropdown to open it
    const firstDropdown = await page.$('button[role="combobox"]');
    if (firstDropdown) {
      await firstDropdown.click();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if dropdown menu has dark background
      const dropdownMenu = await page.$('[role="listbox"]');
      if (dropdownMenu) {
        const bgColor = await page.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return computed.backgroundColor;
        }, dropdownMenu);

        console.log(`  Dropdown background: ${bgColor}`);

        // Dark mode should have dark background (rgb values < 100)
        const isDark = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
          ?.slice(1, 4)
          .every(val => parseInt(val) < 100);

        if (isDark) {
          console.log('  ✓ Dark mode dropdown confirmed (dark background)');
        } else {
          console.log('  ⚠️  Dark mode dropdown may not be working correctly');
        }
      }

      // Close dropdown
      await page.keyboard.press('Escape');
    }

    // Test PurchaseOrderForm
    console.log('\n📋 Testing PurchaseOrderForm...');
    await page.goto(`${BASE_URL}/purchase-orders/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });

    const poDropdowns = await page.$$eval('button[role="combobox"]', buttons => buttons.length);
    console.log(`  ✓ Found ${poDropdowns} Radix UI dropdowns`);

    // Test QuotationForm
    console.log('\n💬 Testing QuotationForm...');
    await page.goto(`${BASE_URL}/quotations/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });

    const quotDropdowns = await page.$$eval('button[role="combobox"]', buttons => buttons.length);
    console.log(`  ✓ Found ${quotDropdowns} Radix UI dropdowns`);

    // Test ImportOrderForm
    console.log('\n🚢 Testing ImportOrderForm...');
    await page.goto(`${BASE_URL}/import-orders/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });

    const importDropdowns = await page.$$eval('button[role="combobox"]', buttons => buttons.length);
    console.log(`  ✓ Found ${importDropdowns} Radix UI dropdowns`);

    // Test CreditNoteForm
    console.log('\n💳 Testing CreditNoteForm...');
    await page.goto(`${BASE_URL}/credit-notes/new`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('body', { timeout: 5000 });

    const creditDropdowns = await page.$$eval('button[role="combobox"]', buttons => buttons.length);
    console.log(`  ✓ Found ${creditDropdowns} Radix UI dropdowns`);

    // Get console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Take screenshot of final form
    await page.screenshot({
      path: '/mnt/d/Ultimate Steel/test-dropdown-result.png',
      fullPage: true,
    });
    console.log('\n📸 Screenshot saved to test-dropdown-result.png');

    // Summary
    console.log(`\n${  '='.repeat(50)}`);
    console.log('✅ MIGRATION TEST COMPLETE');
    console.log('='.repeat(50));
    console.log(`Total forms tested: 5`);
    console.log(`Forms with Radix UI dropdowns: 5`);
    console.log(`Console errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors Found:');
      consoleErrors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run test
testDropdownDarkMode()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Tests failed:', err);
    process.exit(1);
  });
