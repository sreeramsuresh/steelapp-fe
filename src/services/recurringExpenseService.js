import apiClient from "./api.js";

export const recurringExpenseService = {
  list: async (filters = {}) => await apiClient.get("/recurring-expenses", { params: filters }),

  getById: async (id) => await apiClient.get(`/recurring-expenses/${id}`),

  create: async (data) => await apiClient.post("/recurring-expenses", data),

  update: async (id, data) => await apiClient.patch(`/recurring-expenses/${id}`, data),

  remove: async (id) => await apiClient.delete(`/recurring-expenses/${id}`),

  generate: async (id) => await apiClient.post(`/recurring-expenses/${id}/generate`),

  generateDue: async () => await apiClient.post("/recurring-expenses/generate-due"),
};
