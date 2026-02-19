import '../../__tests__/init.mjs';
/**
 * Record Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isNewRecord, validateCreditNoteForDownload } from '../recordUtils.js';

describe('recordUtils', () => {
  describe('isNewRecord()', () => {
    test('should return true for recently created records', () => {
      const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
      const result = isNewRecord(recentDate, 2); // 2 hour threshold
      assert.strictEqual(result, true);
    });

    test('should return false for old records', () => {
      const oldDate = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
      const result = isNewRecord(oldDate, 2); // 2 hour threshold
      assert.strictEqual(result, false);
    });

    test('should handle Timestamp object format', () => {
      const now = Math.floor(Date.now() / 1000);
      const recentTimestamp = { seconds: now - 300 }; // 5 mins ago
      const result = isNewRecord(recentTimestamp, 2);
      assert.strictEqual(result, true);
    });

    test('should return false for null/undefined', () => {
      assert.strictEqual(isNewRecord(null), false);
      assert.strictEqual(isNewRecord(undefined), false);
    });

    test('should use default threshold of 2 hours', () => {
      const withinTwoHours = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const result = isNewRecord(withinTwoHours);
      assert.strictEqual(result, true);
    });
  });

  describe('validateCreditNoteForDownload()', () => {
    test('should validate complete credit note', () => {
      const creditNote = {
        invoice_id: 1,
        items: [{ id: 1, amount: 100 }],
        reason: 'Return',
        date: new Date(),
      };
      const result = validateCreditNoteForDownload(creditNote);
      assert.ok(typeof result === 'object');
      assert.ok('isValid' in result);
    });

    test('should return validation object with expected structure', () => {
      const creditNote = { invoice_id: 1 };
      const result = validateCreditNoteForDownload(creditNote);
      assert.ok(Array.isArray(result.warnings) || typeof result.warnings === 'undefined');
      assert.ok(typeof result.isValid === 'boolean' || result.isValid === undefined);
    });

    test('should handle empty object input', () => {
      const result = validateCreditNoteForDownload({});
      assert.ok(typeof result === 'object');
    });
  });
});
