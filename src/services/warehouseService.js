import { apiClient } from "./api.js";

/**
 * Warehouse Service
 * Provides frontend API for warehouse operations
 */

// ============================================================================
// DATA MAPPERS
// ============================================================================

// Map server response to UI model (camelCase)
const fromServer = (warehouse = {}) => ({
  id: warehouse.id,
  companyId: warehouse.companyId || warehouse.company_id,
  name: warehouse.name || "",
  code: warehouse.code || "",
  description: warehouse.description || "",
  address: warehouse.address || "",
  city: warehouse.city || "",
  state: warehouse.state || "",
  country: warehouse.country || "",
  postalCode: warehouse.postalCode || warehouse.postal_code || "",
  phone: warehouse.phone || "",
  email: warehouse.email || "",
  contactPerson: warehouse.contactPerson || warehouse.contact_person || "",
  isDefault:
    (warehouse.isDefault !== undefined ? warehouse.isDefault : warehouse.is_default) !== undefined
      ? warehouse.isDefault || warehouse.is_default
      : false,
  isActive: warehouse.isActive !== undefined ? warehouse.isActive !== false : warehouse.is_active !== false,
  type: warehouse.type || "WAREHOUSE",
  capacity: parseFloat(warehouse.capacity) || 0,
  capacityUnit: warehouse.capacityUnit || warehouse.capacity_unit || "MT",
  inventoryCount: warehouse.inventoryCount || warehouse.inventory_count || 0,
  utilizationPercent: warehouse.utilizationPercent || warehouse.utilization_percent || 0,
  createdAt: warehouse.createdAt || warehouse.created_at,
  updatedAt: warehouse.updatedAt || warehouse.updated_at,
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
    this.endpoint = "/warehouses";
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
    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

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
   * SYNC: Uses inventory health endpoint for low stock data to match products/dashboard module
   */
  async getSummary() {
    try {
      const response = await apiClient.get(`${this.endpoint}/summary`);
      const summary = {
        totalWarehouses: response?.totalWarehouses || 0,
        activeWarehouses: response?.activeWarehouses || 0,
        totalInventoryItems: response?.totalInventoryItems || 0,
        totalStockValue: response?.totalStockValue || 0,
        // Ensure lowStockItems is a number (not null/undefined)
        lowStockItems: response?.lowStockItems ?? 0,
      };

      return summary;
    } catch (_error) {
      // Fallback: Fetch from inventory health endpoint for data synchronization
      try {
        const inventoryHealth = await apiClient.get("/dashboard/inventory-health");
        const result = await this.getAll();
        const warehouses = result.data || [];
        const summary = {
          totalWarehouses: warehouses.length,
          activeWarehouses: warehouses.filter((w) => w.isActive).length,
          totalInventoryItems: warehouses.reduce((sum, w) => sum + (w.inventoryCount || 0), 0),
          totalStockValue: 0,
          // Use lowStockCount from inventory health (same source as products/dashboard)
          // Fallback ensures consistency even if inventory health endpoint is missing data
          lowStockItems:
            typeof inventoryHealth?.summary?.lowStockCount === "number" ? inventoryHealth.summary.lowStockCount : 0,
        };
        // Log if low stock count looks inconsistent
        if (process.env.NODE_ENV === "development" && inventoryHealth?.summary?.lowStockCount === undefined) {
          console.warn("Low stock count undefined from inventory health endpoint - using 0");
        }
        return summary;
      } catch (fallbackError) {
        // Final fallback
        console.warn("Unable to fetch warehouse summary:", fallbackError);
        return {
          totalWarehouses: 0,
          activeWarehouses: 0,
          totalInventoryItems: 0,
          totalStockValue: 0,
          lowStockItems: 0,
        };
      }
    }
  }

  /**
   * Get warehouse dashboard data
   */
  async getDashboard(warehouseId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${warehouseId}/dashboard`);
      return response;
    } catch (_error) {
      // Return mock data if endpoint not available
      console.warn("Dashboard endpoint not available");
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
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await apiClient.get(`${this.endpoint}/${warehouseId}/stock`, params);
      return {
        data: response?.items || response?.data || [],
        pagination: response?.pageInfo || response?.pagination || {},
        summary: response?.summary || {},
      };
    } catch (_error) {
      console.warn("Stock endpoint not available");
      return {
        data: [],
        pagination: {},
        summary: {},
      };
    }
  }

  /**
   * Clear summary cache (no-op - getSummary always fetches fresh data)
   * Kept for API compatibility with components that call this method
   */
  clearSummaryCache() {
    // No caching implemented - getSummary always fetches fresh
    // This is a no-op to prevent "function not found" errors
  }

  /**
   * Get warehouse analytics
   */
  async getAnalytics(warehouseId, filters = {}) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${warehouseId}/analytics`, {
        period: filters.period || "MONTHLY",
        start_date: filters.startDate,
        end_date: filters.endDate,
      });
      return response;
    } catch (_error) {
      console.warn("Analytics endpoint not available");
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
