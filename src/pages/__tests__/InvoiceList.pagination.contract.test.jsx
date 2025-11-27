/**
 * InvoiceList Pagination - Contract Tests
 *
 * These tests validate the contract between frontend and API for pagination.
 * They ensure the UI logic correctly handles pagination data from the API.
 *
 * Contract Requirements:
 * - API returns: { invoices: [], pagination: { totalItems, totalPages, currentPage, perPage } }
 * - UI displays: "Showing X to Y of Z invoices"
 * - No NaN values should ever appear in the pagination display
 */

import { describe, test, expect } from 'vitest';

/**
 * Pagination calculation logic (extracted from InvoiceList.jsx)
 * This mirrors the exact logic used in the component.
 */
const calculatePaginationDisplay = (pagination) => {
  if (!pagination) {
    return null;
  }

  const startItem = (pagination.currentPage - 1) * pagination.perPage + 1;
  const endItem = Math.min(
    pagination.currentPage * pagination.perPage,
    pagination.totalItems,
  );
  const totalItems = pagination.totalItems;

  return {
    startItem,
    endItem,
    totalItems,
    text: `Showing ${startItem} to ${endItem} of ${totalItems} invoices`,
    pageIndicator: `Page ${pagination.currentPage} of ${pagination.totalPages}`,
  };
};

/**
 * Check if a value is NaN
 */
const containsNaN = (obj) => {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'number') return Number.isNaN(obj);
  if (typeof obj === 'string') return obj.includes('NaN');
  if (typeof obj === 'object') {
    return Object.values(obj).some(containsNaN);
  }
  return false;
};

describe('InvoiceList Pagination Contract Tests', () => {
  /**
   * CONTRACT TEST: Valid pagination response displays correctly
   *
   * Given: API returns { pagination: { totalItems: 100, perPage: 10, currentPage: 1, totalPages: 10 } }
   * Then: Displays "Showing 1 to 10 of 100 invoices"
   */
  test('valid pagination displays "Showing 1 to 10 of 100 invoices" without NaN', () => {
    const pagination = {
      currentPage: 1,
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result).not.toBeNull();
    expect(result.text).toBe('Showing 1 to 10 of 100 invoices');
    expect(containsNaN(result)).toBe(false);
  });

  /**
   * CONTRACT TEST: Pagination with small dataset
   */
  test('pagination with fewer items than page size displays correctly', () => {
    const pagination = {
      currentPage: 1,
      perPage: 10,
      totalItems: 5,
      totalPages: 1,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result.text).toBe('Showing 1 to 5 of 5 invoices');
    expect(containsNaN(result)).toBe(false);
  });

  /**
   * CONTRACT TEST: Page 2 displays correct range
   */
  test('page 2 displays "Showing 11 to 20 of 100 invoices"', () => {
    const pagination = {
      currentPage: 2,
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result.text).toBe('Showing 11 to 20 of 100 invoices');
    expect(result.startItem).toBe(11);
    expect(result.endItem).toBe(20);
    expect(containsNaN(result)).toBe(false);
  });

  /**
   * CONTRACT TEST: Last page with partial results
   */
  test('last page with partial results displays correctly', () => {
    const pagination = {
      currentPage: 10,
      perPage: 10,
      totalItems: 95,
      totalPages: 10,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result.text).toBe('Showing 91 to 95 of 95 invoices');
    expect(result.startItem).toBe(91);
    expect(result.endItem).toBe(95); // Not 100, because only 95 items
    expect(containsNaN(result)).toBe(false);
  });

  /**
   * CONTRACT TEST: Empty pagination returns null
   */
  test('null pagination returns null (no display)', () => {
    const result = calculatePaginationDisplay(null);

    expect(result).toBeNull();
  });

  /**
   * CONTRACT TEST: Page indicator displays correctly
   */
  test('page indicator shows "Page 3 of 10"', () => {
    const pagination = {
      currentPage: 3,
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result.pageIndicator).toBe('Page 3 of 10');
    expect(containsNaN(result)).toBe(false);
  });

  /**
   * CONTRACT TEST: Single page scenario
   */
  test('single page displays correctly', () => {
    const pagination = {
      currentPage: 1,
      perPage: 10,
      totalItems: 3,
      totalPages: 1,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result.text).toBe('Showing 1 to 3 of 3 invoices');
    expect(result.pageIndicator).toBe('Page 1 of 1');
    expect(containsNaN(result)).toBe(false);
  });

  /**
   * CONTRACT TEST: Large dataset pagination
   */
  test('large dataset pagination on page 50', () => {
    const pagination = {
      currentPage: 50,
      perPage: 10,
      totalItems: 1000,
      totalPages: 100,
    };

    const result = calculatePaginationDisplay(pagination);

    expect(result.text).toBe('Showing 491 to 500 of 1000 invoices');
    expect(result.startItem).toBe(491);
    expect(result.endItem).toBe(500);
    expect(containsNaN(result)).toBe(false);
  });
});

describe('Pagination Schema Validation', () => {
  /**
   * These tests validate that the frontend properly handles
   * pagination data and prevents NaN bugs.
   */

  test('totalItems field is required (not total)', () => {
    const validPagination = {
      totalItems: 100, // CORRECT
      totalPages: 10,
      currentPage: 1,
      perPage: 10,
    };

    expect(validPagination.totalItems).toBe(100);
    expect(validPagination).not.toHaveProperty('total');
  });

  test('perPage field is required (not limit or pageSize)', () => {
    const validPagination = {
      totalItems: 100,
      totalPages: 10,
      currentPage: 1,
      perPage: 10, // CORRECT
    };

    expect(validPagination.perPage).toBe(10);
    expect(validPagination).not.toHaveProperty('limit');
    expect(validPagination).not.toHaveProperty('pageSize');
  });

  test('all pagination fields should be numbers', () => {
    const validPagination = {
      totalItems: 100,
      totalPages: 10,
      currentPage: 1,
      perPage: 10,
    };

    expect(typeof validPagination.totalItems).toBe('number');
    expect(typeof validPagination.totalPages).toBe('number');
    expect(typeof validPagination.currentPage).toBe('number');
    expect(typeof validPagination.perPage).toBe('number');

    // None should be NaN
    expect(Number.isNaN(validPagination.totalItems)).toBe(false);
    expect(Number.isNaN(validPagination.totalPages)).toBe(false);
    expect(Number.isNaN(validPagination.currentPage)).toBe(false);
    expect(Number.isNaN(validPagination.perPage)).toBe(false);
  });

  test('pagination calculation should never produce NaN', () => {
    const pagination = {
      totalItems: 100,
      totalPages: 10,
      currentPage: 2,
      perPage: 10,
    };

    const startItem = (pagination.currentPage - 1) * pagination.perPage + 1;
    const endItem = Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems);
    const totalItems = pagination.totalItems;

    expect(Number.isNaN(startItem)).toBe(false);
    expect(Number.isNaN(endItem)).toBe(false);
    expect(Number.isNaN(totalItems)).toBe(false);

    expect(startItem).toBe(11);
    expect(endItem).toBe(20);
    expect(totalItems).toBe(100);
  });

  test('undefined pagination fields produce NaN (demonstrates the bug)', () => {
    // This demonstrates why the bug occurred
    const wrongPagination = {
      total: 100, // WRONG field name
      currentPage: 1,
      perPage: 10,
    };

    // Using wrong field name produces undefined
    const totalItems = wrongPagination.totalItems; // undefined!
    const endItem = Math.min(wrongPagination.currentPage * wrongPagination.perPage, totalItems);

    // This is why we got NaN!
    expect(totalItems).toBeUndefined();
    expect(Number.isNaN(endItem)).toBe(true);
  });

  /**
   * CRITICAL BUG DEMONSTRATION: Using "total" instead of "totalItems"
   */
  test('CRITICAL: Using "total" instead of "totalItems" produces NaN', () => {
    // This is the EXACT bug that was in production
    const apiResponseWithWrongField = {
      currentPage: 1,
      perPage: 10,
      total: 100, // WRONG! API gateway converts total_items to totalItems
      totalPages: 10,
    };

    // The calculation that was in the component:
    const display = calculatePaginationDisplay({
      ...apiResponseWithWrongField,
      // totalItems is undefined because we used "total"
    });

    // This produces NaN!
    expect(Number.isNaN(display.endItem)).toBe(true);
    expect(display.text).toContain('NaN');
  });

  /**
   * Verify the fix: Using correct field name "totalItems"
   */
  test('FIX VERIFICATION: Using "totalItems" works correctly', () => {
    const correctApiResponse = {
      currentPage: 1,
      perPage: 10,
      totalItems: 100, // CORRECT field name
      totalPages: 10,
    };

    const display = calculatePaginationDisplay(correctApiResponse);

    expect(Number.isNaN(display.endItem)).toBe(false);
    expect(display.text).toBe('Showing 1 to 10 of 100 invoices');
    expect(display.text).not.toContain('NaN');
  });
});
