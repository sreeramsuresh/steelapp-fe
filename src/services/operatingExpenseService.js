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

  getLineItems: async (id) => {
    const response = await apiClient.get(`/operating-expenses/${id}/line-items`);
    return response;
  },

  addLineItems: async (id, items) => {
    const response = await apiClient.post(`/operating-expenses/${id}/line-items`, items);
    return response;
  },

  removeLineItem: async (id, lineId) => {
    const response = await apiClient.delete(`/operating-expenses/${id}/line-items/${lineId}`);
    return response;
  },

  getAttachments: async (id) => {
    const response = await apiClient.get(`/operating-expenses/${id}/attachments`);
    return response;
  },

  addAttachment: async (id, data) => {
    const response = await apiClient.post(`/operating-expenses/${id}/attachments`, data);
    return response;
  },

  removeAttachment: async (id, attachmentId) => {
    const response = await apiClient.delete(`/operating-expenses/${id}/attachments/${attachmentId}`);
    return response;
  },

  reject: async (id, reason) => {
    const response = await apiClient.post(`/operating-expenses/${id}/reject`, { reason });
    return response;
  },

  revise: async (id) => {
    const response = await apiClient.post(`/operating-expenses/${id}/revise`);
    return response;
  },

  getSummary: async (filters = {}) => {
    const response = await apiClient.get("/operating-expenses/summary", { params: filters });
    return response;
  },
};
