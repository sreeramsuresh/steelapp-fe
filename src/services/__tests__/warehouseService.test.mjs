import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { warehouseService } from "../warehouseService.js";
import { apiClient } from "../api.js";

// Mock API client


describe("warehouseService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getAll", () => {
    test("should fetch all warehouses with pagination", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await warehouseService.getAll();

      assert.ok(result.data).toHaveLength(2);
      assert.ok(result.data[0].name).toBe("Main Warehouse");
      assert.ok(result.pagination).toBeDefined();
    });

    test("should apply default pagination values", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [],
        pagination: {},
      });

      await warehouseService.getAll();

      assert.ok(apiClient.get).toHaveBeenCalledWith(
        "/warehouses",
        Object.keys({
          page: 1,
          limit: 100,
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should filter by search term", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await warehouseService.getAll({ search: "Main" });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses", Object.keys({ search: "Main" }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should filter by active status", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await warehouseService.getAll({ isActive: true });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses", Object.keys({ is_active: true }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should handle custom pagination", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      await warehouseService.getAll({ page: 2, limit: 50 });

      assert.ok(apiClient.get).toHaveBeenCalledWith(
        "/warehouses",
        Object.keys({
          page: 2,
          limit: 50,
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should handle different response formats", async () => {
      sinon.stub(apiClient, 'get').resolves({
        warehouses: [{ id: 1, name: "Main" }],
      });

      const result = await warehouseService.getAll();

      assert.ok(result.data).toHaveLength(1);
    });

    test("should return empty data on API error", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      const result = await warehouseService.getAll();

      assert.ok(result.data).toEqual([]);
    });
  });

  describe("getById", () => {
    test("should fetch warehouse by ID", async () => {
      const mockData = {
        id: 1,
        companyId: 1,
        name: "Main Warehouse",
        code: "WH001",
        address: "123 Main St",
        city: "Dubai",
        isActive: true,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await warehouseService.getById(1);

      assert.ok(result.name).toBe("Main Warehouse");
      assert.ok(result.code).toBe("WH001");
      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses/1");
    });

    test("should handle 404 errors", async () => {
      apiClient.get.mockRejectedValue(new Error("Not Found"));

      assert.rejects(warehouseService.getById(999), Error);
    });

    test("should transform snake_case to camelCase", async () => {
      const mockData = {
        id: 1,
        postal_code: "12345",
        contact_person: "John Doe",
        is_active: true,
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await warehouseService.getById(1);

      assert.ok(result.postalCode).toBe("12345");
      assert.ok(result.contactPerson).toBe("John Doe");
      assert.ok(result.isActive).toBe(true);
    });
  });

  describe("create", () => {
    test("should create new warehouse", async () => {
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

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await warehouseService.create(warehouseData);

      assert.ok(result.id).toBe(3);
      assert.ok(result.name).toBe("New Warehouse");
      assert.ok(apiClient.post).toHaveBeenCalledWith(
        "/warehouses",
        Object.keys({
          name: "New Warehouse",
          code: "WH003",
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should transform camelCase to snake_case", async () => {
      const warehouseData = {
        name: "Test",
        postalCode: "12345",
        contactPerson: "John",
        isActive: true,
      };

      sinon.stub(apiClient, 'post').resolves({ id: 1 });

      await warehouseService.create(warehouseData);

      assert.ok(apiClient.post).toHaveBeenCalledWith(
        "/warehouses",
        Object.keys({
          postal_code: "12345",
          contact_person: "John",
          is_active: true,
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should validate required fields", async () => {
      const warehouseData = { name: "" };

      apiClient.post.mockRejectedValue(new Error("Name is required"));

      assert.rejects(warehouseService.create(warehouseData), Error);
    });
  });

  describe("update", () => {
    test("should update warehouse", async () => {
      const updateData = {
        name: "Updated Warehouse",
        isActive: false,
      };

      const mockResponse = {
        id: 1,
        name: "Updated Warehouse",
        isActive: false,
      };

      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await warehouseService.update(1, updateData);

      assert.ok(result.name).toBe("Updated Warehouse");
      assert.ok(result.isActive).toBe(false);
      assert.ok(apiClient.put.calledWith("/warehouses/1", true));
    });

    test("should handle partial updates", async () => {
      sinon.stub(apiClient, 'put').resolves({ id: 1, name: "Updated" });

      const result = await warehouseService.update(1, { name: "Updated" });

      assert.ok(result.name).toBe("Updated");
    });
  });

  describe("delete", () => {
    test("should delete warehouse", async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await warehouseService.delete(1);

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.delete).toHaveBeenCalledWith("/warehouses/1");
    });

    test("should handle deletion errors", async () => {
      apiClient.delete.mockRejectedValue(new Error("Cannot delete"));

      assert.rejects(warehouseService.delete(1), Error);
    });
  });

  describe("setDefault", () => {
    test("should set warehouse as default", async () => {
      const mockResponse = {
        id: 1,
        name: "Main Warehouse",
        isDefault: true,
      };

      sinon.stub(apiClient, 'patch').resolves(mockResponse);

      const result = await warehouseService.setDefault(1);

      assert.ok(result.isDefault).toBe(true);
      assert.ok(apiClient.patch).toHaveBeenCalledWith("/warehouses/1/default");
    });
  });

  describe("getDefault", () => {
    test("should fetch default warehouse", async () => {
      const mockResponse = {
        id: 1,
        name: "Main Warehouse",
        isDefault: true,
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await warehouseService.getDefault();

      assert.ok(result.isDefault).toBe(true);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses/default");
    });

    test("should return null if no default warehouse", async () => {
      sinon.stub(apiClient, 'get').resolves(null);

      const result = await warehouseService.getDefault();

      assert.ok(result).toBeNull();
    });
  });

  describe("seed", () => {
    test("should seed default warehouses", async () => {
      sinon.stub(apiClient, 'post').resolves({
        success: true,
        warehouses: [
          { id: 1, name: "Main" },
          { id: 2, name: "Secondary" },
        ],
      });

      const result = await warehouseService.seed();

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/warehouses/seed");
    });
  });

  describe("getSummary", () => {
    test("should fetch warehouse summary stats", async () => {
      const mockResponse = {
        totalWarehouses: 3,
        activeWarehouses: 2,
        totalInventoryItems: 500,
        totalStockValue: 250000,
        lowStockItems: 15,
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await warehouseService.getSummary();

      assert.ok(result.totalWarehouses).toBe(3);
      assert.ok(result.activeWarehouses).toBe(2);
      assert.ok(result.totalInventoryItems).toBe(500);
      assert.ok(result.lowStockItems).toBe(15);
    });

    test("should handle fallback to inventory health endpoint", async () => {
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

      assert.ok(result.lowStockItems).toBe(10);
      assert.ok(result.totalWarehouses).toBe(2);
      assert.ok(result.activeWarehouses).toBe(1);
    });

    test("should ensure lowStockItems is a number", async () => {
      sinon.stub(apiClient, 'get').resolves({
        totalWarehouses: 3,
        lowStockItems: null,
      });

      const result = await warehouseService.getSummary();

      assert.ok(typeof result.lowStockItems).toBe("number");
      assert.ok(result.lowStockItems).toBe(0);
    });

    test("should handle all endpoint failures gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      const result = await warehouseService.getSummary();

      assert.ok(result.totalWarehouses).toBe(0);
      assert.ok(result.lowStockItems).toBe(0);
      assert.ok(result.totalInventoryItems).toBe(0);
    });
  });

  describe("getDashboard", () => {
    test("should fetch warehouse dashboard data", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await warehouseService.getDashboard(1);

      assert.ok(result.totalQuantity).toBe(1000);
      assert.ok(result.availableQuantity).toBe(800);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses/1/dashboard");
    });

    test("should return mock data on endpoint failure", async () => {
      apiClient.get.mockRejectedValue(new Error("Endpoint not available"));

      const result = await warehouseService.getDashboard(1);

      assert.ok(result.totalQuantity).toBe(0);
      assert.ok(result.recentActivities).toEqual([]);
    });
  });

  describe("getStock", () => {
    test("should fetch warehouse stock", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await warehouseService.getStock(1);

      assert.ok(result.data).toHaveLength(1);
      assert.ok(result.pagination).toBeDefined();
      assert.ok(apiClient.get.calledWith("/warehouses/1/stock", true));
    });

    test("should filter by product type", async () => {
      sinon.stub(apiClient, 'get').resolves({ items: [] });

      await warehouseService.getStock(1, { productType: "SHEET" });

      assert.ok(apiClient.get).toHaveBeenCalledWith(
        "/warehouses/1/stock",
        Object.keys({ product_type: "SHEET" }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should filter low stock only", async () => {
      sinon.stub(apiClient, 'get').resolves({ items: [] });

      await warehouseService.getStock(1, { lowStockOnly: true });

      assert.ok(apiClient.get).toHaveBeenCalledWith(
        "/warehouses/1/stock",
        Object.keys({ low_stock_only: true }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should handle API errors gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      const result = await warehouseService.getStock(1);

      assert.ok(result.data).toEqual([]);
      assert.ok(result.pagination).toEqual({});
    });
  });

  describe("clearSummaryCache", () => {
    test("should be no-op for non-cached implementation", () => {
      assert.ok(() => warehouseService.clearSummaryCache()).not.toThrow();
    });
  });

  describe("getAnalytics", () => {
    test("should fetch warehouse analytics", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await warehouseService.getAnalytics(1, {
        period: "MONTHLY",
      });

      assert.ok(result.inboundTrend).toBeDefined();
      assert.ok(result.outboundTrend).toBeDefined();
      assert.ok(apiClient.get.calledWith("/warehouses/1/analytics", true));
    });

    test("should support date range filtering", async () => {
      sinon.stub(apiClient, 'get').resolves({
        inboundTrend: [],
        outboundTrend: [],
      });

      await warehouseService.getAnalytics(1, {
        period: "DAILY",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      assert.ok(apiClient.get).toHaveBeenCalledWith(
        "/warehouses/1/analytics",
        Object.keys({
          start_date: "2024-01-01",
          end_date: "2024-01-31",
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should return empty analytics on error", async () => {
      apiClient.get.mockRejectedValue(new Error("Analytics not available"));

      const result = await warehouseService.getAnalytics(1);

      assert.ok(result.inboundTrend).toEqual([]);
      assert.ok(result.outboundTrend).toEqual([]);
    });
  });

  describe("Multi-tenancy", () => {
    test("should maintain company context in all operations", async () => {
      sinon.stub(apiClient, 'get').resolves({
        id: 1,
        companyId: 1,
        name: "Main Warehouse",
      });

      const result = await warehouseService.getById(1);

      assert.ok(result.companyId).toBe(1);
    });
  });

  describe("Data Transformation", () => {
    test("should transform from server snake_case to client camelCase", async () => {
      const serverData = {
        id: 1,
        contact_person: "John Doe",
        postal_code: "12345",
        is_default: true,
        is_active: true,
        capacity_unit: "MT",
      };

      sinon.stub(apiClient, 'get').resolves(serverData);

      const result = await warehouseService.getById(1);

      assert.ok(result.contactPerson).toBe("John Doe");
      assert.ok(result.postalCode).toBe("12345");
      assert.ok(result.isDefault).toBe(true);
      assert.ok(result.isActive).toBe(true);
      assert.ok(result.capacityUnit).toBe("MT");
    });

    test("should transform from client camelCase to server snake_case on create", async () => {
      const clientData = {
        name: "Test",
        postalCode: "12345",
        contactPerson: "John",
      };

      sinon.stub(apiClient, 'post').resolves({ id: 1 });

      await warehouseService.create(clientData);

      const callArgs = apiClient.post.mock.calls[0];
      const payload = callArgs[1];

      assert.ok(payload).toHaveProperty("postal_code", "12345");
      assert.ok(payload).toHaveProperty("contact_person", "John");
    });
  });

  describe("Warehouse Type Support", () => {
    test("should support different warehouse types", async () => {
      const mockData = {
        id: 1,
        name: "Cold Storage",
        type: "COLD_STORAGE",
      };

      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await warehouseService.getById(1);

      assert.ok(result.type).toBe("COLD_STORAGE");
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      apiClient.get.mockRejectedValue(new Error("Network error"));

      assert.rejects(warehouseService.getById(1), Error);
    });

    test("should handle invalid warehouse ID", async () => {
      apiClient.get.mockRejectedValue(new Error("Invalid ID"));

      assert.rejects(warehouseService.getById("invalid"), Error);
    });
  });
});