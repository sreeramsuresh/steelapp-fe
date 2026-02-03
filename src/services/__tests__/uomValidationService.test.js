import { beforeEach, describe, expect, it, vi } from "vitest";
import { uomValidationService } from "../uomValidationService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("uomValidationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateUomForProduct", () => {
    it("should validate UOM is compatible with product type", async () => {
      const mockResponse = {
        product_id: 1,
        product_name: "SS304 Sheet",
        requested_uom: "kg",
        is_valid: true,
        allowed_uoms: ["kg", "pcs", "mt"],
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await uomValidationService.validateUomForProduct(1, "kg");

      expect(result.is_valid).toBe(true);
      expect(result.allowed_uoms).toContain("kg");
      expect(api.post).toHaveBeenCalledWith("/uom-validation/validate", expect.any(Object));
    });

    it("should reject invalid UOM for product", async () => {
      const mockResponse = {
        product_id: 1,
        requested_uom: "meter",
        is_valid: false,
        error: "UOM 'meter' not allowed for sheet products",
        allowed_uoms: ["kg", "pcs", "mt"],
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await uomValidationService.validateUomForProduct(1, "meter");

      expect(result.is_valid).toBe(false);
    });
  });

  describe("validateUomConversion", () => {
    it("should validate UOM conversion is valid", async () => {
      const mockResponse = {
        from_uom: "kg",
        to_uom: "mt",
        is_convertible: true,
        conversion_factor: 0.001,
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await uomValidationService.validateUomConversion("kg", "mt");

      expect(result.is_convertible).toBe(true);
      expect(result.conversion_factor).toBe(0.001);
    });

    it("should reject non-convertible UOM pairs", async () => {
      const mockResponse = {
        from_uom: "kg",
        to_uom: "meter",
        is_convertible: false,
        error: "Cannot convert weight to length",
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await uomValidationService.validateUomConversion("kg", "meter");

      expect(result.is_convertible).toBe(false);
    });
  });

  describe("getProductUomOptions", () => {
    it("should fetch allowed UOMs for product", async () => {
      const mockResponse = {
        product_id: 1,
        product_name: "SS304 Sheet",
        allowed_uoms: [
          { value: "kg", label: "Kilogram", base: true },
          { value: "mt", label: "Metric Ton", base: false },
          { value: "pcs", label: "Pieces", base: false },
        ],
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await uomValidationService.getProductUomOptions(1);

      expect(result.allowed_uoms).toHaveLength(3);
      expect(result.allowed_uoms[0].base).toBe(true);
      expect(api.get).toHaveBeenCalledWith("/uom-validation/product/1/uoms");
    });
  });

  describe("validateBatchUomConsistency", () => {
    it("should validate all line items use compatible UOMs", async () => {
      const mockResponse = {
        is_valid: true,
        consistency_errors: [],
        conversion_required: false,
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        line_items: [
          { product_id: 1, uom: "kg", quantity: 500 },
          { product_id: 1, uom: "mt", quantity: 0.5 },
        ],
      };

      const result = await uomValidationService.validateBatchUomConsistency(payload);

      expect(result.is_valid).toBe(true);
      expect(result.consistency_errors).toHaveLength(0);
    });

    it("should detect UOM inconsistencies in batch", async () => {
      const mockResponse = {
        is_valid: false,
        consistency_errors: [
          {
            line_index: 1,
            product_id: 2,
            error: "UOM 'meter' not allowed for pipe products",
          },
        ],
        conversion_required: false,
      };

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        line_items: [
          { product_id: 1, uom: "kg", quantity: 500 },
          { product_id: 2, uom: "meter", quantity: 100 },
        ],
      };

      const result = await uomValidationService.validateBatchUomConsistency(payload);

      expect(result.is_valid).toBe(false);
      expect(result.consistency_errors).toHaveLength(1);
    });
  });
});
