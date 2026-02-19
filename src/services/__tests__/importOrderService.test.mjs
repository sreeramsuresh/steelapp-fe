/**
 * Import Order Service Unit Tests (Node Native Test Runner)
 * Tests import order CRUD, status management, container tracking
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import importOrderService from '../importOrderService.js';

describe('importOrderService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getImportOrders', () => {
    test('should fetch import orders', async () => {
      const mockResponse = {
        data: [{ id: 1, orderNumber: 'IO-001', status: 'PENDING', supplierId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importOrderService.getImportOrders({ page: 1 });

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].orderNumber, 'IO-001');
    });

    test('should filter by status', async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [], pagination: null });

      await importOrderService.getImportOrders({ status: 'IN_TRANSIT' });

      assert.ok(apiClient.get.called);
    });
  });

  describe('getImportOrder', () => {
    test('should fetch single import order', async () => {
      const mockResponse = {
        id: 1,
        orderNumber: 'IO-001',
        supplierId: 1,
        supplierName: 'XYZ Trading',
        containers: [{ id: 1, containerNumber: 'CNT-001', status: 'ARRIVED' }],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      assert.strictEqual(result.id, 1);
      assert.ok(result.containers);
    });
  });

  describe('createImportOrder', () => {
    test('should create import order', async () => {
      const orderData = { supplierId: 1, supplierName: 'XYZ', items: [] };
      sinon.stub(apiClient, 'post').resolves({ id: 1, orderNumber: 'IO-001' });

      const result = await importOrderService.createImportOrder(orderData);

      assert.strictEqual(result.id, 1);
      assert.ok(apiClient.post.calledWith('/import-orders', sinon.match.any));
    });
  });

  describe('updateImportOrder', () => {
    test('should update import order', async () => {
      const updateData = { status: 'IN_TRANSIT' };
      sinon.stub(apiClient, 'put').resolves({ id: 1, ...updateData });

      const result = await importOrderService.updateImportOrder(1, updateData);

      assert.strictEqual(result.status, 'IN_TRANSIT');
    });
  });

  describe('Import Order Status', () => {
    test('should track order status transitions', async () => {
      const mockResponse = { id: 1, status: 'PENDING' };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      assert.ok(
        ['PENDING', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS', 'RECEIVED'].includes(result.status)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await importOrderService.getImportOrders();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty order items', async () => {
      const mockResponse = { id: 1, items: [] };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importOrderService.getImportOrder(1);

      assert.deepStrictEqual(result.items, []);
    });
  });
});
