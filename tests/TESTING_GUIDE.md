# Invoice Stock Allocation E2E Testing Guide

## Quick Start

### Prerequisites Checklist

- [ ] Frontend running: `http://localhost:5173`
- [ ] Backend running: `http://localhost:3000`
- [ ] Database running: `localhost:5432`
- [ ] Test data seeded (see below)
- [ ] Test user account created

### 1. Setup Test Data (One-Time)

```bash
# Connect to PostgreSQL
psql -U postgres -d steelapp

# Run test data setup
\i /mnt/d/Ultimate\ Steel/steelapp-fe/tests/e2e-mcp/test-data-setup.sql
```

Or via command line:

```bash
psql -U postgres -d steelapp -f "/mnt/d/Ultimate Steel/steelapp-fe/tests/e2e-mcp/test-data-setup.sql"
```

**Verify test data**:

```sql
SELECT batch_number, warehouse_id, quantity_remaining
FROM stock_batches
WHERE product_id = 308 AND status = 'ACTIVE'
ORDER BY received_date;

-- Should return 4 batches with 17 total units
```

### 2. Run Cypress Tests

```bash
# Navigate to frontend directory
cd /mnt/d/Ultimate\ Steel/steelapp-fe

# Run all E2E tests (headless)
npm run test:e2e

# Run only stock allocation tests
npx cypress run --spec "cypress/e2e/invoice-stock-allocation.cy.js"

# Open Cypress UI (interactive)
npm run test:e2e:open
```

### 3. Run MCP Tests (Advanced)

```javascript
// Requires MCP server connection
// See: tests/e2e-mcp/invoice-stock-allocation.test.js
```

## What the Tests Verify

### PRIMARY: Bug Fix Verification

| Test              | What It Checks                     | Pass Criteria                                |
| ----------------- | ---------------------------------- | -------------------------------------------- |
| **Stock Numbers** | Warehouse stock displays correctly | Abu Dhabi: 5, Dubai: 5, Main: 7 (NOT 0)      |
| **Source Type**   | Correct allocation source          | Shows "Warehouse" (NOT "Local Drop Ship")    |
| **Batch Table**   | Batch allocation table visible     | 4 batches in FIFO order                      |
| **API Parameter** | Correct API request                | Uses `activeOnly=true` (NOT `hasStock=true`) |

### SUPPORTING: Full Invoice Flow

| Test               | What It Checks                              |
| ------------------ | ------------------------------------------- |
| Customer Selection | Customer details populate                   |
| Product Quick Add  | Quick Add dropdown works                    |
| Invoice Totals     | Calculations correct (subtotal, VAT, total) |
| Form Validation    | Required fields validated                   |
| Edge Cases         | Zero-stock products show Local Drop Ship    |
| Console Errors     | No JavaScript errors                        |

## Expected Results

### Correct Behavior (After Fixes)

When adding product "SS-316-Bar-Bright-30mm-6000mm" via Quick Add:

1. **Stock Allocation Panel Auto-Expands** ✅
2. **Warehouse Stock Shows CORRECT Numbers**:
   - Abu Dhabi Warehouse: **5 units** ✅
   - Dubai Branch Warehouse: **5 units** ✅
   - Main Warehouse: **7 units** ✅
3. **Source Type**: "Warehouse" ✅
4. **Batch Table Visible** with 4 batches:
   - BTH-001: Main WH, 2 units
   - BTH-003: Dubai, 5 units
   - BTH-004: Abu Dhabi, 5 units
   - BTH-002: Main WH, 5 units
5. **API Request**: Uses `activeOnly=true` parameter ✅

### Incorrect Behavior (Before Fixes)

What happened BEFORE the fixes:

1. Stock showed **0 units** for all warehouses ❌
2. Source type showed **"Local Drop Ship"** ❌
3. Batch table was **hidden** ❌
4. API used **wrong parameter** (`hasStock=true`) ❌

## Debugging Failed Tests

### Test Fails: Stock Shows 0

**Possible Causes**:

1. **Race condition fix not applied**:

   ```bash
   # Check line 2388 in InvoiceForm.jsx
   # Should be: await applyAutoAllocation(...)
   ```

2. **API parameter fix not applied**:

   ```bash
   # Check line 1627 in InvoiceForm.jsx
   # Should be: activeOnly: true (NOT hasStock: true)
   ```

3. **Test data missing**:
   ```sql
   -- Verify batches exist
   SELECT * FROM stock_batches WHERE product_id = 308;
   ```

**Debug Steps**:

```bash
# 1. Check browser console (should have no errors)
# 2. Check Network tab
#    - Find request to /api/stock-batches?productId=308
#    - Verify URL has: activeOnly=true
#    - Verify response has 4 batches

# 3. Check React DevTools
#    - Find InvoiceForm component
#    - Check state: productBatchData[308]
#    - Should have 4 batches

# 4. Verify code fixes
grep -n "await applyAutoAllocation" src/pages/InvoiceForm.jsx
# Should show line 2388 with await

grep -n "activeOnly" src/pages/InvoiceForm.jsx
# Should show line 1627 with activeOnly: true
```

### Test Fails: "Local Drop Ship" Shows

**Cause**: Stock data not loading before panel renders (race condition)

**Fix**: Verify `await` on line 2388

### Test Fails: API Uses Wrong Parameter

**Cause**: API parameter fix not applied

**Fix**: Verify line 1627 uses `activeOnly: true`

## Test Data Reference

### Product: SS-316-Bar-Bright-30mm-6000mm

- **ID**: 308
- **Total Stock**: 17 units
- **Batches**: 4 (FIFO ordered by received_date)

### Warehouses

| ID  | Name                   | Stock                             |
| --- | ---------------------- | --------------------------------- |
| 1   | Main Warehouse         | 7 units (2 + 5 from batches 1, 2) |
| 2   | Dubai Branch Warehouse | 5 units (batch 3)                 |
| 3   | Abu Dhabi Warehouse    | 5 units (batch 4)                 |

### Batches (FIFO Order)

| Batch # | Warehouse | Qty | Received Date       |
| ------- | --------- | --- | ------------------- |
| BTH-001 | Main      | 2   | 2024-01-01 (oldest) |
| BTH-003 | Dubai     | 5   | 2024-01-02          |
| BTH-004 | Abu Dhabi | 5   | 2024-01-03          |
| BTH-002 | Main      | 5   | 2024-01-04 (newest) |

### Customer

- **ID**: 1
- **Name**: ABC Corporation

## Continuous Integration

### GitHub Actions / CI Pipeline

Add to `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci
        working-directory: ./steelapp-fe

      - name: Setup test database
        run: |
          psql -U postgres -d steelapp_test -f tests/e2e-mcp/test-data-setup.sql

      - name: Start servers
        run: |
          npm run dev &
          # Wait for server to start
          sleep 10

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./steelapp-fe

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-results
          path: |
            cypress/screenshots
            cypress/videos
```

## Manual Testing Steps

If automated tests fail, manually verify:

### Step 1: Login

1. Go to `http://localhost:5173/login`
2. Login with test credentials

### Step 2: Navigate to Create Invoice

1. Click "Create Invoice" or navigate to `/create-invoice`
2. Verify form loads

### Step 3: Select Customer

1. Click customer dropdown
2. Select "ABC Corporation"
3. Verify customer details populate

### Step 4: Add Product via Quick Add

1. Click "Quick Add" button
2. Search for "SS-316-Bar-Bright-30mm-6000mm"
3. Click to select product

### Step 5: Verify Stock Allocation Panel (CRITICAL)

1. **Panel should auto-expand** ✅
2. **Check stock numbers**:
   - Abu Dhabi: **5** (NOT 0) ✅
   - Dubai: **5** (NOT 0) ✅
   - Main: **7** (NOT 0) ✅
3. **Check source type**: "Warehouse" (NOT "Local Drop Ship") ✅
4. **Check batch table**: Should show 4 batches ✅

### Step 6: Verify Network Request

1. Open Browser DevTools → Network tab
2. Find request to `/api/stock-batches?productId=308`
3. Verify query parameters:
   - `productId=308` ✅
   - `activeOnly=true` ✅ (CRITICAL)
   - NO `hasStock=true` ❌
4. Check response: Should return 4 batches

### Step 7: Verify Console

1. Open Browser DevTools → Console tab
2. Should have NO errors (ignore favicon errors)

## Performance Benchmarks

Expected test execution times:

| Test Suite                 | Time           |
| -------------------------- | -------------- |
| Complete Cypress Suite     | ~2-3 minutes   |
| Stock Allocation Test Only | ~30-45 seconds |
| Manual Verification        | ~5 minutes     |

## Test Maintenance

### When to Update Tests

1. **UI Changes**:
   - Update selectors if form structure changes
   - Add/update `data-testid` attributes

2. **API Changes**:
   - Update intercepted endpoints
   - Update expected response format

3. **Test Data Changes**:
   - Update product ID if test product changes
   - Update expected stock numbers

### Monthly Checklist

- [ ] Verify test data still exists in DB
- [ ] Run full test suite
- [ ] Check for deprecated Cypress commands
- [ ] Update screenshots/baselines if UI changed

## Troubleshooting

### Tests Pass Locally But Fail in CI

**Possible Causes**:

- Test data not seeded in CI database
- Timing issues (CI slower than local)
- Different backend URL

**Solutions**:

1. Add test data seeding to CI pipeline
2. Increase timeouts in CI environment
3. Use environment variables for URLs

### Flaky Tests

**Common Issues**:

- Network requests timing out
- React state updates not completing
- DOM not fully rendered

**Solutions**:

```javascript
// Add longer waits
cy.wait("@getBatches", { timeout: 10000 });

// Wait for element to be stable
cy.get('[data-testid="allocation-panel"]')
  .should("be.visible")
  .should("not.be.disabled");
```

## Success Metrics

Test suite is healthy when:

- ✅ All tests pass consistently (95%+ pass rate)
- ✅ Test execution time < 5 minutes
- ✅ No flaky tests (inconsistent failures)
- ✅ Code coverage > 80% for critical paths
- ✅ Tests catch regressions before production

## Related Documentation

- **Bug Analysis**: `/mnt/d/Ultimate Steel/DIAGNOSTIC_SUMMARY.md`
- **Test Files**: `/mnt/d/Ultimate Steel/steelapp-fe/tests/e2e-mcp/`
- **Cypress Docs**: https://docs.cypress.io
- **Source Code**: `/mnt/d/Ultimate Steel/steelapp-fe/src/pages/InvoiceForm.jsx`

## Support

For issues:

1. Check test execution logs
2. Review DIAGNOSTIC_SUMMARY.md
3. Verify both code fixes applied (lines 1627, 2388)
4. Check database test data
5. Capture evidence (screenshots, console, network)

---

**Last Updated**: 2025-12-14
**Test Coverage**: Stock Allocation Panel Bug Fixes
**Status**: Ready for execution
