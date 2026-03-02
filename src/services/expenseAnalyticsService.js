import apiClient from "./api.js";

export const expenseAnalyticsService = {
  getTrend: async (months = 12) => await apiClient.get("/reports/expenses/trend", { params: { months } }),
  getCategoryBreakdown: async (startDate, endDate) =>
    await apiClient.get("/reports/expenses/category-breakdown", {
      params: { startDate, endDate },
    }),
  getTopCategories: async (limit = 10) =>
    await apiClient.get("/reports/expenses/top-categories", { params: { limit } }),
  getPolicyViolations: async (startDate, endDate) =>
    await apiClient.get("/reports/expenses/policy-violations", {
      params: { startDate, endDate },
    }),
};
