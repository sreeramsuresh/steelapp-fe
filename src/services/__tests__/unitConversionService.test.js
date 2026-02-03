import { beforeEach, describe, expect, it, vi } from "vitest";
import { unitConversionService } from "../unitConversionService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("unitConversionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      api.get.mockResolvedValue({ data: mockResponse });

      const result = await unitConversionService.listConversionFormulas();

      expect(result.formulas).toHaveLength(2);
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

      api.get.mockResolvedValue({ data: mockResponse });

      const result = await unitConversionService.getConversionFormula("sheet");

      expect(result.formula).toContain("weight");
      expect(result.variables).toContain("width");
      expect(api.get).toHaveBeenCalledWith(
        "/unit-conversions/formulas/sheet"
      );
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

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await unitConversionService.calculateWeight(1, 10, "PCS");

      expect(result.weight_kg).toBe(100);
      expect(result.weight_mt).toBe(0.1);
      expect(api.post).toHaveBeenCalledWith(
        "/unit-conversions/calculate-weight",
        expect.any(Object)
      );
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

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await unitConversionService.convertUnits(
        1,
        1000,
        "KG",
        "MT"
      );

      expect(result.to_quantity).toBe(0.5);
      expect(result.success).toBe(true);
      expect(api.post).toHaveBeenCalledWith(
        "/unit-conversions/convert",
        expect.any(Object)
      );
    });

    it("should handle conversion errors gracefully", async () => {
      const mockResponse = {
        to_quantity: null,
        success: false,
        error_code: "MISSING_DIMENSIONS",
        message: "Product dimensions not found",
        missing_fields: ["width", "thickness"],
      };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await unitConversionService.convertUnits(1, 100, "PCS", "KG");

      expect(result.success).toBe(false);
      expect(result.missing_fields).toHaveLength(2);
    });
  });
});
