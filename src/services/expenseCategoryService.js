import apiClient from "./api.js";

export const expenseCategoryService = {
  list: async (filters = {}) => {
    const response = await apiClient.get("/expense-categories", {
      params: filters,
    });
    return response;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/expense-categories/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await apiClient.post("/expense-categories", data);
    return response;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/expense-categories/${id}`, data);
    return response;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/expense-categories/${id}`);
    return response;
  },
};
