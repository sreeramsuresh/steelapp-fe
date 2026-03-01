/**
 * Category Policy Service Unit Tests
 * Tests product category policies and rules
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../api.js";
import { categoryPolicyService } from "../categoryPolicyService.js";

describe("categoryPolicyService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listCategoryPolicies", () => {
    it("should fetch category policies", async () => {
      const mockPolicies = [
        { category: "coil", pricing_mode: "MT_ONLY", requires_weight: true },
        { category: "sheet", pricing_mode: "CONVERTIBLE", requires_weight: true },
      ];
      vi.spyOn(api, "get").mockResolvedValue(mockPolicies);

      const result = await categoryPolicyService.listCategoryPolicies(1);

      expect(result.length).toBe(2);
      expect(api.get).toHaveBeenCalled();
    });
  });

  describe("getCategoryPolicy", () => {
    it("should fetch single category policy", async () => {
      const mockPolicy = { category: "coil", pricing_mode: "MT_ONLY" };
      vi.spyOn(api, "get").mockResolvedValue(mockPolicy);

      const result = await categoryPolicyService.getCategoryPolicy(1, "coil");

      expect(result.category).toBe("coil");
      expect(api.get).toHaveBeenCalled();
    });
  });

  describe("getPricingUnitFromPolicy", () => {
    it("should map MT_ONLY to WEIGHT", () => {
      const result = categoryPolicyService.getPricingUnitFromPolicy({ pricing_mode: "MT_ONLY" });
      expect(result).toBe("WEIGHT");
    });

    it("should map PCS_ONLY to PIECE", () => {
      const result = categoryPolicyService.getPricingUnitFromPolicy({ pricing_mode: "PCS_ONLY" });
      expect(result).toBe("PIECE");
    });

    it("should return null for missing policy", () => {
      const result = categoryPolicyService.getPricingUnitFromPolicy(null);
      expect(result).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should handle API errors", async () => {
      vi.spyOn(api, "get").mockRejectedValue(new Error("Network error"));

      try {
        await categoryPolicyService.listCategoryPolicies(1);
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });
  });
});
