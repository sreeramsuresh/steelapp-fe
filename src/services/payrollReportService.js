import apiClient from "./api.js";

export const payrollReportService = {
  getRegister: async (params) => await apiClient.get("/reports/payroll/register", { params }),
  getDepartmentSummary: async (month, year) =>
    await apiClient.get("/reports/payroll/department-summary", {
      params: { month, year },
    }),
  getCostTrend: async () => await apiClient.get("/reports/payroll/cost-trend"),
};
