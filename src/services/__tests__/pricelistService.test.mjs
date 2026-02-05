/**
 * Pricelist Service Unit Tests
 * ✅ Tests pricelist CRUD operations
 * ✅ Tests pricelist item management
import '../../__tests__/init.mjs';

 * ✅ Tests bulk operations and price calculations
 * ✅ Tests percentage adjustments and copying
 * ✅ 100% coverage target for pricelistService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";


import api from "../api.js";
import pricelistService from "../pricelistService.js";

describe("pricelistService", () => {
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  beforeEach(() => {
    sinon.restore();
    getStub = sinon.stub(api, 'get');
    postStub = sinon.stub(api, 'post');
    putStub = sinon.stub(api, 'put');
    deleteStub = sinon.stub(api, 'delete');
  });

  describe("getAll", () => {
    test("should fetch all pricelists", async () => {
      const mockPricelists = [
        { id: 1, name: "Standard Pricing", currency: "AED", status: "ACTIVE" },
        { id: 2, name: "Bulk Pricing", currency: "AED", status: "ACTIVE" },
      ];
      getStub.resolves(mockPricelists);

      const result = await pricelistService.getAll({ page: 1 });

      assert.ok(result);
      assert.ok(result[0].name);
      sinon.assert.calledWith(getStub, "/pricelists", { params: { page: 1 } });
    });

    test("should handle empty pricelist", async () => {
      getStub.resolves([]);

      const result = await pricelistService.getAll();

      assert.ok(result);
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
      getStub.resolves(mockPricelist);

      const result = await pricelistService.getById(1);

      assert.ok(result.id);
      assert.ok(result.items);
      sinon.assert.calledWith(getStub, "/pricelists/1");
    });

    test("should handle pricelist not found", async () => {
      getStub.resolves(null);

      const result = await pricelistService.getById(999);

      assert.ok(result).toBeNull();
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
      postStub.resolves(mockResponse);

      const result = await pricelistService.create(newPricelist);

      assert.ok(result.id);
      assert.ok(result.name);
      sinon.assert.calledWith(postStub, "/pricelists", newPricelist);
    });

    test("should handle validation errors on create", async () => {
      const invalidPricelist = { name: "" };
      postStub.rejects(new Error("Validation error"));

      assert.rejects(pricelistService.create(invalidPricelist), Error);
    });
  });

  describe("update", () => {
    test("should update existing pricelist", async () => {
      const updates = { name: "Updated Pricing", status: "ACTIVE" };
      const mockResponse = { id: 1, ...updates };
      putStub.resolves(mockResponse);

      const result = await pricelistService.update(1, updates);

      assert.ok(result.name);
      sinon.assert.calledWith(putStub, "/pricelists/1", updates);
    });

    test("should handle update not found", async () => {
      putStub.rejects(new Error("Not found"));

      assert.rejects(pricelistService.update(999, { name: "Test" }), Error);
    });
  });

  describe("delete", () => {
    test("should soft delete pricelist by default", async () => {
      deleteStub.resolves({ success: true });

      const result = await pricelistService.delete(1);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, "/pricelists/1", {
        params: { hard_delete: false },
      });
    });

    test("should hard delete when specified", async () => {
      deleteStub.resolves({ success: true });

      const _result = await pricelistService.delete(1, true);

      sinon.assert.calledWith(deleteStub, "/pricelists/1", {
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
      getStub.resolves(mockItems);

      const result = await pricelistService.getItems(1);

      assert.ok(result);
      assert.ok(result[0].price);
      sinon.assert.calledWith(getStub, "/pricelists/1/items");
    });

    test("should handle empty items list", async () => {
      getStub.resolves([]);

      const result = await pricelistService.getItems(1);

      assert.ok(result);
    });
  });

  describe("updateItems", () => {
    test("should upsert items by default", async () => {
      const items = [
        { productId: 101, price: 155 },
        { productId: 103, price: 250 },
      ];
      const mockResponse = { success: true, updated: 2 };
      putStub.resolves(mockResponse);

      const result = await pricelistService.updateItems(1, items);

      assert.ok(result.updated);
      sinon.assert.calledWith(putStub, "/pricelists/1/items", {
        items,
        operation: "upsert",
      });
    });

    test("should replace items when operation specified", async () => {
      const items = [{ productId: 101, price: 160 }];
      putStub.resolves({ success: true });

      await pricelistService.updateItems(1, items, "replace");

      sinon.assert.calledWith(putStub, "/pricelists/1/items", {
        items,
        operation: "replace",
      });
    });
  });

  describe("addItem", () => {
    test("should add single item to pricelist", async () => {
      const item = { productId: 104, price: 180 };
      const mockResponse = { id: 1, items: [item] };
      postStub.resolves(mockResponse);

      await pricelistService.addItem(1, item);

      sinon.assert.calledWith(postStub, "/pricelists/1/items", item);
    });
  });

  describe("removeItem", () => {
    test("should remove item from pricelist", async () => {
      deleteStub.resolves({ success: true });

      const result = await pricelistService.removeItem(1, 101);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, "/pricelists/1/items/101");
    });
  });

  describe("applyPercentage", () => {
    test("should increase prices by percentage", async () => {
      const mockResponse = { success: true, itemsUpdated: 5 };
      postStub.resolves(mockResponse);

      const result = await pricelistService.applyPercentage(1, 10, "increase");

      assert.ok(result.itemsUpdated);
      sinon.assert.calledWith(postStub, "/pricelists/1/apply-percentage", {
        percentage: 10,
        operation: "increase",
      });
    });

    test("should decrease prices by percentage", async () => {
      postStub.resolves({ success: true, itemsUpdated: 5 });

      await pricelistService.applyPercentage(1, 5, "decrease");

      sinon.assert.calledWith(postStub, "/pricelists/1/apply-percentage", {
        percentage: 5,
        operation: "decrease",
      });
    });
  });

  describe("copyFrom", () => {
    test("should copy items from another pricelist", async () => {
      const mockResponse = { success: true, itemsCopied: 10 };
      postStub.resolves(mockResponse);

      const result = await pricelistService.copyFrom(2, 1, 0);

      assert.ok(result.itemsCopied);
      sinon.assert.calledWith(postStub, "/pricelists/2/copy-from", {
        source_pricelist_id: 1,
        percentage_adjustment: 0,
      });
    });

    test("should copy with percentage adjustment", async () => {
      postStub.resolves({ success: true, itemsCopied: 10 });

      await pricelistService.copyFrom(2, 1, 15);

      sinon.assert.calledWith(postStub, "/pricelists/2/copy-from", {
        source_pricelist_id: 1,
        percentage_adjustment: 15,
      });
    });
  });

  describe("getProductPrice", () => {
    test("should get price for single product", async () => {
      const mockPrice = { productId: 101, price: 155, currency: "AED" };
      getStub.resolves(mockPrice);

      const result = await pricelistService.getProductPrice(101, { listId: 1 });

      assert.ok(result.price);
      sinon.assert.calledWith(getStub, "/products/101/price", {
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
      postStub.resolves(mockPrices);

      const result = await pricelistService.bulkPriceLookup([101, 102, 103], {
        listId: 1,
      });

      assert.ok(result);
      assert.ok(result[0].price);
      sinon.assert.calledWith(postStub, "/products/bulk-price-lookup", {
        product_ids: [101, 102, 103],
        listId: 1,
      });
    });

    test("should handle empty product list", async () => {
      postStub.resolves([]);

      const result = await pricelistService.bulkPriceLookup([]);

      assert.ok(result);
    });
  });
});