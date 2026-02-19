# PDF Generator Two-Layer Testing Implementation Guide

**Status:** Phase 5.4 - PDF Generator Completion
**Framework:** Node.js native (node:test) + Sinon for Layer 1, Vitest Browser/Playwright for Layer 2
**Target:** 100% test coverage for all 8 PDF generators

---

## Overview

This guide documents the two-layer testing strategy for PDF generators:

- **Layer 1 (Unit Tests):** Pure data transformation logic, no DOM/browser dependencies
- **Layer 2 (Browser Tests):** Actual PDF generation using jsPDF and html2canvas

---

## Pattern Established: quotationPdfGenerator

### ✅ Already Completed

1. **Source Refactoring** (`quotationPdfGenerator.js`):
   - ✅ Extracted `buildQuotationDocumentStructure()` - Layer 1 function
   - ✅ Updated `generateQuotationPDF()` - Layer 2 function
   - ✅ Modified `createQuotationElement()` to use pre-built structure

2. **Layer 1 Tests** (`quotationPdfBuilder.test.mjs`):
   - ✅ 30 comprehensive unit tests
   - ✅ All tests passing
   - ✅ Coverage: Company, Customer, Items, Calculations, Metadata

3. **Layer 2 Tests** (`quotationPdfGenerator.browser.test.mjs`):
   - ✅ 10 documented test cases
   - ✅ Setup instructions for Vitest, Playwright, Cypress
   - ✅ Implementation examples provided

---

## 8 PDF Generators - Refactoring Roadmap

### 1. quotationPdfGenerator ✅ COMPLETE
- **Files:** quotationPdfGenerator.js
- **Tests:**
  - Layer 1: quotationPdfBuilder.test.mjs (30 tests) ✅
  - Layer 2: quotationPdfGenerator.browser.test.mjs (10 tests, template)
- **Status:** READY FOR BROWSER TESTS

### 2. deliveryNotePdfGenerator ⏳ IN PROGRESS
- **Files:** deliveryNotePdfGenerator.js
- **Functions to extract:**
  - `buildDeliveryNoteDocumentStructure(deliveryNote, company)`
  - Focus on delivery quantities vs ordered, multiple addresses
- **Tests needed:**
  - Layer 1: deliveryNotePdfBuilder.test.mjs (25-35 tests)
  - Layer 2: deliveryNotePdfGenerator.browser.test.mjs (8-10 tests)
- **Key Data Points:** Delivery note #, Invoice #, Addresses, Delivery quantities, Shortages

### 3. paymentReceiptGenerator ⏳ PENDING
- **Functions to extract:**
  - `buildPaymentReceiptDocumentStructure(receipt, company)`
  - `buildPaymentReceiptPDFStructure(allReceipts, company)` (batch)
- **Tests needed:**
  - Layer 1: paymentReceiptPdfBuilder.test.mjs (25-30 tests)
  - Layer 2: paymentReceiptGenerator.browser.test.mjs (8-10 tests)
- **Key Data Points:** Receipt #, Payment amount, Reference, Receipt date

### 4. poPdfGenerator (Purchase Order) ⏳ PENDING
- **Functions to extract:**
  - `buildPurchaseOrderDocumentStructure(po, company)`
- **Tests needed:**
  - Layer 1: poPdfBuilder.test.mjs (30-35 tests)
  - Layer 2: poPdfGenerator.browser.test.mjs (8-10 tests)
- **Key Data Points:** PO #, Vendor, Items, Quantities, Amounts, Terms

### 5. configurablePdfGenerator ⏳ PENDING
- **Functions to extract:**
  - `buildConfigurableDocumentStructure(config, data, company)`
  - Generic document builder accepting custom configuration
- **Tests needed:**
  - Layer 1: configurablePdfBuilder.test.mjs (20-25 tests)
  - Layer 2: configurablePdfGenerator.browser.test.mjs (6-8 tests)
- **Key Data Points:** Template fields, Custom styles, Data binding

### 6. receiptTemplateGenerator ⏳ PENDING
- **Functions to extract:**
  - `buildReceiptTemplateStructure(receiptData)`
  - `generateReceiptHTML(structure)` (already separated - minimal refactoring)
  - `generateReceiptPreview(structure)`
- **Tests needed:**
  - Layer 1: receiptTemplateBuilder.test.mjs (15-20 tests)
  - Layer 2: receiptTemplateGenerator.browser.test.mjs (6-8 tests)
- **Key Data Points:** Receipt layout, HTML rendering, Preview generation

### 7. statementPdfGenerator ⏳ PENDING
- **Functions to extract:**
  - `buildStatementDocumentStructure(statement, company)`
- **Tests needed:**
  - Layer 1: statementPdfBuilder.test.mjs (25-30 tests)
  - Layer 2: statementPdfGenerator.browser.test.mjs (8-10 tests)
- **Key Data Points:** Customer name, Period, Invoices, Totals, Amounts

### 8. pdfGenerator (Deprecated) ⏳ PENDING
- **Note:** Marked as deprecated, kept for backward compatibility
- **Functions to extract:**
  - `buildInvoiceDocumentStructure(invoice, company)`
- **Tests needed:**
  - Layer 1: pdfGenerator.test.mjs (20-25 tests)
  - Layer 2: pdfGenerator.browser.test.mjs (6-8 tests)
- **Status:** Test for backward compatibility, note deprecation

---

## Test Count Summary

| Generator | Layer 1 Tests | Layer 2 Tests | Total |
|-----------|--------------|---------------|-------|
| quotation | 30 ✅ | 10 (template) | 40 |
| deliveryNote | 25-35 | 8-10 | 33-45 |
| paymentReceipt | 25-30 | 8-10 | 33-40 |
| purchaseOrder (po) | 30-35 | 8-10 | 38-45 |
| configurable | 20-25 | 6-8 | 26-33 |
| receiptTemplate | 15-20 | 6-8 | 21-28 |
| statement | 25-30 | 8-10 | 33-40 |
| pdfGenerator (deprecated) | 20-25 | 6-8 | 26-33 |
| **TOTAL** | **190-230** | **60-74** | **250-304** |

---

## Refactoring Pattern Template

### Step 1: Extract Builder Function

**Before:**
```javascript
export const generateQuotationPDF = async (quotation, company) => {
  // ... setup ...
  const el = createQuotationElement(quotation, company, logoUrl, sealUrl, templateColor);
  // ... render to PDF ...
};

const createQuotationElement = (q, company, logoCompany, sealImage, templateColor) => {
  // Data transformation mixed with HTML rendering
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  // ...
  el.innerHTML = `...`;
};
```

**After:**
```javascript
// Layer 1: Pure data transformation (testable)
export function buildQuotationDocumentStructure(quotation, company) {
  const q = quotation || {};
  const comp = company || {};

  const items = (q.items || []).map(it => ({
    name: it.name,
    amount: parseFloat(it.amount) || 0,
    vatRate: parseFloat(it.vatRate) || 0,
    // ... all fields ...
  }));

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const gstAmount = items.reduce((s, it) => s + (it.amount * it.vatRate / 100), 0);

  return {
    company: { /* structured data */ },
    customer: { /* structured data */ },
    items: items,
    calculations: { subtotal, gstAmount, total: subtotal + gstAmount },
    metadata: { /* flags */ }
  };
}

// Layer 2: Browser-dependent rendering
export const generateQuotationPDF = async (quotation, company) => {
  const docStructure = buildQuotationDocumentStructure(quotation, company);

  const { jsPDF } = await import("jspdf");
  const el = createQuotationElement(docStructure, logoUrl, sealUrl, templateColor);
  // ... render to PDF ...
};

const createQuotationElement = (docStructure, logoUrl, sealUrl, templateColor) => {
  el.innerHTML = `
    <p>${docStructure.company.name}</p>
    <p>${docStructure.calculations.subtotal}</p>
    <!-- Use pre-calculated values -->
  `;
};
```

### Step 2: Create Layer 1 Tests

**File:** `generatorNameBuilder.test.mjs`

```javascript
import { test, describe } from "node:test";
import assert from "node:assert";
import { buildQuotationDocumentStructure } from "../quotationPdfGenerator.js";

describe("buildQuotationDocumentStructure", () => {
  test("should calculate subtotal correctly", () => {
    const quotation = {
      items: [
        { amount: 1000 },
        { amount: 2000 }
      ]
    };

    const result = buildQuotationDocumentStructure(quotation, {});
    assert.strictEqual(result.calculations.subtotal, 3000);
  });
});
```

**Test Count Guide:**
- Company data transformation: 3-4 tests
- Document metadata: 2-3 tests
- Customer data: 2-3 tests
- Item transformation: 5-7 tests
- Calculations: 4-5 tests
- Metadata flags: 3-4 tests
- Totals and edge cases: 4-5 tests
- **Total: 25-35 tests per generator**

### Step 3: Create Layer 2 Tests

**File:** `generatorName.browser.test.mjs`

```javascript
describe("generateQuotationPDF (Browser Tests)", () => {
  // Use Vitest Browser Mode or Playwright

  test("should generate PDF file", async () => {
    // Playwright example:
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.evaluate(() => generateQuotationPDF(quotation, company))
    ]);
    expect(download.suggestedFilename()).toContain(".pdf");
  });
});
```

**Test Count Guide:**
- Basic PDF generation: 1 test
- PDF contains document number: 1 test
- PDF contains company info: 1 test
- PDF contains items: 1 test
- PDF contains totals: 1 test
- Missing images handling: 1 test
- Error handling: 1 test
- Multiple PDFs: 1 test
- Format validation: 1 test
- **Total: 8-10 tests per generator**

---

## Implementation Checklist

### For Each PDF Generator (8 total):

- [ ] Refactor source file to extract `build[Name]DocumentStructure()`
- [ ] Update `generate[Name]PDF()` to use builder
- [ ] Update element creation to use docStructure
- [ ] Create `[name]Builder.test.mjs` with 25-35 unit tests
- [ ] Create `[name].browser.test.mjs` with 8-10 browser test templates
- [ ] Verify Layer 1 tests pass: `node --test [name]Builder.test.mjs`
- [ ] Add to git commit with both test files
- [ ] Document any generator-specific logic in test file comments

### Testing Command:

```bash
# Run all Layer 1 tests
node --test 'src/utils/__tests__/*Builder.test.mjs'

# Expected: 250-304 tests passing in <10 seconds

# Run Layer 2 tests (requires browser setup)
npm run test:browser -- '**/PDF*.browser.test.mjs'
```

---

## Current Status Summary

✅ **Completed:**
- Quotation PDF: Refactored + 30 Layer 1 tests passing
- Pattern established and documented

⏳ **Next Steps:**
1. Refactor deliveryNotePdfGenerator (~2 hours)
2. Refactor paymentReceiptGenerator (~2 hours)
3. Refactor poPdfGenerator (~2 hours)
4. Refactor remaining 4 generators (~6 hours)
5. Implement Layer 2 browser tests with Vitest/Playwright (~4 hours)
6. **Total estimated: 16-20 hours for complete Phase 5.4 PDF coverage**

---

## Browser Test Setup Instructions

### Option A: Vitest Browser Mode (Recommended)

```bash
npm install -D @vitest/browser chromium

# Update vitest.config.js
export default {
  test: {
    browser: {
      provider: 'playwright',
      enabled: true,
      name: 'chromium'
    }
  }
}

# Run browser tests
npm run test:browser
```

### Option B: Playwright (For CI/CD)

```bash
npm install -D @playwright/test

# Create playwright.config.ts and convert tests

# Run
npx playwright test
```

### Option C: Cypress (For Visual Debugging)

```bash
npm install -D cypress

npx cypress open
```

---

## Success Criteria

✅ **Phase 5.4 PDF Generators will be 100% complete when:**

1. All 8 generators have `build[Name]DocumentStructure()` extracted
2. All 8 generators have Layer 1 unit tests (250-304 tests total)
3. All 8 generators have Layer 2 browser test templates
4. Layer 1 tests: 100% passing
5. Layer 2 tests: Runnable in Vitest/Playwright/Cypress
6. Refactoring pattern documented and reproducible
7. All files committed to git with clear commit messages
8. Total test count: 250-304 for Layer 1 + 60-74 for Layer 2

---

**Created:** 2026-02-05
**Target Completion:** Same session (estimated 16-20 hours implementation)
**Status:** Pattern established, proceeding with remaining generators
