import apiClient from "./api.js";

export const designationService = {
  list: async (filters = {}) => {
    const response = await apiClient.get("/designations", { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/designations/${id}`);
    return response;
  },

  create: async (data) => {
    const response = await apiClient.post("/designations", data);
    return response;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/designations/${id}`, data);
    return response;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/designations/${id}`);
    return response;
  },
};
