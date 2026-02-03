import { apiClient } from "./api.js";

/**
 * Allocation Service
 *
 * API service for managing FIFO batch allocations for invoice line items.
 * Handles fetching available batches and triggering FIFO allocation on the backend.
 */

export const allocationService = {
  /**
   * Get available stock batches for a product in a warehouse
   * Company ID is automatically added by backend from authenticated user context
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} Array of available batches with FIFO ordering
   */
  async getAvailableBatches(productId, warehouseId, _params = {}) {
    const queryParams = {
      productId,
      warehouseId,
      hasStock: true, // Only batches with remaining stock
    };

    const response = await apiClient.get("/stock-batches/available", queryParams);
    return response?.data || response;
  },

  /**
   * Allocate stock using FIFO logic (backend-computed)
   * Company ID is automatically added by backend from authenticated user context
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {number} quantity - Quantity to allocate
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Allocation result with batch allocations
   */
  async allocateFIFO(productId, warehouseId, quantity, _params = {}) {
    const payload = {
      productId,
      warehouseId,
      quantity,
    };

    const response = await apiClient.post("/allocations/fifo", payload);
    return response?.data || response;
  },

  /**
   * Preview FIFO allocation without committing
   * Company ID is automatically added by backend from authenticated user context
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {number} quantity - Quantity to allocate
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Preview of what batches would be allocated
   */
  async previewFIFO(productId, warehouseId, quantity, _params = {}) {
    const queryParams = {
      productId,
      warehouseId,
      quantity,
    };

    const response = await apiClient.get("/allocations/fifo/preview", queryParams);
    return response?.data || response;
  },
};

export default allocationService;
