import '../../__tests__/init.mjs';
/**
 * Invoice Pagination Tests
 * Tests pagination calculations for multi-page invoices
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  PAGE_CONFIG,
  calculatePagination,
  splitItemsIntoPages,
  getPaginationSummary,
} from '../invoicePagination.js';

describe('invoicePagination', () => {
  describe('PAGE_CONFIG', () => {
    test('should have A4 page dimensions', () => {
      assert.strictEqual(PAGE_CONFIG.A4_HEIGHT, 297);
      assert.strictEqual(PAGE_CONFIG.A4_WIDTH, 210);
    });

    test('should have all required section heights', () => {
      assert.ok(PAGE_CONFIG.HEADER_HEIGHT > 0);
      assert.ok(PAGE_CONFIG.CUSTOMER_SECTION_HEIGHT > 0);
      assert.ok(PAGE_CONFIG.FOOTER_HEIGHT > 0);
      assert.ok(PAGE_CONFIG.SIGNATURE_SECTION_HEIGHT > 0);
      assert.ok(PAGE_CONFIG.TOTALS_SECTION_HEIGHT > 0);
    });

    test('should have reasonable dimensions', () => {
      assert.ok(PAGE_CONFIG.HEADER_HEIGHT < PAGE_CONFIG.A4_HEIGHT);
      assert.ok(PAGE_CONFIG.FOOTER_HEIGHT < PAGE_CONFIG.A4_HEIGHT);
      assert.ok(PAGE_CONFIG.LINE_ITEM_HEIGHT > 0);
      assert.ok(PAGE_CONFIG.LINE_ITEM_HEIGHT < PAGE_CONFIG.HEADER_HEIGHT);
    });
  });

  describe('calculatePagination()', () => {
    test('should handle empty invoice', () => {
      const invoice = { items: [] };
      const result = calculatePagination(invoice);
      assert.strictEqual(result.pages, 1);
      assert.deepStrictEqual(result.itemsPerPage, [0]);
      assert.strictEqual(result.distribution.firstPage, 0);
    });

    test('should handle null items', () => {
      const invoice = {};
      const result = calculatePagination(invoice);
      assert.strictEqual(result.pages, 1);
      assert.deepStrictEqual(result.itemsPerPage, [0]);
    });

    test('should handle single item', () => {
      const invoice = {
        items: [{ id: 1, description: 'Item 1' }],
      };
      const result = calculatePagination(invoice);
      assert.strictEqual(result.pages, 1);
      assert.deepStrictEqual(result.itemsPerPage, [1]);
      assert.strictEqual(result.distribution.firstPage, 1);
    });

    test('should fit items on single page', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);
      assert.strictEqual(result.pages, 1);
      assert.strictEqual(result.itemsPerPage[0], 10);
    });

    test('should calculate pages for multi-page invoices', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);
      assert.ok(result.pages > 1);
      assert.strictEqual(result.itemsPerPage.length, result.pages);
    });

    test('should have distribution for multi-page', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);
      if (result.pages > 1) {
        assert.ok(result.distribution);
        assert.ok(result.distribution.firstPage > 0);
      }
    });

    test('should have limits property for multi-page', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);
      if (result.pages > 1) {
        assert.ok(result.limits);
        assert.ok(result.limits.maxItemsFirstPage > 0);
        assert.ok(result.limits.maxItemsOtherPage > 0);
        assert.ok(result.limits.maxItemsLastPage > 0);
      }
    });

    test('should not exceed max items per page', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);

      const limits = result.limits || {
        maxItemsFirstPage: result.itemsPerPage[0],
        maxItemsLastPage: result.itemsPerPage[result.pages - 1],
      };

      // First page should not exceed limits
      assert.ok(result.itemsPerPage[0] <= limits.maxItemsFirstPage);
      // Last page should not exceed its limits
      assert.ok(result.itemsPerPage[result.pages - 1] <= limits.maxItemsLastPage);
    });

    test('should distribute items across pages', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);

      const totalItems = result.itemsPerPage.reduce((sum, count) => sum + count, 0);
      assert.strictEqual(totalItems, 100);
    });

    test('should return pagination object with required properties', () => {
      const invoice = { items: [{ id: 1 }] };
      const result = calculatePagination(invoice);
      assert.ok(result.hasOwnProperty('pages'));
      assert.ok(result.hasOwnProperty('itemsPerPage'));
      assert.ok(result.hasOwnProperty('distribution'));
    });
  });

  describe('splitItemsIntoPages()', () => {
    test('should split items correctly for single page', () => {
      const items = [
        { id: 1, description: 'Item 1' },
        { id: 2, description: 'Item 2' },
      ];
      const pagination = {
        pages: 1,
        itemsPerPage: [2],
        distribution: { firstPage: 2, middlePages: [], lastPage: 0 },
      };
      const pages = splitItemsIntoPages(items, pagination);
      assert.strictEqual(pages.length, 1);
      assert.strictEqual(pages[0].items.length, 2);
      assert.strictEqual(pages[0].isFirstPage, true);
      assert.strictEqual(pages[0].isLastPage, true);
    });

    test('should split items correctly for multiple pages', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const pagination = {
        pages: 3,
        itemsPerPage: [4, 3, 3],
        distribution: { firstPage: 4, middlePages: [3], lastPage: 3 },
      };
      const pages = splitItemsIntoPages(items, pagination);
      assert.strictEqual(pages.length, 3);
      assert.strictEqual(pages[0].items.length, 4);
      assert.strictEqual(pages[1].items.length, 3);
      assert.strictEqual(pages[2].items.length, 3);
    });

    test('should set correct page numbers', () => {
      const items = Array.from({ length: 6 }, (_, i) => ({ id: i + 1 }));
      const pagination = {
        pages: 2,
        itemsPerPage: [3, 3],
        distribution: { firstPage: 3, middlePages: [], lastPage: 3 },
      };
      const pages = splitItemsIntoPages(items, pagination);
      assert.strictEqual(pages[0].pageNumber, 1);
      assert.strictEqual(pages[1].pageNumber, 2);
    });

    test('should set correct page flags', () => {
      const items = Array.from({ length: 9 }, (_, i) => ({ id: i + 1 }));
      const pagination = {
        pages: 3,
        itemsPerPage: [3, 3, 3],
        distribution: { firstPage: 3, middlePages: [3], lastPage: 3 },
      };
      const pages = splitItemsIntoPages(items, pagination);

      assert.strictEqual(pages[0].isFirstPage, true);
      assert.strictEqual(pages[0].isLastPage, false);
      assert.strictEqual(pages[0].isMiddlePage, false);

      assert.strictEqual(pages[1].isFirstPage, false);
      assert.strictEqual(pages[1].isLastPage, false);
      assert.strictEqual(pages[1].isMiddlePage, true);

      assert.strictEqual(pages[2].isFirstPage, false);
      assert.strictEqual(pages[2].isLastPage, true);
      assert.strictEqual(pages[2].isMiddlePage, false);
    });

    test('should have totalPages in each page object', () => {
      const items = Array.from({ length: 6 }, (_, i) => ({ id: i + 1 }));
      const pagination = {
        pages: 2,
        itemsPerPage: [3, 3],
        distribution: { firstPage: 3, middlePages: [], lastPage: 3 },
      };
      const pages = splitItemsIntoPages(items, pagination);
      assert.strictEqual(pages[0].totalPages, 2);
      assert.strictEqual(pages[1].totalPages, 2);
    });

    test('should maintain item order across pages', () => {
      const items = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const pagination = {
        pages: 2,
        itemsPerPage: [3, 3],
        distribution: { firstPage: 3, middlePages: [], lastPage: 3 },
      };
      const pages = splitItemsIntoPages(items, pagination);

      const allItems = pages.flatMap(p => p.items);
      assert.deepStrictEqual(allItems, items);
    });
  });

  describe('getPaginationSummary()', () => {
    test('should return single page summary', () => {
      const pagination = {
        pages: 1,
        itemsPerPage: [10],
        distribution: { firstPage: 10, middlePages: [], lastPage: 0 },
      };
      const summary = getPaginationSummary(pagination);
      assert.ok(summary.includes('Single page'));
      assert.ok(summary.includes('10 items'));
    });

    test('should return multi-page summary', () => {
      const pagination = {
        pages: 3,
        itemsPerPage: [20, 15, 15],
        distribution: { firstPage: 20, middlePages: [15], lastPage: 15 },
      };
      const summary = getPaginationSummary(pagination);
      assert.ok(summary.includes('3-page'));
      assert.ok(summary.includes('Page 1'));
      assert.ok(summary.includes('customer info'));
      assert.ok(summary.includes('totals'));
    });

    test('should include middle pages info', () => {
      const pagination = {
        pages: 4,
        itemsPerPage: [20, 15, 15, 10],
        distribution: { firstPage: 20, middlePages: [15, 15], lastPage: 10 },
      };
      const summary = getPaginationSummary(pagination);
      assert.ok(summary.includes('15'));
      assert.ok(summary.includes('continued'));
    });

    test('should return string summary', () => {
      const pagination = {
        pages: 1,
        itemsPerPage: [5],
        distribution: { firstPage: 5, middlePages: [], lastPage: 0 },
      };
      const summary = getPaginationSummary(pagination);
      assert.strictEqual(typeof summary, 'string');
    });

    test('should format page numbers correctly', () => {
      const pagination = {
        pages: 2,
        itemsPerPage: [20, 15],
        distribution: { firstPage: 20, middlePages: [], lastPage: 15 },
      };
      const summary = getPaginationSummary(pagination);
      assert.ok(summary.includes('2-page'));
      assert.ok(summary.includes('Page 2'));
    });
  });

  describe('Pagination Logic', () => {
    test('should handle large invoices with many items', () => {
      const items = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };
      const result = calculatePagination(invoice);

      const totalItems = result.itemsPerPage.reduce((sum, count) => sum + count, 0);
      assert.strictEqual(totalItems, 500);
      assert.ok(result.pages > 1);
    });

    test('pagination should be consistent across multiple calculations', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
      }));
      const invoice = { items };

      const result1 = calculatePagination(invoice);
      const result2 = calculatePagination(invoice);

      assert.deepStrictEqual(result1.pages, result2.pages);
      assert.deepStrictEqual(result1.itemsPerPage, result2.itemsPerPage);
    });

    test('should preserve all items through pagination', () => {
      const items = Array.from({ length: 75 }, (_, i) => ({
        id: i + 1,
        description: `Item ${i + 1}`,
        quantity: i + 1,
      }));
      const invoice = { items };
      const pagination = calculatePagination(invoice);
      const pages = splitItemsIntoPages(items, pagination);

      const allPageItems = pages.flatMap(p => p.items);
      assert.strictEqual(allPageItems.length, 75);
      assert.deepStrictEqual(allPageItems, items);
    });
  });
});
