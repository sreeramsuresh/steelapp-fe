# Invoice Actions Debug & Test Implementation Guide

## Overview

This implementation adds **fail-safe debugging mechanisms** and **automated tests** to catch schema drift and logic inconsistencies in invoice action icons early—during development, not in production.

**Zero Production Impact:** All debug logging and invariant checks are guarded by `process.env.NODE_ENV !== 'production'`.

---

## What Was Implemented

### A. DEV-ONLY DEBUG LOGGING ✅

**Files Modified:**
- `/src/pages/InvoiceList.jsx` (added 3 helper functions)

**What It Does:**
When running in development mode (`npm start`), the console automatically logs:

1. **INVOICE_DEBUG** - Complete snapshot of each invoice's state:
   ```javascript
   {
     id, invoiceNumber, status, paymentStatus,
     isDeleted, balanceDue, outstanding,
     promiseDate, dueDate, salesAgentId,
     hasDeliveryNotes, deliveryNotesCount,
     permissions: { canUpdate, canDelete, ... }
   }
   ```

2. **ACTION_CONFIG_DEBUG** - Computed actions for each icon:
   ```javascript
   {
     edit: { enabled: true/false, ... },
     creditNote: { enabled: true/false, ... },
     // ... all 11 action icons
   }
   ```

**How to Use:**
1. Run `npm start`
2. Navigate to Invoice List page
3. Open browser console (F12)
4. Filter by `INVOICE_DEBUG` or `ACTION_CONFIG_DEBUG`
5. Click on any log entry to inspect invoice state and action configuration

---

### B. STRICT ENUMS / TYPES ✅

**Files Created:**
- `/src/utils/invoiceTypes.js` (NEW)

**Files Modified:**
- `/src/utils/invoiceStatus.js`

**What It Does:**
Prevents silent schema drift by:

1. **Defining strict allowed values:**
   - `InvoiceStatus`: 'draft' | 'proforma' | 'issued' | 'sent' | 'cancelled'
   - `PaymentStatus`: 'unpaid' | 'partially_paid' | 'paid' | 'fully_paid'

2. **Exhaustive switch statements:**
   All status-based logic now uses exhaustive switches with explicit default cases that log errors.

3. **Runtime validation (dev-only):**
   ```javascript
   assertValidInvoiceStatus(status, 'getInvoiceStatusBadge');
   assertValidPaymentStatus(paymentStatus, 'shouldShowReminder');
   ```

**What You'll See:**
If a new status appears that's not in the enum, you'll see:
```
SCHEMA_MISMATCH[INVOICE_STATUS]: Unknown invoice status 'new_status' in getInvoiceStatusBadge
{
  receivedStatus: "new_status",
  allowedStatuses: ["draft", "proforma", "issued", "sent", "cancelled"],
  context: "getInvoiceStatusBadge",
  timestamp: "2025-01-19T..."
}
```

---

### C. DEV-ONLY INVARIANT GUARDS ✅

**Files Modified:**
- `/src/pages/InvoiceList.jsx` (added assertion functions)

**What It Does:**
Validates business rules from the spec for these critical icons:

1. **Edit Icon:**
   - ❌ Must NOT be enabled for issued invoices
   - ❌ Must NOT be enabled for deleted invoices

2. **Credit Note Icon:**
   - ✅ Must ONLY be enabled for issued invoices
   - ❌ Must NOT be enabled for deleted invoices

3. **Commission Icon:**
   - ✅ Must ONLY be enabled for paid invoices
   - ✅ Must have salesAgentId assigned
   - ❌ Must NOT be enabled for deleted invoices

4. **Reminder Icon:**
   - ✅ Must ONLY be enabled for issued invoices
   - ✅ Must ONLY be enabled for unpaid/partially_paid invoices

5. **Delivery Note Icon:**
   - ✅ Must ONLY be enabled for issued invoices

6. **Payment Consistency:**
   - ❌ Paid invoices should NOT have positive balanceDue
   - ❌ Unpaid invoices should NOT have zero balanceDue
   - ❌ Partially paid should have 0 < balanceDue < total

**What You'll See:**
If an icon is enabled when it shouldn't be:
```
SCHEMA_MISMATCH[ICON:COMMISSION]: Commission enabled for non-paid invoice
{
  invoiceId: 123,
  invoiceNumber: "INV-123",
  paymentStatus: "unpaid"
}
```

---

### D. AUTOMATED TESTS ✅

**Files Created:**
- `/src/pages/__tests__/InvoiceList.actions.test.js` (NEW)

**What It Tests:**
All 6 high-priority test cases from the spec:

| Test Case | Invoice State | Validates |
|-----------|--------------|-----------|
| TC-001 | Draft, unpaid, no delete | 4 enabled, 6 disabled icons |
| TC-002 | Issued, unpaid, all perms | 9 enabled, 2 disabled icons |
| TC-003 | Issued, paid, has agent | Commission enabled, reminder disabled |
| TC-004 | Deleted, all perms | Only view & restore enabled |
| TC-005 | Proforma, all perms | Edit enabled, credit note disabled |
| TC-006 | Issued, partially paid, overdue | Reminder enabled, commission disabled |

**How to Run:**
```bash
# Run all tests
npm test

# Run only invoice action tests
npm test InvoiceList.actions.test

# Run with coverage
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch
```

**Expected Output:**
```
PASS  src/pages/__tests__/InvoiceList.actions.test.js
  InvoiceList - Action Icons (Test Matrix TC-001 to TC-006)
    ✓ TC-001: Draft, unpaid, no delete → correct icon enabled/disabled matrix (5ms)
    ✓ TC-002: Issued, unpaid, all perms → correct icon enabled/disabled matrix (3ms)
    ✓ TC-003: Issued, paid, has agent → correct icon enabled/disabled matrix (2ms)
    ✓ TC-004: Deleted, all perms → correct icon enabled/disabled matrix (2ms)
    ✓ TC-005: Proforma, all perms → correct icon enabled/disabled matrix (3ms)
    ✓ TC-006: Issued, partially paid, 5 days overdue → correct icon enabled/disabled matrix (3ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## File Summary

### Files Created (2)
1. **`/src/utils/invoiceTypes.js`**
   - Type definitions and validation functions
   - Exported: `assertValidInvoiceStatus`, `assertValidPaymentStatus`
   - Size: ~150 lines

2. **`/src/pages/__tests__/InvoiceList.actions.test.js`**
   - 6 comprehensive test cases
   - Validates icon enable/disable matrix from spec
   - Size: ~460 lines

### Files Modified (2)
1. **`/src/utils/invoiceStatus.js`**
   - Added import of type validators
   - Updated 3 functions with exhaustive switches:
     - `getInvoiceStatusBadge()`
     - `getPaymentStatusBadge()`
     - `shouldShowReminder()`

2. **`/src/pages/InvoiceList.jsx`**
   - Added 3 debug/invariant helper functions (lines 47-262):
     - `debugInvoiceRow()`
     - `assertIconInvariants()`
     - `assertPaymentConsistency()`
   - Updated `getActionButtonConfig()` to call helpers (lines 1199-1203, 1308-1315)

---

## How It Works

### Development Mode (NODE_ENV !== 'production')

**When you run `npm start`:**

1. **On Page Load:**
   - Every invoice in the list triggers `debugInvoiceRow()` → logs full state
   - `assertPaymentConsistency()` validates payment state
   - `getActionButtonConfig()` computes actions → logs `ACTION_CONFIG_DEBUG`
   - `assertIconInvariants()` validates each icon's enable state

2. **Type Validation:**
   - Every status value is checked against allowed enums
   - Invalid statuses trigger `SCHEMA_MISMATCH[STATUS]` errors

3. **Console Output:**
   ```
   INVOICE_DEBUG { id: 1, status: "draft", ... }
   ACTION_CONFIG_DEBUG 1 { edit: {...}, creditNote: {...}, ... }
   ```

### Production Mode (NODE_ENV === 'production')

**When you run `npm run build` and deploy:**

- **ZERO overhead** - All debug functions return immediately
- **ZERO console logs** - All `console.log` and `console.error` calls skipped
- **ZERO performance impact** - Guards checked at function entry
- **Identical behavior** - Business logic unchanged

---

## Debugging Workflow

### Scenario 1: Icon Misbehaving

**Problem:** "The commission icon is showing up when the invoice is unpaid!"

**Debug Steps:**
1. Run `npm start`
2. Open Invoice List
3. Open console (F12)
4. Filter logs: `ACTION_CONFIG_DEBUG`
5. Find the invoice ID showing wrong commission icon
6. Look for `SCHEMA_MISMATCH[ICON:COMMISSION]` error
7. Error shows exact invoice state that violated the rule

**Example Console Output:**
```javascript
SCHEMA_MISMATCH[ICON:COMMISSION]: Commission enabled for non-paid invoice
{
  invoiceId: 42,
  invoiceNumber: "INV-042",
  paymentStatus: "unpaid"  // ← Found the problem!
}
```

### Scenario 2: Payment Status Inconsistency

**Problem:** "Invoice shows as paid but still has a balance due!"

**Debug Steps:**
1. Run `npm start`
2. Navigate to the problematic invoice
3. Check console for `SCHEMA_MISMATCH[PAYMENT]` error
4. Error shows the exact inconsistency

**Example Console Output:**
```javascript
SCHEMA_MISMATCH[PAYMENT]: Paid invoice has positive balanceDue
{
  invoiceId: 99,
  invoiceNumber: "INV-099",
  paymentStatus: "paid",
  balanceDue: 150.00,  // ← Should be 0!
  outstanding: 150.00
}
```

### Scenario 3: New Status Introduced

**Problem:** Backend adds a new status "pending_approval" but frontend doesn't know about it.

**What Happens:**
```javascript
SCHEMA_MISMATCH[INVOICE_STATUS]: Unknown invoice status 'pending_approval' in getInvoiceStatusBadge
{
  receivedStatus: "pending_approval",
  allowedStatuses: ["draft", "proforma", "issued", "sent", "cancelled"],
  context: "getInvoiceStatusBadge",
  timestamp: "2025-01-19T12:34:56.789Z"
}
```

**Fix:**
1. Add to `/src/utils/invoiceTypes.js`:
   ```javascript
   export const VALID_INVOICE_STATUSES = [
     'draft', 'proforma', 'issued', 'sent', 'cancelled',
     'pending_approval'  // ← Add new status
   ];
   ```

2. Add to switch statements in `/src/utils/invoiceStatus.js`:
   ```javascript
   case 'pending_approval':
     config = INVOICE_STATUS_CONFIG.pending_approval;
     break;
   ```

---

## Testing Workflow

### Run Tests Before Commit

```bash
# Run all tests
npm test

# Run only action icon tests
npm test InvoiceList.actions

# If all pass:
✓ TC-001: Draft, unpaid, no delete → ✅
✓ TC-002: Issued, unpaid, all perms → ✅
✓ TC-003: Issued, paid, has agent → ✅
✓ TC-004: Deleted, all perms → ✅
✓ TC-005: Proforma, all perms → ✅
✓ TC-006: Issued, partially paid, overdue → ✅
```

### Add to CI/CD Pipeline

Add to `.github/workflows/test.yml` (or equivalent):
```yaml
- name: Run Tests
  run: npm test
```

Tests will fail if icon logic deviates from spec.

---

## Maintenance

### When to Update Tests

**Scenario: Business rule changes**
- Example: "Credit notes should now be available for draft invoices too"
- Action: Update test expectations in TC-001 and TC-005
- Update `getActionButtonConfig` logic
- Update invariant checks in `assertIconInvariants`

### When to Update Type Enums

**Scenario: New invoice status added**
- Add to `VALID_INVOICE_STATUSES` in `invoiceTypes.js`
- Add case to all switch statements
- Add test case if behavior differs significantly

---

## Benefits

### For You (Non-Professional Coder)
- ✅ **Clear error messages** - Console tells you exactly what's wrong
- ✅ **Self-documenting** - SCHEMA_MISMATCH logs explain the issue
- ✅ **No manual debugging** - Automatic validation on every page load
- ✅ **Test coverage** - Run `npm test` to verify everything works

### For The Project
- ✅ **Early detection** - Catch issues in dev, not production
- ✅ **Regression prevention** - Tests catch breaking changes
- ✅ **Schema enforcement** - New statuses can't slip in silently
- ✅ **Documentation** - Test cases serve as living spec

### For Production
- ✅ **Zero overhead** - No performance impact
- ✅ **Zero logs** - No console pollution
- ✅ **Identical behavior** - Business logic unchanged
- ✅ **Safe** - Can't break production even if bugs in debug code

---

## Quick Reference

### Console Log Filters

| Filter | Shows |
|--------|-------|
| `INVOICE_DEBUG` | Full invoice state snapshots |
| `ACTION_CONFIG_DEBUG` | Computed action icon states |
| `SCHEMA_MISMATCH[ICON:` | Icon rule violations |
| `SCHEMA_MISMATCH[PAYMENT]` | Payment consistency issues |
| `SCHEMA_MISMATCH[STATUS]` | Unknown status values |

### Test Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test InvoiceList.actions` | Run action icon tests only |
| `npm test -- --coverage` | Run with coverage report |
| `npm test -- --watch` | Auto-rerun on file changes |

### Key Files

| File | Purpose |
|------|---------|
| `invoiceTypes.js` | Type definitions & validators |
| `InvoiceList.jsx` | Debug helpers & invariants |
| `invoiceStatus.js` | Exhaustive switches |
| `InvoiceList.actions.test.js` | 6 comprehensive tests |

---

## Summary

✅ **A. Debug Logging** - Console shows full invoice state in dev
✅ **B. Strict Types** - Unknown statuses caught immediately
✅ **C. Invariant Guards** - Business rules validated automatically
✅ **D. Automated Tests** - 6 test cases enforce spec compliance

**Result:** Schema drift and logic bugs are caught early in development, making debugging trivial and preventing production issues.
