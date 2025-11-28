import { apiClient } from './api';

// ============================================================================
// CACHE UTILITIES (Stale-While-Revalidate Pattern)
// ============================================================================

const CACHE_KEYS = {
  SUMMARY: 'invoice_summary_cache',
};

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes - consider data stale after this

/**
 * Get cached data from localStorage
 * @returns {Object|null} - { data, timestamp } or null if not found
 */
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    // Return data even if stale - caller decides what to do
    return parsed;
  } catch (error) {
    console.warn('Invoice cache read error:', error);
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
    console.warn('Invoice cache write error:', error);
  }
};

/**
 * Check if cached data is stale (older than TTL)
 */
const isCacheStale = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TTL_MS;
};

/**
 * Clear invoice summary cache
 * Call this after invoice create/update/delete/payment operations
 */
const clearSummaryCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.SUMMARY);
  } catch (error) {
    console.warn('Invoice cache clear error:', error);
  }
};

// ============================================================================
// EXPORTED CACHE UTILITIES
// ============================================================================

export const invoiceCacheUtils = {
  CACHE_KEYS,
  getCachedData,
  setCachedData,
  isCacheStale,
  clearSummaryCache,
};

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
    discount_type: invoiceData.discountType || 'amount',
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
    warehouse_name: invoiceData.warehouseName || '',
    warehouse_code: invoiceData.warehouseCode || '',
    warehouse_city: invoiceData.warehouseCity || '',
    subtotal: invoiceData.subtotal,
    vat_amount: invoiceData.vatAmount,
    total: invoiceData.total,
    status: invoiceData.status || 'draft',
    notes: invoiceData.notes,
    terms: invoiceData.terms,
    // UAE VAT Compliance Fields
    place_of_supply: invoiceData.placeOfSupply || null,
    supply_date: invoiceData.supplyDate || null,
    is_reverse_charge: invoiceData.isReverseCharge || false,
    reverse_charge_amount: invoiceData.reverseChargeAmount || 0,
    exchange_rate_date: invoiceData.exchangeRateDate || null,
    items: invoiceData.items?.map(item => ({
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
    })) || [],
  };
};

// Backend returns camelCase (after API conversion) - map to form field names
const transformInvoiceFromServer = (serverData) => {
  return {
    ...serverData,
    // Date field mapping: invoiceDate -> date (legacy alias used by form)
    date: serverData.invoiceDate || serverData.date || null,
    // Ensure customer_details is parsed if it's a string
    customer: typeof serverData.customerDetails === 'string'
      ? JSON.parse(serverData.customerDetails)
      : serverData.customerDetails || serverData.customer || {},
    // Payment mode mapping
    modeOfPayment: serverData.modeOfPayment || serverData.mode_of_payment || null,
    // Warehouse mapping
    warehouseId: serverData.warehouseId || serverData.warehouse_id || null,
    warehouseName: serverData.warehouseName || serverData.warehouse_name || '',
    // Ensure numeric fields are numbers
    received: serverData.received !== undefined ? Number(serverData.received) : 0,
    outstanding: serverData.outstanding !== undefined ? Number(serverData.outstanding) : 0,
    subtotal: serverData.subtotal !== undefined ? Number(serverData.subtotal) : 0,
    vatAmount: serverData.vatAmount !== undefined ? Number(serverData.vatAmount) : 0,
    total: serverData.total !== undefined ? Number(serverData.total) : 0,
    // Ensure items is an array
    items: Array.isArray(serverData.items) ? serverData.items : [],
    // UAE VAT Compliance Fields
    placeOfSupply: serverData.placeOfSupply || serverData.place_of_supply || '',
    supplyDate: serverData.supplyDate || serverData.supply_date || '',
    isReverseCharge: serverData.isReverseCharge || serverData.is_reverse_charge || false,
    reverseChargeAmount: serverData.reverseChargeAmount !== undefined ? Number(serverData.reverseChargeAmount) : (serverData.reverse_charge_amount !== undefined ? Number(serverData.reverse_charge_amount) : 0),
    exchangeRateDate: serverData.exchangeRateDate || serverData.exchange_rate_date || '',
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

    const response = await apiClient.get('/invoices', axiosConfig);

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
      invoices: Array.isArray(invoices)
        ? invoices.map(transformInvoiceFromServer)
        : [],
      pagination: null,
    };
  },

  async getInvoice(id) {
    const response = await apiClient.get(`/invoices/${id}`);
    return transformInvoiceFromServer(response);
  },

  async createInvoice(invoiceData) {
    // DEBUG: Log incoming status before transformation
    console.log('[invoiceService.createInvoice] Incoming invoiceData.status:', invoiceData.status);

    const transformedData = transformInvoiceForServer(invoiceData);

    // DEBUG: Log status after transformation
    console.log('[invoiceService.createInvoice] After transform - transformedData.status:', transformedData.status);

    const response = await apiClient.post('/invoices', transformedData);
    // Clear cache after creating invoice
    clearSummaryCache();
    return transformInvoiceFromServer(response);
  },

  async updateInvoice(id, invoiceData) {
    const transformedData = transformInvoiceForServer(invoiceData);
    const response = await apiClient.put(`/invoices/${id}`, transformedData);
    // Clear cache after updating invoice
    clearSummaryCache();
    return transformInvoiceFromServer(response);
  },

  async deleteInvoice(id, deletionData = {}) {
    // Soft delete with reason for audit trail
    // Axios DELETE requires data to be wrapped in config.data
    const response = await apiClient.delete(`/invoices/${id}`, { data: deletionData });
    // Clear cache after deleting invoice
    clearSummaryCache();
    return response;
  },

  async restoreInvoice(id) {
    // Restore soft-deleted invoice
    const response = await apiClient.patch(`/invoices/${id}/restore`, {});
    // Clear cache after restoring invoice
    clearSummaryCache();
    return response;
  },

  async updateInvoiceStatus(id, status) {
    const response = await apiClient.patch(`/invoices/${id}/status`, { status });
    // Clear cache after status change
    clearSummaryCache();
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
    // Clear cache after issuing invoice
    clearSummaryCache();
    return transformInvoiceFromServer(response);
  },

  async getNextInvoiceNumber() {
    return apiClient.get('/invoices/number/next');
  },

  async getInvoiceAnalytics(params = {}) {
    return apiClient.get('/invoices/analytics', params);
  },

  async searchInvoices(searchTerm, filters = {}) {
    return apiClient.get('/invoices', {
      search: searchTerm,
      ...filters,
    });
  },

  async searchForCreditNote(query) {
    // Fast autocomplete search for invoices eligible for credit notes
    const response = await apiClient.get('/invoices/search-for-credit-note', { q: query });
    return response;
  },

  async getInvoicesByCustomer(customerId) {
    return apiClient.get('/invoices', { customer_id: customerId });
  },

  async getInvoicesByDateRange(startDate, endDate) {
    return apiClient.get('/invoices', {
      start_date: startDate,
      end_date: endDate,
    });
  },

  async getInvoicesByStatus(status) {
    return apiClient.get('/invoices', { status });
  },

  async addInvoicePayment(id, payload) {
    // payload: { payment_date, amount, method, reference_no, notes, attachment_url }
    const response = await apiClient.post(`/invoices/${id}/payments`, payload);
    // Clear cache after recording payment
    clearSummaryCache();
    return response;
  },

  async addInvoicePaymentsBatch(id, payload) {
    // payload: { payments: [{ payment_date, amount, method, reference_no, notes }], idempotency_key? }
    const response = await apiClient.post(`/invoices/${id}/payments/batch`, payload);
    // Clear cache after batch payment
    clearSummaryCache();
    return response;
  },

  async voidInvoicePayment(invoiceId, paymentId, reason) {
    const response = await apiClient.post(`/invoices/${invoiceId}/payments/${paymentId}/void`, { reason });
    // Clear cache after voiding payment
    clearSummaryCache();
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
    return response.data || response || [];
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
    return apiClient.post('/stock-movements/from-invoice', payload);
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
  async reverseStockMovements(invoiceId, reason = 'Invoice cancelled', creditNoteId = null) {
    const payload = {
      invoice_id: invoiceId,
      reason,
    };
    if (creditNoteId) {
      payload.credit_note_id = creditNoteId;
    }
    return apiClient.post('/stock-movements/reverse-invoice', payload);
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
