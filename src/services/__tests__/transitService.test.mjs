/**
 * Transit Service Unit Tests (Node Native Test Runner)
 * Tests shipment tracking and transit status management
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { transitService } from '../transitService.js';

describe('transitService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getAll', () => {
    test('should fetch all items in transit', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            type: 'shipment',
            origin: 'Shanghai',
            destination: 'Dubai',
            status: 'in_transit',
          },
        ],
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await transitService.getAll({ page: 1 });

      assert.ok(result.data);
      assert.ok(apiClient.get.calledWith('/transit', sinon.match.any));
    });

    test('should support parameters', async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await transitService.getAll({ page: 2, limit: 50 });

      assert.ok(apiClient.get.called);
    });
  });

  describe('getTracking', () => {
    test('should fetch transit tracking for specific item', async () => {
      const mockResponse = {
        id: 1,
        type: 'shipment',
        status: 'in_transit',
        location: 'Port of Singapore',
        expected_arrival: '2024-01-20',
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await transitService.getTracking('shipment', 1);

      assert.strictEqual(result.status, 'in_transit');
      assert.ok(apiClient.get.calledWith('/transit/shipment/1'));
    });

    test('should handle different item types', async () => {
      sinon.stub(apiClient, 'get').resolves({ status: 'in_transit' });

      await transitService.getTracking('purchase_order', 5);

      assert.ok(apiClient.get.calledWith('/transit/purchase_order/5'));
    });
  });

  describe('updateStatus', () => {
    test('should update transit status', async () => {
      const mockResponse = {
        id: 1,
        type: 'shipment',
        status: 'arrived',
        updated_at: '2024-01-20T10:00:00Z',
      };

      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await transitService.updateStatus('shipment', 1, 'arrived');

      assert.strictEqual(result.status, 'arrived');
      assert.ok(
        apiClient.patch.calledWith('/transit/shipment/1/status', { status: 'arrived' })
      );
    });

    test('should handle status changes', async () => {
      sinon.stub(apiClient, 'patch').resolves({ status: 'in_transit' });

      await transitService.updateStatus('invoice', 2, 'in_transit');

      assert.ok(apiClient.patch.calledWith('/transit/invoice/2/status', sinon.match.any));
    });
  });
});
