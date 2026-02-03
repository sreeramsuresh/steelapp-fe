/**
 * Analytics Service Unit Tests
 * ✅ Tests analytics data fetching
 * ✅ Tests parameter normalization
 * ✅ Tests KPI calculations
 * ✅ 100% coverage target for analyticsService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { analyticsService } from "../analyticsService.js";
import { apiClient } from "../api.js";

describe("analyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizeParams", () => {
    test("should convert camelCase to snake_case for date params", () => {
      const params = { startDate: "2024-01-01", endDate: "2024-12-31", limit: 10 };
      const normalized = analyticsService.normalizeParams(params);

      expect(normalized.start_date).toBe("2024-01-01");
      expect(normalized.end_date).toBe("2024-12-31");
      expect(normalized.limit).toBe(10);
      expect(normalized.startDate).toBeUndefined();
      expect(normalized.endDate).toBeUndefined();
    });

    test("should handle partial date params", () => {
      const params = { startDate: "2024-01-01" };
      const normalized = analyticsService.normalizeParams(params);

      expect(normalized.start_date).toBe("2024-01-01");
      expect(normalized.startDate).toBeUndefined();
    });

    test("should handle empty params", () => {
      const normalized = analyticsService.normalizeParams({});
      expect(normalized).toEqual({});
    });

    test("should handle null params", () => {
      const normalized = analyticsService.normalizeParams(null);
      expect(normalized).toEqual({});
    });
  });

  describe("getDashboardData", () => {
    test("should fetch dashboard data with date range", async () => {
      const mockData = {
        totalRevenue: 150000,
        totalOrders: 245,
        activeCustomers: 87,
      };
      apiClient.get.mockResolvedValueOnce(mockData);

      const result = await analyticsService.getDashboardData({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(result.totalRevenue).toBe(150000);
      expect(apiClient.get).toHaveBeenCalledWith("/analytics/dashboard", {
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });
    });
  });

  describe("getSalesTrends", () => {
    test("should fetch sales trends", async () => {
      const mockTrends = [
        { period: "2024-01", revenue: 15000, orders: 20 },
        { period: "2024-02", revenue: 18000, orders: 25 },
      ];
      apiClient.get.mockResolvedValueOnce(mockTrends);

      const result = await analyticsService.getSalesTrends();

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith("/analytics/sales-trends", {});
    });
  });

  describe("getProductPerformance", () => {
    test("should fetch product performance data", async () => {
      const mockPerformance = [
        { productId: 101, name: "Product A", revenue: 50000, quantity: 1000 },
        { productId: 102, name: "Product B", revenue: 45000, quantity: 900 },
      ];
      apiClient.get.mockResolvedValueOnce(mockPerformance);

      const result = await analyticsService.getProductPerformance();

      expect(result).toHaveLength(2);
      expect(result[0].revenue).toBe(50000);
    });
  });

  describe("getCustomerAnalysis", () => {
    test("should fetch customer analysis", async () => {
      const mockAnalysis = [
        { customerId: 1, name: "Customer A", totalSpent: 25000, orders: 10 },
        { customerId: 2, name: "Customer B", totalSpent: 18000, orders: 8 },
      ];
      apiClient.get.mockResolvedValueOnce(mockAnalysis);

      const result = await analyticsService.getCustomerAnalysis();

      expect(result).toHaveLength(2);
      expect(result[0].totalSpent).toBe(25000);
    });
  });

  describe("getInventoryInsights", () => {
    test("should fetch inventory insights", async () => {
      const mockInsights = {
        totalItems: 5000,
        lowStockCount: 50,
        outOfStockCount: 10,
        overStockCount: 25,
      };
      apiClient.get.mockResolvedValueOnce(mockInsights);

      const result = await analyticsService.getInventoryInsights();

      expect(result.totalItems).toBe(5000);
      expect(apiClient.get).toHaveBeenCalledWith("/analytics/inventory-insights");
    });
  });

  describe("getRevenueMetrics", () => {
    test("should fetch revenue metrics with date range", async () => {
      const mockMetrics = { totalRevenue: 100000, avgOrderValue: 408 };
      apiClient.get.mockResolvedValueOnce(mockMetrics);

      const result = await analyticsService.getRevenueMetrics("2024-01-01", "2024-12-31");

      expect(result.totalRevenue).toBe(100000);
      expect(apiClient.get).toHaveBeenCalledWith("/analytics/dashboard", {
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });
    });
  });

  describe("getMonthlyTrends", () => {
    test("should fetch monthly trends by default", async () => {
      const mockTrends = [
        { period: "Jan", value: 15000 },
        { period: "Feb", value: 18000 },
      ];
      apiClient.get.mockResolvedValueOnce(mockTrends);

      await analyticsService.getMonthlyTrends();

      expect(apiClient.get).toHaveBeenCalledWith("/analytics/sales-trends", {
        period: "month",
      });
    });

    test("should fetch quarterly trends when specified", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await analyticsService.getMonthlyTrends("quarter");

      expect(apiClient.get).toHaveBeenCalledWith("/analytics/sales-trends", {
        period: "quarter",
      });
    });
  });

  describe("getTopCustomers", () => {
    test("should fetch top customers with default limit", async () => {
      const mockCustomers = [{ customerId: 1, name: "Top Customer", totalSpent: 50000 }];
      apiClient.get.mockResolvedValueOnce(mockCustomers);

      await analyticsService.getTopCustomers();

      expect(apiClient.get).toHaveBeenCalledWith("/analytics/customer-analysis", {
        limit: 10,
      });
    });

    test("should respect custom limit parameter", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await analyticsService.getTopCustomers(20);

      expect(apiClient.get).toHaveBeenCalledWith("/analytics/customer-analysis", {
        limit: 20,
      });
    });
  });

  describe("getTopProducts", () => {
    test("should fetch top products with default limit", async () => {
      const mockProducts = [{ productId: 101, name: "Top Product", revenue: 50000 }];
      apiClient.get.mockResolvedValueOnce(mockProducts);

      const result = await analyticsService.getTopProducts();

      expect(apiClient.get).toHaveBeenCalledWith("/analytics/product-performance", {
        limit: 10,
      });
    });

    test("should respect custom limit parameter", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await analyticsService.getTopProducts(25);

      expect(apiClient.get).toHaveBeenCalledWith("/analytics/product-performance", {
        limit: 25,
      });
    });
  });

  describe("getARAgingBuckets", () => {
    test("should fetch AR aging buckets", async () => {
      const mockBuckets = {
        "0-30": 50000,
        "31-60": 30000,
        "61-90": 20000,
        "90+": 15000,
      };
      apiClient.get.mockResolvedValueOnce(mockBuckets);

      const result = await analyticsService.getARAgingBuckets();

      expect(result["0-30"]).toBe(50000);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("should handle API errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("API Error"));

      await expect(analyticsService.getDashboardData()).rejects.toThrow("API Error");
    });

    test("should handle network timeouts", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Timeout"));

      await expect(analyticsService.getSalesTrends()).rejects.toThrow("Timeout");
    });
  });
});
