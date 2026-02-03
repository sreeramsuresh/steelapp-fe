import { beforeEach, describe, expect, it, vi } from "vitest";
import { categoryPolicyService } from "../categoryPolicyService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("categoryPolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCategoryPolicies", () => {
    it("should fetch all category policies with active_only filter", async () => {
      const mockResponse = {
        data: {
          policies: [
            {
              id: 1,
              category: "coil",
              pricing_mode: "MT_ONLY",
              requires_weight: true,
            },
            {
              id: 2,
              category: "sheet",
              pricing_mode: "PCS_ONLY",
              requires_weight: false,
            },
          ],
          taxonomy_status: { is_frozen: false },
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await categoryPolicyService.listCategoryPolicies(
        null,
        true
      );

      expect(result.policies).toHaveLength(2);
      expect(result.policies[0].category).toBe("coil");
      expect(api.get).toHaveBeenCalledWith(
        "/category-policies",
        expect.objectContaining({
          params: { active_only: true },
        })
      );
    });

    it("should fetch policies with active_only false", async () => {
      api.get.mockResolvedValue({
        data: { policies: [], taxonomy_status: { is_frozen: false } },
      });

      await categoryPolicyService.listCategoryPolicies(null, false);

      expect(api.get).toHaveBeenCalledWith(
        "/category-policies",
        expect.objectContaining({
          params: { active_only: false },
        })
      );
    });

    it("should handle API errors when fetching policies", async () => {
      api.get.mockRejectedValue(new Error("Network error"));

      await expect(
        categoryPolicyService.listCategoryPolicies(null, true)
      ).rejects.toThrow();
    });
  });

  describe("getCategoryPolicy", () => {
    it("should fetch pricing policy for specific category", async () => {
      const mockPolicy = {
        data: {
          policy: {
            id: 1,
            category: "coil",
            pricing_mode: "MT_ONLY",
            requires_weight: true,
            is_frozen: false,
          },
          is_frozen: false,
        },
      };

      api.get.mockResolvedValue(mockPolicy);

      const result = await categoryPolicyService.getCategoryPolicy(
        null,
        "coil"
      );

      expect(result.policy.category).toBe("coil");
      expect(result.policy.pricing_mode).toBe("MT_ONLY");
      expect(api.get).toHaveBeenCalledWith("/category-policies/coil");
    });

    it("should handle missing category policy", async () => {
      api.get.mockRejectedValue(new Error("Category not found"));

      await expect(
        categoryPolicyService.getCategoryPolicy(null, "invalid")
      ).rejects.toThrow();
    });
  });

  describe("getProductSubtypes", () => {
    it("should fetch all product subtypes without category filter", async () => {
      const mockResponse = {
        data: {
          subtypes: [
            { id: 1, name: "Cold Rolled", category: "sheet" },
            { id: 2, name: "Hot Rolled", category: "sheet" },
            { id: 3, name: "Seamless", category: "pipe" },
          ],
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await categoryPolicyService.getProductSubtypes(null);

      expect(result.subtypes).toHaveLength(3);
      expect(api.get).toHaveBeenCalledWith(
        "/category-policies/subtypes/list",
        { params: {} }
      );
    });

    it("should fetch product subtypes with category filter", async () => {
      const mockResponse = {
        data: {
          subtypes: [
            { id: 1, name: "Cold Rolled", category: "sheet" },
            { id: 2, name: "Hot Rolled", category: "sheet" },
          ],
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await categoryPolicyService.getProductSubtypes(
        null,
        "sheet"
      );

      expect(result.subtypes).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith(
        "/category-policies/subtypes/list",
        expect.objectContaining({
          params: { category: "sheet" },
        })
      );
    });
  });

  describe("getTaxonomyStatus", () => {
    it("should fetch taxonomy freeze status", async () => {
      const mockResponse = {
        data: {
          status: {
            is_frozen: false,
            last_modified: "2024-01-15T10:00:00Z",
          },
          is_frozen: false,
        },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await categoryPolicyService.getTaxonomyStatus(null);

      expect(result.is_frozen).toBe(false);
      expect(api.get).toHaveBeenCalledWith("/category-policies/taxonomy/status");
    });
  });

  describe("getPricingUnitFromPolicy", () => {
    it("should return WEIGHT for MT_ONLY pricing mode", () => {
      const policy = { pricing_mode: "MT_ONLY" };
      const result = categoryPolicyService.getPricingUnitFromPolicy(policy);
      expect(result).toBe("WEIGHT");
    });

    it("should return PIECE for PCS_ONLY pricing mode", () => {
      const policy = { pricing_mode: "PCS_ONLY" };
      const result = categoryPolicyService.getPricingUnitFromPolicy(policy);
      expect(result).toBe("PIECE");
    });

    it("should return WEIGHT for CONVERTIBLE pricing mode", () => {
      const policy = { pricing_mode: "CONVERTIBLE" };
      const result = categoryPolicyService.getPricingUnitFromPolicy(policy);
      expect(result).toBe("WEIGHT");
    });

    it("should return null for null policy", () => {
      const result = categoryPolicyService.getPricingUnitFromPolicy(null);
      expect(result).toBeNull();
    });

    it("should return null for unknown pricing mode", () => {
      const policy = { pricing_mode: "UNKNOWN" };
      const result = categoryPolicyService.getPricingUnitFromPolicy(policy);
      expect(result).toBeNull();
    });
  });

  describe("requiresWeight", () => {
    it("should return true when policy requires weight", () => {
      const policy = { requires_weight: true };
      expect(categoryPolicyService.requiresWeight(policy)).toBe(true);
    });

    it("should return false when policy does not require weight", () => {
      const policy = { requires_weight: false };
      expect(categoryPolicyService.requiresWeight(policy)).toBe(false);
    });

    it("should return false for null policy", () => {
      expect(categoryPolicyService.requiresWeight(null)).toBe(false);
    });
  });

  describe("isConvertible", () => {
    it("should return true for CONVERTIBLE pricing mode", () => {
      const policy = { pricing_mode: "CONVERTIBLE" };
      expect(categoryPolicyService.isConvertible(policy)).toBe(true);
    });

    it("should return false for non-CONVERTIBLE pricing mode", () => {
      const policy = { pricing_mode: "MT_ONLY" };
      expect(categoryPolicyService.isConvertible(policy)).toBe(false);
    });

    it("should return false for null policy", () => {
      expect(categoryPolicyService.isConvertible(null)).toBe(false);
    });
  });

  describe("buildPolicyCache", () => {
    it("should build cache map from policies array", () => {
      const policies = [
        { category: "coil", pricing_mode: "MT_ONLY" },
        { category: "sheet", pricing_mode: "PCS_ONLY" },
      ];

      const cache = categoryPolicyService.buildPolicyCache(policies);

      expect(cache.has("coil")).toBe(true);
      expect(cache.has("sheet")).toBe(true);
      expect(cache.get("coil").pricing_mode).toBe("MT_ONLY");
    });

    it("should handle case-insensitive category keys", () => {
      const policies = [{ category: "COIL", pricing_mode: "MT_ONLY" }];

      const cache = categoryPolicyService.buildPolicyCache(policies);

      expect(cache.has("coil")).toBe(true);
      expect(cache.get("coil").pricing_mode).toBe("MT_ONLY");
    });

    it("should return empty map for null or non-array policies", () => {
      const cache1 = categoryPolicyService.buildPolicyCache(null);
      const cache2 = categoryPolicyService.buildPolicyCache([]);

      expect(cache1.size).toBe(0);
      expect(cache2.size).toBe(0);
    });
  });
});
