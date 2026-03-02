import apiClient from "./api.js";

export const departmentService = {
  list: async (filters = {}) => {
    const response = await apiClient.get("/departments", { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/departments/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await apiClient.post("/departments", data);
    return response;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/departments/${id}`, data);
    return response;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/departments/${id}`);
    return response;
  },
};
