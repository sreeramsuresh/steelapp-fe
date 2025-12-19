# Cypress E2E Test Runbook

## Invoice Stock Allocation Panel Tests

This document provides instructions for running the redesigned E2E tests for the Invoice workflow.

---

## Prerequisites

1. **Backend Services Running**
   - PostgreSQL database (port 5432)
   - gRPC backend server (port 50051)
   - API Gateway (port 3000)

2. **Frontend Development Server**
   - Vite dev server (port 5173)
   - Start with: `npm run dev`

3. **Test Data in Database**
   - Customer: ABC Corporation (ID: 1)
   - Product: SS-316-Bar-BRIGHT-30mm-6000mm (ID: 308) with stock:
     - Abu Dhabi Warehouse (ID: 3): 5 units
     - Dubai Branch Warehouse (ID: 2): 5 units
     - Main Warehouse (ID: 1): 7 units across 2 batches
   - (Optional) Zero-stock product for edge case testing

4. **Cypress Installed**
   ```bash
   npm install --save-dev cypress
   ```

---

## Running Tests

### Option 1: Headless Mode (CI/CD)

Run all tests in headless mode (no browser UI):

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
npm run test:e2e
```

Or run specific spec:

```bash
npx cypress run --spec "cypress/e2e/invoice-stock-allocation.cy.js"
```

### Option 2: Interactive Mode (Development)

Open Cypress Test Runner GUI for debugging:

```bash
cd /mnt/d/Ultimate\ Steel/steelapp-fe
npm run test:e2e:open
```

Then select the `invoice-stock-allocation.cy.js` spec file from the GUI.

### Option 3: Specific Browser

Run tests in a specific browser:

```bash
# Chrome
npx cypress run --browser chrome --spec "cypress/e2e/invoice-stock-allocation.cy.js"

# Firefox
npx cypress run --browser firefox --spec "cypress/e2e/invoice-stock-allocation.cy.js"

# Edge
npx cypress run --browser edge --spec "cypress/e2e/invoice-stock-allocation.cy.js"
```

---

## Test Environment Configuration

### Cypress Environment Variables

Set in `cypress.env.json` (create if doesn't exist):

```json
{
  "testUserEmail": "test@example.com",
  "testUserPassword": "testpassword123"
}
```

Or via CLI:

```bash
npx cypress run --env testUserEmail=user@test.com,testUserPassword=pass123
```

### Base URL Configuration

In `cypress.config.js`:

```javascript
module.exports = {
  e2e: {
    baseUrl: "http://localhost:5173",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
  },
};
```

---

## Test Structure

### Test Suites

The test file is organized into 10 describe blocks:

1. **Page Load** - Verify form initialization
2. **Customer Selection** - Test autocomplete customer picker
3. **Product Selection with Stock** - PRIMARY test for stock allocation
4. **Zero Stock Product** - Edge case testing
5. **Invoice Totals** - Calculation verification
6. **Form Validation** - Required field validation
7. **Multiple Products** - Multi-line item testing
8. **API Requests** - Verify correct API parameters
9. **Error Monitoring** - Console error detection
10. **Complete Invoice Creation** - End-to-end flow

### Key Tests

#### Test: "should display correct warehouse stock numbers"

**Purpose:** Verifies the bug fix that was causing 0 stock to display instead of actual stock numbers.

**Assertions:**

- Abu Dhabi: 5 units
- Dubai: 5 units
- Main: 7 units
- No warehouse shows 0

#### Test: "should show source type as 'Warehouse' not 'Local Drop Ship'"

**Purpose:** Verifies source type auto-selects correctly based on stock availability.

**Assertions:**

- Source type = `WAREHOUSE`
- NOT `LOCAL_DROP_SHIP`

#### Test: "should use correct API parameters (activeOnly=true)"

**Purpose:** Verifies the API parameter bug fix (activeOnly vs hasStock).

**Assertions:**

- Request includes `activeOnly=true`
- Request does NOT include `hasStock=true`

---

## Custom Cypress Commands

### Customer Selection

```javascript
cy.selectCustomer("ABC Corporation");
```

### Product Selection

```javascript
cy.selectProduct(0, "SS-316-Bar-BRIGHT-30mm-6000mm");
// lineIndex, productName
```

### Wait for Allocation Panel

```javascript
cy.waitForAllocationPanel(0);
// Waits for stock data to load
```

### Get Source Type

```javascript
cy.getSourceType(0).should("eq", "WAREHOUSE");
```

### Get Warehouse Stock

```javascript
cy.getWarehouseStock(0, 3).should("contain", "5");
// lineIndex, warehouseId
```

### Verify Batch Table

```javascript
cy.verifyBatchTable(0, 4);
// lineIndex, expectedBatchCount
```

### Fill Invoice Fields

```javascript
cy.fillInvoiceBasicFields({ lineIndex: 0, quantity: 10, rate: 100 });
```

---

## Troubleshooting

### Test Fails: "Customer autocomplete not found"

**Cause:** Frontend not running or data-testid missing.

**Solution:**

1. Verify frontend is running: `http://localhost:5173`
2. Check `InvoiceForm.jsx` has `data-testid="customer-autocomplete"`
3. Check browser console for React errors

### Test Fails: "Listbox not visible"

**Cause:** Autocomplete dropdown not rendering.

**Solution:**

1. Check that typing triggers the dropdown
2. Verify the dropdown has `data-testid="customer-autocomplete-listbox"`
3. Check for CSS `display: none` or `visibility: hidden`

### Test Fails: "Stock numbers still show 0"

**Cause:** Backend bug not fixed or database has no stock.

**Solution:**

1. Verify backend fix: `await applyAutoAllocation()` on line 2388 of InvoiceForm.jsx
2. Verify API parameter: `activeOnly: true` on line 1627
3. Check database: Product 308 should have 17 total units

### Test Fails: "Batch API not called"

**Cause:** Product selection not triggering batch fetch.

**Solution:**

1. Check network tab for `/api/stock-batches` requests
2. Verify `handleProductSelect` is awaiting batch fetch
3. Check for JavaScript errors in console

### Test Hangs: "Waiting for allocation panel"

**Cause:** Panel not expanding or API slow.

**Solution:**

1. Check if product has stock (should auto-expand)
2. Verify `isExpanded` state is set correctly
3. Increase timeout: `cy.waitForAllocationPanel(0, { timeout: 15000 })`

---

## Expected Test Output

### Successful Run

```
  Invoice Form - Stock Allocation Panel
    Page Load
      ✓ should load the invoice form successfully (234ms)
      ✓ should display all required form sections (156ms)
    Customer Selection
      ✓ should select customer using autocomplete (456ms)
      ✓ should show customer details after selection (389ms)
    Product Selection with Stock
      ✓ should add product via autocomplete and auto-expand allocation panel (1234ms)
      ✓ should display correct warehouse stock numbers (987ms)
      ✓ should show source type as "Warehouse" not "Local Drop Ship" (876ms)
      ✓ should display batch allocation table with correct number of batches (765ms)
      ✓ should display batches in FIFO order (654ms)
    ...
    Complete Invoice Creation
      ✓ should create invoice successfully end-to-end (2345ms)

  23 passing (18s)
```

### Failed Test Example

```
  1) Product Selection with Stock
       should display correct warehouse stock numbers

  AssertionError: expected '0' to equal '5'
    at Context.eval (webpack:///./cypress/e2e/invoice-stock-allocation.cy.js:167:8)
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Cypress run
        uses: cypress-io/github-action@v4
        with:
          working-directory: ./steelapp-fe
          start: npm run dev
          wait-on: "http://localhost:5173"
          spec: cypress/e2e/invoice-stock-allocation.cy.js
```

---

## Data-testid Reference

### Customer Section

- `customer-autocomplete` - Customer input field
- `customer-autocomplete-listbox` - Customer dropdown
- `customer-autocomplete-option-{index}` - Customer option

### Product Section

- `product-autocomplete-{lineIndex}` - Product input field
- `product-autocomplete-{lineIndex}-listbox` - Product dropdown

### Allocation Panel

- `allocation-panel-{lineIndex}` - Allocation panel container
- `source-type-{lineIndex}` - Source type selector dropdown
- `allocation-stock-warehouses-{lineIndex}` - Stock warehouse container
- `stock-warehouse-{warehouseId}` - Individual warehouse stock
- `batch-allocation-table-{lineIndex}` - Batch table

---

## Performance Benchmarks

### Expected Test Times (per test)

- Page load: ~200-300ms
- Customer selection: ~400-500ms
- Product selection: ~800-1200ms (includes API call)
- Stock verification: ~500-1000ms
- Complete E2E: ~2000-3000ms

### Total Suite Time

- **Expected:** 15-20 seconds for all 23 tests
- **Warning threshold:** >30 seconds (investigate slow API or frontend issues)

---

## Maintenance

### When to Update Tests

1. **UI Changes**
   - Update selectors if `data-testid` attributes change
   - Adjust text matchers if labels change

2. **Test Data Changes**
   - Update `TEST_DATA` constant if database products change
   - Update expected stock quantities if database resets

3. **API Changes**
   - Update intercept patterns if API endpoints change
   - Adjust expected request parameters

### Test Stability Tips

1. **Always use data-testid** over CSS selectors
2. **Always wait for API calls** before assertions
3. **Never use fixed cy.wait(ms)** - use network intercepts
4. **Use contains() with regex** for flexible text matching
5. **Test in isolation** - each test should be independent

---

## Contact

For issues with tests:

1. Check this runbook first
2. Review test failure screenshots in `cypress/screenshots`
3. Review test videos in `cypress/videos`
4. Check console logs in Cypress Test Runner
5. Verify backend and frontend are both running

---

**Last Updated:** 2025-12-14
**Test Version:** 2.0 (Redesigned)
**Related Files:**

- `/cypress/e2e/invoice-stock-allocation.cy.js`
- `/cypress/support/commands.js`
- `/src/pages/InvoiceForm.jsx`
- `/src/components/invoice/SourceTypeSelector.jsx`
