import { apiClient } from './api';

export const analyticsService = {
  // Normalize common date param names to snake_case expected by API
  normalizeParams(params = {}) {
    if (!params) return {};
    const p = { ...params };
    // Convert camelCase date params to snake_case if present
    if (p.startDate) {
      p.start_date = p.startDate;
      delete p.startDate;
    }
    if (p.endDate) {
      p.end_date = p.endDate;
      delete p.endDate;
    }
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
      end_date: endDate,
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
  },

  // NEW KPI ENDPOINTS

  /**
   * Get AR Aging Buckets (0-30, 31-60, 61-90, 90+ days)
   */
  async getARAgingBuckets() {
    return apiClient.get('/analytics/ar-aging');
  },

  /**
   * Get Revenue Trend for last N months
   * @param {number} months - Number of months to fetch (default 12)
   */
  async getRevenueTrend(months = 12) {
    return apiClient.get('/analytics/revenue-trend', { months });
  },

  /**
   * Get Gross Margin KPI
   * @param {string} dateFrom - Optional start date
   * @param {string} dateTo - Optional end date
   */
  async getGrossMarginKPI(dateFrom, dateTo) {
    const params = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return apiClient.get('/analytics/gross-margin', params);
  },

  /**
   * Get DSO (Days Sales Outstanding) metric
   * @param {number} daysPeriod - Number of days to calculate DSO (default 90)
   */
  async getDSOMetric(daysPeriod = 90) {
    return apiClient.get('/analytics/dso', { days_period: daysPeriod });
  },

  /**
   * Get Credit Utilization metrics
   */
  async getCreditUtilization() {
    return apiClient.get('/analytics/credit-utilization');
  },

  /**
   * Get all dashboard KPIs in a single call (efficient)
   * Returns: AR Aging, Gross Margin, DSO, Credit Utilization
   */
  async getDashboardKPIs() {
    return apiClient.get('/analytics/dashboard-kpis');
  },
};
