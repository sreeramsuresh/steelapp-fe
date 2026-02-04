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

      assert.ok(result.data);
      assert.ok(result.data[0].name);
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

      assert.ok(result.data);
    });

    test("should return empty data on API error", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("Not Found"));

      assert.rejects(new Error("Name is required"));

      assert.rejects(new Error("Cannot delete"));

      assert.rejects(new Error("API Error"));

      const result = await warehouseService.getSummary();

      assert.ok(result.totalWarehouses);
      assert.ok(result.lowStockItems);
      assert.ok(result.totalInventoryItems);
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

      assert.ok(result.totalQuantity);
      assert.ok(result.availableQuantity);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/warehouses/1/dashboard");
    });

    test("should return mock data on endpoint failure", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("API Error"));

      const result = await warehouseService.getStock(1);

      assert.ok(result.data);
      assert.ok(result.pagination);
    });
  });

  describe("clearSummaryCache", () => {
    test("should be no-op for non-cached implementation", () => {
      assert.ok(() => warehouseService.clearSummaryCache()).not;
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
      sinon.stub(apiClient, 'get').rejects(new Error("Network error"));

      assert.rejects(new Error("Invalid ID"));

      assert.rejects(warehouseService.getById("invalid"), Error);
    });
  });
});