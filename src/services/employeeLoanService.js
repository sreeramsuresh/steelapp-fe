import apiClient from "./api.js";

export const employeeLoanService = {
  list: async (filters = {}) => await apiClient.get("/employee-loans", { params: filters }),

  getById: async (id) => await apiClient.get(`/employee-loans/${id}`),

  create: async (data) => await apiClient.post("/employee-loans", data),

  update: async (id, data) => await apiClient.patch(`/employee-loans/${id}`, data),

  remove: async (id) => await apiClient.delete(`/employee-loans/${id}`),

  disburse: async (id) => await apiClient.post(`/employee-loans/${id}/disburse`),

  getByEmployee: async (employeeId) => await apiClient.get(`/employee-loans/employee/${employeeId}`),
};
