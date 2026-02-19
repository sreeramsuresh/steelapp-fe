/**
 * Index/Barrel File - Structural Sanity Test
 *
 * Verifies that:
 * - All expected exports are present
 * - No exports are undefined
 * - Re-export structure is intact
 *
 * This file contains no business logic, only re-exports.
 * These tests verify the structural integrity of the barrel file.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as utilsExports from '../index.js';

describe('index.js - Barrel File Structural Integrity', () => {
  test('should export DisplayTypes from errorHandler', () => {
    assert.ok(utilsExports.DisplayTypes !== undefined);
    assert.strictEqual(typeof utilsExports.DisplayTypes, 'object');
  });

  test('should export ErrorTypes from errorHandler', () => {
    assert.ok(utilsExports.ErrorTypes !== undefined);
    assert.strictEqual(typeof utilsExports.ErrorTypes, 'object');
  });

  test('should export getErrorMessage function', () => {
    assert.ok(utilsExports.getErrorMessage !== undefined);
    assert.strictEqual(typeof utilsExports.getErrorMessage, 'function');
  });

  test('should export getRawErrorMessage function', () => {
    assert.ok(utilsExports.getRawErrorMessage !== undefined);
    assert.strictEqual(typeof utilsExports.getRawErrorMessage, 'function');
  });

  test('should export isNetworkError function', () => {
    assert.ok(utilsExports.isNetworkError !== undefined);
    assert.strictEqual(typeof utilsExports.isNetworkError, 'function');
  });

  test('should export isSystemError function', () => {
    assert.ok(utilsExports.isSystemError !== undefined);
    assert.strictEqual(typeof utilsExports.isSystemError, 'function');
  });

  test('should have all expected exports and no undefined values', () => {
    const expectedExports = [
      'DisplayTypes',
      'ErrorTypes',
      'getErrorMessage',
      'getRawErrorMessage',
      'isNetworkError',
      'isSystemError',
    ];

    // Verify all expected exports exist
    for (const exportName of expectedExports) {
      assert.ok(
        utilsExports[exportName] !== undefined,
        `Export '${exportName}' should be defined`
      );
    }

    // Verify no unexpected undefined values
    for (const [key, value] of Object.entries(utilsExports)) {
      assert.ok(value !== undefined, `Export '${key}' should not be undefined`);
    }
  });

  test('should have exactly 6 exports (no accidental extras)', () => {
    const exportCount = Object.keys(utilsExports).length;
    assert.strictEqual(exportCount, 6);
  });
});
