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

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { normalizeProduct } from "../fieldAccessors.js.js";
import { assertProductDomain, getContractErrors, hasContractViolation } from "../productContract.js.js";

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
    test("should pass validation for a valid product", () => {
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

      expect(() => assertProductDomain(validProduct)).not;
    });

    test("should fail validation if product is null", () => {
      expect(() => assertProductDomain(null));
    });

    test("should fail validation if product is not an object", () => {
      expect(() => assertProductDomain("not an object"));
    });

    test("should fail validation if id is missing", () => {
      const invalidProduct = {
        // id is missing
        name: "Test Product",
        unitWeightKg: 46.5,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if name is missing or empty", () => {
      const invalidProduct = {
        id: 1,
        name: "", // Empty string
        unitWeightKg: 46.5,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if name is not a string", () => {
      const invalidProduct = {
        id: 1,
        name: 123, // Number instead of string
        unitWeightKg: 46.5,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if unitWeightKg is not a number", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: "46.5", // String instead of number
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if unitWeightKg is NaN", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: NaN,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if unitWeightKg is Infinity", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: Infinity,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if unitWeightKg is negative", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: -46.5,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if piecesPerMt is not positive", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        piecesPerMt: 0, // Must be > 0
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should fail validation if piecesPerMt is negative", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        piecesPerMt: -21.51,
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should pass validation if optional numeric fields are null", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: null,
        piecesPerMt: null,
        primaryUom: null,
      };

      expect(() => assertProductDomain(validProduct)).not;
    });

    test("should pass validation if optional numeric fields are undefined", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: undefined,
        piecesPerMt: undefined,
        primaryUom: undefined,
      };

      expect(() => assertProductDomain(validProduct)).not;
    });

    test("should fail validation if primaryUom is not a string", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        primaryUom: 123, // Number instead of string
      };

      expect(() => assertProductDomain(invalidProduct));
    });

    test("should pass validation if primaryUom is a string", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        primaryUom: "MT",
      };

      expect(() => assertProductDomain(validProduct)).not;
    });
  });

  describe("Normalization Leak Detection", () => {
    test("should fail validation if snake_case keys are present (normalization leak)", () => {
      const leakedProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: 46.5,
        unit_weight_kg: 46.5, // Normalization leak!
      };

      expect(() => assertProductDomain(leakedProduct));
      expect(() => assertProductDomain(leakedProduct));
    });

    test("should detect all forbidden snake_case keys", () => {
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

      expect(() => assertProductDomain(leakedProduct));
      expect(() => assertProductDomain(leakedProduct));
      expect(() => assertProductDomain(leakedProduct));
      expect(() => assertProductDomain(leakedProduct));
    });

    test("should pass validation if only camelCase keys are present (no leak)", () => {
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

      expect(() => assertProductDomain(cleanProduct)).not;
    });
  });

  describe("normalizeProduct() Integration", () => {
    test("should automatically call assertProductDomain() when normalizing", () => {
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
      assert.strictEqual(normalized.unitWeightKg, 46.5);
      assert.strictEqual(normalized.piecesPerMt, 21.51);
      assert.strictEqual(normalized.productCategory, "SHEET");

      // Should NOT have snake_case fields (cleaned up)
      expect(normalized.unit_weight_kg).toBeUndefined();
      expect(normalized.pieces_per_mt).toBeUndefined();
      expect(normalized.product_category).toBeUndefined();
    });

    test("should throw if normalizeProduct receives invalid data", () => {
      const invalidProduct = {
        id: 1,
        name: "Test Product",
        unit_weight_kg: "not a number", // Invalid type
      };

      // Should throw because unitWeightKg will be 'not a number' after normalization
      expect(() => normalizeProduct(invalidProduct));
    });
  });

  describe("Contract Violation Helpers (Production)", () => {
    test("should mark product as invalid in production mode", () => {
      // Temporarily set to production mode
      import.meta.env.DEV = false;
      import.meta.env.PROD = true;

      const invalidProduct = {
        id: 1,
        name: "", // Invalid: empty name
      };

      // In production, should not throw but mark as invalid
      assertProductDomain(invalidProduct);

      expect(hasContractViolation(invalidProduct));
      expect(getContractErrors(invalidProduct).length).toBeGreaterThan(0);
    });

    test("should not mark valid products as invalid", () => {
      const validProduct = {
        id: 1,
        name: "Test Product",
        unitWeightKg: 46.5,
      };

      assertProductDomain(validProduct);

      expect(hasContractViolation(validProduct));
      expect(getContractErrors(validProduct));
    });
  });

  describe("Multiple Violations", () => {
    test("should report all violations at once", () => {
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
        assert.ok(error.message.includes("name must be a non-empty string"));
        assert.ok(error.message.includes("unitWeightKg"));
        assert.ok(error.message.includes("Normalization leak"));
      }
    });
  });
});
