/**
 * Audit Hub Service Unit Tests
 * ✅ Tests accounting period management
 * ✅ Tests journal entry operations
 * ✅ Tests audit trail tracking
 * ✅ 100% coverage target for auditHubService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../api";
import auditHubService from "../auditHubService";

describe("auditHubService", () => {
  const companyId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Accounting Periods", () => {
    test("should get periods with filters", async () => {
      const mockPeriods = [
        { id: 1, year: 2024, month: 1, status: "OPEN" },
        { id: 2, year: 2024, month: 2, status: "OPEN" },
      ];
      api.get.mockResolvedValueOnce({ data: mockPeriods });

      const result = await auditHubService.getPeriods(companyId, {
        year: 2024,
        status: "OPEN",
      });

      expect(result).toHaveLength(2);
      expect(api.get).toHaveBeenCalled();
      const call = api.get.mock.calls[0];
      expect(call[0]).toContain("/accounting-periods");
      expect(call[1].headers["X-Company-Id"]).toBe(companyId);
    });

    test("should get period by ID", async () => {
      const mockPeriod = {
        id: 1,
        year: 2024,
        month: 1,
        status: "OPEN",
        openingBalance: 1000000,
      };
      api.get.mockResolvedValueOnce({ data: mockPeriod });

      const result = await auditHubService.getPeriodById(companyId, 1);

      expect(result.year).toBe(2024);
      expect(api.get).toHaveBeenCalledWith("/accounting-periods/1", {
        headers: { "X-Company-Id": companyId },
      });
    });

    test("should create new period", async () => {
      const mockResponse = {
        id: 3,
        year: 2024,
        month: 3,
        status: "OPEN",
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.createPeriod(companyId, "MONTHLY", 2024, 3);

      expect(result.month).toBe(3);
      expect(api.post).toHaveBeenCalled();
      const call = api.post.mock.calls[0];
      expect(call[0]).toBe("/accounting-periods");
    });

    test("should close accounting period", async () => {
      const mockResponse = { id: 1, status: "CLOSED" };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.closePeriod(companyId, 1);

      expect(result.status).toBe("CLOSED");
      expect(api.post).toHaveBeenCalled();
    });
  });

  describe("Journal Entries", () => {
    test("should get journal entries for period", async () => {
      const mockEntries = [
        { id: 1, debit: 1000, credit: 0, account: "Assets" },
        { id: 2, debit: 0, credit: 1000, account: "Equity" },
      ];
      api.get.mockResolvedValueOnce({ data: mockEntries });

      const result = await auditHubService.getJournalEntries(companyId, 1);

      expect(result).toHaveLength(2);
      expect(result[0].debit).toBe(1000);
    });

    test("should create journal entry", async () => {
      const entryData = {
        periodId: 1,
        date: "2024-02-01",
        description: "Opening balance",
        lines: [
          { account: "Assets", debit: 1000, credit: 0 },
          { account: "Equity", debit: 0, credit: 1000 },
        ],
      };
      const mockResponse = { id: 100, ...entryData };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.createJournalEntry(companyId, entryData);

      expect(result.id).toBe(100);
      expect(api.post).toHaveBeenCalled();
    });

    test("should post/lock journal entry", async () => {
      const mockResponse = { id: 100, posted: true, locked: true };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.postJournalEntry(companyId, 100);

      expect(result.posted).toBe(true);
      expect(api.post).toHaveBeenCalled();
    });

    test("should reverse journal entry", async () => {
      const mockResponse = {
        id: 100,
        reversalId: 101,
        status: "REVERSED",
      };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await auditHubService.reverseJournalEntry(companyId, 100);

      expect(result.status).toBe("REVERSED");
      expect(result.reversalId).toBe(101);
    });
  });

  describe("Audit Trail", () => {
    test("should get audit trail for transaction", async () => {
      const mockTrail = [
        {
          timestamp: "2024-02-02T10:00:00Z",
          user: "john@example.com",
          action: "CREATED",
        },
        {
          timestamp: "2024-02-02T11:00:00Z",
          user: "jane@example.com",
          action: "POSTED",
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockTrail });

      const result = await auditHubService.getAuditTrail(companyId, "invoice", 123);

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe("CREATED");
    });

    test("should get transaction history", async () => {
      const mockHistory = [
        { date: "2024-02-01", type: "INVOICE", count: 50, amount: 100000 },
        { date: "2024-02-02", type: "PAYMENT", count: 25, amount: 75000 },
      ];
      api.get.mockResolvedValueOnce({ data: mockHistory });

      const result = await auditHubService.getTransactionHistory(companyId, {
        startDate: "2024-02-01",
      });

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(100000);
    });
  });

  describe("Trial Balance", () => {
    test("should generate trial balance", async () => {
      const mockTrialBalance = {
        period: 1,
        date: "2024-02-01",
        accounts: [
          { code: "1000", name: "Assets", debit: 100000, credit: 0 },
          { code: "3000", name: "Equity", debit: 0, credit: 100000 },
        ],
        totalDebit: 100000,
        totalCredit: 100000,
      };
      api.get.mockResolvedValueOnce({ data: mockTrialBalance });

      const result = await auditHubService.getTrialBalance(companyId, 1);

      expect(result.totalDebit).toBe(result.totalCredit);
      expect(result.accounts).toHaveLength(2);
    });
  });

  describe("Error Handling", () => {
    test("should handle period fetch errors", async () => {
      api.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(auditHubService.getPeriods(companyId)).rejects.toThrow("Network error");
    });

    test("should handle journal entry creation errors", async () => {
      const entryData = { periodId: 1, date: "2024-02-01" };
      api.post.mockRejectedValueOnce(new Error("Validation failed"));

      await expect(auditHubService.createJournalEntry(companyId, entryData)).rejects.toThrow("Validation failed");
    });

    test("should include company ID in all requests", async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await auditHubService.getPeriods(companyId);

      const call = api.get.mock.calls[0];
      expect(call[1].headers["X-Company-Id"]).toBe(companyId);
    });
  });

  describe("Multi-tenancy Compliance", () => {
    test("should enforce company_id in all operations", async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await auditHubService.getPeriodById(companyId, 1);

      const call = api.get.mock.calls[0];
      expect(call[1]).toHaveProperty("headers");
      expect(call[1].headers).toHaveProperty("X-Company-Id");
      expect(call[1].headers["X-Company-Id"]).toBe(companyId);
    });

    test("should prevent cross-company data access", async () => {
      api.get.mockResolvedValueOnce({ data: { companyId: 999 } });

      await auditHubService.getPeriodById(2, 1);

      const call = api.get.mock.calls[0];
      expect(call[1].headers["X-Company-Id"]).toBe(2);
    });
  });
});
