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
      ...filters,
    });
  },

  async getProductsByCategory(category) {
    return apiClient.get('/products', { category });
  },

  async getLowStockProducts() {
    return apiClient.get('/products', { stock_status: 'low' });
  },

  async downloadProducts() {
    const { apiService } = await import('./axiosApi');
    const blob = await apiService.request({
      method: 'GET',
      url: '/products/download',
      responseType: 'blob',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const filename = `products_${new Date().toISOString().split('T')[0]}.xlsx`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(downloadUrl);
  },
};
