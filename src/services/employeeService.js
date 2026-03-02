import apiClient from "./api.js";

export const employeeService = {
  list: async (filters = {}) => {
    const response = await apiClient.get("/employees", { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await apiClient.post("/employees", data);
    return response;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/employees/${id}`, data);
    return response;
  },

  deactivate: async (id, data) => {
    const response = await apiClient.patch(`/employees/${id}/deactivate`, data);
    return response;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/employees/${id}`);
    return response;
  },
};
