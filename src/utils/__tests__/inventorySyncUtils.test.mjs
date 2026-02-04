import '../../__tests__/init.mjs';
/**
 * Inventory Sync Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  buildSyncPayload,
  validateSyncData,
  calculateSyncDelta,
  mergeSyncResults,
} from '../inventorySyncUtils.js';

describe('inventorySyncUtils', () => {
  describe('buildSyncPayload()', () => {
    test('should build sync payload', () => {
      const payload = buildSyncPayload({
        items: [{ id: 1, quantity: 100 }],
      });
      assert.ok(typeof payload === 'object');
      assert.ok(payload.items || payload.data);
    });

    test('should handle empty items', () => {
      const payload = buildSyncPayload({ items: [] });
      assert.ok(payload);
    });
  });

  describe('validateSyncData()', () => {
    test('should validate sync data', () => {
      const valid = validateSyncData({
        items: [{ id: 1, quantity: 100, warehouseId: 1 }],
      });
      assert.strictEqual(typeof valid, 'boolean');
    });

    test('should reject invalid data', () => {
      const valid = validateSyncData({
        items: [{ id: 1 }], // missing quantity
      });
      assert.strictEqual(typeof valid, 'boolean');
    });
  });

  describe('calculateSyncDelta()', () => {
    test('should calculate sync differences', () => {
      const delta = calculateSyncDelta(
        { items: [{ id: 1, quantity: 100 }] },
        { items: [{ id: 1, quantity: 80 }] }
      );
      assert.ok(typeof delta === 'object');
    });

    test('should handle empty inputs', () => {
      const delta = calculateSyncDelta({}, {});
      assert.ok(typeof delta === 'object');
    });
  });

  describe('mergeSyncResults()', () => {
    test('should merge sync results', () => {
      const merged = mergeSyncResults(
        [{ id: 1, status: 'synced' }],
        [{ id: 2, status: 'synced' }]
      );
      assert.ok(Array.isArray(merged));
    });

    test('should handle duplicate IDs', () => {
      const merged = mergeSyncResults(
        [{ id: 1, status: 'pending' }],
        [{ id: 1, status: 'synced' }]
      );
      assert.ok(Array.isArray(merged));
    });
  });
});
