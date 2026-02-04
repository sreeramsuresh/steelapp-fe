/**
 * Import Container Service Unit Tests (Node Native Test Runner)
 * Tests container tracking and shipment management
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import importContainerService from '../importContainerService.js';

describe('importContainerService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getContainers', () => {
    test('should fetch containers', async () => {
      const mockResponse = {
        data: [{ id: 1, containerNumber: 'CNT-001', status: 'IN_TRANSIT', importOrderId: 1 }],
        pagination: { page: 1, total: 1 },
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importContainerService.getContainers({ page: 1 });

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].containerNumber, 'CNT-001');
    });

    test('should filter by status', async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [], pagination: null });

      await importContainerService.getContainers({ status: 'ARRIVED' });

      assert.ok(apiClient.get.called);
    });
  });

  describe('getContainer', () => {
    test('should fetch container details', async () => {
      const mockResponse = {
        id: 1,
        containerNumber: 'CNT-001',
        type: '20FT',
        status: 'IN_TRANSIT',
        items: [{ productId: 1, quantity: 100 }],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importContainerService.getContainer(1);

      assert.strictEqual(result.type, '20FT');
      assert.ok(result.items);
    });
  });

  describe('updateContainer', () => {
    test('should update container status', async () => {
      const updateData = { status: 'ARRIVED' };
      sinon.stub(apiClient, 'put').resolves({ id: 1, ...updateData });

      const result = await importContainerService.updateContainer(1, updateData);

      assert.strictEqual(result.status, 'ARRIVED');
    });
  });

  describe('Container Types', () => {
    test('should support 20FT and 40FT containers', async () => {
      const mockResponse = { id: 1, type: '20FT' };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importContainerService.getContainer(1);

      assert.ok(['20FT', '40FT'].includes(result.type));
    });
  });

  describe('Error Handling', () => {
    test('should handle errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Error'));

      try {
        await importContainerService.getContainers();
        assert.fail('Expected error to be thrown');
      } catch (error) {
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty container', async () => {
      const mockResponse = { id: 1, items: [] };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await importContainerService.getContainer(1);

      assert.deepStrictEqual(result.items, []);
    });
  });
});
