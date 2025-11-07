import { apiClient } from './api';

export const templateService = {
  async getTemplates() {
    return apiClient.get('/templates');
  },

  async getTemplate(id) {
    return apiClient.get(`/templates/${id}`);
  },

  async createTemplate(templateData) {
    return apiClient.post('/templates', templateData);
  },

  async updateTemplate(id, templateData) {
    return apiClient.put(`/templates/${id}`, templateData);
  },

  async deleteTemplate(id) {
    return apiClient.delete(`/templates/${id}`);
  }
};