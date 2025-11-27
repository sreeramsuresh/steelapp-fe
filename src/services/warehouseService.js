import { apiClient } from './api.js';

/**
 * Warehouse Service
 * Provides frontend API for warehouse operations
 */

// Map server response to UI model (camelCase)
const fromServer = (warehouse = {}) => ({
  id: warehouse.id,
  companyId: warehouse.companyId,
  name: warehouse.name || '',
  code: warehouse.code || '',
  description: warehouse.description || '',
  address: warehouse.address || '',
  city: warehouse.city || '',
  state: warehouse.state || '',
  country: warehouse.country || '',
  postalCode: warehouse.postalCode || '',
  phone: warehouse.phone || '',
  email: warehouse.email || '',
  contactPerson: warehouse.contactPerson || '',
  isDefault: warehouse.isDefault || false,
  isActive: warehouse.isActive !== false,
  type: warehouse.type || 'WAREHOUSE',
  capacity: parseFloat(warehouse.capacity) || 0,
  capacityUnit: warehouse.capacityUnit || 'MT',
  createdAt: warehouse.createdAt,
  updatedAt: warehouse.updatedAt,
});

// Map UI model to server payload (snake_case)
const toServer = (warehouse = {}) => ({
  name: warehouse.name,
  code: warehouse.code,
  description: warehouse.description,
  address: warehouse.address,
  city: warehouse.city,
  state: warehouse.state,
  country: warehouse.country,
  postal_code: warehouse.postalCode,
  phone: warehouse.phone,
  email: warehouse.email,
  contact_person: warehouse.contactPerson,
  is_default: warehouse.isDefault,
  is_active: warehouse.isActive,
  type: warehouse.type,
  capacity: warehouse.capacity,
  capacity_unit: warehouse.capacityUnit,
});

class WarehouseService {
  constructor() {
    this.endpoint = '/warehouses';
  }

  /**
   * Get all warehouses with optional filters
   */
  async getAll(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 100,
      search: filters.search,
      is_active: filters.isActive,
    };

    // Remove undefined params
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(this.endpoint, params);
    const rows = response?.data || response?.warehouses || response || [];
    return {
      data: Array.isArray(rows) ? rows.map(fromServer) : [],
      pagination: response?.pagination || {},
    };
  }

  /**
   * Get warehouse by ID
   */
  async getById(id) {
    const response = await apiClient.get(`${this.endpoint}/${id}`);
    return fromServer(response);
  }

  /**
   * Create warehouse
   */
  async create(warehouseData) {
    const payload = toServer(warehouseData);
    const response = await apiClient.post(this.endpoint, payload);
    return fromServer(response);
  }

  /**
   * Update warehouse
   */
  async update(id, warehouseData) {
    const payload = toServer(warehouseData);
    const response = await apiClient.put(`${this.endpoint}/${id}`, payload);
    return fromServer(response);
  }

  /**
   * Delete warehouse
   */
  async delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Set warehouse as default
   */
  async setDefault(id) {
    const response = await apiClient.patch(`${this.endpoint}/${id}/default`);
    return fromServer(response);
  }

  /**
   * Get default warehouse
   */
  async getDefault() {
    const response = await apiClient.get(`${this.endpoint}/default`);
    return response ? fromServer(response) : null;
  }

  /**
   * Seed default warehouses (for initial setup)
   */
  async seed() {
    return apiClient.post(`${this.endpoint}/seed`);
  }
}

export const warehouseService = new WarehouseService();
