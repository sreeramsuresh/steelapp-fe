import api from "./api.js";

const deliveryVarianceService = {
  // Get delivery variance KPIs
  getDeliveryVarianceKPIs: async (daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/kpis", {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching KPIs:", error);
      throw error;
    }
  },

  // Get delivery variance trend
  getDeliveryVarianceTrend: async (daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/trend", {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching trend:", error);
      throw error;
    }
  },

  // Get late deliveries breakdown by variance range
  getLateDeliveriesBreakdown: async (daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/breakdown", {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching breakdown:", error);
      throw error;
    }
  },

  // Get recent late deliveries with details
  getRecentLateDeliveries: async (limit = 20, daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/late-deliveries", {
        params: { limit, daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching late deliveries:", error);
      throw error;
    }
  },

  // Get supplier performance comparison
  getSupplierPerformanceComparison: async (limit = 10, daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/supplier-comparison", {
        params: { limit, daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching supplier comparison:", error);
      throw error;
    }
  },

  // Get health report
  getHealthReport: async (daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/health-report", {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching health report:", error);
      throw error;
    }
  },

  // Get recommendations
  generateRecommendations: async (daysBack = 90) => {
    try {
      const response = await api.get("/delivery-variance/recommendations", {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw error;
    }
  },

  // Get supplier scorecard
  getSupplierScorecard: async (supplierId, daysBack = 90) => {
    try {
      const response = await api.get(`/delivery-variance/supplier/${supplierId}/scorecard`, {
        params: { daysBack },
      });
      return response;
    } catch (error) {
      console.error("Error fetching supplier scorecard:", error);
      throw error;
    }
  },

  // Get at-risk suppliers
  getAtRiskSuppliers: async () => {
    try {
      const response = await api.get("/delivery-variance/at-risk-suppliers");
      return response;
    } catch (error) {
      console.error("Error fetching at-risk suppliers:", error);
      throw error;
    }
  },
};

export { deliveryVarianceService };
