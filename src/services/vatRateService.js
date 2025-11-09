import { api } from './api';

const vatRateService = {
  // Get all VAT rates for the authenticated user's company
  async getAll() {
    try {
      const data = await api.get('/vat-rates');
      // Handle different response formats

      // If data is wrapped in a 'rates' or 'data' property
      if (data && data.rates && Array.isArray(data.rates)) {
        return data.rates;
      }

      // If data is already an array
      if (Array.isArray(data)) {
        return data;
      }

      // If data is wrapped in 'data' property
      if (data && data.data && Array.isArray(data.data)) {
        return data.data;
      }

      console.warn('VAT rates API returned unexpected format:', data);
      return [];
    } catch (error) {
      console.error('Error fetching VAT rates:', error);
      throw error;
    }
  },

  // Get a single VAT rate by ID
  async getById(id) {
    try {
      return await api.get(`/vat-rates/${id}`);
    } catch (error) {
      console.error(`Error fetching VAT rate ${id}:`, error);
      throw error;
    }
  },

  // Create a new VAT rate
  async create(vatRateData) {
    try {
      return await api.post('/vat-rates', vatRateData);
    } catch (error) {
      console.error('Error creating VAT rate:', error);
      throw error;
    }
  },

  // Update a VAT rate
  async update(id, vatRateData) {
    try {
      return await api.put(`/vat-rates/${id}`, vatRateData);
    } catch (error) {
      console.error(`Error updating VAT rate ${id}:`, error);
      throw error;
    }
  },

  // Toggle VAT rate active status
  async toggle(id) {
    try {
      return await api.patch(`/vat-rates/${id}/toggle`);
    } catch (error) {
      console.error(`Error toggling VAT rate ${id}:`, error);
      throw error;
    }
  },

  // Delete a VAT rate
  async delete(id) {
    try {
      return await api.delete(`/vat-rates/${id}`);
    } catch (error) {
      console.error(`Error deleting VAT rate ${id}:`, error);
      throw error;
    }
  },
};

export default vatRateService;
