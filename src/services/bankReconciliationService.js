import { apiClient } from "./api";

class BankReconciliationService {
  /**
   * Get Bank Ledger for account
   */
  async getBankLedger(accountCode, startDate, endDate) {
    const response = await apiClient.get(`/bank-reconciliation/bank-ledger/${accountCode}`, {
      params: { startDate, endDate },
    });
    return response.data;
  }

  /**
   * Get Bank Reconciliation Statement
   */
  async getBankReconciliation(statementId) {
    const response = await apiClient.get(`/bank-reconciliation/brs/${statementId}`);
    return response.data;
  }

  /**
   * Import bank statement lines
   */
  async importBankStatement(statementId, lines) {
    const response = await apiClient.post("/bank-reconciliation/import-statement", { statementId, lines });
    return response.data;
  }

  /**
   * Match bank statement line to journal entry
   */
  async matchBankLine(lineId, journalEntryId) {
    const response = await apiClient.post("/bank-reconciliation/match-line", {
      lineId,
      journalEntryId,
    });
    return response.data;
  }

  /**
   * Get Cash Book for period
   */
  async getCashBook(startDate, endDate, options = {}) {
    const response = await apiClient.get("/bank-reconciliation/cash-book", {
      params: {
        startDate,
        endDate,
        cashAccountCode: options.cashAccountCode || "1100",
        page: options.page || 1,
        limit: options.limit || 100,
      },
    });
    return response.data;
  }

  /**
   * Get Cash Book Daily Summary
   */
  async getCashBookSummary(startDate, endDate, cashAccountCode = "1100") {
    const response = await apiClient.get("/bank-reconciliation/cash-book-summary", {
      params: { startDate, endDate, cashAccountCode },
    });
    return response.data;
  }

  /**
   * Reconcile Cash to Bank
   */
  async reconcileCashToBank(periodId) {
    const response = await apiClient.get(`/bank-reconciliation/reconcile-cash-bank/${periodId}`);
    return response.data;
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format date
   */
  formatDate(date) {
    return new Intl.DateTimeFormat("en-AE").format(new Date(date));
  }
}

export default new BankReconciliationService();
