import apiClient from "./api.js";

export const operatingExpenseService = {
  create: async (expenseData) => {
    const response = await apiClient.post("/operating-expenses", expenseData);
    return response;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/operating-expenses/${id}`);
    return response;
  },

  list: async (filters = {}) => {
    const response = await apiClient.get("/operating-expenses", {
      params: filters,
    });
    return response;
  },

  update: async (id, expenseData) => {
    const response = await apiClient.patch(`/operating-expenses/${id}`, expenseData);
    return response;
  },

  submit: async (id) => {
    const response = await apiClient.post(`/operating-expenses/${id}/submit`);
    return response;
  },

  approve: async (id) => {
    const response = await apiClient.post(`/operating-expenses/${id}/approve`);
    return response;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/operating-expenses/${id}`);
    return response;
  },
};
