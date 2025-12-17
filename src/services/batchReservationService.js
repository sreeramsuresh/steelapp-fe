import { apiClient } from './api';

/**
 * Batch Reservation Service
 *
 * Frontend API service for managing temporary batch reservations during invoice creation.
 * Phase 1 of the Stock-Out Workflow redesign.
 *
 * Features:
 * - FIFO allocation (auto-select oldest batches)
 * - Manual allocation (user-selected batches)
 * - Real-time availability with reservation awareness
 * - 30-minute expiry with extend capability
 * - Cleanup on cancel/unmount
 */
export const batchReservationService = {
  /**
   * Reserve batches using FIFO (First In First Out) selection
   * Automatically selects from oldest available batches
   *
   * @param {Object} params - Reservation parameters
   * @param {number} params.draftInvoiceId - Draft invoice ID (optional for new drafts)
   * @param {number} params.productId - Product ID (required)
   * @param {number} params.warehouseId - Warehouse ID (required)
   * @param {number|string} params.requiredQuantity - Quantity to reserve (required)
   * @param {string} params.unit - Unit of measure (default: 'KG')
   * @param {string} params.lineItemTempId - UUID for the line item (required)
   * @returns {Promise<Object>} Reservation response with allocations
   */
  async reserveFIFO(params) {
    const response = await apiClient.post('/batch-reservations/fifo', {
      draft_invoice_id: params.draftInvoiceId || 0,
      product_id: params.productId,
      warehouse_id: params.warehouseId,
      required_quantity: params.requiredQuantity,
      unit: params.unit || 'KG',
      line_item_temp_id: params.lineItemTempId,
    });
    return response;
  },

  /**
   * Reserve specific batches selected by user
   *
   * @param {Object} params - Reservation parameters
   * @param {number} params.draftInvoiceId - Draft invoice ID (optional for new drafts)
   * @param {number} params.productId - Product ID (required)
   * @param {number} params.warehouseId - Warehouse ID (required)
   * @param {string} params.lineItemTempId - UUID for the line item (required)
   * @param {Array} params.allocations - Array of {batchId, quantity}
   * @returns {Promise<Object>} Reservation response with allocations
   */
  async reserveManual(params) {
    const response = await apiClient.post('/batch-reservations/manual', {
      draft_invoice_id: params.draftInvoiceId || 0,
      product_id: params.productId,
      warehouse_id: params.warehouseId,
      line_item_temp_id: params.lineItemTempId,
      allocations: params.allocations,
    });
    return response;
  },

  /**
   * Get available batches for a product/warehouse with real-time availability
   * Shows quantity available considering other users' reservations
   *
   * @param {Object} params - Query parameters
   * @param {number} params.productId - Product ID (required)
   * @param {number} params.warehouseId - Warehouse ID (required)
   * @param {number} params.draftInvoiceId - Draft invoice ID (shows user's own reservations as available)
   * @returns {Promise<Object>} Available batches and user's own reservations
   */
  async getAvailableBatches(params) {
    const queryParams = {
      product_id: params.productId,
      warehouse_id: params.warehouseId,
    };

    if (params.draftInvoiceId) {
      queryParams.draft_invoice_id = params.draftInvoiceId;
    }

    const response = await apiClient.get(
      '/batch-reservations/available',
      queryParams,
    );
    return response;
  },

  /**
   * Get all reservations for a draft invoice
   *
   * @param {number} draftInvoiceId - Draft invoice ID
   * @param {string} lineItemTempId - Optional: filter by specific line item
   * @returns {Promise<Object>} Draft reservations with totals
   */
  async getDraftReservations(draftInvoiceId, lineItemTempId = null) {
    const queryParams = lineItemTempId ? { line_item_temp_id: lineItemTempId } : {};
    const response = await apiClient.get(
      `/batch-reservations/draft/${draftInvoiceId}`,
      queryParams,
    );
    return response;
  },

  /**
   * Cancel a specific reservation
   *
   * @param {number} reservationId - Reservation ID to cancel
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelReservation(reservationId) {
    const response = await apiClient.delete(
      `/batch-reservations/${reservationId}`,
    );
    return response;
  },

  /**
   * Cancel all reservations for a specific line item
   *
   * @param {Object} params - Cancellation parameters
   * @param {number} params.draftInvoiceId - Draft invoice ID
   * @param {string} params.lineItemTempId - Line item temp ID to cancel
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelLineItemReservations(params) {
    const response = await apiClient.delete('/batch-reservations/line-item', {
      data: {
        draft_invoice_id: params.draftInvoiceId || 0,
        line_item_temp_id: params.lineItemTempId,
      },
    });
    return response;
  },

  /**
   * Cancel all reservations for an entire draft invoice
   *
   * @param {number} draftInvoiceId - Draft invoice ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelDraftReservations(draftInvoiceId) {
    const response = await apiClient.delete(
      `/batch-reservations/draft/${draftInvoiceId}`,
    );
    return response;
  },

  /**
   * Extend reservation expiry time
   *
   * @param {Object} params - Extension parameters
   * @param {number} params.draftInvoiceId - Draft invoice ID
   * @param {string} params.lineItemTempId - Optional: extend specific line item only
   * @param {number} params.extendMinutes - Minutes to extend (default: 30)
   * @returns {Promise<Object>} Updated reservation response
   */
  async extendReservation(params) {
    const response = await apiClient.post('/batch-reservations/extend', {
      draft_invoice_id: params.draftInvoiceId || 0,
      line_item_temp_id: params.lineItemTempId || '',
      extend_minutes: params.extendMinutes || 30,
    });
    return response;
  },

  /**
   * Convert draft reservations to invoice_batch_consumption records
   * Called when invoice is saved/finalized
   *
   * @param {Object} params - Conversion parameters
   * @param {number} params.invoiceId - The finalized invoice ID
   * @param {Array} params.lineItemMappings - Array of {lineItemTempId, invoiceItemId}
   * @returns {Promise<Object>} Conversion result
   */
  async convertReservations(params) {
    const response = await apiClient.post('/batch-reservations/convert', {
      invoice_id: params.invoiceId,
      line_item_mappings: params.lineItemMappings,
    });
    return response;
  },

  /**
   * Finalize invoice with batch allocations (Phase 4 - Complete Save Flow)
   *
   * This is the atomic operation that:
   * 1. Validates all reservations are still valid and not expired
   * 2. Updates invoice status (to ISSUED or PROFORMA)
   * 3. Generates invoice number if needed
   * 4. Converts draft_batch_reservations to invoice_batch_consumption
   * 5. Decrements stock_batches.quantity_remaining (actual stock deduction)
   * 6. Releases stock_batches.quantity_reserved (reservation held during draft)
   * 7. Creates stock_movements records for audit trail
   *
   * @param {Object} params - Finalization parameters
   * @param {number} params.draftInvoiceId - The draft invoice ID to finalize
   * @param {Array} params.lineItemMappings - Array of {lineItemTempId, invoiceItemId}
   * @param {string} params.targetStatus - Target status: "issued" or "proforma" (default: "issued")
   * @param {boolean} params.skipStockDeduction - If true, skip stock deduction (for drop-ship only invoices)
   * @returns {Promise<Object>} Finalization result with invoice number and deduction details
   */
  async finalizeInvoice(params) {
    const response = await apiClient.post('/batch-reservations/finalize', {
      draft_invoice_id: params.draftInvoiceId,
      line_item_mappings: params.lineItemMappings,
      target_status: params.targetStatus || 'issued',
      skip_stock_deduction: params.skipStockDeduction || false,
    });
    return response;
  },
};

export default batchReservationService;
