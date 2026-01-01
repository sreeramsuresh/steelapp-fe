/* eslint-disable no-console */
/**
 * Account Statement Form - Automated Validation Test
 * Tests the migrated Tailwind CSS form for functionality and UI correctness
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use Puppeteer's bundled Chromium (cross-platform compatible)
const CHROMIUM_PATH = null; // null = use bundled browser
const BASE_URL = 'http://localhost:5173';
const FORM_URL = `${BASE_URL}/account-statements/create`;
const SCREENSHOT_DIR = join(__dirname, '../../test-results/screenshots');

// Test configuration
const TEST_CONFIG = {
  headless: true, // Set to false to see browser actions
  slowMo: 50, // Slow down by 50ms for better observation
  timeout: 30000,
};

// Test data
const TEST_DATA = {
  customer: 'Test Customer Corp',
  statementDate: '2024-01-15',
  format: 'DETAILED',
  currency: 'AED',
  groupBy: 'BY_DATE',
  notes: 'Automated test - Account Statement Form validation',
};

/**
 * Main test runner
 */
async function runTest() {
  console.log('🚀 Starting Account Statement Form Validation Test...\n');

  const launchOptions = {
    headless: TEST_CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
    slowMo: TEST_CONFIG.slowMo,
  };

  // Only add executablePath if specified (otherwise use bundled browser)
  if (CHROMIUM_PATH) {
    launchOptions.executablePath = CHROMIUM_PATH;
  }

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

    // Capture console messages
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Capture errors
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.toString());
    });

    // Test 1: Page Load
    console.log('✓ Test 1: Loading form page...');
    try {
      await page.goto(FORM_URL, {
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout,
      });
      testResults.passed.push('Page loaded successfully');

      // Take screenshot
      const screenshotPath = join(SCREENSHOT_DIR, '01-page-loaded.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
      console.log('  ✓ Screenshot saved\n');
    } catch (error) {
      testResults.failed.push(`Page load failed: ${error.message}`);
      throw error;
    }

    // Test 2: Form Elements Visibility
    console.log('✓ Test 2: Checking form elements...');
    try {
      const formVisible = await page.evaluate(() => {
        const form = document.querySelector('form');
        return form !== null;
      });

      if (formVisible) {
        testResults.passed.push('Form element found');
      } else {
        testResults.failed.push('Form element not found');
      }

      // Check for key input fields
      const fields = [
        { selector: 'input[type="date"]', name: 'Statement Date' },
        { selector: 'select', name: 'Select dropdowns' },
        { selector: 'textarea', name: 'Textarea' },
      ];

      for (const field of fields) {
        const exists = (await page.$(field.selector)) !== null;
        if (exists) {
          testResults.passed.push(`${field.name} field exists`);
        } else {
          testResults.warnings.push(`${field.name} field not found`);
        }
      }

      console.log('  ✓ Form elements validated\n');
    } catch (error) {
      testResults.failed.push(`Form elements check failed: ${error.message}`);
    }

    // Test 3: Fill Form Fields
    console.log('✓ Test 3: Filling form fields...');
    try {
      // Fill statement date
      await page.type('input[type="date"]', TEST_DATA.statementDate);
      testResults.passed.push('Statement date filled');

      // Fill format dropdown (if exists)
      const formatSelect = await page.$('select');
      if (formatSelect) {
        await page.select('select', TEST_DATA.format);
        testResults.passed.push('Format selected');
      }

      // Fill notes
      const notesTextarea = await page.$('textarea');
      if (notesTextarea) {
        await page.type('textarea', TEST_DATA.notes);
        testResults.passed.push('Notes filled');
      }

      // Take screenshot after filling
      const screenshotPath = join(SCREENSHOT_DIR, '02-form-filled.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
      console.log('  ✓ Form filled and screenshot saved\n');
    } catch (error) {
      testResults.failed.push(`Form filling failed: ${error.message}`);
    }

    // Test 4: Dark Mode Toggle (if exists)
    console.log('✓ Test 4: Testing dark mode...');
    try {
      const darkModeButton = await page.$(
        'button[aria-label*="theme"], button[aria-label*="dark"]',
      );
      if (darkModeButton) {
        await darkModeButton.click();
        await page.waitForTimeout(500);

        const screenshotPath = join(SCREENSHOT_DIR, '03-dark-mode.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
        testResults.passed.push('Dark mode toggle works');
        console.log('  ✓ Dark mode tested\n');
      } else {
        testResults.warnings.push('Dark mode toggle not found');
        console.log('  ⚠ Dark mode toggle not found\n');
      }
    } catch (error) {
      testResults.warnings.push(`Dark mode test failed: ${error.message}`);
    }

    // Test 5: Validation
    console.log('✓ Test 5: Testing form validation...');
    try {
      // Try to submit with empty required fields (after clearing)
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const inputs = form.querySelectorAll('input, select, textarea');
          inputs.forEach((input) => {
            if (input.type !== 'submit') {
              input.value = '';
            }
          });
        }
      });

      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorMessages = await page.evaluate(() => {
          const errorElements = Array.from(
            document.querySelectorAll(
              '.error, .text-red-500, [class*="error"]',
            ),
          );
          return errorElements.map((el) => el.textContent);
        });

        if (errorMessages.length > 0) {
          testResults.passed.push(
            'Form validation triggers errors for empty fields',
          );
          console.log(`  ✓ Validation errors found: ${errorMessages.length}\n`);
        } else {
          testResults.warnings.push('No validation errors displayed');
        }

        const screenshotPath = join(SCREENSHOT_DIR, '04-validation-errors.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        testResults.warnings.push('Submit button not found');
      }
    } catch (error) {
      testResults.warnings.push(`Validation test failed: ${error.message}`);
    }

    // Test 6: Console Errors Check
    console.log('✓ Test 6: Checking console errors...');
    const consoleErrors = consoleMessages.filter((msg) => msg.type === 'error');
    if (consoleErrors.length > 0) {
      testResults.warnings.push(`${consoleErrors.length} console errors found`);
      consoleErrors.forEach((err, idx) => {
        console.log(`  ⚠ Console Error ${idx + 1}: ${err.text}`);
      });
    } else {
      testResults.passed.push('No console errors');
      console.log('  ✓ No console errors\n');
    }

    // Test 7: Page Errors Check
    console.log('✓ Test 7: Checking page errors...');
    if (errors.length > 0) {
      testResults.failed.push(`${errors.length} page errors found`);
      errors.forEach((err, idx) => {
        console.log(`  ✗ Page Error ${idx + 1}: ${err}`);
      });
    } else {
      testResults.passed.push('No page errors');
      console.log('  ✓ No page errors\n');
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.failed.push(`Test execution error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // Print summary
  printSummary(testResults);

  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

/**
 * Print test results summary
 */
function printSummary(results) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY: Account Statement Form');
  console.log('='.repeat(60));

  console.log(`\n✓ Passed: ${results.passed.length}`);
  results.passed.forEach((test) => console.log(`  - ${test}`));

  if (results.warnings.length > 0) {
    console.log(`\n⚠ Warnings: ${results.warnings.length}`);
    results.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n✗ Failed: ${results.failed.length}`);
    results.failed.forEach((failure) => console.log(`  - ${failure}`));
  }

  console.log(`\n📸 Screenshots: ${results.screenshots.length}`);
  results.screenshots.forEach((path) => console.log(`  - ${path}`));

  console.log(`\n${'='.repeat(60)}`);

  const totalTests = results.passed.length + results.failed.length;
  const passRate =
    totalTests > 0
      ? ((results.passed.length / totalTests) * 100).toFixed(1)
      : 0;
  console.log(
    `OVERALL: ${results.passed.length}/${totalTests} passed (${passRate}%)`,
  );
  console.log(`${'='.repeat(60)}\n`);
}

// Run the test
runTest().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
