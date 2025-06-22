import { apiClient } from './api';

export const analyticsService = {
  async getDashboardData(params = {}) {
    return apiClient.get('/analytics/dashboard', params);
  },

  async getSalesTrends(params = {}) {
    return apiClient.get('/analytics/sales-trends', params);
  },

  async getProductPerformance(params = {}) {
    return apiClient.get('/analytics/product-performance', params);
  },

  async getCustomerAnalysis(params = {}) {
    return apiClient.get('/analytics/customer-analysis', params);
  },

  async getInventoryInsights() {
    return apiClient.get('/analytics/inventory-insights');
  },

  async getRevenueMetrics(startDate, endDate) {
    return apiClient.get('/analytics/dashboard', {
      start_date: startDate,
      end_date: endDate
    });
  },

  async getMonthlyTrends(period = 'month') {
    return apiClient.get('/analytics/sales-trends', { period });
  },

  async getTopCustomers(limit = 10) {
    return apiClient.get('/analytics/customer-analysis', { limit });
  },

  async getTopProducts(limit = 10) {
    return apiClient.get('/analytics/product-performance', { limit });
  }
};