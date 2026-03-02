import apiClient from "./api.js";

export const expenseApprovalChainService = {
  list: async (filters = {}) => await apiClient.get("/expense-approval-chains", { params: filters }),

  getById: async (id) => await apiClient.get(`/expense-approval-chains/${id}`),

  create: async (data) => await apiClient.post("/expense-approval-chains", data),

  update: async (id, data) => await apiClient.patch(`/expense-approval-chains/${id}`, data),

  remove: async (id) => await apiClient.delete(`/expense-approval-chains/${id}`),
};
