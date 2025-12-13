import { apiClient } from "./api";

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
    return apiClient.get(
      "/analytics/dashboard",
      analyticsService.normalizeParams(params),
    );
  },

  async getSalesTrends(params = {}) {
    return apiClient.get(
      "/analytics/sales-trends",
      analyticsService.normalizeParams(params),
    );
  },

  async getProductPerformance(params = {}) {
    return apiClient.get(
      "/analytics/product-performance",
      analyticsService.normalizeParams(params),
    );
  },

  async getCustomerAnalysis(params = {}) {
    return apiClient.get(
      "/analytics/customer-analysis",
      analyticsService.normalizeParams(params),
    );
  },

  async getInventoryInsights() {
    return apiClient.get("/analytics/inventory-insights");
  },

  async getRevenueMetrics(startDate, endDate) {
    return apiClient.get("/analytics/dashboard", {
      start_date: startDate,
      end_date: endDate,
    });
  },

  async getMonthlyTrends(period = "month") {
    return apiClient.get("/analytics/sales-trends", { period });
  },

  async getTopCustomers(limit = 10) {
    return apiClient.get("/analytics/customer-analysis", { limit });
  },

  async getTopProducts(limit = 10) {
    return apiClient.get("/analytics/product-performance", { limit });
  },

  // NEW KPI ENDPOINTS

  /**
   * Get AR Aging Buckets (0-30, 31-60, 61-90, 90+ days)
   */
  async getARAgingBuckets() {
    // Use the new AR Aging Report API with summary_only mode
    const response = await apiClient.get("/reports/ar-aging", {
      summary_only: true,
      page_size: 5,
    });

    // Transform the response to match the widget's expected format
    if (response && response.totals) {
      const totals = response.totals;
      const totalAr = totals.totalAr || 0;

      return {
        buckets: [
          {
            label: "Current",
            amount: totals.agingCurrent || 0,
            percentage:
              totalAr > 0 ? ((totals.agingCurrent || 0) / totalAr) * 100 : 0,
          },
          {
            label: "1-30 Days",
            amount: totals.aging1To30 || 0,
            percentage:
              totalAr > 0 ? ((totals.aging1To30 || 0) / totalAr) * 100 : 0,
          },
          {
            label: "31-60 Days",
            amount: totals.aging31To60 || 0,
            percentage:
              totalAr > 0 ? ((totals.aging31To60 || 0) / totalAr) * 100 : 0,
          },
          {
            label: "61-90 Days",
            amount: totals.aging61To90 || 0,
            percentage:
              totalAr > 0 ? ((totals.aging61To90 || 0) / totalAr) * 100 : 0,
          },
          {
            label: "90+ Days",
            amount: totals.aging90Plus || 0,
            percentage:
              totalAr > 0 ? ((totals.aging90Plus || 0) / totalAr) * 100 : 0,
          },
        ],
        total_ar: totalAr,
        overdue_ar: totals.totalOverdue || 0,
        average_dso: totals.averageDso || 0,
        total_customers: totals.totalCustomers || 0,
      };
    }

    return null;
  },

  /**
   * Get Revenue Trend for last N months
   * @param {number} months - Number of months to fetch (default 12)
   */
  async getRevenueTrend(months = 12) {
    return apiClient.get("/analytics/revenue-trend", { months });
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
    return apiClient.get("/analytics/gross-margin", params);
  },

  /**
   * Get DSO (Days Sales Outstanding) metric
   * @param {number} daysPeriod - Number of days to calculate DSO (default 90)
   */
  async getDSOMetric(daysPeriod = 90) {
    return apiClient.get("/analytics/dso", { days_period: daysPeriod });
  },

  /**
   * Get Credit Utilization metrics
   */
  async getCreditUtilization() {
    return apiClient.get("/analytics/credit-utilization");
  },

  /**
   * Get all dashboard KPIs in a single call (efficient)
   * Returns: AR Aging, Gross Margin, DSO, Credit Utilization
   */
  async getDashboardKPIs() {
    return apiClient.get("/analytics/dashboard-kpis");
  },

  // ============================================================
  // PHASE 2 API ENDPOINTS - Net Profit, AP Aging, Cash Flow, Stock Turnover
  // ============================================================

  /**
   * Get Net Profit metrics
   * @param {Object} params - Optional date range params
   * @returns {Promise<Object>} { revenue, cost, net_profit, margin_percentage, trend }
   */
  async getNetProfit(params = {}) {
    const normalizedParams = analyticsService.normalizeParams(params);
    return apiClient.get("/analytics/net-profit", normalizedParams);
  },

  /**
   * Get AP (Accounts Payable) Aging Buckets
   * @returns {Promise<Object>} { buckets, total_ap, overdue_ap }
   */
  async getAPAging() {
    return apiClient.get("/analytics/ap-aging");
  },

  /**
   * Get Cash Flow metrics
   * @param {Object} params - Optional date range and period params
   * @returns {Promise<Object>} { inflow, outflow, net_cash_flow, trend }
   */
  async getCashFlow(params = {}) {
    const normalizedParams = analyticsService.normalizeParams(params);
    return apiClient.get("/analytics/cash-flow", normalizedParams);
  },

  /**
   * Get Stock Turnover metrics
   * @param {Object} params - Optional params for filtering
   * @returns {Promise<Object>} { turnover_ratio, days_of_inventory, cogs, by_category }
   */
  async getStockTurnover(params = {}) {
    return apiClient.get("/analytics/stock-turnover", params);
  },
};
