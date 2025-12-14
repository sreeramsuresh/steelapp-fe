import { apiClient } from './api';

/**
 * Stock Batch Service
 *
 * API service for managing stock batches with procurement channel tracking.
 * Supports the v2 procurement system where procurement channel (LOCAL/IMPORTED)
 * lives at the BATCH level, not the product level.
 */

export const stockBatchService = {
  /**
   * List stock batches with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.companyId - Company ID (required)
   * @param {number} params.productId - Filter by product
   * @param {string} params.procurementChannel - Filter by channel: LOCAL or IMPORTED
   * @param {number} params.warehouseId - Filter by warehouse
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {boolean} params.hasStock - Filter to only batches with remaining stock
   * @param {boolean} params.activeOnly - Filter to only active batches (status = active)
   */
  async getBatches(params = {}) {
    const queryParams = {
      companyId: params.companyId,
      page: params.page || 1,
      limit: params.limit || 20,
    };

    if (params.productId) queryParams.productId = params.productId;
    if (params.procurementChannel)
      queryParams.procurementChannel = params.procurementChannel;
    if (params.warehouseId) queryParams.warehouseId = params.warehouseId;
    if (params.hasStock !== undefined) queryParams.hasStock = params.hasStock;
    if (params.activeOnly !== undefined) queryParams.activeOnly = params.activeOnly;

    return apiClient.get('/stock-batches', queryParams);
  },

  /**
   * Get batches for a specific product
   * @param {number} productId - Product ID
   * @param {Object} params - Additional query parameters
   * @param {number} params.companyId - Company ID (required)
   * @param {string} params.procurementChannel - Filter by channel: LOCAL or IMPORTED
   */
  async getBatchesByProduct(productId, params = {}) {
    const queryParams = {
      companyId: params.companyId,
    };

    if (params.procurementChannel)
      queryParams.procurementChannel = params.procurementChannel;
    if (params.hasStock !== undefined) queryParams.hasStock = params.hasStock;

    return apiClient.get(`/stock-batches/product/${productId}`, queryParams);
  },

  /**
   * Get procurement summary for a product
   * Returns aggregated stock quantities by procurement channel
   * @param {number} productId - Product ID
   * @param {Object} params - Query parameters
   * @param {number} params.companyId - Company ID (required)
   * @returns {Promise<{localQty: number, importedQty: number, totalQty: number}>}
   */
  async getProcurementSummary(productId, params = {}) {
    const queryParams = {
      companyId: params.companyId,
    };

    return apiClient.get(
      `/stock-batches/product/${productId}/summary`,
      queryParams,
    );
  },

  /**
   * Get a single batch by ID
   * @param {number} id - Batch ID
   */
  async getBatch(id) {
    return apiClient.get(`/stock-batches/${id}`);
  },

  /**
   * Create a new stock batch
   * @param {Object} data - Batch data
   * @param {number} data.productId - Product ID
   * @param {number} data.companyId - Company ID
   * @param {string} data.procurementChannel - LOCAL or IMPORTED
   * @param {number} data.quantityReceived - Initial quantity
   * @param {number} data.unitCost - Cost per unit (FOB for imports)
   * @param {number} data.landedCostPerUnit - Total landed cost per unit (for imports)
   * @param {number} data.importContainerId - Optional container reference for imports
   * @param {number} data.purchaseOrderId - Optional PO reference
   * @param {string} data.countryOfOrigin - Country code for imports
   * @param {string} data.millName - Mill/manufacturer name for imports
   */
  async createBatch(data) {
    return apiClient.post('/stock-batches', data);
  },

  /**
   * Update a stock batch
   * @param {number} id - Batch ID
   * @param {Object} data - Updated batch data
   */
  async updateBatch(id, data) {
    return apiClient.put(`/stock-batches/${id}`, data);
  },

  /**
   * Adjust batch quantity (for stock movements)
   * @param {number} id - Batch ID
   * @param {Object} data - Adjustment data
   * @param {number} data.quantityChange - Positive for additions, negative for deductions
   * @param {string} data.reason - Reason for adjustment
   * @param {string} data.referenceType - Type of reference (invoice, grn, adjustment, etc.)
   * @param {number} data.referenceId - ID of the reference document
   */
  async adjustQuantity(id, data) {
    return apiClient.post(`/stock-batches/${id}/adjust`, data);
  },

  /**
   * Get batch history/movements
   * @param {number} id - Batch ID
   */
  async getBatchHistory(id) {
    return apiClient.get(`/stock-batches/${id}/history`);
  },
};

export default stockBatchService;
