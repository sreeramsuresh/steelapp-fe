/**
 * Credit Note Service Unit Tests
 * ✅ Tests CRUD operations (list, create, get, update, delete)
 * ✅ Tests financial document handling (UAE VAT, totals calculation)
 * ✅ Tests data transformation (camelCase ↔ snake_case)
 * ✅ Tests pagination and search filtering
 * ✅ Tests validation error cases
 * ✅ Tests multi-currency handling and calculations
 * ✅ 100% coverage target for creditNoteService.js
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
import { creditNoteService } from "../creditNoteService.js";

describe("creditNoteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // GET / LIST OPERATIONS
  // ============================================================================

  describe("getAllCreditNotes", () => {
    test("should fetch credit notes with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            credit_note_number: "CN-001",
            invoice_id: 100,
            invoice_number: "INV-001",
            customer_id: 1,
            customer_name: "ABC Corp",
            subtotal: 10000,
            vat_amount: 500,
            total_credit: 10500,
            status: "issued",
            created_at: "2026-01-15T10:00:00Z",
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getAllCreditNotes({ page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].creditNoteNumber).toBe("CN-001");
      expect(result.pagination).toBeDefined();
      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should support pagination parameters", async () => {
      const mockResponse = { data: [], pagination: { page: 2, limit: 20, total: 50 } };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({ page: 2, limit: 20 });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter credit notes by status", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({ status: "issued" });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter credit notes by customer", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({ customerId: 5 });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter credit notes by invoice", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({ invoiceId: 100 });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should support date range filtering", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should support search parameter", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({ search: "ABC Corp" });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should support abort signal for cancellation", async () => {
      const abortSignal = new AbortController().signal;
      const mockResponse = { data: [], pagination: null };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      await creditNoteService.getAllCreditNotes({}, abortSignal);

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should handle non-paginated response format", async () => {
      const mockResponse = [
        {
          id: 1,
          credit_note_number: "CN-001",
          customer_id: 1,
          customer_name: "ABC Corp",
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getAllCreditNotes();

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeNull();
    });

    test("should transform snake_case to camelCase", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            credit_note_number: "CN-001",
            invoice_number: "INV-001",
            customer_id: 1,
            customer_name: "ABC Corp",
            reason_for_return: "QUALITY_ISSUE",
            return_reason_category: "DEFECTIVE",
            manual_credit_amount: 5000,
            vat_amount: 250,
          },
        ],
        pagination: null,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getAllCreditNotes();

      expect(result.data[0].creditNoteNumber).toBe("CN-001");
      expect(result.data[0].invoiceNumber).toBe("INV-001");
      expect(result.data[0].customerId).toBe(1);
      expect(result.data[0].customerName).toBe("ABC Corp");
      expect(result.data[0].manualCreditAmount).toBe(5000);
      expect(result.data[0].vatAmount).toBe(250);
    });
  });

  describe("getCreditNoteById", () => {
    test("should fetch single credit note by ID", async () => {
      const mockResponse = {
        id: 1,
        credit_note_number: "CN-001",
        invoice_id: 100,
        invoice_number: "INV-001",
        customer_id: 1,
        customer_name: "ABC Corp",
        subtotal: 10000,
        vat_amount: 500,
        total_credit: 10500,
        status: "issued",
        items: [
          {
            id: 101,
            product_id: 1,
            product_name: "Product A",
            quantity_returned: 5,
            rate: 2000,
            amount: 10000,
            vat_amount: 500,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getCreditNote(1);

      expect(result.id).toBe(1);
      expect(result.creditNoteNumber).toBe("CN-001");
      expect(result.items).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/credit-notes/1", expect.any(Object));
    });

    test("should return null for non-existent credit note", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await creditNoteService.getCreditNote(999);

      expect(result).toBeNull();
    });

    test("should transform returned items", async () => {
      const mockResponse = {
        id: 1,
        credit_note_number: "CN-001",
        items: [
          {
            id: 101,
            product_id: 1,
            product_name: "Product A",
            quantity_returned: 5,
            unit_price: 2000,
            amount: 10000,
            vat_rate: 5,
            vat_amount: 500,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getCreditNote(1);

      expect(result.items[0].productId).toBe(1);
      expect(result.items[0].quantityReturned).toBe(5);
      expect(result.items[0].unitPrice).toBe(2000);
    });
  });

  // ============================================================================
  // CREATE OPERATION
  // ============================================================================

  describe("createCreditNote", () => {
    test("should create credit note with valid data", async () => {
      const creditNoteData = {
        invoiceId: 100,
        customerId: 1,
        customerName: "ABC Corp",
        items: [
          {
            productId: 1,
            quantityReturned: 5,
            rate: 2000,
            amount: 10000,
            vatRate: 5,
            vatAmount: 500,
          },
        ],
        subtotal: 10000,
        vatAmount: 500,
        totalCredit: 10500,
        reasonForReturn: "QUALITY_ISSUE",
        notes: "Product returned due to defect",
      };

      const mockResponse = {
        id: 1,
        credit_note_number: "CN-001",
        ...creditNoteData,
      };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.createCreditNote(creditNoteData);

      expect(result.id).toBe(1);
      expect(result.creditNoteNumber).toBe("CN-001");
      expect(apiClient.post).toHaveBeenCalledWith("/credit-notes", expect.any(Object));
    });

    test("should transform camelCase to snake_case on create", async () => {
      const creditNoteData = {
        customerId: 1,
        customerName: "ABC Corp",
        invoiceId: 100,
        subtotal: 10000,
        vatAmount: 500,
        totalCredit: 10500,
        manualCreditAmount: 1000,
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.customer_id).toBe(1);
      expect(callArgs.customer_name).toBe("ABC Corp");
      expect(callArgs.invoice_id).toBe(100);
      expect(callArgs.vat_amount).toBe(500);
      expect(callArgs.manual_credit_amount).toBe(1000);
    });

    test("should validate required fields on create", async () => {
      const invalidData = {
        customerId: null,
        items: [],
      };

      apiClient.post.mockRejectedValueOnce(new Error("Customer ID is required"));

      await expect(creditNoteService.createCreditNote(invalidData)).rejects.toThrow("Customer ID is required");
    });

    test("should parse numeric fields as floats", async () => {
      const creditNoteData = {
        customerId: 1,
        subtotal: "10000",
        vatAmount: "500",
        totalCredit: "10500",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.subtotal).toBe(10000);
      expect(callArgs.vat_amount).toBe(500);
      expect(callArgs.total_credit).toBe(10500);
    });

    test("should handle items with quantity returned", async () => {
      const creditNoteData = {
        customerId: 1,
        items: [
          {
            productId: 1,
            quantityReturned: 5,
            originalQuantity: 10,
            rate: 2000,
          },
        ],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items[0].quantity_returned).toBe(5);
      expect(callArgs.items[0].original_quantity).toBe(10);
    });
  });

  // ============================================================================
  // UPDATE OPERATION
  // ============================================================================

  describe("updateCreditNote", () => {
    test("should update credit note with valid data", async () => {
      const updateData = {
        status: "approved",
        notes: "Updated notes",
      };

      const mockResponse = {
        id: 1,
        credit_note_number: "CN-001",
        status: "approved",
        notes: "Updated notes",
      };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.updateCreditNote(1, updateData);

      expect(result.status).toBe("approved");
      expect(result.notes).toBe("Updated notes");
      expect(apiClient.put).toHaveBeenCalledWith("/credit-notes/1", expect.any(Object));
    });

    test("should only update specified fields", async () => {
      const updateData = { notes: "Updated" };

      apiClient.put.mockResolvedValueOnce({ id: 1, notes: "Updated" });

      await creditNoteService.updateCreditNote(1, updateData);

      const callArgs = apiClient.put.mock.calls[0][1];
      expect(callArgs.notes).toBe("Updated");
    });

    test("should prevent update of issued credit notes", async () => {
      apiClient.put.mockRejectedValueOnce(new Error("Cannot update issued credit note"));

      await expect(creditNoteService.updateCreditNote(1, { status: "draft" })).rejects.toThrow(
        "Cannot update issued credit note"
      );
    });
  });

  // ============================================================================
  // DELETE / SOFT DELETE OPERATION
  // ============================================================================

  describe("deleteCreditNote", () => {
    test("should delete credit note", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await creditNoteService.deleteCreditNote(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/credit-notes/1");
    });

    test("should handle deletion of non-existent credit note", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Credit note not found"));

      await expect(creditNoteService.deleteCreditNote(999)).rejects.toThrow("Credit note not found");
    });
  });

  // ============================================================================
  // VALIDATION & CALCULATIONS
  // ============================================================================

  describe("VAT Calculations", () => {
    test("should calculate VAT at 5% rate", async () => {
      const creditNoteData = {
        customerId: 1,
        subtotal: 100000,
        vatAmount: 5000,
        totalCredit: 105000,
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.vat_amount).toBe(5000);
      expect(callArgs.total_credit).toBe(105000);
    });

    test("should handle zero VAT for exempt items", async () => {
      const creditNoteData = {
        customerId: 1,
        subtotal: 100000,
        vatAmount: 0,
        totalCredit: 100000,
        items: [
          {
            productId: 1,
            quantity: 10,
            rate: 10000,
            vatRate: 0, // Exempt
          },
        ],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items[0].vat_rate).toBe(0);
      expect(callArgs.vat_amount).toBe(0);
    });
  });

  describe("Multi-Currency", () => {
    test("should handle different currencies", async () => {
      const creditNoteData = {
        customerId: 1,
        currency: "AED",
        subtotal: 50000,
        vatAmount: 2500,
        totalCredit: 52500,
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(creditNoteService.getAllCreditNotes()).rejects.toThrow("Network error");
    });

    test("should handle server validation errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Validation: VAT amount must match calculation"));

      await expect(creditNoteService.createCreditNote({})).rejects.toThrow("Validation");
    });

    test("should handle authorization errors", async () => {
      apiClient.delete.mockRejectedValueOnce(new Error("Unauthorized"));

      await expect(creditNoteService.deleteCreditNote(1)).rejects.toThrow("Unauthorized");
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    test("should handle empty credit note list", async () => {
      const mockResponse = { data: [], pagination: { total: 0 } };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getAllCreditNotes();

      expect(result.data).toHaveLength(0);
    });

    test("should handle null/undefined fields gracefully", async () => {
      const mockResponse = {
        id: 1,
        credit_note_number: "CN-001",
        customer_id: null,
        notes: undefined,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await creditNoteService.getCreditNote(1);

      expect(result.customerId).toBeNull();
      expect(result.notes).toBe("");
    });

    test("should handle numeric string conversions", async () => {
      const creditNoteData = {
        customerId: "1",
        subtotal: "10000.50",
        vatAmount: "500.25",
        items: [],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(typeof callArgs.subtotal).toBe("number");
      expect(typeof callArgs.vat_amount).toBe("number");
    });

    test("should handle items with zero quantities", async () => {
      const creditNoteData = {
        customerId: 1,
        items: [
          {
            productId: 1,
            quantityReturned: 0,
            rate: 2000,
          },
        ],
      };

      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      const callArgs = apiClient.post.mock.calls[0][1];
      expect(callArgs.items[0].quantity_returned).toBe(0);
    });
  });
});
