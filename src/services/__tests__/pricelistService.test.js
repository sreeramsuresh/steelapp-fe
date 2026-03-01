/**
 * Pricelist Service Unit Tests
 * ✅ Tests pricelist CRUD operations
 * ✅ Tests pricelist item management
 * ✅ Tests bulk operations and price calculations
 * ✅ Tests percentage adjustments and copying
 * ✅ 100% coverage target for pricelistService.js
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "../api.js";
import pricelistService from "../pricelistService.js";

describe("pricelistService", () => {
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  beforeEach(() => {
    vi.restoreAllMocks();
    getStub = vi.spyOn(api, "get");
    postStub = vi.spyOn(api, "post");
    putStub = vi.spyOn(api, "put");
    deleteStub = vi.spyOn(api, "delete");
  });

  describe("getAll", () => {
    it("should fetch all pricelists", async () => {
      const mockPricelists = [
        { id: 1, name: "Standard Pricing", currency: "AED", status: "ACTIVE" },
        { id: 2, name: "Bulk Pricing", currency: "AED", status: "ACTIVE" },
      ];
      getStub.mockResolvedValue(mockPricelists);

      const result = await pricelistService.getAll({ page: 1 });

      expect(result).toBeTruthy();
      expect(result[0].name).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/pricelists", { params: { page: 1 } });
    });

    it("should handle empty pricelist", async () => {
      getStub.mockResolvedValue([]);

      const result = await pricelistService.getAll();

      expect(result).toBeTruthy();
    });
  });

  describe("getById", () => {
    it("should fetch single pricelist with items", async () => {
      const mockPricelist = {
        id: 1,
        name: "Standard",
        currency: "AED",
        items: [
          { productId: 101, price: 150, currency: "AED" },
          { productId: 102, price: 200, currency: "AED" },
        ],
      };
      getStub.mockResolvedValue(mockPricelist);

      const result = await pricelistService.getById(1);

      expect(result.id).toBeTruthy();
      expect(result.items).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/pricelists/1");
    });

    it("should handle pricelist not found", async () => {
      getStub.mockResolvedValue(null);

      const result = await pricelistService.getById(999);

      expect(result).toBe(null);
    });
  });

  describe("create", () => {
    it("should create new pricelist", async () => {
      const newPricelist = {
        name: "New Pricing",
        currency: "AED",
        description: "Test pricelist",
      };
      const mockResponse = { id: 3, ...newPricelist };
      postStub.mockResolvedValue(mockResponse);

      const result = await pricelistService.create(newPricelist);

      expect(result.id).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/pricelists", newPricelist);
    });

    it("should handle validation errors on create", async () => {
      const invalidPricelist = { name: "" };
      postStub.mockRejectedValue(new Error("Validation error"));

      await expect(pricelistService.create(invalidPricelist)).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update existing pricelist", async () => {
      const updates = { name: "Updated Pricing", status: "ACTIVE" };
      const mockResponse = { id: 1, ...updates };
      putStub.mockResolvedValue(mockResponse);

      const result = await pricelistService.update(1, updates);

      expect(result.name).toBeTruthy();
      expect(putStub).toHaveBeenCalledWith("/pricelists/1", updates);
    });

    it("should handle update not found", async () => {
      putStub.mockRejectedValue(new Error("Not found"));

      await expect(pricelistService.update(999, { name: "Test" })).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should soft delete pricelist by default", async () => {
      deleteStub.mockResolvedValue({ success: true });

      const result = await pricelistService.delete(1);

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith("/pricelists/1", {
        params: { hard_delete: false },
      });
    });

    it("should hard delete when specified", async () => {
      deleteStub.mockResolvedValue({ success: true });

      const _result = await pricelistService.delete(1, true);

      expect(deleteStub).toHaveBeenCalledWith("/pricelists/1", {
        params: { hard_delete: true },
      });
    });
  });

  describe("getItems", () => {
    it("should fetch pricelist items", async () => {
      const mockItems = [
        { productId: 101, price: 150, currency: "AED" },
        { productId: 102, price: 200, currency: "AED" },
      ];
      getStub.mockResolvedValue(mockItems);

      const result = await pricelistService.getItems(1);

      expect(result).toBeTruthy();
      expect(result[0].price).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/pricelists/1/items");
    });

    it("should handle empty items list", async () => {
      getStub.mockResolvedValue([]);

      const result = await pricelistService.getItems(1);

      expect(result).toBeTruthy();
    });
  });

  describe("updateItems", () => {
    it("should upsert items by default", async () => {
      const items = [
        { productId: 101, price: 155 },
        { productId: 103, price: 250 },
      ];
      const mockResponse = { success: true, updated: 2 };
      putStub.mockResolvedValue(mockResponse);

      const result = await pricelistService.updateItems(1, items);

      expect(result.updated).toBeTruthy();
      expect(putStub).toHaveBeenCalledWith("/pricelists/1/items", {
        items,
        operation: "upsert",
      });
    });

    it("should replace items when operation specified", async () => {
      const items = [{ productId: 101, price: 160 }];
      putStub.mockResolvedValue({ success: true });

      await pricelistService.updateItems(1, items, "replace");

      expect(putStub).toHaveBeenCalledWith("/pricelists/1/items", {
        items,
        operation: "replace",
      });
    });
  });

  describe("addItem", () => {
    it("should add single item to pricelist", async () => {
      const item = { productId: 104, price: 180 };
      const mockResponse = { id: 1, items: [item] };
      postStub.mockResolvedValue(mockResponse);

      await pricelistService.addItem(1, item);

      expect(postStub).toHaveBeenCalledWith("/pricelists/1/items", item);
    });
  });

  describe("removeItem", () => {
    it("should remove item from pricelist", async () => {
      deleteStub.mockResolvedValue({ success: true });

      const result = await pricelistService.removeItem(1, 101);

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith("/pricelists/1/items/101");
    });
  });

  describe("applyPercentage", () => {
    it("should increase prices by percentage", async () => {
      const mockResponse = { success: true, itemsUpdated: 5 };
      postStub.mockResolvedValue(mockResponse);

      const result = await pricelistService.applyPercentage(1, 10, "increase");

      expect(result.itemsUpdated).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/pricelists/1/apply-percentage", {
        percentage: 10,
        operation: "increase",
      });
    });

    it("should decrease prices by percentage", async () => {
      postStub.mockResolvedValue({ success: true, itemsUpdated: 5 });

      await pricelistService.applyPercentage(1, 5, "decrease");

      expect(postStub).toHaveBeenCalledWith("/pricelists/1/apply-percentage", {
        percentage: 5,
        operation: "decrease",
      });
    });
  });

  describe("copyFrom", () => {
    it("should copy items from another pricelist", async () => {
      const mockResponse = { success: true, itemsCopied: 10 };
      postStub.mockResolvedValue(mockResponse);

      const result = await pricelistService.copyFrom(2, 1, 0);

      expect(result.itemsCopied).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/pricelists/2/copy-from", {
        source_pricelist_id: 1,
        percentage_adjustment: 0,
      });
    });

    it("should copy with percentage adjustment", async () => {
      postStub.mockResolvedValue({ success: true, itemsCopied: 10 });

      await pricelistService.copyFrom(2, 1, 15);

      expect(postStub).toHaveBeenCalledWith("/pricelists/2/copy-from", {
        source_pricelist_id: 1,
        percentage_adjustment: 15,
      });
    });
  });

  describe("getProductPrice", () => {
    it("should get price for single product", async () => {
      const mockPrice = { productId: 101, price: 155, currency: "AED" };
      getStub.mockResolvedValue(mockPrice);

      const result = await pricelistService.getProductPrice(101, { listId: 1 });

      expect(result.price).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/products/101/price", {
        params: { listId: 1 },
      });
    });
  });

  describe("bulkPriceLookup", () => {
    it("should fetch prices for multiple products", async () => {
      const mockPrices = [
        { productId: 101, price: 155 },
        { productId: 102, price: 205 },
        { productId: 103, price: 255 },
      ];
      postStub.mockResolvedValue(mockPrices);

      const result = await pricelistService.bulkPriceLookup([101, 102, 103], {
        listId: 1,
      });

      expect(result).toBeTruthy();
      expect(result[0].price).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/products/bulk-price-lookup", {
        product_ids: [101, 102, 103],
        listId: 1,
      });
    });

    it("should handle empty product list", async () => {
      postStub.mockResolvedValue([]);

      const result = await pricelistService.bulkPriceLookup([]);

      expect(result).toBeTruthy();
    });
  });
});
