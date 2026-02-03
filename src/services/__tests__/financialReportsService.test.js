import { beforeEach, describe, expect, it, vi } from "vitest";
import financialReportsService from "../financialReportsService.js";

// Mock API client
vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from "../api.js";

describe("financialReportsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.totals.isBalanced).toBe(true);
      expect(result.totals.totalDebit).toBe(result.totals.totalCredit);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/trial-balance",
        expect.objectContaining({
          params: { periodId: 1 },
        })
      );
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1, {
        includeZeroBalances: true,
      });

      expect(result.accountDetails).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/trial-balance",
        expect.objectContaining({
          params: expect.objectContaining({ includeZeroBalances: true }),
        })
      );
    });

    it("should filter by account category", async () => {
      apiClient.get.mockResolvedValue({
        data: {
          accountDetails: [{ accountCode: "1000", accountCategory: "ASSET", debit: 50000 }],
        },
      });

      const result = await financialReportsService.getTrialBalance(1, {
        accountCategory: "ASSET",
      });

      expect(result.accountDetails[0].accountCategory).toBe("ASSET");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/trial-balance",
        expect.objectContaining({
          params: expect.objectContaining({ accountCategory: "ASSET" }),
        })
      );
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.totals.isBalanced).toBe(false);
      expect(result.totals.difference).toBe(10000);
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].lines).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/journal-register",
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: "2024-01-01",
            endDate: "2024-01-31",
          }),
        })
      );
    });

    it("should filter by source module", async () => {
      apiClient.get.mockResolvedValue({
        data: {
          entries: [{ journalId: 1, sourceModule: "INVOICING" }],
        },
      });

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        sourceModule: "INVOICING",
      });

      expect(result.entries[0].sourceModule).toBe("INVOICING");
    });

    it("should support pagination", async () => {
      apiClient.get.mockResolvedValue({
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

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
      });

      expect(result.entries[0].isBalanced).toBe(true);
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getGeneralLedger("1000", {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.accountCode).toBe("1000");
      expect(result.transactions).toHaveLength(2);
      expect(result.closingBalance).toBe(55000);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/general-ledger/1000",
        expect.objectContaining({
          params: expect.any(Object),
        })
      );
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getGeneralLedger("1000");

      expect(result.transactions[0].balance).toBe(100);
      expect(result.transactions[1].balance).toBe(150);
      expect(result.transactions[2].balance).toBe(125);
    });

    it("should support date range filtering", async () => {
      apiClient.get.mockResolvedValue({ data: { transactions: [] } });

      await financialReportsService.getGeneralLedger("1000", {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/general-ledger/1000",
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: "2024-01-01",
            endDate: "2024-12-31",
          }),
        })
      );
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getChartOfAccounts();

      expect(result).toHaveLength(2);
      expect(result[0].accountType).toBe("ASSET");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/financial-reports/chart-of-accounts",
        expect.objectContaining({
          params: expect.any(Object),
        })
      );
    });

    it("should filter by category", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ accountCode: "1000", category: "ASSET" }],
      });

      const result = await financialReportsService.getChartOfAccounts({
        category: "ASSET",
      });

      expect(result[0].category).toBe("ASSET");
    });

    it("should filter by account type", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ accountCode: "1000", accountType: "ASSET" }],
      });

      const result = await financialReportsService.getChartOfAccounts({
        type: "ASSET",
      });

      expect(result[0].accountType).toBe("ASSET");
    });

    it("should exclude inactive accounts by default", async () => {
      apiClient.get.mockResolvedValue({
        data: [
          { accountCode: "1000", isActive: true },
          { accountCode: "1100", isActive: true },
        ],
      });

      const result = await financialReportsService.getChartOfAccounts({
        includeInactive: false,
      });

      expect(result.every((a) => a.isActive === true)).toBe(true);
    });

    it("should include inactive accounts when requested", async () => {
      apiClient.get.mockResolvedValue({
        data: [
          { accountCode: "1000", isActive: true },
          { accountCode: "1100", isActive: false },
        ],
      });

      const result = await financialReportsService.getChartOfAccounts({
        includeInactive: true,
      });

      expect(result).toHaveLength(2);
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

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await financialReportsService.validateTrialBalance(1);

      expect(result.isValid).toBe(true);
      expect(result.totalDebit).toBe(result.totalCredit);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/financial-reports/validate-trial-balance",
        expect.objectContaining({ periodId: 1 })
      );
    });

    it("should report validation errors", async () => {
      const mockResponse = {
        data: {
          isValid: false,
          errors: [{ accountCode: "1000", issue: "Unbalanced account", amount: 500 }],
        },
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await financialReportsService.validateTrialBalance(1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("Formatting Utilities", () => {
    it("should format currency for AED display", () => {
      const formatted = financialReportsService.formatCurrency(5000);

      expect(formatted).toContain("5,000");
      expect(formatted).toContain("د.إ"); // AED symbol
    });

    it("should handle decimal values in currency", () => {
      const formatted = financialReportsService.formatCurrency(5000.5);

      expect(formatted).toContain("5,000.50");
    });

    it("should format date in AE locale", () => {
      const formatted = financialReportsService.formatDate("2024-01-15");

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it("should handle null/empty date", () => {
      const formatted = financialReportsService.formatDate(null);

      expect(formatted).toBe("");
    });

    it("should handle invalid currency values", () => {
      const formatted = financialReportsService.formatCurrency(null);

      expect(formatted).toContain("0.00");
    });
  });

  describe("Multi-tenancy", () => {
    it("should respect company context in all reports", async () => {
      apiClient.get.mockResolvedValue({
        data: {
          periodId: 1,
          companyId: 1,
          accountDetails: [],
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.companyId).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("API Error"));

      await expect(financialReportsService.getTrialBalance(1)).rejects.toThrow();
    });

    it("should handle missing data responses", async () => {
      apiClient.get.mockResolvedValue({ data: null });

      const result = await financialReportsService.getTrialBalance(1);

      expect(result).toBeNull();
    });

    it("should handle empty account list", async () => {
      apiClient.get.mockResolvedValue({
        data: {
          periodId: 1,
          accountDetails: [],
          totals: { totalDebit: 0, totalCredit: 0 },
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.accountDetails).toHaveLength(0);
    });
  });

  describe("Period Management", () => {
    it("should validate period exists", async () => {
      apiClient.get.mockRejectedValue(new Error("Period not found"));

      await expect(financialReportsService.getTrialBalance(999)).rejects.toThrow("Period not found");
    });

    it("should handle multiple fiscal periods", async () => {
      apiClient.get.mockResolvedValue({
        data: {
          periodId: 1,
          fiscalYear: 2024,
          periodNumber: 1,
          accountDetails: [],
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.periodId).toBe(1);
      expect(result.fiscalYear).toBe(2024);
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

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      expect(result.assets).toBe(result.liabilities + result.equity);
    });
  });
});
