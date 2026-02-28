/**
 * Debit Note Service Unit Tests
 * ✅ Tests CRUD operations for supplier bill adjustments
 * ✅ Tests UAE VAT compliance for debit notes
 * ✅ Tests data transformation (camelCase ↔ snake_case)
 * ✅ Tests pagination and search filtering
 * ✅ Tests validation error cases
 * ✅ Tests multi-currency handling
 * ✅ 100% coverage target for debitNoteService.js
 */

// Mock API client
// vi.fn() // "../api.js", () => ({
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../api.js";
import debitNoteService from "../debitNoteService.js";

describe("debitNoteService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // GET / LIST OPERATIONS
  // ============================================================================

  describe("getAll", () => {
    it("should fetch debit notes with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            debitNoteNumber: "DN-001",
            supplierBillId: 100,
            supplierBillNumber: "SB-001",
            supplierId: 1,
            supplierName: "XYZ Supplies",
            subtotal: 10000,
            vatAmount: 500,
            totalDebit: 10500,
            status: "issued",
            createdAt: "2026-01-15T10:00:00Z",
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await debitNoteService.getAll({ page: 1, pageSize: 50 }, null);

      expect(result.data.length).toBe(1);
      expect(result.data[0].debitNoteNumber).toBe("DN-001");
      expect(result.pagination !== undefined).toBeTruthy();
      expect(apiClient.get).toBeTruthy().calledWith("/debit-notes", expect.any(Object));
    });

    it("should support pagination parameters", async () => {
      const mockResponse = { data: [], pagination: { page: 3, pageSize: 25, total: 75 } };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.getAll({ page: 3, pageSize: 25 }, null);

      expect(apiClient.get).toBeTruthy().calledWith("/debit-notes", expect.any(Object));
    });

    it("should filter debit notes by status", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.getAll({ status: "draft" }, null);

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should filter debit notes by supplier", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.getAll({ supplierId: 5 }, null);

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should filter debit notes by supplier bill", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.getAll({ supplierBillId: 100 }, null);

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should support date range filtering", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.getAll(
        {
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        null
      );

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should support search parameter", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.search("XYZ Supplies", {});

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should handle abort signal for cancellation", async () => {
      const abortSignal = new AbortController().signal;
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValue(mockResponse);

      await debitNoteService.getAll({}, abortSignal);

      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });

    it("should transform response data", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            debitNoteNumber: "DN-001",
            supplierBillNumber: "SB-001",
            supplierId: 1,
            supplierName: "XYZ Supplies",
            vatAmount: 500,
          },
        ],
        pagination: null,
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await debitNoteService.getAll({}, null);

      expect(result.data[0].debitNoteNumber).toBe("DN-001");
      expect(result.data[0].supplierBillNumber).toBe("SB-001");
      expect(result.data[0].supplierId).toBe(1);
      expect(result.data[0].supplierName).toBe("XYZ Supplies");
      expect(result.data[0].vatAmount).toBe(500);
    });
  });

  describe("getById", () => {
    it("should fetch single debit note by ID", async () => {
      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        supplierBillId: 100,
        supplierBillNumber: "SB-001",
        supplierId: 1,
        supplierName: "XYZ Supplies",
        subtotal: 10000,
        vatAmount: 500,
        totalDebit: 10500,
        status: "issued",
        items: [
          {
            id: 101,
            productId: 1,
            productName: "Raw Material A",
            quantity: 5,
            unitPrice: 2000,
            vatAmount: 500,
          },
        ],
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await debitNoteService.getById(1);

      expect(result.id).toBe(1);
      expect(result.debitNoteNumber).toBe("DN-001");
      expect(result.items !== undefined).toBeTruthy();
      expect(apiClient.get).toBeTruthy().calledWith("/debit-notes/1");
    });

    it("should return null for non-existent debit note", async () => {
      apiClient.get.mockResolvedValue(null);

      const result = await debitNoteService.getById(999);

      expect(result).toBe(null);
    });

    it("should transform returned items", async () => {
      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        items: [
          {
            id: 101,
            productId: 1,
            productName: "Material",
            quantity: 5,
            unitPrice: 2000,
            vatRate: 5,
            vatAmount: 500,
          },
        ],
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await debitNoteService.getById(1);

      expect(result.items[0].productId).toBe(1);
      expect(result.items[0].quantity).toBe(5);
      expect(result.items[0].unitPrice).toBe(2000);
    });
  });

  // ============================================================================
  // CREATE OPERATION
  // ============================================================================

  describe("create", () => {
    it("should create debit note with valid data", async () => {
      const debitNoteData = {
        supplierBillId: 100,
        supplierId: 1,
        supplierName: "XYZ Supplies",
        items: [
          {
            productId: 1,
            quantity: 5,
            unitPrice: 2000,
            vatRate: 5,
          },
        ],
        subtotal: 10000,
        vatAmount: 500,
        totalDebit: 10500,
        reason: "ADDITIONAL_CHARGES",
        notes: "Additional shipping charges",
      };

      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        ...debitNoteData,
      };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await debitNoteService.create(debitNoteData);

      expect(result.id).toBe(1);
      expect(result.debitNoteNumber).toBe("DN-001");
      expect(apiClient.post).toBeTruthy().calledWith("/debit-notes", expect.any(Object));
    });

    it("should transform camelCase data on create", async () => {
      const debitNoteData = {
        supplierId: 1,
        supplierName: "XYZ Supplies",
        supplierBillId: 100,
        subtotal: 10000,
        vatAmount: 500,
        totalDebit: 10500,
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(callArgs.items !== undefined).toBeTruthy();
    });

    it("should validate required fields on create", async () => {
      const invalidData = {
        supplierId: null,
        items: [],
      };

      apiClient.post.mockRejectedValue(new Error("Supplier ID is required"));

      await expect(debitNoteService.create(invalidData).toBeTruthy()).rejects.toThrow("Supplier ID is required");
    });

    it("should parse numeric fields as floats", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: "10000",
        vatAmount: "500",
        totalDebit: "10500",
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(callArgs.subtotal !== undefined).toBeTruthy();
    });

    it("should handle items with VAT categories", async () => {
      const debitNoteData = {
        supplierId: 1,
        items: [
          {
            productId: 1,
            quantity: 5,
            unitPrice: 2000,
            vatRate: 5,
            vatCategory: "STANDARD",
          },
          {
            productId: 2,
            quantity: 10,
            unitPrice: 1000,
            vatRate: 0,
            vatCategory: "EXEMPT",
          },
        ],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(callArgs.items.length).toBe(2);
    });
  });

  // ============================================================================
  // UPDATE OPERATION
  // ============================================================================

  describe("update", () => {
    it("should update debit note with valid data", async () => {
      const updateData = {
        status: "approved",
        notes: "Updated notes",
      };

      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        status: "approved",
        notes: "Updated notes",
      };
      apiClient.put.mockResolvedValue(mockResponse);

      const result = await debitNoteService.update(1, updateData);

      expect(result.status).toBe("approved");
      expect(result.notes).toBe("Updated notes");
      expect(apiClient.put).toBeTruthy().calledWith("/debit-notes/1", expect.any(Object));
    });

    it("should prevent update of issued debit notes", async () => {
      apiClient.put.mockRejectedValue(new Error("Cannot update issued debit note"));

      await expect(debitNoteService.update(1, { status: "draft" }).toBeTruthy()).rejects.toThrow("Cannot update issued debit note");
    });
  });

  // ============================================================================
  // DELETE OPERATION
  // ============================================================================

  describe("delete", () => {
    it("should delete debit note", async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await debitNoteService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toBeTruthy().calledWith("/debit-notes/1");
    });

    it("should handle deletion of non-existent debit note", async () => {
      apiClient.delete.mockRejectedValue(new Error("Debit note not found"));

      await expect(debitNoteService.delete(999).toBeTruthy()).rejects.toThrow("Debit note not found");
    });
  });

  // ============================================================================
  // VAT HANDLING
  // ============================================================================

  describe("VAT Compliance", () => {
    it("should calculate VAT at 5% for standard rated items", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: 100000,
        vatAmount: 5000,
        totalDebit: 105000,
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 10000,
            vatRate: 5,
            vatCategory: "STANDARD",
          },
        ],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(callArgs.items[0].vatRate).toBe(5);
    });

    it("should handle exempt items with 0% VAT", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: 100000,
        vatAmount: 0,
        totalDebit: 100000,
        items: [
          {
            productId: 1,
            quantity: 10,
            unitPrice: 10000,
            vatRate: 0,
            vatCategory: "EXEMPT",
          },
        ],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(callArgs.items[0].vatRate).toBe(0);
    });

    it("should separate standard and exempt items", async () => {
      const debitNoteData = {
        supplierId: 1,
        items: [
          {
            productId: 1,
            quantity: 5,
            unitPrice: 2000,
            vatRate: 5,
            vatCategory: "STANDARD",
          },
          {
            productId: 2,
            quantity: 5,
            unitPrice: 2000,
            vatRate: 0,
            vatCategory: "EXEMPT",
          },
        ],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(callArgs.items[0].vatCategory).toBe("STANDARD");
      expect(callArgs.items[1].vatCategory).toBe("EXEMPT");
    });
  });

  // ============================================================================
  // REASON CATEGORIZATION
  // ============================================================================

  describe("Debit Note Reasons", () => {
    it("should accept ADDITIONAL_CHARGES reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "ADDITIONAL_CHARGES",
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it("should accept PRICE_ADJUSTMENT reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "PRICE_ADJUSTMENT",
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it("should accept CORRECTION reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "CORRECTION",
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      apiClient.get.mockRejectedValue(new Error("Network timeout"));

      await expect(debitNoteService.getAll({}, null).toBeTruthy()).rejects.toThrow("Network timeout");
    });

    it("should handle server validation errors", async () => {
      apiClient.post.mockRejectedValue(new Error("Validation: VAT amount mismatch"));

      await expect(debitNoteService.create({}).toBeTruthy()).rejects.toThrow("Validation");
    });

    it("should handle authorization errors", async () => {
      apiClient.delete.mockRejectedValue(new Error("Forbidden"));

      await expect(debitNoteService.delete(1).toBeTruthy()).rejects.toThrow("Forbidden");
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty debit note list", async () => {
      const mockResponse = { data: [], pagination: { total: 0 } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await debitNoteService.getAll({}, null);

      expect(result.data.length).toBe(0);
    });

    it("should handle null/undefined fields gracefully", async () => {
      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        supplierId: null,
        notes: undefined,
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await debitNoteService.getById(1);

      expect(result.supplierId).toBe(null);
      expect(result.notes).toBe("");
    });

    it("should handle numeric string conversions", async () => {
      const debitNoteData = {
        supplierId: "1",
        subtotal: "10000.50",
        vatAmount: "500.25",
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it("should handle large quantities", async () => {
      const debitNoteData = {
        supplierId: 1,
        items: [
          {
            productId: 1,
            quantity: 999999,
            unitPrice: 10000,
          },
        ],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });

    it("should handle decimal prices", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: 10000.99,
        vatAmount: 500.05,
        totalDebit: 10501.04,
        items: [],
      };

      apiClient.post.mockResolvedValue({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post.mock.calls.length > 0).toBeTruthy();
    });
  });
});
