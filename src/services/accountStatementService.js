import { apiClient } from "./api.js";
import { apiService } from "./axiosApi.js";

export const accountStatementService = {
  // Get all account statements with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get("/account-statements", params);
  },

  // Get account statement by ID
  getById: (id) => {
    return apiClient.get(`/account-statements/${id}`);
  },

  // Create account statement
  create: (data) => {
    return apiClient.post("/account-statements", data);
  },

  // Update account statement
  update: (id, data) => {
    return apiClient.put(`/account-statements/${id}`, data);
  },

  // Delete account statement
  delete: (id) => {
    return apiClient.delete(`/account-statements/${id}`);
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const blob = await apiService.request({
      method: "GET",
      url: `/account-statements/${id}/pdf`,
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = `AccountStatement-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  },

  // Generate statement on-the-fly without saving
  generateOnTheFly: async (data) => {
    const blob = await apiService.request({
      method: "POST",
      url: "/account-statements/generate",
      data,
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    const fileName = `Statement-${data.customerId || "Customer"}-${data.startDate}-to-${data.endDate}.pdf`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  },
};
