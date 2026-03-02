import apiClient from "./api.js";

export const payrollRunService = {
  list: async (filters = {}) => await apiClient.get("/payroll-runs", { params: filters }),

  getById: async (id) => await apiClient.get(`/payroll-runs/${id}`),

  create: async (data) => await apiClient.post("/payroll-runs", data),

  compute: async (id) => await apiClient.post(`/payroll-runs/${id}/compute`),

  submit: async (id) => await apiClient.post(`/payroll-runs/${id}/submit`),

  approve: async (id) => await apiClient.post(`/payroll-runs/${id}/approve`),

  processPayment: async (id) => await apiClient.post(`/payroll-runs/${id}/process-payment`),

  cancel: async (id, reason) => await apiClient.post(`/payroll-runs/${id}/cancel`, { reason }),

  getEntries: async (id) => await apiClient.get(`/payroll-runs/${id}/entries`),

  getEntry: async (id, entryId) => await apiClient.get(`/payroll-runs/${id}/entries/${entryId}`),

  updateEntry: async (id, entryId, data) => await apiClient.patch(`/payroll-runs/${id}/entries/${entryId}`, data),

  getSummary: async (id) => await apiClient.get(`/payroll-runs/${id}/summary`),
};
