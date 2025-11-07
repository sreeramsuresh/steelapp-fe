import { apiClient } from './api';

export const companyService = {
  async getCompany() {
    return apiClient.get('/company');
  },

  async updateCompany(companyData) {
    return apiClient.post('/company', companyData);
  },

  async updateCompanyById(id, companyData) {
    return apiClient.put(`/company/${id}`, companyData);
  },

  async uploadLogo(file) {
    const formData = new FormData();
    formData.append('logo', file);
    
    return apiClient.request('/company/upload-logo', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      }
    });
  },

  async deleteLogo(filename) {
    return apiClient.delete(`/company/logo/${filename}`);
  },

  async cleanupLogos() {
    return apiClient.post('/company/cleanup-logos');
  }
};