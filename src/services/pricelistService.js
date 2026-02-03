import api from "./api.js";

const pricelistService = {
  // Get all pricelists
  async getAll(params = {}) {
    // api.get() delegates to apiService.get() which already returns response.data
    const data = await api.get("/pricelists", { params });
    return data;
  },

  // Get single pricelist with items
  async getById(id) {
    const data = await api.get(`/pricelists/${id}`);
    return data;
  },

  // Create new pricelist
  async create(data) {
    const result = await api.post("/pricelists", data);
    return result;
  },

  // Update pricelist
  async update(id, data) {
    const result = await api.put(`/pricelists/${id}`, data);
    return result;
  },

  // Delete/deactivate pricelist
  async delete(id, hardDelete = false) {
    const result = await api.delete(`/pricelists/${id}`, {
      params: { hard_delete: hardDelete },
    });
    return result;
  },

  // Get items in a pricelist
  async getItems(pricelistId) {
    const data = await api.get(`/pricelists/${pricelistId}/items`);
    return data;
  },

  // Bulk update pricelist items
  async updateItems(pricelistId, items, operation = "upsert") {
    const result = await api.put(`/pricelists/${pricelistId}/items`, {
      items,
      operation,
    });
    return result;
  },

  // Add single item to pricelist
  async addItem(pricelistId, item) {
    const result = await api.post(`/pricelists/${pricelistId}/items`, item);
    return result;
  },

  // Remove item from pricelist
  async removeItem(pricelistId, productId) {
    const result = await api.delete(`/pricelists/${pricelistId}/items/${productId}`);
    return result;
  },

  // Apply percentage change to all items
  async applyPercentage(pricelistId, percentage, operation = "increase") {
    const result = await api.post(`/pricelists/${pricelistId}/apply-percentage`, {
      percentage,
      operation,
    });
    return result;
  },

  // Copy items from another pricelist
  async copyFrom(pricelistId, sourcePricelistId, percentageAdjustment = 0) {
    const result = await api.post(`/pricelists/${pricelistId}/copy-from`, {
      source_pricelist_id: sourcePricelistId,
      percentage_adjustment: percentageAdjustment,
    });
    return result;
  },

  // Get price for a product
  async getProductPrice(productId, params = {}) {
    const data = await api.get(`/products/${productId}/price`, { params });
    return data;
  },

  // Bulk price lookup for multiple products
  async bulkPriceLookup(productIds, params = {}) {
    const result = await api.post("/products/bulk-price-lookup", {
      product_ids: productIds,
      ...params,
    });
    return result;
  },

  // Get price for a product based on quantity (volume discount support)
  async getPriceForQuantity(productId, pricelistId, quantity) {
    const data = await api.get("/pricelists/price-for-quantity", {
      params: {
        product_id: productId,
        pricelist_id: pricelistId,
        quantity,
      },
    });
    return data;
  },

  // Get price change history (audit trail)
  async getHistory(pricelistId, params = {}) {
    const data = await api.get(`/pricelists/${pricelistId}/history`, {
      params: {
        product_id: params.productId || undefined,
        change_type: params.changeType || undefined,
        from_date: params.fromDate || undefined,
        to_date: params.toDate || undefined,
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    });
    return data;
  },
};

export default pricelistService;
