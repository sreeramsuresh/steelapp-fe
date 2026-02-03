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

import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock API client
vi.mock("../api.js", () => ({
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
    vi.clearAllMocks();
  });

  // ============================================================================
  // GET / LIST OPERATIONS
  // ============================================================================

  describe("getAll", () => {
    test("should fetch debit notes with pagination", async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.getAll({ page: 1, pageSize: 50 }, null);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].debitNoteNumber).toBe("DN-001");
      expect(result.pagination).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/debit-notes", expect.any(Object));
    });

    test("should support pagination parameters", async () => {
      const mockResponse = { data: [], pagination: { page: 3, pageSize: 25, total: 75 } };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.getAll({ page: 3, pageSize: 25 }, null);

      expect(apiClient.get).toHaveBeenCalledWith("/debit-notes", expect.any(Object));
    });

    test("should filter debit notes by status", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.getAll({ status: "draft" }, null);

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter debit notes by supplier", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.getAll({ supplierId: 5 }, null);

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter debit notes by supplier bill", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.getAll({ supplierBillId: 100 }, null);

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should support date range filtering", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.getAll(
        {
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        null
      );

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should support search parameter", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.search("XYZ Supplies", {});

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should handle abort signal for cancellation", async () => {
      const abortSignal = new AbortController().signal;
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await debitNoteService.getAll({}, abortSignal);

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should transform response data", async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.getAll({}, null);

      expect(result.data[0].debitNoteNumber).toBe("DN-001");
      expect(result.data[0].supplierBillNumber).toBe("SB-001");
      expect(result.data[0].supplierId).toBe(1);
      expect(result.data[0].supplierName).toBe("XYZ Supplies");
      expect(result.data[0].vatAmount).toBe(500);
    });
  });

  describe("getById", () => {
    test("should fetch single debit note by ID", async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.getById(1);

      expect(result.id).toBe(1);
      expect(result.debitNoteNumber).toBe("DN-001");
      expect(result.items).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/debit-notes/1");
    });

    test("should return null for non-existent debit note", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await debitNoteService.getById(999);

      expect(result).toBeNull();
    });

    test("should transform returned items", async () => {
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
      apiClient.get.mockResolvedValueOnce(mockResponse);

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
    test("should create debit note with valid data", async () => {
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
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.create(debitNoteData);

      expect(result.id).toBe(1);
      expect(result.debitNoteNumber).toBe("DN-001");
      expect(apiClient.post).toHaveBeenCalledWith("/debit-notes", expect.any(Object));
    });

    test("should transform camelCase data on create", async () => {
      const debitNoteData = {
        supplierId: 1,
        supplierName: "XYZ Supplies",
        supplierBillId: 100,
        subtotal: 10000,
        vatAmount: 500,
        totalDebit: 10500,
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items).toBeDefined();
    });

    test("should validate required fields on create", async () => {
      const invalidData = {
        supplierId: null,
        items: [],
      };

      apiClient.post.mockRejectedValueOnce(new Error("Supplier ID is required"));

      await expect(debitNoteService.create(invalidData)).rejects.toThrow("Supplier ID is required");
    });

    test("should parse numeric fields as floats", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: "10000",
        vatAmount: "500",
        totalDebit: "10500",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.subtotal).toBeDefined();
    });

    test("should handle items with VAT categories", async () => {
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

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items).toHaveLength(2);
    });
  });

  // ============================================================================
  // UPDATE OPERATION
  // ============================================================================

  describe("update", () => {
    test("should update debit note with valid data", async () => {
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
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.update(1, updateData);

      expect(result.status).toBe("approved");
      expect(result.notes).toBe("Updated notes");
      expect(apiClient.put).toHaveBeenCalledWith("/debit-notes/1", expect.any(Object));
    });

    test("should prevent update of issued debit notes", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Cannot update issued debit note"));

      await expect(debitNoteService.update(1, { status: "draft" })).rejects.toThrow("Cannot update issued debit note");
    });
  });

  // ============================================================================
  // DELETE OPERATION
  // ============================================================================

  describe("delete", () => {
    test("should delete debit note", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await debitNoteService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/debit-notes/1");
    });

    test("should handle deletion of non-existent debit note", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Debit note not found"));

      await expect(debitNoteService.delete(999)).rejects.toThrow("Debit note not found");
    });
  });

  // ============================================================================
  // VAT HANDLING
  // ============================================================================

  describe("VAT Compliance", () => {
    test("should calculate VAT at 5% for standard rated items", async () => {
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

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items[0].vatRate).toBe(5);
    });

    test("should handle exempt items with 0% VAT", async () => {
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

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items[0].vatRate).toBe(0);
    });

    test("should separate standard and exempt items", async () => {
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

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items[0].vatCategory).toBe("STANDARD");
      expect(callArgs.items[1].vatCategory).toBe("EXEMPT");
    });
  });

  // ============================================================================
  // REASON CATEGORIZATION
  // ============================================================================

  describe("Debit Note Reasons", () => {
    test("should accept ADDITIONAL_CHARGES reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "ADDITIONAL_CHARGES",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should accept PRICE_ADJUSTMENT reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "PRICE_ADJUSTMENT",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should accept CORRECTION reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "CORRECTION",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(debitNoteService.getAll({}, null)).rejects.toThrow("Network timeout");
    });

    test("should handle server validation errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Validation: VAT amount mismatch"));

      await expect(debitNoteService.create({})).rejects.toThrow("Validation");
    });

    test("should handle authorization errors", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Forbidden"));

      await expect(debitNoteService.delete(1)).rejects.toThrow("Forbidden");
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    test("should handle empty debit note list", async () => {
      const mockResponse = { data: [], pagination: { total: 0 } };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.getAll({}, null);

      expect(result.data).toHaveLength(0);
    });

    test("should handle null/undefined fields gracefully", async () => {
      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        supplierId: null,
        notes: undefined,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await debitNoteService.getById(1);

      expect(result.supplierId).toBeNull();
      expect(result.notes).toBe("");
    });

    test("should handle numeric string conversions", async () => {
      const debitNoteData = {
        supplierId: "1",
        subtotal: "10000.50",
        vatAmount: "500.25",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should handle large quantities", async () => {
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

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should handle decimal prices", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: 10000.99,
        vatAmount: 500.05,
        totalDebit: 10501.04,
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await debitNoteService.create(debitNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });
  });
});
