/**
 * VAT Adjustment Service - UAE VAT Compliance
 *
 * Handles VAT adjustments for various scenarios:
 * - Bad debt relief (Box 7 of Form 201)
 * - Corrections of errors from previous periods
 * - Manual adjustments required by FTA
 * - Rounding adjustments
 *
 * UAE VAT Rules:
 * - Adjustments must be supported by documentation
 * - Bad debt relief available after 6 months of non-payment
 * - Corrections >AED 10,000 require amendment to previous return
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from "./api.js";

// ============================================================================
// CONSTANTS
// ============================================================================

export const ADJUSTMENT_TYPES = {
  BAD_DEBT_RELIEF: "BAD_DEBT_RELIEF", // Recovery of VAT on bad debts
  BAD_DEBT_RECOVERY: "BAD_DEBT_RECOVERY", // Customer paid after bad debt relief
  ERROR_CORRECTION: "ERROR_CORRECTION", // Correction of previous error
  FTA_DIRECTED: "FTA_DIRECTED", // Adjustment directed by FTA
  ROUNDING: "ROUNDING", // Rounding adjustments
  OTHER: "OTHER", // Other adjustments
};

export const ADJUSTMENT_DIRECTIONS = {
  INCREASE: "INCREASE", // Increases VAT liability
  DECREASE: "DECREASE", // Decreases VAT liability
};

export const ADJUSTMENT_STATUSES = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  APPLIED: "applied",
  CANCELLED: "cancelled",
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform VAT adjustment data for server submission
 */
const transformAdjustmentForServer = (adjustmentData) => {
  return {
    adjustmentType: adjustmentData.adjustmentType || "OTHER",
    direction: adjustmentData.direction || "DECREASE",
    adjustmentDate: adjustmentData.adjustmentDate || null,
    effectivePeriodStart: adjustmentData.effectivePeriodStart || null,
    effectivePeriodEnd: adjustmentData.effectivePeriodEnd || null,
    // Related documents
    relatedInvoiceId: adjustmentData.relatedInvoiceId || null,
    relatedCreditNoteId: adjustmentData.relatedCreditNoteId || null,
    relatedVatReturnId: adjustmentData.relatedVatReturnId || null,
    // Amounts
    taxableAmount: parseFloat(adjustmentData.taxableAmount || 0),
    vatRate: parseFloat(adjustmentData.vatRate || 5),
    vatAmount: parseFloat(adjustmentData.vatAmount || 0),
    // Categorization
    vatCategory: adjustmentData.vatCategory || "STANDARD",
    form201Box: adjustmentData.form201Box || null, // e.g., 'BOX_7' for bad debt
    // Details
    reason: adjustmentData.reason || "",
    description: adjustmentData.description || "",
    supportingDocuments: adjustmentData.supportingDocuments || [],
    attachmentUrls: adjustmentData.attachmentUrls || [],
    // Bad debt specific
    originalInvoiceDate: adjustmentData.originalInvoiceDate || null,
    debtAgeDays: adjustmentData.debtAgeDays || null,
    customerName: adjustmentData.customerName || "",
    customerTrn: adjustmentData.customerTrn || "",
    // Status
    status: adjustmentData.status || "draft",
    notes: adjustmentData.notes || "",
  };
};

/**
 * Transform VAT adjustment data from server response
 */
const transformAdjustmentFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId,
    adjustmentNumber: serverData.adjustmentNumber || "",
    adjustmentType: serverData.adjustmentType || "OTHER",
    direction: serverData.direction || "DECREASE",
    adjustmentDate: serverData.adjustmentDate || null,
    effectivePeriodStart: serverData.effectivePeriodStart || null,
    effectivePeriodEnd: serverData.effectivePeriodEnd || null,
    // Related documents
    relatedInvoiceId: serverData.relatedInvoiceId || null,
    relatedInvoiceNumber: serverData.relatedInvoiceNumber || "",
    relatedCreditNoteId: serverData.relatedCreditNoteId || null,
    relatedCreditNoteNumber: serverData.relatedCreditNoteNumber || "",
    relatedVatReturnId: serverData.relatedVatReturnId || null,
    relatedVatReturnPeriod: serverData.relatedVatReturnPeriod || "",
    // Amounts
    taxableAmount: parseFloat(serverData.taxableAmount || 0),
    vatRate: parseFloat(serverData.vatRate || 5),
    vatAmount: parseFloat(serverData.vatAmount || 0),
    // Categorization
    vatCategory: serverData.vatCategory || "STANDARD",
    form201Box: serverData.form201Box || null,
    // Details
    reason: serverData.reason || "",
    description: serverData.description || "",
    supportingDocuments: serverData.supportingDocuments || [],
    attachmentUrls: serverData.attachmentUrls || [],
    // Bad debt specific
    originalInvoiceDate: serverData.originalInvoiceDate || null,
    debtAgeDays: serverData.debtAgeDays || null,
    customerName: serverData.customerName || "",
    customerTrn: serverData.customerTrn || "",
    // Status
    status: serverData.status || "draft",
    notes: serverData.notes || "",
    // Audit trail
    createdAt: serverData.createdAt || null,
    createdBy: serverData.createdBy || null,
    updatedAt: serverData.updatedAt || null,
    approvedAt: serverData.approvedAt || null,
    approvedBy: serverData.approvedBy || null,
    rejectedAt: serverData.rejectedAt || null,
    rejectedBy: serverData.rejectedBy || null,
    rejectionReason: serverData.rejectionReason || "",
    appliedToVatReturnId: serverData.appliedToVatReturnId || null,
    appliedAt: serverData.appliedAt || null,
  };
};

// ============================================================================
// VAT ADJUSTMENT SERVICE
// ============================================================================

const vatAdjustmentService = {
  /**
   * Get all VAT adjustments with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {string} params.adjustmentType - Filter by type
   * @param {string} params.direction - Filter by direction (INCREASE/DECREASE)
   * @param {string} params.status - Filter by status
   * @param {string} params.startDate - Filter by date from
   * @param {string} params.endDate - Filter by date to
   * @param {string} params.form201Box - Filter by Form 201 box
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getAll(params = {}, signal = null) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        adjustmentType: params.adjustmentType || undefined,
        direction: params.direction || undefined,
        status: params.status || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        form201Box: params.form201Box || undefined,
        search: params.search || undefined,
      };

      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === undefined) delete queryParams[key];
      });

      const axiosConfig = { ...queryParams };
      if (signal) {
        axiosConfig.signal = signal;
      }

      const response = await apiClient.get("/vat-adjustments", axiosConfig);

      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformAdjustmentFromServer),
          pagination: response.pagination || null,
        };
      }

      // Handle array response
      if (Array.isArray(response)) {
        return {
          data: response.map(transformAdjustmentFromServer),
          pagination: null,
        };
      }

      // Handle items array response
      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformAdjustmentFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error("[VATAdjustmentService] getAll failed:", error);
      throw error;
    }
  },

  /**
   * Get single VAT adjustment by ID
   * @param {number|string} id - Adjustment ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/vat-adjustments/${id}`);
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] getById failed:", error);
      throw error;
    }
  },

  /**
   * Get adjustments for a specific VAT return period
   * @param {string} startDate - Period start
   * @param {string} endDate - Period end
   * @returns {Promise<Array>}
   */
  async getByPeriod(startDate, endDate) {
    try {
      const response = await apiClient.get("/vat-adjustments/by-period", {
        startDate,
        endDate,
      });
      const adjustments = Array.isArray(response) ? response : response.data || [];
      return adjustments.map(transformAdjustmentFromServer);
    } catch (error) {
      console.error("[VATAdjustmentService] getByPeriod failed:", error);
      throw error;
    }
  },

  /**
   * Get pending adjustments for review
   * @returns {Promise<Array>}
   */
  async getPendingApproval() {
    try {
      const response = await apiClient.get("/vat-adjustments/pending-approval");
      const adjustments = Array.isArray(response) ? response : response.data || [];
      return adjustments.map(transformAdjustmentFromServer);
    } catch (error) {
      console.error("[VATAdjustmentService] getPendingApproval failed:", error);
      throw error;
    }
  },

  /**
   * Create new VAT adjustment
   * @param {Object} adjustmentData - Adjustment data
   * @returns {Promise<Object>}
   */
  async create(adjustmentData) {
    try {
      const transformedData = transformAdjustmentForServer(adjustmentData);
      const response = await apiClient.post("/vat-adjustments", transformedData);
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] create failed:", error);
      throw error;
    }
  },

  /**
   * Update existing VAT adjustment (draft only)
   * @param {number|string} id - Adjustment ID
   * @param {Object} adjustmentData - Updated data
   * @returns {Promise<Object>}
   */
  async update(id, adjustmentData) {
    try {
      const transformedData = transformAdjustmentForServer(adjustmentData);
      const response = await apiClient.put(`/vat-adjustments/${id}`, transformedData);
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] update failed:", error);
      throw error;
    }
  },

  /**
   * Delete VAT adjustment (draft only)
   * @param {number|string} id - Adjustment ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/vat-adjustments/${id}`);
      return response;
    } catch (error) {
      console.error("[VATAdjustmentService] delete failed:", error);
      throw error;
    }
  },

  /**
   * Submit adjustment for approval
   * @param {number|string} id - Adjustment ID
   * @returns {Promise<Object>}
   */
  async submitForApproval(id) {
    try {
      const response = await apiClient.post(`/vat-adjustments/${id}/submit`);
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] submitForApproval failed:", error);
      throw error;
    }
  },

  /**
   * Approve VAT adjustment
   * @param {number|string} id - Adjustment ID
   * @param {string} notes - Approval notes
   * @returns {Promise<Object>}
   */
  async approve(id, notes = "") {
    try {
      const response = await apiClient.post(`/vat-adjustments/${id}/approve`, {
        notes,
      });
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] approve failed:", error);
      throw error;
    }
  },

  /**
   * Reject VAT adjustment
   * @param {number|string} id - Adjustment ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>}
   */
  async reject(id, reason = "") {
    try {
      const response = await apiClient.post(`/vat-adjustments/${id}/reject`, {
        rejectionReason: reason,
      });
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] reject failed:", error);
      throw error;
    }
  },

  /**
   * Apply adjustment to VAT return
   * Links this adjustment to a specific VAT return
   * @param {number|string} id - Adjustment ID
   * @param {number|string} vatReturnId - VAT return to apply to
   * @returns {Promise<Object>}
   */
  async applyToVatReturn(id, vatReturnId) {
    try {
      const response = await apiClient.post(`/vat-adjustments/${id}/apply`, {
        vatReturnId,
      });
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] applyToVatReturn failed:", error);
      throw error;
    }
  },

  /**
   * Cancel VAT adjustment
   * @param {number|string} id - Adjustment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancel(id, reason = "") {
    try {
      const response = await apiClient.post(`/vat-adjustments/${id}/cancel`, {
        cancellationReason: reason,
      });
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] cancel failed:", error);
      throw error;
    }
  },

  /**
   * Get next adjustment number
   * @returns {Promise<Object>} { adjustmentNumber: string }
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get("/vat-adjustments/number/next");
      return response;
    } catch (error) {
      console.error("[VATAdjustmentService] getNextNumber failed:", error);
      throw error;
    }
  },

  /**
   * Check eligibility for bad debt relief
   * @param {number|string} invoiceId - Invoice ID to check
   * @returns {Promise<Object>} { eligible: boolean, reason: string, debtAgeDays: number }
   */
  async checkBadDebtEligibility(invoiceId) {
    try {
      const response = await apiClient.get(`/vat-adjustments/bad-debt-eligibility/${invoiceId}`);
      return response;
    } catch (error) {
      console.error("[VATAdjustmentService] checkBadDebtEligibility failed:", error);
      throw error;
    }
  },

  /**
   * Create bad debt relief adjustment for an invoice
   * @param {number|string} invoiceId - Invoice ID
   * @param {Object} details - Additional details
   * @returns {Promise<Object>}
   */
  async createBadDebtRelief(invoiceId, details = {}) {
    try {
      const response = await apiClient.post("/vat-adjustments/bad-debt-relief", {
        invoiceId,
        notes: details.notes || "",
        supportingDocuments: details.supportingDocuments || [],
      });
      return transformAdjustmentFromServer(response);
    } catch (error) {
      console.error("[VATAdjustmentService] createBadDebtRelief failed:", error);
      throw error;
    }
  },

  /**
   * Get adjustment summary for a period
   * Used for Form 201 box calculations
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Period start
   * @param {string} params.endDate - Period end
   * @returns {Promise<Object>}
   */
  async getSummary(params = {}) {
    try {
      const response = await apiClient.get("/vat-adjustments/summary", params);
      return response;
    } catch (error) {
      console.error("[VATAdjustmentService] getSummary failed:", error);
      throw error;
    }
  },

  /**
   * Get audit trail for an adjustment
   * @param {number|string} id - Adjustment ID
   * @returns {Promise<Array>}
   */
  async getAuditTrail(id) {
    try {
      const response = await apiClient.get(`/vat-adjustments/${id}/audit-trail`);
      return response || [];
    } catch (error) {
      console.error("[VATAdjustmentService] getAuditTrail failed:", error);
      throw error;
    }
  },

  /**
   * Search adjustments
   * @param {string} searchTerm - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get("/vat-adjustments", {
        search: searchTerm,
        ...filters,
      });
      const adjustments = response.data || response.items || response;
      return Array.isArray(adjustments) ? adjustments.map(transformAdjustmentFromServer) : [];
    } catch (error) {
      console.error("[VATAdjustmentService] search failed:", error);
      throw error;
    }
  },
};

export default vatAdjustmentService;
