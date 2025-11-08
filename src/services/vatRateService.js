import { api } from './api';

const vatRateService = {
  // Get all VAT rates for the authenticated user's company
  async getAll() {
    try {
      const response = await api.get('/vat-rates');
      return response.data;
    } catch (error) {
      console.error('Error fetching VAT rates:', error);
      throw error;
    }
  },

  // Get a single VAT rate by ID
  async getById(id) {
    try {
      const response = await api.get(`/vat-rates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching VAT rate ${id}:`, error);
      throw error;
    }
  },

  // Create a new VAT rate
  async create(vatRateData) {
    try {
      const response = await api.post('/vat-rates', vatRateData);
      return response.data;
    } catch (error) {
      console.error('Error creating VAT rate:', error);
      throw error;
    }
  },

  // Update a VAT rate
  async update(id, vatRateData) {
    try {
      const response = await api.put(`/vat-rates/${id}`, vatRateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating VAT rate ${id}:`, error);
      throw error;
    }
  },

  // Toggle VAT rate active status
  async toggle(id) {
    try {
      const response = await api.patch(`/vat-rates/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling VAT rate ${id}:`, error);
      throw error;
    }
  },

  // Delete a VAT rate
  async delete(id) {
    try {
      const response = await api.delete(`/vat-rates/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting VAT rate ${id}:`, error);
      throw error;
    }
  },
};

export default vatRateService;
