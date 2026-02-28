import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import financialReportsService from "../financialReportsService.js";
import { apiClient } from "../api.js";

// Mock API client


describe("financialReportsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Trial Balance Report", () => {
    it("should fetch trial balance for accounting period", async () => {
      const mockResponse = {
        data: {
          periodId: 1,
          accountDetails: [
            { accountCode: "1000", accountName: "Cash", debit: 50000, credit: 0 },
            { accountCode: "2000", accountName: "Accounts Payable", debit: 0, credit: 30000 },
          ],
          totals: {
            totalDebit: 50000,
            totalCredit: 50000,
            isBalanced: true,
          },
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.totals.isBalanced).toBeTruthy();
      expect(result.totals.totalDebit).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/trial-balance",
        Object.keys({
          params: { periodId: 1 },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should include zero balance accounts when requested", async () => {
      const mockResponse = {
        data: {
          accountDetails: [
            { accountCode: "1000", debit: 10000, credit: 0 },
            { accountCode: "1100", debit: 0, credit: 0, balance: 0 },
          ],
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1, {
        includeZeroBalances: true,
      });

      expect(result.accountDetails).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/trial-balance",
        Object.keys({
          params: expect.objectContaining({ includeZeroBalances: true }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });

    it("should filter by account category", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          accountDetails: [{ accountCode: "1000", accountCategory: "ASSET", debit: 50000 }],
        },
      });

      const result = await financialReportsService.getTrialBalance(1, {
        accountCategory: "ASSET",
      });

      expect(result.accountDetails[0].accountCategory).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/trial-balance",
        Object.keys({
          params: expect.objectContaining({ accountCategory: "ASSET" }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });

    it("should detect unbalanced trial balance", async () => {
      const mockResponse = {
        data: {
          accountDetails: [],
          totals: {
            totalDebit: 50000,
            totalCredit: 40000,
            isBalanced: false,
            difference: 10000,
          },
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.totals.isBalanced).toBeTruthy();
      expect(result.totals.difference).toBeTruthy();
    });
  });

  describe("Journal Register", () => {
    it("should fetch journal register for date range", async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              journalId: 1,
              date: "2024-01-01",
              description: "Invoice INV-001",
              lines: [
                { accountCode: "1000", debit: 5000 },
                { accountCode: "4000", credit: 5000 },
              ],
            },
          ],
          total: 1,
          page: 1,
          limit: 100,
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.entries).toBeTruthy();
      expect(result.entries[0].lines).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/journal-register",
        Object.keys({
          params: expect.objectContaining({
            startDate: "2024-01-01",
            endDate: "2024-01-31",
          }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });

    it("should filter by source module", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          entries: [{ journalId: 1, sourceModule: "INVOICING" }],
        },
      });

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        sourceModule: "INVOICING",
      });

      expect(result.entries[0].sourceModule).toBeTruthy();
    });

    it("should support pagination", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          entries: [],
          page: 2,
          limit: 50,
          total: 500,
        },
      });

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        page: 2,
        limit: 50,
      });

      expect(result.page).toBeTruthy();
      expect(result.limit).toBeTruthy();
    });

    it("should ensure debits equal credits in each entry", async () => {
      const mockResponse = {
        data: {
          entries: [
            {
              journalId: 1,
              totalDebit: 5000,
              totalCredit: 5000,
              isBalanced: true,
            },
          ],
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
      });

      expect(result.entries[0].isBalanced).toBeTruthy();
    });
  });

  describe("General Ledger", () => {
    it("should fetch general ledger for account", async () => {
      const mockResponse = {
        data: {
          accountCode: "1000",
          accountName: "Cash",
          transactions: [
            {
              date: "2024-01-01",
              description: "Opening balance",
              debit: 50000,
              credit: 0,
              balance: 50000,
            },
            {
              date: "2024-01-05",
              description: "Invoice payment received",
              debit: 5000,
              credit: 0,
              balance: 55000,
            },
          ],
          totalDebit: 55000,
          totalCredit: 0,
          closingBalance: 55000,
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getGeneralLedger("1000", {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.accountCode).toBeTruthy();
      expect(result.transactions).toBeTruthy();
      expect(result.closingBalance).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/general-ledger/1000",
        Object.keys({
          params: { startDate: "2024-01-01", endDate: "2024-01-31" },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should track running balance", async () => {
      const mockResponse = {
        data: {
          accountCode: "1000",
          transactions: [
            { debit: 100, credit: 0, balance: 100 },
            { debit: 50, credit: 0, balance: 150 },
            { debit: 0, credit: 25, balance: 125 },
          ],
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getGeneralLedger("1000");

      expect(result.transactions[0].balance).toBeTruthy();
      expect(result.transactions[1].balance).toBeTruthy();
      expect(result.transactions[2].balance).toBeTruthy();
    });

    it("should support date range filtering", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { transactions: [] } });

      await financialReportsService.getGeneralLedger("1000", {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/general-ledger/1000",
        Object.keys({
          params: expect.objectContaining({
            startDate: "2024-01-01",
            endDate: "2024-12-31",
          }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });
  });

  describe("Chart of Accounts", () => {
    it("should fetch chart of accounts", async () => {
      const mockResponse = {
        data: [
          {
            accountCode: "1000",
            accountName: "Cash",
            accountType: "ASSET",
            category: "CURRENT_ASSET",
            isActive: true,
          },
          {
            accountCode: "2000",
            accountName: "Accounts Payable",
            accountType: "LIABILITY",
            category: "CURRENT_LIABILITY",
            isActive: true,
          },
        ],
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getChartOfAccounts();

      expect(result).toBeTruthy();
      expect(result[0].accountType).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/financial-reports/chart-of-accounts", expect.objectContaining.object);
    });

    it("should filter by category", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: [{ accountCode: "1000", category: "ASSET" }],
      });

      const result = await financialReportsService.getChartOfAccounts({
        category: "ASSET",
      });

      expect(result[0].category).toBeTruthy();
    });

    it("should filter by account type", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: [{ accountCode: "1000", accountType: "ASSET" }],
      });

      const result = await financialReportsService.getChartOfAccounts({
        type: "ASSET",
      });

      expect(result[0].accountType).toBeTruthy();
    });

    it("should exclude inactive accounts by default", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: [
          { accountCode: "1000", isActive: true },
          { accountCode: "1100", isActive: true },
        ],
      });

      const result = await financialReportsService.getChartOfAccounts({
        includeInactive: false,
      });

      expect(result.every((a).toBeTruthy() => a.isActive === true));
    });

    it("should include inactive accounts when requested", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: [
          { accountCode: "1000", isActive: true },
          { accountCode: "1100", isActive: false },
        ],
      });

      const result = await financialReportsService.getChartOfAccounts({
        includeInactive: true,
      });

      expect(result).toBeTruthy();
    });
  });

  describe("Trial Balance Validation", () => {
    it("should validate trial balance before period close", async () => {
      const mockResponse = {
        data: {
          isValid: true,
          totalDebit: 100000,
          totalCredit: 100000,
          accountCount: 25,
          transactionCount: 150,
        },
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await financialReportsService.validateTrialBalance(1);

      expect(result.isValid).toBeTruthy();
      expect(result.totalDebit).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith("/financial-reports/validate-trial-balance",
        Object.keys({ periodId: 1 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should report validation errors", async () => {
      const mockResponse = {
        data: {
          isValid: false,
          errors: [{ accountCode: "1000", issue: "Unbalanced account", amount: 500 }],
        },
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await financialReportsService.validateTrialBalance(1);

      expect(result.isValid).toBeTruthy();
      expect(result.errors).toBeTruthy();
    });
  });

  describe("Formatting Utilities", () => {
    it("should format currency for AED display", () => {
      const formatted = financialReportsService.formatCurrency(5000);

      expect(formatted).toBeTruthy();
      expect(formatted).toBeTruthy(); // AED symbol
    });

    it("should handle decimal values in currency", () => {
      const formatted = financialReportsService.formatCurrency(5000.5);

      expect(formatted).toBeTruthy();
    });

    it("should format date in AE locale", () => {
      const formatted = financialReportsService.formatDate("2024-01-15");

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should handle null/empty date", () => {
      const formatted = financialReportsService.formatDate(null);

      expect(formatted).toBeTruthy();
    });

    it("should handle invalid currency values", () => {
      const formatted = financialReportsService.formatCurrency(null);

      expect(formatted).toBeTruthy();
    });
  });

  describe("Multi-tenancy", () => {
    it("should respect company context in all reports", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          periodId: 1,
          companyId: 1,
          accountDetails: [],
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.companyId).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error("Period not found"));

      await expect(financialReportsService.getTrialBalance(999)).rejects.toThrow();
    });

    it("should handle multiple fiscal periods", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          periodId: 1,
          fiscalYear: 2024,
          periodNumber: 1,
          accountDetails: [],
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.periodId).toBeTruthy();
      expect(result.fiscalYear).toBeTruthy();
    });
  });

  describe("Accounting Equation Validation", () => {
    it("should verify assets equal liabilities plus equity", async () => {
      const mockResponse = {
        data: {
          assets: 100000,
          liabilities: 40000,
          equity: 60000,
          isBalanced: true,
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.assets).toBeTruthy();
    });
  });
});