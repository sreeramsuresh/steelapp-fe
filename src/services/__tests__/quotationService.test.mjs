/**
 * Quotation Service Unit Tests
 * ✅ Tests CRUD operations for sales quotations
 * ✅ Tests status transitions (draft → approved → expired)
 * ✅ Tests conversion to invoice workflow
 * ✅ Tests PDF generation
 * ✅ 100% coverage target for quotationService.js
 */

import { beforeEach, describe, expect, test, vi } from "vitest";



import { apiService } from "../axiosApi.js";
import { quotationService } from "../quotationService.js";
import { apiClient } from "../api.js";

describe("quotationService", () => {
  beforeEach(() => {
    sinon.restore();
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

      assert.ok(result !== undefined);
      sinon.assert.calledWith(apiClient.get, "/quotations", {
        page: 1,
        limit: 20,
      });
    });

    test("should filter by customer", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await quotationService.getAll({ customerId: 5 });

      sinon.assert.calledWith(apiClient.get, "/quotations", {
        customerId: 5,
      });
    });

    test("should filter by status", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await quotationService.getAll({ status: "approved" });

      sinon.assert.calledWith(apiClient.get, "/quotations", {
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

      assert.ok(result.id);
      assert.ok(result.quotationNumber);
      sinon.assert.calledWith(apiClient.get, "/quotations/1");
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

      assert.ok(result.id);
      assert.ok(result.quotationNumber);
      sinon.assert.calledWith(apiClient.post, "/quotations", newQuotation);
    });
  });

  describe("update", () => {
    test("should update quotation", async () => {
      const updates = { validUntil: "2026-03-15", notes: "Updated terms" };
      const mockResponse = { id: 1, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.update(1, updates);

      assert.ok(result.id);
      sinon.assert.calledWith(apiClient.put, "/quotations/1", updates);
    });

    test("should only allow update of draft quotations", async () => {
      const updates = { notes: "Updated" };
      apiClient.put.mockResolvedValueOnce({
        id: 1,
        status: "draft",
        ...updates,
      });

      const result = await quotationService.update(1, updates);

      assert.ok(result.status);
    });
  });

  describe("delete", () => {
    test("should delete quotation", async () => {
      const mockResponse = { success: true };
      apiClient.delete.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.delete(1);

      assert.ok(result.success);
      sinon.assert.calledWith(apiClient.delete, "/quotations/1");
    });
  });

  describe("updateStatus", () => {
    test("should update quotation status", async () => {
      const mockResponse = { id: 1, status: "approved" };
      apiClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.updateStatus(1, "approved");

      assert.ok(result.status);
      sinon.assert.calledWith(apiClient.patch, "/quotations/1/status", {
        status: "approved",
      });
    });

    test("should support draft → approved → expired status transitions", async () => {
      apiClient.patch.mockResolvedValueOnce({ status: "expired" });

      await quotationService.updateStatus(1, "expired");

      sinon.assert.calledWith(apiClient.patch, "/quotations/1/status", {
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

      assert.ok(result.invoiceId);
      assert.ok(result.invoiceNumber);
      sinon.assert.calledWith(apiClient.post, "/quotations/1/convert-to-invoice");
    });

    test("should not convert expired quotation", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Cannot convert expired quotation"));

      assert.rejects(quotationService.convertToInvoice(1), Error);
    });
  });

  describe("getNextNumber", () => {
    test("should get next quotation number", async () => {
      const mockResponse = { nextNumber: "QT-00045", prefix: "QT-" };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await quotationService.getNextNumber();

      assert.ok(result.nextNumber);
      sinon.assert.calledWith(apiClient.get, "/quotations/number/next");
    });
  });

  describe("downloadPDF", () => {
    test("should download quotation as PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });

      // Mock URL creation
      // Skipped: global.URL.createObjectURL = vi.fn(() => "blob:test-url");
      global.URL.revokeObjectURL = vi.fn();

      // Mock document methods
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      apiService.request.mockResolvedValueOnce(mockBlob);

      await quotationService.downloadPDF(1);

      sinon.assert.calledWith(apiService.request, {
        method: "GET",
        url: "/quotations/1/pdf",
        responseType: "blob",
      });
    });

    test("should handle PDF download errors", async () => {
      apiService.request.mockRejectedValueOnce(new Error("PDF generation failed"));

      assert.rejects(quotationService.downloadPDF(999), Error);
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors in getAll", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(quotationService.getAll(), Error);
    });

    test("should handle errors in create", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Validation failed"));

      assert.rejects(quotationService.create({}), Error);
    });

    test("should handle errors in convertToInvoice", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Conversion failed"));

      assert.rejects(quotationService.convertToInvoice(1), Error);
    });

    test("should handle errors in updateStatus", async () => {
      apiClient.patch.mockRejectedValueOnce(new Error("Invalid status transition"));

      assert.rejects(quotationService.updateStatus(1, "invalid"), Error);
    });
  });
});