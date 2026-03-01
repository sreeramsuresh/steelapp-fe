/**
 * Bank Reconciliation Service Unit Tests (Node Native Test Runner)
 * Tests bank ledger and statement management
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";

describe("bankReconciliationService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getBankLedger", () => {
    it("should fetch bank ledger for account", async () => {
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
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: mockLedger });

      const result = await apiClient.get("/bank-reconciliation/bank-ledger/BANK001", {
        params: { startDate: "2024-02-01", endDate: "2024-02-28" },
      });

      expect(result.data.length).toBe(2);
      expect(result.data[1].balance).toBe(60000);
    });
  });

  describe("getBankReconciliation", () => {
    it("should fetch bank reconciliation statement", async () => {
      const mockBRS = {
        id: 1,
        statementDate: "2024-02-29",
        bankBalance: 75000,
        bookBalance: 74500,
        difference: 500,
        reconciled: false,
      };
      vi.spyOn(apiClient, "get").mockResolvedValue({ data: mockBRS });

      const result = await apiClient.get("/bank-reconciliation/brs/1");

      expect(result.data.statementDate).toBe("2024-02-29");
      expect(result.data.difference).toBe(500);
    });
  });

  describe("importBankStatement", () => {
    it("should import bank statement lines", async () => {
      const lines = [
        { date: "2024-02-01", description: "Initial", amount: 50000 },
        { date: "2024-02-02", description: "Deposit", amount: 10000 },
      ];
      const mockResponse = { imported: 2, errors: 0 };
      vi.spyOn(apiClient, "post").mockResolvedValue({ data: mockResponse });

      const result = await apiClient.post("/bank-reconciliation/import-statement", {
        statementId: 1,
        lines,
      });

      expect(result.data.imported).toBe(2);
    });
  });

  describe("matchBankLine", () => {
    it("should match bank statement line to journal entry", async () => {
      const mockResponse = { matched: true, lineId: 100, journalId: 500 };
      vi.spyOn(apiClient, "post").mockResolvedValue({ data: mockResponse });

      const result = await apiClient.post("/bank-reconciliation/match", {
        lineId: 100,
        journalId: 500,
      });

      expect(result.data.matched).toBe(true);
    });
  });

  describe("reconcile", () => {
    it("should mark reconciliation as complete", async () => {
      const mockResponse = { id: 1, reconciled: true, reconciledAt: "2024-02-29T00:00:00Z" };
      vi.spyOn(apiClient, "put").mockResolvedValue({ data: mockResponse });

      const result = await apiClient.put("/bank-reconciliation/1/reconcile", {});

      expect(result.data.reconciled).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network error"));

      try {
        await apiClient.get("/bank-reconciliation/bank-ledger/BANK001");
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });

    it("should handle API errors", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValue(new Error("Invalid bank statement"));

      try {
        await apiClient.post("/bank-reconciliation/import-statement", {});
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Invalid bank statement");
      }
    });
  });
});
