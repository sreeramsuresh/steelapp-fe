import { beforeEach, describe, expect, it, vi } from "vitest";
import { warehouseService } from "../warehouseService.js";

// Mock API client
vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from "../api.js";

describe("warehouseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all warehouses with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            name: "Main Warehouse",
            code: "WH001",
            isActive: true,
          },
          {
            id: 2,
            name: "Secondary Warehouse",
            code: "WH002",
            isActive: true,
          },
        ],
        pagination: { total: 2, page: 1, pageSize: 100 },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await warehouseService.getAll();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe("Main Warehouse");
      expect(result.pagination).toBeDefined();
    });

    it("should apply default pagination values", async () => {
      apiClient.get.mockResolvedValue({
        data: [],
        pagination: {},
      });

      await warehouseService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith(
        "/warehouses",
        expect.objectContaining({
          page: 1,
          limit: 100,
        })
      );
    });

    it("should filter by search term", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await warehouseService.getAll({ search: "Main" });

      expect(apiClient.get).toHaveBeenCalledWith("/warehouses", expect.objectContaining({ search: "Main" }));
    });

    it("should filter by active status", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await warehouseService.getAll({ isActive: true });

      expect(apiClient.get).toHaveBeenCalledWith("/warehouses", expect.objectContaining({ is_active: true }));
    });

    it("should handle custom pagination", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await warehouseService.getAll({ page: 2, limit: 50 });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/warehouses",
        expect.objectContaining({
          page: 2,
          limit: 50,
        })
      );
    });

    it("should handle different response formats", async () => {
      apiClient.get.mockResolvedValue({
        warehouses: [{ id: 1, name: "Main" }],
      });

      const result = await warehouseService.getAll();

      expect(result.data).toHaveLength(1);
    });

    it("should return empty data on API error", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      const result = await warehouseService.getAll();

      expect(result.data).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should fetch warehouse by ID", async () => {
      const mockData = {
        id: 1,
        companyId: 1,
        name: "Main Warehouse",
        code: "WH001",
        address: "123 Main St",
        city: "Dubai",
        isActive: true,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await warehouseService.getById(1);

      expect(result.name).toBe("Main Warehouse");
      expect(result.code).toBe("WH001");
      expect(apiClient.get).toHaveBeenCalledWith("/warehouses/1");
    });

    it("should handle 404 errors", async () => {
      apiClient.get.mockRejectedValue(new Error("Not Found"));

      await expect(warehouseService.getById(999)).rejects.toThrow();
    });

    it("should transform snake_case to camelCase", async () => {
      const mockData = {
        id: 1,
        postal_code: "12345",
        contact_person: "John Doe",
        is_active: true,
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await warehouseService.getById(1);

      expect(result.postalCode).toBe("12345");
      expect(result.contactPerson).toBe("John Doe");
      expect(result.isActive).toBe(true);
    });
  });

  describe("create", () => {
    it("should create new warehouse", async () => {
      const warehouseData = {
        name: "New Warehouse",
        code: "WH003",
        address: "456 New St",
        city: "Abu Dhabi",
        isActive: true,
      };

      const mockResponse = {
        id: 3,
        ...warehouseData,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await warehouseService.create(warehouseData);

      expect(result.id).toBe(3);
      expect(result.name).toBe("New Warehouse");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/warehouses",
        expect.objectContaining({
          name: "New Warehouse",
          code: "WH003",
        })
      );
    });

    it("should transform camelCase to snake_case", async () => {
      const warehouseData = {
        name: "Test",
        postalCode: "12345",
        contactPerson: "John",
        isActive: true,
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await warehouseService.create(warehouseData);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/warehouses",
        expect.objectContaining({
          postal_code: "12345",
          contact_person: "John",
          is_active: true,
        })
      );
    });

    it("should validate required fields", async () => {
      const warehouseData = { name: "" };

      apiClient.post.mockRejectedValue(new Error("Name is required"));

      await expect(warehouseService.create(warehouseData)).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update warehouse", async () => {
      const updateData = {
        name: "Updated Warehouse",
        isActive: false,
      };

      const mockResponse = {
        id: 1,
        name: "Updated Warehouse",
        isActive: false,
      };

      apiClient.put.mockResolvedValue(mockResponse);

      const result = await warehouseService.update(1, updateData);

      expect(result.name).toBe("Updated Warehouse");
      expect(result.isActive).toBe(false);
      expect(apiClient.put).toHaveBeenCalledWith("/warehouses/1", expect.any(Object));
    });

    it("should handle partial updates", async () => {
      apiClient.put.mockResolvedValue({ id: 1, name: "Updated" });

      const result = await warehouseService.update(1, { name: "Updated" });

      expect(result.name).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete warehouse", async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await warehouseService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/warehouses/1");
    });

    it("should handle deletion errors", async () => {
      apiClient.delete.mockRejectedValue(new Error("Cannot delete"));

      await expect(warehouseService.delete(1)).rejects.toThrow();
    });
  });

  describe("setDefault", () => {
    it("should set warehouse as default", async () => {
      const mockResponse = {
        id: 1,
        name: "Main Warehouse",
        isDefault: true,
      };

      apiClient.patch.mockResolvedValue(mockResponse);

      const result = await warehouseService.setDefault(1);

      expect(result.isDefault).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith("/warehouses/1/default");
    });
  });

  describe("getDefault", () => {
    it("should fetch default warehouse", async () => {
      const mockResponse = {
        id: 1,
        name: "Main Warehouse",
        isDefault: true,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await warehouseService.getDefault();

      expect(result.isDefault).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith("/warehouses/default");
    });

    it("should return null if no default warehouse", async () => {
      apiClient.get.mockResolvedValue(null);

      const result = await warehouseService.getDefault();

      expect(result).toBeNull();
    });
  });

  describe("seed", () => {
    it("should seed default warehouses", async () => {
      apiClient.post.mockResolvedValue({
        success: true,
        warehouses: [
          { id: 1, name: "Main" },
          { id: 2, name: "Secondary" },
        ],
      });

      const result = await warehouseService.seed();

      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/warehouses/seed");
    });
  });

  describe("getSummary", () => {
    it("should fetch warehouse summary stats", async () => {
      const mockResponse = {
        totalWarehouses: 3,
        activeWarehouses: 2,
        totalInventoryItems: 500,
        totalStockValue: 250000,
        lowStockItems: 15,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await warehouseService.getSummary();

      expect(result.totalWarehouses).toBe(3);
      expect(result.activeWarehouses).toBe(2);
      expect(result.totalInventoryItems).toBe(500);
      expect(result.lowStockItems).toBe(15);
    });

    it("should handle fallback to inventory health endpoint", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("API Error"));
      apiClient.get.mockResolvedValueOnce({
        summary: { lowStockCount: 10 },
      });
      apiClient.get.mockResolvedValueOnce({
        data: [
          { id: 1, isActive: true, inventoryCount: 200 },
          { id: 2, isActive: false, inventoryCount: 300 },
        ],
      });

      const result = await warehouseService.getSummary();

      expect(result.lowStockItems).toBe(10);
      expect(result.totalWarehouses).toBe(2);
      expect(result.activeWarehouses).toBe(1);
    });

    it("should ensure lowStockItems is a number", async () => {
      apiClient.get.mockResolvedValue({
        totalWarehouses: 3,
        lowStockItems: null,
      });

      const result = await warehouseService.getSummary();

      expect(typeof result.lowStockItems).toBe("number");
      expect(result.lowStockItems).toBe(0);
    });

    it("should handle all endpoint failures gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      const result = await warehouseService.getSummary();

      expect(result.totalWarehouses).toBe(0);
      expect(result.lowStockItems).toBe(0);
      expect(result.totalInventoryItems).toBe(0);
    });
  });

  describe("getDashboard", () => {
    it("should fetch warehouse dashboard data", async () => {
      const mockResponse = {
        totalQuantity: 1000,
        reservedQuantity: 200,
        availableQuantity: 800,
        totalValue: 50000,
        productCount: 25,
        lowStockCount: 5,
        utilizationPercent: 45,
        recentActivities: [],
        lowStockAlerts: [],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await warehouseService.getDashboard(1);

      expect(result.totalQuantity).toBe(1000);
      expect(result.availableQuantity).toBe(800);
      expect(apiClient.get).toHaveBeenCalledWith("/warehouses/1/dashboard");
    });

    it("should return mock data on endpoint failure", async () => {
      apiClient.get.mockRejectedValue(new Error("Endpoint not available"));

      const result = await warehouseService.getDashboard(1);

      expect(result.totalQuantity).toBe(0);
      expect(result.recentActivities).toEqual([]);
    });
  });

  describe("getStock", () => {
    it("should fetch warehouse stock", async () => {
      const mockResponse = {
        items: [
          {
            productId: 123,
            productName: "SS304 Sheet",
            quantity: 100,
            unit: "KG",
          },
        ],
        pagination: { total: 1, page: 1 },
        summary: { totalValue: 10000 },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await warehouseService.getStock(1);

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/warehouses/1/stock", expect.any(Object));
    });

    it("should filter by product type", async () => {
      apiClient.get.mockResolvedValue({ items: [] });

      await warehouseService.getStock(1, { productType: "SHEET" });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/warehouses/1/stock",
        expect.objectContaining({ product_type: "SHEET" })
      );
    });

    it("should filter low stock only", async () => {
      apiClient.get.mockResolvedValue({ items: [] });

      await warehouseService.getStock(1, { lowStockOnly: true });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/warehouses/1/stock",
        expect.objectContaining({ low_stock_only: true })
      );
    });

    it("should handle API errors gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      const result = await warehouseService.getStock(1);

      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({});
    });
  });

  describe("clearSummaryCache", () => {
    it("should be no-op for non-cached implementation", () => {
      expect(() => warehouseService.clearSummaryCache()).not.toThrow();
    });
  });

  describe("getAnalytics", () => {
    it("should fetch warehouse analytics", async () => {
      const mockResponse = {
        inboundTrend: [
          { date: "2024-01-01", quantity: 500 },
          { date: "2024-01-02", quantity: 600 },
        ],
        outboundTrend: [
          { date: "2024-01-01", quantity: 300 },
          { date: "2024-01-02", quantity: 400 },
        ],
        topInboundProducts: [{ productId: 1, quantity: 1000 }],
        topOutboundProducts: [{ productId: 2, quantity: 800 }],
        utilizationHistory: [{ date: "2024-01-01", utilization: 45 }],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await warehouseService.getAnalytics(1, {
        period: "MONTHLY",
      });

      expect(result.inboundTrend).toBeDefined();
      expect(result.outboundTrend).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/warehouses/1/analytics", expect.any(Object));
    });

    it("should support date range filtering", async () => {
      apiClient.get.mockResolvedValue({
        inboundTrend: [],
        outboundTrend: [],
      });

      await warehouseService.getAnalytics(1, {
        period: "DAILY",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/warehouses/1/analytics",
        expect.objectContaining({
          start_date: "2024-01-01",
          end_date: "2024-01-31",
        })
      );
    });

    it("should return empty analytics on error", async () => {
      apiClient.get.mockRejectedValue(new Error("Analytics not available"));

      const result = await warehouseService.getAnalytics(1);

      expect(result.inboundTrend).toEqual([]);
      expect(result.outboundTrend).toEqual([]);
    });
  });

  describe("Multi-tenancy", () => {
    it("should maintain company context in all operations", async () => {
      apiClient.get.mockResolvedValue({
        id: 1,
        companyId: 1,
        name: "Main Warehouse",
      });

      const result = await warehouseService.getById(1);

      expect(result.companyId).toBe(1);
    });
  });

  describe("Data Transformation", () => {
    it("should transform from server snake_case to client camelCase", async () => {
      const serverData = {
        id: 1,
        contact_person: "John Doe",
        postal_code: "12345",
        is_default: true,
        is_active: true,
        capacity_unit: "MT",
      };

      apiClient.get.mockResolvedValue(serverData);

      const result = await warehouseService.getById(1);

      expect(result.contactPerson).toBe("John Doe");
      expect(result.postalCode).toBe("12345");
      expect(result.isDefault).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.capacityUnit).toBe("MT");
    });

    it("should transform from client camelCase to server snake_case on create", async () => {
      const clientData = {
        name: "Test",
        postalCode: "12345",
        contactPerson: "John",
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await warehouseService.create(clientData);

      const callArgs = apiClient.post.mock.calls[0];
      const payload = callArgs[1];

      expect(payload).toHaveProperty("postal_code", "12345");
      expect(payload).toHaveProperty("contact_person", "John");
    });
  });

  describe("Warehouse Type Support", () => {
    it("should support different warehouse types", async () => {
      const mockData = {
        id: 1,
        name: "Cold Storage",
        type: "COLD_STORAGE",
      };

      apiClient.get.mockResolvedValue(mockData);

      const result = await warehouseService.getById(1);

      expect(result.type).toBe("COLD_STORAGE");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      apiClient.get.mockRejectedValue(new Error("Network error"));

      await expect(warehouseService.getById(1)).rejects.toThrow();
    });

    it("should handle invalid warehouse ID", async () => {
      apiClient.get.mockRejectedValue(new Error("Invalid ID"));

      await expect(warehouseService.getById("invalid")).rejects.toThrow();
    });
  });
});
