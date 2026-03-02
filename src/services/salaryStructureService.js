import apiClient from "./api.js";

export const salaryStructureService = {
  list: async (filters = {}) => await apiClient.get("/salary-structures", { params: filters }),

  getById: async (id) => await apiClient.get(`/salary-structures/${id}`),

  create: async (data) => await apiClient.post("/salary-structures", data),

  update: async (id, data) => await apiClient.patch(`/salary-structures/${id}`, data),

  remove: async (id) => await apiClient.delete(`/salary-structures/${id}`),

  clone: async (id) => await apiClient.post(`/salary-structures/${id}/clone`),
};
