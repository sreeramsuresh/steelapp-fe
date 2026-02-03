import apiClient from "./apiClient";

export const operatingExpenseService = {
  create: async (expenseData) => {
    const response = await apiClient.post("/operating-expenses", expenseData);
    return response.data.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/operating-expenses/${id}`);
    return response.data.data;
  },

  list: async (filters = {}) => {
    const response = await apiClient.get("/operating-expenses", {
      params: filters,
    });
    return response.data;
  },

  update: async (id, expenseData) => {
    const response = await apiClient.patch(`/operating-expenses/${id}`, expenseData);
    return response.data.data;
  },

  submit: async (id) => {
    const response = await apiClient.post(`/operating-expenses/${id}/submit`);
    return response.data.data;
  },

  approve: async (id) => {
    const response = await apiClient.post(`/operating-expenses/${id}/approve`);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/operating-expenses/${id}`);
    return response.data;
  },
};
