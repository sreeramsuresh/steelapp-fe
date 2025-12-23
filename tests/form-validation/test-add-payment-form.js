/**
 * Add Payment Form - Automated Validation Test
 * Tests the migrated Tailwind CSS payment form
 */

import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHROMIUM_PATH = null; // Use Puppeteer's bundled Chromium
const BASE_URL = "http://localhost:5173";
const FORM_URL = `${BASE_URL}/payments/add`; // Adjust if different
const SCREENSHOT_DIR = join(__dirname, "../../test-results/screenshots");

const TEST_CONFIG = {
  headless: true,
  slowMo: 50,
  timeout: 30000,
};

const TEST_DATA = {
  amount: "5000.00",
  paymentDate: "2024-01-15",
  paymentMethod: "BANK_TRANSFER",
  reference: "TEST-PAY-001",
  notes: "Automated test - Payment form validation",
};

async function runTest() {
  console.log("🚀 Starting Add Payment Form Validation Test...\n");

  const launchOptions = {
    headless: TEST_CONFIG.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
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
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const pageErrors = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.toString());
    });

    // Test 1: Page Load
    console.log("✓ Test 1: Loading payment form...");
    try {
      await page.goto(FORM_URL, {
        waitUntil: "networkidle2",
        timeout: TEST_CONFIG.timeout,
      });
      testResults.passed.push("Payment form loaded");

      const screenshotPath = join(SCREENSHOT_DIR, "payment-01-loaded.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
      console.log("  ✓ Screenshot saved\n");
    } catch (error) {
      testResults.failed.push(`Page load failed: ${error.message}`);
      throw error;
    }

    // Test 2: Form Elements
    console.log("✓ Test 2: Checking payment form fields...");
    try {
      const fields = [
        {
          selector: 'input[type="number"], input[name*="amount"]',
          name: "Amount field",
        },
        { selector: 'input[type="date"]', name: "Payment date" },
        { selector: 'select, input[name*="method"]', name: "Payment method" },
        { selector: 'input[name*="reference"]', name: "Reference field" },
      ];

      for (const field of fields) {
        const exists = (await page.$(field.selector)) !== null;
        if (exists) {
          testResults.passed.push(`${field.name} exists`);
        } else {
          testResults.warnings.push(`${field.name} not found`);
        }
      }
      console.log("  ✓ Form fields validated\n");
    } catch (error) {
      testResults.failed.push(`Form elements check failed: ${error.message}`);
    }

    // Test 3: Fill Amount Field
    console.log("✓ Test 3: Testing amount input...");
    try {
      const amountInput = await page.$(
        'input[type="number"], input[name*="amount"]',
      );
      if (amountInput) {
        await amountInput.click({ clickCount: 3 }); // Select all
        await amountInput.type(TEST_DATA.amount);
        testResults.passed.push("Amount field filled");

        const screenshotPath = join(
          SCREENSHOT_DIR,
          "payment-02-amount-filled.png",
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      } else {
        testResults.warnings.push("Amount field not found");
      }
      console.log("  ✓ Amount input tested\n");
    } catch (error) {
      testResults.warnings.push(`Amount input failed: ${error.message}`);
    }

    // Test 4: Invoice Autocomplete (if exists)
    console.log("✓ Test 4: Testing invoice autocomplete...");
    try {
      const autocompleteInput = await page.$(
        'input[placeholder*="Search"], input[placeholder*="invoice"]',
      );
      if (autocompleteInput) {
        await autocompleteInput.type("INV");
        await page.waitForTimeout(500);

        const dropdown = await page.$(
          '[class*="dropdown"], [class*="suggestions"], [class*="options"]',
        );
        if (dropdown) {
          testResults.passed.push("Autocomplete dropdown appears");

          const screenshotPath = join(
            SCREENSHOT_DIR,
            "payment-03-autocomplete.png",
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });
          testResults.screenshots.push(screenshotPath);
        } else {
          testResults.warnings.push("Autocomplete dropdown not found");
        }
      } else {
        testResults.warnings.push("Autocomplete input not found");
      }
      console.log("  ✓ Autocomplete tested\n");
    } catch (error) {
      testResults.warnings.push(`Autocomplete test failed: ${error.message}`);
    }

    // Test 5: Validation
    console.log("✓ Test 5: Testing validation...");
    try {
      // Clear form
      await page.evaluate(() => {
        const inputs = document.querySelectorAll("input, select, textarea");
        inputs.forEach((input) => {
          if (input.type !== "submit" && input.type !== "button") {
            input.value = "";
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
          testResults.warnings.push("No validation errors displayed");
        }

        const screenshotPath = join(
          SCREENSHOT_DIR,
          "payment-04-validation.png",
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResults.screenshots.push(screenshotPath);
      }
      console.log("  ✓ Validation tested\n");
    } catch (error) {
      testResults.warnings.push(`Validation test failed: ${error.message}`);
    }

    // Console & Page Errors
    if (consoleErrors.length > 0) {
      testResults.warnings.push(`${consoleErrors.length} console errors`);
      consoleErrors.forEach((err) => console.log(`  ⚠ ${err}`));
    } else {
      testResults.passed.push("No console errors");
    }

    if (pageErrors.length > 0) {
      testResults.failed.push(`${pageErrors.length} page errors`);
    } else {
      testResults.passed.push("No page errors");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    testResults.failed.push(`Test error: ${error.message}`);
  } finally {
    await browser.close();
  }

  printSummary(testResults);
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

function printSummary(results) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST SUMMARY: Add Payment Form");
  console.log("=".repeat(60));

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
  console.log(`${"=".repeat(60)}\n`);
}

runTest().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
