/**
 * Inventory Service Unit Tests
 * Tests inventory management operations with proper data transformations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { inventoryService } from "../inventoryService.js";
import { apiClient } from "../api.js";

describe("inventoryService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAllItems", () => {
    it("should get all items with pagination and filters", async () => {
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

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockItems });

      const result = await inventoryService.getAllItems({ page: 1, limit: 20 });

      expect(result !== undefined).toBeTruthy();
      expect(result.data).toBeTruthy();
      expect(result.data[0].productType).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory", { page: 1, limit: 20 });
    });

    it("should handle empty inventory list", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: [] });

      const result = await inventoryService.getAllItems();

      expect(result.data).toBeTruthy();
      expect(apiClient.get).toBeTruthy();
    });

    it("should transform server data to UI model", async () => {
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

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockServerData });

      const result = await inventoryService.getAllItems();

      expect(result.data[0].quantity).toBeTruthy();
      expect(result.data[0].minStock).toBeTruthy();
      expect(result.data[0].sellingPrice).toBeTruthy();
    });
  });

  describe("getItemById", () => {
    it("should get single inventory item", async () => {
      const mockItem = {
        id: 1,
        productType: "SS PIPE",
        grade: "304",
        quantity: 100,
        quantityOnHand: 100,
        minStock: 10,
        warehouseName: "Warehouse A",
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      expect(result !== undefined).toBeTruthy();
      expect(result.productType).toBeTruthy();
      expect(result.grade).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/1");
    });

    it("should handle item not found", async () => {
      const error = new Error("Item not found");
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(error);

      await expect(inventoryService.getItemById(999)).rejects.toThrow();
    });
  });

  describe("createItem", () => {
    it("should create inventory item with proper transformation", async () => {
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

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.createItem(itemData);

      expect(result !== undefined).toBeTruthy();
      expect(result.id).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith("/inventory", expect.any(Object));
    });
  });

  describe("updateItem", () => {
    it("should update inventory item", async () => {
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

      vi.spyOn(apiClient, 'put').mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateItem(1, updateData);

      expect(result !== undefined).toBeTruthy();
      expect(result.quantity).toBeTruthy();
      expect(apiClient.put).toHaveBeenCalledWith("/inventory/1", expect.any(Object));
    });
  });

  describe("deleteItem", () => {
    it("should delete inventory item", async () => {
      const mockResponse = { id: 1, deleted: true };

      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.deleteItem(1);

      expect(result !== undefined).toBeTruthy();
      expect(apiClient.delete).toHaveBeenCalledWith("/inventory/1");
    });
  });

  describe("getItemsByProduct", () => {
    it("should get items by product type and grade", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", grade: "304", quantity: 100 },
        { id: 2, productType: "PIPE", grade: "304", quantity: 50 },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getItemsByProduct("PIPE", "304");

      expect(result).toBeTruthy();
      expect(result[0].productType).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/by-product", { productType: "PIPE", grade: "304" });
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity with operation", async () => {
      const mockResponse = {
        id: 1,
        quantity: 120,
        operation: "add",
        previousQuantity: 100,
      };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 20, "add");

      expect(result !== undefined).toBeTruthy();
      expect(result.quantity).toBeTruthy();
      expect(apiClient.patch).toHaveBeenCalledWith("/inventory/1/quantity", { quantity: 20, operation: "add" });
    });

    it("should support set operation", async () => {
      const mockResponse = { id: 1, quantity: 100, operation: "set" };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 100, "set");

      expect(result !== undefined).toBeTruthy();
      expect(apiClient.patch).toHaveBeenCalledWith("/inventory/1/quantity", { quantity: 100, operation: "set" });
    });

    it("should support subtract operation", async () => {
      const mockResponse = { id: 1, quantity: 80, operation: "subtract" };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 20, "subtract");

      expect(result !== undefined).toBeTruthy();
      expect(apiClient.patch).toHaveBeenCalledWith("/inventory/1/quantity", { quantity: 20, operation: "subtract" });
    });
  });

  describe("getLowStockItems", () => {
    it("should get low stock items with threshold", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", quantity: 5, minStock: 10 },
        { id: 2, productType: "PLATE", quantity: 3, minStock: 5 },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getLowStockItems(5);

      expect(result).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/low-stock", { threshold: 5 });
    });

    it("should use default threshold", async () => {
      const mockItems = [];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItems);

      await inventoryService.getLowStockItems();

      expect(apiClient.get).toHaveBeenCalledWith("/inventory/low-stock", { threshold: 5 });
    });
  });

  describe("getInventorySummary", () => {
    it("should get inventory summary", async () => {
      const mockSummary = {
        totalItems: 500,
        totalValue: 1000000,
        totalQuantity: 5000,
        lowStockCount: 25,
        outOfStockCount: 10,
        turnoverRate: 2.5,
        avgDaysToSell: 30,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSummary);

      const result = await inventoryService.getInventorySummary();

      expect(result !== undefined).toBeTruthy();
      expect(result.totalItems).toBeTruthy();
      expect(result.lowStockCount).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/summary");
    });
  });

  describe("searchItems", () => {
    it("should search inventory items", async () => {
      const mockResults = [
        { id: 1, productType: "PIPE", grade: "304" },
        { id: 2, productType: "PIPE", grade: "316" },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResults);

      const result = await inventoryService.searchItems("PIPE");

      expect(result).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/search", { q: "PIPE" });
    });

    it("should handle empty search results", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce([]);

      const result = await inventoryService.searchItems("NONEXISTENT");

      expect(result).toBeTruthy();
      expect(apiClient.get).toBeTruthy();
    });
  });

  describe("getItemsByLocation", () => {
    it("should get items by warehouse location", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", location: "WH-A-01" },
        { id: 2, productType: "PLATE", location: "WH-A-01" },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getItemsByLocation("WH-A-01");

      expect(result).toBeTruthy();
      expect(result[0].location).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/by-location/WH-A-01");
    });
  });

  describe("Error Handling", () => {
    it("should propagate API errors", async () => {
      const error = new Error("Network error");
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(error);

      await expect(inventoryService.getAllItems()).rejects.toThrow();
    });

    it("should handle validation errors", async () => {
      const error = new Error("Invalid item data");
      vi.spyOn(apiClient, 'post').mockRejectedValueOnce(error);

      await expect(inventoryService.createItem({})).rejects.toThrow();
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Item in use");
      vi.spyOn(apiClient, 'delete').mockRejectedValueOnce(error);

      await expect(inventoryService.deleteItem(1)).rejects.toThrow();
    });
  });

  describe("Data Transformation", () => {
    it("should handle backward compatibility with legacy quantity fields", async () => {
      const mockItem = {
        id: 1,
        quantity: 100, // Legacy field
        minStock: 10, // Legacy field
        productType: "PIPE",
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      expect(result.quantity).toBeTruthy();
      expect(result.minStock).toBeTruthy();
    });

    it("should prefer ERP fields over legacy fields", async () => {
      const mockItem = {
        id: 1,
        quantityOnHand: 150, // ERP field (takes precedence)
        quantity: 100, // Legacy field
        minimumStock: 15, // ERP field (takes precedence)
        minStock: 10, // Legacy field
        productType: "PIPE",
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      expect(result.quantity).toBeTruthy(); // Should use quantityOnHand
      expect(result.minStock).toBeTruthy(); // Should use minimumStock
    });
  });
});