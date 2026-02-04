import '../../__tests__/init.mjs';
/**
 * Record Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isRecord, mapRecord, filterRecord, mergeRecords, omitRecord } from '../recordUtils.js';

describe('recordUtils', () => {
  describe('isRecord()', () => {
    test('should identify plain objects as records', () => {
      assert.strictEqual(isRecord({ key: 'value' }), true);
    });

    test('should reject non-objects', () => {
      assert.strictEqual(isRecord(null), false);
      assert.strictEqual(isRecord(undefined), false);
      assert.strictEqual(isRecord('string'), false);
      assert.strictEqual(isRecord(123), false);
    });

    test('should reject arrays', () => {
      assert.strictEqual(isRecord([1, 2, 3]), false);
    });
  });

  describe('mapRecord()', () => {
    test('should map record values', () => {
      const record = { a: 1, b: 2, c: 3 };
      const result = mapRecord(record, v => v * 2);
      assert.deepStrictEqual(result, { a: 2, b: 4, c: 6 });
    });

    test('should preserve keys', () => {
      const record = { name: 'John', age: 30 };
      const result = mapRecord(record, v => v);
      assert.deepStrictEqual(Object.keys(result).sort(), ['age', 'name']);
    });
  });

  describe('filterRecord()', () => {
    test('should filter record entries', () => {
      const record = { a: 1, b: 2, c: 3 };
      const result = filterRecord(record, v => v > 1);
      assert.deepStrictEqual(result, { b: 2, c: 3 });
    });

    test('should return empty object when all filtered', () => {
      const record = { a: 1, b: 2 };
      const result = filterRecord(record, v => v > 10);
      assert.deepStrictEqual(result, {});
    });
  });

  describe('mergeRecords()', () => {
    test('should merge multiple records', () => {
      const r1 = { a: 1 };
      const r2 = { b: 2 };
      const r3 = { c: 3 };
      const result = mergeRecords(r1, r2, r3);
      assert.deepStrictEqual(result, { a: 1, b: 2, c: 3 });
    });

    test('should override with later records', () => {
      const r1 = { a: 1, b: 2 };
      const r2 = { b: 20, c: 3 };
      const result = mergeRecords(r1, r2);
      assert.strictEqual(result.b, 20);
    });
  });

  describe('omitRecord()', () => {
    test('should omit specified keys', () => {
      const record = { a: 1, b: 2, c: 3 };
      const result = omitRecord(record, ['b']);
      assert.deepStrictEqual(result, { a: 1, c: 3 });
    });

    test('should handle multiple omits', () => {
      const record = { a: 1, b: 2, c: 3, d: 4 };
      const result = omitRecord(record, ['b', 'd']);
      assert.deepStrictEqual(result, { a: 1, c: 3 });
    });
  });
});
