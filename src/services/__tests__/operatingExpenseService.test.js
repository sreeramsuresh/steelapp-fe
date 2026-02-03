import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatingExpenseService } from "../operatingExpenseService.js";

vi.mock("../api.js", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "../api.js";

describe("operatingExpenseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      api.get.mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getExpenses();

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(api.get).toHaveBeenCalledWith(
        "/operating-expenses",
        expect.any(Object)
      );
    });

    it("should filter by expense type", async () => {
      api.get.mockResolvedValue({ data: [], pagination: {} });

      await operatingExpenseService.getExpenses({
        expense_type: "salaries",
      });

      expect(api.get).toHaveBeenCalledWith(
        "/operating-expenses",
        expect.objectContaining({
          params: expect.objectContaining({
            expense_type: "salaries",
          }),
        })
      );
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

      api.get.mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getExpenseById(1);

      expect(result.amount).toBe(50000);
      expect(result.approved_by).toBe("manager@company.com");
      expect(api.get).toHaveBeenCalledWith("/operating-expenses/1");
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

      api.post.mockResolvedValue(mockResponse);

      const payload = {
        expense_type: "utilities",
        amount: 5000,
        date: "2024-01-16",
      };

      const result = await operatingExpenseService.createExpense(payload);

      expect(result.id).toBe(1);
      expect(api.post).toHaveBeenCalledWith(
        "/operating-expenses",
        payload
      );
    });
  });

  describe("updateExpense", () => {
    it("should update operating expense", async () => {
      const mockResponse = { id: 1, amount: 5500, status: "pending" };

      api.put.mockResolvedValue(mockResponse);

      const payload = { amount: 5500 };

      const result = await operatingExpenseService.updateExpense(1, payload);

      expect(result.amount).toBe(5500);
      expect(api.put).toHaveBeenCalledWith(
        "/operating-expenses/1",
        payload
      );
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense", async () => {
      api.delete.mockResolvedValue({ success: true });

      const result = await operatingExpenseService.deleteExpense(1);

      expect(result.success).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/operating-expenses/1");
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

      api.put.mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.approveExpense(1, {
        comments: "Approved",
      });

      expect(result.status).toBe("approved");
      expect(api.put).toHaveBeenCalledWith(
        "/operating-expenses/1/approve",
        expect.any(Object)
      );
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

      api.get.mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getExpenseAnalytics({
        start_date: "2024-01-01",
        end_date: "2024-02-28",
      });

      expect(result.total_expenses).toBe(100000);
      expect(result.by_type).toHaveLength(3);
    });
  });
});
