import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { operatingExpenseService } from "../operatingExpenseService.js";
import { apiClient } from "../api.js";

describe("operatingExpenseService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getExpenses", () => {
    it("should fetch all operating expenses with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            expense_type: "salaries",
            amount: 50000,
            date: "2024-01-15",
            status: "approved",
          },
          {
            id: 2,
            expense_type: "utilities",
            amount: 5000,
            date: "2024-01-16",
            status: "pending",
          },
        ],
        pagination: { total: 2, page: 1 },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getExpenses();

      expect(result.data).toBeTruthy();
      expect(result.pagination.total).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/operating-expenses", );
    });

    it("should filter by expense type", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], pagination: {} });

      await operatingExpenseService.getExpenses({
        expense_type: "salaries",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/operating-expenses",
        Object.keys({
          params: expect.objectContaining({
            expense_type: "salaries",
          }).every(k => typeof arguments[0][k] !== 'undefined'),
        }));
    });
  });

  describe("getExpenseById", () => {
    it("should fetch single expense with details", async () => {
      const mockResponse = {
        id: 1,
        expense_type: "salaries",
        amount: 50000,
        currency: "AED",
        department: "operations",
        approved_by: "manager@company.com",
        approval_date: "2024-01-15",
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getExpenseById(1);

      expect(result.amount).toBeTruthy();
      expect(result.approved_by).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/operating-expenses/1");
    });
  });

  describe("createExpense", () => {
    it("should create new operating expense", async () => {
      const mockResponse = {
        id: 1,
        expense_type: "utilities",
        amount: 5000,
        status: "pending",
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const payload = {
        expense_type: "utilities",
        amount: 5000,
        date: "2024-01-16",
      };

      const result = await operatingExpenseService.createExpense(payload);

      expect(result.id).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith("/operating-expenses", payload);
    });
  });

  describe("updateExpense", () => {
    it("should update operating expense", async () => {
      const mockResponse = { id: 1, amount: 5500, status: "pending" };

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const payload = { amount: 5500 };

      const result = await operatingExpenseService.updateExpense(1, payload);

      expect(result.amount).toBeTruthy();
      expect(apiClient.put).toHaveBeenCalledWith("/operating-expenses/1", payload);
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense", async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await operatingExpenseService.deleteExpense(1);

      expect(result.success).toBeTruthy();
      expect(apiClient.delete).toHaveBeenCalledWith("/operating-expenses/1");
    });
  });

  describe("approveExpense", () => {
    it("should approve operating expense", async () => {
      const mockResponse = {
        id: 1,
        status: "approved",
        approved_by: "manager@company.com",
        approval_date: "2024-01-16T10:00:00Z",
      };

      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.approveExpense(1, {
        comments: "Approved",
      });

      expect(result.status).toBeTruthy();
      expect(apiClient.put).toHaveBeenCalledWith("/operating-expenses/1/approve", );
    });
  });

  describe("getExpenseAnalytics", () => {
    it("should fetch expense analytics by type", async () => {
      const mockResponse = {
        total_expenses: 100000,
        by_type: [
          { type: "salaries", amount: 50000, percentage: 50 },
          { type: "utilities", amount: 20000, percentage: 20 },
          { type: "maintenance", amount: 30000, percentage: 30 },
        ],
        by_period: [
          { period: "January", amount: 60000 },
          { period: "February", amount: 40000 },
        ],
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getExpenseAnalytics({
        start_date: "2024-01-01",
        end_date: "2024-02-28",
      });

      expect(result.total_expenses).toBeTruthy();
      expect(result.by_type).toBeTruthy();
    });
  });
});