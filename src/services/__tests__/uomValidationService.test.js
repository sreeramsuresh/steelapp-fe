import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import { uomValidationService } from "../uomValidationService.js";

describe("uomValidationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateQuantity", () => {
    it("validates quantity with given unit", async () => {
      apiClient.post.mockResolvedValue({ valid: true });

      const result = await uomValidationService.validateQuantity(10, "PCS");

      expect(apiClient.post).toHaveBeenCalledWith("/uom/validate-quantity", {
        quantity: 10,
        unit: "PCS",
      });
      expect(result.valid).toBe(true);
    });

    it("defaults to PCS when unit is not provided", async () => {
      apiClient.post.mockResolvedValue({ valid: true });

      await uomValidationService.validateQuantity(5, null);

      expect(apiClient.post).toHaveBeenCalledWith("/uom/validate-quantity", {
        quantity: 5,
        unit: "PCS",
      });
    });

    it("returns valid:true on API error (fail open)", async () => {
      apiClient.post.mockRejectedValue(new Error("Network error"));

      const result = await uomValidationService.validateQuantity(10, "KG");

      expect(result.valid).toBe(true);
    });
  });

  describe("convert", () => {
    it("converts quantity between units", async () => {
      apiClient.post.mockResolvedValue({ success: true, converted: 0.01 });

      const result = await uomValidationService.convert(10, "KG", "MT");

      expect(apiClient.post).toHaveBeenCalledWith("/uom/convert", {
        quantity: 10,
        fromUnit: "KG",
        toUnit: "MT",
        unitWeightKg: null,
      });
      expect(result.success).toBe(true);
    });

    it("returns error on API failure", async () => {
      apiClient.post.mockRejectedValue(new Error("Conversion error"));

      const result = await uomValidationService.convert(10, "PCS", "KG");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Conversion error");
    });
  });

  describe("validateWeightTolerance", () => {
    it("validates weight tolerance", async () => {
      apiClient.post.mockResolvedValue({
        valid: true,
        varianceKg: 0.5,
        variancePct: 0.1,
      });

      const result = await uomValidationService.validateWeightTolerance(500, 499.5, "PLATES");

      expect(apiClient.post).toHaveBeenCalledWith("/uom/validate-weight-tolerance", {
        actualWeightKg: 500,
        theoreticalWeightKg: 499.5,
        productCategory: "PLATES",
      });
      expect(result.valid).toBe(true);
    });

    it("returns safe defaults on error", async () => {
      apiClient.post.mockRejectedValue(new Error("Fail"));

      const result = await uomValidationService.validateWeightTolerance(100, 100);

      expect(result.valid).toBe(true);
      expect(result.tolerancePct).toBe(5);
    });
  });

  describe("getValidUnits", () => {
    it("fetches valid units from API", async () => {
      apiClient.get.mockResolvedValue({ units: ["PCS", "KG", "MT"] });

      const result = await uomValidationService.getValidUnits();

      expect(apiClient.get).toHaveBeenCalledWith("/uom/valid-units");
      expect(result.units).toContain("PCS");
    });

    it("returns fallback units on error", async () => {
      apiClient.get.mockRejectedValue(new Error("Fail"));

      const result = await uomValidationService.getValidUnits();

      expect(result.units).toContain("PCS");
      expect(result.units).toContain("KG");
    });
  });

  describe("validateInvoiceItems", () => {
    it("batch validates invoice items", async () => {
      const items = [{ name: "Bar", quantity: 10, unit: "PCS" }];
      apiClient.post.mockResolvedValue({
        valid: true,
        results: [{ name: "Bar", valid: true }],
      });

      const result = await uomValidationService.validateInvoiceItems(items);

      expect(result.valid).toBe(true);
    });

    it("fails open on error", async () => {
      const items = [{ name: "Bar", quantity: 10, unit: "PCS" }];
      apiClient.post.mockRejectedValue(new Error("Fail"));

      const result = await uomValidationService.validateInvoiceItems(items);

      expect(result.valid).toBe(true);
      expect(result.results[0].name).toBe("Bar");
    });
  });
});
