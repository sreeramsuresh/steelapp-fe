import apiClient from "./api.js";

export const payrollReportService = {
  getRegister: async (params) => await apiClient.get("/reports/payroll/register", { params }),
  getDepartmentSummary: async (month, year) =>
    await apiClient.get("/reports/payroll/department-summary", {
      params: { month, year },
    }),
  getSalaryVsRevenue: async (params) => await apiClient.get("/reports/payroll/salary-vs-revenue", { params }),
  getCostTrend: async () => await apiClient.get("/reports/payroll/cost-trend"),
};
