/**
 * VAT Amendment Service - UAE VAT Compliance
 *
 * Handles voluntary disclosures and amendments to previously filed VAT returns.
 * Required when errors are discovered after filing a VAT return.
 *
 * UAE VAT Rules (Article 78):
 * - Must file voluntary disclosure if error affects VAT liability
 * - Errors >AED 10,000 require formal amendment
 * - Penalties may apply for late disclosure
 * - 20% of unpaid tax as administrative penalty
 * - 1% monthly penalty on unpaid VAT (max 300%)
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from './api';

// ============================================================================
// CONSTANTS
// ============================================================================

export const AMENDMENT_TYPES = {
  VOLUNTARY_DISCLOSURE: 'VOLUNTARY_DISCLOSURE',  // Self-discovered error
  FTA_ASSESSMENT: 'FTA_ASSESSMENT',              // FTA-initiated correction
  AUDIT_FINDING: 'AUDIT_FINDING',                // Result of FTA audit
};

export const ERROR_CATEGORIES = {
  OUTPUT_VAT_UNDERREPORTED: 'OUTPUT_VAT_UNDERREPORTED',      // Sales VAT too low
  OUTPUT_VAT_OVERREPORTED: 'OUTPUT_VAT_OVERREPORTED',        // Sales VAT too high
  INPUT_VAT_OVERCLAIMED: 'INPUT_VAT_OVERCLAIMED',            // Purchase VAT too high
  INPUT_VAT_UNDERCLAIMED: 'INPUT_VAT_UNDERCLAIMED',          // Purchase VAT too low
  INCORRECT_RATE: 'INCORRECT_RATE',                          // Wrong VAT rate applied
  INCORRECT_CATEGORY: 'INCORRECT_CATEGORY',                  // Wrong VAT category
  CALCULATION_ERROR: 'CALCULATION_ERROR',                    // Math error
  TIMING_ERROR: 'TIMING_ERROR',                              // Wrong period
  OTHER: 'OTHER',
};

export const AMENDMENT_STATUSES = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  SUBMITTED: 'submitted',
  ACKNOWLEDGED: 'acknowledged',
  REJECTED_BY_FTA: 'rejected_by_fta',
  CANCELLED: 'cancelled',
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform VAT amendment data for server submission
 */
const transformAmendmentForServer = (amendmentData) => {
  return {
    amendmentType: amendmentData.amendmentType || 'VOLUNTARY_DISCLOSURE',
    // Original return reference
    originalVatReturnId: amendmentData.originalVatReturnId || null,
    originalReturnPeriod: amendmentData.originalReturnPeriod || '',
    originalFilingDate: amendmentData.originalFilingDate || null,
    // Error details
    errorCategory: amendmentData.errorCategory || 'OTHER',
    errorDescription: amendmentData.errorDescription || '',
    discoveryDate: amendmentData.discoveryDate || null,
    discoveryMethod: amendmentData.discoveryMethod || '',
    // Original values
    originalTaxableAmount: parseFloat(amendmentData.originalTaxableAmount || 0),
    originalVatAmount: parseFloat(amendmentData.originalVatAmount || 0),
    // Corrected values
    correctedTaxableAmount: parseFloat(amendmentData.correctedTaxableAmount || 0),
    correctedVatAmount: parseFloat(amendmentData.correctedVatAmount || 0),
    // Difference
    differenceAmount: parseFloat(amendmentData.differenceAmount || 0),
    differenceVat: parseFloat(amendmentData.differenceVat || 0),
    // Form 201 box affected
    form201BoxAffected: amendmentData.form201BoxAffected || null,
    // Penalties
    estimatedPenalty: parseFloat(amendmentData.estimatedPenalty || 0),
    penaltyRate: parseFloat(amendmentData.penaltyRate || 0),
    penaltyMonths: amendmentData.penaltyMonths || 0,
    // Supporting information
    reason: amendmentData.reason || '',
    preventiveMeasures: amendmentData.preventiveMeasures || '',
    supportingDocuments: amendmentData.supportingDocuments || [],
    attachmentUrls: amendmentData.attachmentUrls || [],
    // Related transactions
    relatedInvoiceIds: amendmentData.relatedInvoiceIds || [],
    relatedCreditNoteIds: amendmentData.relatedCreditNoteIds || [],
    relatedVendorBillIds: amendmentData.relatedVendorBillIds || [],
    // Status
    status: amendmentData.status || 'draft',
    notes: amendmentData.notes || '',
  };
};

/**
 * Transform VAT amendment data from server response
 */
const transformAmendmentFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId,
    amendmentNumber: serverData.amendmentNumber || '',
    amendmentType: serverData.amendmentType || 'VOLUNTARY_DISCLOSURE',
    // Original return reference
    originalVatReturnId: serverData.originalVatReturnId || null,
    originalReturnPeriod: serverData.originalReturnPeriod || '',
    originalFilingDate: serverData.originalFilingDate || null,
    originalReturnNumber: serverData.originalReturnNumber || '',
    // Error details
    errorCategory: serverData.errorCategory || 'OTHER',
    errorDescription: serverData.errorDescription || '',
    discoveryDate: serverData.discoveryDate || null,
    discoveryMethod: serverData.discoveryMethod || '',
    // Original values
    originalTaxableAmount: parseFloat(serverData.originalTaxableAmount || 0),
    originalVatAmount: parseFloat(serverData.originalVatAmount || 0),
    // Corrected values
    correctedTaxableAmount: parseFloat(serverData.correctedTaxableAmount || 0),
    correctedVatAmount: parseFloat(serverData.correctedVatAmount || 0),
    // Difference
    differenceAmount: parseFloat(serverData.differenceAmount || 0),
    differenceVat: parseFloat(serverData.differenceVat || 0),
    // Form 201 box affected
    form201BoxAffected: serverData.form201BoxAffected || null,
    // Penalties
    estimatedPenalty: parseFloat(serverData.estimatedPenalty || 0),
    actualPenalty: parseFloat(serverData.actualPenalty || 0),
    penaltyRate: parseFloat(serverData.penaltyRate || 0),
    penaltyMonths: serverData.penaltyMonths || 0,
    penaltyPaid: serverData.penaltyPaid || false,
    penaltyPaidDate: serverData.penaltyPaidDate || null,
    // Supporting information
    reason: serverData.reason || '',
    preventiveMeasures: serverData.preventiveMeasures || '',
    supportingDocuments: serverData.supportingDocuments || [],
    attachmentUrls: serverData.attachmentUrls || [],
    // Related transactions
    relatedInvoiceIds: serverData.relatedInvoiceIds || [],
    relatedCreditNoteIds: serverData.relatedCreditNoteIds || [],
    relatedVendorBillIds: serverData.relatedVendorBillIds || [],
    // Status
    status: serverData.status || 'draft',
    notes: serverData.notes || '',
    // FTA response
    ftaReferenceNumber: serverData.ftaReferenceNumber || '',
    ftaResponseDate: serverData.ftaResponseDate || null,
    ftaResponseNotes: serverData.ftaResponseNotes || '',
    // Timestamps and audit
    createdAt: serverData.createdAt || null,
    createdBy: serverData.createdBy || null,
    updatedAt: serverData.updatedAt || null,
    submittedAt: serverData.submittedAt || null,
    submittedBy: serverData.submittedBy || null,
    acknowledgedAt: serverData.acknowledgedAt || null,
  };
};

// ============================================================================
// VAT AMENDMENT SERVICE
// ============================================================================

const vatAmendmentService = {
  /**
   * Get all VAT amendments with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {string} params.amendmentType - Filter by type
   * @param {string} params.errorCategory - Filter by error category
   * @param {string} params.status - Filter by status
   * @param {string} params.startDate - Filter by date from
   * @param {string} params.endDate - Filter by date to
   * @param {number} params.originalVatReturnId - Filter by original return
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getAll(params = {}, signal = null) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        amendmentType: params.amendmentType || undefined,
        errorCategory: params.errorCategory || undefined,
        status: params.status || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        originalVatReturnId: params.originalVatReturnId || undefined,
        search: params.search || undefined,
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key],
      );

      const axiosConfig = { ...queryParams };
      if (signal) {
        axiosConfig.signal = signal;
      }

      const response = await apiClient.get('/vat-amendments', axiosConfig);

      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformAmendmentFromServer),
          pagination: response.pagination || null,
        };
      }

      // Handle array response
      if (Array.isArray(response)) {
        return {
          data: response.map(transformAmendmentFromServer),
          pagination: null,
        };
      }

      // Handle items array response
      if (response.items && Array.isArray(response.items)) {
        return {
          data: response.items.map(transformAmendmentFromServer),
          pagination: response.pagination || null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error('[VATAmendmentService] getAll failed:', error);
      throw error;
    }
  },

  /**
   * Get single VAT amendment by ID
   * @param {number|string} id - Amendment ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/vat-amendments/${id}`);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] getById failed:', error);
      throw error;
    }
  },

  /**
   * Get amendments for a specific VAT return
   * @param {number|string} vatReturnId - Original VAT return ID
   * @returns {Promise<Array>}
   */
  async getByVatReturn(vatReturnId) {
    try {
      const response = await apiClient.get(`/vat-amendments/by-return/${vatReturnId}`);
      const amendments = Array.isArray(response) ? response : (response.data || []);
      return amendments.map(transformAmendmentFromServer);
    } catch (error) {
      console.error('[VATAmendmentService] getByVatReturn failed:', error);
      throw error;
    }
  },

  /**
   * Get pending amendments requiring action
   * @returns {Promise<Array>}
   */
  async getPending() {
    try {
      const response = await apiClient.get('/vat-amendments/pending');
      const amendments = Array.isArray(response) ? response : (response.data || []);
      return amendments.map(transformAmendmentFromServer);
    } catch (error) {
      console.error('[VATAmendmentService] getPending failed:', error);
      throw error;
    }
  },

  /**
   * Create new VAT amendment
   * @param {Object} amendmentData - Amendment data
   * @returns {Promise<Object>}
   */
  async create(amendmentData) {
    try {
      const transformedData = transformAmendmentForServer(amendmentData);
      const response = await apiClient.post('/vat-amendments', transformedData);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] create failed:', error);
      throw error;
    }
  },

  /**
   * Update existing VAT amendment (draft only)
   * @param {number|string} id - Amendment ID
   * @param {Object} amendmentData - Updated data
   * @returns {Promise<Object>}
   */
  async update(id, amendmentData) {
    try {
      const transformedData = transformAmendmentForServer(amendmentData);
      const response = await apiClient.put(`/vat-amendments/${id}`, transformedData);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] update failed:', error);
      throw error;
    }
  },

  /**
   * Delete VAT amendment (draft only)
   * @param {number|string} id - Amendment ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/vat-amendments/${id}`);
      return response;
    } catch (error) {
      console.error('[VATAmendmentService] delete failed:', error);
      throw error;
    }
  },

  /**
   * Submit amendment to FTA (voluntary disclosure)
   * @param {number|string} id - Amendment ID
   * @returns {Promise<Object>}
   */
  async submit(id) {
    try {
      const response = await apiClient.post(`/vat-amendments/${id}/submit`);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] submit failed:', error);
      throw error;
    }
  },

  /**
   * Record FTA acknowledgement
   * @param {number|string} id - Amendment ID
   * @param {Object} acknowledgement - FTA response details
   * @param {string} acknowledgement.ftaReferenceNumber - FTA reference
   * @param {string} acknowledgement.ftaResponseDate - Response date
   * @param {number} acknowledgement.actualPenalty - Actual penalty amount
   * @param {string} acknowledgement.notes - Response notes
   * @returns {Promise<Object>}
   */
  async recordAcknowledgement(id, acknowledgement) {
    try {
      const response = await apiClient.post(`/vat-amendments/${id}/acknowledge`, acknowledgement);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] recordAcknowledgement failed:', error);
      throw error;
    }
  },

  /**
   * Record FTA rejection
   * @param {number|string} id - Amendment ID
   * @param {Object} rejection - Rejection details
   * @returns {Promise<Object>}
   */
  async recordRejection(id, rejection) {
    try {
      const response = await apiClient.post(`/vat-amendments/${id}/reject`, rejection);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] recordRejection failed:', error);
      throw error;
    }
  },

  /**
   * Cancel VAT amendment (draft/pending only)
   * @param {number|string} id - Amendment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancel(id, reason = '') {
    try {
      const response = await apiClient.post(`/vat-amendments/${id}/cancel`, {
        cancellationReason: reason,
      });
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] cancel failed:', error);
      throw error;
    }
  },

  /**
   * Calculate estimated penalty for an amendment
   * Based on UAE VAT penalty rules:
   * - 20% of unpaid tax as administrative penalty
   * - 1% monthly penalty (capped at 300%)
   * @param {number|string} id - Amendment ID
   * @returns {Promise<Object>} Penalty calculation details
   */
  async calculatePenalty(id) {
    try {
      const response = await apiClient.get(`/vat-amendments/${id}/calculate-penalty`);
      return response;
    } catch (error) {
      console.error('[VATAmendmentService] calculatePenalty failed:', error);
      throw error;
    }
  },

  /**
   * Calculate penalty preview without saving
   * @param {Object} params - Calculation parameters
   * @param {number} params.vatAmount - VAT amount in error
   * @param {string} params.originalFilingDate - Original return filing date
   * @param {string} params.discoveryDate - Date error discovered
   * @returns {Promise<Object>}
   */
  async calculatePenaltyPreview(params) {
    try {
      const response = await apiClient.post('/vat-amendments/calculate-penalty-preview', params);
      return response;
    } catch (error) {
      console.error('[VATAmendmentService] calculatePenaltyPreview failed:', error);
      throw error;
    }
  },

  /**
   * Record penalty payment
   * @param {number|string} id - Amendment ID
   * @param {Object} paymentData - Payment details
   * @returns {Promise<Object>}
   */
  async recordPenaltyPayment(id, paymentData) {
    try {
      const response = await apiClient.post(`/vat-amendments/${id}/pay-penalty`, paymentData);
      return transformAmendmentFromServer(response);
    } catch (error) {
      console.error('[VATAmendmentService] recordPenaltyPayment failed:', error);
      throw error;
    }
  },

  /**
   * Get next amendment number
   * @returns {Promise<Object>} { amendmentNumber: string }
   */
  async getNextNumber() {
    try {
      const response = await apiClient.get('/vat-amendments/number/next');
      return response;
    } catch (error) {
      console.error('[VATAmendmentService] getNextNumber failed:', error);
      throw error;
    }
  },

  /**
   * Get amendment summary/analytics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>}
   */
  async getSummary(params = {}) {
    try {
      const response = await apiClient.get('/vat-amendments/summary', params);
      return response;
    } catch (error) {
      console.error('[VATAmendmentService] getSummary failed:', error);
      throw error;
    }
  },

  /**
   * Get audit trail for an amendment
   * @param {number|string} id - Amendment ID
   * @returns {Promise<Array>}
   */
  async getAuditTrail(id) {
    try {
      const response = await apiClient.get(`/vat-amendments/${id}/audit-trail`);
      return response.data || response || [];
    } catch (error) {
      console.error('[VATAmendmentService] getAuditTrail failed:', error);
      throw error;
    }
  },

  /**
   * Generate voluntary disclosure form (PDF)
   * @param {number|string} id - Amendment ID
   * @returns {Promise<boolean>}
   */
  async downloadDisclosureForm(id) {
    try {
      const response = await apiClient.get(`/vat-amendments/${id}/disclosure-form`, {
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voluntary-disclosure-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('[VATAmendmentService] downloadDisclosureForm failed:', error);
      throw error;
    }
  },

  /**
   * Search amendments
   * @param {string} searchTerm - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>}
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await apiClient.get('/vat-amendments', {
        search: searchTerm,
        ...filters,
      });
      const amendments = response.data || response.items || response;
      return Array.isArray(amendments) ? amendments.map(transformAmendmentFromServer) : [];
    } catch (error) {
      console.error('[VATAmendmentService] search failed:', error);
      throw error;
    }
  },

  /**
   * Check if a VAT return requires amendment
   * Based on error threshold (>AED 10,000)
   * @param {number|string} vatReturnId - VAT return ID
   * @returns {Promise<Object>} { requiresAmendment: boolean, errorAmount: number, threshold: number }
   */
  async checkAmendmentRequired(vatReturnId) {
    try {
      const response = await apiClient.get(`/vat-amendments/check-required/${vatReturnId}`);
      return response;
    } catch (error) {
      console.error('[VATAmendmentService] checkAmendmentRequired failed:', error);
      throw error;
    }
  },
};

export default vatAmendmentService;
