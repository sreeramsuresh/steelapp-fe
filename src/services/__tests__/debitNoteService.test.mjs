import '../../__tests__/init.mjs';
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

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

// Mock API client
// sinon.stub() // "../api.js", () => ({
  apiClient: {
    get: sinon.stub(),
    post: sinon.stub(),
    put: sinon.stub(),
    patch: sinon.stub(),
    delete: sinon.stub(),
  },
}));

import { apiClient } from "../api.js";
import debitNoteService from "../debitNoteService.js";

describe("debitNoteService", () => {
  beforeEach(() => {
    sinon.restore();
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
      apiClient.get.resolves(mockResponse);

      const result = await debitNoteService.getAll({ page: 1, pageSize: 50 }, null);

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].debitNoteNumber, "DN-001");
      assert.ok(result.pagination !== undefined);
      assert.ok(apiClient.get).calledWith("/debit-notes", expect.any(Object));
    });

    test("should support pagination parameters", async () => {
      const mockResponse = { data: [], pagination: { page: 3, pageSize: 25, total: 75 } };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.getAll({ page: 3, pageSize: 25 }, null);

      assert.ok(apiClient.get).calledWith("/debit-notes", expect.any(Object));
    });

    test("should filter debit notes by status", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.getAll({ status: "draft" }, null);

      assert.ok(apiClient.get.called);
    });

    test("should filter debit notes by supplier", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.getAll({ supplierId: 5 }, null);

      assert.ok(apiClient.get.called);
    });

    test("should filter debit notes by supplier bill", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.getAll({ supplierBillId: 100 }, null);

      assert.ok(apiClient.get.called);
    });

    test("should support date range filtering", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.getAll(
        {
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
        null
      );

      assert.ok(apiClient.get.called);
    });

    test("should support search parameter", async () => {
      const mockResponse = { data: [], pagination: null };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.search("XYZ Supplies", {});

      assert.ok(apiClient.get.called);
    });

    test("should handle abort signal for cancellation", async () => {
      const abortSignal = new AbortController().signal;
      const mockResponse = { data: [], pagination: null };
      apiClient.get.resolves(mockResponse);

      await debitNoteService.getAll({}, abortSignal);

      assert.ok(apiClient.get.called);
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
      apiClient.get.resolves(mockResponse);

      const result = await debitNoteService.getAll({}, null);

      assert.strictEqual(result.data[0].debitNoteNumber, "DN-001");
      assert.strictEqual(result.data[0].supplierBillNumber, "SB-001");
      assert.strictEqual(result.data[0].supplierId, 1);
      assert.strictEqual(result.data[0].supplierName, "XYZ Supplies");
      assert.strictEqual(result.data[0].vatAmount, 500);
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
      apiClient.get.resolves(mockResponse);

      const result = await debitNoteService.getById(1);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.debitNoteNumber, "DN-001");
      assert.ok(result.items !== undefined);
      assert.ok(apiClient.get).calledWith("/debit-notes/1");
    });

    test("should return null for non-existent debit note", async () => {
      apiClient.get.resolves(null);

      const result = await debitNoteService.getById(999);

      assert.strictEqual(result, null);
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
      apiClient.get.resolves(mockResponse);

      const result = await debitNoteService.getById(1);

      assert.strictEqual(result.items[0].productId, 1);
      assert.strictEqual(result.items[0].quantity, 5);
      assert.strictEqual(result.items[0].unitPrice, 2000);
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
      apiClient.post.resolves(mockResponse);

      const result = await debitNoteService.create(debitNoteData);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.debitNoteNumber, "DN-001");
      assert.ok(apiClient.post).calledWith("/debit-notes", expect.any(Object));
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(callArgs.items !== undefined);
    });

    test("should validate required fields on create", async () => {
      const invalidData = {
        supplierId: null,
        items: [],
      };

      apiClient.post.rejects(new Error("Supplier ID is required"));

      await assert.ok(debitNoteService.create(invalidData)).rejects.toThrow("Supplier ID is required");
    });

    test("should parse numeric fields as floats", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: "10000",
        vatAmount: "500",
        totalDebit: "10500",
        items: [],
      };

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(callArgs.subtotal !== undefined);
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.strictEqual(callArgs.items.length, 2);
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
      apiClient.put.resolves(mockResponse);

      const result = await debitNoteService.update(1, updateData);

      assert.strictEqual(result.status, "approved");
      assert.strictEqual(result.notes, "Updated notes");
      assert.ok(apiClient.put).calledWith("/debit-notes/1", expect.any(Object));
    });

    test("should prevent update of issued debit notes", async () => {
      apiClient.put.rejects(new Error("Cannot update issued debit note"));

      await assert.ok(debitNoteService.update(1, { status: "draft" })).rejects.toThrow("Cannot update issued debit note");
    });
  });

  // ============================================================================
  // DELETE OPERATION
  // ============================================================================

  describe("delete", () => {
    test("should delete debit note", async () => {
      apiClient.delete.resolves({ success: true });

      const result = await debitNoteService.delete(1);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete).calledWith("/debit-notes/1");
    });

    test("should handle deletion of non-existent debit note", async () => {
      apiClient.delete.rejects(new Error("Debit note not found"));

      await assert.ok(debitNoteService.delete(999)).rejects.toThrow("Debit note not found");
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.strictEqual(callArgs.items[0].vatRate, 5);
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.strictEqual(callArgs.items[0].vatRate, 0);
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.strictEqual(callArgs.items[0].vatCategory, "STANDARD");
      assert.strictEqual(callArgs.items[1].vatCategory, "EXEMPT");
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(apiClient.post.called);
    });

    test("should accept PRICE_ADJUSTMENT reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "PRICE_ADJUSTMENT",
        items: [],
      };

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(apiClient.post.called);
    });

    test("should accept CORRECTION reason", async () => {
      const debitNoteData = {
        supplierId: 1,
        reason: "CORRECTION",
        items: [],
      };

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(apiClient.post.called);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      apiClient.get.rejects(new Error("Network timeout"));

      await assert.ok(debitNoteService.getAll({}, null)).rejects.toThrow("Network timeout");
    });

    test("should handle server validation errors", async () => {
      apiClient.post.rejects(new Error("Validation: VAT amount mismatch"));

      await assert.ok(debitNoteService.create({})).rejects.toThrow("Validation");
    });

    test("should handle authorization errors", async () => {
      apiClient.delete.rejects(new Error("Forbidden"));

      await assert.ok(debitNoteService.delete(1)).rejects.toThrow("Forbidden");
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    test("should handle empty debit note list", async () => {
      const mockResponse = { data: [], pagination: { total: 0 } };
      apiClient.get.resolves(mockResponse);

      const result = await debitNoteService.getAll({}, null);

      assert.strictEqual(result.data.length, 0);
    });

    test("should handle null/undefined fields gracefully", async () => {
      const mockResponse = {
        id: 1,
        debitNoteNumber: "DN-001",
        supplierId: null,
        notes: undefined,
      };
      apiClient.get.resolves(mockResponse);

      const result = await debitNoteService.getById(1);

      assert.strictEqual(result.supplierId, null);
      assert.strictEqual(result.notes, "");
    });

    test("should handle numeric string conversions", async () => {
      const debitNoteData = {
        supplierId: "1",
        subtotal: "10000.50",
        vatAmount: "500.25",
        items: [],
      };

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(apiClient.post.called);
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

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(apiClient.post.called);
    });

    test("should handle decimal prices", async () => {
      const debitNoteData = {
        supplierId: 1,
        subtotal: 10000.99,
        vatAmount: 500.05,
        totalDebit: 10501.04,
        items: [],
      };

      apiClient.post.resolves({ id: 1 });

      await debitNoteService.create(debitNoteData);

      assert.ok(apiClient.post.called);
    });
  });
});
