import { normalizeUom } from "../utils/fieldAccessors";
import { apiClient } from "./api.js";

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

const transformInvoiceForServer = (invoiceData) => {
  return {
    invoice_number: invoiceData.invoiceNumber,
    customer_id: invoiceData.customer?.id || null,
    customer_details: invoiceData.customer,
    invoice_date: invoiceData.date,
    due_date: invoiceData.dueDate,
    // Invoice-level discount (for backend recomputation)
    discount_type: invoiceData.discountType || "amount",
    discount_percentage: invoiceData.discountPercentage || 0,
    discount_amount: invoiceData.discountAmount || 0,
    // Charges
    packing_charges: invoiceData.packingCharges || 0,
    freight_charges: invoiceData.freightCharges || 0,
    insurance_charges: invoiceData.insuranceCharges || 0,
    loading_charges: invoiceData.loadingCharges || 0,
    other_charges: invoiceData.otherCharges || 0,
    mode_of_payment: invoiceData.modeOfPayment || null,
    cheque_number: invoiceData.chequeNumber || null,
    // Warehouse data
    warehouse_id: invoiceData.warehouseId || null,
    warehouse_name: invoiceData.warehouseName || "",
    warehouse_code: invoiceData.warehouseCode || "",
    warehouse_city: invoiceData.warehouseCity || "",
    subtotal: invoiceData.subtotal,
    vat_amount: invoiceData.vatAmount,
    total: invoiceData.total,
    status: invoiceData.status || "draft",
    notes: invoiceData.notes,
    terms: invoiceData.terms,
    // UAE VAT Compliance Fields
    place_of_supply: invoiceData.placeOfSupply || null,
    supply_date: invoiceData.supplyDate || null,
    is_reverse_charge: invoiceData.isReverseCharge || false,
    reverse_charge_amount: invoiceData.reverseChargeAmount || 0,
    exchange_rate_date: invoiceData.exchangeRateDate || null,
    items:
      invoiceData.items?.map((item) => ({
        product_id: item.productId || null,
        name: item.name,
        finish: item.finish,
        size: item.size,
        thickness: item.thickness,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        vat_rate: item.vatRate,
        amount: item.amount,
        // Source type and warehouse for batch allocation
        source_type: item.source_type || item.sourceType || "WAREHOUSE",
        warehouse_id: item.warehouse_id || item.warehouseId || null,
        // Batch allocation mode
        allocation_mode: item.allocation_mode || item.allocationMode || "AUTO_FIFO",
        manual_allocations: item.manual_allocations || item.manualAllocations || [],
        // Pricing & Commercial Fields
        pricing_basis: item.pricing_basis || item.pricingBasis || "PER_MT",
        unit_weight_kg: item.unit_weight_kg || item.unitWeightKg || null,
        theoretical_weight_kg: item.theoretical_weight_kg || item.theoreticalWeightKg || null,
        // Phase 2: UOM tracking for audit trail
        quantity_uom: normalizeUom(item),
        // Phase 4: Line item temp ID for linking to draft_batch_reservations
        line_item_temp_id: item.line_item_temp_id || item.lineItemTempId || null,
      })) || [],
  };
};

// Backend returns camelCase (after API conversion) - map to form field names
const transformInvoiceFromServer = (serverData) => {
  return {
    ...serverData,

    // ========================================
    // Date Fields - Proto has snake_case, API Gateway converts to camelCase
    // ========================================
    // proto: invoice_date (line 250) → API: invoiceDate → frontend: date (legacy alias)
    date: serverData.date || serverData.invoiceDate || null,

    // proto: supply_date (line 357) → API: supplyDate
    supplyDate: serverData.supplyDate || serverData.supply_date || "",

    // proto: exchange_rate_date (line 360) → API: exchangeRateDate
    exchangeRateDate: serverData.exchangeRateDate || serverData.exchange_rate_date || "",

    // proto: expires_at (line 437) → API: expiresAt - Batch reservation expiration
    expiresAt: serverData.expiresAt || serverData.expires_at || null,

    // ========================================
    // Customer/Reference Fields
    // ========================================
    // proto: customer_details (line 247) → API: customerDetails → frontend: customer
    customer:
      typeof serverData.customerDetails === "string"
        ? JSON.parse(serverData.customerDetails)
        : serverData.customerDetails || serverData.customer || {},

    // proto: mode_of_payment (line 257) → API: modeOfPayment
    modeOfPayment: serverData.modeOfPayment || serverData.mode_of_payment || null,

    // ========================================
    // Warehouse Fields - FRONTEND-ONLY (NOT in Invoice proto)
    // These are computed/aggregated from items array, not in proto
    // ========================================
    warehouseId: serverData.warehouseId || serverData.warehouse_id || null,
    warehouseName: serverData.warehouseName || serverData.warehouse_name || "",

    // ========================================
    // Financial Fields - Proto has these, API Gateway converts to camelCase
    // ========================================
    // proto: received (line 289) → API: received - Already correct
    received: serverData.received !== undefined ? Number(serverData.received) : 0,

    // proto: outstanding (line 290) → API: outstanding - Already correct
    outstanding: serverData.outstanding !== undefined ? Number(serverData.outstanding) : 0,

    // proto: subtotal (line 267) → API: subtotal - Already correct
    subtotal: serverData.subtotal !== undefined ? Number(serverData.subtotal) : 0,

    // proto: vat_amount (line 268) → API: vatAmount
    vatAmount: serverData.vatAmount !== undefined ? Number(serverData.vatAmount) : 0,

    // proto: total (line 269) → API: total - Already correct
    total: serverData.total !== undefined ? Number(serverData.total) : 0,

    // ========================================
    // Items Array
    // ========================================
    // proto: items (line 332) → API: items - InvoiceItemResponse[] - Already correct
    items: Array.isArray(serverData.items) ? serverData.items : [],

    // ========================================
    // UAE VAT Compliance Fields
    // ========================================
    // proto: place_of_supply (line 356) → API: placeOfSupply
    placeOfSupply: serverData.placeOfSupply || serverData.place_of_supply || "",

    // proto: is_reverse_charge (line 358) → API: isReverseCharge
    isReverseCharge: serverData.isReverseCharge || serverData.is_reverse_charge || false,

    // proto: reverse_charge_amount (line 359) → API: reverseChargeAmount
    reverseChargeAmount:
      serverData.reverseChargeAmount !== undefined
        ? Number(serverData.reverseChargeAmount)
        : serverData.reverse_charge_amount !== undefined
          ? Number(serverData.reverse_charge_amount)
          : 0,
  };
};

export const invoiceService = {
  async getInvoices(params = {}, signal = null) {
    // Separate signal from params and create proper axios config
    const axiosConfig = {
      params,
    };

    // Add abort signal if provided
    if (signal) {
      axiosConfig.signal = signal;
    }

    const response = await apiClient.get("/invoices", axiosConfig);

    // Handle paginated response
    if (response.invoices && response.pagination) {
      return {
        invoices: response.invoices.map(transformInvoiceFromServer),
        pagination: response.pagination,
      };
    }

    // Handle non-paginated response (for backward compatibility)
    const invoices = response.invoices || response;
    return {
      invoices: Array.isArray(invoices) ? invoices.map(transformInvoiceFromServer) : [],
      pagination: null,
    };
  },

  async getInvoice(id) {
    const response = await apiClient.get(`/invoices/${id}`);
    return transformInvoiceFromServer(response);
  },

  async createInvoice(invoiceData) {
    const transformedData = transformInvoiceForServer(invoiceData);

    const response = await apiClient.post("/invoices", transformedData);
    return transformInvoiceFromServer(response);
  },

  async updateInvoice(id, invoiceData) {
    const transformedData = transformInvoiceForServer(invoiceData);
    const response = await apiClient.put(`/invoices/${id}`, transformedData);
    return transformInvoiceFromServer(response);
  },

  async deleteInvoice(id, deletionData = {}) {
    // Soft delete with reason for audit trail
    // Axios DELETE requires data to be wrapped in config.data
    const response = await apiClient.delete(`/invoices/${id}`, {
      data: deletionData,
    });
    return response;
  },

  async restoreInvoice(id) {
    // Restore soft-deleted invoice
    const response = await apiClient.patch(`/invoices/${id}/restore`, {});
    return response;
  },

  async updateInvoiceStatus(id, status) {
    const response = await apiClient.patch(`/invoices/${id}/status`, {
      status,
    });
    return response;
  },

  /**
   * Issue Final Tax Invoice - locks invoice permanently
   *
   * UAE VAT COMPLIANCE (Rules 3, 4, 8):
   * - Once issued, invoice becomes a legal tax document
   * - Cannot be modified after issuing
   * - Corrections must be made via Credit Note
   * - This action is IRREVERSIBLE
   *
   * @param {number} invoiceId - ID of invoice to issue
   * @returns {Promise<Object>} Issued invoice with isLocked flag
   */
  async issueInvoice(invoiceId) {
    const response = await apiClient.post(`/invoices/${invoiceId}/issue`);
    return transformInvoiceFromServer(response);
  },

  /**
   * Confirm pending batch allocation for an invoice
   * Finalizes batch reservations after user confirms allocation
   *
   * @param {number} invoiceId - ID of invoice to confirm
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmInvoiceAllocation(invoiceId) {
    const response = await apiClient.post(`/invoices/${invoiceId}/confirm-allocation`);
    return response;
  },

  /**
   * Release pending batch reservation for an invoice
   * Allows user to edit invoice and re-allocate batches
   *
   * @param {number} invoiceId - ID of invoice to release
   * @returns {Promise<Object>} Release result
   */
  async releaseInvoiceReservation(invoiceId) {
    const response = await apiClient.post(`/invoices/${invoiceId}/release-reservation`);
    return response;
  },

  async getNextInvoiceNumber() {
    return apiClient.get("/invoices/number/next");
  },

  async getInvoiceAnalytics(params = {}) {
    return apiClient.get("/invoices/analytics", params);
  },

  async searchInvoices(searchTerm, filters = {}) {
    return apiClient.get("/invoices", {
      search: searchTerm,
      ...filters,
    });
  },

  async searchForCreditNote(query) {
    // Fast autocomplete search for invoices eligible for credit notes
    const response = await apiClient.get("/invoices/search-for-credit-note", {
      q: query,
    });
    return response;
  },

  async getInvoicesByCustomer(customerId) {
    return apiClient.get("/invoices", { customer_id: customerId });
  },

  async getInvoicesByDateRange(startDate, endDate) {
    return apiClient.get("/invoices", {
      start_date: startDate,
      end_date: endDate,
    });
  },

  async getInvoicesByStatus(status) {
    return apiClient.get("/invoices", { status });
  },

  async addInvoicePayment(id, payload) {
    // payload: { payment_date, amount, method, reference_no, notes, attachment_url }
    const response = await apiClient.post(`/invoices/${id}/payments`, payload);
    return response;
  },

  async addInvoicePaymentsBatch(id, payload) {
    // payload: { payments: [{ payment_date, amount, method, reference_no, notes }], idempotency_key? }
    const response = await apiClient.post(`/invoices/${id}/payments/batch`, payload);
    return response;
  },

  async voidInvoicePayment(invoiceId, paymentId, reason) {
    const response = await apiClient.post(`/invoices/${invoiceId}/payments/${paymentId}/void`, { reason });
    return response;
  },

  // ============================================
  // Stock Movement Integration (Phase 3)
  // ============================================

  /**
   * Get stock movements linked to an invoice
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<Array>} Array of stock movements (OUT for deductions, IN for returns)
   */
  async getInvoiceStockMovements(invoiceId) {
    const response = await apiClient.get(`/stock-movements/by-reference/INVOICE/${invoiceId}`);
    // Response format: { data: [...movements] }
    return response || [];
  },

  /**
   * Create stock movements for an invoice (deduct inventory)
   * Called when issuing an invoice manually triggers stock deduction
   *
   * @param {number} invoiceId - Invoice ID
   * @param {number} warehouseId - Optional: Source warehouse (uses default if not specified)
   * @returns {Promise<Object>} Response with created movements
   */
  async createStockMovements(invoiceId, warehouseId = null) {
    const payload = { invoice_id: invoiceId };
    if (warehouseId) {
      payload.warehouse_id = warehouseId;
    }
    return apiClient.post("/stock-movements/from-invoice", payload);
  },

  /**
   * Reverse stock movements for an invoice (return inventory)
   * Called when cancelling an invoice or creating a credit note
   *
   * @param {number} invoiceId - Invoice ID
   * @param {string} reason - Reason for reversal
   * @param {number} creditNoteId - Optional: Link to credit note if applicable
   * @returns {Promise<Object>} Response with created reversal movements
   */
  async reverseStockMovements(invoiceId, reason = "Invoice cancelled", creditNoteId = null) {
    const payload = {
      invoice_id: invoiceId,
      reason,
    };
    if (creditNoteId) {
      payload.credit_note_id = creditNoteId;
    }
    return apiClient.post("/stock-movements/reverse-invoice", payload);
  },

  /**
   * Check if invoice has stock movements
   * @param {number} invoiceId - Invoice ID
   * @returns {Promise<boolean>} True if movements exist
   */
  async hasStockMovements(invoiceId) {
    const movements = await this.getInvoiceStockMovements(invoiceId);
    return movements.length > 0;
  },
};
