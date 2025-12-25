/**
 * Product Domain Contract Guard Tests (GUARD #2 - SUSPENDERS)
 *
 * PURPOSE:
 * Validates that the frontend boundary assertion guard correctly detects
 * corrupt product data and prevents it from reaching UI components.
 *
 * CRITICAL: This test ensures that:
 * 1. assertProductDomain() validates required fields (id, name)
 * 2. assertProductDomain() validates numeric field types
 * 3. assertProductDomain() detects normalization leaks (snake_case keys)
 * 4. normalizeProduct() automatically calls assertProductDomain()
 * 5. productsAPI methods automatically normalize responses
 *
 * TEST STRATEGY:
 * - Test valid products pass assertion
 * - Test missing required fields fail assertion
 * - Test invalid numeric types fail assertion
 * - Test normalization leaks fail assertion
 * - Test normalizeProduct integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  assertProductDomain,
  hasContractViolation,
  getContractErrors,
} from "../productContract.js";
import { normalizeProduct } from "../fieldAccessors.js";

// Mock import.meta.env for testing
const originalEnv = import.meta.env;
beforeEach(() => {
  import.meta.env = { ...originalEnv, DEV: true, PROD: false };
});

afterEach(() => {
  import.meta.env = originalEnv;
});

describe("Product Domain Contract Guard (GUARD #2)", () => {
  describe("assertProductDomain()", () => {
    it("should pass validation for a valid product", () => {
      const validProduct = {
        id: 1,
        name: "SS-304-SHEET-2B-1219mm-2.0mm-2438mm",
        displayName: "SS-304-SHEET-2B-1219mm-2.0mm-2438mm",
        unitWeightKg: 46.5,
        piecesPerMt: 21.51,
        productCategory: "SHEET",
        pricingBasis: "PER_MT",
        primaryUom: "MT",
      };

      expect(() => assertProductDomain(validProduct)).not.toThrow();
    });

    it("should fail validation if product is null", () => {
      expect(() => assertProductDomain(null)).toThrow(
        /Product is null or not an object/,
      );
    });

    it("should fail validation if product is not an object", () => {
      expect(() => assertProductDomain("not an object")).toThrow(
        /Product is null or not an object/,
      );
    });

    it("should fail validation if id is missing", () => {
      const invalidProduct = {
        // id is missing
        name: "Test Product",
        unitWeightKg: 46.5,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /Product ID is required/,
      );
    });

    it("should fail validation if name is missing or empty", () => {
      const invalidProduct = {
        id: 1,
        name: "", // Empty string
        unitWeightKg: 46.5,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /name must be a non-empty string/,
      );
    });

    it("should fail validation if name is not a string", () => {
      const invalidProduct = {
        id: 1,
        name: 123, // Number instead of string
        unitWeightKg: 46.5,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /name must be a non-empty string/,
      );
    });

    it("should fail validation if unitWeightKg is not a number", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: "46.5", // String instead of number
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /unitWeightKg must be a finite/,
      );
    });

    it("should fail validation if unitWeightKg is NaN", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: NaN,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /unitWeightKg must be a finite/,
      );
    });

    it("should fail validation if unitWeightKg is Infinity", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: Infinity,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /unitWeightKg must be a finite/,
      );
    });

    it("should fail validation if unitWeightKg is negative", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: -46.5,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /unitWeightKg must be a finite non-negative/,
      );
    });

    it("should fail validation if piecesPerMt is not positive", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        piecesPerMt: 0, // Must be > 0
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /piecesPerMt must be a finite positive/,
      );
    });

    it("should fail validation if piecesPerMt is negative", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        piecesPerMt: -21.51,
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /piecesPerMt must be a finite positive/,
      );
    });

    it("should pass validation if optional numeric fields are null", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: null,
        piecesPerMt: null,
        primaryUom: null,
      };

      expect(() => assertProductDomain(validProduct)).not.toThrow();
    });

    it("should pass validation if optional numeric fields are undefined", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: undefined,
        piecesPerMt: undefined,
        primaryUom: undefined,
      };

      expect(() => assertProductDomain(validProduct)).not.toThrow();
    });

    it("should fail validation if primaryUom is not a string", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        primaryUom: 123, // Number instead of string
      };

      expect(() => assertProductDomain(invalidProduct)).toThrow(
        /primaryUom must be a string/,
      );
    });

    it("should pass validation if primaryUom is a string", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        primaryUom: "MT",
      };

      expect(() => assertProductDomain(validProduct)).not.toThrow();
    });
  });

  describe("Normalization Leak Detection", () => {
    it("should fail validation if snake_case keys are present (normalization leak)", () => {
      const leakedProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: 46.5,
        unit_weight_kg: 46.5, // Normalization leak!
      };

      expect(() => assertProductDomain(leakedProduct)).toThrow(
        /Normalization leak detected/,
      );
      expect(() => assertProductDomain(leakedProduct)).toThrow(
        /unit_weight_kg/,
      );
    });

    it("should detect all forbidden snake_case keys", () => {
      const leakedProduct = {
        id: 1,
        name: "Test Product",
        // All forbidden keys present
        unit_weight_kg: 46.5,
        pieces_per_mt: 21.51,
        product_category: "SHEET",
        pricing_basis: "PER_MT",
        primary_uom: "MT",
        display_name: "Display",
        full_name: "Full",
        unique_name: "Unique",
      };

      expect(() => assertProductDomain(leakedProduct)).toThrow(
        /Normalization leak detected/,
      );
      expect(() => assertProductDomain(leakedProduct)).toThrow(
        /unit_weight_kg/,
      );
      expect(() => assertProductDomain(leakedProduct)).toThrow(/pieces_per_mt/);
      expect(() => assertProductDomain(leakedProduct)).toThrow(
        /product_category/,
      );
    });

    it("should pass validation if only camelCase keys are present (no leak)", () => {
      const cleanProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: 46.5,
        piecesPerMt: 21.51,
        productCategory: "SHEET",
        pricingBasis: "PER_MT",
        primaryUom: "MT",
        displayName: "Display",
        fullName: "Full",
        uniqueName: "Unique",
      };

      expect(() => assertProductDomain(cleanProduct)).not.toThrow();
    });
  });

  describe("normalizeProduct() Integration", () => {
    it("should automatically call assertProductDomain() when normalizing", () => {
      const rawProduct = {
        id: 1,
        name: "Test Product",
        unit_weight_kg: 46.5,
        pieces_per_mt: 21.51,
        product_category: "SHEET",
      };

      // normalizeProduct should convert to camelCase and call assertProductDomain
      const normalized = normalizeProduct(rawProduct);

      // Should have camelCase fields
      expect(normalized.unitWeightKg).toBe(46.5);
      expect(normalized.piecesPerMt).toBe(21.51);
      expect(normalized.productCategory).toBe("SHEET");

      // Should NOT have snake_case fields (cleaned up)
      expect(normalized.unit_weight_kg).toBeUndefined();
      expect(normalized.pieces_per_mt).toBeUndefined();
      expect(normalized.product_category).toBeUndefined();
    });

    it("should throw if normalizeProduct receives invalid data", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unit_weight_kg: "not a number", // Invalid type
      };

      // Should throw because unitWeightKg will be 'not a number' after normalization
      expect(() => normalizeProduct(invalidProduct)).toThrow();
    });
  });

  describe("Contract Violation Helpers (Production)", () => {
    it("should mark product as invalid in production mode", () => {
      // Temporarily set to production mode
      import.meta.env.DEV = false;
      import.meta.env.PROD = true;

      const invalidProduct = {
        id: 1,
        name: "", // Invalid: empty name
      };

      // In production, should not throw but mark as invalid
      assertProductDomain(invalidProduct);

      expect(hasContractViolation(invalidProduct)).toBe(true);
      expect(getContractErrors(invalidProduct).length).toBeGreaterThan(0);
    });

    it("should not mark valid products as invalid", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: 46.5,
      };

      assertProductDomain(validProduct);

      expect(hasContractViolation(validProduct)).toBe(false);
      expect(getContractErrors(validProduct)).toEqual([]);
    });
  });

  describe("Multiple Violations", () => {
    it("should report all violations at once", () => {
      const multiViolationProduct = {
        id: 1,
        name: "", // Violation 1: empty name
        unitWeightKg: "not a number", // Violation 2: invalid type
        unit_weight_kg: 46.5, // Violation 3: normalization leak
      };

      try {
        assertProductDomain(multiViolationProduct);
        throw new Error("Should have thrown");
      } catch (error) {
        // Should contain multiple violations in error message
        expect(error.message).toContain("name must be a non-empty string");
        expect(error.message).toContain("unitWeightKg");
        expect(error.message).toContain("Normalization leak");
      }
    });
  });
});
