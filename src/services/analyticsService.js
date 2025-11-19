import { apiClient } from './api';

export const analyticsService = {
  // Normalize common date param names to snake_case expected by API
  normalizeParams(params = {}) {
    if (!params) return {};
    const p = { ...params };
    if (p.startDate && !p.startDate) p.startDate = p.startDate;
    if (p.endDate && !p.endDate) p.endDate = p.endDate;
    delete p.startDate;
    delete p.endDate;
    return p;
  },

  async getDashboardData(params = {}) {
    return apiClient.get('/analytics/dashboard', analyticsService.normalizeParams(params));
  },

  async getSalesTrends(params = {}) {
    return apiClient.get('/analytics/sales-trends', analyticsService.normalizeParams(params));
  },

  async getProductPerformance(params = {}) {
    return apiClient.get('/analytics/product-performance', analyticsService.normalizeParams(params));
  },

  async getCustomerAnalysis(params = {}) {
    return apiClient.get('/analytics/customer-analysis', analyticsService.normalizeParams(params));
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
