import { apiClient } from './api.js';

// Map UI model -> server payload (snake_case)
const toServer = (item = {}) => ({
  description: item.description || '',
  product_type: item.productType || '',
  grade: item.grade || '',
  finish: item.finish || '',
  size: item.size || '',
  thickness: item.thickness || '',
  quantity: typeof item.quantity === 'number' ? item.quantity : (parseFloat(item.quantity) || 0),
  price_purchased: typeof item.pricePurchased === 'number' ? item.pricePurchased : (parseFloat(item.pricePurchased) || 0),
  selling_price: typeof item.sellingPrice === 'number' ? item.sellingPrice : (parseFloat(item.sellingPrice) || 0),
  landed_cost: typeof item.landedCost === 'number' ? item.landedCost : (parseFloat(item.landedCost) || 0),
  location: item.location || '',
  warehouse_id: item.warehouseId ? Number(item.warehouseId) : null,
  min_stock: item.minStock !== null && item.minStock !== undefined ? Number(item.minStock) : 0,
  product_id: item.productId ? Number(item.productId) : null,
  product_name: item.productName || null,
});

// Map server record -> UI model (camelCase)
const fromServer = (rec = {}) => ({
  id: rec.id,
  description: rec.description || '',
  productType: rec.productType || '',
  grade: rec.grade || '',
  finish: rec.finish || '',
  size: rec.size || '',
  thickness: rec.thickness || '',
  quantity: rec.quantity || 0,
  pricePurchased: rec.pricePurchased || 0,
  sellingPrice: rec.sellingPrice || 0,
  landedCost: rec.landedCost || 0,
  location: rec.location || '',
  warehouseId: rec.warehouseId || '',
  warehouseName: rec.warehouseName || '',
  warehouseCode: rec.warehouseCode || '',
  warehouseCity: rec.warehouseCity || '',
  minStock: rec.minStock || 0,
  productId: rec.productId || null,
  productName: rec.productName || null,
});

class InventoryService {
  constructor() {
    this.endpoint = '/inventory';
  }

  async getAllItems(filters = {}) {
    const res = await apiClient.get(this.endpoint, filters);
    const rows = res?.data || res || [];
    return { data: rows.map(fromServer) };
  }

  async getItemById(id) {
    const rec = await apiClient.get(`${this.endpoint}/${id}`);
    return fromServer(rec);
  }

  async createItem(itemData) {
    const payload = toServer(itemData);
    const created = await apiClient.post(this.endpoint, payload);
    return fromServer(created);
  }

  async updateItem(id, itemData) {
    const payload = toServer(itemData);
    const updated = await apiClient.put(`${this.endpoint}/${id}`, payload);
    return fromServer(updated);
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
