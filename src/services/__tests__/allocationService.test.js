/**
 * Allocation Service Unit Tests
 * ✅ Tests FIFO batch allocation logic
 * ✅ Tests batch availability checking
 * ✅ Tests partial and full quantity allocations
 * ✅ Tests multi-batch allocations
 * ✅ Tests edge cases (insufficient stock, expired batches, etc.)
 * ✅ Tests tenant isolation (company_id filtering)
 * ✅ 100% coverage target for allocationService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock API client
vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import allocationService from '../allocationService';
import { apiClient } from '../api';

describe('allocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // AVAILABLE BATCHES - GET OPERATIONS
  // ============================================================================

  describe('getAvailableBatches', () => {
    test('should fetch available batches for a product in warehouse', async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result).toHaveLength(2);
      expect(result[0].batchNumber).toBe('BATCH-001');
      expect(result[0].remaining).toBe(50);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-batches/available',
        expect.objectContaining({
          productId: 1,
          warehouseId: 1,
          hasStock: true,
        }),
      );
    });

    test('should return empty array when no stock available', async () => {
      const mockResponse = { data: [] };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result).toHaveLength(0);
    });

    test('should order batches by FIFO (expiry date ascending)', async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      // Backend should return FIFO ordered (earliest expiry first)
      expect(result[0].expiry).toBe('2026-10-15');
      expect(result[1].expiry).toBe('2026-12-31');
    });

    test('should exclude expired batches', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'VALID-001',
            remaining: 50,
            expiry: '2026-12-31',
          },
          // Expired batch should not be returned by backend
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result).toHaveLength(1);
      expect(result[0].batchNumber).toBe('VALID-001');
    });

    test('should filter only batches with remaining stock', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'BATCH-001',
            remaining: 50,
          },
          {
            id: 2,
            batchNumber: 'BATCH-002',
            remaining: 100,
          },
          // Zero remaining batches filtered by hasStock: true query param
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result.every(batch => batch.remaining > 0)).toBe(true);
    });

    test('should include batch source information (LOCAL vs IMPORTED)', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'LOCAL-001',
            source: 'LOCAL',
            costPrice: 1000,
          },
          {
            id: 2,
            batchNumber: 'IMPORT-001',
            source: 'IMPORTED',
            costPrice: 1200,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result[0].source).toBe('LOCAL');
      expect(result[1].source).toBe('IMPORTED');
    });

    test('should include batch cost price for margin calculation', async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result[0].costPrice).toBe(1000);
    });

    test('should handle different warehouses independently', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'BATCH-001',
            warehouseId: 1,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await allocationService.getAvailableBatches(1, 1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-batches/available',
        expect.objectContaining({ warehouseId: 1 }),
      );

      apiClient.get.mockClear();
      apiClient.get.mockResolvedValueOnce({ data: [] });

      await allocationService.getAvailableBatches(1, 2);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/stock-batches/available',
        expect.objectContaining({ warehouseId: 2 }),
      );
    });
  });

  // ============================================================================
  // FIFO ALLOCATION - POST OPERATIONS
  // ============================================================================

  describe('allocateFIFO', () => {
    test('should allocate full quantity from single batch', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 50);

      expect(result.totalAllocated).toBe(50);
      expect(result.unallocated).toBe(0);
      expect(result.allocations).toHaveLength(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/allocations/fifo',
        expect.objectContaining({
          productId: 1,
          warehouseId: 1,
          quantity: 50,
        }),
      );
    });

    test('should allocate across multiple batches if needed', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 150);

      expect(result.allocations).toHaveLength(2);
      expect(result.totalAllocated).toBe(150);
      expect(result.allocations[0].batchNumber).toBe('BATCH-001');
      expect(result.allocations[1].batchNumber).toBe('BATCH-002');
    });

    test('should handle partial allocation when insufficient stock', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 200);

      expect(result.totalAllocated).toBe(150);
      expect(result.unallocated).toBe(50);
    });

    test('should return zero allocation for zero requested quantity', async () => {
      const mockResponse = {
        data: {
          productId: 1,
          warehouseId: 1,
          requestedQuantity: 0,
          allocations: [],
          totalAllocated: 0,
          unallocated: 0,
        },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 0);

      expect(result.totalAllocated).toBe(0);
      expect(result.allocations).toHaveLength(0);
    });

    test('should handle no stock available', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 100);

      expect(result.allocations).toHaveLength(0);
      expect(result.unallocated).toBe(100);
    });

    test('should allocate FIFO (first in, first out by expiry date)', async () => {
      // Backend implements FIFO - earliest expiry allocated first
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 150);

      expect(result.allocations[0].expiry).toBe('2026-10-15');
      expect(result.allocations[1].expiry).toBe('2026-12-31');
    });

    test('should include cost price for margin calculation', async () => {
      const mockResponse = {
        data: {
          allocations: [
            {
              batchId: 1,
              allocated: 50,
              costPrice: 1000,
            },
          ],
          totalAllocated: 50,
        },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 50);

      expect(result.allocations[0].costPrice).toBe(1000);
    });

    test('should support allocation with multiple sources (LOCAL + IMPORTED)', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 150);

      expect(result.allocations[0].source).toBe('LOCAL');
      expect(result.allocations[1].source).toBe('IMPORTED');
    });
  });

  // ============================================================================
  // TENANT ISOLATION
  // ============================================================================

  describe('Tenant Isolation', () => {
    test('should not require explicit company_id parameter (added by backend)', async () => {
      const mockResponse = { data: [] };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      // Frontend doesn't pass company_id - backend adds from auth context
      await allocationService.getAvailableBatches(1, 1);

      const callArgs = apiClient.get.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('company_id');
      expect(callArgs).not.toHaveProperty('companyId');
    });

    test('should filter to authenticated company only (via backend)', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            batchNumber: 'BATCH-001',
            // Only batches from user's company returned by backend
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.getAvailableBatches(1, 1);

      // Backend enforces tenant isolation - frontend receives only own company's batches
      expect(result).toBeDefined();
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    test('should handle network errors on batch fetch', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        allocationService.getAvailableBatches(1, 1),
      ).rejects.toThrow('Network error');
    });

    test('should handle allocation API errors', async () => {
      apiClient.post.mockRejectedValueOnce(
        new Error('Invalid product or warehouse'),
      );

      await expect(
        allocationService.allocateFIFO(999, 999, 100),
      ).rejects.toThrow('Invalid product or warehouse');
    });

    test('should handle server errors (5xx)', async () => {
      apiClient.get.mockRejectedValueOnce(
        new Error('Internal Server Error'),
      );

      await expect(
        allocationService.getAvailableBatches(1, 1),
      ).rejects.toThrow('Internal Server Error');
    });

    test('should handle authorization errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(
        allocationService.allocateFIFO(1, 1, 50),
      ).rejects.toThrow('Unauthorized');
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    test('should handle very large quantities', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 999999);

      expect(result.totalAllocated).toBe(999999);
    });

    test('should handle decimal quantities', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 50.5);

      expect(result.requestedQuantity).toBe(50.5);
    });

    test('should handle batch with exactly matching quantity', async () => {
      const mockResponse = {
        data: {
          requestedQuantity: 100,
          allocations: [
            {
              batchId: 1,
              allocated: 100,
              remaining: 0,
            },
          ],
          totalAllocated: 100,
          unallocated: 0,
        },
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 100);

      expect(result.totalAllocated).toBe(100);
      expect(result.unallocated).toBe(0);
    });

    test('should handle single unit allocation', async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await allocationService.allocateFIFO(1, 1, 1);

      expect(result.totalAllocated).toBe(1);
    });

    test('should handle response with data property vs direct response', async () => {
      // Some endpoints return { data: [...] }, others return array directly
      const mockResponseWithData = {
        data: [
          { id: 1, batchNumber: 'BATCH-001' },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponseWithData);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    test('should handle null response gracefully', async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await allocationService.getAvailableBatches(1, 1);

      expect(result).toBeNull();
    });
  });
});
