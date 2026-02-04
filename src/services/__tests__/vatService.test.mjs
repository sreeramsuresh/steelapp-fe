/**
 * VAT Service Unit Tests (Node Native Test Runner)
 * Tests VAT return operations (CRUD, submission)
 * Tests VAT adjustments and amendments
 * Tests blocked VAT tracking
 * Tests VAT dashboard metrics calculation
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import vatService from '../vatService.js';

describe('vatService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('VAT Returns', () => {
    test('should get VAT returns with pagination', async () => {
      const mockReturns = {
        data: [
          {
            id: 1,
            periodStart: '2026-01-01',
            periodEnd: '2026-03-31',
            status: 'draft',
          },
          {
            id: 2,
            periodStart: '2025-10-01',
            periodEnd: '2025-12-31',
            status: 'submitted',
          },
        ],
        pageInfo: { page: 1, totalPages: 1, total: 2 },
      };
      sinon.stub(apiClient, 'get').resolves(mockReturns);

      const result = await vatService.getVATReturns({ page: 1, limit: 20 });

      assert.strictEqual(result.data.length, 2);
      assert.ok(apiClient.get.calledWith('/vat-return', {
        page: 1,
        limit: 20,
      }));
    });

    test('should get single VAT return by ID', async () => {
      const mockReturn = {
        id: 1,
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        status: 'draft',
        form201: { box8TotalOutputVat: 50000, box12TotalInputVat: 20000 },
      };
      sinon.stub(apiClient, 'get').resolves(mockReturn);

      const result = await vatService.getVATReturn(1);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.status, 'draft');
      assert.ok(apiClient.get.calledWith('/vat-return/1'));
    });

    test('should generate VAT return for period', async () => {
      const periodData = {
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };
      const mockResponse = {
        id: 5,
        ...periodData,
        status: 'draft',
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.generateVATReturn(periodData);

      assert.strictEqual(result.id, 5);
      assert.ok(apiClient.post.calledWith('/vat-return/generate', periodData));
    });

    test('should get VAT return preview', async () => {
      const params = {
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };
      const mockPreview = {
        outputVAT: 50000,
        inputVAT: 20000,
        netPayable: 30000,
      };
      sinon.stub(apiClient, 'get').resolves(mockPreview);

      const result = await vatService.getVATReturnPreview(params);

      assert.strictEqual(result.netPayable, 30000);
      assert.ok(apiClient.get.calledWith('/vat-return/preview', params));
    });

    test('should submit VAT return to FTA', async () => {
      const submissionData = { notes: 'Q1 2026 VAT return' };
      const mockResponse = { id: 1, status: 'submitted', submissionDate: '2026-04-10' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.submitVATReturn(1, submissionData);

      assert.strictEqual(result.status, 'submitted');
      assert.ok(apiClient.post.calledWith('/vat-return/1/submit', submissionData));
    });

    test('should get Form 201 data', async () => {
      const mockForm = {
        box8TotalOutputVat: 50000,
        box12TotalInputVat: 20000,
        box15NetVatDue: 30000,
      };
      sinon.stub(apiClient, 'get').resolves(mockForm);

      const result = await vatService.getForm201Data(1);

      assert.strictEqual(result.box15NetVatDue, 30000);
      assert.ok(apiClient.get.calledWith('/vat-return/1/form-201', {}));
    });

    test('should get VAT reconciliation report', async () => {
      const mockReport = {
        totalInvoices: 150,
        totalWithVAT: 140,
        discrepancies: 0,
      };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await vatService.getVATReconciliation(1);

      assert.strictEqual(result.totalInvoices, 150);
      assert.ok(apiClient.get.calledWith('/vat-return/1/reconciliation', {}));
    });

    test('should get VAT audit trail', async () => {
      const mockTrail = [
        { date: '2026-04-10', action: 'submitted', user: 'admin@company.com' },
        { date: '2026-04-09', action: 'created', user: 'admin@company.com' },
      ];
      sinon.stub(apiClient, 'get').resolves(mockTrail);

      const result = await vatService.getVATAuditTrail(1);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].action, 'submitted');
      assert.ok(apiClient.get.calledWith('/vat-return/1/audit-trail', {}));
    });

    test('should get list of Emirates', async () => {
      const mockEmirates = [
        { code: 'AZ', name: 'Abu Dhabi' },
        { code: 'DU', name: 'Dubai' },
        { code: 'SH', name: 'Sharjah' },
      ];
      sinon.stub(apiClient, 'get').resolves(mockEmirates);

      const result = await vatService.getEmirates();

      assert.strictEqual(result.length, 3);
      assert.strictEqual(result[0].name, 'Abu Dhabi');
      assert.ok(apiClient.get.calledWith('/vat-return/emirates'));
    });
  });

  describe('VAT Adjustments', () => {
    test('should list VAT adjustments', async () => {
      const mockAdjustments = [
        {
          id: 1,
          type: 'output_adjustment',
          amount: 5000,
          status: 'draft',
        },
      ];
      sinon.stub(apiClient, 'get').resolves(mockAdjustments);

      const result = await vatService.getVATAdjustments();

      assert.strictEqual(result.length, 1);
      assert.ok(apiClient.get.calledWith('/vat-return/adjustments', {}));
    });

    test('should get single VAT adjustment', async () => {
      const mockAdjustment = {
        id: 1,
        type: 'output_adjustment',
        amount: 5000,
        status: 'draft',
      };
      sinon.stub(apiClient, 'get').resolves(mockAdjustment);

      const result = await vatService.getVATAdjustment(1);

      assert.strictEqual(result.id, 1);
      assert.ok(apiClient.get.calledWith('/vat-return/adjustments/1'));
    });

    test('should create VAT adjustment', async () => {
      const adjustmentData = {
        type: 'output_adjustment',
        amount: 5000,
        reason: 'Credit note issued',
      };
      const mockResponse = { id: 10, ...adjustmentData, status: 'draft' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.createVATAdjustment(adjustmentData);

      assert.strictEqual(result.id, 10);
      assert.ok(apiClient.post.calledWith('/vat-return/adjustments', adjustmentData));
    });

    test('should update VAT adjustment', async () => {
      const updates = { amount: 6000 };
      const mockResponse = { id: 1, amount: 6000, status: 'draft' };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await vatService.updateVATAdjustment(1, updates);

      assert.strictEqual(result.amount, 6000);
      assert.ok(apiClient.put.calledWith('/vat-return/adjustments/1', updates));
    });

    test('should approve VAT adjustment', async () => {
      const approvalData = { approverNotes: 'Approved' };
      const mockResponse = {
        id: 1,
        status: 'approved',
        approvedAt: '2026-04-15',
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.approveVATAdjustment(1, approvalData);

      assert.strictEqual(result.status, 'approved');
      assert.ok(apiClient.post.calledWith('/vat-return/adjustments/1/approve', approvalData));
    });

    test('should reject VAT adjustment', async () => {
      const rejectionData = { rejection_reason: 'Insufficient documentation' };
      const mockResponse = {
        id: 1,
        status: 'rejected',
        rejectedAt: '2026-04-15',
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.rejectVATAdjustment(1, rejectionData);

      assert.strictEqual(result.status, 'rejected');
      assert.ok(apiClient.post.calledWith('/vat-return/adjustments/1/reject', rejectionData));
    });
  });

  describe('VAT Amendments', () => {
    test('should list VAT amendments', async () => {
      const mockAmendments = [{ id: 1, originalReturnId: 1, status: 'draft' }];
      sinon.stub(apiClient, 'get').resolves(mockAmendments);

      const result = await vatService.getVATAmendments();

      assert.strictEqual(result.length, 1);
      assert.ok(apiClient.get.calledWith('/vat-return/amendments', {}));
    });

    test('should get single VAT amendment', async () => {
      const mockAmendment = { id: 1, originalReturnId: 1, status: 'draft' };
      sinon.stub(apiClient, 'get').resolves(mockAmendment);

      const result = await vatService.getVATAmendment(1);

      assert.strictEqual(result.id, 1);
      assert.ok(apiClient.get.calledWith('/vat-return/amendments/1'));
    });

    test('should create VAT amendment', async () => {
      const amendmentData = {
        originalReturnId: 1,
        reason: 'Correction of error',
      };
      const mockResponse = { id: 5, ...amendmentData, status: 'draft' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.createVATAmendment(amendmentData);

      assert.strictEqual(result.id, 5);
      assert.ok(apiClient.post.calledWith('/vat-return/amendments', amendmentData));
    });

    test('should submit VAT amendment', async () => {
      const mockResponse = { id: 1, status: 'submitted' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.submitVATAmendment(1);

      assert.strictEqual(result.status, 'submitted');
      assert.ok(apiClient.post.calledWith('/vat-return/amendments/1/submit'));
    });

    test('should calculate amendment penalty', async () => {
      const mockPenalty = { penaltyAmount: 500, reason: 'Late submission' };
      sinon.stub(apiClient, 'get').resolves(mockPenalty);

      const result = await vatService.calculateAmendmentPenalty(1);

      assert.strictEqual(result.penaltyAmount, 500);
      assert.ok(apiClient.get.calledWith('/vat-return/amendments/1/penalty', {}));
    });
  });

  describe('Blocked VAT', () => {
    test('should get blocked VAT categories', async () => {
      const mockCategories = {
        categories: [
          { type: 'non_business_input', amount: 10000 },
          { type: 'blocked_supply', amount: 5000 },
        ],
        total_blocked_vat: 15000,
      };
      sinon.stub(apiClient, 'get').resolves(mockCategories);

      const result = await vatService.getBlockedVATCategories();

      assert.strictEqual(result.categories.length, 2);
      assert.strictEqual(result.total_blocked_vat, 15000);
      assert.ok(apiClient.get.calledWith('/vat-return/blocked-vat/categories'));
    });

    test('should get blocked VAT log', async () => {
      const mockLog = [
        {
          date: '2026-04-10',
          category: 'non_business_input',
          amount: 2000,
        },
      ];
      sinon.stub(apiClient, 'get').resolves(mockLog);

      const result = await vatService.getBlockedVATLog();

      assert.strictEqual(result.length, 1);
      assert.ok(apiClient.get.calledWith('/vat-return/blocked-vat/log', {}));
    });

    test('should record blocked VAT', async () => {
      const blockedData = {
        category: 'non_business_input',
        amount: 2000,
        invoiceId: 'INV-001',
      };
      const mockResponse = { id: 100, ...blockedData, date: '2026-04-10' };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await vatService.recordBlockedVAT(blockedData);

      assert.strictEqual(result.id, 100);
      assert.ok(apiClient.post.calledWith('/vat-return/blocked-vat/record', blockedData));
    });
  });

  describe('VAT Dashboard Metrics', () => {
    test('should calculate VAT dashboard metrics for current quarter', async () => {
      const mockReturns = {
        data: [
          {
            id: 1,
            periodStart: '2026-01-01',
            status: 'draft',
            form201: {
              box8TotalOutputVat: 50000,
              box12TotalInputVat: 20000,
              box15NetVatDue: 30000,
            },
          },
        ],
      };
      const mockBlocked = {
        categories: [{ type: 'non_business_input', amount: 5000 }],
        total_blocked_vat: 5000,
      };
      sinon.stub(apiClient, 'get').onFirstCall().resolves(mockReturns);
      sinon.stub(apiClient, 'get').onSecondCall().resolves(mockBlocked);

      const result = await vatService.getVATDashboardMetrics();

      assert.strictEqual(result.collection.outputVAT, 50000);
      assert.strictEqual(result.collection.netPayable, 30000);
      assert.strictEqual(result.blockedVAT.total, 5000);
      assert.ok(result.currentPeriod.quarter);
      assert.ok(result.returnStatus.daysRemaining !== undefined);
      assert.ok(result.history);
    });

    test('should handle errors in VAT dashboard metrics gracefully', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('API error'));

      const result = await vatService.getVATDashboardMetrics();

      assert.ok(result !== undefined);
      assert.ok(result.currentPeriod !== undefined);
      assert.strictEqual(result.blockedVAT.total, 0);
      assert.deepStrictEqual(result.blockedVAT.categories, []);
      assert.deepStrictEqual(result.history, []);
    });

    test('should generate alerts for VAT returns due soon', async () => {
      sinon.stub(apiClient, 'get').onFirstCall().resolves({ data: [] });
      sinon.stub(apiClient, 'get').onSecondCall().resolves({
        categories: [],
        total_blocked_vat: 0,
      });

      const result = await vatService.getVATDashboardMetrics();

      assert.ok(result.alerts !== undefined);
      assert.ok(Array.isArray(result.alerts));
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors in getVATReturns', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await vatService.getVATReturns();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle API errors in submitVATReturn', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Submission failed'));

      try {
        await vatService.submitVATReturn(1, {});
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Submission failed');
      }
    });

    test('should handle API errors in createVATAdjustment', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Validation error'));

      try {
        await vatService.createVATAdjustment({});
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Validation error');
      }
    });

    test('should handle API errors in recordBlockedVAT', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Recording failed'));

      try {
        await vatService.recordBlockedVAT({});
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Recording failed');
      }
    });
  });
});
