import api from './api';

const pricelistService = {
  // Get all pricelists
  async getAll(params = {}) {
    const response = await api.get('/pricelists', { params });
    return response.data;
  },

  // Get single pricelist with items
  async getById(id) {
    const response = await api.get(`/pricelists/${id}`);
    return response.data;
  },

  // Create new pricelist
  async create(data) {
    const response = await api.post('/pricelists', data);
    return response.data;
  },

  // Update pricelist
  async update(id, data) {
    const response = await api.put(`/pricelists/${id}`, data);
    return response.data;
  },

  // Delete/deactivate pricelist
  async delete(id, hardDelete = false) {
    const response = await api.delete(`/pricelists/${id}`, {
      params: { hard_delete: hardDelete },
    });
    return response.data;
  },

  // Get items in a pricelist
  async getItems(pricelistId) {
    const response = await api.get(`/pricelists/${pricelistId}/items`);
    return response.data;
  },

  // Bulk update pricelist items
  async updateItems(pricelistId, items, operation = 'upsert') {
    const response = await api.put(`/pricelists/${pricelistId}/items`, {
      items,
      operation,
    });
    return response.data;
  },

  // Add single item to pricelist
  async addItem(pricelistId, item) {
    const response = await api.post(`/pricelists/${pricelistId}/items`, item);
    return response.data;
  },

  // Remove item from pricelist
  async removeItem(pricelistId, productId) {
    const response = await api.delete(`/pricelists/${pricelistId}/items/${productId}`);
    return response.data;
  },

  // Apply percentage change to all items
  async applyPercentage(pricelistId, percentage, operation = 'increase') {
    const response = await api.post(`/pricelists/${pricelistId}/apply-percentage`, {
      percentage,
      operation,
    });
    return response.data;
  },

  // Copy items from another pricelist
  async copyFrom(pricelistId, sourcePricelistId, percentageAdjustment = 0) {
    const response = await api.post(`/pricelists/${pricelistId}/copy-from`, {
      source_pricelist_id: sourcePricelistId,
      percentage_adjustment: percentageAdjustment,
    });
    return response.data;
  },

  // Get price for a product
  async getProductPrice(productId, params = {}) {
    const response = await api.get(`/products/${productId}/price`, { params });
    return response.data;
  },

  // Bulk price lookup for multiple products
  async bulkPriceLookup(productIds, params = {}) {
    const response = await api.post('/products/bulk-price-lookup', {
      product_ids: productIds,
      ...params,
    });
    return response.data;
  },
};

export default pricelistService;
