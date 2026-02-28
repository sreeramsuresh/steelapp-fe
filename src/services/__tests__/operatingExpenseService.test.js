import { describe, it, expect, vi, beforeEach } from 'vitest';

import { operatingExpenseService } from "../operatingExpenseService.js";
import apiClient from "../api.js";

describe("operatingExpenseService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("list", () => {
    it("should fetch all operating expenses", async () => {
      const mockResponse = {
        data: [
          { id: 1, expense_type: "salaries", amount: 50000, status: "approved" },
          { id: 2, expense_type: "utilities", amount: 5000, status: "pending" },
        ],
        pagination: { total: 2, page: 1 },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.list();

      expect(result.data).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/operating-expenses", { params: {} });
    });

    it("should filter by expense type", async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] });

      await operatingExpenseService.list({ expense_type: "salaries" });

      expect(apiClient.get).toHaveBeenCalledWith("/operating-expenses",
        expect.objectContaining({
          params: expect.objectContaining({ expense_type: "salaries" }),
        }));
    });
  });

  describe("getById", () => {
    it("should fetch single expense with details", async () => {
      const mockResponse = {
        id: 1,
        expense_type: "salaries",
        amount: 50000,
        currency: "AED",
      };

      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.getById(1);

      expect(result.amount).toBeTruthy();
      expect(apiClient.get).toHaveBeenCalledWith("/operating-expenses/1");
    });
  });

  describe("create", () => {
    it("should create new operating expense", async () => {
      const mockResponse = { id: 1, expense_type: "utilities", amount: 5000, status: "pending" };

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const payload = { expense_type: "utilities", amount: 5000, date: "2024-01-16" };

      const result = await operatingExpenseService.create(payload);

      expect(result.id).toBeTruthy();
      expect(apiClient.post).toHaveBeenCalledWith("/operating-expenses", payload);
    });
  });

  describe("update", () => {
    it("should update operating expense", async () => {
      const mockResponse = { id: 1, amount: 5500, status: "pending" };

      vi.spyOn(apiClient, 'patch').mockResolvedValue(mockResponse);

      const payload = { amount: 5500 };

      const result = await operatingExpenseService.update(1, payload);

      expect(result.amount).toBeTruthy();
      expect(apiClient.patch).toHaveBeenCalledWith("/operating-expenses/1", payload);
    });
  });

  describe("delete", () => {
    it("should delete expense", async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValue({ success: true });

      const result = await operatingExpenseService.delete(1);

      expect(result.success).toBeTruthy();
      expect(apiClient.delete).toHaveBeenCalledWith("/operating-expenses/1");
    });
  });

  describe("approve", () => {
    it("should approve operating expense", async () => {
      const mockResponse = { id: 1, status: "approved" };

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await operatingExpenseService.approve(1);

      expect(result.status).toBe("approved");
      expect(apiClient.post).toHaveBeenCalledWith("/operating-expenses/1/approve");
    });
  });

  describe("error handling", () => {
    it("should handle API errors in list", async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error("Network error"));

      await expect(operatingExpenseService.list()).rejects.toThrow("Network error");
    });

    it("should handle API errors in create", async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error("Validation failed"));

      await expect(operatingExpenseService.create({})).rejects.toThrow("Validation failed");
    });
  });
});
