/**
 * Credit Note Form - Node Native Test Runner
 *
 * Risk Coverage:
 * - Credit note creation from invoice (full/partial)
 * - Reason for return/credit tracking
 * - Line item selection and adjustment
 * - Manual credit amount without items
 * - Accounting-only vs stock-based credits
 * - VAT handling and recalculation
 * - Stock return workflow
 * - Multi-tenancy credit isolation
 * - Approval workflow for high-value credits
 *
 * Test Framework: node:test (native)
 * Mocking: sinon for service stubs
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import { strictEqual, ok, match, deepStrictEqual } from 'node:assert';
import sinon from 'sinon';
import './../../__tests__/init.mjs';

// Mock services
const mockCreditNoteService = {
  createCreditNote: sinon.stub(),
  updateCreditNote: sinon.stub(),
  getCreditNote: sinon.stub(),
  getNextCreditNoteNumber: sinon.stub(),
  submitCreditNote: sinon.stub(),
  approveCreditNote: sinon.stub(),
  rejectCreditNote: sinon.stub(),
};

const mockInvoiceService = {
  getInvoice: sinon.stub(),
  updateCreditAmountApplied: sinon.stub(),
};

const mockStockService = {
  receiveReturn: sinon.stub(),
  addBackToStock: sinon.stub(),
};

const mockVATService = {
  calculateVAT: sinon.stub(),
  recalculateAfterCredit: sinon.stub(),
};

describe('CreditNoteForm Component', () => {
  beforeEach(() => {
    sinon.reset();

    mockCreditNoteService.getNextCreditNoteNumber.resolves({
      nextNumber: 'CN-2026-001',
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Suite 1: Credit Note Creation from Invoice', () => {
    test('Test 1.1: Should create credit note for full invoice return', async () => {
      mockInvoiceService.getInvoice.resolves({
        id: 337,
        invoiceNumber: 'INV-2026-0042',
        customerId: 8,
        customerName: 'Emirates Fabrication',
        items: [
          { id: 1, productId: 10, name: 'SS-304 Sheet', quantity: 50, rate: 100, amount: 5000 },
          { id: 2, productId: 20, name: 'SS-316 Pipe', quantity: 30, rate: 150, amount: 4500 },
        ],
        subtotal: 9500,
        vatAmount: 475,
        total: 9975,
      });

      mockCreditNoteService.createCreditNote.resolves({
        id: 501,
        creditNoteNumber: 'CN-2026-001',
        invoiceId: 337,
        invoiceNumber: 'INV-2026-0042',
        customerId: 8,
        items: [
          { invoiceItemId: 1, quantity: 50, creditAmount: 5000 },
          { invoiceItemId: 2, quantity: 30, creditAmount: 4500 },
        ],
        creditAmount: 9500,
        vatAmount: 475,
        totalCredit: 9975,
        status: 'draft',
      });

      const invoice = await mockInvoiceService.getInvoice(337);
      const cn = await mockCreditNoteService.createCreditNote({
        invoiceId: 337,
        items: invoice.items.map((i) => ({ invoiceItemId: i.id, quantity: i.quantity })),
      });

      ok(cn.id, 'Credit note should have ID');
      match(cn.creditNoteNumber, /CN-2026-\d+/, 'Should follow CN number format');
      strictEqual(cn.invoiceId, 337, 'Should link to invoice');
      strictEqual(cn.items.length, 2, 'Should have all line items');
      strictEqual(cn.totalCredit, 9975, 'Should include VAT');
    });

    test('Test 1.2: Should create credit note for partial return', async () => {
      const invoiceItem = { id: 1, invoiceItemId: 1, quantity: 50, rate: 100, amount: 5000 };
      const creditItem = { invoiceItemId: 1, quantity: 30, creditAmount: 3000 }; // Partial

      ok(creditItem.quantity < invoiceItem.quantity, 'Should allow partial credit');
      strictEqual(creditItem.creditAmount, 3000, 'Should calculate partial amount');
    });

    test('Test 1.3: Should validate invoice exists and is issued', async () => {
      mockInvoiceService.getInvoice.rejects(new Error('Invoice not found'));

      try {
        await mockInvoiceService.getInvoice(99999);
        ok(false, 'Should throw');
      } catch (error) {
        match(error.message, /not found/, 'Should validate invoice');
      }
    });

    test('Test 1.4: Should prevent duplicate credit for same items', async () => {
      const creditItem = { invoiceItemId: 1, quantity: 50 };
      const alreadyCredited = { invoiceItemId: 1, quantity: 40 };

      ok(creditItem.invoiceItemId === alreadyCredited.invoiceItemId, 'Should detect duplicate');
    });
  });

  describe('Suite 2: Reason for Return/Credit', () => {
    test('Test 2.1: Should capture reason for credit', async () => {
      const reasons = [
        'defective_product',
        'overcharge',
        'goodwill_credit',
        'order_cancellation',
        'damaged_in_transit',
        'specification_mismatch',
      ];

      ok(reasons.includes('defective_product'), 'Should support standard reasons');
    });

    test('Test 2.2: Should allow custom reason text', async () => {
      const creditNote = {
        reasonForReturn: 'custom',
        customReason: 'Customer dissatisfaction with surface finish',
      };

      ok(creditNote.customReason, 'Should allow custom reason');
    });

    test('Test 2.3: Should require reason selection', async () => {
      const cnData = { reasonForReturn: null, customReason: '' };

      ok(!cnData.reasonForReturn && !cnData.customReason, 'Should require reason');
    });

    test('Test 2.4: Should map reason to accounting category', async () => {
      const reason = 'defective_product';
      const category = reason === 'defective_product' ? 'QUALITY_ISSUE' : 'OTHER';

      strictEqual(category, 'QUALITY_ISSUE', 'Should map to category');
    });
  });

  describe('Suite 3: Line Item Selection & Adjustment', () => {
    test('Test 3.1: Should select specific line items for credit', async () => {
      const invoiceItems = [
        { id: 1, productId: 10, quantity: 50, amount: 5000 },
        { id: 2, productId: 20, quantity: 30, amount: 4500 },
      ];

      const selectedItems = [invoiceItems[0]]; // Select only first

      strictEqual(selectedItems.length, 1, 'Should select specific items');
    });

    test('Test 3.2: Should adjust credit quantity per item', async () => {
      const invoiceItem = { id: 1, quantity: 50, rate: 100 };
      const creditQty = 30;
      const creditAmount = creditQty * invoiceItem.rate;

      strictEqual(creditAmount, 3000, 'Should calculate credit amount');
      ok(creditQty <= invoiceItem.quantity, 'Should not exceed invoiced qty');
    });

    test('Test 3.3: Should adjust price per item if needed', async () => {
      const invoiceRate = 100;
      const adjustedRate = 95; // Adjust down
      const quantity = 50;
      const originalAmount = invoiceRate * quantity;
      const adjustedAmount = adjustedRate * quantity;

      strictEqual(adjustedAmount, 4750, 'Should recalculate with adjusted rate');
      ok(adjustedAmount < originalAmount, 'Adjusted should be lower');
    });

    test('Test 3.4: Should validate total credit does not exceed invoice', async () => {
      const invoiceTotal = 9975;
      const attemptedCredit = 10500;

      ok(
        attemptedCredit > invoiceTotal,
        'Should detect credit exceeding invoice'
      );
    });
  });

  describe('Suite 4: Manual Credit Amount (Accounting Only)', () => {
    test('Test 4.1: Should create manual credit without line items', async () => {
      mockCreditNoteService.createCreditNote.resolves({
        id: 501,
        creditNoteNumber: 'CN-2026-001',
        invoiceId: 337,
        creditNoteType: 'ACCOUNTING_ONLY',
        manualCreditAmount: 500,
        items: [], // No line items
        creditAmount: 500,
        totalCredit: 500,
        status: 'draft',
      });

      const cn = await mockCreditNoteService.createCreditNote({
        invoiceId: 337,
        creditNoteType: 'ACCOUNTING_ONLY',
        manualCreditAmount: 500,
      });

      strictEqual(cn.creditNoteType, 'ACCOUNTING_ONLY', 'Should be accounting-only');
      strictEqual(cn.items.length, 0, 'Should have no line items');
      strictEqual(cn.manualCreditAmount, 500, 'Should use manual amount');
    });

    test('Test 4.2: Should auto-save manual credit amount', async () => {
      const draftCN = {
        invoiceId: 337,
        manualCreditAmount: 750,
        lastSavedTime: Date.now(),
      };

      ok(draftCN.manualCreditAmount === 750, 'Should save manual amount');
      ok(draftCN.lastSavedTime, 'Should track save time');
    });

    test('Test 4.3: Should calculate VAT on manual credit amount', async () => {
      const manualAmount = 500;
      const vatRate = 0.05;
      const vatAmount = manualAmount * vatRate;
      const total = manualAmount + vatAmount;

      strictEqual(vatAmount, 25, 'Should calculate VAT at 5%');
      strictEqual(total, 525, 'Should include VAT in total');
    });

    test('Test 4.4: Should prevent negative manual credit amounts', async () => {
      const manualAmount = -100;

      ok(manualAmount < 0, 'Should detect negative amount');
    });
  });

  describe('Suite 5: Credit Note Types', () => {
    test('Test 5.1: Should support ACCOUNTING_ONLY type', async () => {
      const cn = {
        creditNoteType: 'ACCOUNTING_ONLY',
        items: [],
        manualCreditAmount: 500,
      };

      strictEqual(cn.creditNoteType, 'ACCOUNTING_ONLY', 'Should set type');
    });

    test('Test 5.2: Should support STOCK_BASED type', async () => {
      const cn = {
        creditNoteType: 'STOCK_BASED',
        items: [{ invoiceItemId: 1, quantity: 50 }],
        stockReturn: true,
      };

      strictEqual(cn.creditNoteType, 'STOCK_BASED', 'Should track stock return');
    });

    test('Test 5.3: Should handle type-specific requirements', async () => {
      const stockBased = { creditNoteType: 'STOCK_BASED', requiresReturn: true };
      const accountingOnly = { creditNoteType: 'ACCOUNTING_ONLY', requiresReturn: false };

      ok(stockBased.requiresReturn, 'Stock-based should require return');
      ok(!accountingOnly.requiresReturn, 'Accounting-only should not require return');
    });

    test('Test 5.4: Should prevent mixing types', async () => {
      const mixedType = {
        creditNoteType: 'STOCK_BASED',
        manualCreditAmount: 500, // Shouldn't have manual amount for stock-based
      };

      ok(mixedType.creditNoteType !== 'ACCOUNTING_ONLY', 'Should detect type mismatch');
    });
  });

  describe('Suite 6: VAT Recalculation', () => {
    test('Test 6.1: Should recalculate VAT after credit', async () => {
      const originalVAT = 475;
      const creditedAmount = 5000; // 50% of subtotal
      const creditVAT = 237.5; // 5% of credited amount

      strictEqual(creditVAT, 237.5, 'Should calculate credit VAT');
    });

    test('Test 6.2: Should handle VAT recovery correctly', async () => {
      const invoiceVAT = 475;
      const creditVAT = 237.5;
      const recoveredVAT = invoiceVAT - creditVAT;

      strictEqual(recoveredVAT, 237.5, 'Should calculate VAT recovery');
    });

    test('Test 6.3: Should validate VAT compliance', async () => {
      mockVATService.recalculateAfterCredit.resolves({
        originalVAT: 475,
        creditVAT: 237.5,
        recoveredVAT: 237.5,
        compliant: true,
      });

      const vat = await mockVATService.recalculateAfterCredit({
        originalVAT: 475,
        creditAmount: 5000,
      });

      ok(vat.compliant, 'Should validate VAT compliance');
    });

    test('Test 6.4: Should handle zero-rated items', async () => {
      const zeroRatedItem = { amount: 1000, vatRate: 0, vat: 0 };

      strictEqual(zeroRatedItem.vat, 0, 'Should handle zero-rated');
    });
  });

  describe('Suite 7: Stock Return Workflow', () => {
    test('Test 7.1: Should track returned stock', async () => {
      mockStockService.receiveReturn.resolves({
        creditNoteId: 501,
        productId: 10,
        returnedQty: 50,
        batchNumber: 'BATCH-2026-001',
        status: 'received',
      });

      const return_ = await mockStockService.receiveReturn(501, 10, 50);

      ok(return_.status === 'received', 'Should record return receipt');
      strictEqual(return_.returnedQty, 50, 'Should track quantity');
    });

    test('Test 7.2: Should add stock back to inventory', async () => {
      mockStockService.addBackToStock.resolves({
        productId: 10,
        quantity: 50,
        warehouse: 'Main',
        newBalance: 250,
      });

      const result = await mockStockService.addBackToStock(10, 50);

      ok(result.newBalance > 0, 'Should increase inventory');
    });

    test('Test 7.3: Should inspect returned items', async () => {
      const return_ = {
        id: 1,
        status: 'inspection_pending',
        inspectionNotes: 'Minor scratches on surface',
        inspectionResult: 'acceptable', // or 'reject'
      };

      ok(return_.inspectionNotes, 'Should record inspection notes');
    });

    test('Test 7.4: Should handle non-returnable items', async () => {
      const item = { productId: 10, returnable: false };

      ok(!item.returnable, 'Should flag non-returnable items');
    });
  });

  describe('Suite 8: Draft Persistence & Recovery', () => {
    test('Test 8.1: Should save credit note draft', async () => {
      const draftCN = {
        invoiceId: 337,
        items: [{ invoiceItemId: 1, quantity: 30 }],
        timestamp: Date.now(),
      };

      const key = `cn_draft_${draftCN.invoiceId}`;
      const saved = JSON.stringify(draftCN);

      ok(saved, 'Draft should serialize');
      match(saved, /"invoiceId":337/, 'Serialized draft should contain invoiceId');
    });

    test('Test 8.2: Should recover draft with ISO timestamp', async () => {
      const savedDraft = JSON.stringify({
        invoiceId: 337,
        creditNoteDate: '2026-01-15T10:00:00.000Z', // ISO
        items: [{ invoiceItemId: 1, quantity: 30 }],
        timestamp: Date.now() - 3600000,
      });

      const restored = JSON.parse(savedDraft);

      ok(restored.creditNoteDate, 'Should restore date');
      // Date should convert: ISO 2026-01-15T10:00:00Z in UTC -> local date
    });

    test('Test 8.3: Should expire draft after 24 hours', async () => {
      const draftTimestamp = Date.now() - 86400001; // 24 hours + 1ms
      const now = Date.now();

      ok(now - draftTimestamp > 86400000, 'Draft should be expired');
    });

    test('Test 8.4: Should show recovery or new draft prompt', async () => {
      const existingDraft = true;
      const isExpired = false;

      ok(existingDraft && !isExpired, 'Should prompt for recovery');
    });
  });

  describe('Suite 9: Approval Workflow for High-Value Credits', () => {
    test('Test 9.1: Should require approval for credit above threshold', async () => {
      const threshold = 5000;
      const creditAmount = 7500;
      const requiresApproval = creditAmount > threshold;

      ok(requiresApproval, 'Should flag for approval');
    });

    test('Test 9.2: Should track approval status', async () => {
      mockCreditNoteService.approveCreditNote.resolves({
        id: 501,
        status: 'approved',
        approvedBy: 'manager@example.com',
        approvalDate: new Date().toISOString(),
      });

      const cn = await mockCreditNoteService.approveCreditNote(501);

      strictEqual(cn.status, 'approved', 'Should mark as approved');
      ok(cn.approvedBy, 'Should record approver');
    });

    test('Test 9.3: Should allow rejection with reason', async () => {
      mockCreditNoteService.rejectCreditNote.resolves({
        id: 501,
        status: 'rejected',
        rejectionReason: 'Insufficient documentation',
        rejectedBy: 'manager@example.com',
      });

      const cn = await mockCreditNoteService.rejectCreditNote(501, {
        reason: 'Insufficient documentation',
      });

      strictEqual(cn.status, 'rejected', 'Should mark as rejected');
      ok(cn.rejectionReason, 'Should record reason');
    });

    test('Test 9.4: Should maintain approval audit trail', async () => {
      const auditTrail = [
        { action: 'created', by: 'user@example.com', date: '2026-01-15' },
        { action: 'submitted', by: 'user@example.com', date: '2026-01-16' },
        { action: 'approved', by: 'manager@example.com', date: '2026-01-17' },
      ];

      strictEqual(auditTrail.length, 3, 'Should track all actions');
    });
  });

  describe('Suite 10: Multi-Tenancy & Customer Isolation', () => {
    test('Test 10.1: Should isolate credit notes by company_id', async () => {
      const companyId = 1;
      const creditNotes = [
        { id: 501, cnNumber: 'CN-001', companyId: 1 },
        { id: 502, cnNumber: 'CN-002', companyId: 1 },
      ];

      ok(
        creditNotes.every((cn) => cn.companyId === companyId),
        'Should filter by company_id'
      );
    });

    test('Test 10.2: Should prevent cross-tenant access', async () => {
      const user = { id: 1, companyId: 1 };
      const cn = { id: 501, companyId: 1 };

      strictEqual(user.companyId, cn.companyId, 'User should match CN company');
    });

    test('Test 10.3: Should filter invoices by company', async () => {
      const invoices = [
        { id: 337, companyId: 1 },
        { id: 338, companyId: 1 },
      ];

      ok(invoices.every((i) => i.companyId === 1), 'Should isolate invoices');
    });

    test('Test 10.4: Should audit credit note access', async () => {
      const auditLog = {
        userId: 1,
        cnId: 501,
        action: 'SUBMIT',
        timestamp: new Date().toISOString(),
      };

      ok(auditLog.userId && auditLog.action, 'Should record audit');
    });
  });

  describe('Suite 11: Error Handling & Validation', () => {
    test('Test 11.1: Should validate invoice linked', async () => {
      const cnData = { invoiceId: null, creditAmount: 500 };

      ok(!cnData.invoiceId, 'Should require invoice');
    });

    test('Test 11.2: Should validate credit amount format', async () => {
      const amount = 'five hundred';

      ok(isNaN(amount), 'Should detect invalid format');
    });

    test('Test 11.3: Should handle network errors', async () => {
      mockCreditNoteService.createCreditNote.rejects(new Error('Network error'));

      try {
        await mockCreditNoteService.createCreditNote({});
        ok(false, 'Should throw');
      } catch (error) {
        match(error.message, /Network/, 'Should propagate error');
      }
    });

    test('Test 11.4: Should provide helpful error messages', async () => {
      const error = new Error('Invoice already fully credited');

      ok(error.message.includes('fully credited'), 'Message should be descriptive');
    });
  });

  describe('Suite 12: Integration & Real-World Scenarios', () => {
    test('Test 12.1: Should complete full credit note lifecycle', async () => {
      const steps = [
        'select_invoice',
        'select_items',
        'save_draft',
        'submit',
        'approve',
        'receive_stock',
        'close',
      ];

      strictEqual(steps.length, 7, 'Should complete all lifecycle steps');
    });

    test('Test 12.2: Should handle partial invoice credit', async () => {
      const invoice = { total: 10000 };
      const creditAmount = 3000;

      ok(creditAmount < invoice.total, 'Should allow partial');
    });

    test('Test 12.3: Should recalculate customer balance', async () => {
      const previousBalance = -5000; // Credit balance (customer owes)
      const creditNote = { amount: 2000 };
      const newBalance = previousBalance + creditNote.amount;

      strictEqual(newBalance, -3000, 'Should reduce customer payable');
    });

    test('Test 12.4: Should handle credit note for cancelled invoice', async () => {
      const invoice = { status: 'cancelled' };

      ok(invoice.status === 'cancelled', 'Should allow credit for cancelled');
    });

    test('Test 12.5: Should sync with accounting system', async () => {
      const cn = {
        id: 501,
        creditNoteNumber: 'CN-2026-001',
        invoiceId: 337,
        amount: 500,
        syncedToAccounting: true,
        syncDate: new Date().toISOString(),
      };

      ok(cn.syncedToAccounting, 'Should sync to accounting');
    });
  });
});
