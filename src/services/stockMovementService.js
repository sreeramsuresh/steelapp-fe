import { apiClient } from "./api.js";

/**
 * Stock Movement Service
 * Phase 2: Core CRUD + Queries
 *
 * Provides frontend API for stock movement operations
 * All data is automatically converted to/from camelCase by the API gateway
 */

// Movement Types
export const MOVEMENT_TYPES = {
  IN: { value: "IN", label: "Stock In", color: "green" },
  OUT: { value: "OUT", label: "Stock Out", color: "red" },
  TRANSFER_OUT: {
    value: "TRANSFER_OUT",
    label: "Transfer Out",
    color: "orange",
  },
  TRANSFER_IN: { value: "TRANSFER_IN", label: "Transfer In", color: "blue" },
  ADJUSTMENT: { value: "ADJUSTMENT", label: "Adjustment", color: "purple" },
  RESERVATION: { value: "RESERVATION", label: "Reserved", color: "yellow" },
  RELEASE: { value: "RELEASE", label: "Released", color: "teal" },
};

// Reference Types
export const REFERENCE_TYPES = {
  INVOICE: { value: "INVOICE", label: "Invoice" },
  PURCHASE_ORDER: { value: "PURCHASE_ORDER", label: "Purchase Order" },
  TRANSFER: { value: "TRANSFER", label: "Transfer" },
  ADJUSTMENT: { value: "ADJUSTMENT", label: "Adjustment" },
  RETURN: { value: "RETURN", label: "Return" },
  CREDIT_NOTE: { value: "CREDIT_NOTE", label: "Credit Note" },
  INITIAL: { value: "INITIAL", label: "Initial Stock" },
};

/**
 * Map server response to UI model (camelCase)
 * Note: API Gateway handles conversion, but we ensure consistency here
 */
const fromServer = (movement = {}) => ({
  id: movement.id,
  companyId: movement.companyId || movement.company_id,
  productId: movement.productId || movement.product_id,
  productName: movement.productName || movement.product_name || "",
  productUniqueName: movement.productUniqueName || movement.product_unique_name || movement.productName || movement.product_name || "",
  productDisplayName: movement.productDisplayName || movement.product_display_name || movement.productName || movement.product_name || "",
  productSku: movement.productSku || movement.product_sku || "",
  productType: movement.productType || movement.product_type || "",
  warehouseId: movement.warehouseId || movement.warehouse_id,
  warehouseName: movement.warehouseName || movement.warehouse_name || "",
  warehouseCode: movement.warehouseCode || movement.warehouse_code || "",
  movementType: movement.movementType || movement.movement_type || "",
  quantity: parseFloat(movement.quantity) || 0,
  unit: movement.unit || "KG",
  referenceType: movement.referenceType || movement.reference_type || "",
  referenceNumber: movement.referenceNumber || movement.reference_number || "",
  referenceId: movement.referenceId || movement.reference_id || null,
  destinationWarehouseId: movement.destinationWarehouseId || movement.destination_warehouse_id || null,
  destinationWarehouseName: movement.destinationWarehouseName || movement.destination_warehouse_name || "",
  transferId: movement.transferId || movement.transfer_id || null,
  reservationId: movement.reservationId || movement.reservation_id || null,
  notes: movement.notes || "",
  balanceAfter: parseFloat(movement.balanceAfter || movement.balance_after) || 0,
  unitCost: parseFloat(movement.unitCost || movement.unit_cost) || 0,
  totalCost: parseFloat(movement.totalCost || movement.total_cost) || 0,
  batchNumber: movement.batchNumber || movement.batch_number || "",
  coilNumber: movement.coilNumber || movement.coil_number || "",
  heatNumber: movement.heatNumber || movement.heat_number || "",
  createdBy: movement.createdBy || movement.created_by,
  createdByName: movement.createdByName || movement.created_by_name || "",
  movementDate: movement.movementDate || movement.movement_date,
  createdAt: movement.createdAt || movement.created_at,
  updatedAt: movement.updatedAt || movement.updated_at,
});

/**
 * Map UI model to server payload (snake_case)
 * Note: API Gateway handles conversion, but we ensure consistency here
 */
const toServer = (movement = {}) => ({
  product_id: movement.productId,
  warehouse_id: movement.warehouseId,
  movement_type: movement.movementType,
  quantity: movement.quantity?.toString(),
  unit: movement.unit || "KG",
  reference_type: movement.referenceType,
  reference_number: movement.referenceNumber,
  reference_id: movement.referenceId,
  notes: movement.notes,
  destination_warehouse_id: movement.destinationWarehouseId,
  movement_date: movement.movementDate,
  unit_cost: movement.unitCost?.toString(),
  batch_number: movement.batchNumber,
  coil_number: movement.coilNumber,
  heat_number: movement.heatNumber,
});

/**
 * Map stock level to UI model
 */
const stockLevelFromServer = (level = {}) => ({
  id: level.id,
  productId: level.productId,
  productName: level.productName || "",
  productSku: level.productSku || "",
  productType: level.productType || "",
  warehouseId: level.warehouseId,
  warehouseName: level.warehouseName || "",
  warehouseCode: level.warehouseCode || "",
  quantityOnHand: parseFloat(level.quantityOnHand) || 0,
  quantityReserved: parseFloat(level.quantityReserved) || 0,
  quantityAvailable: parseFloat(level.quantityAvailable) || 0,
  minimumStock: parseFloat(level.minimumStock) || 0,
  maximumStock: parseFloat(level.maximumStock) || 0,
  unit: level.unit || "KG",
  unitCost: parseFloat(level.unitCost) || 0,
  totalValue: parseFloat(level.totalValue) || 0,
  isLowStock: level.isLowStock || false,
  isOutOfStock: level.isOutOfStock || false,
  lastMovementDate: level.lastMovementDate || "",
  lastMovementType: level.lastMovementType || "",
});

class StockMovementService {
  constructor() {
    this.endpoint = "/stock-movements";
  }

  // ============================================
  // CRUD Operations
  // ============================================

  /**
   * Get all stock movements with filters and pagination
   * @param {Object} filters - Filter parameters
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.limit - Items per page (default: 20)
   * @param {number} filters.warehouseId - Filter by warehouse
   * @param {number} filters.productId - Filter by product
   * @param {string} filters.movementType - Filter by movement type
   * @param {string} filters.referenceType - Filter by reference type
   * @param {string} filters.dateFrom - Filter by start date
   * @param {string} filters.dateTo - Filter by end date
   * @param {string} filters.search - Search in reference_number and notes
   */
  async getAll(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      warehouse_id: filters.warehouseId,
      product_id: filters.productId,
      movement_type: filters.movementType,
      reference_type: filters.referenceType,
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      search: filters.search,
    };

    // Remove undefined params
    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(this.endpoint, params);
    return {
      data: (response.data || []).map(fromServer),
      pagination: response.pagination || {},
    };
  }

  /**
   * Get a single stock movement by ID
   */
  async getById(id) {
    const response = await apiClient.get(`${this.endpoint}/${id}`);
    return fromServer(response);
  }

  /**
   * Create a new stock movement
   * @param {Object} movementData - Movement data
   */
  async create(movementData) {
    const payload = toServer(movementData);
    const response = await apiClient.post(this.endpoint, payload);
    return fromServer(response);
  }

  /**
   * Update a stock movement (only notes can be updated)
   */
  async update(id, movementData) {
    const payload = { notes: movementData.notes };
    const response = await apiClient.put(`${this.endpoint}/${id}`, payload);
    return fromServer(response);
  }

  /**
   * Delete a stock movement (not recommended - use reversal instead)
   */
  async delete(id) {
    const response = await apiClient.delete(`${this.endpoint}/${id}`);
    return response;
  }

  // ============================================
  // Query Operations
  // ============================================

  /**
   * Get movements for a specific product
   * @param {number} productId - Product ID
   * @param {Object} filters - Optional filters
   */
  async getByProduct(productId, filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      warehouse_id: filters.warehouseId,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/by-product/${productId}`, params);
    return {
      data: (response.data || []).map(fromServer),
      pagination: response.pagination || {},
    };
  }

  /**
   * Get movements for a specific warehouse
   * @param {number} warehouseId - Warehouse ID
   * @param {Object} filters - Optional filters
   */
  async getByWarehouse(warehouseId, filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      movement_type: filters.movementType,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/by-warehouse/${warehouseId}`, params);
    return {
      data: (response.data || []).map(fromServer),
      pagination: response.pagination || {},
    };
  }

  /**
   * Get movements within a date range
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @param {Object} filters - Optional filters
   */
  async getByDateRange(startDate, endDate, filters = {}) {
    const params = {
      start_date: startDate,
      end_date: endDate,
      page: filters.page || 1,
      limit: filters.limit || 50,
      warehouse_id: filters.warehouseId,
      product_id: filters.productId,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/by-date-range`, params);
    return {
      data: (response.data || []).map(fromServer),
      pagination: response.pagination || {},
    };
  }

  /**
   * Get movements by reference (invoice, PO, etc.)
   * @param {string} type - Reference type (INVOICE, PURCHASE_ORDER, etc.)
   * @param {number|string} idOrNumber - Reference ID or reference number
   */
  async getByReference(type, idOrNumber) {
    let response;
    if (typeof idOrNumber === "number") {
      response = await apiClient.get(`${this.endpoint}/by-reference/${type}/${idOrNumber}`);
    } else {
      response = await apiClient.get(`${this.endpoint}/by-reference`, {
        reference_type: type,
        reference_number: idOrNumber,
      });
    }
    return {
      data: (response.data || []).map(fromServer),
    };
  }

  /**
   * Get movements by invoice number (legacy)
   */
  async getByInvoice(invoiceNo) {
    const response = await apiClient.get(`${this.endpoint}/by-invoice/${invoiceNo}`);
    return {
      data: (response.data || []).map(fromServer),
    };
  }

  /**
   * Get current stock for a product (optionally by warehouse)
   * @param {number} productId - Product ID (optional if using product attributes)
   * @param {number} warehouseId - Warehouse ID (optional)
   * @param {Object} productFilters - Product attribute filters
   */
  async getCurrentStock(productId = null, warehouseId = null, productFilters = {}) {
    const params = {
      product_id: productId,
      warehouse_id: warehouseId,
      productType: productFilters.productType,
      grade: productFilters.grade,
      size: productFilters.size,
      thickness: productFilters.thickness,
      finish: productFilters.finish,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/current-stock`, params);

    return {
      productId: response.productId,
      productName: response.productName || "",
      productSku: response.productSku || "",
      warehouses: (response.warehouses || []).map((w) => ({
        warehouseId: w.warehouseId,
        warehouseName: w.warehouseName || "",
        warehouseCode: w.warehouseCode || "",
        quantityOnHand: parseFloat(w.quantityOnHand) || 0,
        quantityReserved: parseFloat(w.quantityReserved) || 0,
        quantityAvailable: parseFloat(w.quantityAvailable) || 0,
        unit: w.unit || "KG",
        lastMovementDate: w.lastMovementDate || "",
      })),
      totalQuantity: parseFloat(response.totalQuantity) || 0,
      totalReserved: parseFloat(response.totalReserved) || 0,
      totalAvailable: parseFloat(response.totalAvailable) || 0,
      unit: response.unit || "KG",
    };
  }

  /**
   * Get stock levels with pagination and summary
   * @param {Object} filters - Filter parameters
   */
  async getStockLevels(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      warehouse_id: filters.warehouseId,
      low_stock_only: filters.lowStockOnly,
      include_zero: filters.includeZero,
      search: filters.search,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/stock-levels`, params);

    return {
      data: (response.data || []).map(stockLevelFromServer),
      pagination: response.pagination || {},
      summary: response.summary
        ? {
            totalProducts: response.summary.totalProducts || 0,
            lowStockCount: response.summary.lowStockCount || 0,
            outOfStockCount: response.summary.outOfStockCount || 0,
            totalValue: parseFloat(response.summary.totalValue) || 0,
            totalQuantity: parseFloat(response.summary.totalQuantity) || 0,
          }
        : null,
    };
  }

  // ============================================
  // Legacy Methods (for backward compatibility)
  // ============================================

  /**
   * @deprecated Use getAll() instead
   */
  async getAllMovements(filters = {}) {
    return this.getAll(filters);
  }

  /**
   * @deprecated Use getById() instead
   */
  async getMovementById(id) {
    return this.getById(id);
  }

  /**
   * @deprecated Use create() instead
   */
  async createMovement(movementData) {
    return this.create(movementData);
  }

  /**
   * @deprecated Use update() instead
   */
  async updateMovement(id, movementData) {
    return this.update(id, movementData);
  }

  /**
   * @deprecated Use delete() instead
   */
  async deleteMovement(id) {
    return this.delete(id);
  }

  /**
   * Get movements by product attributes (legacy)
   */
  async getMovementsByProduct(productType, grade, size, thickness) {
    const params = { productType, grade, size, thickness };
    Object.keys(params).forEach((key) => !params[key] && delete params[key]);
    const response = await apiClient.get(`${this.endpoint}/by-product`, params);
    return { data: (response.data || []).map(fromServer) };
  }

  /**
   * Get movements by date range (legacy)
   */
  async getMovementsByDateRange(startDate, endDate) {
    return this.getByDateRange(startDate, endDate);
  }

  /**
   * Get movements by invoice (legacy)
   */
  async getMovementsByInvoice(invoiceNo) {
    return this.getByInvoice(invoiceNo);
  }

  // ============================================
  // Special Operations
  // ============================================

  /**
   * Create stock adjustment
   */
  async createAdjustment(adjustmentData) {
    const payload = {
      product_id: adjustmentData.productId,
      warehouse_id: adjustmentData.warehouseId,
      quantity: adjustmentData.quantity?.toString(),
      reason: adjustmentData.reason,
      reference_number: adjustmentData.referenceNumber,
      notes: adjustmentData.notes,
    };

    const response = await apiClient.post(`${this.endpoint}/adjustment`, payload);
    return fromServer(response);
  }

  /**
   * Create movements from invoice (Phase 3)
   */
  async createFromInvoice(invoiceId, warehouseId) {
    const payload = {
      invoice_id: invoiceId,
      warehouse_id: warehouseId,
    };

    const response = await apiClient.post(`${this.endpoint}/from-invoice`, payload);
    return {
      success: response.success,
      movements: (response.movements || []).map(fromServer),
      totalCreated: response.totalCreated || 0,
      errors: response.errors || [],
    };
  }

  /**
   * Create movements from purchase order
   * @param {number} purchaseOrderId - Purchase Order ID
   * @param {number} warehouseId - Destination warehouse ID (optional)
   * @param {Array} items - Items to receive (optional: partial receiving)
   *   Each item: { itemId, productId, receivedQuantity }
   * @param {string} notes - Optional notes
   */
  async createFromPurchaseOrder(purchaseOrderId, warehouseId = null, items = null, notes = "") {
    const payload = {
      purchase_order_id: purchaseOrderId,
      warehouse_id: warehouseId,
      items: items
        ? items.map((item) => ({
            item_id: item.itemId || item.item_id,
            product_id: item.productId || item.product_id,
            received_quantity: item.receivedQuantity || item.received_quantity || item.quantity,
          }))
        : [],
      notes,
    };

    const response = await apiClient.post(`${this.endpoint}/from-purchase-order`, payload);
    return {
      success: response.success,
      movements: (response.movements || []).map(fromServer),
      totalCreated: response.totalCreated || 0,
      newStockStatus: response.newStockStatus || null,
      errors: response.errors || [],
    };
  }

  /**
   * Get movements for a purchase order
   * @param {number} poId - Purchase Order ID
   */
  async getByPurchaseOrder(poId) {
    const response = await apiClient.get(`${this.endpoint}/by-po/${poId}`);
    return {
      data: (response.data || []).map(fromServer),
    };
  }

  /**
   * Reverse invoice movements (Phase 3)
   */
  async reverseInvoiceMovements(invoiceId, reason, creditNoteId = null) {
    const payload = {
      invoice_id: invoiceId,
      reason,
      credit_note_id: creditNoteId,
    };

    const response = await apiClient.post(`${this.endpoint}/reverse-invoice`, payload);
    return {
      success: response.success,
      movements: (response.movements || []).map(fromServer),
      totalCreated: response.totalCreated || 0,
      errors: response.errors || [],
    };
  }

  // ============================================
  // Transfer Operations (Phase 5)
  // ============================================

  /**
   * List transfers with filters and pagination
   */
  async listTransfers(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      source_warehouse_id: filters.sourceWarehouseId,
      destination_warehouse_id: filters.destinationWarehouseId,
      status: filters.status,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/transfers`, params);
    return {
      data: (response.data || []).map(this.mapTransferFromServer),
      pagination: response.pagination || {},
    };
  }

  /**
   * Get a single transfer by ID
   */
  async getTransfer(id) {
    const response = await apiClient.get(`${this.endpoint}/transfers/${id}`);
    return this.mapTransferFromServer(response);
  }

  /**
   * Create a new inter-warehouse transfer
   */
  async createTransfer(transferData) {
    const payload = {
      source_warehouse_id: transferData.sourceWarehouseId,
      destination_warehouse_id: transferData.destinationWarehouseId,
      items: (transferData.items || []).map((item) => ({
        product_id: item.productId,
        quantity: item.quantity?.toString(),
        unit: item.unit || "KG",
        batch_number: item.batchNumber,
        notes: item.notes,
      })),
      notes: transferData.notes,
      expected_date: transferData.expectedDate,
    };

    const response = await apiClient.post(`${this.endpoint}/transfers`, payload);
    return this.mapTransferFromServer(response);
  }

  /**
   * Ship a transfer
   */
  async shipTransfer(id, shipData = {}) {
    const payload = {
      shipped_date: shipData.shippedDate,
      tracking_number: shipData.trackingNumber,
      carrier: shipData.carrier,
      notes: shipData.notes,
    };

    const response = await apiClient.post(`${this.endpoint}/transfers/${id}/ship`, payload);
    return this.mapTransferFromServer(response);
  }

  /**
   * Receive a transfer
   */
  async receiveTransfer(id, receiveData = {}) {
    const payload = {
      received_date: receiveData.receivedDate,
      received_items: (receiveData.receivedItems || []).map((item) => ({
        item_id: item.itemId,
        quantity_received: item.quantityReceived?.toString(),
        condition_notes: item.conditionNotes,
      })),
      notes: receiveData.notes,
    };

    const response = await apiClient.post(`${this.endpoint}/transfers/${id}/receive`, payload);
    return this.mapTransferFromServer(response);
  }

  /**
   * Cancel a transfer
   */
  async cancelTransfer(id) {
    const response = await apiClient.post(`${this.endpoint}/transfers/${id}/cancel`, {});
    return this.mapTransferFromServer(response);
  }

  /**
   * Map transfer from server to UI model
   */
  mapTransferFromServer(transfer = {}) {
    return {
      id: transfer.id,
      companyId: transfer.companyId,
      transferNumber: transfer.transferNumber || "",
      sourceWarehouseId: transfer.sourceWarehouseId,
      sourceWarehouseName: transfer.sourceWarehouseName || "",
      destinationWarehouseId: transfer.destinationWarehouseId,
      destinationWarehouseName: transfer.destinationWarehouseName || "",
      status: transfer.status || "DRAFT",
      items: (transfer.items || []).map((item) => ({
        id: item.id,
        transferId: item.transferId,
        productId: item.productId,
        productName: item.productName || "",
        productSku: item.productSku || "",
        quantityRequested: parseFloat(item.quantityRequested) || 0,
        quantityShipped: parseFloat(item.quantityShipped) || 0,
        quantityReceived: parseFloat(item.quantityReceived) || 0,
        unit: item.unit || "KG",
        batchNumber: item.batchNumber || "",
        notes: item.notes || "",
        conditionNotes: item.conditionNotes || "",
      })),
      notes: transfer.notes || "",
      expectedDate: transfer.expectedDate || "",
      shippedDate: transfer.shippedDate || "",
      receivedDate: transfer.receivedDate || "",
      trackingNumber: transfer.trackingNumber || "",
      carrier: transfer.carrier || "",
      createdBy: transfer.createdBy,
      createdByName: transfer.createdByName || "",
      shippedBy: transfer.shippedBy,
      shippedByName: transfer.shippedByName || "",
      receivedBy: transfer.receivedBy,
      receivedByName: transfer.receivedByName || "",
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }

  // ============================================
  // Reservation Operations (Phase 6)
  // ============================================

  /**
   * List reservations with filters and pagination
   */
  async listReservations(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      warehouse_id: filters.warehouseId,
      product_id: filters.productId,
      status: filters.status,
      include_expired: filters.includeExpired,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/reservations`, params);
    return {
      data: (response.data || []).map(this.mapReservationFromServer),
      pagination: response.pagination || {},
    };
  }

  /**
   * Get a single reservation by ID
   */
  async getReservation(id) {
    const response = await apiClient.get(`${this.endpoint}/reservations/${id}`);
    return this.mapReservationFromServer(response);
  }

  /**
   * Create a new stock reservation
   */
  async createReservation(reservationData) {
    const payload = {
      product_id: reservationData.productId,
      warehouse_id: reservationData.warehouseId,
      quantity: reservationData.quantity?.toString(),
      reference_type: reservationData.referenceType,
      reference_id: reservationData.referenceId,
      expiry_date: reservationData.expiryDate,
      notes: reservationData.notes,
    };

    const response = await apiClient.post(`${this.endpoint}/reservations`, payload);
    return this.mapReservationFromServer(response);
  }

  /**
   * Fulfill a reservation (partial or full)
   */
  async fulfillReservation(id, fulfillData) {
    const payload = {
      quantity: fulfillData.quantity?.toString(),
      fulfillment_reference_id: fulfillData.fulfillmentReferenceId,
      fulfillment_reference_type: fulfillData.fulfillmentReferenceType,
    };

    const response = await apiClient.post(`${this.endpoint}/reservations/${id}/fulfill`, payload);
    return this.mapReservationFromServer(response);
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(id, reason = "") {
    const response = await apiClient.post(`${this.endpoint}/reservations/${id}/cancel`, { reason });
    return this.mapReservationFromServer(response);
  }

  /**
   * Map reservation from server to UI model
   */
  mapReservationFromServer(reservation = {}) {
    return {
      id: reservation.id,
      companyId: reservation.companyId,
      reservationNumber: reservation.reservationNumber || "",
      productId: reservation.productId,
      productName: reservation.productName || "",
      productSku: reservation.productSku || "",
      warehouseId: reservation.warehouseId,
      warehouseName: reservation.warehouseName || "",
      quantityReserved: parseFloat(reservation.quantityReserved) || 0,
      quantityFulfilled: parseFloat(reservation.quantityFulfilled) || 0,
      quantityRemaining: parseFloat(reservation.quantityRemaining) || 0,
      unit: reservation.unit || "KG",
      status: reservation.status || "ACTIVE",
      referenceType: reservation.referenceType || "",
      referenceId: reservation.referenceId,
      referenceNumber: reservation.referenceNumber || "",
      expiryDate: reservation.expiryDate,
      notes: reservation.notes || "",
      createdBy: reservation.createdBy,
      createdByName: reservation.createdByName || "",
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }

  // ============================================
  // Reconciliation Operations (Phase 7)
  // ============================================

  /**
   * Get reconciliation report for a warehouse
   */
  async getReconciliationReport(warehouseId, asOfDate = null) {
    const params = {};
    if (asOfDate) params.as_of_date = asOfDate;

    const response = await apiClient.get(`${this.endpoint}/reconciliation/${warehouseId}`, params);
    return {
      warehouseId: response.warehouseId || response.warehouse_id,
      warehouseName: response.warehouseName || response.warehouse_name || "",
      asOfDate: response.asOfDate || response.as_of_date || "",
      items: (response.items || []).map((item) => ({
        productId: item.productId || item.product_id,
        productName: item.productName || item.product_name || "",
        productSku: item.productSku || item.product_sku || "",
        systemQuantity: parseFloat(item.systemQuantity || item.system_quantity) || 0,
        lastPhysicalCount: parseFloat(item.lastPhysicalCount || item.last_physical_count) || 0,
        discrepancy: parseFloat(item.discrepancy) || 0,
        lastCountDate: item.lastCountDate || item.last_count_date || "",
      })),
      totalSystemValue: parseFloat(response.totalSystemValue || response.total_system_value) || 0,
      discrepancyCount: parseInt(response.discrepancyCount || response.discrepancy_count) || 0,
    };
  }

  /**
   * Get audit trail for stock movements
   */
  async getAuditTrail(filters = {}) {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 50,
      product_id: filters.productId,
      warehouse_id: filters.warehouseId,
      start_date: filters.startDate,
      end_date: filters.endDate,
    };

    Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

    const response = await apiClient.get(`${this.endpoint}/audit-trail`, params);
    return {
      entries: (response.entries || []).map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        action: entry.action || "",
        userId: entry.userId || entry.user_id,
        userName: entry.userName || entry.user_name || "",
        productId: entry.productId || entry.product_id,
        productName: entry.productName || entry.product_name || "",
        warehouseId: entry.warehouseId || entry.warehouse_id,
        warehouseName: entry.warehouseName || entry.warehouse_name || "",
        quantityChange: parseFloat(entry.quantityChange || entry.quantity_change) || 0,
        balanceBefore: parseFloat(entry.balanceBefore || entry.balance_before) || 0,
        balanceAfter: parseFloat(entry.balanceAfter || entry.balance_after) || 0,
        referenceType: entry.referenceType || entry.reference_type || "",
        referenceNumber: entry.referenceNumber || entry.reference_number || "",
        notes: entry.notes || "",
      })),
      pagination: response.pagination || {},
    };
  }
}

// Transfer status constants
export const TRANSFER_STATUSES = {
  DRAFT: { value: "DRAFT", label: "Draft", color: "default" },
  PENDING: { value: "PENDING", label: "Pending", color: "info" },
  SHIPPED: { value: "SHIPPED", label: "Shipped", color: "warning" },
  IN_TRANSIT: { value: "IN_TRANSIT", label: "In Transit", color: "primary" },
  RECEIVED: { value: "RECEIVED", label: "Received", color: "success" },
  CANCELLED: { value: "CANCELLED", label: "Cancelled", color: "error" },
};

// Reservation status constants
export const RESERVATION_STATUSES = {
  ACTIVE: { value: "ACTIVE", label: "Active", color: "primary" },
  PARTIALLY_FULFILLED: {
    value: "PARTIALLY_FULFILLED",
    label: "Partial",
    color: "warning",
  },
  FULFILLED: { value: "FULFILLED", label: "Fulfilled", color: "success" },
  EXPIRED: { value: "EXPIRED", label: "Expired", color: "default" },
  CANCELLED: { value: "CANCELLED", label: "Cancelled", color: "error" },
};

// gRPC error code mapping for user-friendly messages
export const GRPC_ERROR_CODES = {
  FAILED_PRECONDITION: "Insufficient stock available",
  INVALID_ARGUMENT: "Invalid input data",
  NOT_FOUND: "Record not found",
  PERMISSION_DENIED: "Access denied",
  ALREADY_EXISTS: "Record already exists",
  RESOURCE_EXHAUSTED: "Resource limit exceeded",
  UNAVAILABLE: "Service temporarily unavailable",
};

/**
 * Parse gRPC error from API response
 * @param {Error} error - Error object from API call
 * @returns {{ code: string, message: string, isGrpcError: boolean }}
 */
export const parseGrpcError = (error) => {
  const responseData = error?.response?.data;
  const message = responseData?.message || error?.message || "An error occurred";

  // Check for gRPC error codes in message or response
  let code = responseData?.code || "";
  let isGrpcError = false;

  // Extract gRPC status code if present in message
  if (message.includes("Insufficient stock")) {
    code = "FAILED_PRECONDITION";
    isGrpcError = true;
  } else if (message.includes("not found")) {
    code = "NOT_FOUND";
    isGrpcError = true;
  } else if (message.includes("required") || message.includes("invalid")) {
    code = "INVALID_ARGUMENT";
    isGrpcError = true;
  }

  const userMessage = GRPC_ERROR_CODES[code] || message;

  return {
    code,
    message: userMessage,
    originalMessage: message,
    isGrpcError,
  };
};

export const stockMovementService = new StockMovementService();
