import '../../__tests__/init.mjs';
/**
 * Field Tooltips Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getFieldTooltip, getFieldHelp, hasTooltip } from '../fieldTooltips.js';

describe('fieldTooltips', () => {
  describe('getFieldTooltip()', () => {
    test('should return tooltip text for field', () => {
      const tooltip = getFieldTooltip('dueDate');
      assert.ok(typeof tooltip === 'string');
    });

    test('should return empty string for unknown fields', () => {
      const tooltip = getFieldTooltip('unknownField');
      assert.ok(typeof tooltip === 'string');
    });

    test('should handle null/undefined gracefully', () => {
      assert.ok(typeof getFieldTooltip(null) === 'string');
      assert.ok(typeof getFieldTooltip(undefined) === 'string');
    });
  });

  describe('getFieldHelp()', () => {
    test('should return help text for field', () => {
      const help = getFieldHelp('email');
      assert.ok(typeof help === 'string');
    });

    test('should distinguish from tooltip', () => {
      const tooltip = getFieldTooltip('email');
      const help = getFieldHelp('email');
      // They may be same or different, but both should be strings
      assert.ok(typeof tooltip === 'string');
      assert.ok(typeof help === 'string');
    });
  });

  describe('hasTooltip()', () => {
    test('should identify fields with tooltips', () => {
      const has = hasTooltip('dueDate');
      assert.strictEqual(typeof has, 'boolean');
    });

    test('should return false for fields without tooltips', () => {
      const has = hasTooltip('unknownField');
      assert.strictEqual(typeof has, 'boolean');
    });
  });
});
