# E2E Tests - Invoice Stock Allocation Panel

## Overview

This directory contains comprehensive End-to-End tests for the Invoice Form, specifically targeting the **Stock Allocation Panel Bug Fixes**.

### Bug Context

When adding product "SS-316-Bar-Bright-30mm-6000mm" (ID: 308) via Quick Add, the allocation panel showed:
- **Problem**: 0 stock for all warehouses
- **Expected**: 17 units (Abu Dhabi: 5, Dubai: 5, Main: 7)
- **Wrong Source Type**: "Local Drop Ship" instead of "Warehouse"

### Root Causes (BOTH FIXED)

#### Issue 1: Race Condition (Line 2388)
```javascript
// BEFORE (WRONG):
applyAutoAllocation(index, product.id, quantity);  // Missing await

// AFTER (FIXED):
await applyAutoAllocation(index, product.id, quantity);  // Added await
```

**Impact**: Panel rendered before batch data loaded, showing 0 stock.

#### Issue 2: API Parameter Mismatch (Line 1627)
```javascript
// BEFORE (WRONG):
const response = await stockBatchService.getBatches({
  hasStock: true,  // Backend doesn't recognize this parameter
});

// AFTER (FIXED):
const response = await stockBatchService.getBatches({
  activeOnly: true,  // Correct parameter backend expects
});
```

**Impact**: Backend ignored unknown parameter, returned empty/incorrect results.

## Test Files

### 1. MCP-Based Test (Recommended)
**File**: `invoice-stock-allocation.test.js`

Uses the `erp-test-automation` MCP server for advanced testing capabilities:
- Chrome DevTools integration
- Network request monitoring
- Console error detection
- DOM introspection
- Evidence capture on failures

**Execution**:
```javascript
// Via MCP client
import { erpTestAutomation } from '@modelcontextprotocol/mcp-client';
const client = await erpTestAutomation.connect();
// Run tests...
```

**Features**:
- Verifies API parameter usage (`activeOnly=true`)
- Captures network requests
- Monitors console for errors
- Creates checkpoints for state restoration
- Batch assertions

### 2. Cypress Test (Compatibility)
**File**: `../cypress/e2e/invoice-stock-allocation.cy.js`

Standard Cypress E2E test for integration with existing test suite.

**Execution**:
```bash
# Run all tests
npm run test:e2e

# Run specific test
npx cypress run --spec "cypress/e2e/invoice-stock-allocation.cy.js"

# Open Cypress UI
npm run test:e2e:open
```

## Test Coverage

### Primary Tests (Bug Verification)

| Test | Purpose | Verifies |
|------|---------|----------|
| **Stock Numbers** | Warehouse stock displays correctly | Race condition + API parameter fixes |
| **Source Type** | Shows "Warehouse" not "Local Drop Ship" | Auto-allocation logic works |
| **Batch Table** | 4 batches visible in FIFO order | Data fetched and rendered correctly |
| **API Request** | Uses `activeOnly=true` parameter | API parameter fix applied |

### Supporting Tests

| Test | Purpose |
|------|---------|
| Customer Selection | Customer details populate correctly |
| Product Quick Add | Quick Add dropdown works |
| Invoice Totals | Subtotal, VAT, Total calculate correctly |
| Form Validation | Required fields validated |
| Edge Cases | Zero-stock products show Local Drop Ship |
| Console Errors | No JavaScript errors during operations |
| Complete Flow | End-to-end invoice creation |

## Expected Test Data

### Product: SS-316-Bar-Bright-30mm-6000mm (ID: 308)

**Database Setup Required**:
```sql
-- Batches for product 308
INSERT INTO stock_batches (id, batch_number, product_id, warehouse_id, quantity_remaining, status, received_date) VALUES
(1, 'BTH-001', 308, 1, 2, 'ACTIVE', '2024-01-01'),  -- Main WH
(3, 'BTH-003', 308, 2, 5, 'ACTIVE', '2024-01-02'),  -- Dubai
(4, 'BTH-004', 308, 3, 5, 'ACTIVE', '2024-01-03'),  -- Abu Dhabi
(2, 'BTH-002', 308, 1, 5, 'ACTIVE', '2024-01-04');  -- Main WH
```

**Expected Stock by Warehouse**:
- **Abu Dhabi (ID: 3)**: 5 units
- **Dubai (ID: 2)**: 5 units
- **Main (ID: 1)**: 7 units (2 + 5 from two batches)
- **Total**: 17 units

**Expected Batches** (FIFO order):
1. BTH-001: Main WH, 2 units (oldest)
2. BTH-003: Dubai, 5 units
3. BTH-004: Abu Dhabi, 5 units
4. BTH-002: Main WH, 5 units (newest)

### Customer: ABC Corporation (ID: 1)

Test customer for invoice creation.

## Test Execution

### Prerequisites

1. **Servers Running**:
   - Frontend: `http://localhost:5173`
   - API Gateway: `http://localhost:3000`
   - gRPC Backend: `localhost:50051`
   - PostgreSQL: `localhost:5432`

2. **Database**:
   - Test data seeded (product 308, customer 1, batches)
   - Company ID: 1

3. **User Account**:
   - Email: `test@steelapp.com`
   - Password: `testpassword123`

### Running Tests

#### MCP-Based Tests
```bash
# Requires MCP client setup
# See MCP documentation for execution
```

#### Cypress Tests
```bash
# Headless mode (CI)
npm run test:e2e

# Interactive mode
npm run test:e2e:open

# Run specific test
npx cypress run --spec "cypress/e2e/invoice-stock-allocation.cy.js"

# Run with browser
npx cypress run --spec "cypress/e2e/invoice-stock-allocation.cy.js" --browser chrome
```

## Debugging Failed Tests

### Common Failures

#### 1. Stock Shows 0 Instead of 17

**Possible Causes**:
- Race condition fix not applied (missing `await` on line 2388)
- API parameter fix not applied (using `hasStock` instead of `activeOnly`)
- Test data missing in database

**Debug Steps**:
1. Check browser console for errors
2. Verify API request in Network tab: should have `activeOnly=true`
3. Check database: `SELECT * FROM stock_batches WHERE product_id = 308 AND status = 'ACTIVE'`
4. Verify code fixes applied in InvoiceForm.jsx

#### 2. "Local Drop Ship" Shows Instead of Batch Table

**Possible Causes**:
- Race condition causing `totalStock === 0` check to fail
- API returning empty batch array

**Debug Steps**:
1. Check Network tab: API should return 4 batches
2. Check React DevTools: `productBatchData[308]` state
3. Verify `applyAutoAllocation` is awaited

#### 3. API Request Uses Wrong Parameter

**Possible Causes**:
- API parameter fix not applied

**Debug Steps**:
1. Network tab: Check query params, should have `activeOnly=true`, NOT `hasStock=true`
2. Verify line 1627 in InvoiceForm.jsx

## Test Evidence Capture

### MCP Tests
Automatically captures on failure:
- Screenshot
- Console logs
- Network requests
- DOM snapshot

**Evidence Location**: `./test-evidence/`

### Cypress Tests
On failure:
- Screenshot: `cypress/screenshots/`
- Video (if enabled): `cypress/videos/`

## Related Files

### Source Code
- `/mnt/d/Ultimate Steel/steelapp-fe/src/pages/InvoiceForm.jsx`
  - Line 1627: API parameter fix
  - Line 2388: Race condition fix

### Documentation
- `/mnt/d/Ultimate Steel/DIAGNOSTIC_SUMMARY.md` - Complete bug analysis
- `/mnt/d/Ultimate Steel/debug.txt` - Race condition details

### Backend
- `/mnt/d/Ultimate Steel/steelapprnp/proto/steelapp/stock_batch.proto` - Proto definition
- `/mnt/d/Ultimate Steel/steelapprnp/grpc/services/stockBatchService.js` - gRPC service
- `/mnt/d/Ultimate Steel/steelapprnp/api-gateway/routes/stock-batches.js` - API endpoint

## Test Maintenance

### When to Update Tests

1. **UI Changes**:
   - Update selectors if form structure changes
   - Update data-testid attributes for stable selectors

2. **API Changes**:
   - Update intercepted endpoints
   - Update expected response format

3. **Test Data Changes**:
   - Update product ID if test product changes
   - Update expected stock numbers if batch data changes

### Best Practices

1. **Use data-testid Attributes**:
   ```jsx
   <div data-testid="allocation-panel">...</div>
   <table data-testid="batch-table">...</table>
   ```

2. **Avoid Brittle Selectors**:
   - ❌ `cy.get('.css-abc123-panel')`
   - ✅ `cy.get('[data-testid="allocation-panel"]')`

3. **Wait for Async Operations**:
   ```javascript
   cy.wait('@getBatches');  // Wait for API
   cy.wait(1000);  // Wait for calculations
   ```

4. **Capture Evidence**:
   - Always capture screenshot on critical assertions
   - Log network requests for debugging

## Continuous Integration

### GitHub Actions / CI Pipeline

```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e
  env:
    CYPRESS_baseUrl: http://localhost:5173
    CYPRESS_apiUrl: http://localhost:3000
```

### Test Reports

- Cypress Dashboard (if configured)
- JUnit XML reports
- Test screenshots/videos as artifacts

## Success Criteria

All tests should pass with:
- ✅ Warehouse stock numbers display correctly (not 0)
- ✅ Source type is "Warehouse"
- ✅ Batch table visible with 4 batches
- ✅ API uses `activeOnly=true` parameter
- ✅ No console errors
- ✅ Invoice totals calculate correctly
- ✅ Edge cases handled (zero-stock products)

## Support

For test failures or questions:
1. Check DIAGNOSTIC_SUMMARY.md for bug context
2. Verify both code fixes are applied
3. Check database test data
4. Review test execution logs
5. Capture evidence and share for debugging

---

**Last Updated**: 2025-12-14
**Test Version**: 1.0
**Bug Fix Status**: Both fixes applied (line 1627, line 2388)
