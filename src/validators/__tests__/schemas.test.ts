/**
 * Runtime API Response Validator Tests
 *
 * These tests ensure our Zod schemas correctly validate API responses.
 * Prevents bugs like NaN in pagination when API returns unexpected shapes.
 */

import { describe, it, expect } from "vitest";
import {
  PageInfoSchema,
  InvoiceListResponseSchema,
  validatePagination,
  safePagination,
} from "../schemas";

describe("PageInfoSchema", () => {
  it("should pass with valid pagination data", () => {
    const validPagination = {
      currentPage: 1,
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
      hasNext: true,
      hasPrev: false,
    };

    const result = PageInfoSchema.safeParse(validPagination);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalItems).toBe(100);
      expect(result.data.perPage).toBe(10);
    }
  });

  it("should fail when totalItems is missing", () => {
    const invalidPagination = {
      currentPage: 1,
      perPage: 10,
      // totalItems missing!
      totalPages: 10,
    };

    const result = PageInfoSchema.safeParse(invalidPagination);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("totalItems")),
      ).toBe(true);
    }
  });

  it('should fail when totalItems is wrong type (using "total" instead of "totalItems")', () => {
    // This is the exact bug that caused NaN in production!
    const wrongFieldName = {
      currentPage: 1,
      perPage: 10,
      total: 100, // WRONG! Should be totalItems
      totalPages: 10,
    };

    const result = PageInfoSchema.safeParse(wrongFieldName);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("totalItems")),
      ).toBe(true);
    }
  });

  it("should fail when perPage is missing", () => {
    const missingPerPage = {
      currentPage: 1,
      // perPage missing!
      totalItems: 100,
      totalPages: 10,
    };

    const result = PageInfoSchema.safeParse(missingPerPage);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("perPage"))).toBe(
        true,
      );
    }
  });

  it("should tolerate extra fields (passthrough)", () => {
    const withExtraFields = {
      currentPage: 1,
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
      extraField: "should be ignored",
      anotherExtra: 123,
    };

    const result = PageInfoSchema.safeParse(withExtraFields);

    // Should pass - extra fields are tolerated
    expect(result.success).toBe(true);
  });

  it("should fail when value is not a number", () => {
    const stringValues = {
      currentPage: "1", // string instead of number
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
    };

    const result = PageInfoSchema.safeParse(stringValues);

    expect(result.success).toBe(false);
  });

  it("should pass with optional hasNext/hasPrev missing", () => {
    const minimalValid = {
      currentPage: 1,
      perPage: 10,
      totalItems: 50,
      totalPages: 5,
    };

    const result = PageInfoSchema.safeParse(minimalValid);

    expect(result.success).toBe(true);
  });
});

describe("InvoiceListResponseSchema", () => {
  it("should pass with valid invoice list response", () => {
    const validResponse = {
      invoices: [
        { id: 1, invoiceNumber: "INV-001" },
        { id: 2, invoiceNumber: "INV-002" },
      ],
      pagination: {
        currentPage: 1,
        perPage: 10,
        totalItems: 2,
        totalPages: 1,
      },
    };

    const result = InvoiceListResponseSchema.safeParse(validResponse);

    expect(result.success).toBe(true);
  });

  it("should pass with null pagination", () => {
    const noPagination = {
      invoices: [],
      pagination: null,
    };

    const result = InvoiceListResponseSchema.safeParse(noPagination);

    expect(result.success).toBe(true);
  });

  it("should fail with invalid pagination structure", () => {
    const invalidPagination = {
      invoices: [],
      pagination: {
        currentPage: 1,
        // Missing required fields
      },
    };

    const result = InvoiceListResponseSchema.safeParse(invalidPagination);

    expect(result.success).toBe(false);
  });
});

describe("validatePagination helper", () => {
  it("should return success with valid data", () => {
    const valid = {
      currentPage: 1,
      perPage: 10,
      totalItems: 100,
      totalPages: 10,
    };

    const result = validatePagination(valid, "InvoiceList");

    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
  });

  it("should return error with invalid data", () => {
    const invalid = { currentPage: 1 };

    const result = validatePagination(invalid, "InvoiceList");

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });
});

describe("safePagination helper", () => {
  it("should return valid pagination as-is", () => {
    const valid = {
      currentPage: 2,
      perPage: 20,
      totalItems: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: true,
    };

    const result = safePagination(valid);

    expect(result.currentPage).toBe(2);
    expect(result.perPage).toBe(20);
    expect(result.totalItems).toBe(100);
    expect(result.totalPages).toBe(5);
  });

  it("should return safe defaults for invalid pagination", () => {
    const invalid = null;

    const result = safePagination(invalid);

    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.perPage).toBe(10);
    expect(typeof result.totalItems).toBe("number");
    expect(Number.isNaN(result.totalItems)).toBe(false);
  });

  it("should return safe defaults for undefined", () => {
    const result = safePagination(undefined);

    expect(result.totalItems).toBe(0);
    expect(Number.isNaN(result.totalItems)).toBe(false);
  });

  it("should return safe defaults for wrong field names", () => {
    // The bug that caused NaN - using "total" instead of "totalItems"
    const wrongFields = {
      currentPage: 1,
      perPage: 10,
      total: 100, // WRONG field name!
      totalPages: 10,
    };

    const result = safePagination(wrongFields);

    // Should return defaults, not NaN
    expect(result.totalItems).toBe(0);
    expect(Number.isNaN(result.totalItems)).toBe(false);
  });
});
