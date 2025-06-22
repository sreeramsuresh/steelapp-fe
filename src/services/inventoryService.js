import { apiClient } from './api.js';

class InventoryService {
  constructor() {
    this.endpoint = '/inventory';
  }

  async getAllItems(filters = {}) {
    return apiClient.get(this.endpoint, filters);
  }

  async getItemById(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  async createItem(itemData) {
    return apiClient.post(this.endpoint, itemData);
  }

  async updateItem(id, itemData) {
    return apiClient.put(`${this.endpoint}/${id}`, itemData);
  }

  async deleteItem(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  async getItemsByProduct(productType, grade) {
    const filters = {
      productType,
      grade
    };
    return apiClient.get(`${this.endpoint}/by-product`, filters);
  }

  async updateQuantity(id, quantity, operation = 'set') {
    return apiClient.patch(`${this.endpoint}/${id}/quantity`, {
      quantity,
      operation // 'set', 'add', 'subtract'
    });
  }

  async getLowStockItems(threshold = 5) {
    return apiClient.get(`${this.endpoint}/low-stock`, { threshold });
  }

  async getInventorySummary() {
    return apiClient.get(`${this.endpoint}/summary`);
  }

  async searchItems(searchTerm) {
    return apiClient.get(`${this.endpoint}/search`, { q: searchTerm });
  }

  async getItemsByLocation(location) {
    return apiClient.get(`${this.endpoint}/by-location/${location}`);
  }
}

export const inventoryService = new InventoryService();