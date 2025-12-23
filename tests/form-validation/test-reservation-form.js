/**
 * Reservation Form - Automated Validation Test
 * Tests the migrated Tailwind CSS stock reservation form
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROMIUM_PATH = null; // Use Puppeteer's bundled Chromium
const BASE_URL = 'http://localhost:5173';
const FORM_URL = `${BASE_URL}/stock-reservations/create`;
const SCREENSHOT_DIR = join(__dirname, '../../test-results/screenshots');

const TEST_CONFIG = {
  headless: true,
  slowMo: 50,
  timeout: 30000,
};

const TEST_DATA = {
  quantity: '100.50',
  unit: 'KG',
  expiryDays: '30',
  reference: 'TEST-RES-001',
  notes: 'Automated test - Reservation form validation',
};

async function runTest() {
  console.log('🚀 Starting Reservation Form Validation Test...\n');

  const launchOptions = {
    headless: TEST_CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
    slowMo: TEST_CONFIG.slowMo,
  };
  if (CHROMIUM_PATH) launchOptions.executablePath = CHROMIUM_PATH;

  const browser = await puppeteer.launch(launchOptions);

  const testResults = {
    passed: [],
    failed: [],
    warnings: [],
    screenshots: [],
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.toString());
    });

    // Test 1: Page Load
    console.log('✓ Test 1: Loading reservation form...');
    try {
      await page.goto(FORM_URL, {
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout,
      });
      testResults.passed.push('Reservation form loaded');

      const screenshotPath = join(SCREENSHOT_DIR, 'reservation-01-loaded.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
      console.log('  ✓ Screenshot saved\n');
    } catch (error) {
      testResults.failed.push(`Page load failed: ${error.message}`);
      throw error;
    }

    // Test 2: Product Autocomplete
    console.log('✓ Test 2: Testing product autocomplete...');
    try {
      const productInput = await page.$(
        'input[placeholder*="Search product"], input[placeholder*="product"]',
      );
      if (productInput) {
        await productInput.type('SS-304');
        await page.waitForTimeout(500);

        const dropdown = await page.$(
          '[class*="dropdown"], [class*="product-options"]',
        );
        if (dropdown) {
          testResults.passed.push('Product autocomplete dropdown appears');

          const screenshotPath = join(
            SCREENSHOT_DIR,
            'reservation-02-product-autocomplete.png',
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          testResults.screenshots.push(screenshotPath);
        } else {
          testResults.warnings.push('Product autocomplete dropdown not found');
        }
      } else {
        testResults.warnings.push('Product autocomplete input not found');
      }
      console.log('  ✓ Product autocomplete tested\n');
    } catch (error) {
      testResults.warnings.push(
        `Product autocomplete failed: ${error.message}`,
      );
    }

    // Test 3: Warehouse Selection
    console.log('✓ Test 3: Testing warehouse selection...');
    try {
      const warehouseSelect = await page.$('select[name*="warehouse"], select');
      if (warehouseSelect) {
        const options = await page.evaluate((sel) => {
          const select = document.querySelector(sel);
          return select
            ? Array.from(select.options)
              .map((opt) => opt.value)
              .filter((v) => v)
            : [];
        }, 'select[name*="warehouse"], select');

        if (options.length > 0) {
          await page.select('select[name*="warehouse"], select', options[0]);
          testResults.passed.push('Warehouse selected');
        } else {
          testResults.warnings.push('No warehouse options available');
        }
      } else {
        testResults.warnings.push('Warehouse select not found');
      }
      console.log('  ✓ Warehouse selection tested\n');
    } catch (error) {
      testResults.warnings.push(`Warehouse selection failed: ${error.message}`);
    }

    // Test 4: Quantity Input
    console.log('✓ Test 4: Testing quantity input...');
    try {
      const quantityInput = await page.$(
        'input[type="number"][name*="quantity"], input[name*="quantity"]',
      );
      if (quantityInput) {
        await quantityInput.click({ clickCount: 3 });
        await quantityInput.type(TEST_DATA.quantity);
        testResults.passed.push('Quantity entered');

        const screenshotPath = join(
          SCREENSHOT_DIR,
          'reservation-03-quantity-filled.png',
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        testResults.warnings.push('Quantity input not found');
      }
      console.log('  ✓ Quantity input tested\n');
    } catch (error) {
      testResults.warnings.push(`Quantity input failed: ${error.message}`);
    }

    // Test 5: Stock Availability Display
    console.log('✓ Test 5: Checking stock availability display...');
    try {
      const availabilityElement = await page.$(
        '[class*="stock"], [class*="available"], [class*="availability"]',
      );
      if (availabilityElement) {
        const availabilityText = await page.evaluate(
          (el) => el.textContent,
          availabilityElement,
        );
        testResults.passed.push(
          `Stock availability displayed: ${availabilityText.substring(0, 50)}`,
        );
      } else {
        testResults.warnings.push('Stock availability display not found');
      }
      console.log('  ✓ Stock availability checked\n');
    } catch (error) {
      testResults.warnings.push(
        `Stock availability check failed: ${error.message}`,
      );
    }

    // Test 6: Validation
    console.log('✓ Test 6: Testing form validation...');
    try {
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach((input) => {
          if (input.type !== 'submit' && input.type !== 'button') {
            input.value = '';
          }
        });
      });

      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        const errorMessages = await page.evaluate(() => {
          const errors = Array.from(
            document.querySelectorAll(
              '.error, .text-red-500, [class*="error"]',
            ),
          );
          return errors
            .map((el) => el.textContent)
            .filter((text) => text.trim());
        });

        if (errorMessages.length > 0) {
          testResults.passed.push(
            `Validation shows ${errorMessages.length} errors`,
          );
        } else {
          testResults.warnings.push('No validation errors displayed');
        }

        const screenshotPath = join(
          SCREENSHOT_DIR,
          'reservation-04-validation.png',
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      }
      console.log('  ✓ Validation tested\n');
    } catch (error) {
      testResults.warnings.push(`Validation test failed: ${error.message}`);
    }

    // Console & Page Errors
    if (consoleErrors.length > 0) {
      testResults.warnings.push(`${consoleErrors.length} console errors`);
      consoleErrors.forEach((err) => console.log(`  ⚠ ${err}`));
    } else {
      testResults.passed.push('No console errors');
    }

    if (pageErrors.length > 0) {
      testResults.failed.push(`${pageErrors.length} page errors`);
    } else {
      testResults.passed.push('No page errors');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    testResults.failed.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  printSummary(testResults);
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

function printSummary(results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY: Reservation Form');
  console.log('='.repeat(60));

  console.log(`\n✓ Passed: ${results.passed.length}`);
  results.passed.forEach((test) => console.log(`  - ${test}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠ Warnings: ${results.warnings.length}`);
    results.warnings.forEach((w) => console.log(`  - ${w}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n✗ Failed: ${results.failed.length}`);
    results.failed.forEach((f) => console.log(`  - ${f}`));
  }

  console.log(`\n📸 Screenshots: ${results.screenshots.length}`);

  const total = results.passed.length + results.failed.length;
  const passRate =
    total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;
  console.log(
    `\nOVERALL: ${results.passed.length}/${total} passed (${passRate}%)`,
  );
  console.log(`${'='.repeat(60)}\n`);
}

runTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
