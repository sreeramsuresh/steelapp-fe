import { apiClient } from './api';

export const customerService = {
  async getCustomers(params = {}) {
    return apiClient.get('/customers', params);
  },

  async getCustomer(id) {
    return apiClient.get(`/customers/${id}`);
  },

  async createCustomer(customerData) {
    return apiClient.post('/customers', customerData);
  },

  async updateCustomer(id, customerData) {
    return apiClient.put(`/customers/${id}`, customerData);
  },

  async deleteCustomer(id) {
    return apiClient.delete(`/customers/${id}`);
  },

  async addContactHistory(customerId, contactData) {
    return apiClient.post(`/customers/${customerId}/contact-history`, contactData);
  },

  async getCustomerAnalytics(customerId) {
    return apiClient.get(`/customers/${customerId}/analytics`);
  },

  async searchCustomers(searchTerm, filters = {}) {
    return apiClient.get('/customers', {
      search: searchTerm,
      ...filters
    });
  }
};