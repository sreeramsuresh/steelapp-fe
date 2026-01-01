/**
 * Advance Payment Service - UAE VAT Compliance
 *
 * Handles advance payments (customer deposits) with VAT implications.
 * UAE VAT requires VAT to be accounted for when advance payment is received,
 * not when goods/services are delivered.
 *
 * Key VAT Rules:
 * - VAT is due on advance payments at the time of receipt
 * - Must track VAT already paid on advances when invoicing
 * - Prevents double taxation when invoice is raised
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from './api';

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform advance payment data for server submission
 */
const transformAdvancePaymentForServer = (paymentData) => {
  return {
    customerId: paymentData.customerId || paymentData.customer?.id || null,
    customerDetails:
      paymentData.customerDetails || paymentData.customer || null,
    receiptNumber: paymentData.receiptNumber || '',
    paymentDate: paymentData.paymentDate || null,
    // Amount fields
    amount: parseFloat(paymentData.amount || 0),
    vatRate: parseFloat(paymentData.vatRate || 5),
    vatAmount: parseFloat(paymentData.vatAmount || 0),
    totalAmount: parseFloat(paymentData.totalAmount || 0),
    // VAT tracking
    vatCategory: paymentData.vatCategory || 'STANDARD',
    isVatInclusive: paymentData.isVatInclusive !== false, // Default true
    // Application tracking
    amountApplied: parseFloat(paymentData.amountApplied || 0),
    amountAvailable: parseFloat(paymentData.amountAvailable || 0),
    // Payment details
    paymentMethod: paymentData.paymentMethod || 'bank_transfer',
    referenceNumber: paymentData.referenceNumber || '',
    bankAccount: paymentData.bankAccount || '',
    // Status
    status: paymentData.status || 'received',
    // Metadata
    purpose: paymentData.purpose || '',
    notes: paymentData.notes || '',
    attachmentUrls: paymentData.attachmentUrls || [],
    // Related entities
    quotationId: paymentData.quotationId || null,
    salesOrderId: paymentData.salesOrderId || null,
    projectId: paymentData.projectId || null,
  };
};

/**
 * Transform advance payment data from server response
 * Note: API Gateway uses keepCase: true, so fields come in snake_case
 */
const transformAdvancePaymentFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.company_id || serverData.companyId,
    customerId: serverData.customer_id || serverData.customerId,
    customerDetails:
      serverData.customer_details || serverData.customerDetails || {},
    customerName:
      serverData.customer_name ||
      serverData.customerName ||
      serverData.customer_details?.name ||
      serverData.customerDetails?.name ||
      '',
    customerTrn:
      serverData.customer_trn ||
      serverData.customerTrn ||
      serverData.customer_details?.trn ||
      serverData.customerDetails?.trn ||
      '',
    receiptNumber:
      serverData.receipt_number ||
      serverData.receiptNumber ||
      serverData.advance_number ||
      serverData.advanceNumber ||
      '',
    // payment_date comes as proto Timestamp { seconds, nanos }
    paymentDate: serverData.payment_date || serverData.paymentDate || null,
    // Amount fields
    amount: parseFloat(serverData.amount || 0),
    vatRate: parseFloat(serverData.vat_rate || serverData.vatRate || 5),
    vatAmount: parseFloat(serverData.vat_amount || serverData.vatAmount || 0),
    totalAmount: parseFloat(
      serverData.total_amount ||
        serverData.totalAmount ||
        serverData.total_received ||
        serverData.totalReceived ||
        0,
    ),
    // VAT tracking
    vatCategory:
      serverData.vat_category || serverData.vatCategory || 'STANDARD',
    isVatInclusive:
      (serverData.is_vat_inclusive ?? serverData.isVatInclusive) !== false,
    // Application tracking
    amountApplied: parseFloat(
      serverData.amount_applied || serverData.amountApplied || 0,
    ),
    amountAvailable: parseFloat(
      serverData.amount_available || serverData.amountAvailable || 0,
    ),
    amountRefunded: parseFloat(
      serverData.amount_refunded || serverData.amountRefunded || 0,
    ),
    // Payment details
    paymentMethod:
      serverData.payment_method || serverData.paymentMethod || 'bank_transfer',
    referenceNumber:
      serverData.reference_number ||
      serverData.referenceNumber ||
      serverData.payment_reference ||
      serverData.paymentReference ||
      '',
    bankAccount: serverData.bank_account || serverData.bankAccount || '',
    // Status
    status: serverData.status || 'received',
    // Metadata
    purpose: serverData.purpose || '',
    notes: serverData.notes || '',
    attachmentUrls:
      serverData.attachment_urls || serverData.attachmentUrls || [],
    // Related entities
    quotationId: serverData.quotation_id || serverData.quotationId || null,
    salesOrderId: serverData.sales_order_id || serverData.salesOrderId || null,
    projectId: serverData.project_id || serverData.projectId || null,
    // Applications (invoices this advance was applied to)
    applications: (serverData.applications || []).map((app) => ({
      id: app.id,
      invoiceId: app.invoice_id || app.invoiceId,
      invoiceNumber: app.invoice_number || app.invoiceNumber || '',
      amountApplied: parseFloat(app.amount_applied || app.amountApplied || 0),
      vatAmountApplied: parseFloat(
        app.vat_amount_applied || app.vatAmountApplied || 0,
      ),
      appliedAt:
        app.applied_at || app.appliedAt || app.created_at || app.createdAt,
      notes: app.notes || '',
    })),
    // Refunds
    refunds: serverData.refunds || [],
    // Timestamps - Proto sends nested audit.created_at/updated_at
    createdAt:
      serverData.created_at ||
      serverData.createdAt ||
      serverData.audit?.created_at ||
      serverData.audit?.createdAt ||
      null,
    updatedAt:
      serverData.updated_at ||
      serverData.updatedAt ||
      serverData.audit?.updated_at ||
      serverData.audit?.updatedAt ||
      null,
    receivedBy:
      serverData.received_by ||
      serverData.receivedBy ||
      serverData.audit?.created_by ||
      serverData.audit?.createdBy ||
      null,
  };
};

// ============================================================================
// ADVANCE PAYMENT SERVICE
// ============================================================================

const advancePaymentService = {
  /**
   * Get all advance payments with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {number} params.customerId - Filter by customer
   * @param {string} params.status - Filter by status (received, partially_applied, fully_applied, refunded)
   * @param {string} params.startDate - Filter by date from
   * @param {string} params.endDate - Filter by date to
   * @param {boolean} params.hasAvailableBalance - Filter only those with available balance
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getAll(params = {}, signal = null) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        customerId: params.customerId || undefined,
        status: params.status || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        hasAvailableBalance: params.hasAvailableBalance || undefined,
        search: params.search || undefined,
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const axiosConfig = { ...queryParams };
      if (signal) {
        axiosConfig.signal = signal;
      }

      const response = await apiClient.get('/advance-payments', axiosConfig);

      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformAdvancePaymentFromServer),
          pagination: response.pagination || null,
        };
      }

      // Handle array response
      if (Array.isArray(response)) {
        return {
          data: response.map(transformAdvancePaymentFromServer),
          pagination: null,
        };
      }

      // Handle items array response
      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformAdvancePaymentFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error('[AdvancePaymentService] getAll failed:', error);
      throw error;
    }
  },

  /**
   * Get single advance payment by ID
   * @param {number|string} id - Advance payment ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/advance-payments/${id}`);
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] getById failed:', error);
      throw error;
    }
  },

  /**
   * Get advance payments by customer ID
   * @param {number|string} customerId - Customer ID
   * @param {boolean} onlyAvailable - Only return those with available balance
   * @returns {Promise<Array>}
   */
  async getByCustomer(customerId, onlyAvailable = false) {
    try {
      const params = onlyAvailable ? { hasAvailableBalance: true } : {};
      const response = await apiClient.get(
        `/advance-payments/by-customer/${customerId}`,
        params,
      );
      const payments = Array.isArray(response) ? response : response.data || [];
      return payments.map(transformAdvancePaymentFromServer);
    } catch (error) {
      console.error('[AdvancePaymentService] getByCustomer failed:', error);
      throw error;
    }
  },

  /**
   * Get available advance payments for a customer (for invoice application)
   * Returns only advances with available balance > 0
   * @param {number|string} customerId - Customer ID
   * @returns {Promise<Array>}
   */
  async getAvailableForCustomer(customerId) {
    try {
      const response = await apiClient.get(
        `/advance-payments/available/${customerId}`,
      );
      const payments = Array.isArray(response) ? response : response.data || [];
      return payments.map(transformAdvancePaymentFromServer);
    } catch (error) {
      console.error(
        '[AdvancePaymentService] getAvailableForCustomer failed:',
        error,
      );
      throw error;
    }
  },

  /**
   * Create new advance payment
   * @param {Object} paymentData - Advance payment data
   * @returns {Promise<Object>}
   */
  async create(paymentData) {
    try {
      const transformedData = transformAdvancePaymentForServer(paymentData);
      const response = await apiClient.post(
        '/advance-payments',
        transformedData,
      );
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] create failed:', error);
      throw error;
    }
  },

  /**
   * Update existing advance payment (only if not yet applied)
   * @param {number|string} id - Advance payment ID
   * @param {Object} paymentData - Updated data
   * @returns {Promise<Object>}
   */
  async update(id, paymentData) {
    try {
      const transformedData = transformAdvancePaymentForServer(paymentData);
      const response = await apiClient.put(
        `/advance-payments/${id}`,
        transformedData,
      );
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] update failed:', error);
      throw error;
    }
  },

  /**
   * Apply advance payment to an invoice
   * This adjusts the VAT position - the advance VAT is deducted from invoice VAT
   * @param {number|string} id - Advance payment ID
   * @param {number|string} invoiceId - Invoice to apply to
   * @param {number} amount - Amount to apply (optional, defaults to full available)
   * @param {string} notes - Application notes
   * @returns {Promise<Object>}
   */
  async applyToInvoice(id, invoiceId, amount = null, notes = '') {
    try {
      const payload = {
        invoiceId,
        notes,
      };
      if (amount !== null) {
        payload.amount = parseFloat(amount);
      }
      const response = await apiClient.post(
        `/advance-payments/${id}/apply`,
        payload,
      );
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] applyToInvoice failed:', error);
      throw error;
    }
  },

  /**
   * Remove application from invoice (reverse the application)
   * @param {number|string} id - Advance payment ID
   * @param {number|string} applicationId - Application record ID
   * @param {string} reason - Reason for removal
   * @returns {Promise<Object>}
   */
  async removeApplication(id, applicationId, reason = '') {
    try {
      const response = await apiClient.post(
        `/advance-payments/${id}/remove-application`,
        {
          applicationId,
          reason,
        },
      );
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] removeApplication failed:', error);
      throw error;
    }
  },

  /**
   * Refund advance payment (full or partial)
   * @param {number|string} id - Advance payment ID
   * @param {Object} refundData - Refund details
   * @param {number} refundData.amount - Refund amount
   * @param {string} refundData.refundDate - Refund date
   * @param {string} refundData.refundMethod - Refund method
   * @param {string} refundData.referenceNumber - Reference number
   * @param {string} refundData.reason - Reason for refund
   * @param {string} refundData.notes - Additional notes
   * @returns {Promise<Object>}
   */
  async refund(id, refundData) {
    try {
      const payload = {
        amount: parseFloat(refundData.amount || 0),
        refundDate: refundData.refundDate,
        refundMethod: refundData.refundMethod || 'bank_transfer',
        referenceNumber: refundData.referenceNumber || '',
        reason: refundData.reason || '',
        notes: refundData.notes || '',
      };
      const response = await apiClient.post(
        `/advance-payments/${id}/refund`,
        payload,
      );
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] refund failed:', error);
      throw error;
    }
  },

  /**
   * Cancel advance payment (only if not applied)
   * @param {number|string} id - Advance payment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancel(id, reason = '') {
    try {
      const response = await apiClient.post(`/advance-payments/${id}/cancel`, {
        cancellationReason: reason,
      });
      return transformAdvancePaymentFromServer(response);
    } catch (error) {
      console.error('[AdvancePaymentService] cancel failed:', error);
      throw error;
    }
  },

  /**
   * Get next receipt number
   * @returns {Promise<Object>} { receiptNumber: string }
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get('/advance-payments/number/next');
      return response;
    } catch (error) {
      console.error('[AdvancePaymentService] getNextNumber failed:', error);
      throw error;
    }
  },

  /**
   * Get VAT summary for advance payments in a period
   * Used for Form 201 calculations
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Period start
   * @param {string} params.endDate - Period end
   * @returns {Promise<Object>}
   */
  async getVATSummary(params = {}) {
    try {
      const response = await apiClient.get(
        '/advance-payments/vat-summary',
        params,
      );
      return response;
    } catch (error) {
      console.error('[AdvancePaymentService] getVATSummary failed:', error);
      throw error;
    }
  },

  /**
   * Get analytics for advance payments
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    try {
      const response = await apiClient.get(
        '/advance-payments/analytics',
        params,
      );
      return response;
    } catch (error) {
      console.error('[AdvancePaymentService] getAnalytics failed:', error);
      throw error;
    }
  },

  /**
   * Search advance payments
   * @param {string} searchTerm - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get('/advance-payments', {
        search: searchTerm,
        ...filters,
      });
      const payments = response.data || response.items || response;
      return Array.isArray(payments)
        ? payments.map(transformAdvancePaymentFromServer)
        : [];
    } catch (error) {
      console.error('[AdvancePaymentService] search failed:', error);
      throw error;
    }
  },

  /**
   * Download advance payment receipt PDF
   * @param {number|string} id - Advance payment ID
   * @param {string} receiptNumber - For filename
   * @returns {Promise<boolean>}
   */
  async downloadReceipt(id, receiptNumber = null) {
    try {
      const response = await apiClient.get(`/advance-payments/${id}/receipt`, {
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `advance-receipt-${receiptNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('[AdvancePaymentService] downloadReceipt failed:', error);
      throw error;
    }
  },

  /**
   * Get application history for an advance payment
   * @param {number|string} id - Advance payment ID
   * @returns {Promise<Array>}
   */
  async getApplicationHistory(id) {
    try {
      const response = await apiClient.get(
        `/advance-payments/${id}/applications`,
      );
      return response.data || response || [];
    } catch (error) {
      console.error(
        '[AdvancePaymentService] getApplicationHistory failed:',
        error,
      );
      throw error;
    }
  },
};

export default advancePaymentService;
