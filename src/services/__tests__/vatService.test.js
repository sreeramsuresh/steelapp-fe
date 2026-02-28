/**
 * VAT Service Unit Tests (Node Native Test Runner)
 * Tests VAT return operations (CRUD, submission)
 * Tests VAT adjustments and amendments
 * Tests blocked VAT tracking
 * Tests VAT dashboard metrics calculation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import vatService from '../vatService.js';

describe('vatService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('VAT Returns', () => {
    it('should get VAT returns with pagination', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReturns);

      const result = await vatService.getVATReturns({ page: 1, limit: 20 });

      expect(result.data.length).toBe(2);
      expect(apiClient.get.calledWith('/vat-return', {
        page: 1,
        limit: 20,
      }).toBeTruthy());
    });

    it('should get single VAT return by ID', async () => {
      const mockReturn = {
        id: 1,
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        status: 'draft',
        form201: { box8TotalOutputVat: 50000, box12TotalInputVat: 20000 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReturn);

      const result = await vatService.getVATReturn(1);

      expect(result.id).toBe(1);
      expect(result.status).toBe('draft');
      expect(apiClient.get.calledWith('/vat-return/1').toBeTruthy());
    });

    it('should generate VAT return for period', async () => {
      const periodData = {
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };
      const mockResponse = {
        id: 5,
        ...periodData,
        status: 'draft',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.generateVATReturn(periodData);

      expect(result.id).toBe(5);
      expect(apiClient.post.calledWith('/vat-return/generate', periodData).toBeTruthy());
    });

    it('should get VAT return preview', async () => {
      const params = {
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
      };
      const mockPreview = {
        outputVAT: 50000,
        inputVAT: 20000,
        netPayable: 30000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPreview);

      const result = await vatService.getVATReturnPreview(params);

      expect(result.netPayable).toBe(30000);
      expect(apiClient.get.calledWith('/vat-return/preview', params).toBeTruthy());
    });

    it('should submit VAT return to FTA', async () => {
      const submissionData = { notes: 'Q1 2026 VAT return' };
      const mockResponse = { id: 1, status: 'submitted', submissionDate: '2026-04-10' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.submitVATReturn(1, submissionData);

      expect(result.status).toBe('submitted');
      expect(apiClient.post.calledWith('/vat-return/1/submit', submissionData).toBeTruthy());
    });

    it('should get Form 201 data', async () => {
      const mockForm = {
        box8TotalOutputVat: 50000,
        box12TotalInputVat: 20000,
        box15NetVatDue: 30000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockForm);

      const result = await vatService.getForm201Data(1);

      expect(result.box15NetVatDue).toBe(30000);
      expect(apiClient.get.calledWith('/vat-return/1/form-201', {}).toBeTruthy());
    });

    it('should get VAT reconciliation report', async () => {
      const mockReport = {
        totalInvoices: 150,
        totalWithVAT: 140,
        discrepancies: 0,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await vatService.getVATReconciliation(1);

      expect(result.totalInvoices).toBe(150);
      expect(apiClient.get.calledWith('/vat-return/1/reconciliation', {}).toBeTruthy());
    });

    it('should get VAT audit trail', async () => {
      const mockTrail = [
        { date: '2026-04-10', action: 'submitted', user: 'admin@company.com' },
        { date: '2026-04-09', action: 'created', user: 'admin@company.com' },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockTrail);

      const result = await vatService.getVATAuditTrail(1);

      expect(result.length).toBe(2);
      expect(result[0].action).toBe('submitted');
      expect(apiClient.get.calledWith('/vat-return/1/audit-trail', {}).toBeTruthy());
    });

    it('should get list of Emirates', async () => {
      const mockEmirates = [
        { code: 'AZ', name: 'Abu Dhabi' },
        { code: 'DU', name: 'Dubai' },
        { code: 'SH', name: 'Sharjah' },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockEmirates);

      const result = await vatService.getEmirates();

      expect(result.length).toBe(3);
      expect(result[0].name).toBe('Abu Dhabi');
      expect(apiClient.get.calledWith('/vat-return/emirates').toBeTruthy());
    });
  });

  describe('VAT Adjustments', () => {
    it('should list VAT adjustments', async () => {
      const mockAdjustments = [
        {
          id: 1,
          type: 'output_adjustment',
          amount: 5000,
          status: 'draft',
        },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAdjustments);

      const result = await vatService.getVATAdjustments();

      expect(result.length).toBe(1);
      expect(apiClient.get.calledWith('/vat-return/adjustments', {}).toBeTruthy());
    });

    it('should get single VAT adjustment', async () => {
      const mockAdjustment = {
        id: 1,
        type: 'output_adjustment',
        amount: 5000,
        status: 'draft',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAdjustment);

      const result = await vatService.getVATAdjustment(1);

      expect(result.id).toBe(1);
      expect(apiClient.get.calledWith('/vat-return/adjustments/1').toBeTruthy());
    });

    it('should create VAT adjustment', async () => {
      const adjustmentData = {
        type: 'output_adjustment',
        amount: 5000,
        reason: 'Credit note issued',
      };
      const mockResponse = { id: 10, ...adjustmentData, status: 'draft' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.createVATAdjustment(adjustmentData);

      expect(result.id).toBe(10);
      expect(apiClient.post.calledWith('/vat-return/adjustments', adjustmentData).toBeTruthy());
    });

    it('should update VAT adjustment', async () => {
      const updates = { amount: 6000 };
      const mockResponse = { id: 1, amount: 6000, status: 'draft' };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await vatService.updateVATAdjustment(1, updates);

      expect(result.amount).toBe(6000);
      expect(apiClient.put.calledWith('/vat-return/adjustments/1', updates).toBeTruthy());
    });

    it('should approve VAT adjustment', async () => {
      const approvalData = { approverNotes: 'Approved' };
      const mockResponse = {
        id: 1,
        status: 'approved',
        approvedAt: '2026-04-15',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.approveVATAdjustment(1, approvalData);

      expect(result.status).toBe('approved');
      expect(apiClient.post.calledWith('/vat-return/adjustments/1/approve', approvalData).toBeTruthy());
    });

    it('should reject VAT adjustment', async () => {
      const rejectionData = { rejection_reason: 'Insufficient documentation' };
      const mockResponse = {
        id: 1,
        status: 'rejected',
        rejectedAt: '2026-04-15',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.rejectVATAdjustment(1, rejectionData);

      expect(result.status).toBe('rejected');
      expect(apiClient.post.calledWith('/vat-return/adjustments/1/reject', rejectionData).toBeTruthy());
    });
  });

  describe('VAT Amendments', () => {
    it('should list VAT amendments', async () => {
      const mockAmendments = [{ id: 1, originalReturnId: 1, status: 'draft' }];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAmendments);

      const result = await vatService.getVATAmendments();

      expect(result.length).toBe(1);
      expect(apiClient.get.calledWith('/vat-return/amendments', {}).toBeTruthy());
    });

    it('should get single VAT amendment', async () => {
      const mockAmendment = { id: 1, originalReturnId: 1, status: 'draft' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAmendment);

      const result = await vatService.getVATAmendment(1);

      expect(result.id).toBe(1);
      expect(apiClient.get.calledWith('/vat-return/amendments/1').toBeTruthy());
    });

    it('should create VAT amendment', async () => {
      const amendmentData = {
        originalReturnId: 1,
        reason: 'Correction of error',
      };
      const mockResponse = { id: 5, ...amendmentData, status: 'draft' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.createVATAmendment(amendmentData);

      expect(result.id).toBe(5);
      expect(apiClient.post.calledWith('/vat-return/amendments', amendmentData).toBeTruthy());
    });

    it('should submit VAT amendment', async () => {
      const mockResponse = { id: 1, status: 'submitted' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.submitVATAmendment(1);

      expect(result.status).toBe('submitted');
      expect(apiClient.post.calledWith('/vat-return/amendments/1/submit').toBeTruthy());
    });

    it('should calculate amendment penalty', async () => {
      const mockPenalty = { penaltyAmount: 500, reason: 'Late submission' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockPenalty);

      const result = await vatService.calculateAmendmentPenalty(1);

      expect(result.penaltyAmount).toBe(500);
      expect(apiClient.get.calledWith('/vat-return/amendments/1/penalty', {}).toBeTruthy());
    });
  });

  describe('Blocked VAT', () => {
    it('should get blocked VAT categories', async () => {
      const mockCategories = {
        categories: [
          { type: 'non_business_input', amount: 10000 },
          { type: 'blocked_supply', amount: 5000 },
        ],
        total_blocked_vat: 15000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockCategories);

      const result = await vatService.getBlockedVATCategories();

      expect(result.categories.length).toBe(2);
      expect(result.total_blocked_vat).toBe(15000);
      expect(apiClient.get.calledWith('/vat-return/blocked-vat/categories').toBeTruthy());
    });

    it('should get blocked VAT log', async () => {
      const mockLog = [
        {
          date: '2026-04-10',
          category: 'non_business_input',
          amount: 2000,
        },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockLog);

      const result = await vatService.getBlockedVATLog();

      expect(result.length).toBe(1);
      expect(apiClient.get.calledWith('/vat-return/blocked-vat/log', {}).toBeTruthy());
    });

    it('should record blocked VAT', async () => {
      const blockedData = {
        category: 'non_business_input',
        amount: 2000,
        invoiceId: 'INV-001',
      };
      const mockResponse = { id: 100, ...blockedData, date: '2026-04-10' };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await vatService.recordBlockedVAT(blockedData);

      expect(result.id).toBe(100);
      expect(apiClient.post.calledWith('/vat-return/blocked-vat/record', blockedData).toBeTruthy());
    });
  });

  describe('VAT Dashboard Metrics', () => {
    it('should calculate VAT dashboard metrics for current quarter', async () => {
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
      vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(mockReturns)
      .mockResolvedValueOnce(mockBlocked);

      const result = await vatService.getVATDashboardMetrics();

      expect(result.collection.outputVAT).toBe(50000);
      expect(result.collection.netPayable).toBe(30000);
      expect(result.blockedVAT.total).toBe(5000);
      expect(result.currentPeriod.quarter).toBeTruthy();
      expect(result.returnStatus.daysRemaining !== undefined).toBeTruthy();
      expect(result.history).toBeTruthy();
    });

    it('should handle errors in VAT dashboard metrics gracefully', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('API error'));

      const result = await vatService.getVATDashboardMetrics();

      expect(result !== undefined).toBeTruthy();
      expect(result.currentPeriod !== undefined).toBeTruthy();
      expect(result.blockedVAT.total).toBe(0);
      expect(result.blockedVAT.categories).toEqual([]);
      expect(result.history).toEqual([]);
    });

    it('should generate alerts for VAT returns due soon', async () => {
      vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
          categories: [],
          total_blocked_vat: 0,
        });

      const result = await vatService.getVATDashboardMetrics();

      expect(result.alerts !== undefined).toBeTruthy();
      expect(Array.isArray(result.alerts).toBeTruthy());
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors in getVATReturns', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await vatService.getVATReturns();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle API errors in submitVATReturn', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Submission failed'));

      try {
        await vatService.submitVATReturn(1, {});
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Submission failed');
      }
    });

    it('should handle API errors in createVATAdjustment', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Validation error'));

      try {
        await vatService.createVATAdjustment({});
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Validation error');
      }
    });

    it('should handle API errors in recordBlockedVAT', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Recording failed'));

      try {
        await vatService.recordBlockedVAT({});
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Recording failed');
      }
    });
  });
});
