import { api } from './api';

export const exchangeRateService = {
  // Get all exchange rates
  async getExchangeRates(params = {}) {
    try {
      const response = await api.get('/exchange-rates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  },

  // Get latest exchange rate for currency pair
  async getLatestRate(from, to) {
    try {
      const response = await api.get(`/exchange-rates/latest/${from}/${to}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest rate:', error);
      throw error;
    }
  },

  // Get all latest rates for base currency
  async getLatestRatesForBase(base) {
    try {
      const response = await api.get(`/exchange-rates/latest/${base}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest rates for base:', error);
      throw error;
    }
  },

  // Create new exchange rate
  async createExchangeRate(data) {
    try {
      const response = await api.post('/exchange-rates', data);
      return response.data;
    } catch (error) {
      console.error('Error creating exchange rate:', error);
      throw error;
    }
  },

  // Update exchange rate
  async updateExchangeRate(id, data) {
    try {
      const response = await api.put(`/exchange-rates/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      throw error;
    }
  },

  // Delete exchange rate
  async deleteExchangeRate(id) {
    try {
      const response = await api.delete(`/exchange-rates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      throw error;
    }
  },

  // Convert amount between currencies
  async convertCurrency(data) {
    try {
      const response = await api.post('/exchange-rates/convert', data);
      return response.data;
    } catch (error) {
      console.error('Error converting currency:', error);
      throw error;
    }
  },

  // Bulk import exchange rates
  async bulkImportRates(data) {
    try {
      const response = await api.post('/exchange-rates/bulk-import', data);
      return response.data;
    } catch (error) {
      console.error('Error bulk importing rates:', error);
      throw error;
    }
  },

  // Get supported currencies
  async getCurrencies() {
    try {
      const response = await api.get('/exchange-rates/currencies/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      throw error;
    }
  },

  // Get rate history for currency pair
  async getRateHistory(from, to, days = 30) {
    try {
      const response = await api.get(`/exchange-rates/history/${from}/${to}`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching rate history:', error);
      throw error;
    }
  },

  // Get currency format helper
  formatCurrency(amount, currency = 'AED') {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  // Get exchange rate display with symbol
  formatRate(rate, fromCurrency, toCurrency) {
    return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
  }
};

export default exchangeRateService;