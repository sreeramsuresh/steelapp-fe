import apiClient from "./api.js";

export const salaryComponentService = {
  list: async (filters = {}) => await apiClient.get("/salary-components", { params: filters }),

  getById: async (id) => await apiClient.get(`/salary-components/${id}`),

  create: async (data) => await apiClient.post("/salary-components", data),

  update: async (id, data) => await apiClient.patch(`/salary-components/${id}`, data),

  remove: async (id) => await apiClient.delete(`/salary-components/${id}`),
};
