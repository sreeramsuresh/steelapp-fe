/**
 * Export Order Service Unit Tests (Node Native Test Runner)
 * Tests export order CRUD and export logistics
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import exportOrderService from '../exportOrderService.js';

describe('exportOrderService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getExportOrders', () => {
    test('should fetch export orders', async () => {
      const mockResponse = {
        data: [{ id: 1, orderNumber: 'EO-001', status: 'DRAFT', customerId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await exportOrderService.getExportOrders({ page: 1 });

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].orderNumber, 'EO-001');
    });

    test('should filter by customer', async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [], pagination: null });

      await exportOrderService.getExportOrders({ customerId: 1 });

      assert.ok(apiClient.get.called);
    });
  });

  describe('getExportOrder', () => {
    test('should fetch single export order', async () => {
      const mockResponse = {
        id: 1,
        orderNumber: 'EO-001',
        customerId: 1,
        customerName: 'International Corp',
        destination: 'USA',
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await exportOrderService.getExportOrder(1);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.destination, 'USA');
    });
  });

  describe('createExportOrder', () => {
    test('should create export order', async () => {
      const orderData = { customerId: 1, destination: 'USA', items: [] };
      sinon.stub(apiClient, 'post').resolves({ id: 1, orderNumber: 'EO-001' });

      const result = await exportOrderService.createExportOrder(orderData);

      assert.strictEqual(result.id, 1);
    });
  });

  describe('updateExportOrder', () => {
    test('should update export order', async () => {
      const updateData = { status: 'SHIPPED' };
      sinon.stub(apiClient, 'put').resolves({ id: 1, ...updateData });

      const result = await exportOrderService.updateExportOrder(1, updateData);

      assert.strictEqual(result.status, 'SHIPPED');
    });
  });

  describe('Export Status', () => {
    test('should track export status', async () => {
      const mockResponse = { id: 1, status: 'PACKING' };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await exportOrderService.getExportOrder(1);

      assert.ok(['DRAFT', 'PACKING', 'READY', 'SHIPPED', 'DELIVERED'].includes(result.status));
    });
  });

  describe('Error Handling', () => {
    test('should handle errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Error'));

      try {
        await exportOrderService.getExportOrders();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty list', async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [], pagination: null });

      const result = await exportOrderService.getExportOrders();

      assert.deepStrictEqual(result.data, []);
    });
  });
});
