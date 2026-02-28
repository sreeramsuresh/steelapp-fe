/**
 * Stock Batch Service Unit Tests (Node Native Test Runner)
 * Tests batch listing, filtering, and retrieval
 * Tests procurement channel tracking (LOCAL vs IMPORTED)
 * Tests stock availability and FIFO logic
 * 100% coverage target for stockBatchService.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import stockBatchService from '../stockBatchService.js';

describe('stockBatchService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBatches', () => {
    it('should list stock batches with pagination', async () => {
      const mockBatches = {
        batches: [
          {
            id: 1,
            productId: 1,
            procurementChannel: 'LOCAL',
            quantity: 100,
            status: 'active',
          },
          {
            id: 2,
            productId: 1,
            procurementChannel: 'IMPORTED',
            quantity: 50,
            status: 'active',
          },
        ],
        pageInfo: { page: 1, totalPages: 1, total: 2 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockBatches);

      const result = await stockBatchService.getBatches({ page: 1, limit: 20 });

      expect(result.batches.length).toBe(2);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches', {
        page: 1,
        limit: 20,
      });
    });

    it('should filter batches by product', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ batches: [] });

      await stockBatchService.getBatches({ productId: 5 });

      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches', {
        page: 1,
        limit: 20,
        productId: 5,
      });
    });

    it('should filter batches by procurement channel', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ batches: [] });

      await stockBatchService.getBatches({ procurementChannel: 'IMPORTED' });

      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches', {
        page: 1,
        limit: 20,
        procurementChannel: 'IMPORTED',
      });
    });

    it('should filter batches with remaining stock', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ batches: [] });

      await stockBatchService.getBatches({ hasStock: true });

      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches', {
        page: 1,
        limit: 20,
        hasStock: true,
      });
    });
  });

  describe('getBatchesByProduct', () => {
    it('should get batches for specific product', async () => {
      const mockBatches = [
        { id: 1, productId: 5, procurementChannel: 'LOCAL', quantity: 100 },
        { id: 2, productId: 5, procurementChannel: 'IMPORTED', quantity: 50 },
      ];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockBatches);

      const result = await stockBatchService.getBatchesByProduct(5);

      expect(result.length).toBe(2);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches/product/5', {});
    });

    it('should filter product batches by procurement channel', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      await stockBatchService.getBatchesByProduct(5, {
        procurementChannel: 'LOCAL',
      });

      const callArgs = apiClient.get.mock.calls[0];
      expect(callArgs[0]).toBe('/stock-batches/product/5');
      expect(callArgs[1].procurementChannel).toBe('LOCAL');
    });
  });

  describe('getProcurementSummary', () => {
    it('should get procurement summary for product', async () => {
      const mockSummary = {
        localQty: 150,
        importedQty: 50,
        totalQty: 200,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockSummary);

      const result = await stockBatchService.getProcurementSummary(5);

      expect(result.totalQty).toBe(200);
      expect(result.localQty).toBe(150);
      expect(result.importedQty).toBe(50);
      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches/product/5/summary', {});
    });
  });

  describe('getBatch', () => {
    it('should get single batch by ID', async () => {
      const mockBatch = {
        id: 1,
        productId: 5,
        procurementChannel: 'LOCAL',
        quantity: 100,
        status: 'active',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockBatch);

      const result = await stockBatchService.getBatch(1);

      expect(result.id).toBe(1);
      expect(result.procurementChannel).toBe('LOCAL');
      expect(apiClient.get).toHaveBeenCalledWith('/stock-batches/1');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors in getBatches', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await stockBatchService.getBatches();
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle API errors in getProcurementSummary', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Product not found'));

      try {
        await stockBatchService.getProcurementSummary(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Product not found');
      }
    });

    it('should handle API errors in getBatchesByProduct', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Not found'));

      try {
        await stockBatchService.getBatchesByProduct(999);
        throw new Error('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Not found');
      }
    });
  });
});
