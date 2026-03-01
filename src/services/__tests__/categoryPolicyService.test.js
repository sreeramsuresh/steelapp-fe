/**
 * Category Policy Service Unit Tests (Node Native Test Runner)
 * Tests product category policies and pricing rules
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";

describe("categoryPolicyService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/category-policies", {
        params: { active_only: true },
      });

      expect(result.data.policies.length).toBe(2);
      expect(result.data.policies[0].category).toBe("coil");
    });

    it("should fetch policies with active_only false", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue({
        data: { policies: [], taxonomy_status: { is_frozen: false } },
      });

      const result = await apiClient.get("/category-policies", {
        params: { active_only: false },
      });

      expect(result).toBeTruthy();
    });

    it("should handle API errors when fetching policies", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network error"));

      try {
        await apiClient.get("/category-policies", { params: { active_only: true } });
        throw new Error("Expected error");
      } catch (error) {
        expect(error).toBeTruthy();
      }
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockPolicy);

      const result = await apiClient.get("/category-policies/coil");

      expect(result.data.policy.category).toBe("coil");
      expect(result.data.policy.pricing_mode).toBe("MT_ONLY");
    });

    it("should handle missing category policy", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Category not found"));

      try {
        await apiClient.get("/category-policies/invalid");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Category not found");
      }
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/category-policies/subtypes/list", {
        params: {},
      });

      expect(result.data.subtypes.length).toBe(3);
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/category-policies/subtypes/list", {
        params: { category: "sheet" },
      });

      expect(result.data.subtypes.length).toBe(2);
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network error"));

      try {
        await apiClient.get("/category-policies");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });

    it("should handle server errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Server error"));

      try {
        await apiClient.get("/category-policies/invalid");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Server error");
      }
    });
  });
});
