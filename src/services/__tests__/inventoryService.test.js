/**
 * Inventory Service Unit Tests
 * Tests inventory management operations with proper data transformations
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from "../api";
import { inventoryService } from "../inventoryService";

describe("inventoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      apiClient.get.mockResolvedValueOnce({ data: mockItems });

      const result = await inventoryService.getAllItems({ page: 1, limit: 20 });

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].productType).toBe("SS PIPE");
      expect(apiClient.get).toHaveBeenCalledWith("/inventory", { page: 1, limit: 20 });
    });

    it("should handle empty inventory list", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      const result = await inventoryService.getAllItems();

      expect(result.data).toEqual([]);
      expect(apiClient.get).toHaveBeenCalled();
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

      apiClient.get.mockResolvedValueOnce({ data: mockServerData });

      const result = await inventoryService.getAllItems();

      expect(result.data[0].quantity).toBe(100);
      expect(result.data[0].minStock).toBe(10);
      expect(result.data[0].sellingPrice).toBe(500);
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

      apiClient.get.mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      expect(result).toBeDefined();
      expect(result.productType).toBe("SS PIPE");
      expect(result.grade).toBe("304");
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/1");
    });

    it("should handle item not found", async () => {
      const error = new Error("Item not found");
      apiClient.get.mockRejectedValueOnce(error);

      await expect(inventoryService.getItemById(999)).rejects.toThrow("Item not found");
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

      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.createItem(itemData);

      expect(result).toBeDefined();
      expect(result.id).toBe(101);
      expect(apiClient.post).toHaveBeenCalledWith("/inventory", expect.objectContaining({
        product_type: "PIPE",
        grade: "304",
        warehouse_id: 1,
      }));
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

      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateItem(1, updateData);

      expect(result).toBeDefined();
      expect(result.quantity).toBe(150);
      expect(apiClient.put).toHaveBeenCalledWith("/inventory/1", expect.any(Object));
    });
  });

  describe("deleteItem", () => {
    it("should delete inventory item", async () => {
      const mockResponse = { id: 1, deleted: true };

      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.deleteItem(1);

      expect(result).toBeDefined();
      expect(apiClient.delete).toHaveBeenCalledWith("/inventory/1");
    });
  });

  describe("getItemsByProduct", () => {
    it("should get items by product type and grade", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", grade: "304", quantity: 100 },
        { id: 2, productType: "PIPE", grade: "304", quantity: 50 },
      ];

      apiClient.get.mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getItemsByProduct("PIPE", "304");

      expect(result).toHaveLength(2);
      expect(result[0].productType).toBe("PIPE");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/inventory/by-product",
        { productType: "PIPE", grade: "304" }
      );
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

      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 20, "add");

      expect(result).toBeDefined();
      expect(result.quantity).toBe(120);
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/inventory/1/quantity",
        { quantity: 20, operation: "add" }
      );
    });

    it("should support set operation", async () => {
      const mockResponse = { id: 1, quantity: 100, operation: "set" };

      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 100, "set");

      expect(result).toBeDefined();
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/inventory/1/quantity",
        { quantity: 100, operation: "set" }
      );
    });

    it("should support subtract operation", async () => {
      const mockResponse = { id: 1, quantity: 80, operation: "subtract" };

      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await inventoryService.updateQuantity(1, 20, "subtract");

      expect(result).toBeDefined();
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/inventory/1/quantity",
        { quantity: 20, operation: "subtract" }
      );
    });
  });

  describe("getLowStockItems", () => {
    it("should get low stock items with threshold", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", quantity: 5, minStock: 10 },
        { id: 2, productType: "PLATE", quantity: 3, minStock: 5 },
      ];

      apiClient.get.mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getLowStockItems(5);

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/inventory/low-stock",
        { threshold: 5 }
      );
    });

    it("should use default threshold", async () => {
      const mockItems = [];

      apiClient.get.mockResolvedValueOnce(mockItems);

      await inventoryService.getLowStockItems();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/inventory/low-stock",
        { threshold: 5 }
      );
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

      apiClient.get.mockResolvedValueOnce(mockSummary);

      const result = await inventoryService.getInventorySummary();

      expect(result).toBeDefined();
      expect(result.totalItems).toBe(500);
      expect(result.lowStockCount).toBe(25);
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/summary");
    });
  });

  describe("searchItems", () => {
    it("should search inventory items", async () => {
      const mockResults = [
        { id: 1, productType: "PIPE", grade: "304" },
        { id: 2, productType: "PIPE", grade: "316" },
      ];

      apiClient.get.mockResolvedValueOnce(mockResults);

      const result = await inventoryService.searchItems("PIPE");

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/inventory/search",
        { q: "PIPE" }
      );
    });

    it("should handle empty search results", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await inventoryService.searchItems("NONEXISTENT");

      expect(result).toEqual([]);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getItemsByLocation", () => {
    it("should get items by warehouse location", async () => {
      const mockItems = [
        { id: 1, productType: "PIPE", location: "WH-A-01" },
        { id: 2, productType: "PLATE", location: "WH-A-01" },
      ];

      apiClient.get.mockResolvedValueOnce(mockItems);

      const result = await inventoryService.getItemsByLocation("WH-A-01");

      expect(result).toHaveLength(2);
      expect(result[0].location).toBe("WH-A-01");
      expect(apiClient.get).toHaveBeenCalledWith("/inventory/by-location/WH-A-01");
    });
  });

  describe("Error Handling", () => {
    it("should propagate API errors", async () => {
      const error = new Error("Network error");
      apiClient.get.mockRejectedValueOnce(error);

      await expect(inventoryService.getAllItems()).rejects.toThrow("Network error");
    });

    it("should handle validation errors", async () => {
      const error = new Error("Invalid item data");
      apiClient.post.mockRejectedValueOnce(error);

      await expect(inventoryService.createItem({})).rejects.toThrow("Invalid item data");
    });

    it("should handle deletion errors", async () => {
      const error = new Error("Item in use");
      apiClient.delete.mockRejectedValueOnce(error);

      await expect(inventoryService.deleteItem(1)).rejects.toThrow("Item in use");
    });
  });

  describe("Data Transformation", () => {
    it("should handle backward compatibility with legacy quantity fields", async () => {
      const mockItem = {
        id: 1,
        quantity: 100, // Legacy field
        minStock: 10,  // Legacy field
        productType: "PIPE",
      };

      apiClient.get.mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      expect(result.quantity).toBe(100);
      expect(result.minStock).toBe(10);
    });

    it("should prefer ERP fields over legacy fields", async () => {
      const mockItem = {
        id: 1,
        quantityOnHand: 150, // ERP field (takes precedence)
        quantity: 100,        // Legacy field
        minimumStock: 15,     // ERP field (takes precedence)
        minStock: 10,         // Legacy field
        productType: "PIPE",
      };

      apiClient.get.mockResolvedValueOnce(mockItem);

      const result = await inventoryService.getItemById(1);

      expect(result.quantity).toBe(150); // Should use quantityOnHand
      expect(result.minStock).toBe(15);   // Should use minimumStock
    });
  });
});
