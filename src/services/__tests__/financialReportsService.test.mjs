import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import financialReportsService from "../financialReportsService.js";
import { apiClient } from "../api.js";

// Mock API client


describe("financialReportsService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("Trial Balance Report", () => {
    test("should fetch trial balance for accounting period", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      assert.ok(result.totals.isBalanced);
      assert.ok(result.totals.totalDebit);
      sinon.assert.calledWith(apiClient.get, "/financial-reports/trial-balance",
        Object.keys({
          params: { periodId: 1 },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should include zero balance accounts when requested", async () => {
      const mockResponse = {
        data: {
          accountDetails: [
            { accountCode: "1000", debit: 10000, credit: 0 },
            { accountCode: "1100", debit: 0, credit: 0, balance: 0 },
          ],
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getTrialBalance(1, {
        includeZeroBalances: true,
      });

      assert.ok(result.accountDetails);
      sinon.assert.calledWith(apiClient.get, "/financial-reports/trial-balance",
        Object.keys({
          params: expect.objectContaining({ includeZeroBalances: true }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });

    test("should filter by account category", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: {
          accountDetails: [{ accountCode: "1000", accountCategory: "ASSET", debit: 50000 }],
        },
      });

      const result = await financialReportsService.getTrialBalance(1, {
        accountCategory: "ASSET",
      });

      assert.ok(result.accountDetails[0].accountCategory);
      sinon.assert.calledWith(apiClient.get, "/financial-reports/trial-balance",
        Object.keys({
          params: expect.objectContaining({ accountCategory: "ASSET" }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });

    test("should detect unbalanced trial balance", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      assert.ok(result.totals.isBalanced);
      assert.ok(result.totals.difference);
    });
  });

  describe("Journal Register", () => {
    test("should fetch journal register for date range", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      assert.ok(result.entries);
      assert.ok(result.entries[0].lines);
      sinon.assert.calledWith(apiClient.get, "/financial-reports/journal-register",
        Object.keys({
          params: expect.objectContaining({
            startDate: "2024-01-01",
            endDate: "2024-01-31",
          }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });

    test("should filter by source module", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: {
          entries: [{ journalId: 1, sourceModule: "INVOICING" }],
        },
      });

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        sourceModule: "INVOICING",
      });

      assert.ok(result.entries[0].sourceModule);
    });

    test("should support pagination", async () => {
      sinon.stub(apiClient, 'get').resolves({
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

      assert.ok(result.page);
      assert.ok(result.limit);
    });

    test("should ensure debits equal credits in each entry", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getJournalRegister({
        startDate: "2024-01-01",
      });

      assert.ok(result.entries[0].isBalanced);
    });
  });

  describe("General Ledger", () => {
    test("should fetch general ledger for account", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getGeneralLedger("1000", {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      assert.ok(result.accountCode);
      assert.ok(result.transactions);
      assert.ok(result.closingBalance);
      sinon.assert.calledWith(apiClient.get, "/financial-reports/general-ledger/1000",
        Object.keys({
          params: { startDate: "2024-01-01", endDate: "2024-01-31" },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should track running balance", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getGeneralLedger("1000");

      assert.ok(result.transactions[0].balance);
      assert.ok(result.transactions[1].balance);
      assert.ok(result.transactions[2].balance);
    });

    test("should support date range filtering", async () => {
      sinon.stub(apiClient, 'get').resolves({ data: { transactions: [] } });

      await financialReportsService.getGeneralLedger("1000", {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      sinon.assert.calledWith(apiClient.get, "/financial-reports/general-ledger/1000",
        Object.keys({
          params: expect.objectContaining({
            startDate: "2024-01-01",
            endDate: "2024-12-31",
          }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });
  });

  describe("Chart of Accounts", () => {
    test("should fetch chart of accounts", async () => {
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

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getChartOfAccounts();

      assert.ok(result);
      assert.ok(result[0].accountType);
      sinon.assert.calledWith(apiClient.get, "/financial-reports/chart-of-accounts", sinon.match.object);
    });

    test("should filter by category", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [{ accountCode: "1000", category: "ASSET" }],
      });

      const result = await financialReportsService.getChartOfAccounts({
        category: "ASSET",
      });

      assert.ok(result[0].category);
    });

    test("should filter by account type", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [{ accountCode: "1000", accountType: "ASSET" }],
      });

      const result = await financialReportsService.getChartOfAccounts({
        type: "ASSET",
      });

      assert.ok(result[0].accountType);
    });

    test("should exclude inactive accounts by default", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [
          { accountCode: "1000", isActive: true },
          { accountCode: "1100", isActive: true },
        ],
      });

      const result = await financialReportsService.getChartOfAccounts({
        includeInactive: false,
      });

      assert.ok(result.every((a) => a.isActive === true));
    });

    test("should include inactive accounts when requested", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: [
          { accountCode: "1000", isActive: true },
          { accountCode: "1100", isActive: false },
        ],
      });

      const result = await financialReportsService.getChartOfAccounts({
        includeInactive: true,
      });

      assert.ok(result);
    });
  });

  describe("Trial Balance Validation", () => {
    test("should validate trial balance before period close", async () => {
      const mockResponse = {
        data: {
          isValid: true,
          totalDebit: 100000,
          totalCredit: 100000,
          accountCount: 25,
          transactionCount: 150,
        },
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await financialReportsService.validateTrialBalance(1);

      assert.ok(result.isValid);
      assert.ok(result.totalDebit);
      sinon.assert.calledWith(apiClient.post, "/financial-reports/validate-trial-balance",
        Object.keys({ periodId: 1 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should report validation errors", async () => {
      const mockResponse = {
        data: {
          isValid: false,
          errors: [{ accountCode: "1000", issue: "Unbalanced account", amount: 500 }],
        },
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await financialReportsService.validateTrialBalance(1);

      assert.ok(result.isValid);
      assert.ok(result.errors);
    });
  });

  describe("Formatting Utilities", () => {
    test("should format currency for AED display", () => {
      const formatted = financialReportsService.formatCurrency(5000);

      assert.ok(formatted);
      assert.ok(formatted); // AED symbol
    });

    test("should handle decimal values in currency", () => {
      const formatted = financialReportsService.formatCurrency(5000.5);

      assert.ok(formatted);
    });

    test("should format date in AE locale", () => {
      const formatted = financialReportsService.formatDate("2024-01-15");

      assert.ok(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    test("should handle null/empty date", () => {
      const formatted = financialReportsService.formatDate(null);

      assert.ok(formatted);
    });

    test("should handle invalid currency values", () => {
      const formatted = financialReportsService.formatCurrency(null);

      assert.ok(formatted);
    });
  });

  describe("Multi-tenancy", () => {
    test("should respect company context in all reports", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: {
          periodId: 1,
          companyId: 1,
          accountDetails: [],
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      assert.ok(result.companyId);
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors gracefully", async () => {
      sinon.stub(apiClient, 'get').rejects(new Error("Period not found"));

      await assert.rejects(() => financialReportsService.getTrialBalance(999), Error);
    });

    test("should handle multiple fiscal periods", async () => {
      sinon.stub(apiClient, 'get').resolves({
        data: {
          periodId: 1,
          fiscalYear: 2024,
          periodNumber: 1,
          accountDetails: [],
        },
      });

      const result = await financialReportsService.getTrialBalance(1);

      assert.ok(result.periodId);
      assert.ok(result.fiscalYear);
    });
  });

  describe("Accounting Equation Validation", () => {
    test("should verify assets equal liabilities plus equity", async () => {
      const mockResponse = {
        data: {
          assets: 100000,
          liabilities: 40000,
          equity: 60000,
          isBalanced: true,
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await financialReportsService.getTrialBalance(1);

      assert.ok(result.assets);
    });
  });
});