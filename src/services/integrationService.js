/**
 * Integration Service
 *
 * Manage third-party API integrations (FTA, Central Bank, etc.)
 */

import { apiClient } from "./api";

export const integrationService = {
  /**
   * Get all integrations for the company
   */
  async getAll() {
    try {
      const response = await apiClient.get("/integrations");
      return response;
    } catch (error) {
      console.error("Error fetching integrations:", error);
      throw error;
    }
  },

  /**
   * Get a specific integration by type
   * @param {string} type - Integration type (e.g., 'fta_trn')
   */
  async get(type) {
    try {
      const response = await apiClient.get(`/integrations/${type}`);
      return response;
    } catch (error) {
      console.error(`Error fetching integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Create or update an integration
   * @param {string} type - Integration type
   * @param {object} data - { api_url, api_key, config }
   */
  async save(type, data) {
    try {
      const response = await apiClient.post(`/integrations/${type}`, data);
      return response;
    } catch (error) {
      console.error(`Error saving integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Test an integration connection
   * @param {string} type - Integration type
   */
  async test(type) {
    try {
      const response = await apiClient.post(`/integrations/${type}/test`);
      return response;
    } catch (error) {
      console.error(`Error testing integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Unlock an integration for editing
   * @param {string} type - Integration type
   */
  async unlock(type) {
    try {
      const response = await apiClient.post(`/integrations/${type}/unlock`);
      return response;
    } catch (error) {
      console.error(`Error unlocking integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Lock an integration
   * @param {string} type - Integration type
   */
  async lock(type) {
    try {
      const response = await apiClient.post(`/integrations/${type}/lock`);
      return response;
    } catch (error) {
      console.error(`Error locking integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Delete an integration
   * @param {string} type - Integration type
   */
  async delete(type) {
    try {
      const response = await apiClient.delete(`/integrations/${type}`);
      return response;
    } catch (error) {
      console.error(`Error deleting integration ${type}:`, error);
      throw error;
    }
  },

  /**
   * Get audit log for an integration
   * @param {string} type - Integration type
   * @param {object} params - { limit, offset }
   */
  async getAuditLog(type, params = {}) {
    try {
      const response = await apiClient.get(`/integrations/${type}/audit`, params);
      return response;
    } catch (error) {
      console.error(`Error fetching audit log for ${type}:`, error);
      throw error;
    }
  },
};

export default integrationService;
