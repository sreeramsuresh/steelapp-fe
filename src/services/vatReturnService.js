/**
 * UAE VAT Return Service - Enhanced for Full VAT Compliance
 *
 * Frontend service for interacting with VAT Return API endpoints.
 * Supports Form 201 generation, filing, and audit trail.
 *
 * UAE VAT Return Boxes (Form 201):
 * Box 1: Standard rated supplies in UAE
 * Box 2: Tax refunds for tourists (not applicable for B2B)
 * Box 3: Zero-rated supplies
 * Box 4: Exempt supplies
 * Box 5: Goods imported into UAE
 * Box 6: Adjustments to goods imported
 * Box 7: Total value of due tax (calculated)
 * Box 8: Standard rated expenses
 * Box 9: Supplies subject to reverse charge
 * Box 10: Recoverable input tax (calculated)
 * Box 11: Net VAT due (Box 7 - Box 10)
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 */

import { apiClient } from './api';

// ============================================================================
// CONSTANTS
// ============================================================================

export const VAT_RETURN_STATUSES = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  REVIEW: 'review',
  SUBMITTED: 'submitted',
  FILED: 'filed',
  AMENDED: 'amended',
};

export const FORM_201_BOXES = {
  BOX_1: { number: 1, label: 'Standard rated supplies in UAE', type: 'output' },
  BOX_2: { number: 2, label: 'Tax refunds for tourists', type: 'output' },
  BOX_3: { number: 3, label: 'Zero-rated supplies', type: 'output' },
  BOX_4: { number: 4, label: 'Exempt supplies', type: 'output' },
  BOX_5: { number: 5, label: 'Goods imported into UAE', type: 'output' },
  BOX_6: { number: 6, label: 'Adjustments to goods imported', type: 'adjustment' },
  BOX_7: { number: 7, label: 'Total value of due tax', type: 'calculated' },
  BOX_8: { number: 8, label: 'Standard rated expenses', type: 'input' },
  BOX_9: { number: 9, label: 'Supplies subject to reverse charge', type: 'input' },
  BOX_10: { number: 10, label: 'Recoverable input tax', type: 'calculated' },
  BOX_11: { number: 11, label: 'Net VAT due', type: 'calculated' },
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

/**
 * Transform VAT return data from server
 */
const transformVatReturnFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId,
    returnNumber: serverData.returnNumber || '',
    periodStart: serverData.periodStart || serverData.startDate,
    periodEnd: serverData.periodEnd || serverData.endDate,
    status: serverData.status || 'draft',
    // Form 201 Boxes
    box1Amount: parseFloat(serverData.box1Amount || 0),
    box1Vat: parseFloat(serverData.box1Vat || 0),
    box2Amount: parseFloat(serverData.box2Amount || 0),
    box2Vat: parseFloat(serverData.box2Vat || 0),
    box3Amount: parseFloat(serverData.box3Amount || 0),
    box4Amount: parseFloat(serverData.box4Amount || 0),
    box5Amount: parseFloat(serverData.box5Amount || 0),
    box5Vat: parseFloat(serverData.box5Vat || 0),
    box6Amount: parseFloat(serverData.box6Amount || 0),
    box6Vat: parseFloat(serverData.box6Vat || 0),
    box7Vat: parseFloat(serverData.box7Vat || 0), // Total output VAT
    box8Amount: parseFloat(serverData.box8Amount || 0),
    box8Vat: parseFloat(serverData.box8Vat || 0),
    box9Amount: parseFloat(serverData.box9Amount || 0),
    box9Vat: parseFloat(serverData.box9Vat || 0),
    box10Vat: parseFloat(serverData.box10Vat || 0), // Total input VAT
    box11Vat: parseFloat(serverData.box11Vat || 0), // Net VAT payable/refundable
    // Totals
    totalOutputVat: parseFloat(serverData.totalOutputVat || serverData.box7Vat || 0),
    totalInputVat: parseFloat(serverData.totalInputVat || serverData.box10Vat || 0),
    netVatDue: parseFloat(serverData.netVatDue || serverData.box11Vat || 0),
    // Adjustments
    adjustmentsTotal: parseFloat(serverData.adjustmentsTotal || 0),
    blockedVatTotal: parseFloat(serverData.blockedVatTotal || 0),
    // Filing info
    filedAt: serverData.filedAt || null,
    filedBy: serverData.filedBy || null,
    ftaReferenceNumber: serverData.ftaReferenceNumber || '',
    ftaSubmissionDate: serverData.ftaSubmissionDate || null,
    // Timestamps
    createdAt: serverData.createdAt || null,
    updatedAt: serverData.updatedAt || null,
    generatedAt: serverData.generatedAt || null,
    // Notes
    notes: serverData.notes || '',
  };
};

// ============================================================================
// VAT RETURN SERVICE
// ============================================================================

const vatReturnService = {
  /**
   * Get available VAT periods
   * @returns {Promise<Array>} List of available periods
   */
  async getPeriods() {
    try {
      const response = await apiClient.get('/vat-return/periods');
      return response.data || response || [];
    } catch (error) {
      console.error('[VATReturnService] getPeriods failed:', error);
      throw error;
    }
  },

  /**
   * Generate VAT return report for a period
   * Creates draft VAT return with all calculations
   * @param {Object} periodData - Period details
   * @param {string} periodData.startDate - Period start date (YYYY-MM-DD)
   * @param {string} periodData.endDate - Period end date (YYYY-MM-DD)
   * @returns {Promise<Object>} Generated VAT return data
   */
  async generateReturn(periodData) {
    try {
      const response = await apiClient.post('/vat-returns/generate', {
        startDate: periodData.startDate,
        endDate: periodData.endDate,
      });
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] generateReturn failed:', error);
      throw error;
    }
  },

  /**
   * Generate VAT return report (legacy method)
   * @param {string} startDate - Period start date (YYYY-MM-DD)
   * @param {string} endDate - Period end date (YYYY-MM-DD)
   * @returns {Promise<Object>} VAT return data
   */
  async generateReport(startDate, endDate) {
    try {
      const response = await apiClient.get('/vat-return/generate', {
        params: { startDate, endDate }
      });
      return response.data || response;
    } catch (error) {
      console.error('[VATReturnService] generateReport failed:', error);
      throw error;
    }
  },

  /**
   * Save VAT return to database
   * @param {string} startDate - Period start date
   * @param {string} endDate - Period end date
   * @returns {Promise<Object>} Saved VAT return
   */
  async saveReport(startDate, endDate) {
    try {
      const response = await apiClient.post('/vat-return/save', {
        startDate,
        endDate
      });
      return transformVatReturnFromServer(response.data || response);
    } catch (error) {
      console.error('[VATReturnService] saveReport failed:', error);
      throw error;
    }
  },

  /**
   * Get list of valid UAE emirates
   * @returns {Promise<Array>} List of emirates
   */
  async getEmirates() {
    try {
      const response = await apiClient.get('/vat-return/emirates');
      return response.data || response || [];
    } catch (error) {
      console.error('[VATReturnService] getEmirates failed:', error);
      throw error;
    }
  },

  /**
   * Get all VAT returns with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {string} params.status - Filter by status
   * @param {string} params.year - Filter by year
   * @param {AbortSignal} signal - Optional abort signal
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async getAll(params = {}, signal = null) {
    try {
      const queryParams = {
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 50,
        status: params.status || undefined,
        year: params.year || undefined,
      };

      Object.keys(queryParams).forEach(
        (key) => queryParams[key] === undefined && delete queryParams[key]
      );

      const axiosConfig = { ...queryParams };
      if (signal) {
        axiosConfig.signal = signal;
      }

      const response = await apiClient.get('/vat-returns', axiosConfig);

      if (response.data && Array.isArray(response.data)) {
        return {
          data: response.data.map(transformVatReturnFromServer),
          pagination: response.pagination || null,
        };
      }

      if (Array.isArray(response)) {
        return {
          data: response.map(transformVatReturnFromServer),
          pagination: null,
        };
      }

      return { data: [], pagination: null };
    } catch (error) {
      console.error('[VATReturnService] getAll failed:', error);
      throw error;
    }
  },

  /**
   * Get single VAT return by ID
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}`);
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] getById failed:', error);
      throw error;
    }
  },

  /**
   * Get preview of VAT return before filing
   * Shows all supporting documents and calculations
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>}
   */
  async getPreview(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/preview`);
      return response;
    } catch (error) {
      console.error('[VATReturnService] getPreview failed:', error);
      throw error;
    }
  },

  /**
   * Submit VAT return to FTA
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>}
   */
  async submitReturn(id) {
    try {
      const response = await apiClient.post(`/vat-returns/${id}/submit`);
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] submitReturn failed:', error);
      throw error;
    }
  },

  /**
   * Mark VAT return as filed with FTA
   * @param {number|string} id - VAT return ID
   * @param {Object} filingData - Filing details
   * @param {string} filingData.ftaReferenceNumber - FTA reference
   * @param {string} filingData.ftaSubmissionDate - Submission date
   * @returns {Promise<Object>}
   */
  async markAsFiled(id, filingData) {
    try {
      const response = await apiClient.post(`/vat-returns/${id}/file`, filingData);
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] markAsFiled failed:', error);
      throw error;
    }
  },

  /**
   * Get Form 201 data with all 11 boxes
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>} Form 201 structured data
   */
  async getForm201Data(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/form-201`);
      return response;
    } catch (error) {
      console.error('[VATReturnService] getForm201Data failed:', error);
      throw error;
    }
  },

  /**
   * Get audit trail for VAT return
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Array>}
   */
  async getAuditTrail(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/audit-trail`);
      return response.data || response || [];
    } catch (error) {
      console.error('[VATReturnService] getAuditTrail failed:', error);
      throw error;
    }
  },

  /**
   * Get reconciliation report for VAT return
   * Shows breakdown of all transactions included
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>}
   */
  async getReconciliation(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/reconciliation`);
      return response;
    } catch (error) {
      console.error('[VATReturnService] getReconciliation failed:', error);
      throw error;
    }
  },

  /**
   * Get supporting documents for a VAT return
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>} Grouped supporting documents
   */
  async getSupportingDocuments(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/supporting-documents`);
      return response;
    } catch (error) {
      console.error('[VATReturnService] getSupportingDocuments failed:', error);
      throw error;
    }
  },

  /**
   * Get blocked VAT categories (non-recoverable input VAT)
   * Per UAE VAT rules, certain categories cannot be claimed
   * @returns {Promise<Array>}
   */
  async getBlockedVATCategories() {
    try {
      const response = await apiClient.get('/vat-return/blocked-vat/categories');
      return response.data || response || [];
    } catch (error) {
      console.error('[VATReturnService] getBlockedVATCategories failed:', error);
      throw error;
    }
  },

  /**
   * Get blocked VAT log for a period
   * Shows all expenses where VAT was blocked
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Period start
   * @param {string} params.endDate - Period end
   * @param {string} params.category - Optional category filter
   * @returns {Promise<Object>}
   */
  async getBlockedVATLog(params = {}) {
    try {
      const response = await apiClient.get('/vat-return/blocked-vat/log', { params });
      return response;
    } catch (error) {
      console.error('[VATReturnService] getBlockedVATLog failed:', error);
      throw error;
    }
  },

  /**
   * Update VAT return status
   * @param {number|string} id - VAT return ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    try {
      const response = await apiClient.patch(`/vat-returns/${id}/status`, { status });
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] updateStatus failed:', error);
      throw error;
    }
  },

  /**
   * Add notes to VAT return
   * @param {number|string} id - VAT return ID
   * @param {string} notes - Notes to add
   * @returns {Promise<Object>}
   */
  async addNotes(id, notes) {
    try {
      const response = await apiClient.patch(`/vat-returns/${id}/notes`, { notes });
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] addNotes failed:', error);
      throw error;
    }
  },

  /**
   * Delete VAT return (draft only)
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`/vat-returns/${id}`);
      return response;
    } catch (error) {
      console.error('[VATReturnService] delete failed:', error);
      throw error;
    }
  },

  /**
   * Download VAT return as PDF (Form 201 format)
   * @param {number|string} id - VAT return ID
   * @param {string} returnNumber - For filename
   * @returns {Promise<boolean>}
   */
  async downloadPDF(id, returnNumber = null) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vat-return-${returnNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('[VATReturnService] downloadPDF failed:', error);
      throw error;
    }
  },

  /**
   * Export VAT return data as Excel
   * @param {number|string} id - VAT return ID
   * @returns {Promise<boolean>}
   */
  async exportExcel(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/export/excel`, {
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vat-return-${id}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('[VATReturnService] exportExcel failed:', error);
      throw error;
    }
  },

  /**
   * Get VAT return analytics/summary
   * @param {Object} params - Query parameters
   * @param {string} params.year - Year filter
   * @returns {Promise<Object>}
   */
  async getAnalytics(params = {}) {
    try {
      const response = await apiClient.get('/vat-returns/analytics', params);
      return response;
    } catch (error) {
      console.error('[VATReturnService] getAnalytics failed:', error);
      throw error;
    }
  },

  /**
   * Validate VAT return before submission
   * Checks for completeness and accuracy
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>} { valid: boolean, errors: Array, warnings: Array }
   */
  async validate(id) {
    try {
      const response = await apiClient.get(`/vat-returns/${id}/validate`);
      return response;
    } catch (error) {
      console.error('[VATReturnService] validate failed:', error);
      throw error;
    }
  },

  /**
   * Recalculate VAT return
   * Updates all box values based on current transactions
   * @param {number|string} id - VAT return ID
   * @returns {Promise<Object>}
   */
  async recalculate(id) {
    try {
      const response = await apiClient.post(`/vat-returns/${id}/recalculate`);
      return transformVatReturnFromServer(response);
    } catch (error) {
      console.error('[VATReturnService] recalculate failed:', error);
      throw error;
    }
  },
};

export default vatReturnService;
