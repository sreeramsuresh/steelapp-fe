/**
 * Pricelist Service Unit Tests
 * ✅ Tests pricelist CRUD operations
 * ✅ Tests pricelist item management
 * ✅ Tests bulk operations and price calculations
 * ✅ Tests percentage adjustments and copying
 * ✅ 100% coverage target for pricelistService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api.js";
import pricelistService from "../pricelistService.js";

describe("pricelistService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    test("should fetch all pricelists", async () => {
      const mockPricelists = [
        { id: 1, name: "Standard Pricing", currency: "AED", status: "ACTIVE" },
        { id: 2, name: "Bulk Pricing", currency: "AED", status: "ACTIVE" },
      ];
      api.get.mockResolvedValueOnce(mockPricelists);

      const result = await pricelistService.getAll({ page: 1 });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Standard Pricing");
      expect(api.get).toHaveBeenCalledWith("/pricelists", { params: { page: 1 } });
    });

    test("should handle empty pricelist", async () => {
      api.get.mockResolvedValueOnce([]);

      const result = await pricelistService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    test("should fetch single pricelist with items", async () => {
      const mockPricelist = {
        id: 1,
        name: "Standard",
        currency: "AED",
        items: [
          { productId: 101, price: 150, currency: "AED" },
          { productId: 102, price: 200, currency: "AED" },
        ],
      };
      api.get.mockResolvedValueOnce(mockPricelist);

      const result = await pricelistService.getById(1);

      expect(result.id).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(api.get).toHaveBeenCalledWith("/pricelists/1");
    });

    test("should handle pricelist not found", async () => {
      api.get.mockResolvedValueOnce(null);

      const result = await pricelistService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("should create new pricelist", async () => {
      const newPricelist = {
        name: "New Pricing",
        currency: "AED",
        description: "Test pricelist",
      };
      const mockResponse = { id: 3, ...newPricelist };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await pricelistService.create(newPricelist);

      expect(result.id).toBe(3);
      expect(result.name).toBe("New Pricing");
      expect(api.post).toHaveBeenCalledWith("/pricelists", newPricelist);
    });

    test("should handle validation errors on create", async () => {
      const invalidPricelist = { name: "" };
      api.post.mockRejectedValueOnce(new Error("Validation error"));

      await expect(pricelistService.create(invalidPricelist)).rejects.toThrow("Validation error");
    });
  });

  describe("update", () => {
    test("should update existing pricelist", async () => {
      const updates = { name: "Updated Pricing", status: "ACTIVE" };
      const mockResponse = { id: 1, ...updates };
      api.put.mockResolvedValueOnce(mockResponse);

      const result = await pricelistService.update(1, updates);

      expect(result.name).toBe("Updated Pricing");
      expect(api.put).toHaveBeenCalledWith("/pricelists/1", updates);
    });

    test("should handle update not found", async () => {
      api.put.mockRejectedValueOnce(new Error("Not found"));

      await expect(pricelistService.update(999, { name: "Test" })).rejects.toThrow("Not found");
    });
  });

  describe("delete", () => {
    test("should soft delete pricelist by default", async () => {
      api.delete.mockResolvedValueOnce({ success: true });

      const result = await pricelistService.delete(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/pricelists/1", {
        params: { hard_delete: false },
      });
    });

    test("should hard delete when specified", async () => {
      api.delete.mockResolvedValueOnce({ success: true });

      const _result = await pricelistService.delete(1, true);

      expect(api.delete).toHaveBeenCalledWith("/pricelists/1", {
        params: { hard_delete: true },
      });
    });
  });

  describe("getItems", () => {
    test("should fetch pricelist items", async () => {
      const mockItems = [
        { productId: 101, price: 150, currency: "AED" },
        { productId: 102, price: 200, currency: "AED" },
      ];
      api.get.mockResolvedValueOnce(mockItems);

      const result = await pricelistService.getItems(1);

      expect(result).toHaveLength(2);
      expect(result[0].price).toBe(150);
      expect(api.get).toHaveBeenCalledWith("/pricelists/1/items");
    });

    test("should handle empty items list", async () => {
      api.get.mockResolvedValueOnce([]);

      const result = await pricelistService.getItems(1);

      expect(result).toEqual([]);
    });
  });

  describe("updateItems", () => {
    test("should upsert items by default", async () => {
      const items = [
        { productId: 101, price: 155 },
        { productId: 103, price: 250 },
      ];
      const mockResponse = { success: true, updated: 2 };
      api.put.mockResolvedValueOnce(mockResponse);

      const result = await pricelistService.updateItems(1, items);

      expect(result.updated).toBe(2);
      expect(api.put).toHaveBeenCalledWith("/pricelists/1/items", {
        items,
        operation: "upsert",
      });
    });

    test("should replace items when operation specified", async () => {
      const items = [{ productId: 101, price: 160 }];
      api.put.mockResolvedValueOnce({ success: true });

      await pricelistService.updateItems(1, items, "replace");

      expect(api.put).toHaveBeenCalledWith("/pricelists/1/items", {
        items,
        operation: "replace",
      });
    });
  });

  describe("addItem", () => {
    test("should add single item to pricelist", async () => {
      const item = { productId: 104, price: 180 };
      const mockResponse = { id: 1, items: [item] };
      api.post.mockResolvedValueOnce(mockResponse);

      await pricelistService.addItem(1, item);

      expect(api.post).toHaveBeenCalledWith("/pricelists/1/items", item);
    });
  });

  describe("removeItem", () => {
    test("should remove item from pricelist", async () => {
      api.delete.mockResolvedValueOnce({ success: true });

      const result = await pricelistService.removeItem(1, 101);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/pricelists/1/items/101");
    });
  });

  describe("applyPercentage", () => {
    test("should increase prices by percentage", async () => {
      const mockResponse = { success: true, itemsUpdated: 5 };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await pricelistService.applyPercentage(1, 10, "increase");

      expect(result.itemsUpdated).toBe(5);
      expect(api.post).toHaveBeenCalledWith("/pricelists/1/apply-percentage", {
        percentage: 10,
        operation: "increase",
      });
    });

    test("should decrease prices by percentage", async () => {
      api.post.mockResolvedValueOnce({ success: true, itemsUpdated: 5 });

      await pricelistService.applyPercentage(1, 5, "decrease");

      expect(api.post).toHaveBeenCalledWith("/pricelists/1/apply-percentage", {
        percentage: 5,
        operation: "decrease",
      });
    });
  });

  describe("copyFrom", () => {
    test("should copy items from another pricelist", async () => {
      const mockResponse = { success: true, itemsCopied: 10 };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await pricelistService.copyFrom(2, 1, 0);

      expect(result.itemsCopied).toBe(10);
      expect(api.post).toHaveBeenCalledWith("/pricelists/2/copy-from", {
        source_pricelist_id: 1,
        percentage_adjustment: 0,
      });
    });

    test("should copy with percentage adjustment", async () => {
      api.post.mockResolvedValueOnce({ success: true, itemsCopied: 10 });

      await pricelistService.copyFrom(2, 1, 15);

      expect(api.post).toHaveBeenCalledWith("/pricelists/2/copy-from", {
        source_pricelist_id: 1,
        percentage_adjustment: 15,
      });
    });
  });

  describe("getProductPrice", () => {
    test("should get price for single product", async () => {
      const mockPrice = { productId: 101, price: 155, currency: "AED" };
      api.get.mockResolvedValueOnce(mockPrice);

      const result = await pricelistService.getProductPrice(101, { listId: 1 });

      expect(result.price).toBe(155);
      expect(api.get).toHaveBeenCalledWith("/products/101/price", {
        params: { listId: 1 },
      });
    });
  });

  describe("bulkPriceLookup", () => {
    test("should fetch prices for multiple products", async () => {
      const mockPrices = [
        { productId: 101, price: 155 },
        { productId: 102, price: 205 },
        { productId: 103, price: 255 },
      ];
      api.post.mockResolvedValueOnce(mockPrices);

      const result = await pricelistService.bulkPriceLookup([101, 102, 103], {
        listId: 1,
      });

      expect(result).toHaveLength(3);
      expect(result[0].price).toBe(155);
      expect(api.post).toHaveBeenCalledWith("/products/bulk-price-lookup", {
        product_ids: [101, 102, 103],
        listId: 1,
      });
    });

    test("should handle empty product list", async () => {
      api.post.mockResolvedValueOnce([]);

      const result = await pricelistService.bulkPriceLookup([]);

      expect(result).toEqual([]);
    });
  });
});
