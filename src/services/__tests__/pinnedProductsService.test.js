/**
 * Pinned Products Service Unit Tests (Node Native Test Runner)
 * Tests user's pinned products management
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";
import { pinnedProductsService } from "../pinnedProductsService.js";

describe("pinnedProductsService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getPinnedProducts", () => {
    it("should fetch user's pinned products", async () => {
      const mockResponse = [
        {
          id: 1,
          product_id: 100,
          product_name: "SS304 Sheet 2B 1220×2×2440",
          category: "sheet",
          pinned_at: "2024-01-10T10:00:00Z",
          order: 1,
        },
        {
          id: 2,
          product_id: 101,
          product_name: "SS316L Pipe BA 2inch Sch40",
          category: "pipe",
          pinned_at: "2024-01-15T14:00:00Z",
          order: 2,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await pinnedProductsService.getPinnedProducts();

      expect(result.length).toBe(2);
      expect(result[0].product_name).toContain("SS304");
      expect(apiClient.get).toHaveBeenCalledWith("/pinned-products");
    });

    it("should return empty array if no products pinned", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue([]);

      const result = await pinnedProductsService.getPinnedProducts();

      expect(result.length).toBe(0);
      expect(apiClient.get).toHaveBeenCalledWith("/pinned-products");
    });
  });

  describe("pinProduct", () => {
    it("should pin product to user's favorites", async () => {
      const mockResponse = {
        id: 1,
        product_id: 100,
        product_name: "SS304 Sheet 2B 1220×2×2440",
        pinned_at: "2024-01-15T10:00:00Z",
        order: 1,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await pinnedProductsService.pinProduct(100);

      expect(result.product_id).toBe(100);
      expect(result.pinned_at).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith("/pinned-products/100");
    });

    it("should handle multiple product pins", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValue({
        id: 2,
        product_id: 101,
        pinned_at: "2024-01-15T15:00:00Z",
      });

      const result = await pinnedProductsService.pinProduct(101);

      expect(result.product_id).toBe(101);
      expect(apiClient.post).toHaveBeenCalledWith("/pinned-products/101");
    });
  });

  describe("unpinProduct", () => {
    it("should remove product from pinned list", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      const result = await pinnedProductsService.unpinProduct(100);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/pinned-products/100");
    });

    it("should handle unpinning non-existent pin", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({
        success: false,
        error: "Pinned product not found",
      });

      const result = await pinnedProductsService.unpinProduct(999);

      expect(result.success).toBe(false);
    });
  });
});
