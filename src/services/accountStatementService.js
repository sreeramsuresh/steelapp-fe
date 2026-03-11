import { apiClient } from "./api.js";

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
    const { downloadFile } = await import("./fileDownloadService.js");
    await downloadFile(`/account-statements/${id}/pdf`, `AccountStatement-${id}.pdf`, {
      expectedType: "application/pdf",
    });
  },

  // Generate statement on-the-fly and download PDF
  generateOnTheFly: async (data) => {
    const { downloadFile } = await import("./fileDownloadService.js");
    const custId = data.customer_id || data.customerId || "Customer"; // snake-ok
    const start = data.from_date || data.startDate || "start"; // snake-ok
    const end = data.to_date || data.endDate || "end"; // snake-ok
    await downloadFile("/account-statements/generate", `Statement-${custId}-${start}-to-${end}.pdf`, {
      method: "POST",
      data: { ...data, format: "pdf" },
      expectedType: "application/pdf",
    });
  },
};
