import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { deliveryVarianceService } from "../deliveryVarianceService.js";


import api from "../api.js";

describe("deliveryVarianceService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getDeliveryVarianceKPIs", () => {
    test("should fetch delivery variance KPIs with default days", async () => {
      const mockResponse = {
        on_time_percentage: 92.5,
        late_deliveries: 8,
        average_delay_days: 2.3,
        total_deliveries: 100,
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getDeliveryVarianceKPIs();

      assert.ok(result.on_time_percentage);
      assert.ok(result.late_deliveries);
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/kpis",
        Object.keys({ params: { daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should support custom daysBack parameter", async () => {
      sinon.stub(api, 'get').resolves({
        on_time_percentage: 95,
        late_deliveries: 5,
      });

      await deliveryVarianceService.getDeliveryVarianceKPIs(30);

      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/kpis",
        Object.keys({ params: { daysBack: 30 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getDeliveryVarianceTrend", () => {
    test("should fetch delivery variance trend data", async () => {
      const mockResponse = [
        { date: "2024-01-01", on_time_percentage: 90, late_count: 10 },
        { date: "2024-01-02", on_time_percentage: 92, late_count: 8 },
      ];

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getDeliveryVarianceTrend(90);

      assert.ok(result);
      assert.ok(result[0].on_time_percentage);
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/trend",
        Object.keys({ params: { daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getLateDeliveriesBreakdown", () => {
    test("should fetch late deliveries breakdown by variance range", async () => {
      const mockResponse = [
        { range: "1-3 days", count: 15, percentage: 60 },
        { range: "4-7 days", count: 8, percentage: 32 },
        { range: "8+ days", count: 2, percentage: 8 },
      ];

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getLateDeliveriesBreakdown(90);

      assert.ok(result);
      assert.ok(result[0].range);
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/breakdown",
        Object.keys({ params: { daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getRecentLateDeliveries", () => {
    test("should fetch recent late deliveries with details", async () => {
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

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getRecentLateDeliveries(20, 90);

      assert.ok(result);
      assert.ok(result[0].variance_days);
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/late-deliveries",
        Object.keys({
          params: { limit: 20, daysBack: 90 },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should support custom limit parameter", async () => {
      sinon.stub(api, 'get').resolves([]);

      await deliveryVarianceService.getRecentLateDeliveries(50, 180);

      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/late-deliveries",
        Object.keys({
          params: { limit: 50, daysBack: 180 },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getSupplierPerformanceComparison", () => {
    test("should fetch supplier performance comparison", async () => {
      const mockResponse = [
        {
          supplier_id: 1,
          supplier_name: "Supplier A",
          on_time_percentage: 95,
          avg_delay_days: 0.5,
        },
      ];

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getSupplierPerformanceComparison(10, 90);

      assert.ok(Array.isArray(result));
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/supplier-comparison",
        Object.keys({ params: { limit: 10, daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getHealthReport", () => {
    test("should fetch delivery health report", async () => {
      const mockResponse = {
        overall_health: "good",
        on_time_percentage: 92,
        critical_suppliers: 2,
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getHealthReport(90);

      assert.ok(result.overall_health);
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/health-report",
        Object.keys({ params: { daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("generateRecommendations", () => {
    test("should generate recommendations for improvements", async () => {
      const mockResponse = [
        {
          id: 1,
          title: "Address supplier performance",
          priority: "high",
        },
      ];

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.generateRecommendations(90);

      assert.ok(Array.isArray(result));
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/recommendations",
        Object.keys({ params: { daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getSupplierScorecard", () => {
    test("should fetch supplier scorecard", async () => {
      const mockResponse = {
        supplier_id: 1,
        supplier_name: "Supplier A",
        score: 85,
        metrics: [],
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getSupplierScorecard(1, 90);

      assert.ok(result.supplier_name);
      assert.ok(api.get).toHaveBeenCalledWith(
        "/delivery-variance/supplier/1/scorecard",
        Object.keys({ params: { daysBack: 90 } }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });
  });

  describe("getAtRiskSuppliers", () => {
    test("should fetch at-risk suppliers list", async () => {
      const mockResponse = [
        {
          supplier_id: 1,
          supplier_name: "At Risk Supplier",
          risk_level: "high",
        },
      ];

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await deliveryVarianceService.getAtRiskSuppliers();

      assert.ok(Array.isArray(result));
      assert.ok(api.get).toHaveBeenCalledWith("/delivery-variance/at-risk-suppliers");
    });
  });
});