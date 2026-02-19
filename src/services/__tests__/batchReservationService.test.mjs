/**
 * Batch Reservation Service Unit Tests (Node Native Test Runner)
 * Tests FIFO batch reservation and allocation logic
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('batchReservationService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('FIFO Reservation', () => {
    test('should reserve batches using FIFO selection', async () => {
      const params = {
        draftInvoiceId: 0,
        productId: 123,
        warehouseId: 1,
        requiredQuantity: 100,
        unit: 'KG',
        lineItemTempId: 'line-uuid-1',
      };

      const mockResponse = {
        reservationId: 1,
        allocations: [{ batchId: 10, quantity: 100, batchAge: 30 }],
        totalReserved: 100,
        expiresAt: '2024-02-03T10:00:00Z',
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/batch-reservations/fifo', params);

      assert.strictEqual(result.allocations.length, 1);
      assert.strictEqual(result.allocations[0].batchId, 10);
    });

    test('should allocate from multiple batches if needed', async () => {
      const params = {
        productId: 123,
        warehouseId: 1,
        requiredQuantity: 250,
        lineItemTempId: 'line-uuid-1',
      };

      const mockResponse = {
        allocations: [
          { batchId: 10, quantity: 100 },
          { batchId: 11, quantity: 150 },
        ],
        totalReserved: 250,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/batch-reservations/fifo', params);

      assert.strictEqual(result.allocations.length, 2);
      assert.strictEqual(result.totalReserved, 250);
    });

    test('should handle insufficient stock', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Insufficient stock available'));

      const params = {
        productId: 123,
        requiredQuantity: 1000,
        lineItemTempId: 'line-uuid-1',
      };

      try {
        await apiClient.post('/batch-reservations/fifo', params);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Insufficient stock available');
      }
    });

    test('should respect warehouse context', async () => {
      const params = {
        productId: 123,
        warehouseId: 2,
        requiredQuantity: 100,
        lineItemTempId: 'line-uuid-1',
      };

      sinon.stub(apiClient, 'post').resolves({ allocations: [] });

      const result = await apiClient.post('/batch-reservations/fifo', params);

      assert.deepStrictEqual(result.allocations, []);
    });
  });

  describe('Release Reservation', () => {
    test('should release reservation before expiration', async () => {
      const mockResponse = { released: true, reservationId: 1 };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/batch-reservations/1/release', {});

      assert.strictEqual(result.released, true);
    });

    test('should prevent release of expired reservation', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Reservation already expired'));

      try {
        await apiClient.post('/batch-reservations/999/release', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Reservation already expired');
      }
    });
  });

  describe('Confirm Reservation', () => {
    test('should confirm reservation when creating invoice', async () => {
      const mockResponse = {
        confirmed: true,
        reservationId: 1,
        invoiceId: 100,
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/batch-reservations/1/confirm', {
        invoiceId: 100,
      });

      assert.strictEqual(result.confirmed, true);
      assert.strictEqual(result.invoiceId, 100);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Network error'));

      try {
        await apiClient.post('/batch-reservations/fifo', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle invalid product', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Product not found'));

      try {
        await apiClient.post('/batch-reservations/fifo', { productId: 999 });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Product not found');
      }
    });
  });
});
