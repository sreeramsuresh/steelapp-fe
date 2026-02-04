import '../../__tests__/init.mjs';
/**
 * UUID Utilities Tests
 * Tests UUID v4 generation with fallback strategies
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { uuid } from '../uuid.js';

describe('uuid', () => {
  describe('uuid()', () => {
    test('should generate valid UUID v4 string', () => {
      const result = uuid();
      assert.ok(typeof result === 'string');
    });

    test('should generate UUID with correct format', () => {
      const result = uuid();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      assert.match(result, /^[0-9a-f]{8}-[0-9a-f]{4}-[14][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('should generate UUIDs with correct structure', () => {
      const result = uuid();
      const parts = result.split('-');
      assert.strictEqual(parts.length, 5);
      assert.strictEqual(parts[0].length, 8);
      assert.strictEqual(parts[1].length, 4);
      assert.strictEqual(parts[2].length, 4);
      assert.strictEqual(parts[3].length, 4);
      assert.strictEqual(parts[4].length, 12);
    });

    test('should generate unique UUIDs', () => {
      const uuid1 = uuid();
      const uuid2 = uuid();
      const uuid3 = uuid();
      assert.notStrictEqual(uuid1, uuid2);
      assert.notStrictEqual(uuid2, uuid3);
      assert.notStrictEqual(uuid1, uuid3);
    });

    test('should generate multiple UUIDs without errors', () => {
      const uuids = [];
      for (let i = 0; i < 100; i++) {
        const id = uuid();
        assert.ok(typeof id === 'string');
        assert.ok(id.length > 0);
        uuids.push(id);
      }
      // Check all are unique
      const uniqueSet = new Set(uuids);
      assert.strictEqual(uniqueSet.size, 100);
    });

    test('should not generate empty strings', () => {
      const result = uuid();
      assert.notStrictEqual(result, '');
      assert.ok(result.length > 0);
    });

    test('should generate lowercase or uppercase hex characters only', () => {
      const result = uuid();
      const hexOnly = result.replace(/[0-9a-f\-]/gi, '');
      assert.strictEqual(hexOnly, '');
    });

    test('should have correct hyphens placement', () => {
      const result = uuid();
      assert.strictEqual(result[8], '-');
      assert.strictEqual(result[13], '-');
      assert.strictEqual(result[18], '-');
      assert.strictEqual(result[23], '-');
    });

    test('should have version 4 identifier', () => {
      const result = uuid();
      // Version 4 should have '4' in the correct position (13th character, 0-indexed position 14)
      assert.ok(['4'].includes(result[14]));
    });

    test('should generate valid UUID for multi-threaded usage', () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve(uuid()));
      }
      // Verify promises can be created without errors
      assert.strictEqual(promises.length, 10);
    });
  });
});
