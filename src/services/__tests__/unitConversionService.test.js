/**
 * Unit Conversion Service Unit Tests (Node Native Test Runner)
 * Tests unit conversion formulas and weight calculations
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api.js";
import { unitConversionService } from "../unitConversionService.js";

describe("unitConversionService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listConversionFormulas", () => {
    it("should fetch all conversion formulas", async () => {
      const mockResponse = {
        formulas: [
          {
            category: "sheet",
            formula: "weight = width * thickness * length * density",
          },
          {
            category: "pipe",
            formula: "weight = length * (diameter^2 - inner_diameter^2) * density",
          },
        ],
      };

      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await unitConversionService.listConversionFormulas();

      expect(result.formulas.length).toBe(2);
      expect(api.get).toHaveBeenCalledWith("/unit-conversions/formulas");
    });
  });

  describe("getConversionFormula", () => {
    it("should fetch conversion formula for specific category", async () => {
      const mockResponse = {
        formula: "weight = width * thickness * length * density",
        category: "sheet",
        variables: ["width", "thickness", "length", "density"],
      };

      vi.spyOn(api, "get").mockResolvedValue(mockResponse);

      const result = await unitConversionService.getConversionFormula("sheet");

      expect(result.formula).toContain("weight");
      expect(result.variables).toContain("width");
      expect(api.get).toHaveBeenCalledWith("/unit-conversions/formulas/sheet");
    });
  });

  describe("calculateWeight", () => {
    it("should calculate weight for product with quantity and unit", async () => {
      const mockResponse = {
        weight_kg: 100,
        weight_mt: 0.1,
        formula_type: "dimension_based",
        is_theoretical: true,
      };

      vi.spyOn(api, "post").mockResolvedValue(mockResponse);

      const result = await unitConversionService.calculateWeight(1, 10, "PCS");

      expect(result.weight_kg).toBe(100);
      expect(result.weight_mt).toBe(0.1);
      expect(api.post).toHaveBeenCalledWith("/unit-conversions/calculate-weight", expect.anything());
    });
  });

  describe("convertUnits", () => {
    it("should convert between units for a product", async () => {
      const mockResponse = {
        to_quantity: 0.5,
        conversion_factor: 0.5,
        success: true,
        display_only: false,
      };

      vi.spyOn(api, "post").mockResolvedValue(mockResponse);

      const result = await unitConversionService.convertUnits(1, 1000, "KG", "MT");

      expect(result.to_quantity).toBe(0.5);
      expect(result.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith("/unit-conversions/convert", expect.anything());
    });

    it("should handle conversion errors gracefully", async () => {
      const mockResponse = {
        to_quantity: null,
        success: false,
        error_code: "MISSING_DIMENSIONS",
        message: "Product dimensions not found",
        missing_fields: ["width", "thickness"],
      };

      vi.spyOn(api, "post").mockResolvedValue(mockResponse);

      const result = await unitConversionService.convertUnits(1, 100, "PCS", "KG");

      expect(result.success).toBe(false);
      expect(result.missing_fields.length).toBe(2);
    });
  });
});
