# Credit Note Smoke Tests - Mock Configuration Fix

## Problem
All 112 credit note smoke tests were failing with:
```
TypeError: Cannot read properties of undefined (reading 'mockResolvedValue')
```

## Root Cause
The `vi.mock()` calls were not providing factory functions that return mock objects. When tests tried to access methods like `creditNoteService.getNextCreditNoteNumber.mockResolvedValue`, the service was undefined.

## Solution Applied

### 1. CreditNoteForm.smoke.test.jsx
**Before:**
```javascript
vi.mock('../../services/creditNoteService');
vi.mock('../../services/invoiceService');
vi.mock('../../services/companyService');
vi.mock('../../services/notificationService');
```

**After:**
```javascript
vi.mock('../../services/creditNoteService', () => ({
  getNextCreditNoteNumber: vi.fn(),
  getCreditNote: vi.fn(),
  createCreditNote: vi.fn(),
  updateCreditNote: vi.fn(),
  getAllCreditNotes: vi.fn(),
  deleteCreditNote: vi.fn(),
  downloadPDF: vi.fn(),
}));

vi.mock('../../services/invoiceService', () => ({
  getInvoice: vi.fn(),
  searchForCreditNote: vi.fn(),
}));

vi.mock('../../services/companyService', () => ({
  getCompany: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));
```

### 2. CreditNoteList.smoke.test.jsx
**Before:**
```javascript
vi.mock('../../services/creditNoteService');
vi.mock('../../services/companyService');
vi.mock('../../services/notificationService');
```

**After:**
```javascript
vi.mock('../../services/creditNoteService', () => ({
  getAllCreditNotes: vi.fn(),
  getCreditNote: vi.fn(),
  deleteCreditNote: vi.fn(),
  downloadPDF: vi.fn(),
  getNextCreditNoteNumber: vi.fn(),
  createCreditNote: vi.fn(),
  updateCreditNote: vi.fn(),
}));

vi.mock('../../services/companyService', () => ({
  getCompany: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));
```

## Files Modified
1. `/mnt/d/Ultimate Steel/steelapp-fe/src/pages/__tests__/CreditNoteForm.smoke.test.jsx`
2. `/mnt/d/Ultimate Steel/steelapp-fe/src/pages/__tests__/CreditNoteList.smoke.test.jsx`

## Testing Instructions

**Run in PowerShell (not WSL):**

```powershell
# Navigate to project directory
cd "D:\Ultimate Steel\steelapp-fe"

# Run CreditNoteForm smoke tests
npm test -- CreditNoteForm.smoke.test.jsx --run

# Run CreditNoteList smoke tests
npm test -- CreditNoteList.smoke.test.jsx --run

# Run both together
npm test -- smoke.test.jsx --run
```

## Expected Outcome
- No more "Cannot read properties of undefined" errors
- All 112 tests should execute (they may pass or fail based on actual component behavior)
- Mock services should be properly initialized and callable

## Changes Preserved
- All existing test assertions remain intact
- Test structure unchanged
- Only mock configuration improved to follow Vitest best practices
