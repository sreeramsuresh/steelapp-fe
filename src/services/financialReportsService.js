/**
 * Financial Reports Service
 * Frontend API layer for financial reports (Journal Register, Trial Balance, GL, COA)
 * Handles HTTP requests with multi-tenancy headers
 */

import { apiClient } from "./api";

class FinancialReportsService {
  /**
   * Get Trial Balance for accounting period
   */
  async getTrialBalance(periodId, options = {}) {
    try {
      const response = await apiClient.get("/financial-reports/trial-balance", {
        params: {
          periodId,
          includeZeroBalances: options.includeZeroBalances || false,
          accountCategory: options.accountCategory || null,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Trial Balance:", error);
      throw error;
    }
  }

  /**
   * Get Journal Register for date range
   */
  async getJournalRegister(options = {}) {
    try {
      const { startDate, endDate, sourceModule = null, page = 1, limit = 100 } = options;

      const response = await apiClient.get("/financial-reports/journal-register", {
        params: {
          startDate,
          endDate,
          sourceModule,
          page,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Journal Register:", error);
      throw error;
    }
  }

  /**
   * Get General Ledger for account
   */
  async getGeneralLedger(accountCode, options = {}) {
    try {
      const { startDate, endDate } = options;

      const response = await apiClient.get(`/financial-reports/general-ledger/${accountCode}`, {
        params: {
          startDate,
          endDate,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching General Ledger:", error);
      throw error;
    }
  }

  /**
   * Get Chart of Accounts
   */
  async getChartOfAccounts(options = {}) {
    try {
      const { category = null, type = null, includeInactive = false } = options;

      const response = await apiClient.get("/financial-reports/chart-of-accounts", {
        params: {
          category,
          type,
          includeInactive,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching Chart of Accounts:", error);
      throw error;
    }
  }

  /**
   * Validate Trial Balance before period close
   */
  async validateTrialBalance(periodId) {
    try {
      const response = await apiClient.post("/financial-reports/validate-trial-balance", {
        periodId,
      });
      return response.data;
    } catch (error) {
      console.error("Error validating Trial Balance:", error);
      throw error;
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value) || 0);
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-AE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

export default new FinancialReportsService();
