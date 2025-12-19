import { apiClient } from "./api";
import { apiService } from "./axiosApi"; // Only for downloadPDF

export const quotationService = {
  // Get all quotations with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get("/quotations", params);
  },

  // Get quotation by ID
  getById: (id) => {
    return apiClient.get(`/quotations/${id}`);
  },

  // Create quotation
  create: (data) => {
    return apiClient.post("/quotations", data);
  },

  // Update quotation
  update: (id, data) => {
    return apiClient.put(`/quotations/${id}`, data);
  },

  // Delete quotation
  delete: (id) => {
    return apiClient.delete(`/quotations/${id}`);
  },

  // Update quotation status
  updateStatus: (id, status) => {
    return apiClient.patch(`/quotations/${id}/status`, { status });
  },

  // Convert quotation to invoice
  convertToInvoice: (id) => {
    return apiClient.post(`/quotations/${id}/convert-to-invoice`);
  },

  // Get next quotation number
  getNextNumber: () => {
    return apiClient.get("/quotations/number/next");
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const blob = await apiService.request({
      method: "GET",
      url: `/quotations/${id}/pdf`,
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = `Quotation-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  },
};
