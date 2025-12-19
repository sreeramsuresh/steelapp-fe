# E2E Tests - Puppeteer Launch Mode

End-to-end tests for Ultimate Steel ERP using Puppeteer in launch mode (standalone Chrome instance, no port 9222 required).

## Directory Structure

```
tests/e2e/
├── README.md                      # This file
├── SUPPLIER_FORM_TESTS.md         # Detailed guide for supplier form tests
├── supplier-form.test.js          # Supplier form E2E test suite
├── puppeteer-utils.js             # Reusable Puppeteer helper functions
└── [future test files...]
```

## Quick Start

### 1. Prerequisites

Ensure services are running:

- Frontend: `npm run dev` on `http://localhost:5173`
- Backend: Running on `http://localhost:3000`
- Database: PostgreSQL on `localhost:5432`

### 2. Install Puppeteer Chromium (One-Time)

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe

# Install if not already done
npx @puppeteer/browsers install chromium@latest --platform=linux
```

### 3. Run Tests

```bash
# Run all tests
node tests/e2e/supplier-form.test.js

# Or via npm (if you add script)
npm run test:e2e:puppeteer
```

## Test Files

### supplier-form.test.js

Comprehensive E2E test suite for the SupplierForm component.

**Test Suites:**

1. Basic Supplier Creation (5 fields)
2. Full Supplier Creation (30+ fields)
3. VAT Number Validation
4. TRN Number Validation
5. Trade License Expiry Validation
6. Supplier Location Auto-Update
7. Accordion Expand/Collapse

**Run:** `node tests/e2e/supplier-form.test.js`

**Documentation:** See `SUPPLIER_FORM_TESTS.md`

## Helper Library

### puppeteer-utils.js

Reusable utilities for writing E2E tests. Provides common functions for:

- Form interaction (fill, select, check)
- Validation (errors, success)
- Navigation and loading
- Screenshots and debugging
- Element queries and interactions

**Usage:**

```javascript
import {
  fillInput,
  selectDropdown,
  checkCheckbox,
  submitForm,
  getValidationErrors,
  log,
} from "./puppeteer-utils.js";

async function myTest(browser) {
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/suppliers/new", {
    waitUntil: "networkidle2",
  });

  // Fill form
  await fillInput(page, 'input[placeholder="Name"]', "My Supplier");
  await selectDropdown(page, "Category", "Stainless Steel");
  await checkCheckbox(page, 'input[value="mtc"]');

  // Submit and check
  await submitForm(page);
  const errors = await getValidationErrors(page);

  if (errors.length === 0) {
    log.success("Form submitted successfully");
  } else {
    log.error(`Validation errors: ${errors.join(", ")}`);
  }

  await page.close();
}
```

## Available Utilities

### Logging

- `log.success(msg)` - Green checkmark
- `log.error(msg)` - Red X
- `log.info(msg)` - Blue info
- `log.test(msg)` - Cyan test label
- `log.warn(msg)` - Yellow warning
- `log.debug(msg)` - Gray debug

### Form Interactions

- `fillInput(page, selector, value, options)`
- `fillInputs(page, fields)` - Fill multiple at once
- `getInputValue(page, selector)`
- `getInputValues(page, selectors)`
- `selectDropdown(page, label, value, timeout)`
- `checkCheckbox(page, selector)`
- `uncheckCheckbox(page, selector)`
- `isCheckboxChecked(page, selector)`
- `toggleSection(page, selector)`
- `typeText(page, selector, text, delay)`
- `uploadFile(page, selector, filePath)`

### Validation & Errors

- `getValidationErrors(page)`
- `hasError(page, errorPattern)`
- `submitForm(page, waitAfter)`
- `waitForNavigation(page, expectedPath, timeout)`

### UI Helpers

- `waitForElement(page, selector, timeout)`
- `waitForVisible(page, selector, timeout)`
- `waitForText(page, text, timeout)`
- `waitForNotification(page, type, timeout)`
- `waitForLoadingDone(page, selector, timeout)`
- `clickByText(page, text, selector)`
- `findByText(page, text, selector)`

### Debugging

- `takeScreenshot(page, path, fullPage)`
- `getPageContent(page)`
- `getElementBounds(page, selector)`
- `scrollIntoView(page, selector)`
- `isInViewport(page, selector)`
- `captureRequests(page, pattern)`

### Utilities

- `delay(ms)` - Wait utility
- `logTestResult(testName, passed, message)` - Formatted result output

## Writing New Tests

### Test Template

```javascript
#!/usr/bin/env node

import puppeteer from "puppeteer";
import {
  log,
  fillInput,
  selectDropdown,
  submitForm,
  getValidationErrors,
  takeScreenshot,
} from "./puppeteer-utils.js";

const CHROME_EXECUTABLE =
  "/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome";
const BASE_URL = "http://localhost:5173";

async function testMyFeature(browser) {
  log.test("MY FEATURE TEST");

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/my-page`, {
    waitUntil: "networkidle2",
    timeout: 10000,
  });

  try {
    // Test logic here
    await fillInput(page, 'input[name="field"]', "value");
    await submitForm(page);

    const errors = await getValidationErrors(page);
    if (errors.length === 0) {
      log.success("Test passed");
      await page.close();
      return true;
    } else {
      log.error(`Test failed: ${errors.join(", ")}`);
      await takeScreenshot(page, "/tmp/failure.png");
      await page.close();
      return false;
    }
  } catch (err) {
    log.error(`Test error: ${err.message}`);
    await page.close();
    return false;
  }
}

async function runTests() {
  const results = [];
  let browser;

  try {
    console.log("\n" + "═".repeat(70));
    console.log("  MY TEST SUITE");
    console.log("═".repeat(70) + "\n");

    browser = await puppeteer.launch({
      headless: true,
      executablePath: CHROME_EXECUTABLE,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    results.push(["My Feature", await testMyFeature(browser)]);

    await browser.close();

    // Print summary
    console.log("\n" + "═".repeat(70));
    console.log("  SUMMARY");
    console.log("═".repeat(70) + "\n");

    let passed = 0;
    results.forEach(([name, result]) => {
      const status = result ? "✓ PASS" : "✗ FAIL";
      console.log(`${status}  ${name}`);
      if (result) passed++;
    });

    console.log(`\nPassed: ${passed} / ${results.length}\n`);
    process.exit(passed === results.length ? 0 : 1);
  } catch (err) {
    log.error(`Critical error: ${err.message}`);
    if (browser) await browser.close();
    process.exit(1);
  }
}

runTests();
```

### Best Practices

1. **One test file per feature/page**
   - `supplier-form.test.js` for SupplierForm
   - `invoice-form.test.js` for InvoiceForm
   - etc.

2. **Use descriptive test names**

   ```javascript
   log.test("SUPPLIER FORM - BASIC CREATION WITH VALIDATION");
   ```

3. **Fail fast, report clearly**

   ```javascript
   if (!(await fillInput(page, selector, value))) {
     log.error("Failed to fill field, stopping test");
     return false;
   }
   ```

4. **Always close pages**

   ```javascript
   try {
     // Test code
   } finally {
     await page.close();
   }
   ```

5. **Use helper functions**

   ```javascript
   // Good
   await fillInput(page, selector, value);

   // Avoid
   await page.click(selector);
   await page.type(selector, value);
   ```

6. **Provide context on failure**
   ```javascript
   const errors = await getValidationErrors(page);
   log.error(`Validation failed: ${errors.join(", ")}`);
   await takeScreenshot(page, `/tmp/debug-${Date.now()}.png`);
   ```

## Debugging Failed Tests

### Enable Verbose Logging

```javascript
page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
page.on("error", (err) => console.log("PAGE ERROR:", err));
```

### Take Debugging Screenshots

```javascript
await takeScreenshot(page, `/tmp/debug-${testName}-${Date.now()}.png`, true);
```

### Inspect Page Content

```javascript
const content = await getPageContent(page);
console.log(content);
```

### Check Network Requests

```javascript
page.on("response", (response) => {
  if (response.status() >= 400) {
    console.log(`ERROR ${response.status()}: ${response.url()}`);
  }
});
```

### Use Interactive Browser

Convert a test to use `connect` mode to debug manually:

```javascript
const browser = await puppeteer.connect({
  browserURL: "http://localhost:9222",
});
// Now test in real-time in your Chrome browser
```

## Integration with npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e:puppeteer": "node tests/e2e/supplier-form.test.js",
    "test:e2e:all": "npm run test:e2e:puppeteer && npm run test:e2e:open"
  }
}
```

Then run:

```bash
npm run test:e2e:puppeteer
```

## Troubleshooting

### "Chrome executable not found"

```bash
npx @puppeteer/browsers install chromium@latest --platform=linux
```

### "Cannot connect to localhost:5173"

Start the frontend dev server:

```bash
npm run dev
```

### "Form fields not found"

1. Check if selectors match actual form HTML
2. Inspect the page with DevTools
3. Update selectors in test

### "Element not visible"

Use `waitForVisible` instead of `waitForElement`:

```javascript
await waitForVisible(page, selector);
```

### "Dropdown not working"

The dropdown might be using different HTML structure. Inspect it:

```javascript
const buttons = await page.$$("button");
for (const btn of buttons) {
  const text = await page.evaluate((el) => el.textContent, btn);
  console.log("Button:", text);
}
```

## Performance

Typical execution times:

- Chrome startup: 3 seconds
- Page navigation: 1-2 seconds
- Form operations: 0.5 seconds per field
- Form submission: 1-2 seconds
- Chrome shutdown: 1 second

**Total per test: 10-20 seconds**

## CI/CD Integration

See `SUPPLIER_FORM_TESTS.md` for GitHub Actions example.

## Future Tests

Planned test suites:

- [ ] Invoice creation and validation
- [ ] GRN (Goods Received Note) workflow
- [ ] Stock transfers between warehouses
- [ ] Customer dashboard
- [ ] Pricing and margin calculations
- [ ] VAT calculations
- [ ] Credit note generation
- [ ] Report generation

## Support

For help:

1. Check test file documentation
2. Review puppeteer-utils.js source
3. Check Puppeteer official docs: https://pptr.dev
4. Enable debug logging (see Debugging section)

## Related Files

- Supplier Form: `src/pages/SupplierForm.jsx`
- Supplier Service: `src/services/supplierService.js`
- Main Testing Guide: `tests/TESTING_GUIDE.md`
