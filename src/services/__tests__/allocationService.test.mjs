/**
 * Allocation Service Unit Tests (Node Native Test Runner)
 * Tests FIFO batch allocation logic and stock availability
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('allocationService', () => {
  afterEach(() => {
    sinon.restore();
  });

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
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
        hasStock: true,
      });

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[0].batchNumber, 'BATCH-001');
      assert.strictEqual(result.data[0].remaining, 50);
    });

    test('should return empty array when no stock available', async () => {
      const mockResponse = { data: [] };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      assert.strictEqual(result.data.length, 0);
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
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      assert.strictEqual(result.data[0].expiry, '2026-10-15');
      assert.strictEqual(result.data[1].expiry, '2026-12-31');
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
        ],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].batchNumber, 'VALID-001');
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
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/stock-batches/available', {
        productId: 1,
        warehouseId: 1,
      });

      assert.strictEqual(result.data[0].costPrice, 1000);
    });
  });

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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 50,
      });

      assert.strictEqual(result.data.totalAllocated, 50);
      assert.strictEqual(result.data.unallocated, 0);
      assert.strictEqual(result.data.allocations.length, 1);
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 150,
      });

      assert.strictEqual(result.data.allocations.length, 2);
      assert.strictEqual(result.data.totalAllocated, 150);
      assert.strictEqual(result.data.allocations[0].batchNumber, 'BATCH-001');
      assert.strictEqual(result.data.allocations[1].batchNumber, 'BATCH-002');
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 200,
      });

      assert.strictEqual(result.data.totalAllocated, 150);
      assert.strictEqual(result.data.unallocated, 50);
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 100,
      });

      assert.strictEqual(result.data.allocations.length, 0);
      assert.strictEqual(result.data.unallocated, 100);
    });

    test('should allocate FIFO (first in, first out by expiry date)', async () => {
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 150,
      });

      assert.strictEqual(result.data.allocations[0].expiry, '2026-10-15');
      assert.strictEqual(result.data.allocations[1].expiry, '2026-12-31');
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 150,
      });

      assert.strictEqual(result.data.allocations[0].source, 'LOCAL');
      assert.strictEqual(result.data.allocations[1].source, 'IMPORTED');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors on batch fetch', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/stock-batches/available', {
          productId: 1,
          warehouseId: 1,
        });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle allocation API errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Invalid product or warehouse'));

      try {
        await apiClient.post('/allocations/fifo', {
          productId: 999,
          warehouseId: 999,
          quantity: 100,
        });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid product or warehouse');
      }
    });

    test('should handle server errors (5xx)', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Internal Server Error'));

      try {
        await apiClient.get('/stock-batches/available', {
          productId: 1,
          warehouseId: 1,
        });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Internal Server Error');
      }
    });

    test('should handle authorization errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Unauthorized'));

      try {
        await apiClient.post('/allocations/fifo', {
          productId: 1,
          warehouseId: 1,
          quantity: 50,
        });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Unauthorized');
      }
    });
  });

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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 999999,
      });

      assert.strictEqual(result.data.totalAllocated, 999999);
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 50.5,
      });

      assert.strictEqual(result.data.requestedQuantity, 50.5);
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
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/allocations/fifo', {
        productId: 1,
        warehouseId: 1,
        quantity: 1,
      });

      assert.strictEqual(result.data.totalAllocated, 1);
    });
  });
});
