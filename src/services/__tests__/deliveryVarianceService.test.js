import { beforeEach, describe, expect, it, vi } from "vitest";
import { deliveryVarianceService } from "../deliveryVarianceService.js";

vi.mock("../api.js", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../api.js";

describe("deliveryVarianceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDeliveryVarianceKPIs", () => {
    it("should fetch delivery variance KPIs with default days", async () => {
      const mockResponse = {
        on_time_percentage: 92.5,
        late_deliveries: 8,
        average_delay_days: 2.3,
        total_deliveries: 100,
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getDeliveryVarianceKPIs();

      expect(result.on_time_percentage).toBe(92.5);
      expect(result.late_deliveries).toBe(8);
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/kpis",
        expect.objectContaining({ params: { daysBack: 90 } })
      );
    });

    it("should support custom daysBack parameter", async () => {
      api.get.mockResolvedValue({
        on_time_percentage: 95,
        late_deliveries: 5,
      });

      await deliveryVarianceService.getDeliveryVarianceKPIs(30);

      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/kpis",
        expect.objectContaining({ params: { daysBack: 30 } })
      );
    });
  });

  describe("getDeliveryVarianceTrend", () => {
    it("should fetch delivery variance trend data", async () => {
      const mockResponse = [
        { date: "2024-01-01", on_time_percentage: 90, late_count: 10 },
        { date: "2024-01-02", on_time_percentage: 92, late_count: 8 },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getDeliveryVarianceTrend(90);

      expect(result).toHaveLength(2);
      expect(result[0].on_time_percentage).toBe(90);
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/trend",
        expect.objectContaining({ params: { daysBack: 90 } })
      );
    });
  });

  describe("getLateDeliveriesBreakdown", () => {
    it("should fetch late deliveries breakdown by variance range", async () => {
      const mockResponse = [
        { range: "1-3 days", count: 15, percentage: 60 },
        { range: "4-7 days", count: 8, percentage: 32 },
        { range: "8+ days", count: 2, percentage: 8 },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getLateDeliveriesBreakdown(90);

      expect(result).toHaveLength(3);
      expect(result[0].range).toBe("1-3 days");
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/breakdown",
        expect.objectContaining({ params: { daysBack: 90 } })
      );
    });
  });

  describe("getRecentLateDeliveries", () => {
    it("should fetch recent late deliveries with details", async () => {
      const mockResponse = [
        {
          id: 1,
          order_id: "ORD-001",
          expected_date: "2024-01-10",
          actual_date: "2024-01-12",
          variance_days: 2,
        },
        {
          id: 2,
          order_id: "ORD-002",
          expected_date: "2024-01-15",
          actual_date: "2024-01-18",
          variance_days: 3,
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getRecentLateDeliveries(20, 90);

      expect(result).toHaveLength(2);
      expect(result[0].variance_days).toBe(2);
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/late-deliveries",
        expect.objectContaining({
          params: { limit: 20, daysBack: 90 },
        })
      );
    });

    it("should support custom limit parameter", async () => {
      api.get.mockResolvedValue([]);

      await deliveryVarianceService.getRecentLateDeliveries(50, 180);

      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/late-deliveries",
        expect.objectContaining({
          params: { limit: 50, daysBack: 180 },
        })
      );
    });
  });

  describe("getSupplierPerformanceComparison", () => {
    it("should fetch supplier performance comparison", async () => {
      const mockResponse = [
        {
          supplier_id: 1,
          supplier_name: "Supplier A",
          on_time_percentage: 95,
          avg_delay_days: 0.5,
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getSupplierPerformanceComparison(10, 90);

      expect(Array.isArray(result)).toBe(true);
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/supplier-comparison",
        expect.objectContaining({ params: { limit: 10, daysBack: 90 } })
      );
    });
  });

  describe("getHealthReport", () => {
    it("should fetch delivery health report", async () => {
      const mockResponse = {
        overall_health: "good",
        on_time_percentage: 92,
        critical_suppliers: 2,
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getHealthReport(90);

      expect(result.overall_health).toBe("good");
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/health-report",
        expect.objectContaining({ params: { daysBack: 90 } })
      );
    });
  });

  describe("generateRecommendations", () => {
    it("should generate recommendations for improvements", async () => {
      const mockResponse = [
        {
          id: 1,
          title: "Address supplier performance",
          priority: "high",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.generateRecommendations(90);

      expect(Array.isArray(result)).toBe(true);
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/recommendations",
        expect.objectContaining({ params: { daysBack: 90 } })
      );
    });
  });

  describe("getSupplierScorecard", () => {
    it("should fetch supplier scorecard", async () => {
      const mockResponse = {
        supplier_id: 1,
        supplier_name: "Supplier A",
        score: 85,
        metrics: [],
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getSupplierScorecard(1, 90);

      expect(result.supplier_name).toBe("Supplier A");
      expect(api.get).toHaveBeenCalledWith(
        "/delivery-variance/supplier/1/scorecard",
        expect.objectContaining({ params: { daysBack: 90 } })
      );
    });
  });

  describe("getAtRiskSuppliers", () => {
    it("should fetch at-risk suppliers list", async () => {
      const mockResponse = [
        {
          supplier_id: 1,
          supplier_name: "At Risk Supplier",
          risk_level: "high",
        },
      ];

      api.get.mockResolvedValue(mockResponse);

      const result = await deliveryVarianceService.getAtRiskSuppliers();

      expect(Array.isArray(result)).toBe(true);
      expect(api.get).toHaveBeenCalledWith("/delivery-variance/at-risk-suppliers");
    });
  });
});
