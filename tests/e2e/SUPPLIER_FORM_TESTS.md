# Supplier Form E2E Tests

Comprehensive end-to-end tests for the enhanced SupplierForm component using Puppeteer in launch mode (standalone Chrome instance).

## Overview

Tests cover all 7 sections of the SupplierForm with 30+ fields:

1. **Basic Information** - Name, company, email, phone, address, city, country
2. **Contact Person** - Contact name, email, phone (collapsible)
3. **Tax & Compliance** - VAT, TRN, tax ID, trade license, file uploads (expanded by default)
4. **Supplier Classification** - Type, category, location, country, lead time (expanded by default)
5. **Stainless Steel Specifications** - MTC requirement, material grades, product forms, MOQ, certifications (collapsible)
6. **Financial Terms** - Payment terms, currency, credit limit, bank details (collapsible)
7. **Additional Information** - Notes, active status

## Prerequisites

### System Requirements
- Node.js 16+ with npm
- Frontend running: `http://localhost:5173`
- Backend/API Gateway running: `http://localhost:3000`
- PostgreSQL running: `localhost:5432`
- Puppeteer Chromium installed (one-time setup)

### Setup Puppeteer Chromium (One-Time)

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe

# Puppeteer is already in package.json
npm install

# Install Linux Chromium for WSL2 (required once)
npx @puppeteer/browsers install chromium@latest --platform=linux
```

This installs Chrome at:
```
/mnt/d/Ultimate Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/chrome
```

The test file automatically uses this path.

## Running Tests

### Quick Start

```bash
# Navigate to frontend directory
cd /mnt/d/Ultimate\ Steel/steelapp-fe

# Run all supplier form tests
node tests/e2e/supplier-form.test.js
```

### What Happens
1. Launches standalone Chrome instance (no port 9222 needed)
2. Navigates to `http://localhost:5173/suppliers/new`
3. Runs 7 test suites (see Test Suites section below)
4. Prints color-coded results to console
5. Exits with code 0 (all pass) or 1 (any fail)

### Output Example

```
══════════════════════════════════════════════════════════════════════════════
  SUPPLIER FORM E2E TEST SUITE
  Using Puppeteer Launch Mode (Standalone Chrome)
══════════════════════════════════════════════════════════════════════════════

ℹ Launching Chrome...
✓ Chrome launched (PID: 12345)

TEST CREATE SUPPLIER WITH BASIC FIELDS
ℹ Filled basic information fields
✓ Supplier created and redirected to /suppliers

TEST CREATE SUPPLIER WITH ALL FIELDS POPULATED
✓ Filled basic information
✓ Filled contact person details
...
✓ Filled additional information

══════════════════════════════════════════════════════════════════════════════
  TEST RESULTS SUMMARY
══════════════════════════════════════════════════════════════════════════════

✓ PASS  Basic Supplier Creation
✓ PASS  Full Supplier Creation
✓ PASS  VAT Number Validation
✓ PASS  TRN Number Validation
✓ PASS  Trade License Expiry
✓ PASS  Supplier Location Change
✓ PASS  Accordion Behavior

──────────────────────────────────────────────────────────────────────────────
Passed: 7 | Failed: 0 | Total: 7
──────────────────────────────────────────────────────────────────────────────
```

## Test Suites

### 1. Basic Supplier Creation

**What It Tests:**
- Form loads on `/suppliers/new`
- User can fill basic required fields
- Form submits successfully
- User redirects to `/suppliers` list

**Fields Used:**
- Supplier Name (required)
- Company
- Email
- Phone

**Expected Result:** Supplier created and list is shown

---

### 2. Full Supplier Creation with All Fields

**What It Tests:**
- All 30+ fields can be filled
- All sections can be expanded/collapsed
- Multi-select fields (material grades, product forms) work
- Nested objects (bank details) serialize correctly
- All validations pass with valid data

**Sections Tested:**
1. Basic Information (9 fields)
2. Contact Person (3 fields, expanded)
3. Tax & Compliance (8 fields including uploads)
4. Supplier Classification (6 fields)
5. Steel Specifications (8 fields, expanded)
6. Financial Terms (7 fields, expanded)
7. Additional Information (2 fields)

**Sample Data Used:**
```javascript
{
  name: "Advanced Steel Mills India",
  company: "ASMI Trading",
  email: "sales@asmi.com",
  supplierLocation: "OVERSEAS",
  primaryCountry: "India",
  typicalLeadTimeDays: 30,
  materialGradeSpecialization: ["304", "316L"],
  productFormCapabilities: ["SHEETS", "COILS"],
  paymentTerms: "NET_30",
  defaultCurrency: "USD",
  creditLimit: 50000,
  bankDetails: {
    accountNumber: "1234567890",
    bankName: "ICICI Bank",
    swiftCode: "ICICINBB",
    iban: "IN89ICIC0000000012345"
  },
  // ... other fields
}
```

**Expected Result:** All fields validated, form submitted successfully

---

### 3. VAT Number Validation

**What It Tests:**
- Invalid VAT (< 15 chars) shows error
- Error clears when valid VAT entered
- Valid VAT (15 alphanumeric) accepted

**Test Sequence:**
1. Enter supplier name (required)
2. Enter invalid VAT: "SHORT"
3. Submit and verify error message
4. Clear and enter valid VAT: "AE123456789012345"
5. Verify error is gone

**Validation Rule:** `^[A-Z0-9]{15}$`

**Expected Result:** Invalid rejected, valid accepted

---

### 4. TRN Number Validation

**What It Tests:**
- Invalid TRN (not 15 digits) shows error
- Error clears when valid TRN entered
- Valid TRN (15 digits) accepted
- Uses TRNInput component

**Test Sequence:**
1. Enter supplier name (required)
2. Enter invalid TRN: "123456"
3. Submit and verify error message
4. Clear and enter valid TRN: "123456789012345"
5. Verify error is gone

**Validation Rule:** `^\d{15}$`

**Expected Result:** Invalid rejected, valid accepted

---

### 5. Trade License Expiry Validation

**What It Tests:**
- Past date shows error "Trade license has expired"
- Error clears when future date entered
- Future date accepted without error

**Test Sequence:**
1. Enter supplier name (required)
2. Set date to yesterday
3. Submit and verify error
4. Set date to 1 year in future
5. Verify error is gone

**Validation Rule:** `expiryDate >= today`

**Expected Result:** Past date rejected, future accepted

---

### 6. Supplier Location Change Behavior

**What It Tests:**
- Selecting "OVERSEAS" enables primaryCountry field (required)
- Selecting "OVERSEAS" sets lead time to 45 days
- Selecting "UAE_LOCAL" disables primaryCountry field
- Selecting "UAE_LOCAL" sets lead time to 7 days

**Test Sequence:**
1. Select "OVERSEAS" location
2. Verify primaryCountry is enabled/required
3. Verify lead time = 45
4. Select "UAE_LOCAL" location
5. Verify primaryCountry is disabled
6. Verify lead time = 7

**Expected Result:** All auto-updates work correctly

---

### 7. Accordion Expand/Collapse

**What It Tests:**
- All collapsible sections toggle open/closed
- Content shows/hides with animation
- Can toggle multiple times without issues
- Chevron icons change direction

**Sections Tested:**
- Contact Person (collapsed by default)
- Steel Specifications (collapsed by default)
- Financial Terms (collapsed by default)

**Test Sequence:**
1. Click section header
2. Verify content becomes visible
3. Click again to collapse
4. Verify content becomes hidden
5. Repeat for multiple sections

**Expected Result:** All sections toggle correctly

---

## Test Implementation Details

### Helper Functions

#### `waitForElement(page, selector, timeout)`
Waits for element to exist on page.
```javascript
await waitForElement(page, 'input[placeholder="Enter supplier name"]');
```

#### `fillInput(page, selector, value)`
Fills a text input with given value.
```javascript
await fillInput(page, 'input[placeholder="Email"]', 'test@example.com');
```

#### `selectDropdown(page, label, value)`
Selects from Radix UI FormSelect component.
```javascript
await selectDropdown(page, 'Supplier Location', 'Overseas');
```

#### `checkCheckbox(page, selector)`
Checks a checkbox if not already checked.
```javascript
await checkCheckbox(page, 'input[value="mtc_requirement"]');
```

#### `getValidationErrors(page)`
Returns all visible validation error messages.
```javascript
const errors = await getValidationErrors(page);
if (errors.length > 0) console.log('Form has errors');
```

#### `toggleSection(page, selector)`
Expands/collapses an accordion section.
```javascript
await toggleSection(page, 'button:has(h2:has-text("Contact Person"))');
```

### Console Output Colors

- Green `✓` = Success
- Red `✗` = Error
- Blue `ℹ` = Info
- Yellow `⚠` = Warning
- Cyan `TEST` = Test name

### Timeout Handling

Each test has appropriate timeouts:
- Page navigation: 10 seconds
- DOM operations: 5 seconds
- Element interactions: 300ms

If any timeout occurs, test fails with error message.

## Debugging Failed Tests

### Enable Verbose Output

Edit the test file to add:
```javascript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('error', err => console.log('PAGE ERROR:', err));
```

### Take Screenshots

Add to test:
```javascript
await page.screenshot({ path: '/tmp/debug-screenshot.png', fullPage: true });
```

### Check Network Requests

Add to test:
```javascript
page.on('response', response => {
  console.log(`${response.status()} ${response.url()}`);
});
```

### Check Page Content

```javascript
const content = await page.content();
console.log(content); // HTML of page
```

## Common Issues & Solutions

### Issue: "Chrome executable not found"
**Solution:** Run chromium installer
```bash
npx @puppeteer/browsers install chromium@latest --platform=linux
```

### Issue: "Cannot connect to localhost:5173"
**Solution:** Start frontend dev server
```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
npm run dev
```

### Issue: "Form validation errors persist"
**Solution:** Check if API is returning proper error responses. Enable network logging in test.

### Issue: "Element not found: input[placeholder='...']"
**Solution:** The placeholder text might be different. Inspect the actual form HTML:
```bash
# In test, add:
const html = await page.content();
console.log(html); // Find actual selectors
```

### Issue: "Dropdown selection not working"
**Solution:** The Radix UI FormSelect might have different structure. Inspect:
```bash
# In test, add:
const buttons = await page.$$('button');
buttons.forEach(async (btn) => {
  console.log(await page.evaluate(el => el.textContent, btn));
});
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Supplier Form E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Install Chromium
        run: npx @puppeteer/browsers install chromium@latest

      - name: Start frontend
        run: npm run dev &

      - name: Start backend
        run: cd ../backend && npm run dev &

      - name: Wait for servers
        run: sleep 5

      - name: Run E2E tests
        run: node tests/e2e/supplier-form.test.js
```

## Performance Metrics

Typical test execution time:
- Single test: 2-5 seconds
- All 7 test suites: 20-30 seconds
- Chrome startup: 3 seconds
- Chrome shutdown: 1 second

## Future Enhancements

Potential additions:
1. File upload testing (mock files)
2. Error handling edge cases
3. Mobile responsive testing
4. Performance benchmarking
5. Screenshot comparison baselines
6. API response mocking
7. Database state verification
8. Parallel test execution

## Support

For issues or questions about the tests:
1. Check the debugging section above
2. Review console output for specific error messages
3. Check if all services (frontend, backend, DB) are running
4. Verify Chromium installation with: `ls -la /mnt/d/Ultimate\ Steel/steelapp-fe/chromium/linux-1559273/chrome-linux/`

## Related Files

- SupplierForm component: `/mnt/d/Ultimate Steel/steelapp-fe/src/pages/SupplierForm.jsx`
- Supplier service: `/mnt/d/Ultimate Steel/steelapp-fe/src/services/supplierService.js`
- Testing guide: `/mnt/d/Ultimate Steel/steelapp-fe/tests/TESTING_GUIDE.md`
