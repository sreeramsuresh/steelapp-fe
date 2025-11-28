import { apiClient } from './api.js';

/**
 * Warehouse Service
 * Provides frontend API for warehouse operations
 */

// ============================================================================
// CACHE UTILITIES (Stale-While-Revalidate Pattern)
// ============================================================================

const CACHE_KEYS = {
  SUMMARY: 'warehouse_summary_cache',
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - consider data stale after this

/**
 * Get cached data from localStorage
 * @returns {Object|null} - { data, timestamp } or null if not found/expired
 */
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    // Return data even if stale - caller decides what to do
    return parsed;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
};

/**
 * Set cached data in localStorage
 */
const setCachedData = (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
};

/**
 * Check if cached data is stale (older than TTL)
 */
const isCacheStale = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TTL_MS;
};

// ============================================================================
// DATA MAPPERS
// ============================================================================

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
  inventoryCount: warehouse.inventoryCount || 0,
  utilizationPercent: warehouse.utilizationPercent || 0,
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

  /**
   * Get warehouse summary stats (for list page KPIs)
   * This method always fetches fresh data from the server
   */
  async getSummary() {
    try {
      const response = await apiClient.get(`${this.endpoint}/summary`);
      const summary = {
        totalWarehouses: response?.totalWarehouses || 0,
        activeWarehouses: response?.activeWarehouses || 0,
        totalInventoryItems: response?.totalInventoryItems || 0,
        totalStockValue: response?.totalStockValue || 0,
        lowStockItems: response?.lowStockItems || 0,
      };

      // Update cache with fresh data
      setCachedData(CACHE_KEYS.SUMMARY, summary);

      return summary;
    } catch (error) {
      // Fallback to calculating from list if summary endpoint not available
      console.warn('Summary endpoint not available, calculating from list');
      const result = await this.getAll();
      const warehouses = result.data || [];
      const summary = {
        totalWarehouses: warehouses.length,
        activeWarehouses: warehouses.filter(w => w.isActive).length,
        totalInventoryItems: warehouses.reduce((sum, w) => sum + (w.inventoryCount || 0), 0),
        totalStockValue: 0,
        lowStockItems: 0,
      };

      // Update cache with calculated data
      setCachedData(CACHE_KEYS.SUMMARY, summary);

      return summary;
    }
  }

  /**
   * Get cached summary data (if available)
   * Used for instant display on page load
   * @returns {Object|null} - Cached summary data or null
   */
  getCachedSummary() {
    const cached = getCachedData(CACHE_KEYS.SUMMARY);
    return cached?.data || null;
  }

  /**
   * Check if summary cache is stale
   * @returns {boolean}
   */
  isSummaryCacheStale() {
    const cached = getCachedData(CACHE_KEYS.SUMMARY);
    return isCacheStale(cached?.timestamp);
  }

  /**
   * Clear summary cache (useful after mutations)
   */
  clearSummaryCache() {
    try {
      localStorage.removeItem(CACHE_KEYS.SUMMARY);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get warehouse dashboard data
   */
  async getDashboard(warehouseId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${warehouseId}/dashboard`);
      return response;
    } catch (error) {
      // Return mock data if endpoint not available
      console.warn('Dashboard endpoint not available');
      return {
        totalQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        totalValue: 0,
        productCount: 0,
        lowStockCount: 0,
        utilizationPercent: 0,
        recentActivities: [],
        lowStockAlerts: [],
      };
    }
  }

  /**
   * Get warehouse stock (products in warehouse)
   */
  async getStock(warehouseId, filters = {}) {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 50,
        search: filters.search,
        product_type: filters.productType,
        low_stock_only: filters.lowStockOnly,
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await apiClient.get(`${this.endpoint}/${warehouseId}/stock`, params);
      return {
        data: response?.items || response?.data || [],
        pagination: response?.pageInfo || response?.pagination || {},
        summary: response?.summary || {},
      };
    } catch (error) {
      console.warn('Stock endpoint not available');
      return {
        data: [],
        pagination: {},
        summary: {},
      };
    }
  }

  /**
   * Get warehouse analytics
   */
  async getAnalytics(warehouseId, filters = {}) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${warehouseId}/analytics`, {
        period: filters.period || 'MONTHLY',
        start_date: filters.startDate,
        end_date: filters.endDate,
      });
      return response;
    } catch (error) {
      console.warn('Analytics endpoint not available');
      return {
        inboundTrend: [],
        outboundTrend: [],
        topInboundProducts: [],
        topOutboundProducts: [],
        utilizationHistory: [],
      };
    }
  }
}

export const warehouseService = new WarehouseService();
