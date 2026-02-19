/**
 * Inventory Synchronization Utilities - Comprehensive Unit Tests
 *
 * Tests cover:
 * - Cache lifecycle (set, get, expiry, clear)
 * - Data normalization with edge cases
 * - Stock calculation logic
 * - Status mapping consistency
 * - Synchronized refresh handling
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import {
  getCachedInventoryData,
  setCachedInventoryData,
  clearInventoryCache,
  normalizeInventoryData,
  triggerSynchronizedInventoryRefresh,
  calculateLowStockCount,
  getConsistentStockStatus,
} from '../inventorySyncUtils.js';

describe('inventorySyncUtils', () => {
  // ==========================================
  // Cache Management Tests
  // ==========================================

  describe('getCachedInventoryData & setCachedInventoryData', () => {
    beforeEach(() => clearInventoryCache());
    afterEach(() => clearInventoryCache());

    test('should return null when cache is empty', () => {
      const result = getCachedInventoryData();
      assert.strictEqual(result, null);
    });

    test('should store and retrieve data from cache', () => {
      const testData = { products: [{ id: 1, name: 'Steel Sheet' }] };
      setCachedInventoryData(testData);
      const result = getCachedInventoryData();
      assert.deepStrictEqual(result, testData);
    });

    test('should update cache when new data is set', () => {
      const data1 = { products: [{ id: 1 }] };
      const data2 = { products: [{ id: 2 }] };

      setCachedInventoryData(data1);
      assert.deepStrictEqual(getCachedInventoryData(), data1);

      setCachedInventoryData(data2);
      assert.deepStrictEqual(getCachedInventoryData(), data2);
    });

    test('should expire cache after TTL (30 seconds)', () => {
      const testData = { products: [{ id: 1 }] };

      // Use Sinon to stub Date.now() so we can control time
      const dateNowStub = sinon.stub(Date, 'now');
      try {
        // Initially, Date.now() returns 0
        dateNowStub.returns(0);

        // Set cache at time 0
        setCachedInventoryData(testData);

        // At time 0, cache should be valid (age = 0 - 0 = 0, which is < 30000)
        assert.deepStrictEqual(getCachedInventoryData(), testData);

        // Advance to 25 seconds (still within 30s TTL)
        dateNowStub.returns(25000);
        assert.deepStrictEqual(getCachedInventoryData(), testData);

        // Advance to 35 seconds (beyond 30s TTL)
        dateNowStub.returns(35000);
        // At time 35000, age = 35000 - 0 = 35000, which is >= 30000
        // So cache should be expired and cleared
        assert.strictEqual(getCachedInventoryData(), null);

        // Verify cache is actually cleared
        assert.strictEqual(getCachedInventoryData(), null);
      } finally {
        dateNowStub.restore();
      }
    });

    test('should handle null/undefined data gracefully', () => {
      setCachedInventoryData(null);
      assert.strictEqual(getCachedInventoryData(), null);

      clearInventoryCache();
      setCachedInventoryData(undefined);
      // Cache is cleared after undefined, so next call returns null
      assert.strictEqual(getCachedInventoryData(), null);
    });
  });

  describe('clearInventoryCache', () => {
    test('should clear all cached data', () => {
      const testData = { products: [{ id: 1 }] };
      setCachedInventoryData(testData);
      assert.deepStrictEqual(getCachedInventoryData(), testData);

      clearInventoryCache();
      assert.strictEqual(getCachedInventoryData(), null);
    });

    test('should allow new data to be cached after clearing', () => {
      setCachedInventoryData({ products: [{ id: 1 }] });
      clearInventoryCache();

      const newData = { products: [{ id: 2, name: 'Pipe' }] };
      setCachedInventoryData(newData);
      assert.deepStrictEqual(getCachedInventoryData(), newData);
    });
  });

  // ==========================================
  // Data Normalization Tests
  // ==========================================

  describe('normalizeInventoryData', () => {
    test('should normalize complete inventory data', () => {
      const rawData = {
        products: [{ id: 1, name: 'Sheet' }, { id: 2, name: 'Pipe' }],
        warehouses: [{ id: 'w1', name: 'Dubai' }],
        summary: {
          totalProducts: 2,
          lowStockCount: 3,
          outOfStockCount: 1,
          totalStockValue: 50000,
          warehouseCount: 1,
        },
      };

      const result = normalizeInventoryData(rawData);

      assert.deepStrictEqual(result.products, rawData.products);
      assert.deepStrictEqual(result.warehouses, rawData.warehouses);
      assert.deepStrictEqual(result.summary, rawData.summary);
      assert.ok(result.lastUpdated);
    });

    test('should handle missing arrays with defaults', () => {
      const rawData = {
        summary: { totalProducts: 0 },
        // products and warehouses missing
      };

      const result = normalizeInventoryData(rawData);

      assert.deepStrictEqual(result.products, []);
      assert.deepStrictEqual(result.warehouses, []);
    });

    test('should handle missing summary fields with defaults', () => {
      const rawData = {
        products: [],
        warehouses: [],
        summary: {}, // Empty summary
      };

      const result = normalizeInventoryData(rawData);

      assert.strictEqual(result.summary.totalProducts, 0);
      assert.strictEqual(result.summary.lowStockCount, 0);
      assert.strictEqual(result.summary.outOfStockCount, 0);
      assert.strictEqual(result.summary.totalStockValue, 0);
      assert.strictEqual(result.summary.warehouseCount, 0);
    });

    test('should return null for null/undefined input', () => {
      assert.strictEqual(normalizeInventoryData(null), null);
      assert.strictEqual(normalizeInventoryData(undefined), null);
    });

    test('should set lastUpdated to current ISO timestamp', () => {
      const before = new Date().toISOString();
      const result = normalizeInventoryData({ products: [] });
      const after = new Date().toISOString();

      assert.ok(result.lastUpdated >= before);
      assert.ok(result.lastUpdated <= after);
    });

    test('should convert non-array products to empty array', () => {
      const rawData = {
        products: 'not an array',
        warehouses: { invalid: true },
      };

      const result = normalizeInventoryData(rawData);

      assert.deepStrictEqual(result.products, []);
      assert.deepStrictEqual(result.warehouses, []);
    });
  });

  // ==========================================
  // Stock Calculation Tests
  // ==========================================

  describe('calculateLowStockCount', () => {
    test('should count items below minimum stock level', () => {
      const products = [
        { quantity_on_hand: 30 },
        { quantity_on_hand: 50 },
        { quantity_on_hand: 10 },
      ];

      const result = calculateLowStockCount(products, 40);
      assert.strictEqual(result, 2); // 30 and 10 are below 40
    });

    test('should handle camelCase property (quantityOnHand)', () => {
      const products = [
        { quantityOnHand: 25 },
        { quantityOnHand: 60 },
      ];

      const result = calculateLowStockCount(products, 50);
      assert.strictEqual(result, 1); // Only 25 is below 50
    });

    test('should prefer quantity_on_hand over quantityOnHand', () => {
      const products = [
        { quantity_on_hand: 30, quantityOnHand: 100 },
      ];

      const result = calculateLowStockCount(products, 50);
      assert.strictEqual(result, 1); // Uses 30 (snake_case)
    });

    test('should exclude items with zero or negative quantity', () => {
      const products = [
        { quantity_on_hand: 0 },
        { quantity_on_hand: -5 },
        { quantity_on_hand: 20 },
      ];

      const result = calculateLowStockCount(products, 50);
      assert.strictEqual(result, 1); // Item with 20 is low stock (below 50)
    });

    test('should use default minimum stock level of 50', () => {
      const products = [
        { quantity_on_hand: 30 },
        { quantity_on_hand: 60 },
      ];

      const result = calculateLowStockCount(products); // No minimum specified
      assert.strictEqual(result, 1); // 30 is below default 50
    });

    test('should return 0 for non-array input', () => {
      assert.strictEqual(calculateLowStockCount(null), 0);
      assert.strictEqual(calculateLowStockCount(undefined), 0);
      assert.strictEqual(calculateLowStockCount('not an array'), 0);
      assert.strictEqual(calculateLowStockCount({}), 0);
    });

    test('should return 0 for empty array', () => {
      assert.strictEqual(calculateLowStockCount([]), 0);
    });

    test('should handle missing quantity properties', () => {
      const products = [
        { name: 'Product 1' }, // No quantity
        { quantity_on_hand: 30 },
      ];

      const result = calculateLowStockCount(products, 40);
      assert.strictEqual(result, 1); // Only product with 30 is low
    });
  });

  // ==========================================
  // Stock Status Mapping Tests
  // ==========================================

  describe('getConsistentStockStatus', () => {
    test('should return out_of_stock for zero quantity', () => {
      assert.strictEqual(getConsistentStockStatus(0), 'out_of_stock');
      assert.strictEqual(getConsistentStockStatus(0, 50), 'out_of_stock');
    });

    test('should return out_of_stock for negative quantity', () => {
      assert.strictEqual(getConsistentStockStatus(-5), 'out_of_stock');
      assert.strictEqual(getConsistentStockStatus(-100, 50), 'out_of_stock');
    });

    test('should return low_stock when below minimum level', () => {
      assert.strictEqual(getConsistentStockStatus(25, 50), 'low_stock');
      assert.strictEqual(getConsistentStockStatus(1, 10), 'low_stock');
    });

    test('should return in_stock when above minimum level', () => {
      assert.strictEqual(getConsistentStockStatus(60, 50), 'in_stock');
      assert.strictEqual(getConsistentStockStatus(100, 50), 'in_stock');
    });

    test('should use default minimum level of 50', () => {
      assert.strictEqual(getConsistentStockStatus(30), 'low_stock'); // Below default 50
      assert.strictEqual(getConsistentStockStatus(60), 'in_stock'); // Above default 50
    });

    test('should coerce string quantities to numbers', () => {
      assert.strictEqual(getConsistentStockStatus('0'), 'out_of_stock');
      assert.strictEqual(getConsistentStockStatus('30', 50), 'low_stock');
      assert.strictEqual(getConsistentStockStatus('60', 50), 'in_stock');
    });

    test('should handle invalid string quantities', () => {
      assert.strictEqual(getConsistentStockStatus('invalid'), 'out_of_stock'); // NaN → 0
      assert.strictEqual(getConsistentStockStatus(''), 'out_of_stock');
    });

    test('should prioritize out_of_stock status (precedence)', () => {
      // When quantity is 0, should be out_of_stock even with high minimum
      assert.strictEqual(getConsistentStockStatus(0, 1000), 'out_of_stock');
    });
  });

  // ==========================================
  // Synchronized Refresh Tests
  // ==========================================

  describe('triggerSynchronizedInventoryRefresh', () => {
    afterEach(() => sinon.restore());

    test('should clear cache before triggering refetches', async () => {
      const testData = { products: [{ id: 1 }] };
      setCachedInventoryData(testData);

      const productsRefetch = sinon.stub().resolves();
      const warehousesRefetch = sinon.stub().resolves();

      await triggerSynchronizedInventoryRefresh(productsRefetch, warehousesRefetch);

      // Cache should be cleared
      assert.strictEqual(getCachedInventoryData(), null);
    });

    test('should call both refetch functions in parallel', async () => {
      const productsRefetch = sinon.stub().resolves();
      const warehousesRefetch = sinon.stub().resolves();

      await triggerSynchronizedInventoryRefresh(productsRefetch, warehousesRefetch);

      assert.ok(productsRefetch.calledOnce);
      assert.ok(warehousesRefetch.calledOnce);
    });

    test('should handle missing refetch functions gracefully', async () => {
      // Should not throw
      await triggerSynchronizedInventoryRefresh(undefined, undefined);
      await triggerSynchronizedInventoryRefresh(null, null);
    });

    test('should catch and log errors without throwing', async () => {
      const consoleWarnStub = sinon.stub(console, 'warn');

      const productsRefetch = sinon.stub().rejects(new Error('Products fetch failed'));
      const warehousesRefetch = sinon.stub().resolves();

      // Should not throw
      await triggerSynchronizedInventoryRefresh(productsRefetch, warehousesRefetch);

      // Should log the error
      assert.ok(consoleWarnStub.calledOnce);
      assert.match(consoleWarnStub.getCall(0).args[1].message, /Products fetch failed/);

      consoleWarnStub.restore();
    });

    test('should handle both refetches failing', async () => {
      const consoleWarnStub = sinon.stub(console, 'warn');

      const productsRefetch = sinon.stub().rejects(new Error('Products failed'));
      const warehousesRefetch = sinon.stub().rejects(new Error('Warehouses failed'));

      await triggerSynchronizedInventoryRefresh(productsRefetch, warehousesRefetch);

      // Should log one combined error (Promise.all)
      assert.ok(consoleWarnStub.calledOnce);

      consoleWarnStub.restore();
    });
  });

  // ==========================================
  // Integration Tests
  // ==========================================

  describe('Integration: Full sync cycle', () => {
    beforeEach(() => clearInventoryCache());
    afterEach(() => clearInventoryCache());

    test('should normalize, cache, and retrieve data consistently', () => {
      const rawData = {
        products: [
          { quantity_on_hand: 30 },
          { quantity_on_hand: 60 },
        ],
        warehouses: [{ id: 'w1' }],
        summary: { totalProducts: 2 },
      };

      // 1. Normalize
      const normalized = normalizeInventoryData(rawData);

      // 2. Cache
      setCachedInventoryData(normalized);

      // 3. Retrieve and verify
      const cached = getCachedInventoryData();
      assert.deepStrictEqual(cached.products, normalized.products);
      assert.deepStrictEqual(cached.warehouses, normalized.warehouses);
    });

    test('should calculate low stock from normalized data', () => {
      const rawData = {
        products: [
          { quantity_on_hand: 20 },
          { quantity_on_hand: 70 },
          { quantity_on_hand: 10 },
        ],
      };

      const normalized = normalizeInventoryData(rawData);
      const lowStockCount = calculateLowStockCount(normalized.products, 50);

      assert.strictEqual(lowStockCount, 2); // 20 and 10 are below 50
    });
  });
});
