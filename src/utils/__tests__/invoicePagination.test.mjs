import '../../__tests__/init.mjs';
/**
 * Invoice Pagination Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculatePaginationOffset, calculateTotalPages, getPaginationInfo, isValidPage } from '../invoicePagination.js';

describe('invoicePagination', () => {
  describe('calculatePaginationOffset()', () => {
    test('should calculate correct offset for page 1', () => {
      const offset = calculatePaginationOffset(1, 20);
      assert.strictEqual(offset, 0);
    });

    test('should calculate correct offset for page 2', () => {
      const offset = calculatePaginationOffset(2, 20);
      assert.strictEqual(offset, 20);
    });

    test('should calculate correct offset for page 5 with custom limit', () => {
      const offset = calculatePaginationOffset(5, 50);
      assert.strictEqual(offset, 200);
    });
  });

  describe('calculateTotalPages()', () => {
    test('should calculate total pages correctly', () => {
      const total = calculateTotalPages(100, 20);
      assert.strictEqual(total, 5);
    });

    test('should round up for partial pages', () => {
      const total = calculateTotalPages(105, 20);
      assert.strictEqual(total, 6);
    });

    test('should return 1 for single page', () => {
      const total = calculateTotalPages(10, 20);
      assert.strictEqual(total, 1);
    });
  });

  describe('isValidPage()', () => {
    test('should validate positive page numbers', () => {
      assert.strictEqual(isValidPage(1, 10), true);
      assert.strictEqual(isValidPage(5, 10), true);
      assert.strictEqual(isValidPage(10, 10), true);
    });

    test('should reject invalid page numbers', () => {
      assert.strictEqual(isValidPage(0, 10), false);
      assert.strictEqual(isValidPage(-1, 10), false);
      assert.strictEqual(isValidPage(11, 10), false);
    });
  });

  describe('getPaginationInfo()', () => {
    test('should return correct pagination info', () => {
      const info = getPaginationInfo(1, 20, 100);
      assert.strictEqual(info.offset, 0);
      assert.strictEqual(info.currentPage, 1);
      assert.strictEqual(info.totalPages, 5);
    });
  });
});
