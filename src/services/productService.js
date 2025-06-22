import { apiClient } from './api';

export const productService = {
  async getProducts(params = {}) {
    return apiClient.get('/products', params);
  },

  async getProduct(id) {
    return apiClient.get(`/products/${id}`);
  },

  async createProduct(productData) {
    return apiClient.post('/products', productData);
  },

  async updateProduct(id, productData) {
    return apiClient.put(`/products/${id}`, productData);
  },

  async deleteProduct(id) {
    return apiClient.delete(`/products/${id}`);
  },

  async updateProductPrice(id, priceData) {
    return apiClient.post(`/products/${id}/price-update`, priceData);
  },

  async updateStock(id, stockData) {
    return apiClient.put(`/products/${id}/stock`, stockData);
  },

  async getProductAnalytics() {
    return apiClient.get('/products/analytics');
  },

  async searchProducts(searchTerm, filters = {}) {
    return apiClient.get('/products', {
      search: searchTerm,
      ...filters
    });
  },

  async getProductsByCategory(category) {
    return apiClient.get('/products', { category });
  },

  async getLowStockProducts() {
    return apiClient.get('/products', { stock_status: 'low' });
  }
};