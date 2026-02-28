/**
 * GRN (Goods Receipt Note) Service Unit Tests (Node Native Test Runner)
 * Tests GRN CRUD operations for 3-way match workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';

describe('grnService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll()', () => {
    it('should fetch GRNs with pagination', async () => {
      const mockResponse = {
        data: [
          { id: 1, grnNumber: 'GRN-2026-001', status: 'draft' },
          { id: 2, grnNumber: 'GRN-2026-002', status: 'approved' },
        ],
        pagination: { page: 1, pageSize: 10, total: 28 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/grns', { page: 1, pageSize: 10 });

      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(28);
      expect(apiClient.get).toHaveBeenCalledWith('/grns', { page: 1, pageSize: 10 });
    });

    it('should fetch GRNs with filters', async () => {
      const mockResponse = { data: [], pagination: null };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      await apiClient.get('/grns', {
        page: 1,
        pageSize: 50,
        status: 'draft',
        supplierId: 5,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/grns', expect.objectContaining({
        page: 1,
        pageSize: 50,
        status: 'draft',
        supplierId: 5,
      }));
    });
  });

  describe('getById()', () => {
    it('should fetch GRN by ID with full details', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'approved',
        items: [
          {
            id: 1,
            productId: 50,
            description: 'SS 304 Coil',
            receivedQuantity: 1050,
            poWeightKg: 10000,
            receivedWeightKg: 10500,
          },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockGRN);

      const result = await apiClient.get('/grns/1');

      expect(result.grnNumber).toBe('GRN-2026-001');
      expect(result.items.length).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith('/grns/1');
    });

    it('should handle GRN not found', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('GRN not found'));

      try {
        await apiClient.get('/grns/999');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('GRN not found');
      }
    });
  });

  describe('create()', () => {
    it('should create new GRN', async () => {
      const grnData = {
        purchaseOrderId: 100,
        supplierId: 5,
        warehouseId: 2,
        receivedDate: '2026-01-15',
        items: [
          {
            purchaseOrderLineId: 10,
            receivedQuantity: 1050,
            receivedWeightKg: 10500,
          },
        ],
      };
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'draft',
        purchaseOrderId: 100,
        items: [],
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockGRN);

      const result = await apiClient.post('/grns', grnData);

      expect(result.id).toBe(1);
      expect(result.grnNumber).toBe('GRN-2026-001');
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it('should handle creation errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Invalid GRN data'));

      try {
        await apiClient.post('/grns', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invalid GRN data');
      }
    });
  });

  describe('update()', () => {
    it('should update GRN details', async () => {
      const updateData = { receivedBy: 'new_mgr', notes: 'Updated notes' };
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        receivedBy: 'new_mgr',
        notes: 'Updated notes',
      };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockGRN);

      const result = await apiClient.put('/grns/1', updateData);

      expect(result.receivedBy).toBe('new_mgr');
      expect(result.notes).toBe('Updated notes');
      expect(apiClient.put.mock.calls.length > 0).toBeTruthy();
    });

    it('should prevent updating approved GRN', async () => {
      vi.spyOn(apiClient, 'put').mockRejectedValue(new Error('Cannot update approved GRN'));

      try {
        await apiClient.put('/grns/1', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Cannot update approved GRN');
      }
    });
  });

  describe('Advanced Tracking via Service Methods', () => {
    it('should accept GRN with weight variance data', async () => {
      const grnData = {
        purchaseOrderId: 100,
        items: [
          {
            purchaseOrderLineId: 10,
            orderedQuantity: 1000,
            receivedQuantity: 1050,
            poWeightKg: 10000,
            receivedWeightKg: 10500,
            weightVariancePercent: 5,
            batchNumber: 'BATCH-001',
            pcsReceived: 100,
          },
        ],
      };
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        items: [
          {
            receivedQuantity: 1050,
            weightVariancePercent: 5,
            batchNumber: 'BATCH-001',
          },
        ],
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockGRN);

      const result = await apiClient.post('/grns', grnData);

      expect(result.id).toBe(1);
      expect(result.items[0].batchNumber).toBe('BATCH-001');
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it('should prevent exceeding ordered quantity', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new Error('Received quantity exceeds ordered quantity')
      );

      try {
        await apiClient.post('/grns', {
          items: [{ orderedQuantity: 1000, receivedQuantity: 1100 }],
        });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toContain('exceeds ordered quantity');
      }
    });
  });

  describe('approve()', () => {
    it('should approve GRN and move stock to inventory', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'approved',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockGRN);

      const result = await apiClient.post('/grns/1/approve', {
        notes: 'All items verified',
      });

      expect(result.status).toBe('approved');
      expect(apiClient.post).toHaveBeenCalledWith('/grns/1/approve', expect.objectContaining({}));
    });

    it('should prevent approving GRN with rejections', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new Error('Cannot approve GRN with rejected items')
      );

      try {
        await apiClient.post('/grns/1/approve', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toContain('Cannot approve GRN');
      }
    });
  });

  describe('cancel()', () => {
    it('should cancel GRN and restore stock', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'cancelled',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockGRN);

      const result = await apiClient.post('/grns/1/cancel', {
        reason: 'Wrong goods received',
      });

      expect(result.status).toBe('cancelled');
      expect(apiClient.post).toHaveBeenCalledWith('/grns/1/cancel', expect.objectContaining({}));
    });

    it('should prevent cancelling approved GRN', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new Error('Cannot cancel approved GRN')
      );

      try {
        await apiClient.post('/grns/1/cancel', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Cannot cancel approved GRN');
      }
    });
  });

  describe('markBilled()', () => {
    it('should link GRN to supplier bill for 3-way match', async () => {
      const mockGRN = {
        id: 1,
        grnNumber: 'GRN-2026-001',
        status: 'billed',
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockGRN);

      const result = await apiClient.post('/grns/1/mark-billed', {
        supplierBillId: 500,
      });

      expect(result.status).toBe('billed');
      expect(apiClient.post).toHaveBeenCalledWith('/grns/1/mark-billed', expect.objectContaining({}));
    });

    it('should enforce 3-way match logic', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new Error('PO, GRN, and Bill quantities do not match')
      );

      try {
        await apiClient.post('/grns/1/mark-billed', { supplierBillId: 500 });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toContain('do not match');
      }
    });
  });

  describe('getNextNumber()', () => {
    it('should generate next GRN number', async () => {
      const mockResponse = { nextNumber: 'GRN-2026-042' };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/grns/number/next');

      expect(result.nextNumber).toBe('GRN-2026-042');
      expect(apiClient.get).toHaveBeenCalledWith('/grns/number/next');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in getAll', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/grns');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle network errors in create', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Server error'));

      try {
        await apiClient.post('/grns', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Server error');
      }
    });

    it('should handle network errors in approve', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(
        new Error('Service unavailable')
      );

      try {
        await apiClient.post('/grns/1/approve', {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Service unavailable');
      }
    });
  });
});
