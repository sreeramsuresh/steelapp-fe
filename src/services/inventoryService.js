import { apiClient } from "./api.js";

// Map UI model -> server payload (snake_case)
const toServer = (item = {}) => ({
  description: item.description || "",
  product_type: item.productType || "",
  grade: item.grade || "",
  finish: item.finish || "",
  size: item.size || "",
  thickness: item.thickness || "",
  quantity:
    typeof item.quantity === "number"
      ? item.quantity
      : parseFloat(item.quantity) || 0,
  price_purchased:
    typeof item.pricePurchased === "number"
      ? item.pricePurchased
      : parseFloat(item.pricePurchased) || 0,
  selling_price:
    typeof item.sellingPrice === "number"
      ? item.sellingPrice
      : parseFloat(item.sellingPrice) || 0,
  landed_cost:
    typeof item.landedCost === "number"
      ? item.landedCost
      : parseFloat(item.landedCost) || 0,
  location: item.location || "",
  warehouse_id: item.warehouseId ? Number(item.warehouseId) : null,
  min_stock:
    item.minStock !== null && item.minStock !== undefined
      ? Number(item.minStock)
      : 0,
  product_id: item.productId ? Number(item.productId) : null,
  product_name: item.productName || null,
  // ERP fields
  quantity_on_hand:
    typeof item.quantityOnHand === "number"
      ? item.quantityOnHand
      : parseFloat(item.quantityOnHand) || 0,
  quantity_reserved:
    typeof item.quantityReserved === "number"
      ? item.quantityReserved
      : parseFloat(item.quantityReserved) || 0,
  status: item.status || "AVAILABLE",
  batch_number: item.batchNumber || "",
  coil_number: item.coilNumber || "",
  heat_number: item.heatNumber || "",
  bundle_number: item.bundleNumber || "",
  unit_cost:
    typeof item.unitCost === "number"
      ? item.unitCost
      : parseFloat(item.unitCost) || 0,
});

// Map server record -> UI model (camelCase)
// NOTE: gRPC returns quantity_on_hand/minimum_stock (ERP fields) which API Gateway
// converts to quantityOnHand/minimumStock. Map these to legacy quantity/minStock
// fields for backward compatibility with UI components.
const fromServer = (rec = {}) => ({
  id: rec.id,
  description: rec.description || "",
  productType: rec.productType || "",
  grade: rec.grade || "",
  finish: rec.finish || "",
  size: rec.size || "",
  thickness: rec.thickness || "",
  // Map from ERP fields (quantityOnHand/minimumStock) OR legacy fields (quantity/minStock)
  quantity:
    parseFloat(rec.quantityOnHand) ||
    parseFloat(rec.quantityAvailable) ||
    parseFloat(rec.quantity) ||
    0,
  minStock: parseFloat(rec.minimumStock) || parseFloat(rec.minStock) || 0,
  pricePurchased: rec.pricePurchased || rec.pricePurchased || 0,
  sellingPrice: rec.sellingPrice || 0,
  landedCost: rec.landedCost || 0,
  location: rec.location || "",
  warehouseId: rec.warehouseId || "",
  warehouseName: rec.warehouseName || "",
  warehouseCode: rec.warehouseCode || "",
  warehouseCity: rec.warehouseCity || "",
  productId: rec.productId || null,
  productName: rec.productName || rec.productDisplayName || null,
  productOrigin: rec.productOrigin || "",
  // ERP fields (keep for components that use them directly)
  quantityOnHand: parseFloat(rec.quantityOnHand) || 0,
  quantityReserved: parseFloat(rec.quantityReserved) || 0,
  quantityAvailable: parseFloat(rec.quantityAvailable) || 0,
  unit: rec.unit || "KG",
  status: rec.status || "AVAILABLE",
  batchNumber: rec.batchNumber || "",
  coilNumber: rec.coilNumber || "",
  heatNumber: rec.heatNumber || "",
  bundleNumber: rec.bundleNumber || "",
  unitCost: parseFloat(rec.unitCost) || 0,
  totalValue: parseFloat(rec.totalValue) || 0,
  isLowStock: rec.isLowStock || false,
});

class InventoryService {
  constructor() {
    this.endpoint = "/inventory";
  }

  async getAllItems(params = {}) {
    // Support query parameters: page, limit, warehouse_id, product_id, low_stock_only, status
    const res = await apiClient.get(this.endpoint, params);
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
      grade,
    };
    return apiClient.get(`${this.endpoint}/by-product`, filters);
  }

  async updateQuantity(id, quantity, operation = "set") {
    return apiClient.patch(`${this.endpoint}/${id}/quantity`, {
      quantity,
      operation, // 'set', 'add', 'subtract'
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
