/**
 * Debit Note Service - UAE VAT Compliance
 *
 * Handles debit notes (adjustments to supplier bills).
 * Used when supplier bill amount needs to be increased after issuance.
 * Mirrors credit note logic but for purchases/payables.
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from "./api.js";

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform debit note data for server submission
 */
const transformDebitNoteForServer = (debitNoteData) => {
  return {
    supplierBillId: debitNoteData.supplierBillId || null,
    debitNoteDate: debitNoteData.debitNoteDate || null,
    reason: debitNoteData.reason || "",
    // VAT fields
    vatCategory: debitNoteData.vatCategory || "STANDARD",
    // Amounts
    subtotal: parseFloat(debitNoteData.subtotal || 0),
    vatAmount: parseFloat(debitNoteData.vatAmount || 0),
    totalDebit: parseFloat(debitNoteData.totalDebit || 0),
    // Metadata
    notes: debitNoteData.notes || "",
    // Items - backend calculates totals from items
    items: (debitNoteData.items || []).map((item) => ({
      supplierBillItemId: item.supplierBillItemId || null,
      productId: item.productId || null,
      productName: item.productName || item.name || "",
      description: item.description || "",
      quantity: parseFloat(item.quantity || 0),
      unitPrice: parseFloat(item.unitPrice || item.rate || 0),
      vatRate: parseFloat(item.vatRate || 5),
      vatCategory: item.vatCategory || "STANDARD",
      reason: item.reason || "",
    })),
  };
};

/**
 * Transform debit note data from server response
 */
const transformDebitNoteFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    supplierBillId: serverData.supplierBillId || serverData.supplier_bill_id,
    supplierBillNumber: serverData.supplierBillNumber || serverData.supplier_bill_number || "",
    supplierId: serverData.supplierId || serverData.supplier_id || null,
    supplierDetails: serverData.supplierDetails || serverData.supplier_details || {},
    supplierName: serverData.supplierName || serverData.supplier_name || serverData.supplierDetails?.name || serverData.supplier_details?.name || "",
    supplierTrn: serverData.supplierTrn || serverData.supplier_trn || serverData.supplierDetails?.trn || serverData.supplier_details?.trn || "",
    debitNoteNumber: serverData.debitNoteNumber || serverData.debit_note_number || "",
    debitNoteDate: serverData.debitNoteDate || serverData.debit_note_date || null,
    reason: serverData.reason || "",
    reasonCategory: serverData.reasonCategory || serverData.reason_category || "PRICE_ADJUSTMENT",
    // VAT fields
    vatCategory: serverData.vatCategory || serverData.vat_category || "STANDARD",
    isReverseCharge: serverData.isReverseCharge || serverData.is_reverse_charge || false,
    // Amounts
    subtotal: parseFloat(serverData.subtotal || 0),
    vatAmount: parseFloat(serverData.vatAmount || serverData.vat_amount || 0),
    totalDebit: parseFloat(serverData.totalDebit || serverData.total_debit || 0),
    vatAdjustment: parseFloat(serverData.vatAdjustment || serverData.vat_adjustment || 0),
    // Status - normalize to lowercase
    status: (serverData.status || "draft").toLowerCase(),
    // Metadata
    notes: serverData.notes || "",
    attachmentUrls: serverData.attachmentUrls || serverData.attachment_urls || [],
    // Items
    items: (serverData.items || []).map((item) => ({
      id: item.id,
      debitNoteId: item.debitNoteId || item.debit_note_id,
      supplierBillItemId: item.supplierBillItemId || item.supplier_bill_item_id,
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name || "",
      description: item.description || "",
      quantity: parseFloat(item.quantity || 0),
      unitPrice: parseFloat(item.unitPrice || item.unit_price || 0),
      amount: parseFloat(item.amount || 0),
      vatRate: parseFloat(item.vatRate || item.vat_rate || 5),
      vatAmount: parseFloat(item.vatAmount || item.vat_amount || 0),
      vatCategory: item.vatCategory || item.vat_category || "STANDARD",
      reason: item.reason || "",
    })),
    // Timestamps - handle audit object structure from gRPC
    createdAt: serverData.createdAt || serverData.created_at || serverData.audit?.createdAt || serverData.audit?.created_at || null,
    updatedAt: serverData.updatedAt || serverData.updated_at || serverData.audit?.updatedAt || serverData.audit?.updated_at || null,
    createdBy: serverData.createdBy || serverData.created_by || serverData.audit?.createdBy || serverData.audit?.created_by || null,
    updatedBy: serverData.updatedBy || serverData.updated_by || serverData.audit?.updatedBy || serverData.audit?.updated_by || null,
    approvedAt: serverData.approvedAt || serverData.approved_at || null,
    approvedBy: serverData.approvedBy || serverData.approved_by || null,
    cancelledAt: serverData.cancelledAt || serverData.cancelled_at || null,
    cancellationReason: serverData.cancellationReason || serverData.cancellation_reason || "",
  };
};

// ============================================================================
// DEBIT NOTE SERVICE
// ============================================================================

const debitNoteService = {
  /**
   * Get all debit notes with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {number} params.supplierId - Filter by supplier
   * @param {number} params.supplierBillId - Filter by supplier bill
   * @param {string} params.status - Filter by status
   * @param {string} params.startDate - Filter by date from
   * @param {string} params.endDate - Filter by date to
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getAll(params = {}, signal = null) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        supplierId: params.supplierId || undefined,
        supplierBillId: params.supplierBillId || undefined,
        status: params.status || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
      };

      Object.keys(queryParams).forEach((key) => queryParams[key] === undefined && delete queryParams[key]);

      const axiosConfig = { ...queryParams };
      if (signal) {
        axiosConfig.signal = signal;
      }

      const response = await apiClient.get("/debit-notes", axiosConfig);

      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformDebitNoteFromServer),
          pagination: response.pagination || null,
        };
      }

      // Handle array response
      if (Array.isArray(response)) {
        return {
          data: response.map(transformDebitNoteFromServer),
          pagination: null,
        };
      }

      // Handle items array response
      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformDebitNoteFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error("[DebitNoteService] getAll failed:", error);
      throw error;
    }
  },

  /**
   * Get single debit note by ID
   * @param {number|string} id - Debit note ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/debit-notes/${id}`);
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] getById failed:", error);
      throw error;
    }
  },

  /**
   * Get debit notes by supplier bill ID
   * @param {number|string} supplierBillId - Supplier bill ID
   * @returns {Promise<Array>}
   */
  async getBySupplierBill(supplierBillId) {
    try {
      const response = await apiClient.get(`/debit-notes/by-supplier-bill/${supplierBillId}`);
      const debitNotes = Array.isArray(response) ? response : response.data || [];
      return debitNotes.map(transformDebitNoteFromServer);
    } catch (error) {
      console.error("[DebitNoteService] getBySupplierBill failed:", error);
      throw error;
    }
  },

  /**
   * Get debit notes by supplier ID
   * @param {number|string} supplierId - Supplier ID
   * @returns {Promise<Array>}
   */
  async getBySupplier(supplierId) {
    try {
      const response = await apiClient.get(`/debit-notes/by-supplier/${supplierId}`);
      const debitNotes = Array.isArray(response) ? response : response.data || [];
      return debitNotes.map(transformDebitNoteFromServer);
    } catch (error) {
      console.error("[DebitNoteService] getBySupplier failed:", error);
      throw error;
    }
  },

  /**
   * Create new debit note
   * @param {Object} debitNoteData - Debit note data
   * @returns {Promise<Object>}
   */
  async create(debitNoteData) {
    try {
      const transformedData = transformDebitNoteForServer(debitNoteData);
      const response = await apiClient.post("/debit-notes", transformedData);
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] create failed:", error);
      throw error;
    }
  },

  /**
   * Update existing debit note (draft only)
   * @param {number|string} id - Debit note ID
   * @param {Object} debitNoteData - Updated data
   * @returns {Promise<Object>}
   */
  async update(id, debitNoteData) {
    try {
      const transformedData = transformDebitNoteForServer(debitNoteData);
      const response = await apiClient.put(`/debit-notes/${id}`, transformedData);
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] update failed:", error);
      throw error;
    }
  },

  /**
   * Delete debit note (soft delete, draft only)
   * @param {number|string} id - Debit note ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/debit-notes/${id}`);
      return response;
    } catch (error) {
      console.error("[DebitNoteService] delete failed:", error);
      throw error;
    }
  },

  /**
   * Approve debit note
   * Changes status from draft to approved
   * @param {number|string} id - Debit note ID
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>}
   */
  async approve(id, notes = "") {
    try {
      const response = await apiClient.post(`/debit-notes/${id}/approve`, {
        notes,
      });
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] approve failed:", error);
      throw error;
    }
  },

  /**
   * Issue debit note (draft -> issued)
   * Makes it a legal document
   * @param {number|string} id - Debit note ID
   * @returns {Promise<Object>}
   */
  async issue(id) {
    try {
      const response = await apiClient.post(`/debit-notes/${id}/issue`);
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] issue failed:", error);
      throw error;
    }
  },

  /**
   * Cancel debit note
   * @param {number|string} id - Debit note ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancel(id, reason = "") {
    try {
      const response = await apiClient.post(`/debit-notes/${id}/cancel`, {
        cancellationReason: reason,
      });
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] cancel failed:", error);
      throw error;
    }
  },

  /**
   * Apply debit note to vendor account
   * @param {number|string} id - Debit note ID
   * @param {string} notes - Application notes
   * @returns {Promise<Object>}
   */
  async apply(id, notes = "") {
    try {
      const response = await apiClient.post(`/debit-notes/${id}/apply`, {
        notes,
      });
      return transformDebitNoteFromServer(response);
    } catch (error) {
      console.error("[DebitNoteService] apply failed:", error);
      throw error;
    }
  },

  /**
   * Get next debit note number
   * @returns {Promise<Object>} { debitNoteNumber: string }
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get("/debit-notes/number/next");
      return response;
    } catch (error) {
      console.error("[DebitNoteService] getNextNumber failed:", error);
      throw error;
    }
  },

  /**
   * Get debit note analytics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    try {
      const response = await apiClient.get("/debit-notes/analytics", params);
      return response;
    } catch (error) {
      console.error("[DebitNoteService] getAnalytics failed:", error);
      throw error;
    }
  },

  /**
   * Search debit notes
   * @param {string} searchTerm - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get("/debit-notes", {
        search: searchTerm,
        ...filters,
      });
      const notes = response.data || response.items || response;
      return Array.isArray(notes) ? notes.map(transformDebitNoteFromServer) : [];
    } catch (error) {
      console.error("[DebitNoteService] search failed:", error);
      throw error;
    }
  },

  /**
   * Download debit note PDF
   * @param {number|string} id - Debit note ID
   * @param {string} debitNoteNumber - For filename
   * @returns {Promise<boolean>}
   */
  async downloadPDF(id, debitNoteNumber = null) {
    try {
      const response = await apiClient.get(`/debit-notes/${id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `debit-note-${debitNoteNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("[DebitNoteService] downloadPDF failed:", error);
      throw error;
    }
  },

  /**
   * Preview debit note PDF in new tab
   * @param {number|string} id - Debit note ID
   * @returns {Promise<boolean>}
   */
  async previewPDF(id) {
    try {
      const response = await apiClient.get(`/debit-notes/${id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);

      return true;
    } catch (error) {
      console.error("[DebitNoteService] previewPDF failed:", error);
      throw error;
    }
  },

  /**
   * Get allowed status transitions
   * @param {number|string} id - Debit note ID
   * @returns {Promise<Array>}
   */
  async getAllowedTransitions(id) {
    try {
      const response = await apiClient.get(`/debit-notes/${id}/allowed-transitions`);
      return response.transitions || response || [];
    } catch (error) {
      console.error("[DebitNoteService] getAllowedTransitions failed:", error);
      throw error;
    }
  },
};

export default debitNoteService;
