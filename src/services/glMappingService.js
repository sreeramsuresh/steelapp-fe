/**
 * GL Mapping Service
 * CRUD for GL mapping rules + match/preview endpoints.
 */

import { apiClient } from "./api.js";

const glMappingService = {
  async listRules(filters = {}) {
    const response = await apiClient.get("/gl-mappings/rules", { params: filters });
    return response?.data || response || [];
  },

  async getRule(ruleCode) {
    const response = await apiClient.get(`/gl-mappings/rules/${ruleCode}`);
    return response?.data || response || {};
  },

  async createRule(data) {
    const response = await apiClient.post("/gl-mappings/rules", data);
    return response?.data || response || {};
  },

  async updateRule(ruleCode, data) {
    const response = await apiClient.put(`/gl-mappings/rules/${ruleCode}`, data);
    return response?.data || response || {};
  },

  async deleteRule(ruleCode) {
    const response = await apiClient.delete(`/gl-mappings/rules/${ruleCode}`);
    return response;
  },

  async matchRule(eventType, transactionData = {}) {
    const response = await apiClient.post("/gl-mappings/match", { eventType, transactionData });
    return response?.data || response || {};
  },

  async previewLines(ruleCode, transactionData = {}) {
    const response = await apiClient.post("/gl-mappings/generate-lines", { ruleCode, transactionData });
    return response?.data || response || {};
  },
};

export default glMappingService;
