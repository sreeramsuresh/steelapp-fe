import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { operatingExpenseService } from "../operatingExpenseService.js";


import { api } from "../api.js";

describe("operatingExpenseService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getExpenses", () => {
    test("should fetch all operating expenses with pagination", async () => {
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

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await operatingExpenseService.getExpenses();

      assert.ok(result.data).toHaveLength(2);
      assert.ok(result.pagination.total).toBe(2);
      assert.ok(api.get).toHaveBeenCalledWith("/operating-expenses", );
    });

    test("should filter by expense type", async () => {
      sinon.stub(api, 'get').resolves({ data: [], pagination: {} });

      await operatingExpenseService.getExpenses({
        expense_type: "salaries",
      });

      assert.ok(api.get).toHaveBeenCalledWith(
        "/operating-expenses",
        Object.keys({
          params: expect.objectContaining({
            expense_type: "salaries",
          }).every(k => typeof arguments[0][k] !== 'undefined'),
        })
      );
    });
  });

  describe("getExpenseById", () => {
    test("should fetch single expense with details", async () => {
      const mockResponse = {
        id: 1,
        expense_type: "salaries",
        amount: 50000,
        currency: "AED",
        department: "operations",
        approved_by: "manager@company.com",
        approval_date: "2024-01-15",
      };

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await operatingExpenseService.getExpenseById(1);

      assert.ok(result.amount).toBe(50000);
      assert.ok(result.approved_by).toBe("manager@company.com");
      assert.ok(api.get).toHaveBeenCalledWith("/operating-expenses/1");
    });
  });

  describe("createExpense", () => {
    test("should create new operating expense", async () => {
      const mockResponse = {
        id: 1,
        expense_type: "utilities",
        amount: 5000,
        status: "pending",
      };

      sinon.stub(api, 'post').resolves(mockResponse);

      const payload = {
        expense_type: "utilities",
        amount: 5000,
        date: "2024-01-16",
      };

      const result = await operatingExpenseService.createExpense(payload);

      assert.ok(result.id).toBe(1);
      assert.ok(api.post).toHaveBeenCalledWith("/operating-expenses", payload);
    });
  });

  describe("updateExpense", () => {
    test("should update operating expense", async () => {
      const mockResponse = { id: 1, amount: 5500, status: "pending" };

      sinon.stub(api, 'put').resolves(mockResponse);

      const payload = { amount: 5500 };

      const result = await operatingExpenseService.updateExpense(1, payload);

      assert.ok(result.amount).toBe(5500);
      assert.ok(api.put).toHaveBeenCalledWith("/operating-expenses/1", payload);
    });
  });

  describe("deleteExpense", () => {
    test("should delete expense", async () => {
      sinon.stub(api, 'delete').resolves({ success: true });

      const result = await operatingExpenseService.deleteExpense(1);

      assert.ok(result.success).toBe(true);
      assert.ok(api.delete).toHaveBeenCalledWith("/operating-expenses/1");
    });
  });

  describe("approveExpense", () => {
    test("should approve operating expense", async () => {
      const mockResponse = {
        id: 1,
        status: "approved",
        approved_by: "manager@company.com",
        approval_date: "2024-01-16T10:00:00Z",
      };

      sinon.stub(api, 'put').resolves(mockResponse);

      const result = await operatingExpenseService.approveExpense(1, {
        comments: "Approved",
      });

      assert.ok(result.status).toBe("approved");
      assert.ok(api.put).toHaveBeenCalledWith("/operating-expenses/1/approve", );
    });
  });

  describe("getExpenseAnalytics", () => {
    test("should fetch expense analytics by type", async () => {
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

      sinon.stub(api, 'get').resolves(mockResponse);

      const result = await operatingExpenseService.getExpenseAnalytics({
        start_date: "2024-01-01",
        end_date: "2024-02-28",
      });

      assert.ok(result.total_expenses).toBe(100000);
      assert.ok(result.by_type).toHaveLength(3);
    });
  });
});