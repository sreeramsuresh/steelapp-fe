import apiClient from "./api.js";

export const employeeAdvanceService = {
  list: async (filters = {}) => await apiClient.get("/employee-advances", { params: filters }),

  getById: async (id) => await apiClient.get(`/employee-advances/${id}`),

  create: async (data) => await apiClient.post("/employee-advances", data),

  update: async (id, data) => await apiClient.patch(`/employee-advances/${id}`, data),

  remove: async (id) => await apiClient.delete(`/employee-advances/${id}`),

  approve: async (id) => await apiClient.post(`/employee-advances/${id}/approve`),

  disburse: async (id) => await apiClient.post(`/employee-advances/${id}/disburse`),

  settle: async (id, data) => await apiClient.post(`/employee-advances/${id}/settle`, data),

  getByEmployee: async (employeeId) => await apiClient.get(`/employee-advances/employee/${employeeId}`),
};
