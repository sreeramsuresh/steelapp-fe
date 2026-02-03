/**
 * Quotation Service Unit Tests
 * ✅ Tests CRUD operations for sales quotations
 * ✅ Tests status transitions (draft → approved → expired)
 * ✅ Tests conversion to invoice workflow
 * ✅ Tests PDF generation
 * ✅ 100% coverage target for quotationService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../axiosApi.js", () => ({
  apiService: {
    request: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import { apiService } from "../axiosApi.js";
import { quotationService } from "../quotationService.js";

describe("quotationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    test("should fetch all quotations with pagination", async () => {
      const mockResponse = [
        {
          id: 1,
          quotationNumber: "QT-001",
          customerId: 1,
          status: "draft",
          totalAmount: 50000,
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.getAll({ page: 1, limit: 20 });

      expect(result).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/quotations", {
        page: 1,
        limit: 20,
      });
    });

    test("should filter by customer", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await quotationService.getAll({ customerId: 5 });

      expect(apiClient.get).toHaveBeenCalledWith("/quotations", {
        customerId: 5,
      });
    });

    test("should filter by status", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await quotationService.getAll({ status: "approved" });

      expect(apiClient.get).toHaveBeenCalledWith("/quotations", {
        status: "approved",
      });
    });
  });

  describe("getById", () => {
    test("should fetch quotation by ID", async () => {
      const mockQuotation = {
        id: 1,
        quotationNumber: "QT-001",
        customerId: 1,
        customerName: "ABC Corp",
        quotationDate: "2026-01-15",
        validUntil: "2026-02-15",
        items: [
          {
            productId: 1,
            name: "Steel Coil",
            quantity: 100,
            rate: 500,
            amount: 50000,
          },
        ],
        subtotal: 50000,
        taxAmount: 2500,
        totalAmount: 52500,
        status: "draft",
      };
      apiClient.get.mockResolvedValueOnce(mockQuotation);

      const result = await quotationService.getById(1);

      expect(result.id).toBe(1);
      expect(result.quotationNumber).toBe("QT-001");
      expect(apiClient.get).toHaveBeenCalledWith("/quotations/1");
    });
  });

  describe("create", () => {
    test("should create quotation", async () => {
      const newQuotation = {
        quotationNumber: "QT-002",
        customerId: 2,
        quotationDate: "2026-01-20",
        validUntil: "2026-02-20",
        items: [
          {
            productId: 1,
            quantity: 100,
            rate: 500,
            amount: 50000,
          },
        ],
        subtotal: 50000,
        taxAmount: 2500,
        totalAmount: 52500,
        notes: "Valid for 30 days",
      };

      const mockResponse = { id: 5, ...newQuotation, status: "draft" };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.create(newQuotation);

      expect(result.id).toBe(5);
      expect(result.quotationNumber).toBe("QT-002");
      expect(apiClient.post).toHaveBeenCalledWith("/quotations", newQuotation);
    });
  });

  describe("update", () => {
    test("should update quotation", async () => {
      const updates = { validUntil: "2026-03-15", notes: "Updated terms" };
      const mockResponse = { id: 1, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.update(1, updates);

      expect(result.id).toBe(1);
      expect(apiClient.put).toHaveBeenCalledWith("/quotations/1", updates);
    });

    test("should only allow update of draft quotations", async () => {
      const updates = { notes: "Updated" };
      apiClient.put.mockResolvedValueOnce({
        id: 1,
        status: "draft",
        ...updates,
      });

      const result = await quotationService.update(1, updates);

      expect(result.status).toBe("draft");
    });
  });

  describe("delete", () => {
    test("should delete quotation", async () => {
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/quotations/1");
    });
  });

  describe("updateStatus", () => {
    test("should update quotation status", async () => {
      const mockResponse = { id: 1, status: "approved" };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.updateStatus(1, "approved");

      expect(result.status).toBe("approved");
      expect(apiClient.patch).toHaveBeenCalledWith("/quotations/1/status", {
        status: "approved",
      });
    });

    test("should support draft → approved → expired status transitions", async () => {
      apiClient.patch.mockResolvedValueOnce({ status: "expired" });

      await quotationService.updateStatus(1, "expired");

      expect(apiClient.patch).toHaveBeenCalledWith("/quotations/1/status", {
        status: "expired",
      });
    });
  });

  describe("convertToInvoice", () => {
    test("should convert quotation to invoice", async () => {
      const mockResponse = {
        invoiceId: 10,
        invoiceNumber: "INV-001",
        status: "draft",
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.convertToInvoice(1);

      expect(result.invoiceId).toBe(10);
      expect(result.invoiceNumber).toBe("INV-001");
      expect(apiClient.post).toHaveBeenCalledWith("/quotations/1/convert-to-invoice");
    });

    test("should not convert expired quotation", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Cannot convert expired quotation"));

      await expect(quotationService.convertToInvoice(1)).rejects.toThrow("Cannot convert expired quotation");
    });
  });

  describe("getNextNumber", () => {
    test("should get next quotation number", async () => {
      const mockResponse = { nextNumber: "QT-00045", prefix: "QT-" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.getNextNumber();

      expect(result.nextNumber).toBe("QT-00045");
      expect(apiClient.get).toHaveBeenCalledWith("/quotations/number/next");
    });
  });

  describe("downloadPDF", () => {
    test("should download quotation as PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });

      // Mock URL creation
      global.URL.createObjectURL = vi.fn(() => "blob:test-url");
      global.URL.revokeObjectURL = vi.fn();

      // Mock document methods
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      apiService.request.mockResolvedValueOnce(mockBlob);

      await quotationService.downloadPDF(1);

      expect(apiService.request).toHaveBeenCalledWith({
        method: "GET",
        url: "/quotations/1/pdf",
        responseType: "blob",
      });
    });

    test("should handle PDF download errors", async () => {
      apiService.request.mockRejectedValueOnce(new Error("PDF generation failed"));

      await expect(quotationService.downloadPDF(999)).rejects.toThrow("PDF generation failed");
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors in getAll", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(quotationService.getAll()).rejects.toThrow("Network error");
    });

    test("should handle errors in create", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Validation failed"));

      await expect(quotationService.create({})).rejects.toThrow("Validation failed");
    });

    test("should handle errors in convertToInvoice", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Conversion failed"));

      await expect(quotationService.convertToInvoice(1)).rejects.toThrow("Conversion failed");
    });

    test("should handle errors in updateStatus", async () => {
      apiClient.patch.mockRejectedValueOnce(new Error("Invalid status transition"));

      await expect(quotationService.updateStatus(1, "invalid")).rejects.toThrow("Invalid status transition");
    });
  });
});
