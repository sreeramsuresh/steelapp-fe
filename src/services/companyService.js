import { apiClient } from "./api.js";
import { apiService } from "./axiosApi.js";

// Upload a file via the shared apiService (multipart/form-data; boundary set by browser)
const uploadFile = async (endpoint, fieldName, file) => {
  const formData = new FormData();
  formData.append(fieldName, file);
  return apiService.upload(endpoint, formData);
};

export const companyService = {
  async getCompany() {
    return apiClient.get("/company");
  },

  async updateCompany(companyData) {
    return apiClient.post("/company", companyData);
  },

  async updateCompanyById(id, companyData) {
    return apiClient.put(`/company/${id}`, companyData);
  },

  async uploadLogo(file) {
    return uploadFile("/company/upload-logo", "logo", file);
  },

  async deleteLogo(filename) {
    return apiClient.delete(`/company/logo/${filename}`);
  },

  async cleanupLogos() {
    return apiClient.post("/company/cleanup-logos");
  },

  async uploadBrandmark(file) {
    return uploadFile("/company/upload-brandmark", "brandmark", file);
  },

  async deleteBrandmark(filename) {
    return apiClient.delete(`/company/brandmark/${filename}`);
  },

  async uploadSeal(file) {
    return uploadFile("/company/upload-seal", "seal", file);
  },

  async deleteSeal(filename) {
    return apiClient.delete(`/company/seal/${filename}`);
  },

  /**
   * Update invoice template settings
   * @param {Object} templateSettings - Template settings including selectedTemplate and advanced settings
   */
  async updateTemplateSettings(templateSettings) {
    return apiClient.post("/company/template-settings", templateSettings);
  },

  /**
   * Get invoice template settings
   * @returns {Object} Template settings
   */
  async getTemplateSettings() {
    return apiClient.get("/company/template-settings");
  },
};
