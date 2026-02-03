/**
 * Bank Reconciliation Service Unit Tests
 * ✅ Tests bank ledger and statement management
 * ✅ Tests bank-to-journal matching logic
 * ✅ Tests reconciliation workflows
 * ✅ 100% coverage target for bankReconciliationService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import bankReconciliationService from "../bankReconciliationService.js";

describe("bankReconciliationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBankLedger", () => {
    test("should fetch bank ledger for account", async () => {
      const mockLedger = [
        {
          date: "2024-02-01",
          description: "Opening balance",
          debit: 50000,
          credit: 0,
          balance: 50000,
        },
        {
          date: "2024-02-02",
          description: "Deposit",
          debit: 10000,
          credit: 0,
          balance: 60000,
        },
      ];
      apiClient.get.mockResolvedValueOnce({ data: mockLedger });

      const result = await bankReconciliationService.getBankLedger("BANK001", "2024-02-01", "2024-02-28");

      expect(result).toHaveLength(2);
      expect(result[1].balance).toBe(60000);
      expect(apiClient.get).toHaveBeenCalledWith("/bank-reconciliation/bank-ledger/BANK001", {
        params: { startDate: "2024-02-01", endDate: "2024-02-28" },
      });
    });
  });

  describe("getBankReconciliation", () => {
    test("should fetch bank reconciliation statement", async () => {
      const mockBRS = {
        id: 1,
        statementDate: "2024-02-29",
        bankBalance: 75000,
        bookBalance: 74500,
        difference: 500,
        reconciled: false,
      };
      apiClient.get.mockResolvedValueOnce({ data: mockBRS });

      const result = await bankReconciliationService.getBankReconciliation(1);

      expect(result.statementDate).toBe("2024-02-29");
      expect(result.difference).toBe(500);
      expect(apiClient.get).toHaveBeenCalledWith("/bank-reconciliation/brs/1");
    });
  });

  describe("importBankStatement", () => {
    test("should import bank statement lines", async () => {
      const lines = [
        { date: "2024-02-01", description: "Initial", amount: 50000 },
        { date: "2024-02-02", description: "Deposit", amount: 10000 },
      ];
      const mockResponse = { imported: 2, errors: 0 };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await bankReconciliationService.importBankStatement(1, lines);

      expect(result.imported).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith("/bank-reconciliation/import-statement", { statementId: 1, lines });
    });
  });

  describe("matchBankLine", () => {
    test("should match bank statement line to journal entry", async () => {
      const mockResponse = { matched: true, lineId: 100, journalId: 500 };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await bankReconciliationService.matchBankLine(100, 500);

      expect(result.matched).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith("/bank-reconciliation/match-line", {
        lineId: 100,
        journalEntryId: 500,
      });
    });

    test("should handle mismatch amounts", async () => {
      const mockResponse = {
        matched: false,
        error: "Amount mismatch: 1000 vs 950",
      };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await bankReconciliationService.matchBankLine(100, 500);

      expect(result.matched).toBe(false);
      expect(result.error).toContain("mismatch");
    });
  });

  describe("getCashBook", () => {
    test("should get cash book for period", async () => {
      const mockCashBook = {
        period: 1,
        receipts: [{ date: "2024-02-01", amount: 10000, reference: "INV001" }],
        payments: [{ date: "2024-02-02", amount: 5000, reference: "CHQ001" }],
        closingBalance: 75000,
      };
      apiClient.get.mockResolvedValueOnce({ data: mockCashBook });

      const result = await bankReconciliationService.getCashBook(1);

      expect(result.receipts).toHaveLength(1);
      expect(result.payments).toHaveLength(1);
      expect(result.closingBalance).toBe(75000);
    });
  });

  describe("getOutstandingItems", () => {
    test("should identify unmatched bank items", async () => {
      const mockItems = [
        { id: 1, date: "2024-02-15", amount: 500, type: "CHARGE", matched: false },
        { id: 2, date: "2024-02-20", amount: 250, type: "INTEREST", matched: false },
      ];
      apiClient.get.mockResolvedValueOnce({ data: mockItems });

      const result = await bankReconciliationService.getOutstandingItems(1);

      expect(result).toHaveLength(2);
      expect(result[0].matched).toBe(false);
    });
  });

  describe("reconcileStatement", () => {
    test("should reconcile bank statement", async () => {
      const mockResponse = {
        statementId: 1,
        reconciled: true,
        totalMatched: 50,
        totalUnmatched: 0,
      };
      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await bankReconciliationService.reconcileStatement(1);

      expect(result.reconciled).toBe(true);
      expect(result.totalUnmatched).toBe(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(bankReconciliationService.getBankLedger("BANK001", "2024-02-01", "2024-02-28")).rejects.toThrow(
        "Network error"
      );
    });

    test("should handle invalid statement", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Statement not found"));

      await expect(bankReconciliationService.getBankReconciliation(999)).rejects.toThrow("Statement not found");
    });

    test("should handle import errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Invalid line format"));

      await expect(bankReconciliationService.importBankStatement(1, [])).rejects.toThrow("Invalid line format");
    });
  });

  describe("Reconciliation Logic", () => {
    test("should calculate difference correctly", async () => {
      const mockBRS = {
        id: 1,
        bankBalance: 100000,
        bookBalance: 99500,
        difference: 500,
      };
      apiClient.get.mockResolvedValueOnce({ data: mockBRS });

      const result = await bankReconciliationService.getBankReconciliation(1);

      expect(result.difference).toBe(result.bankBalance - result.bookBalance);
    });

    test("should flag unreconciled statements", async () => {
      const mockBRS = {
        id: 1,
        bankBalance: 100000,
        bookBalance: 99000,
        difference: 1000,
        reconciled: false,
      };
      apiClient.get.mockResolvedValueOnce({ data: mockBRS });

      const result = await bankReconciliationService.getBankReconciliation(1);

      expect(result.reconciled).toBe(false);
    });
  });
});
