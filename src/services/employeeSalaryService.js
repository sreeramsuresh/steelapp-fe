import apiClient from "./api.js";

export const employeeSalaryService = {
  getCurrent: async (employeeId) => await apiClient.get(`/employees/${employeeId}/salary/current`),

  getHistory: async (employeeId) => await apiClient.get(`/employees/${employeeId}/salary/history`),

  assign: async (employeeId, data) => await apiClient.post(`/employees/${employeeId}/salary/assign`, data),

  adjust: async (employeeId, data) => await apiClient.patch(`/employees/${employeeId}/salary/adjust`, data),
};
