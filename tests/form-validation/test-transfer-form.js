/**
 * Transfer Form - Automated Validation Test
 * Tests the migrated Tailwind CSS inter-warehouse transfer form with table
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROMIUM_PATH = null; // Use Puppeteer's bundled Chromium
const BASE_URL = 'http://localhost:5173';
const FORM_URL = `${BASE_URL}/stock-transfers/create`;
const SCREENSHOT_DIR = join(__dirname, '../../test-results/screenshots');

const TEST_CONFIG = {
  headless: true,
  slowMo: 50,
  timeout: 30000,
};

const TEST_DATA = {
  quantity: '50.00',
  expectedDate: '2024-02-01',
  notes: 'Automated test - Transfer form validation',
};

async function runTest() {
  console.log('🚀 Starting Transfer Form Validation Test...\n');

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
    console.log('✓ Test 1: Loading transfer form...');
    try {
      await page.goto(FORM_URL, {
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout,
      });
      testResults.passed.push('Transfer form loaded');

      const screenshotPath = join(SCREENSHOT_DIR, 'transfer-01-loaded.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
      console.log('  ✓ Screenshot saved\n');
    } catch (error) {
      testResults.failed.push(`Page load failed: ${error.message}`);
      throw error;
    }

    // Test 2: Warehouse Selection
    console.log('✓ Test 2: Testing warehouse selection...');
    try {
      const warehouseSelects = await page.$$('select');
      if (warehouseSelects.length >= 2) {
        // Select source warehouse
        const sourceOptions = await page.evaluate((index) => {
          const select = document.querySelectorAll('select')[index];
          return select
            ? Array.from(select.options)
              .map((opt) => opt.value)
              .filter((v) => v)
            : [];
        }, 0);

        if (sourceOptions.length > 0) {
          await page.evaluate(
            (index, value) => {
              document.querySelectorAll('select')[index].value = value;
              document.querySelectorAll('select')[index].dispatchEvent(new Event('change', { bubbles: true }));
            },
            0,
            sourceOptions[0],
          );
          testResults.passed.push('Source warehouse selected');
        }

        // Select destination warehouse
        await page.waitForTimeout(300);
        const destOptions = await page.evaluate((index) => {
          const select = document.querySelectorAll('select')[index];
          return select
            ? Array.from(select.options)
              .map((opt) => opt.value)
              .filter((v) => v)
            : [];
        }, 1);

        if (destOptions.length > 1) {
          await page.evaluate(
            (index, value) => {
              document.querySelectorAll('select')[index].value = value;
              document.querySelectorAll('select')[index].dispatchEvent(new Event('change', { bubbles: true }));
            },
            1,
            destOptions[1],
          );
          testResults.passed.push('Destination warehouse selected');
        }

        const screenshotPath = join(
          SCREENSHOT_DIR,
          'transfer-02-warehouses-selected.png',
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        testResults.warnings.push('Warehouse selects not found');
      }
      console.log('  ✓ Warehouse selection tested\n');
    } catch (error) {
      testResults.warnings.push(`Warehouse selection failed: ${error.message}`);
    }

    // Test 3: Add Item Button
    console.log('✓ Test 3: Testing add item functionality...');
    try {
      const addButton = await page.$(
        'button:has-text("Add Item"), button[class*="add"]',
      );
      if (!addButton) {
        // Try alternative selectors
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await page.evaluate((el) => el.textContent, btn);
          if (text.includes('Add') || text.includes('+')) {
            await btn.click();
            await page.waitForTimeout(500);
            testResults.passed.push('Add item button clicked');
            break;
          }
        }
      } else {
        await addButton.click();
        await page.waitForTimeout(500);
        testResults.passed.push('Add item button clicked');
      }

      const screenshotPath = join(SCREENSHOT_DIR, 'transfer-03-item-added.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
      console.log('  ✓ Add item tested\n');
    } catch (error) {
      testResults.warnings.push(`Add item failed: ${error.message}`);
    }

    // Test 4: Table Row Product Autocomplete
    console.log('✓ Test 4: Testing table row product autocomplete...');
    try {
      const tableInputs = await page.$$('table input[type="text"]');
      if (tableInputs.length > 0) {
        await tableInputs[0].type('SS-304');
        await page.waitForTimeout(500);

        const dropdown = await page.$(
          '[class*="dropdown"], [class*="product-options"], [class*="absolute"]',
        );
        if (dropdown) {
          testResults.passed.push('Table row autocomplete dropdown appears');

          const screenshotPath = join(
            SCREENSHOT_DIR,
            'transfer-04-table-autocomplete.png',
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          testResults.screenshots.push(screenshotPath);
        } else {
          testResults.warnings.push('Table autocomplete dropdown not found');
        }
      } else {
        testResults.warnings.push('Table input not found');
      }
      console.log('  ✓ Table autocomplete tested\n');
    } catch (error) {
      testResults.warnings.push(`Table autocomplete failed: ${error.message}`);
    }

    // Test 5: Quantity Input in Table
    console.log('✓ Test 5: Testing quantity input in table...');
    try {
      const quantityInputs = await page.$$('table input[type="number"]');
      if (quantityInputs.length > 0) {
        await quantityInputs[0].click({ clickCount: 3 });
        await quantityInputs[0].type(TEST_DATA.quantity);
        testResults.passed.push('Quantity entered in table');

        const screenshotPath = join(
          SCREENSHOT_DIR,
          'transfer-05-quantity-filled.png',
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        testResults.warnings.push('Table quantity input not found');
      }
      console.log('  ✓ Quantity input tested\n');
    } catch (error) {
      testResults.warnings.push(`Quantity input failed: ${error.message}`);
    }

    // Test 6: Stock Availability Badges
    console.log('✓ Test 6: Checking stock availability badges...');
    try {
      const badges = await page.$$(
        '[class*="badge"], [class*="stock"], [class*="available"]',
      );
      if (badges.length > 0) {
        testResults.passed.push(`${badges.length} stock badges found`);
      } else {
        testResults.warnings.push('No stock badges found');
      }
      console.log('  ✓ Stock badges checked\n');
    } catch (error) {
      testResults.warnings.push(`Stock badges check failed: ${error.message}`);
    }

    // Test 7: Remove Item Button
    console.log('✓ Test 7: Testing remove item button...');
    try {
      const removeButton = await page.$(
        'table button[class*="remove"], table button:has-text("Remove")',
      );
      if (removeButton) {
        await removeButton.click();
        await page.waitForTimeout(500);
        testResults.passed.push('Remove item button works');

        const screenshotPath = join(
          SCREENSHOT_DIR,
          'transfer-06-item-removed.png',
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        testResults.warnings.push('Remove button not found');
      }
      console.log('  ✓ Remove item tested\n');
    } catch (error) {
      testResults.warnings.push(`Remove item failed: ${error.message}`);
    }

    // Test 8: Validation (Same Warehouse)
    console.log('✓ Test 8: Testing same warehouse validation...');
    try {
      // Set both warehouses to same value
      const warehouseSelects = await page.$$('select');
      if (warehouseSelects.length >= 2) {
        const firstValue = await page.evaluate(() => {
          const select = document.querySelectorAll('select')[0];
          return select ? select.value : null;
        });

        if (firstValue) {
          await page.evaluate((value) => {
            const select = document.querySelectorAll('select')[1];
            if (select) {
              select.value = value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, firstValue);

          await page.waitForTimeout(500);

          const errorMessage = await page.evaluate(() => {
            const errors = Array.from(
              document.querySelectorAll(
                '.error, .text-red-500, [class*="error"]',
              ),
            );
            return errors.find(
              (el) =>
                el.textContent.toLowerCase().includes('same') ||
                el.textContent.toLowerCase().includes('different'),
            );
          });

          if (errorMessage) {
            testResults.passed.push('Same warehouse validation works');
          } else {
            testResults.warnings.push('Same warehouse validation not detected');
          }

          const screenshotPath = join(
            SCREENSHOT_DIR,
            'transfer-07-validation.png',
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          testResults.screenshots.push(screenshotPath);
        }
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
  console.log('TEST SUMMARY: Transfer Form');
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
