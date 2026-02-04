import '../../__tests__/init.mjs';
/**
 * Stock Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateStockBalance,
  isLowStock,
  formatStockQuantity,
  calculateMovingAverage,
} from '../stockUtils.js';

describe('stockUtils', () => {
  describe('calculateStockBalance()', () => {
    test('should calculate correct balance', () => {
      const balance = calculateStockBalance({
        opening: 100,
        inward: 50,
        outward: 30,
      });
      assert.strictEqual(balance, 120);
    });

    test('should handle negative balances', () => {
      const balance = calculateStockBalance({
        opening: 10,
        inward: 5,
        outward: 20,
      });
      assert.strictEqual(balance, -5);
    });

    test('should default missing values to 0', () => {
      const balance = calculateStockBalance({
        opening: 100,
      });
      assert.strictEqual(balance, 100);
    });
  });

  describe('isLowStock()', () => {
    test('should return true for low stock', () => {
      const low = isLowStock(5, 10);
      assert.strictEqual(low, true);
    });

    test('should return false for adequate stock', () => {
      const low = isLowStock(15, 10);
      assert.strictEqual(low, false);
    });

    test('should use default threshold', () => {
      const low = isLowStock(5);
      assert.strictEqual(typeof low, 'boolean');
    });
  });

  describe('formatStockQuantity()', () => {
    test('should format quantity as string', () => {
      const formatted = formatStockQuantity(100.5);
      assert.strictEqual(typeof formatted, 'string');
    });

    test('should handle zero', () => {
      const formatted = formatStockQuantity(0);
      assert.ok(formatted);
    });

    test('should handle negative values', () => {
      const formatted = formatStockQuantity(-10);
      assert.ok(formatted);
    });
  });

  describe('calculateMovingAverage()', () => {
    test('should calculate moving average', () => {
      const values = [10, 20, 30, 40, 50];
      const avg = calculateMovingAverage(values, 3);
      assert.ok(typeof avg === 'number');
      assert.ok(avg > 0);
    });

    test('should handle period larger than values', () => {
      const values = [10, 20];
      const avg = calculateMovingAverage(values, 5);
      assert.ok(typeof avg === 'number');
    });
  });
});
