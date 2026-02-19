import '../../__tests__/init.mjs';
/**
 * Safe Access Utilities Tests
 * Tests defensive data access helpers
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  safeEntries,
  safeKeys,
  safeValues,
  safeGet,
  safeArray,
  safeNumber,
  safeString,
  safeHas,
  safeLength,
} from '../safeAccess.js';

describe('safeAccess', () => {
  describe('safeEntries()', () => {
    test('should return entries for valid object', () => {
      const obj = { name: 'John', age: 30 };
      const result = safeEntries(obj);
      assert.deepStrictEqual(result, [['name', 'John'], ['age', 30]]);
    });

    test('should return empty array for null', () => {
      const result = safeEntries(null);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for undefined', () => {
      const result = safeEntries(undefined);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for array input', () => {
      const result = safeEntries([1, 2, 3]);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for non-object', () => {
      assert.deepStrictEqual(safeEntries('string'), []);
      assert.deepStrictEqual(safeEntries(123), []);
    });

    test('should return entries for empty object', () => {
      const result = safeEntries({});
      assert.deepStrictEqual(result, []);
    });
  });

  describe('safeKeys()', () => {
    test('should return keys for valid object', () => {
      const obj = { name: 'John', age: 30 };
      const result = safeKeys(obj);
      assert.deepStrictEqual(result.sort(), ['age', 'name']);
    });

    test('should return empty array for null', () => {
      const result = safeKeys(null);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for undefined', () => {
      const result = safeKeys(undefined);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for array', () => {
      const result = safeKeys([1, 2, 3]);
      assert.deepStrictEqual(result, []);
    });

    test('should return keys for empty object', () => {
      const result = safeKeys({});
      assert.deepStrictEqual(result, []);
    });
  });

  describe('safeValues()', () => {
    test('should return values for valid object', () => {
      const obj = { name: 'John', age: 30 };
      const result = safeValues(obj);
      assert.ok(result.includes('John'));
      assert.ok(result.includes(30));
    });

    test('should return empty array for null', () => {
      const result = safeValues(null);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for undefined', () => {
      const result = safeValues(undefined);
      assert.deepStrictEqual(result, []);
    });

    test('should return empty array for array', () => {
      const result = safeValues([1, 2, 3]);
      assert.deepStrictEqual(result, []);
    });

    test('should return values for empty object', () => {
      const result = safeValues({});
      assert.deepStrictEqual(result, []);
    });
  });

  describe('safeGet()', () => {
    test('should get top-level property', () => {
      const obj = { name: 'John' };
      const result = safeGet(obj, 'name');
      assert.strictEqual(result, 'John');
    });

    test('should get nested property', () => {
      const obj = { user: { address: { city: 'Dubai' } } };
      const result = safeGet(obj, 'user.address.city');
      assert.strictEqual(result, 'Dubai');
    });

    test('should get array element by index', () => {
      const obj = { items: [{ name: 'Item1' }, { name: 'Item2' }] };
      const result = safeGet(obj, 'items.0.name');
      assert.strictEqual(result, 'Item1');
    });

    test('should return default for missing property', () => {
      const obj = { name: 'John' };
      const result = safeGet(obj, 'missing', 'default');
      assert.strictEqual(result, 'default');
    });

    test('should return default for null input', () => {
      const result = safeGet(null, 'anything', 'default');
      assert.strictEqual(result, 'default');
    });

    test('should return default for undefined input', () => {
      const result = safeGet(undefined, 'anything', 'default');
      assert.strictEqual(result, 'default');
    });

    test('should return undefined if no default provided', () => {
      const obj = { name: 'John' };
      const result = safeGet(obj, 'missing');
      assert.strictEqual(result, undefined);
    });

    test('should return default for invalid array index', () => {
      const obj = { items: ['a', 'b'] };
      const result = safeGet(obj, 'items.5', 'default');
      assert.strictEqual(result, 'default');
    });

    test('should handle empty path string', () => {
      const obj = { name: 'John' };
      const result = safeGet(obj, '', 'default');
      assert.strictEqual(result, 'default');
    });

    test('should return value 0 (not default)', () => {
      const obj = { count: 0 };
      const result = safeGet(obj, 'count', 10);
      assert.strictEqual(result, 0);
    });

    test('should return empty string (not default)', () => {
      const obj = { name: '' };
      const result = safeGet(obj, 'name', 'default');
      assert.strictEqual(result, '');
    });
  });

  describe('safeArray()', () => {
    test('should return array as-is', () => {
      const arr = [1, 2, 3];
      const result = safeArray(arr);
      assert.strictEqual(result, arr);
    });

    test('should return empty array for non-array', () => {
      assert.deepStrictEqual(safeArray(null), []);
      assert.deepStrictEqual(safeArray(undefined), []);
      assert.deepStrictEqual(safeArray('string'), []);
      assert.deepStrictEqual(safeArray({}), []);
    });

    test('should return empty array for empty array', () => {
      const result = safeArray([]);
      assert.deepStrictEqual(result, []);
    });
  });

  describe('safeNumber()', () => {
    test('should convert string to number', () => {
      const result = safeNumber('42');
      assert.strictEqual(result, 42);
    });

    test('should return number as-is', () => {
      const result = safeNumber(42);
      assert.strictEqual(result, 42);
    });

    test('should return default for NaN', () => {
      const result = safeNumber('not-a-number', 0);
      assert.strictEqual(result, 0);
    });

    test('should return default for null', () => {
      const result = safeNumber(null, 10);
      assert.strictEqual(result, 10);
    });

    test('should return default for undefined', () => {
      const result = safeNumber(undefined, 10);
      assert.strictEqual(result, 10);
    });

    test('should return default for empty string', () => {
      const result = safeNumber('', 5);
      assert.strictEqual(result, 5);
    });

    test('should return 0 as default when not specified', () => {
      const result = safeNumber('invalid');
      assert.strictEqual(result, 0);
    });

    test('should handle negative numbers', () => {
      const result = safeNumber('-42');
      assert.strictEqual(result, -42);
    });

    test('should handle decimal numbers', () => {
      const result = safeNumber('3.14');
      assert.strictEqual(result, 3.14);
    });

    test('should return default for Infinity', () => {
      const result = safeNumber(Infinity, 0);
      assert.strictEqual(result, 0);
    });
  });

  describe('safeString()', () => {
    test('should return string as-is', () => {
      const result = safeString('hello');
      assert.strictEqual(result, 'hello');
    });

    test('should convert number to string', () => {
      const result = safeString(42);
      assert.strictEqual(result, '42');
    });

    test('should return default for null', () => {
      const result = safeString(null, 'default');
      assert.strictEqual(result, 'default');
    });

    test('should return default for undefined', () => {
      const result = safeString(undefined, 'default');
      assert.strictEqual(result, 'default');
    });

    test('should return empty string as default', () => {
      const result = safeString(null);
      assert.strictEqual(result, '');
    });

    test('should handle boolean values', () => {
      assert.strictEqual(safeString(true), 'true');
      assert.strictEqual(safeString(false), 'false');
    });

    test('should handle object conversion', () => {
      const result = safeString({ key: 'value' });
      assert.ok(result.length > 0);
      assert.strictEqual(typeof result, 'string');
    });
  });

  describe('safeHas()', () => {
    test('should return true for existing property', () => {
      const obj = { name: 'John' };
      assert.strictEqual(safeHas(obj, 'name'), true);
    });

    test('should return false for missing property', () => {
      const obj = { name: 'John' };
      assert.strictEqual(safeHas(obj, 'missing'), false);
    });

    test('should return false for null', () => {
      assert.strictEqual(safeHas(null, 'anything'), false);
    });

    test('should return false for undefined', () => {
      assert.strictEqual(safeHas(undefined, 'anything'), false);
    });

    test('should return false for non-object', () => {
      assert.strictEqual(safeHas('string', 'anything'), false);
      assert.strictEqual(safeHas(123, 'anything'), false);
    });

    test('should work with array', () => {
      const arr = ['a', 'b'];
      assert.strictEqual(safeHas(arr, '0'), true);
      assert.strictEqual(safeHas(arr, '2'), false);
    });
  });

  describe('safeLength()', () => {
    test('should return length of array', () => {
      const result = safeLength([1, 2, 3]);
      assert.strictEqual(result, 3);
    });

    test('should return 0 for empty array', () => {
      const result = safeLength([]);
      assert.strictEqual(result, 0);
    });

    test('should return number of keys in object', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = safeLength(obj);
      assert.strictEqual(result, 3);
    });

    test('should return 0 for empty object', () => {
      const result = safeLength({});
      assert.strictEqual(result, 0);
    });

    test('should return 0 for null', () => {
      const result = safeLength(null);
      assert.strictEqual(result, 0);
    });

    test('should return 0 for undefined', () => {
      const result = safeLength(undefined);
      assert.strictEqual(result, 0);
    });

    test('should return 0 for non-array/object', () => {
      assert.strictEqual(safeLength('string'), 0);
      assert.strictEqual(safeLength(123), 0);
    });
  });
});
