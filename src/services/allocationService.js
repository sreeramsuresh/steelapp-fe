import { apiClient } from "./api";

/**
 * Allocation Service
 *
 * API service for managing FIFO batch allocations for invoice line items.
 * Handles fetching available batches and triggering FIFO allocation on the backend.
 */

export const allocationService = {
  /**
   * Get available stock batches for a product in a warehouse
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {Object} params - Additional query parameters
   * @param {number} params.companyId - Company ID (required)
   * @returns {Promise<Array>} Array of available batches with FIFO ordering
   */
  async getAvailableBatches(productId, warehouseId, params = {}) {
    const queryParams = {
      productId,
      warehouseId,
      companyId: params.companyId,
      hasStock: true, // Only batches with remaining stock
    };

    const response = await apiClient.get(
      "/stock-batches/available",
      queryParams,
    );
    return response.data || response;
  },

  /**
   * Allocate stock using FIFO logic (backend-computed)
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {number} quantity - Quantity to allocate
   * @param {Object} params - Additional parameters
   * @param {number} params.companyId - Company ID (required)
   * @returns {Promise<Object>} Allocation result with batch allocations
   */
  async allocateFIFO(productId, warehouseId, quantity, params = {}) {
    const payload = {
      productId,
      warehouseId,
      quantity,
      companyId: params.companyId,
    };

    const response = await apiClient.post("/allocations/fifo", payload);
    return response.data || response;
  },

  /**
   * Preview FIFO allocation without committing
   * @param {number} productId - Product ID
   * @param {number} warehouseId - Warehouse ID
   * @param {number} quantity - Quantity to allocate
   * @param {Object} params - Additional parameters
   * @param {number} params.companyId - Company ID (required)
   * @returns {Promise<Object>} Preview of what batches would be allocated
   */
  async previewFIFO(productId, warehouseId, quantity, params = {}) {
    const queryParams = {
      productId,
      warehouseId,
      quantity,
      companyId: params.companyId,
    };

    const response = await apiClient.get(
      "/allocations/fifo/preview",
      queryParams,
    );
    return response.data || response;
  },
};

export default allocationService;
