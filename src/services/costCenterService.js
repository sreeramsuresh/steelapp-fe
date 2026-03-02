import apiClient from "./api.js";

export const costCenterService = {
  list: async (filters = {}) => {
    const response = await apiClient.get("/cost-centers", { params: filters });
    return response;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/cost-centers/${id}`);
    return response;
  },

  getSummary: async (id) => {
    const response = await apiClient.get(`/cost-centers/${id}/summary`);
    return response;
  },

  create: async (data) => {
    const response = await apiClient.post("/cost-centers", data);
    return response;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/cost-centers/${id}`, data);
    return response;
  },

  remove: async (id) => {
    const response = await apiClient.delete(`/cost-centers/${id}`);
    return response;
  },
};
