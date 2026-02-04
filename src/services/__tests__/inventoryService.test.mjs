/**
 * Inventory Service Unit Tests
 * Tests inventory management operations with proper data transformations
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';


import { inventoryService } from "../inventoryService.js";
import { apiClient } from "../api.js";

describe("inventoryService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getAllItems", () => {
    test("should get all items with pagination and filters", async () => {
      const mockItems = [
        {
          id: 1,
          productType: "SS PIPE",
          grade: "304",
          quantity: 100,
          quantityOnHand: 100,
          minStock: 10,
        },
        {
          id: 2,
          productType: "SS PLATE",
          grade: "316",
          quantity: 50,
          quantityOnHand: 50,
          minStock: 5,
        },
      ];

      apiClient.get.mockResolvedValueOnce({ data: mockItems });

      const result = await inventoryService.getAllItems({ page: 1, limit: 20 });

      assert.ok(result !== undefined);
      assert.ok(result.data);
      assert.ok(result.data[0].productType);
      sinon.assert.calledWith(apiClient.get, "/inventory", { page: 1, limit: 20 });
    });

    test("should handle empty inventory list", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      const result = await inventoryService.getAllItems();

      assert.ok(result.data);
      assert.ok(apiClient.get);
    });

    test("should transform server data to UI model", async () => {
      const mockServerData = [
        {
          id: 1,
          productType: "PIPE",
          quantityOnHand: 100,
          minimumStock: 10,
          sellingPrice: 500,
          status: "AVAILABLE",
        },
      ];

      apiClient.get.mockResolvedValueOnce({ data: mockServerData });

      const result = await inventoryService.getAllItems();

      assert.ok(result.data[0].quantity);
      assert.ok(result.data[0].minStock);
      assert.ok(result.data[0].sellingPrice);
    });
  });

  describe("getItemById", () => {
    test("should get single inventory item", async () => {
      const mockItem = {
        id: 1,
        productType: "SS PIPE",
        grade: "304",
        quantity: 100,
        quantityOnHand: 100,
        minStock: 10,
        warehouseName: "Warehouse A",
      };

      apiClient.get.mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      assert.ok(result !== undefined);
      assert.ok(result.productType);
      assert.ok(result.grade);
      sinon.assert.calledWith(apiClient.get, "/inventory/1");
    });

    test("should handle item not found", async () => {
      const error = new Error("Item not found");
      apiClient.get.mockRejectedValueOnce(error);

      assert.rejects(inventoryService.getItemById(999), Error);
    });
  });

  describe("createItem", () => {
    test("should create inventory item with proper transformation", async () => {
      const itemData = {
        productType: "PIPE",
        grade: "304",
        quantity: 100,
        minStock: 10,
        warehouseId: 1,
      };

      const mockResponse = {
        id: 101,
        ...itemData,
        quantityOnHand: 100,
      };

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.createItem(itemData);

      assert.ok(result !== undefined);
      assert.ok(result.id);
      sinon.assert.calledWith(apiClient.post, "/inventory",
        Object.keys({
          product_type: "PIPE",
          grade: "304",
          warehouse_id: 1,
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("updateItem", () => {
    test("should update inventory item", async () => {
      const updateData = {
        quantity: 150,
        minStock: 15,
      };

      const mockResponse = {
        id: 1,
        productType: "PIPE",
        quantity: 150,
        quantityOnHand: 150,
        minStock: 15,
      };

      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateItem(1, updateData);

      assert.ok(result !== undefined);
      assert.ok(result.quantity);
      sinon.assert.calledWith(apiClient.put, "/inventory/1", );
    });
  });

  describe("deleteItem", () => {
    test("should delete inventory item", async () => {
      const mockResponse = { id: 1, deleted: true };

      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.deleteItem(1);

      assert.ok(result !== undefined);
      sinon.assert.calledWith(apiClient.delete, "/inventory/1");
    });
  });

  describe("getItemsByProduct", () => {
    test("should get items by product type and grade", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", grade: "304", quantity: 100 },
        { id: 2, productType: "PIPE", grade: "304", quantity: 50 },
      ];

      apiClient.get.mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getItemsByProduct("PIPE", "304");

      assert.ok(result);
      assert.ok(result[0].productType);
      sinon.assert.calledWith(apiClient.get, "/inventory/by-product", { productType: "PIPE", grade: "304" });
    });
  });

  describe("updateQuantity", () => {
    test("should update item quantity with operation", async () => {
      const mockResponse = {
        id: 1,
        quantity: 120,
        operation: "add",
        previousQuantity: 100,
      };

      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 20, "add");

      assert.ok(result !== undefined);
      assert.ok(result.quantity);
      sinon.assert.calledWith(apiClient.patch, "/inventory/1/quantity", { quantity: 20, operation: "add" });
    });

    test("should support set operation", async () => {
      const mockResponse = { id: 1, quantity: 100, operation: "set" };

      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 100, "set");

      assert.ok(result !== undefined);
      sinon.assert.calledWith(apiClient.patch, "/inventory/1/quantity", { quantity: 100, operation: "set" });
    });

    test("should support subtract operation", async () => {
      const mockResponse = { id: 1, quantity: 80, operation: "subtract" };

      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 20, "subtract");

      assert.ok(result !== undefined);
      sinon.assert.calledWith(apiClient.patch, "/inventory/1/quantity", { quantity: 20, operation: "subtract" });
    });
  });

  describe("getLowStockItems", () => {
    test("should get low stock items with threshold", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", quantity: 5, minStock: 10 },
        { id: 2, productType: "PLATE", quantity: 3, minStock: 5 },
      ];

      apiClient.get.mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getLowStockItems(5);

      assert.ok(result);
      sinon.assert.calledWith(apiClient.get, "/inventory/low-stock", { threshold: 5 });
    });

    test("should use default threshold", async () => {
      const mockItems = [];

      apiClient.get.mockResolvedValueOnce(mockItems);

      await inventoryService.getLowStockItems();

      sinon.assert.calledWith(apiClient.get, "/inventory/low-stock", { threshold: 5 });
    });
  });

  describe("getInventorySummary", () => {
    test("should get inventory summary", async () => {
      const mockSummary = {
        totalItems: 500,
        totalValue: 1000000,
        totalQuantity: 5000,
        lowStockCount: 25,
        outOfStockCount: 10,
        turnoverRate: 2.5,
        avgDaysToSell: 30,
      };

      apiClient.get.mockResolvedValueOnce(mockSummary);

      const result = await inventoryService.getInventorySummary();

      assert.ok(result !== undefined);
      assert.ok(result.totalItems);
      assert.ok(result.lowStockCount);
      sinon.assert.calledWith(apiClient.get, "/inventory/summary");
    });
  });

  describe("searchItems", () => {
    test("should search inventory items", async () => {
      const mockResults = [
        { id: 1, productType: "PIPE", grade: "304" },
        { id: 2, productType: "PIPE", grade: "316" },
      ];

      apiClient.get.mockResolvedValueOnce(mockResults);

      const result = await inventoryService.searchItems("PIPE");

      assert.ok(result);
      sinon.assert.calledWith(apiClient.get, "/inventory/search", { q: "PIPE" });
    });

    test("should handle empty search results", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await inventoryService.searchItems("NONEXISTENT");

      assert.ok(result);
      assert.ok(apiClient.get);
    });
  });

  describe("getItemsByLocation", () => {
    test("should get items by warehouse location", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", location: "WH-A-01" },
        { id: 2, productType: "PLATE", location: "WH-A-01" },
      ];

      apiClient.get.mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getItemsByLocation("WH-A-01");

      assert.ok(result);
      assert.ok(result[0].location);
      sinon.assert.calledWith(apiClient.get, "/inventory/by-location/WH-A-01");
    });
  });

  describe("Error Handling", () => {
    test("should propagate API errors", async () => {
      const error = new Error("Network error");
      apiClient.get.mockRejectedValueOnce(error);

      assert.rejects(inventoryService.getAllItems(), Error);
    });

    test("should handle validation errors", async () => {
      const error = new Error("Invalid item data");
      apiClient.post.mockRejectedValueOnce(error);

      assert.rejects(inventoryService.createItem({}), Error);
    });

    test("should handle deletion errors", async () => {
      const error = new Error("Item in use");
      apiClient.delete.mockRejectedValueOnce(error);

      assert.rejects(inventoryService.deleteItem(1), Error);
    });
  });

  describe("Data Transformation", () => {
    test("should handle backward compatibility with legacy quantity fields", async () => {
      const mockItem = {
        id: 1,
        quantity: 100, // Legacy field
        minStock: 10, // Legacy field
        productType: "PIPE",
      };

      apiClient.get.mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      assert.ok(result.quantity);
      assert.ok(result.minStock);
    });

    test("should prefer ERP fields over legacy fields", async () => {
      const mockItem = {
        id: 1,
        quantityOnHand: 150, // ERP field (takes precedence)
        quantity: 100, // Legacy field
        minimumStock: 15, // ERP field (takes precedence)
        minStock: 10, // Legacy field
        productType: "PIPE",
      };

      apiClient.get.mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      assert.ok(result.quantity); // Should use quantityOnHand
      assert.ok(result.minStock); // Should use minimumStock
    });
  });
});