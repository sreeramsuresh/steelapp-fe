import { apiClient } from './api.js';

class StockMovementService {
  constructor() {
    this.endpoint = '/stock-movements';
  }

  async getAllMovements(filters = {}) {
    return apiClient.get(this.endpoint, filters);
  }

  async getMovementById(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  async createMovement(movementData) {
    return apiClient.post(this.endpoint, movementData);
  }

  async updateMovement(id, movementData) {
    return apiClient.put(`${this.endpoint}/${id}`, movementData);
  }

  async deleteMovement(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  async getMovementsByProduct(productType, grade, size, thickness) {
    const filters = {
      productType,
      grade,
      size,
      thickness
    };
    return apiClient.get(`${this.endpoint}/by-product`, filters);
  }

  async getMovementsByDateRange(startDate, endDate) {
    const filters = {
      startDate,
      endDate
    };
    return apiClient.get(`${this.endpoint}/by-date-range`, filters);
  }

  async getMovementsByInvoice(invoiceNo) {
    return apiClient.get(`${this.endpoint}/by-invoice/${invoiceNo}`);
  }

  async getCurrentStock(productType, grade, size, thickness, finish) {
    const filters = {
      productType,
      grade,
      size,
      thickness,
      finish
    };
    return apiClient.get(`${this.endpoint}/current-stock`, filters);
  }
}

export const stockMovementService = new StockMovementService();