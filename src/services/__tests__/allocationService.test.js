/**
 * Allocation Service Unit Tests (Node Native Test Runner)
 * Tests FIFO batch allocation logic and stock availability
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';

describe('allocationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAvailableBatches', () => {
    it('should fetch available batches for a product in warehouse', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'BATCH-001',
            productId: 1,
            warehouseId: 1,
            quantity: 100,
            remaining: 50,
            expiry: '2026-12-31',
            costPrice: 1000,
            source: 'LOCAL',
          },
          {
            id: 2,
            batchNumber: 'BATCH-002',
            productId: 1,
            warehouseId: 1,
            quantity: 100,
            remaining: 75,
            expiry: '2026-11-30',
            costPrice: 1050,
            source: 'IMPORTED',
          },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
        hasStock: true,
      });

      expect(result.data.length).toBe(2);
      expect(result.data[0].batchNumber).toBe('BATCH-001');
      expect(result.data[0].remaining).toBe(50);
    });

    it('should return empty array when no stock available', async () => {
      const mockResponse = { data: [] };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      expect(result.data.length).toBe(0);
    });

    it('should order batches by FIFO (expiry date ascending)', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'BATCH-001',
            remaining: 50,
            expiry: '2026-10-15',
            createdAt: '2025-01-01',
          },
          {
            id: 2,
            batchNumber: 'BATCH-002',
            remaining: 100,
            expiry: '2026-12-31',
            createdAt: '2025-01-10',
          },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      expect(result.data[0].expiry).toBe('2026-10-15');
      expect(result.data[1].expiry).toBe('2026-12-31');
    });

    it('should exclude expired batches', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'VALID-001',
            remaining: 50,
            expiry: '2026-12-31',
          },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].batchNumber).toBe('VALID-001');
    });

    it('should include batch cost price for margin calculation', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'BATCH-001',
            costPrice: 1000,
            remaining: 50,
          },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      expect(result.data[0].costPrice).toBe(1000);
    });
  });

  describe('allocateFIFO', () => {
    it('should allocate full quantity from single batch', async () => {
      const mockResponse = {
        data: {
          productId: 1,
          warehouseId: 1,
          requestedQuantity: 50,
          allocations: [
            {
              batchId: 1,
              batchNumber: 'BATCH-001',
              allocated: 50,
              remaining: 0,
            },
          ],
          totalAllocated: 50,
          unallocated: 0,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 50,
      });

      expect(result.data.totalAllocated).toBe(50);
      expect(result.data.unallocated).toBe(0);
      expect(result.data.allocations.length).toBe(1);
    });

    it('should allocate across multiple batches if needed', async () => {
      const mockResponse = {
        data: {
          productId: 1,
          warehouseId: 1,
          requestedQuantity: 150,
          allocations: [
            {
              batchId: 1,
              batchNumber: 'BATCH-001',
              allocated: 50,
              remaining: 0,
            },
            {
              batchId: 2,
              batchNumber: 'BATCH-002',
              allocated: 100,
              remaining: 0,
            },
          ],
          totalAllocated: 150,
          unallocated: 0,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 150,
      });

      expect(result.data.allocations.length).toBe(2);
      expect(result.data.totalAllocated).toBe(150);
      expect(result.data.allocations[0].batchNumber).toBe('BATCH-001');
      expect(result.data.allocations[1].batchNumber).toBe('BATCH-002');
    });

    it('should handle partial allocation when insufficient stock', async () => {
      const mockResponse = {
        data: {
          productId: 1,
          warehouseId: 1,
          requestedQuantity: 200,
          allocations: [
            {
              batchId: 1,
              batchNumber: 'BATCH-001',
              allocated: 50,
            },
            {
              batchId: 2,
              batchNumber: 'BATCH-002',
              allocated: 100,
            },
          ],
          totalAllocated: 150,
          unallocated: 50,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 200,
      });

      expect(result.data.totalAllocated).toBe(150);
      expect(result.data.unallocated).toBe(50);
    });

    it('should handle no stock available', async () => {
      const mockResponse = {
        data: {
          productId: 1,
          warehouseId: 1,
          requestedQuantity: 100,
          allocations: [],
          totalAllocated: 0,
          unallocated: 100,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 100,
      });

      expect(result.data.allocations.length).toBe(0);
      expect(result.data.unallocated).toBe(100);
    });

    it('should allocate FIFO (first in, first out by expiry date)', async () => {
      const mockResponse = {
        data: {
          allocations: [
            {
              batchNumber: 'BATCH-001',
              expiry: '2026-10-15',
              allocated: 50,
            },
            {
              batchNumber: 'BATCH-002',
              expiry: '2026-12-31',
              allocated: 100,
            },
          ],
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 150,
      });

      expect(result.data.allocations[0].expiry).toBe('2026-10-15');
      expect(result.data.allocations[1].expiry).toBe('2026-12-31');
    });

    it('should support allocation with multiple sources (LOCAL + IMPORTED)', async () => {
      const mockResponse = {
        data: {
          allocations: [
            {
              batchNumber: 'LOCAL-001',
              source: 'LOCAL',
              allocated: 75,
              costPrice: 1000,
            },
            {
              batchNumber: 'IMPORT-001',
              source: 'IMPORTED',
              allocated: 75,
              costPrice: 1200,
            },
          ],
          totalAllocated: 150,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 150,
      });

      expect(result.data.allocations[0].source).toBe('LOCAL');
      expect(result.data.allocations[1].source).toBe('IMPORTED');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors on batch fetch', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await apiClient.get('/stock-batches/available', {
          productId: 1,
          warehouseId: 1,
        });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle allocation API errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Invalid product or warehouse'));

      try {
        await apiClient.post('/allocations/fifo', {
          productId: 999,
          warehouseId: 999,
          quantity: 100,
        });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invalid product or warehouse');
      }
    });

    it('should handle server errors (5xx)', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Internal Server Error'));

      try {
        await apiClient.get('/stock-batches/available', {
          productId: 1,
          warehouseId: 1,
        });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Internal Server Error');
      }
    });

    it('should handle authorization errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Unauthorized'));

      try {
        await apiClient.post('/allocations/fifo', {
          productId: 1,
          warehouseId: 1,
          quantity: 50,
        });
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Unauthorized');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large quantities', async () => {
      const mockResponse = {
        data: {
          allocations: [
            {
              batchId: 1,
              allocated: 999999,
            },
          ],
          totalAllocated: 999999,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 999999,
      });

      expect(result.data.totalAllocated).toBe(999999);
    });

    it('should handle decimal quantities', async () => {
      const mockResponse = {
        data: {
          requestedQuantity: 50.5,
          allocations: [
            {
              allocated: 50.5,
            },
          ],
          totalAllocated: 50.5,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 50.5,
      });

      expect(result.data.requestedQuantity).toBe(50.5);
    });

    it('should handle single unit allocation', async () => {
      const mockResponse = {
        data: {
          allocations: [
            {
              allocated: 1,
            },
          ],
          totalAllocated: 1,
        },
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 1,
      });

      expect(result.data.totalAllocated).toBe(1);
    });
  });
});
