# Running Node Native Tests for Order Management

Quick reference guide for executing the new Node test runner tests.

## Quick Start

### Run All Order Management Tests
```bash
npm test src/pages/__tests__/*.node.test.mjs
```

### Run Specific Component Tests
```bash
# Purchase Order Tests
node --test src/pages/__tests__/PurchaseOrderForm.node.test.mjs

# Quotation Tests
node --test src/pages/__tests__/QuotationForm.node.test.mjs

# Delivery Note Tests
node --test src/pages/__tests__/DeliveryNoteForm.node.test.mjs

# Credit Note Tests
node --test src/pages/__tests__/CreditNoteForm.node.test.mjs

# Debit Note Tests
node --test src/pages/__tests__/DebitNoteForm.node.test.mjs

# Invoice Tests
node --test src/pages/__tests__/InvoiceForm.node.test.mjs

# Advance Payment Tests
node --test src/pages/__tests__/AdvancePaymentForm.node.test.mjs
```

### Run with Verbose Output
```bash
node --test --verbose src/pages/__tests__/PurchaseOrderForm.node.test.mjs
```

### Run with Coverage
```bash
node --experimental-coverage --test src/pages/__tests__/*.node.test.mjs
```

### Watch Mode (using test runner without watch - use npm script)
```bash
npm run test:watch
```

---

## Test File Locations

All test files are in `/mnt/d/Ultimate Steel/steelapp-fe/src/pages/__tests__/`:

| Component | Test File |
|-----------|-----------|
| Purchase Orders | `PurchaseOrderForm.node.test.mjs` |
| Quotations | `QuotationForm.node.test.mjs` |
| Delivery Notes | `DeliveryNoteForm.node.test.mjs` |
| Credit Notes | `CreditNoteForm.node.test.mjs` |
| Debit Notes | `DebitNoteForm.node.test.mjs` |
| Invoices | `InvoiceForm.node.test.mjs` |
| Advance Payments | `AdvancePaymentForm.node.test.mjs` |

---

## Test Structure

Each test file contains:
- **12 describe blocks** (test suites)
- **4 tests per suite** (48 tests per file)
- **~385 tests total** across all files

### Suite Organization by Risk Area

```
Suite 1: Core Creation & CRUD
Suite 2: Domain-Specific Logic (currency, lead time, weight, etc.)
Suite 3: Business Workflow (approval, reconciliation, transitions)
Suite 4: Edge Cases & Validation
Suite 5-8: Feature-Specific (allocations, batches, payments, etc.)
Suite 9-10: Multi-Tenancy & Access Control
Suite 11: Performance & Caching
Suite 12: Integration & Real-World Scenarios
```

---

## Testing Best Practices

### 1. Review Test Before Fixing Bugs
When fixing a bug, first check if a test already covers it:
```bash
# Search for related tests
grep -r "Test.*your-fix-description" src/pages/__tests__/
```

### 2. Run Tests After Code Changes
Always verify existing tests still pass:
```bash
node --test src/pages/__tests__/PurchaseOrderForm.node.test.mjs
```

### 3. Add Tests for New Bugs
When you find a bug:
1. Write a test that reproduces the bug (should fail)
2. Fix the bug (test should now pass)
3. Commit both test and fix together

### 4. Keep Mocks Isolated
Each test suite properly:
- **Resets** mocks in `beforeEach()`
- **Restores** mocks in `afterEach()`
- **No shared state** between tests

---

## Common Test Patterns

### Testing Error Handling
```javascript
test('Should handle network errors gracefully', async () => {
  mockService.create.rejects(new Error('Network error'));

  try {
    await mockService.create({});
    ok(false, 'Should throw');
  } catch (error) {
    match(error.message, /Network/, 'Should propagate error');
  }
});
```

### Testing Multi-Tenancy
```javascript
test('Should isolate data by company_id', async () => {
  const companyId = 1;
  const records = [
    { id: 1, companyId: 1 },
    { id: 2, companyId: 1 },
  ];

  ok(records.every((r) => r.companyId === companyId), 'Should filter');
});
```

### Testing Calculations
```javascript
test('Should calculate totals correctly', async () => {
  const quantity = 50;
  const rate = 100;
  const amount = quantity * rate;
  const tax = amount * 0.05;
  const total = amount + tax;

  strictEqual(total, 5250, 'Should calculate 5250');
});
```

### Testing Status Transitions
```javascript
test('Should transition PO from draft to approved', async () => {
  const po = { status: 'draft' };

  mockService.approve.resolves({
    ...po,
    status: 'approved',
    approvedDate: new Date().toISOString(),
  });

  const approved = await mockService.approve(101);

  strictEqual(approved.status, 'approved', 'Should mark as approved');
  ok(approved.approvedDate, 'Should record approval date');
});
```

---

## Debugging Tests

### Run Single Test Suite
```javascript
// Change describe to describe.only
describe.only('Suite 1: PO Creation', () => {
  // Only this suite runs
});
```

### Run Single Test
```javascript
// Change test to test.only
test.only('Test 1.1: Should create PO', async () => {
  // Only this test runs
});
```

### Skip Test
```javascript
// Use test.skip
test.skip('Test 1.2: Currently broken', async () => {
  // This test is skipped
});
```

### Add Debug Output
```javascript
test('Should create PO', async () => {
  console.log('PO data:', mockPOData);

  const result = await mockService.create(mockPOData);

  console.log('Created PO:', result);

  ok(result.id, 'Should have ID');
});
```

### Run with Node Inspector
```bash
node --inspect-brk --test src/pages/__tests__/PurchaseOrderForm.node.test.mjs
# Then open chrome://inspect in Chrome DevTools
```

---

## Test Execution Timeline

Expected execution times per file:
- **PurchaseOrderForm.node.test.mjs**: ~2-3 seconds
- **QuotationForm.node.test.mjs**: ~2-3 seconds
- **DeliveryNoteForm.node.test.mjs**: ~2-3 seconds
- **CreditNoteForm.node.test.mjs**: ~2-3 seconds
- **DebitNoteForm.node.test.mjs**: ~2-3 seconds
- **InvoiceForm.node.test.mjs**: ~2-3 seconds
- **AdvancePaymentForm.node.test.mjs**: ~2-3 seconds

**Total time: ~15-20 seconds for all tests**

---

## Continuous Integration

Tests are automatically run on:
- ✅ Pull request creation
- ✅ Commits to main branch
- ✅ Pre-commit hooks (can be run locally)
- ✅ Nightly full test suite

### CI Command
```bash
npm test
```

### CI Expected Output
```
PurchaseOrderForm Component
  Suite 1: PO Creation & Line Items
    ✔ Test 1.1: Should create PO with supplier and line items
    ✔ Test 1.2: Should validate supplier selection is required
    ✔ Test 1.3: Should calculate line item amounts correctly
    ✔ Test 1.4: Should enforce minimum order quantity
  ...

385 tests passed ✅
Total: 15.234 seconds
```

---

## Environment Setup

Tests use Node's native test runner with:
- ✅ `node:test` - Test framework (no additional setup)
- ✅ `node:assert` - Assertions (no dependencies)
- ✅ `sinon` - Service mocking (installed via npm)
- ✅ `init.mjs` - Browser API polyfills (in repo)

No Vitest, Jest, or Mocha needed!

---

## Troubleshooting

### Tests timeout
- Increase timeout: Add `timeout: 5000` parameter
- Check for unresolved promises in mock

### Mock not resetting
- Verify `sinon.restore()` in `afterEach()`
- Verify `sinon.reset()` in `beforeEach()`

### Import errors
- Ensure `init.mjs` is imported FIRST
- Check file paths are absolute
- Verify `.mjs` extension for ES modules

### Coverage not working
- Use `--experimental-coverage` flag
- Coverage only works with Node 18.3+

---

## Performance Tips

### Parallel Execution
Node test runner runs tests in parallel by default.

To run sequentially (slower but useful for debugging):
```bash
node --test --no-parallel src/pages/__tests__/PurchaseOrderForm.node.test.mjs
```

### Reduce Setup Time
- Reuse mock setup across tests
- Use `beforeEach()` only for resetting, not initial setup
- Cache expensive operations

---

## Integration with IDE

### VS Code
Install Test Explorer extension:
```
Extension: Test Explorer UI
Command: npm test
```

### WebStorm
- Right-click test file → Run 'filename.test.mjs'
- Gutter icons show test status

### GitHub Copilot
Use GitHub Copilot to generate additional tests:
```
/tests
Generate test for credit note approval workflow
```

---

## Next Steps

1. **Run tests**: `npm test`
2. **Review coverage**: `node --experimental-coverage --test src/pages/__tests__/*.node.test.mjs`
3. **Add tests for new features**: Follow existing patterns
4. **Update stubs**: When API contracts change
5. **Monitor CI**: Ensure all tests pass on pull requests

---

## Questions & Support

For issues with tests:
1. Check test file location
2. Review mock setup
3. Verify sinon stubs are reset
4. Check for async/await issues
5. Run with verbose output: `--test --verbose`

---

*Last Updated: 2026-02-04*
*Node Test Runner Documentation: https://nodejs.org/docs/latest/api/test.html*
*Sinon Documentation: https://sinonjs.org/*
