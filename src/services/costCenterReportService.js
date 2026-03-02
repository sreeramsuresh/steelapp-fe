import apiClient from "./api.js";

export const costCenterReportService = {
  getPnL: async (params) => await apiClient.get("/reports/cost-centers/pnl", { params }),
  getBudgetVsActual: async (fiscalYear) =>
    await apiClient.get("/reports/cost-centers/budget-vs-actual", {
      params: { fiscalYear },
    }),
  getExpenseBreakdown: async (params) => await apiClient.get("/reports/cost-centers/expense-breakdown", { params }),
};
