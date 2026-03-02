import apiClient from "./api.js";

export const costCenterBudgetService = {
  list: async (filters = {}) => await apiClient.get("/cost-center-budgets", { params: filters }),
  getById: async (id) => await apiClient.get(`/cost-center-budgets/${id}`),
  create: async (data) => await apiClient.post("/cost-center-budgets", data),
  update: async (id, data) => await apiClient.patch(`/cost-center-budgets/${id}`, data),
  remove: async (id) => await apiClient.delete(`/cost-center-budgets/${id}`),
  getForCostCenter: async (costCenterId, year) =>
    await apiClient.get(`/cost-center-budgets/cost-center/${costCenterId}/year/${year}`),
};
