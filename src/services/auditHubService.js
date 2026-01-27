import api from './api';

/**
 * Audit Hub Service - API client for audit hub operations
 * Handles communication with backend audit endpoints
 */

class AuditHubService {
  // Accounting Periods
  async getPeriods(companyId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(
        `/accounting-periods?${params.toString()}`,
        {
          headers: { 'X-Company-Id': companyId },
        },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get periods error:', error);
      throw error;
    }
  }

  async getPeriodById(companyId, periodId) {
    try {
      const response = await api.get(`/accounting-periods/${periodId}`, {
        headers: { 'X-Company-Id': companyId },
      });
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get period error:', error);
      throw error;
    }
  }

  async createPeriod(companyId, periodType, year, month) {
    try {
      const response = await api.post(
        '/accounting-periods',
        {
          periodType,
          year,
          month,
        },
        {
          headers: { 'X-Company-Id': companyId },
        },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Create period error:', error);
      throw error;
    }
  }

  async closePeriod(companyId, periodId) {
    try {
      const response = await api.post(
        `/accounting-periods/${periodId}/close`,
        {},
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Close period error:', error);
      throw error;
    }
  }

  async lockPeriod(companyId, periodId) {
    try {
      const response = await api.post(
        `/accounting-periods/${periodId}/lock`,
        {},
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Lock period error:', error);
      throw error;
    }
  }

  // Datasets
  async getDatasets(companyId, periodId) {
    try {
      const response = await api.get(
        `/audit-hub/datasets?period_id=${periodId}`,
        {
          headers: { 'X-Company-Id': companyId },
        },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get datasets error:', error);
      throw error;
    }
  }

  async getDatasetById(companyId, datasetId) {
    try {
      const response = await api.get(`/audit-hub/datasets/${datasetId}`, {
        headers: { 'X-Company-Id': companyId },
      });
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get dataset error:', error);
      throw error;
    }
  }

  async getDatasetTransactions(companyId, datasetId, module, pagination = {}) {
    try {
      const params = new URLSearchParams();
      params.append('module', module);
      if (pagination.page) params.append('page', pagination.page);
      if (pagination.limit) params.append('limit', pagination.limit);

      const response = await api.get(
        `/audit-hub/datasets/${datasetId}/transactions?${params.toString()}`,
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get transactions error:', error);
      throw error;
    }
  }

  // Exports
  async generateExcelExport(companyId, datasetId) {
    try {
      const response = await api.post(
        `/audit-hub/datasets/${datasetId}/export/excel`,
        {},
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Generate Excel error:', error);
      throw error;
    }
  }

  async generatePDFExport(companyId, datasetId) {
    try {
      const response = await api.post(
        `/audit-hub/datasets/${datasetId}/export/pdf`,
        {},
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Generate PDF error:', error);
      throw error;
    }
  }

  async generateCSVExport(companyId, datasetId, module) {
    try {
      const response = await api.post(
        `/audit-hub/datasets/${datasetId}/export/csv/${module.toLowerCase()}`,
        {},
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Generate CSV error:', error);
      throw error;
    }
  }

  async getExportStatus(companyId, datasetId) {
    try {
      const response = await api.get(
        `/audit-hub/datasets/${datasetId}/export/status`,
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get export status error:', error);
      throw error;
    }
  }

  async downloadExport(companyId, datasetId, exportType) {
    try {
      const response = await api.get(
        `/audit-hub/exports/download/${datasetId}/${exportType.toLowerCase()}`,
        {
          headers: { 'X-Company-Id': companyId },
          responseType: 'blob',
        },
      );
      return response;
    } catch (error) {
      console.error('[AuditHub] Download export error:', error);
      throw error;
    }
  }

  async verifyExportRegeneration(companyId, datasetId, exportType) {
    try {
      const response = await api.post(
        `/audit-hub/datasets/${datasetId}/export/verify`,
        { export_type: exportType },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Verify export error:', error);
      throw error;
    }
  }

  // Reconciliations
  async getReconciliations(companyId, fiscalPeriod) {
    try {
      const response = await api.get(
        `/reconciliations?fiscal_period=${fiscalPeriod}`,
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get reconciliations error:', error);
      throw error;
    }
  }

  async reconcileAR(companyId, fiscalPeriod) {
    try {
      const response = await api.post(
        '/reconciliations/ar',
        { fiscal_period: fiscalPeriod },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] AR reconciliation error:', error);
      throw error;
    }
  }

  async reconcileAP(companyId, fiscalPeriod) {
    try {
      const response = await api.post(
        '/reconciliations/ap',
        { fiscal_period: fiscalPeriod },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] AP reconciliation error:', error);
      throw error;
    }
  }

  async reconcileInventory(companyId, fiscalPeriod) {
    try {
      const response = await api.post(
        '/reconciliations/inventory',
        { fiscal_period: fiscalPeriod },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Inventory reconciliation error:', error);
      throw error;
    }
  }

  async getReconciliationExceptions(companyId, reconciliationId) {
    try {
      const response = await api.get(
        `/reconciliations/${reconciliationId}/exceptions`,
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get exceptions error:', error);
      throw error;
    }
  }

  // Sign-Offs
  async submitSignOff(companyId, datasetId, signOffType, notes) {
    try {
      const response = await api.post(
        '/audit-hub/sign-offs',
        { datasetId, signOffType, notes },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Submit sign-off error:', error);
      throw error;
    }
  }

  async getSignOffs(companyId, datasetId) {
    try {
      const response = await api.get(
        `/audit-hub/sign-offs/dataset/${datasetId}`,
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get sign-offs error:', error);
      throw error;
    }
  }

  async getSignOffStatus(companyId, datasetId) {
    try {
      const response = await api.get(
        `/audit-hub/sign-offs/dataset/${datasetId}/status`,
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Get sign-off status error:', error);
      throw error;
    }
  }

  async approveSignOff(companyId, signOffId, approvalNotes) {
    try {
      const response = await api.post(
        `/audit-hub/sign-offs/${signOffId}/approve`,
        { approvalNotes },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Approve sign-off error:', error);
      throw error;
    }
  }

  async rejectSignOff(companyId, signOffId, rejectionReason) {
    try {
      const response = await api.post(
        `/audit-hub/sign-offs/${signOffId}/reject`,
        { rejectionReason },
        { headers: { 'X-Company-Id': companyId } },
      );
      return response.data;
    } catch (error) {
      console.error('[AuditHub] Reject sign-off error:', error);
      throw error;
    }
  }
}

export default new AuditHubService();
