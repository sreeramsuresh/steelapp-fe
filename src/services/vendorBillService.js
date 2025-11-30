/**
 * Vendor Bill Service - UAE VAT Compliance
 *
 * Handles vendor bills (purchase invoices) for input VAT tracking.
 * Supports Form 201 Box 9-11 calculations for recoverable input tax.
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from './api';

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform vendor bill data for server submission
 * Frontend sends camelCase, API Gateway converts to snake_case
 */
const transformVendorBillForServer = (billData) => {
  return {
    // Use supplierId to match API gateway expected field (converts to supplier_id)
    supplierId: billData.vendorId || billData.vendor?.id || billData.supplierId || null,
    vendorInvoiceNumber: billData.vendorInvoiceNumber || '',
    billDate: billData.billDate || null,
    dueDate: billData.dueDate || null,
    receivedDate: billData.receivedDate || null,
    paymentTerms: billData.paymentTerms || 'net_30',
    // VAT fields - use primaryVatCategory to match API gateway
    primaryVatCategory: billData.vatCategory || 'STANDARD',
    placeOfSupply: billData.placeOfSupply || 'AE-DU',
    isReverseCharge: billData.isReverseCharge || false,
    // Amounts - backend calculates these from items
    subtotal: parseFloat(billData.subtotal || 0),
    vatAmount: parseFloat(billData.vatAmount || 0),
    // Status
    status: billData.status || 'draft',
    // Metadata
    notes: billData.notes || '',
    internalNotes: billData.internalNotes || '',
    attachmentUrl: billData.attachmentUrl || billData.attachmentUrls?.[0] || '',
    // Currency
    currency: billData.currency || 'AED',
    exchangeRate: parseFloat(billData.exchangeRate || 1),
    // Import order link
    importOrderId: billData.importOrderId || null,
    purchaseOrderId: billData.purchaseOrderId || null,
    purchaseOrderNumber: billData.purchaseOrderNumber || '',
    // Items
    items: (billData.items || []).map(item => ({
      productId: item.productId || null,
      productName: item.productName || item.name || '',
      description: item.description || '',
      quantity: parseFloat(item.quantity || 0),
      unit: item.unit || 'PCS',
      unitPrice: parseFloat(item.unitPrice || item.rate || 0),
      vatRate: parseFloat(item.vatRate || 5),
      vatCategory: item.vatCategory || 'STANDARD',
      isBlockedVat: item.isBlockedVat || false,
      blockedReason: item.blockedReason || '',
      costCenter: item.costCenter || '',
      glAccount: item.glAccount || '',
    })),
  };
};

/**
 * Transform vendor bill data from server response
 * Server returns snake_case, API Gateway converts to camelCase
 */
const transformVendorBillFromServer = (serverData) => {
  if (!serverData) return null;

  // Handle both snake_case from gRPC and camelCase from API gateway auto-conversion
  const total = parseFloat(serverData.total || serverData.totalAmount || 0);
  const amountPaid = parseFloat(serverData.amountPaid || 0);
  const balanceDue = parseFloat(serverData.balanceDue || (total - amountPaid) || 0);

  return {
    id: serverData.id,
    companyId: serverData.companyId,
    // Handle both vendorId and supplierId naming conventions
    vendorId: serverData.vendorId || serverData.supplierId || null,
    vendorDetails: serverData.vendorDetails || serverData.supplierDetails || {},
    vendorName: serverData.vendorName || serverData.supplierName || serverData.vendorDetails?.name || '',
    vendorTrn: serverData.vendorTrn || serverData.supplierTrn || serverData.vendorDetails?.trn || '',
    billNumber: serverData.billNumber || '',
    vendorInvoiceNumber: serverData.vendorInvoiceNumber || '',
    billDate: serverData.billDate || null,
    dueDate: serverData.dueDate || null,
    receivedDate: serverData.receivedDate || null,
    // VAT fields - handle primaryVatCategory from gRPC response
    vatCategory: serverData.vatCategory || serverData.primaryVatCategory || 'STANDARD',
    placeOfSupply: serverData.placeOfSupply || 'AE-DU',
    isReverseCharge: serverData.isReverseCharge || false,
    reverseChargeAmount: parseFloat(serverData.reverseChargeVat || serverData.reverseChargeAmount || 0),
    // Amounts
    subtotal: parseFloat(serverData.subtotal || 0),
    vatAmount: parseFloat(serverData.vatAmount || 0),
    total,
    // Payment tracking
    amountPaid,
    amountDue: balanceDue,
    balanceDue,
    // Status - normalize to lowercase for frontend
    status: (serverData.status || 'draft').toLowerCase(),
    approvalStatus: serverData.approvalStatus || 'pending',
    paymentStatus: serverData.paymentStatus || (amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'),
    // Metadata
    notes: serverData.notes || '',
    internalNotes: serverData.internalNotes || '',
    terms: serverData.terms || serverData.paymentTerms || '',
    attachmentUrls: serverData.attachmentUrls || (serverData.attachmentUrl ? [serverData.attachmentUrl] : []),
    // Currency
    currency: serverData.currency || 'AED',
    exchangeRate: parseFloat(serverData.exchangeRate || 1),
    totalAed: parseFloat(serverData.totalAed || total),
    // Items
    items: (serverData.items || []).map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || '',
      description: item.description || '',
      quantity: parseFloat(item.quantity || 0),
      unit: item.unit || 'PCS',
      unitPrice: parseFloat(item.unitPrice || 0),
      amount: parseFloat(item.amount || 0),
      vatRate: parseFloat(item.vatRate || 5),
      vatAmount: parseFloat(item.vatAmount || 0),
      vatCategory: item.vatCategory || 'STANDARD',
      isBlockedVat: item.isBlockedVat || false,
      blockedReason: item.blockedReason || '',
      costCenter: item.costCenter || '',
      glAccount: item.glAccount || '',
    })),
    // Payments
    payments: serverData.payments || [],
    // Timestamps
    createdAt: serverData.createdAt || serverData.audit?.createdAt || null,
    updatedAt: serverData.updatedAt || serverData.audit?.updatedAt || null,
    createdBy: serverData.createdBy || serverData.audit?.createdBy || null,
    updatedBy: serverData.updatedBy || serverData.audit?.updatedBy || null,
    approvedAt: serverData.approvedAt || null,
    approvedBy: serverData.approvedBy || null,
    // Import/PO links
    isImport: serverData.isImport || false,
    importOrderId: serverData.importOrderId || null,
    purchaseOrderId: serverData.purchaseOrderId || null,
    purchaseOrderNumber: serverData.purchaseOrderNumber || '',
    // Blocked VAT info
    isBlockedVat: serverData.isBlockedVat || false,
    blockedVatReason: serverData.blockedVatReason || '',
  };
};

// ============================================================================
// VENDOR BILL SERVICE
// ============================================================================

const vendorBillService = {
  /**
   * Get all vendor bills with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.pageSize - Items per page (default: 50)
   * @param {number} params.vendorId - Filter by vendor ID
   * @param {string} params.status - Filter by status (draft, approved, cancelled)
   * @param {string} params.vatCategory - Filter by VAT category
   * @param {string} params.startDate - Filter by bill date from
   * @param {string} params.endDate - Filter by bill date to
   * @param {string} params.search - Search in bill number, vendor name
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getAll(params = {}, signal = null) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        // API gateway expects supplier_id, not vendor_id
        supplierId: params.vendorId || params.supplierId || undefined,
        status: params.status || undefined,
        vatCategory: params.vatCategory || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        search: params.search || undefined,
        includeCancelled: params.includeCancelled || undefined,
      };

      // Remove undefined params
      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const axiosConfig = { ...queryParams };
      if (signal) {
        axiosConfig.signal = signal;
      }

      const response = await apiClient.get('/vendor-bills', axiosConfig);

      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformVendorBillFromServer),
          pagination: response.pagination || null,
        };
      }

      // Handle array response
      if (Array.isArray(response)) {
        return {
          data: response.map(transformVendorBillFromServer),
          pagination: null,
        };
      }

      // Handle items array response
      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformVendorBillFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error('[VendorBillService] getAll failed:', error);
      throw error;
    }
  },

  /**
   * Get single vendor bill by ID with items
   * @param {number|string} id - Vendor bill ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/vendor-bills/${id}`);
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] getById failed:', error);
      throw error;
    }
  },

  /**
   * Get vendor bills by vendor ID
   * @param {number|string} vendorId - Vendor ID
   * @returns {Promise<Array>}
   */
  async getByVendor(vendorId) {
    try {
      const response = await apiClient.get(`/vendor-bills/by-vendor/${vendorId}`);
      const bills = Array.isArray(response) ? response : (response.data || []);
      return bills.map(transformVendorBillFromServer);
    } catch (error) {
      console.error('[VendorBillService] getByVendor failed:', error);
      throw error;
    }
  },

  /**
   * Create new vendor bill with items
   * @param {Object} billData - Vendor bill data
   * @returns {Promise<Object>}
   */
  async create(billData) {
    try {
      const transformedData = transformVendorBillForServer(billData);
      const response = await apiClient.post('/vendor-bills', transformedData);
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] create failed:', error);
      throw error;
    }
  },

  /**
   * Update existing vendor bill
   * @param {number|string} id - Vendor bill ID
   * @param {Object} billData - Updated vendor bill data
   * @returns {Promise<Object>}
   */
  async update(id, billData) {
    try {
      const transformedData = transformVendorBillForServer(billData);
      const response = await apiClient.put(`/vendor-bills/${id}`, transformedData);
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] update failed:', error);
      throw error;
    }
  },

  /**
   * Delete vendor bill (soft delete)
   * @param {number|string} id - Vendor bill ID
   * @param {string} reason - Deletion reason for audit
   * @returns {Promise<Object>}
   */
  async delete(id, reason = '') {
    try {
      const response = await apiClient.delete(`/vendor-bills/${id}`, {
        data: { reason },
      });
      return response;
    } catch (error) {
      console.error('[VendorBillService] delete failed:', error);
      throw error;
    }
  },

  /**
   * Approve vendor bill for payment
   * Changes status from draft to approved
   * @param {number|string} id - Vendor bill ID
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>}
   */
  async approve(id, notes = '') {
    try {
      const response = await apiClient.post(`/vendor-bills/${id}/approve`, { notes });
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] approve failed:', error);
      throw error;
    }
  },

  /**
   * Reject vendor bill approval
   * @param {number|string} id - Vendor bill ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>}
   */
  async reject(id, reason = '') {
    try {
      const response = await apiClient.post(`/vendor-bills/${id}/reject`, { reason });
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] reject failed:', error);
      throw error;
    }
  },

  /**
   * Cancel vendor bill
   * @param {number|string} id - Vendor bill ID
   * @param {string} reason - Cancellation reason for audit
   * @returns {Promise<Object>}
   */
  async cancel(id, reason = '') {
    try {
      const response = await apiClient.post(`/vendor-bills/${id}/cancel`, {
        cancellationReason: reason,
      });
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] cancel failed:', error);
      throw error;
    }
  },

  /**
   * Record payment against vendor bill
   * @param {number|string} id - Vendor bill ID
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.paymentDate - Payment date
   * @param {string} paymentData.paymentMethod - Payment method
   * @param {string} paymentData.referenceNumber - Reference/cheque number
   * @param {string} paymentData.notes - Payment notes
   * @returns {Promise<Object>}
   */
  async recordPayment(id, paymentData) {
    try {
      const payload = {
        amount: parseFloat(paymentData.amount || 0),
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod || 'bank_transfer',
        referenceNumber: paymentData.referenceNumber || '',
        notes: paymentData.notes || '',
        attachmentUrl: paymentData.attachmentUrl || null,
      };
      const response = await apiClient.post(`/vendor-bills/${id}/payments`, payload);
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] recordPayment failed:', error);
      throw error;
    }
  },

  /**
   * Void a payment on vendor bill
   * @param {number|string} billId - Vendor bill ID
   * @param {number|string} paymentId - Payment ID to void
   * @param {string} reason - Void reason
   * @returns {Promise<Object>}
   */
  async voidPayment(billId, paymentId, reason = '') {
    try {
      const response = await apiClient.post(
        `/vendor-bills/${billId}/payments/${paymentId}/void`,
        { reason },
      );
      return transformVendorBillFromServer(response);
    } catch (error) {
      console.error('[VendorBillService] voidPayment failed:', error);
      throw error;
    }
  },

  /**
   * Get VAT summary for period (for Form 201 input VAT calculation)
   * Used for Box 9, 10, 11 calculations
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Period start date
   * @param {string} params.endDate - Period end date
   * @param {string} params.vatCategory - Optional VAT category filter
   * @returns {Promise<Object>} VAT summary with category breakdown
   */
  async getVATSummary(params = {}) {
    try {
      const queryParams = {
        startDate: params.startDate,
        endDate: params.endDate,
        vatCategory: params.vatCategory || undefined,
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const response = await apiClient.get('/vendor-bills/vat-summary', queryParams);
      return response;
    } catch (error) {
      console.error('[VendorBillService] getVATSummary failed:', error);
      throw error;
    }
  },

  /**
   * Get vendor bill analytics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Period start date
   * @param {string} params.endDate - Period end date
   * @param {number} params.vendorId - Optional vendor filter
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    try {
      const response = await apiClient.get('/vendor-bills/analytics', params);
      return response;
    } catch (error) {
      console.error('[VendorBillService] getAnalytics failed:', error);
      throw error;
    }
  },

  /**
   * Get next vendor bill number
   * @returns {Promise<Object>} { billNumber: string }
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get('/vendor-bills/number/next');
      return response;
    } catch (error) {
      console.error('[VendorBillService] getNextNumber failed:', error);
      throw error;
    }
  },

  /**
   * Search vendor bills
   * @param {string} searchTerm - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get('/vendor-bills', {
        search: searchTerm,
        ...filters,
      });
      const bills = response.data || response.items || response;
      return Array.isArray(bills) ? bills.map(transformVendorBillFromServer) : [];
    } catch (error) {
      console.error('[VendorBillService] search failed:', error);
      throw error;
    }
  },

  /**
   * Download vendor bill PDF
   * @param {number|string} id - Vendor bill ID
   * @param {string} billNumber - Bill number for filename
   * @returns {Promise<boolean>}
   */
  async downloadPDF(id, billNumber = null) {
    try {
      const response = await apiClient.get(`/vendor-bills/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendor-bill-${billNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('[VendorBillService] downloadPDF failed:', error);
      throw error;
    }
  },

  /**
   * Get blocked VAT items for this vendor bill
   * (Items where VAT cannot be recovered)
   * @param {number|string} id - Vendor bill ID
   * @returns {Promise<Array>}
   */
  async getBlockedVATItems(id) {
    try {
      const response = await apiClient.get(`/vendor-bills/${id}/blocked-vat`);
      return response.data || response || [];
    } catch (error) {
      console.error('[VendorBillService] getBlockedVATItems failed:', error);
      throw error;
    }
  },
};

export default vendorBillService;
