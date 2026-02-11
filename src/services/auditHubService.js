import api from "./api.js";

/**
 * Audit Hub Service - API client for audit hub operations
 * Handles communication with backend audit endpoints
 *
 * Note: company_id is extracted from the JWT token by the API Gateway's
 * multiTenancyGuard middleware. No need to pass X-Company-Id headers.
 */

class AuditHubService {
  // Accounting Periods
  async getPeriods(_companyId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append("year", filters.year);
      if (filters.status) params.append("status", filters.status);

      const response = await api.get(`/accounting-periods?${params.toString()}`);
      return Array.isArray(response) ? response : response?.data || [];
    } catch (error) {
      console.error("[AuditHub] Get periods error:", error);
      throw error;
    }
  }

  async getPeriodById(_companyId, periodId) {
    try {
      const response = await api.get(`/accounting-periods/${periodId}`);
      return response?.data || response;
    } catch (error) {
      console.error("[AuditHub] Get period error:", error);
      throw error;
    }
  }

  async createPeriod(_companyId, periodType, year, month) {
    try {
      const response = await api.post("/accounting-periods", {
        periodType,
        year,
        month,
      });
      return response;
    } catch (error) {
      console.error("[AuditHub] Create period error:", error);
      throw error;
    }
  }

  async closePeriod(_companyId, periodId) {
    try {
      const response = await api.post(`/accounting-periods/${periodId}/close`, {});
      return response;
    } catch (error) {
      console.error("[AuditHub] Close period error:", error);
      throw error;
    }
  }

  async lockPeriod(_companyId, periodId) {
    try {
      const response = await api.post(`/accounting-periods/${periodId}/lock`, {});
      return response;
    } catch (error) {
      console.error("[AuditHub] Lock period error:", error);
      throw error;
    }
  }

  // Datasets
  async getDatasets(_companyId, periodId) {
    try {
      const response = await api.get(`/audit-hub/datasets?period_id=${periodId}`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get datasets error:", error);
      throw error;
    }
  }

  async getDatasetById(_companyId, datasetId) {
    try {
      const response = await api.get(`/audit-hub/datasets/${datasetId}`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get dataset error:", error);
      throw error;
    }
  }

  async getDatasetTransactions(_companyId, datasetId, module, pagination = {}) {
    try {
      const params = new URLSearchParams();
      params.append("module", module);
      if (pagination.page) params.append("page", pagination.page);
      if (pagination.limit) params.append("limit", pagination.limit);

      const response = await api.get(`/audit-hub/datasets/${datasetId}/transactions?${params.toString()}`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get transactions error:", error);
      throw error;
    }
  }

  // Exports
  async generateExcelExport(_companyId, datasetId) {
    try {
      const response = await api.post(`/audit-hub/datasets/${datasetId}/export/excel`, {});
      return response;
    } catch (error) {
      console.error("[AuditHub] Generate Excel error:", error);
      throw error;
    }
  }

  async generatePDFExport(_companyId, datasetId) {
    try {
      const response = await api.post(`/audit-hub/datasets/${datasetId}/export/pdf`, {});
      return response;
    } catch (error) {
      console.error("[AuditHub] Generate PDF error:", error);
      throw error;
    }
  }

  async generateCSVExport(_companyId, datasetId, module) {
    try {
      const response = await api.post(`/audit-hub/datasets/${datasetId}/export/csv/${module.toLowerCase()}`, {});
      return response;
    } catch (error) {
      console.error("[AuditHub] Generate CSV error:", error);
      throw error;
    }
  }

  async getExportStatus(_companyId, datasetId) {
    try {
      const response = await api.get(`/audit-hub/datasets/${datasetId}/export/status`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get export status error:", error);
      throw error;
    }
  }

  async downloadExport(_companyId, datasetId, exportType) {
    try {
      const response = await api.get(`/audit-hub/exports/download/${datasetId}/${exportType.toLowerCase()}`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Download export error:", error);
      throw error;
    }
  }

  async verifyExportRegeneration(_companyId, datasetId, exportType) {
    try {
      const response = await api.post(`/audit-hub/datasets/${datasetId}/export/verify`, {
        export_type: exportType,
      });
      return response;
    } catch (error) {
      console.error("[AuditHub] Verify export error:", error);
      throw error;
    }
  }

  // Reconciliations
  async getReconciliations(_companyId, fiscalPeriod) {
    try {
      const response = await api.get(`/reconciliations?fiscal_period=${fiscalPeriod}`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get reconciliations error:", error);
      throw error;
    }
  }

  async reconcileAR(_companyId, fiscalPeriod) {
    try {
      const response = await api.post("/reconciliations/ar", { fiscal_period: fiscalPeriod });
      return response;
    } catch (error) {
      console.error("[AuditHub] AR reconciliation error:", error);
      throw error;
    }
  }

  async reconcileAP(_companyId, fiscalPeriod) {
    try {
      const response = await api.post("/reconciliations/ap", { fiscal_period: fiscalPeriod });
      return response;
    } catch (error) {
      console.error("[AuditHub] AP reconciliation error:", error);
      throw error;
    }
  }

  async reconcileInventory(_companyId, fiscalPeriod) {
    try {
      const response = await api.post("/reconciliations/inventory", { fiscal_period: fiscalPeriod });
      return response;
    } catch (error) {
      console.error("[AuditHub] Inventory reconciliation error:", error);
      throw error;
    }
  }

  async getReconciliationExceptions(_companyId, reconciliationId) {
    try {
      const response = await api.get(`/reconciliations/${reconciliationId}/exceptions`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get exceptions error:", error);
      throw error;
    }
  }

  // Sign-Offs
  async submitSignOff(_companyId, datasetId, signOffType, notes) {
    try {
      const response = await api.post("/audit-hub/sign-offs", { datasetId, signOffType, notes });
      return response;
    } catch (error) {
      console.error("[AuditHub] Submit sign-off error:", error);
      throw error;
    }
  }

  async getSignOffs(_companyId, datasetId) {
    try {
      const response = await api.get(`/audit-hub/sign-offs/dataset/${datasetId}`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get sign-offs error:", error);
      throw error;
    }
  }

  async getSignOffStatus(_companyId, datasetId) {
    try {
      const response = await api.get(`/audit-hub/sign-offs/dataset/${datasetId}/status`);
      return response;
    } catch (error) {
      console.error("[AuditHub] Get sign-off status error:", error);
      throw error;
    }
  }

  async approveSignOff(_companyId, signOffId, approvalNotes) {
    try {
      const response = await api.post(`/audit-hub/sign-offs/${signOffId}/approve`, { approvalNotes });
      return response;
    } catch (error) {
      console.error("[AuditHub] Approve sign-off error:", error);
      throw error;
    }
  }

  async rejectSignOff(_companyId, signOffId, rejectionReason) {
    try {
      const response = await api.post(`/audit-hub/sign-offs/${signOffId}/reject`, { rejectionReason });
      return response;
    } catch (error) {
      console.error("[AuditHub] Reject sign-off error:", error);
      throw error;
    }
  }
}

export const auditHubService = new AuditHubService();
export default auditHubService;
