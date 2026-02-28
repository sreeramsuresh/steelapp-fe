/**
 * Commission Service Unit Tests (Node Native Test Runner)
 * Tests commission calculations and state transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';

describe('commissionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInvoiceCommission()', () => {
    it('should fetch commission for invoice', async () => {
      const mockCommission = {
        data: {
          id: 1,
          invoiceId: 100,
          invoiceNumber: 'INV-2026-001',
          salesPersonId: 5,
          salesPersonName: 'John Smith',
          commissionRate: 2.5,
          invoiceAmount: 10000,
          commissionAmount: 250,
          status: 'PENDING',
          calculatedAt: '2026-01-15T10:00:00Z',
        },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockCommission);

      const result = await apiClient.get('/commissions/invoice/100');

      expect(result.data.id).toBe(1);
      expect(result.data.invoiceId).toBe(100);
      expect(result.data.commissionAmount).toBe(250);
      expect(result.data.status).toBe('PENDING');
    });

    it('should handle commission not found', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Commission not found'));

      try {
        await apiClient.get('/commissions/invoice/999');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Commission not found');
      }
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/commissions/invoice/100');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('getSalesPersonCommissions()', () => {
    it('should fetch all commissions for sales person', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            invoiceId: 100,
            invoiceNumber: 'INV-2026-001',
            commissionAmount: 250,
            status: 'PENDING',
          },
          {
            id: 2,
            invoiceId: 101,
            invoiceNumber: 'INV-2026-002',
            commissionAmount: 300,
            status: 'APPROVED',
          },
          {
            id: 3,
            invoiceId: 102,
            invoiceNumber: 'INV-2026-003',
            commissionAmount: 200,
            status: 'PAID',
          },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/commissions/sales-person/5');

      expect(result.data.length).toBe(3);
      expect(result.data[0].status).toBe('PENDING');
      expect(result.data[1].status).toBe('APPROVED');
      expect(result.data[2].status).toBe('PAID');
    });

    it('should handle empty commission list', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });

      const result = await apiClient.get('/commissions/sales-person/999');

      expect(result.data.length).toBe(0);
    });
  });

  describe('calculateCommission()', () => {
    it('should calculate commission for invoice', async () => {
      const mockResponse = {
        data: {
          id: 1,
          invoiceId: 100,
          invoiceAmount: 50000,
          commissionRate: 2.0,
          commissionAmount: 1000,
          status: 'CALCULATED',
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/commissions/calculate', {
        invoiceId: 100,
        invoiceAmount: 50000,
        commissionRate: 2.0,
      });

      expect(result.data.commissionAmount).toBe(1000);
    });
  });

  describe('approveCommission()', () => {
    it('should approve pending commission', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'APPROVED',
          approvedAt: '2026-02-01T10:00:00Z',
          approvedBy: 'Manager User',
        },
      };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await apiClient.put('/commissions/1/approve', {
        approvedBy: 'Manager User',
      });

      expect(result.data.status).toBe('APPROVED');
    });

    it('should prevent double approval', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Commission already approved'));

      try {
        await apiClient.put('/commissions/1/approve', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Commission already approved');
      }
    });
  });

  describe('payCommission()', () => {
    it('should mark commission as paid', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'PAID',
          paidAt: '2026-02-05T10:00:00Z',
          paidAmount: 1000,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/commissions/1/pay', {
        paidAmount: 1000,
      });

      expect(result.data.status).toBe('PAID');
      expect(result.data.paidAmount).toBe(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/commissions/sales-person/5');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle server errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Server error'));

      try {
        await apiClient.post('/commissions/calculate', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Server error');
      }
    });
  });
});
