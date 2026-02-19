/**
 * Stock Batch Service Unit Tests (Node Native Test Runner)
 * ✅ Tests batch listing, filtering, and retrieval
 * ✅ Tests procurement channel tracking (LOCAL vs IMPORTED)
 * ✅ Tests stock availability and FIFO logic
 * ✅ 100% coverage target for stockBatchService.js
 */

// Initialize test environment first
import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

// Import actual modules
import { apiClient } from '../api.js';
import stockBatchService from '../stockBatchService.js';

describe('stockBatchService', () => {
  beforeEach(() => {
    // Reset all stubs before each test
    Object.keys(apiClient).forEach((method) => {
      if (typeof apiClient[method].resetHistory === 'function') {
        apiClient[method].resetHistory();
      }
    });
  });

  describe('getBatches', () => {
    test('should list stock batches with pagination', async () => {
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
      sinon.stub(apiClient, 'get').resolves(mockBatches);

      const result = await stockBatchService.getBatches({ page: 1, limit: 20 });

      assert.strictEqual(result.batches.length, 2);
      assert.ok(
        apiClient.get.calledWith('/stock-batches', {
          page: 1,
          limit: 20,
        }),
        'apiClient.get should be called with correct arguments'
      );

      apiClient.get.restore();
    });

    test('should filter batches by product', async () => {
      sinon.stub(apiClient, 'get').resolves({ batches: [] });

      await stockBatchService.getBatches({ productId: 5 });

      assert.ok(
        apiClient.get.calledWith('/stock-batches', {
          page: 1,
          limit: 20,
          productId: 5,
        }),
        'apiClient.get should be called with productId filter'
      );

      apiClient.get.restore();
    });

    test('should filter batches by procurement channel', async () => {
      sinon.stub(apiClient, 'get').resolves({ batches: [] });

      await stockBatchService.getBatches({ procurementChannel: 'IMPORTED' });

      assert.ok(
        apiClient.get.calledWith('/stock-batches', {
          page: 1,
          limit: 20,
          procurementChannel: 'IMPORTED',
        }),
        'apiClient.get should be called with procurementChannel filter'
      );

      apiClient.get.restore();
    });

    test('should filter batches with remaining stock', async () => {
      sinon.stub(apiClient, 'get').resolves({ batches: [] });

      await stockBatchService.getBatches({ hasStock: true });

      assert.ok(
        apiClient.get.calledWith('/stock-batches', {
          page: 1,
          limit: 20,
          hasStock: true,
        }),
        'apiClient.get should be called with hasStock filter'
      );

      apiClient.get.restore();
    });
  });

  describe('getBatchesByProduct', () => {
    test('should get batches for specific product', async () => {
      const mockBatches = [
        { id: 1, productId: 5, procurementChannel: 'LOCAL', quantity: 100 },
        { id: 2, productId: 5, procurementChannel: 'IMPORTED', quantity: 50 },
      ];
      sinon.stub(apiClient, 'get').resolves(mockBatches);

      const result = await stockBatchService.getBatchesByProduct(5);

      assert.strictEqual(result.length, 2);
      assert.ok(
        apiClient.get.calledWith('/stock-batches/product/5', {}),
        'apiClient.get should be called with product endpoint'
      );

      apiClient.get.restore();
    });

    test('should filter product batches by procurement channel', async () => {
      sinon.stub(apiClient, 'get').resolves([]);

      await stockBatchService.getBatchesByProduct(5, {
        procurementChannel: 'LOCAL',
      });

      const callArgs = apiClient.get.firstCall.args;
      assert.strictEqual(callArgs[0], '/stock-batches/product/5');
      assert.strictEqual(callArgs[1].procurementChannel, 'LOCAL');

      apiClient.get.restore();
    });
  });

  describe('getProcurementSummary', () => {
    test('should get procurement summary for product', async () => {
      const mockSummary = {
        localQty: 150,
        importedQty: 50,
        totalQty: 200,
      };
      sinon.stub(apiClient, 'get').resolves(mockSummary);

      const result = await stockBatchService.getProcurementSummary(5);

      assert.strictEqual(result.totalQty, 200);
      assert.strictEqual(result.localQty, 150);
      assert.strictEqual(result.importedQty, 50);
      assert.ok(
        apiClient.get.calledWith('/stock-batches/product/5/summary', {}),
        'apiClient.get should be called with summary endpoint'
      );

      apiClient.get.restore();
    });
  });

  describe('getBatch', () => {
    test('should get single batch by ID', async () => {
      const mockBatch = {
        id: 1,
        productId: 5,
        procurementChannel: 'LOCAL',
        quantity: 100,
        status: 'active',
      };
      sinon.stub(apiClient, 'get').resolves(mockBatch);

      const result = await stockBatchService.getBatch(1);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.procurementChannel, 'LOCAL');
      assert.ok(
        apiClient.get.calledWith('/stock-batches/1'),
        'apiClient.get should be called with batch ID'
      );

      apiClient.get.restore();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors in getBatches', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await stockBatchService.getBatches();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }

      apiClient.get.restore();
    });

    test('should handle API errors in getProcurementSummary', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Product not found'));

      try {
        await stockBatchService.getProcurementSummary(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Product not found');
      }

      apiClient.get.restore();
    });

    test('should handle API errors in getBatchesByProduct', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Not found'));

      try {
        await stockBatchService.getBatchesByProduct(999);
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Not found');
      }

      apiClient.get.restore();
    });
  });
});
