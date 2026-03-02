import apiClient from "./api.js";

export const expensePolicyService = {
  list: async (filters = {}) => await apiClient.get("/expense-policies", { params: filters }),

  getById: async (id) => await apiClient.get(`/expense-policies/${id}`),

  create: async (data) => await apiClient.post("/expense-policies", data),

  update: async (id, data) => await apiClient.patch(`/expense-policies/${id}`, data),

  remove: async (id) => await apiClient.delete(`/expense-policies/${id}`),

  validate: async (data) => await apiClient.post("/expense-policies/validate", data),
};
