/**
 * VAT Service - Frontend API Client for VAT Management
 * Connects to backend VAT Management gRPC service via API Gateway
 */

import { apiClient } from "./api";

export const vatService = {
  // ============================================
  // VAT Return (Form 201) Operations
  // ============================================

  /**
   * List VAT returns with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default 1)
   * @param {number} params.limit - Items per page (default 20)
   * @param {string} params.status - Filter by status (draft, pending_review, submitted, filed, amended)
   * @param {number} params.year - Filter by year
   */
  async getVATReturns(params = {}) {
    return apiClient.get("/vat-return", params);
  },

  /**
   * Get single VAT return by ID
   * @param {number} id - VAT return ID
   */
  async getVATReturn(id) {
    return apiClient.get(`/vat-return/${id}`);
  },

  /**
   * Generate new VAT return for a period
   * @param {Object} data - Period data
   * @param {string} data.period_start - Start date (ISO format)
   * @param {string} data.period_end - End date (ISO format)
   */
  async generateVATReturn(data) {
    return apiClient.post("/vat-return/generate", data);
  },

  /**
   * Preview VAT return before submission
   * @param {Object} params - Query parameters
   * @param {string} params.period_start - Start date
   * @param {string} params.period_end - End date
   */
  async getVATReturnPreview(params = {}) {
    return apiClient.get("/vat-return/preview", params);
  },

  /**
   * Submit VAT return to FTA
   * @param {number} id - VAT return ID
   * @param {Object} data - Submission data
   * @param {string} data.notes - Optional notes
   */
  async submitVATReturn(id, data = {}) {
    return apiClient.post(`/vat-return/${id}/submit`, data);
  },

  /**
   * Get Form 201 structured data for a VAT return
   * @param {number} id - VAT return ID
   * @param {Object} params - Query parameters
   */
  async getForm201Data(id, params = {}) {
    return apiClient.get(`/vat-return/${id}/form-201`, params);
  },

  /**
   * Get VAT return reconciliation report
   * @param {number} id - VAT return ID
   * @param {Object} params - Query parameters
   */
  async getVATReconciliation(id, params = {}) {
    return apiClient.get(`/vat-return/${id}/reconciliation`, params);
  },

  /**
   * Get VAT audit trail for a period
   * @param {number} id - VAT return ID
   * @param {Object} params - Query parameters
   */
  async getVATAuditTrail(id, params = {}) {
    return apiClient.get(`/vat-return/${id}/audit-trail`, params);
  },

  /**
   * Get list of UAE Emirates (static data)
   */
  async getEmirates() {
    return apiClient.get("/vat-return/emirates");
  },

  // ============================================
  // VAT Adjustments
  // ============================================

  /**
   * List VAT adjustments
   * @param {Object} params - Query parameters
   */
  async getVATAdjustments(params = {}) {
    return apiClient.get("/vat-return/adjustments", params);
  },

  /**
   * Get single VAT adjustment
   * @param {number} id - Adjustment ID
   */
  async getVATAdjustment(id) {
    return apiClient.get(`/vat-return/adjustments/${id}`);
  },

  /**
   * Create VAT adjustment
   * @param {Object} data - Adjustment data
   */
  async createVATAdjustment(data) {
    return apiClient.post("/vat-return/adjustments", data);
  },

  /**
   * Update VAT adjustment
   * @param {number} id - Adjustment ID
   * @param {Object} data - Updated data
   */
  async updateVATAdjustment(id, data) {
    return apiClient.put(`/vat-return/adjustments/${id}`, data);
  },

  /**
   * Approve VAT adjustment
   * @param {number} id - Adjustment ID
   * @param {Object} data - Approval data
   */
  async approveVATAdjustment(id, data = {}) {
    return apiClient.post(`/vat-return/adjustments/${id}/approve`, data);
  },

  /**
   * Reject VAT adjustment
   * @param {number} id - Adjustment ID
   * @param {Object} data - Rejection data (rejection_reason)
   */
  async rejectVATAdjustment(id, data) {
    return apiClient.post(`/vat-return/adjustments/${id}/reject`, data);
  },

  // ============================================
  // VAT Return Amendments
  // ============================================

  /**
   * List VAT return amendments
   * @param {Object} params - Query parameters
   */
  async getVATAmendments(params = {}) {
    return apiClient.get("/vat-return/amendments", params);
  },

  /**
   * Get single VAT amendment
   * @param {number} id - Amendment ID
   */
  async getVATAmendment(id) {
    return apiClient.get(`/vat-return/amendments/${id}`);
  },

  /**
   * Create VAT return amendment
   * @param {Object} data - Amendment data
   */
  async createVATAmendment(data) {
    return apiClient.post("/vat-return/amendments", data);
  },

  /**
   * Submit VAT amendment to FTA
   * @param {number} id - Amendment ID
   */
  async submitVATAmendment(id) {
    return apiClient.post(`/vat-return/amendments/${id}/submit`);
  },

  /**
   * Calculate amendment penalty
   * @param {number} id - Amendment ID
   * @param {Object} params - Query parameters
   */
  async calculateAmendmentPenalty(id, params = {}) {
    return apiClient.get(`/vat-return/amendments/${id}/penalty`, params);
  },

  // ============================================
  // Blocked VAT
  // ============================================

  /**
   * List blocked VAT categories with summaries
   */
  async getBlockedVATCategories() {
    return apiClient.get("/vat-return/blocked-vat/categories");
  },

  /**
   * Get blocked VAT log entries
   * @param {Object} params - Query parameters
   */
  async getBlockedVATLog(params = {}) {
    return apiClient.get("/vat-return/blocked-vat/log", params);
  },

  /**
   * Record blocked VAT entry
   * @param {Object} data - Blocked VAT data
   */
  async recordBlockedVAT(data) {
    return apiClient.post("/vat-return/blocked-vat/record", data);
  },

  // ============================================
  // Dashboard Helpers
  // ============================================

  /**
   * Get VAT dashboard metrics for the current quarter
   * Aggregates data from multiple endpoints for dashboard display
   */
  async getVATDashboardMetrics() {
    const currentDate = new Date();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
    const currentYear = currentDate.getFullYear();
    const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
    const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);

    try {
      // Fetch VAT returns and blocked VAT categories in parallel
      const [returnsData, blockedCategories] = await Promise.all([
        this.getVATReturns({
          year: currentYear,
          limit: 4, // Last 4 quarters
        }).catch(() => ({ data: [] })),
        this.getBlockedVATCategories().catch(() => ({
          categories: [],
          total_blocked_vat: 0,
        })),
      ]);

      // Find current quarter return or most recent
      const currentReturn = (returnsData.data || []).find((r) => {
        const returnStart = new Date(r.periodStart || r.period_start);
        return returnStart >= quarterStart && returnStart <= quarterEnd;
      });

      // Calculate metrics
      const metrics = {
        currentPeriod: {
          quarter: `Q${currentQuarter}`,
          year: currentYear,
          startDate: quarterStart.toISOString(),
          endDate: quarterEnd.toISOString(),
        },
        collection: {
          outputVAT: 0,
          inputVAT: 0,
          netPayable: 0,
          adjustments: 0,
        },
        returnStatus: {
          status: currentReturn?.status || "pending",
          dueDate: new Date(
            currentYear,
            currentQuarter * 3 + 1,
            28,
          ).toISOString(),
          daysRemaining: Math.max(
            0,
            Math.ceil(
              (new Date(currentYear, currentQuarter * 3 + 1, 28) -
                currentDate) /
                (1000 * 60 * 60 * 24),
            ),
          ),
          filedDate: currentReturn?.filedAt || currentReturn?.filed_at || null,
        },
        compliance: {
          invoicesWithVAT: 0,
          invoicesWithoutVAT: 0,
          zeroRatedSales: 0,
          exemptSales: 0,
        },
        blockedVAT: {
          total: parseFloat(blockedCategories.total_blocked_vat) || 0,
          categories: blockedCategories.categories || [],
        },
        alerts: [],
        history: (returnsData.data || []).slice(0, 4).map((r) => ({
          quarter:
            r.quarter ||
            `Q${Math.ceil((new Date(r.periodStart || r.period_start).getMonth() + 1) / 3)}`,
          year: new Date(r.periodStart || r.period_start).getFullYear(),
          outputVAT:
            parseFloat(
              r.form201?.box8TotalOutputVat ||
                r.form_201?.box_8_total_output_vat,
            ) || 0,
          inputVAT:
            parseFloat(
              r.form201?.box12TotalInputVat ||
                r.form_201?.box_12_total_input_vat,
            ) || 0,
          netPaid:
            parseFloat(
              r.form201?.box15NetVatDue || r.form_201?.box_15_net_vat_due,
            ) || 0,
          status: r.status || "unknown",
        })),
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };

      // If we have a current return, extract Form 201 data
      if (currentReturn?.form201 || currentReturn?.form_201) {
        const form = currentReturn.form201 || currentReturn.form_201;
        metrics.collection = {
          outputVAT:
            parseFloat(
              form.box8TotalOutputVat || form.box_8_total_output_vat,
            ) || 0,
          inputVAT:
            parseFloat(
              form.box12TotalInputVat || form.box_12_total_input_vat,
            ) || 0,
          netPayable:
            parseFloat(form.box15NetVatDue || form.box_15_net_vat_due) || 0,
          adjustments:
            (parseFloat(
              form.box7OutputAdjustments || form.box_7_output_adjustments,
            ) || 0) +
            (parseFloat(
              form.box11InputAdjustments || form.box_11_input_adjustments,
            ) || 0),
        };
      }

      // Add alerts based on data
      const daysUntilDue = metrics.returnStatus.daysRemaining;
      if (
        daysUntilDue <= 15 &&
        daysUntilDue > 0 &&
        metrics.returnStatus.status !== "filed"
      ) {
        metrics.alerts.push({
          type: "warning",
          message: `VAT return due in ${daysUntilDue} days`,
          severity: daysUntilDue <= 7 ? "high" : "medium",
        });
      }

      if (metrics.blockedVAT.total > 0) {
        metrics.alerts.push({
          type: "info",
          message: `AED ${metrics.blockedVAT.total.toLocaleString()} in blocked VAT this quarter`,
          severity: "low",
        });
      }

      return metrics;
    } catch (error) {
      console.error(
        "[vatService] Error fetching VAT dashboard metrics:",
        error,
      );
      throw error;
    }
  },
};

export default vatService;
