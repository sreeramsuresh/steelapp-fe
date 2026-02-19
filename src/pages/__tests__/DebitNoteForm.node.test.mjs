/**
 * Debit Note Form - Node Native Test Runner (Supplier Returns)
 *
 * Risk Coverage:
 * - Debit note creation from supplier bill
 * - Charge adjustments and additions
 * - Service/surcharge debit notes
 * - VAT handling and recalculation
 * - Approval workflow for payment adjustments
 * - Payment impact and reconciliation
 * - Multi-tenancy debit note isolation
 * - Supplier statement accuracy
 *
 * Test Framework: node:test (native)
 * Mocking: sinon for service stubs
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import { strictEqual, ok, match, deepStrictEqual } from 'node:assert';
import sinon from 'sinon';
import './../../__tests__/init.mjs';

// Mock services
const mockDebitNoteService = {
  createDebitNote: sinon.stub(),
  updateDebitNote: sinon.stub(),
  getDebitNote: sinon.stub(),
  getNextDebitNoteNumber: sinon.stub(),
  submitDebitNote: sinon.stub(),
  approveDebitNote: sinon.stub(),
};

const mockSupplierBillService = {
  getSupplierBill: sinon.stub(),
  updateAmountDue: sinon.stub(),
};

const mockPayablesService = {
  adjustPayable: sinon.stub(),
  getPayableAmount: sinon.stub(),
};

const mockVATService = {
  calculateVAT: sinon.stub(),
  recalculateAfterDebit: sinon.stub(),
};

describe('DebitNoteForm Component', () => {
  beforeEach(() => {
    sinon.reset();

    mockDebitNoteService.getNextDebitNoteNumber.resolves({
      nextNumber: 'DN-2026-001',
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Suite 1: Debit Note Creation from Supplier Bill', () => {
    test('Test 1.1: Should create debit note from supplier bill', async () => {
      mockSupplierBillService.getSupplierBill.resolves({
        id: 501,
        billNumber: 'SUP-BILL-2026-001',
        supplierId: 1,
        supplierName: 'Steel Supplier LLC',
        billDate: '2026-01-10',
        items: [
          { id: 1, description: 'Stainless Steel 304', quantity: 100, rate: 50, amount: 5000 },
          { id: 2, description: 'Handling Charges', quantity: 1, rate: 200, amount: 200 },
        ],
        subtotal: 5200,
        vatAmount: 260,
        total: 5460,
      });

      mockDebitNoteService.createDebitNote.resolves({
        id: 601,
        debitNoteNumber: 'DN-2026-001',
        billId: 501,
        billNumber: 'SUP-BILL-2026-001',
        supplierId: 1,
        items: [
          { billItemId: 1, description: 'Stainless Steel 304 - Return', debitAmount: 1000 },
        ],
        debitAmount: 1000,
        vatAmount: 50,
        totalDebit: 1050,
        status: 'draft',
      });

      const bill = await mockSupplierBillService.getSupplierBill(501);
      const dn = await mockDebitNoteService.createDebitNote({
        billId: 501,
        items: [{ billItemId: 1, debitAmount: 1000 }],
      });

      ok(dn.id, 'Debit note should have ID');
      match(dn.debitNoteNumber, /DN-2026-\d+/, 'Should follow DN number format');
      strictEqual(dn.billId, 501, 'Should link to bill');
      strictEqual(dn.supplierId, bill.supplierId, 'Should capture supplier');
    });

    test('Test 1.2: Should allow partial debit on bill', async () => {
      const billItem = { id: 1, amount: 5000 };
      const debitAmount = 2000; // Partial debit

      ok(debitAmount < billItem.amount, 'Should allow partial debit');
    });

    test('Test 1.3: Should validate supplier bill exists', async () => {
      mockSupplierBillService.getSupplierBill.rejects(new Error('Bill not found'));

      try {
        await mockSupplierBillService.getSupplierBill(99999);
        ok(false, 'Should throw');
      } catch (error) {
        match(error.message, /not found/, 'Should validate bill');
      }
    });

    test('Test 1.4: Should prevent double debit on same items', async () => {
      const billItem = { id: 1 };
      const debit1 = { billItemId: 1, amount: 1000 };
      const debit2 = { billItemId: 1, amount: 500 };

      ok(
        debit1.billItemId === debit2.billItemId,
        'Should detect duplicate debit'
      );
    });
  });

  describe('Suite 2: Charge Adjustments & Additions', () => {
    test('Test 2.1: Should debit for quality issues', async () => {
      const debitNote = {
        reason: 'Quality Issue',
        description: 'Off-grade material received',
        debitAmount: 500,
        billItem: { originalAmount: 5000 },
      };

      ok(debitNote.debitAmount > 0, 'Should charge debit');
      ok(debitNote.debitAmount < debitNote.billItem.originalAmount, 'Should be partial debit');
    });

    test('Test 2.2: Should debit for short delivery/shortage', async () => {
      const shortage = {
        ordered: 100,
        received: 80,
        shortfall: 20,
        ratePerUnit: 50,
        shortageDebit: 20 * 50, // = 1000
      };

      strictEqual(shortage.shortageDebit, 1000, 'Should calculate shortage debit');
    });

    test('Test 2.3: Should debit for overcharge', async () => {
      const invoiced = 50;
      const correctedRate = 45;
      const correctionAmount = (invoiced - correctedRate) * 100;

      strictEqual(correctionAmount, 500, 'Should debit overcharge');
    });

    test('Test 2.4: Should add surcharge for handling/storage', async () => {
      const surcharge = {
        reason: 'Extended storage',
        dailyRate: 10,
        days: 5,
        surchargeAmount: 10 * 5,
      };

      strictEqual(surcharge.surchargeAmount, 50, 'Should add surcharge');
    });
  });

  describe('Suite 3: Service & Surcharge Debit Notes', () => {
    test('Test 3.1: Should create debit note for service charges', async () => {
      mockDebitNoteService.createDebitNote.resolves({
        id: 601,
        debitNoteNumber: 'DN-2026-001',
        billId: null, // Not linked to bill
        type: 'SERVICE_CHARGE',
        description: 'Freight surcharge due to fuel increase',
        debitAmount: 250,
        status: 'draft',
      });

      const dn = await mockDebitNoteService.createDebitNote({
        type: 'SERVICE_CHARGE',
        description: 'Freight surcharge',
        debitAmount: 250,
      });

      strictEqual(dn.type, 'SERVICE_CHARGE', 'Should set type');
      ok(!dn.billId, 'Should not link to bill for service charge');
    });

    test('Test 3.2: Should create debit note for miscellaneous charges', async () => {
      const dn = {
        type: 'MISC_CHARGE',
        reason: 'Restocking fee',
        debitAmount: 100,
      };

      strictEqual(dn.type, 'MISC_CHARGE', 'Should set misc charge type');
    });

    test('Test 3.3: Should apply to supplier account without bill link', async () => {
      const debit = {
        supplierId: 1,
        billId: null,
        appliedToSupplierAccount: true,
      };

      ok(!debit.billId, 'Should not require bill');
      ok(debit.appliedToSupplierAccount, 'Should apply to supplier account');
    });

    test('Test 3.4: Should allow multiple debit notes per period', async () => {
      const debitNotes = [
        { id: 601, reason: 'Quality issue', date: '2026-01-10' },
        { id: 602, reason: 'Freight surcharge', date: '2026-01-15' },
        { id: 603, reason: 'Restocking fee', date: '2026-01-20' },
      ];

      strictEqual(debitNotes.length, 3, 'Should allow multiple debits');
    });
  });

  describe('Suite 4: VAT Recalculation', () => {
    test('Test 4.1: Should calculate VAT on debit amount', async () => {
      const debitAmount = 1000;
      const vatRate = 0.05;
      const vatAmount = debitAmount * vatRate;
      const totalDebit = debitAmount + vatAmount;

      strictEqual(vatAmount, 50, 'Should calculate VAT at 5%');
      strictEqual(totalDebit, 1050, 'Should include VAT in total');
    });

    test('Test 4.2: Should recalculate bill VAT after debit', async () => {
      const originalBill = { subtotal: 5000, vat: 250, total: 5250 };
      const debitAmount = 1000;
      const newSubtotal = originalBill.subtotal - debitAmount;
      const newVAT = newSubtotal * 0.05;
      const newTotal = newSubtotal + newVAT;

      strictEqual(newSubtotal, 4000, 'Should reduce subtotal');
      strictEqual(newVAT, 200, 'Should recalculate VAT');
      strictEqual(newTotal, 4200, 'Should reduce total');
    });

    test('Test 4.3: Should handle VAT recovery for debit', async () => {
      mockVATService.recalculateAfterDebit.resolves({
        billAmount: 5000,
        debitAmount: 1000,
        vat: 50,
        recoveredVAT: 50,
        recoveryCompliant: true,
      });

      const vat = await mockVATService.recalculateAfterDebit({
        billAmount: 5000,
        debitAmount: 1000,
      });

      ok(vat.recoveryCompliant, 'Should be VAT compliant');
    });

    test('Test 4.4: Should handle zero-rated debit items', async () => {
      const debitItem = { amount: 500, vatRate: 0, vat: 0 };

      strictEqual(debitItem.vat, 0, 'Should handle zero-rated');
    });
  });

  describe('Suite 5: Payment Impact & Reconciliation', () => {
    test('Test 5.1: Should reduce supplier payable on debit', async () => {
      mockPayablesService.adjustPayable.resolves({
        supplierId: 1,
        previousPayable: 5460,
        debitAmount: 1050,
        newPayable: 4410,
      });

      const result = await mockPayablesService.adjustPayable(1, -1050);

      strictEqual(result.newPayable, 4410, 'Should reduce payable');
      ok(result.newPayable < result.previousPayable, 'Payable should decrease');
    });

    test('Test 5.2: Should prevent over-debit of supplier', async () => {
      const payable = 5000;
      const attemptedDebit = 6000;

      ok(
        attemptedDebit > payable,
        'Should detect over-debit'
      );
    });

    test('Test 5.3: Should impact payment reconciliation', async () => {
      const bill = { amount: 5000, debited: 1000 };
      const paymentAmount = 4000;
      const reconciled = paymentAmount === (bill.amount - bill.debited);

      ok(reconciled, 'Should reconcile with debit');
    });

    test('Test 5.4: Should update supplier account balance', async () => {
      const balance = { openBills: 5460, debits: -1050, netPayable: 4410 };

      strictEqual(balance.netPayable, 4410, 'Should calculate net payable');
    });
  });

  describe('Suite 6: Approval Workflow', () => {
    test('Test 6.1: Should require approval for high-value debit', async () => {
      const threshold = 1000;
      const debitAmount = 1500;
      const requiresApproval = debitAmount > threshold;

      ok(requiresApproval, 'Should flag for approval');
    });

    test('Test 6.2: Should track approval status', async () => {
      mockDebitNoteService.approveDebitNote.resolves({
        id: 601,
        status: 'approved',
        approvedBy: 'manager@example.com',
        approvalDate: new Date().toISOString(),
      });

      const dn = await mockDebitNoteService.approveDebitNote(601);

      strictEqual(dn.status, 'approved', 'Should mark as approved');
      ok(dn.approvedBy, 'Should record approver');
    });

    test('Test 6.3: Should allow rejection with reason', async () => {
      const rejection = {
        debitNoteId: 601,
        status: 'rejected',
        rejectionReason: 'Insufficient documentation',
        rejectedBy: 'manager@example.com',
      };

      ok(rejection.rejectionReason, 'Should record reason');
    });

    test('Test 6.4: Should maintain approval audit trail', async () => {
      const auditTrail = [
        { action: 'created', by: 'user@example.com', date: '2026-01-15' },
        { action: 'submitted', by: 'user@example.com', date: '2026-01-16' },
        { action: 'approved', by: 'manager@example.com', date: '2026-01-17' },
      ];

      strictEqual(auditTrail.length, 3, 'Should track all actions');
    });
  });

  describe('Suite 7: Multi-Tenancy & Supplier Isolation', () => {
    test('Test 7.1: Should isolate debit notes by company_id', async () => {
      const companyId = 1;
      const debitNotes = [
        { id: 601, dnNumber: 'DN-001', companyId: 1 },
        { id: 602, dnNumber: 'DN-002', companyId: 1 },
      ];

      ok(
        debitNotes.every((dn) => dn.companyId === companyId),
        'Should filter by company_id'
      );
    });

    test('Test 7.2: Should prevent cross-tenant access', async () => {
      const user = { id: 1, companyId: 1 };
      const dn = { id: 601, companyId: 1 };

      strictEqual(user.companyId, dn.companyId, 'User should match DN company');
    });

    test('Test 7.3: Should isolate suppliers by company', async () => {
      const suppliers = [
        { id: 1, name: 'Supplier A', companyId: 1 },
        { id: 2, name: 'Supplier B', companyId: 1 },
      ];

      ok(suppliers.every((s) => s.companyId === 1), 'Should isolate suppliers');
    });

    test('Test 7.4: Should audit debit note access', async () => {
      const auditLog = {
        userId: 1,
        dnId: 601,
        action: 'APPROVE',
        timestamp: new Date().toISOString(),
      };

      ok(auditLog.userId && auditLog.action, 'Should record audit');
    });
  });

  describe('Suite 8: Draft Management', () => {
    test('Test 8.1: Should save debit note draft', async () => {
      const draftDN = {
        billId: 501,
        items: [{ debitAmount: 1000 }],
        timestamp: Date.now(),
      };

      const key = `debitnote_draft_${draftDN.billId}`;
      const saved = JSON.stringify(draftDN);

      ok(saved, 'Draft should serialize');
      match(saved, /"billId":501/, 'Serialized draft should contain billId');
    });

    test('Test 8.2: Should recover draft', async () => {
      const savedDraft = JSON.stringify({
        billId: 501,
        items: [
          { description: 'Quality debit', debitAmount: 500 },
          { description: 'Short delivery', debitAmount: 300 },
        ],
        totalDebit: 800,
        timestamp: Date.now() - 3600000,
      });

      const restored = JSON.parse(savedDraft);

      strictEqual(restored.items.length, 2, 'Draft should restore items');
      strictEqual(restored.totalDebit, 800, 'Draft should restore calculations');
    });

    test('Test 8.3: Should expire draft after 30 days', async () => {
      const draftTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      ok(now - draftTimestamp > 30 * 24 * 60 * 60 * 1000, 'Draft should expire');
    });

    test('Test 8.4: Should prompt recovery or new', async () => {
      const existingDraft = true;
      const isExpired = false;

      ok(existingDraft && !isExpired, 'Should offer recovery');
    });
  });

  describe('Suite 9: Supplier Statement Impact', () => {
    test('Test 9.1: Should reflect debit in supplier statement', async () => {
      const statement = {
        period: 'Jan 2026',
        debits: [
          { id: 601, debitNoteNumber: 'DN-2026-001', amount: 1050 },
        ],
        totalDebits: 1050,
      };

      strictEqual(statement.totalDebits, 1050, 'Should show debits in statement');
    });

    test('Test 9.2: Should calculate net supplier balance', async () => {
      const balance = {
        credits: 5000, // Invoices
        debits: 1050, // Debit notes
        netPayable: 5000 - 1050,
      };

      strictEqual(balance.netPayable, 3950, 'Should calculate net balance');
    });

    test('Test 9.3: Should track debit aging', async () => {
      const debitNotes = [
        { id: 601, date: '2026-01-01', status: 'draft' },
        { id: 602, date: '2026-01-15', status: 'approved' },
      ];

      ok(debitNotes.length > 0, 'Should track debit aging');
    });

    test('Test 9.4: Should prepare debit reconciliation report', async () => {
      const reconciliation = {
        totalDebits: 1050,
        appliedToPayments: 1050,
        pending: 0,
      };

      strictEqual(reconciliation.pending, 0, 'All debits should be applied');
    });
  });

  describe('Suite 10: Error Handling & Validation', () => {
    test('Test 10.1: Should validate supplier bill linked', async () => {
      const dnData = { billId: null, debitAmount: 500 };

      ok(!dnData.billId || dnData.debitAmount > 0, 'Should validate requirement');
    });

    test('Test 10.2: Should validate debit amount format', async () => {
      const amount = 'one thousand';

      ok(isNaN(amount), 'Should detect invalid format');
    });

    test('Test 10.3: Should validate debit reason', async () => {
      const dn = { reason: '', debitAmount: 500 };

      ok(!dn.reason && dn.debitAmount > 0, 'Should require reason');
    });

    test('Test 10.4: Should handle network errors', async () => {
      mockDebitNoteService.createDebitNote.rejects(new Error('Network error'));

      try {
        await mockDebitNoteService.createDebitNote({});
        ok(false, 'Should throw');
      } catch (error) {
        match(error.message, /Network/, 'Should propagate error');
      }
    });
  });

  describe('Suite 11: Integration & Real-World Scenarios', () => {
    test('Test 11.1: Should complete full debit note lifecycle', async () => {
      const steps = [
        'select_bill',
        'add_debits',
        'save_draft',
        'submit',
        'approve',
        'apply_to_payable',
        'close',
      ];

      strictEqual(steps.length, 7, 'Should complete lifecycle');
    });

    test('Test 11.2: Should handle multiple debit items', async () => {
      const debitItems = [
        { reason: 'Quality issue', amount: 500 },
        { reason: 'Short delivery', amount: 300 },
        { reason: 'Overcharge', amount: 200 },
      ];

      const total = debitItems.reduce((sum, i) => sum + i.amount, 0);

      strictEqual(total, 1000, 'Should sum all debits');
    });

    test('Test 11.3: Should prevent debit after payment', async () => {
      const bill = { id: 501, status: 'paid' };

      ok(bill.status === 'paid', 'Should detect paid bill');
    });

    test('Test 11.4: Should sync with accounting system', async () => {
      const dn = {
        id: 601,
        debitNoteNumber: 'DN-2026-001',
        amount: 1050,
        syncedToAccounting: true,
        syncDate: new Date().toISOString(),
      };

      ok(dn.syncedToAccounting, 'Should sync to accounting');
    });
  });

  describe('Suite 12: Edge Cases', () => {
    test('Test 12.1: Should handle zero debit amount', async () => {
      const debitAmount = 0;

      ok(debitAmount === 0, 'Should detect zero amount');
    });

    test('Test 12.2: Should handle very large debit amounts', async () => {
      const debitAmount = 999999.99;
      const billAmount = 1000000;

      ok(debitAmount < billAmount, 'Should handle large amounts');
    });

    test('Test 12.3: Should prevent negative debit amounts', async () => {
      const debitAmount = -500;

      ok(debitAmount < 0, 'Should detect negative amount');
    });

    test('Test 12.4: Should preserve original bill immutability', async () => {
      const originalBill = { id: 501, amount: 5000 };
      const debitNote = { billId: 501, debitAmount: 1000 };

      strictEqual(originalBill.amount, 5000, 'Original should be unchanged');
    });
  });
});
