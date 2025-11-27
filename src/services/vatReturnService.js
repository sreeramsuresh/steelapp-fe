/**
 * UAE VAT Return Service
 *
 * Frontend service for interacting with VAT Return API endpoints.
 */

import api from './api';

const vatReturnService = {
  /**
   * Get available VAT periods
   * @returns {Promise<Array>} List of available periods
   */
  async getPeriods() {
    const response = await api.get('/vat-return/periods');
    return response.data;
  },

  /**
   * Generate VAT return report
   * @param {string} startDate - Period start date (YYYY-MM-DD)
   * @param {string} endDate - Period end date (YYYY-MM-DD)
   * @returns {Promise<Object>} VAT return data
   */
  async generateReport(startDate, endDate) {
    const response = await api.get('/vat-return/generate', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  /**
   * Save VAT return to database
   * @param {string} startDate - Period start date
   * @param {string} endDate - Period end date
   * @returns {Promise<Object>} Saved VAT return
   */
  async saveReport(startDate, endDate) {
    const response = await api.post('/vat-return/save', {
      startDate,
      endDate
    });
    return response.data;
  },

  /**
   * Get list of valid UAE emirates
   * @returns {Promise<Array>} List of emirates
   */
  async getEmirates() {
    const response = await api.get('/vat-return/emirates');
    return response.data;
  }
};

export default vatReturnService;
