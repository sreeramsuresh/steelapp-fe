/**
 * Account Statement Service Unit Tests
 * ✅ Tests account statement CRUD operations
 * ✅ Tests PDF generation and downloads
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { accountStatementService } from "../accountStatementService.js";
import { apiClient } from "../api.js";

describe("accountStatementService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  describe("getAll", () => {
    it("should fetch all account statements", async () => {
      const mockStatements = [
        { id: 1, customerId: 101, startDate: "2024-01-01", balance: 50000 },
        { id: 2, customerId: 102, startDate: "2024-01-01", balance: 75000 },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValue(mockStatements);

      const result = await accountStatementService.getAll({ page: 1 });

      expect(result.length).toBe(2);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should handle empty results", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValue([]);

      const result = await accountStatementService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should fetch statement by ID", async () => {
      const mockStatement = { id: 1, customerId: 101, balance: 50000 };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockStatement);

      const result = await accountStatementService.getById(1);

      expect(result.id).toBe(1);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should handle not found error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Not found"));

      try {
        await accountStatementService.getById(999);
        throw new Error("Expected error");
      } catch (error) {
        expect(error.message).toBe("Not found");
      }
    });
  });

  describe("create", () => {
    it("should create account statement", async () => {
      const data = { customerId: 101, startDate: "2024-02-01", endDate: "2024-02-29" };
      const mockResponse = { id: 3, ...data };
      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await accountStatementService.create(data);

      expect(result.id).toBe(3);
      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe("update", () => {
    it("should update statement", async () => {
      const updates = { status: "sent" };
      const mockResponse = { id: 1, ...updates };
      vi.spyOn(apiClient, "put").mockResolvedValue(mockResponse);

      const result = await accountStatementService.update(1, updates);

      expect(result.status).toBe("sent");
      expect(apiClient.put.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe("delete", () => {
    it("should delete statement", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      const result = await accountStatementService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe("downloadPDF", () => {
    it("should download PDF via fileDownloadService", async () => {
      const mockDownloadFile = vi.fn().mockResolvedValue(undefined);
      vi.doMock("../fileDownloadService.js", () => ({
        downloadFile: mockDownloadFile,
      }));

      vi.resetModules();
      const { accountStatementService: freshService } = await import("../accountStatementService.js");

      await freshService.downloadPDF(1);

      expect(mockDownloadFile).toHaveBeenCalledWith(
        "/account-statements/1/pdf",
        "AccountStatement-1.pdf",
        expect.objectContaining({ expectedType: "application/pdf" })
      );
    });
  });

  describe("generateOnTheFly", () => {
    it("should generate statement on-the-fly via fileDownloadService", async () => {
      const mockDownloadFile = vi.fn().mockResolvedValue(undefined);
      vi.doMock("../fileDownloadService.js", () => ({
        downloadFile: mockDownloadFile,
      }));

      vi.resetModules();
      const { accountStatementService: freshService } = await import("../accountStatementService.js");

      const data = { customerId: 101, startDate: "2024-02-01", endDate: "2024-02-29" };
      await freshService.generateOnTheFly(data);

      expect(mockDownloadFile).toHaveBeenCalledWith(
        "/account-statements/generate",
        expect.stringContaining("Statement-101"),
        expect.objectContaining({
          method: "POST",
          expectedType: "application/pdf",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network error"));

      await expect(accountStatementService.getAll()).rejects.toThrow("Network error");
    });

    it("should handle PDF generation errors", async () => {
      const mockDownloadFile = vi.fn().mockRejectedValue(new Error("PDF failed"));
      vi.doMock("../fileDownloadService.js", () => ({
        downloadFile: mockDownloadFile,
      }));

      vi.resetModules();
      const { accountStatementService: freshService } = await import("../accountStatementService.js");

      await expect(freshService.generateOnTheFly({ startDate: "2024-01-01" })).rejects.toThrow("PDF failed");
    });
  });
});
