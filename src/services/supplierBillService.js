/**
 * Supplier Bill Service - UAE VAT Compliance
 *
 * Handles supplier bills (purchase invoices) for input VAT tracking.
 * Supports Form 201 Box 9-11 calculations for recoverable input tax.
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from './api';
import { normalizeUom } from '../utils/fieldAccessors';

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform supplier bill data for server submission
 * Frontend sends camelCase, API Gateway converts to snake_case
 */
const transformSupplierBillForServer = (billData) => {
  return {
    // Use supplierId to match API gateway expected field (converts to supplier_id)
    supplierId: billData.supplierId || billData.supplier?.id || null,
    // Handle both field names for vendor invoice number
    supplierInvoiceNumber:
      billData.supplierInvoiceNumber || billData.vendorInvoiceNumber || '',
    billDate: billData.billDate || null,
    dueDate: billData.dueDate || null,
    receivedDate: billData.receivedDate || null,
    paymentTerms: billData.paymentTerms || 'net_30',
    // VAT fields - use primaryVatCategory to match API gateway
    primaryVatCategory:
      billData.primaryVatCategory || billData.vatCategory || 'STANDARD',
    // Blocked VAT fields (bill-level)
    isBlockedVat:
      billData.isBlockedVat ||
      billData.vatCategory === 'BLOCKED' ||
      billData.primaryVatCategory === 'BLOCKED',
    blockedVatReason: billData.blockedVatReason || '',
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
    // Company ID for multi-tenancy
    companyId: billData.companyId || null,
    // Items
    items: (billData.items || []).map((item) => ({
      productId: item.productId || null,
      productName: item.productName || item.name || '',
      description: item.description || '',
      quantity: parseFloat(item.quantity || 0),
      unit: normalizeUom(item),
      unitPrice: parseFloat(item.unitPrice || item.rate || 0),
      vatRate: parseFloat(item.vatRate ?? 5),
      vatCategory: item.vatCategory || 'STANDARD',
      isBlockedVat: item.isBlockedVat || false,
      blockedReason: item.blockedReason || '',
      costCenter: item.costCenter || '',
      glAccount: item.glAccount || '',
    })),
  };
};

/**
 * Transform supplier bill data from server response
 * Server returns snake_case, API Gateway converts to camelCase
 */
const transformSupplierBillFromServer = (serverData) => {
  if (!serverData) return null;

  // Handle both snake_case from gRPC and camelCase from API gateway auto-conversion
  const total = parseFloat(
    serverData.total || serverData.totalAmount || serverData.total_amount || 0,
  );
  const amountPaid = parseFloat(
    serverData.amountPaid || serverData.amount_paid || 0,
  );
  const balanceDue = parseFloat(
    serverData.balanceDue || serverData.balance_due || total - amountPaid || 0,
  );

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    supplierId: serverData.supplierId || serverData.supplier_id || null,
    supplierDetails:
      serverData.supplierDetails || serverData.supplier_details || {},
    supplierName:
      serverData.supplierName ||
      serverData.supplier_name ||
      serverData.supplierDetails?.name ||
      serverData.supplier_details?.name ||
      '',
    supplierTrn:
      serverData.supplierTrn ||
      serverData.supplier_trn ||
      serverData.supplierDetails?.trn ||
      serverData.supplier_details?.trn ||
      '',
    billNumber: serverData.billNumber || serverData.bill_number || '',
    supplierInvoiceNumber:
      serverData.supplierInvoiceNumber ||
      serverData.supplier_invoice_number ||
      serverData.vendorInvoiceNumber ||
      serverData.vendor_invoice_number ||
      '',
    billDate: serverData.billDate || serverData.bill_date || null,
    dueDate: serverData.dueDate || serverData.due_date || null,
    receivedDate: serverData.receivedDate || serverData.received_date || null,
    // VAT fields - handle primaryVatCategory from gRPC response
    vatCategory:
      serverData.vatCategory ||
      serverData.vat_category ||
      serverData.primaryVatCategory ||
      serverData.primary_vat_category ||
      'STANDARD',
    placeOfSupply:
      serverData.placeOfSupply || serverData.place_of_supply || 'AE-DU',
    isReverseCharge:
      serverData.isReverseCharge || serverData.is_reverse_charge || false,
    reverseChargeAmount: parseFloat(
      serverData.reverseChargeVat ||
        serverData.reverse_charge_vat ||
        serverData.reverseChargeAmount ||
        serverData.reverse_charge_amount ||
        0,
    ),
    // Amounts
    subtotal: parseFloat(serverData.subtotal || 0),
    vatAmount: parseFloat(serverData.vatAmount || serverData.vat_amount || 0),
    total,
    // Payment tracking
    amountPaid,
    amountDue: balanceDue,
    balanceDue,
    // Status - normalize to lowercase for frontend
    status: (serverData.status || 'draft').toLowerCase(),
    approvalStatus:
      serverData.approvalStatus || serverData.approval_status || 'pending',
    paymentStatus:
      serverData.paymentStatus ||
      serverData.payment_status ||
      (amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'),
    // Metadata
    notes: serverData.notes || '',
    internalNotes: serverData.internalNotes || serverData.internal_notes || '',
    terms:
      serverData.terms ||
      serverData.paymentTerms ||
      serverData.payment_terms ||
      '',
    attachmentUrls:
      serverData.attachmentUrls ||
      serverData.attachment_urls ||
      (serverData.attachmentUrl || serverData.attachment_url
        ? [serverData.attachmentUrl || serverData.attachment_url]
        : []),
    // Currency
    currency: serverData.currency || 'AED',
    exchangeRate: parseFloat(
      serverData.exchangeRate || serverData.exchange_rate || 1,
    ),
    totalAed: parseFloat(serverData.totalAed || serverData.total_aed || total),
    // Items - handle both camelCase and snake_case from API
    items: (serverData.items || []).map((item) => ({
      id: item.id,
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name || '',
      description: item.description || '',
      quantity: parseFloat(item.quantity || 0),
      unit: normalizeUom(item),
      unitPrice: parseFloat(item.unitPrice || item.unit_price || 0),
      amount: parseFloat(item.amount || 0),
      vatRate: parseFloat(item.vatRate ?? item.vat_rate ?? 5),
      vatAmount: parseFloat(item.vatAmount || item.vat_amount || 0),
      vatCategory: item.vatCategory || item.vat_category || 'STANDARD',
      isBlockedVat: item.isBlockedVat || item.is_blocked_vat || false,
      blockedReason: item.blockedReason || item.blocked_reason || '',
      costCenter: item.costCenter || item.cost_center || '',
      glAccount: item.glAccount || item.gl_account || '',
    })),
    // Payments
    payments: serverData.payments || [],
    // Timestamps
    createdAt:
      serverData.createdAt ||
      serverData.created_at ||
      serverData.audit?.createdAt ||
      serverData.audit?.created_at ||
      null,
    updatedAt:
      serverData.updatedAt ||
      serverData.updated_at ||
      serverData.audit?.updatedAt ||
      serverData.audit?.updated_at ||
      null,
    createdBy:
      serverData.createdBy ||
      serverData.created_by ||
      serverData.audit?.createdBy ||
      serverData.audit?.created_by ||
      null,
    updatedBy:
      serverData.updatedBy ||
      serverData.updated_by ||
      serverData.audit?.updatedBy ||
      serverData.audit?.updated_by ||
      null,
    approvedAt: serverData.approvedAt || serverData.approved_at || null,
    approvedBy: serverData.approvedBy || serverData.approved_by || null,
    // Import/PO links
    isImport: serverData.isImport || serverData.is_import || false,
    importOrderId:
      serverData.importOrderId || serverData.import_order_id || null,
    purchaseOrderId:
      serverData.purchaseOrderId || serverData.purchase_order_id || null,
    purchaseOrderNumber:
      serverData.purchaseOrderNumber || serverData.purchase_order_number || '',
    // Blocked VAT info
    isBlockedVat: serverData.isBlockedVat || serverData.is_blocked_vat || false,
    blockedVatReason:
      serverData.blockedVatReason || serverData.blocked_vat_reason || '',
  };
};

// ============================================================================
// SUPPLIER BILL SERVICE
// ============================================================================

const supplierBillService = {
  /**
   * Get all supplier bills with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.pageSize - Items per page (default: 50)
   * @param {number} params.supplierId - Filter by supplier ID
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
        supplierId: params.supplierId || undefined,
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

      const response = await apiClient.get('/supplier-bills', axiosConfig);

      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformSupplierBillFromServer),
          pagination: response.pagination || null,
        };
      }

      // Handle array response
      if (Array.isArray(response)) {
        return {
          data: response.map(transformSupplierBillFromServer),
          pagination: null,
        };
      }

      // Handle items array response
      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformSupplierBillFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error('[SupplierBillService] getAll failed:', error);
      throw error;
    }
  },

  /**
   * Get single supplier bill by ID with items
   * @param {number|string} id - Supplier bill ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/supplier-bills/${id}`);
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] getById failed:', error);
      throw error;
    }
  },

  /**
   * Get supplier bills by supplier ID
   * @param {number|string} supplierId - Supplier ID
   * @returns {Promise<Array>}
   */
  async getBySupplier(supplierId) {
    try {
      const response = await apiClient.get(
        `/supplier-bills/by-supplier/${supplierId}`,
      );
      const bills = Array.isArray(response) ? response : response.data || [];
      return bills.map(transformSupplierBillFromServer);
    } catch (error) {
      console.error('[SupplierBillService] getBySupplier failed:', error);
      throw error;
    }
  },

  /**
   * Create new supplier bill with items
   * @param {Object} billData - Supplier bill data
   * @returns {Promise<Object>}
   */
  async create(billData) {
    try {
      const transformedData = transformSupplierBillForServer(billData);
      const response = await apiClient.post('/supplier-bills', transformedData);
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] create failed:', error);
      throw error;
    }
  },

  /**
   * Update existing supplier bill
   * @param {number|string} id - Supplier bill ID
   * @param {Object} billData - Updated supplier bill data
   * @returns {Promise<Object>}
   */
  async update(id, billData) {
    try {
      const transformedData = transformSupplierBillForServer(billData);
      const response = await apiClient.put(
        `/supplier-bills/${id}`,
        transformedData,
      );
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] update failed:', error);
      throw error;
    }
  },

  /**
   * Delete supplier bill (soft delete)
   * @param {number|string} id - Supplier bill ID
   * @param {string} reason - Deletion reason for audit
   * @returns {Promise<Object>}
   */
  async delete(id, reason = '') {
    try {
      const response = await apiClient.delete(`/supplier-bills/${id}`, {
        data: { reason },
      });
      return response;
    } catch (error) {
      console.error('[SupplierBillService] delete failed:', error);
      throw error;
    }
  },

  /**
   * Approve supplier bill for payment
   * Changes status from draft to approved
   * @param {number|string} id - Supplier bill ID
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>}
   */
  async approve(id, notes = '') {
    try {
      const response = await apiClient.post(`/supplier-bills/${id}/approve`, {
        notes,
      });
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] approve failed:', error);
      throw error;
    }
  },

  /**
   * Reject supplier bill approval
   * @param {number|string} id - Supplier bill ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>}
   */
  async reject(id, reason = '') {
    try {
      const response = await apiClient.post(`/supplier-bills/${id}/reject`, {
        reason,
      });
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] reject failed:', error);
      throw error;
    }
  },

  /**
   * Cancel supplier bill
   * @param {number|string} id - Supplier bill ID
   * @param {string} reason - Cancellation reason for audit
   * @returns {Promise<Object>}
   */
  async cancel(id, reason = '') {
    try {
      const response = await apiClient.post(`/supplier-bills/${id}/cancel`, {
        cancellationReason: reason,
      });
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] cancel failed:', error);
      throw error;
    }
  },

  /**
   * Record payment against supplier bill
   * @param {number|string} id - Supplier bill ID
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
      const response = await apiClient.post(
        `/supplier-bills/${id}/payments`,
        payload,
      );
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] recordPayment failed:', error);
      throw error;
    }
  },

  /**
   * Void a payment on supplier bill
   * @param {number|string} billId - Supplier bill ID
   * @param {number|string} paymentId - Payment ID to void
   * @param {string} reason - Void reason
   * @returns {Promise<Object>}
   */
  async voidPayment(billId, paymentId, reason = '') {
    try {
      const response = await apiClient.post(
        `/supplier-bills/${billId}/payments/${paymentId}/void`,
        { reason },
      );
      return transformSupplierBillFromServer(response);
    } catch (error) {
      console.error('[SupplierBillService] voidPayment failed:', error);
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

      const response = await apiClient.get(
        '/supplier-bills/vat-summary',
        queryParams,
      );
      return response;
    } catch (error) {
      console.error('[SupplierBillService] getVATSummary failed:', error);
      throw error;
    }
  },

  /**
   * Get supplier bill analytics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Period start date
   * @param {string} params.endDate - Period end date
   * @param {number} params.supplierId - Optional supplier filter
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    try {
      const response = await apiClient.get('/supplier-bills/analytics', params);
      return response;
    } catch (error) {
      console.error('[SupplierBillService] getAnalytics failed:', error);
      throw error;
    }
  },

  /**
   * Get next supplier bill number
   * @returns {Promise<Object>} { billNumber: string }
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get('/supplier-bills/number/next');
      return response;
    } catch (error) {
      console.error('[SupplierBillService] getNextNumber failed:', error);
      throw error;
    }
  },

  /**
   * Search supplier bills
   * @param {string} searchTerm - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get('/supplier-bills', {
        search: searchTerm,
        ...filters,
      });
      const bills = response.data || response.items || response;
      return Array.isArray(bills)
        ? bills.map(transformSupplierBillFromServer)
        : [];
    } catch (error) {
      console.error('[SupplierBillService] search failed:', error);
      throw error;
    }
  },

  /**
   * Download supplier bill PDF
   * @param {number|string} id - Supplier bill ID
   * @param {string} billNumber - Bill number for filename
   * @returns {Promise<boolean>}
   */
  async downloadPDF(id, billNumber = null) {
    try {
      const response = await apiClient.get(`/supplier-bills/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supplier-bill-${billNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('[SupplierBillService] downloadPDF failed:', error);
      throw error;
    }
  },

  /**
   * Get blocked VAT items for this supplier bill
   * (Items where VAT cannot be recovered)
   * @param {number|string} id - Supplier bill ID
   * @returns {Promise<Array>}
   */
  async getBlockedVATItems(id) {
    try {
      const response = await apiClient.get(`/supplier-bills/${id}/blocked-vat`);
      return response.data || response || [];
    } catch (error) {
      console.error('[SupplierBillService] getBlockedVATItems failed:', error);
      throw error;
    }
  },
};

export default supplierBillService;
