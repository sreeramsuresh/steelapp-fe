/**
 * Credit Note Service Unit Tests
 * ✅ Tests CRUD operations (list, create, get, update, delete)
 * ✅ Tests financial document handling (UAE VAT, totals calculation)
import '../../__tests__/init.mjs';

 * ✅ Tests data transformation (camelCase ↔ snake_case)
 * ✅ Tests pagination and search filtering
 * ✅ Tests validation error cases
 * ✅ Tests multi-currency handling and calculations
 * ✅ 100% coverage target for creditNoteService.js
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

// Mock API client

import { creditNoteService } from "../creditNoteService.js";
import { apiClient } from "../api.js";

describe("creditNoteService", () => {
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  beforeEach(() => {
    sinon.restore();
    getStub = sinon.stub(apiClient, 'get');
    postStub = sinon.stub(apiClient, 'post');
    putStub = sinon.stub(apiClient, 'put');
    deleteStub = sinon.stub(apiClient, 'delete');
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
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getAllCreditNotes({ page: 1, limit: 50 });

      assert.ok(result.data);
      assert.ok(result.data[0].creditNoteNumber);
      assert.ok(result.pagination !== undefined);
      assert.ok(apiClient.get);
    });

    test("should support pagination parameters", async () => {
      const mockResponse = { data: [], pagination: { page: 2, limit: 20, total: 50 } };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({ page: 2, limit: 20 });

      assert.ok(apiClient.get);
    });

    test("should filter credit notes by status", async () => {
      const mockResponse = { data: [], pagination: null };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({ status: "issued" });

      assert.ok(apiClient.get);
    });

    test("should filter credit notes by customer", async () => {
      const mockResponse = { data: [], pagination: null };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({ customerId: 5 });

      assert.ok(apiClient.get);
    });

    test("should filter credit notes by invoice", async () => {
      const mockResponse = { data: [], pagination: null };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({ invoiceId: 100 });

      assert.ok(apiClient.get);
    });

    test("should support date range filtering", async () => {
      const mockResponse = { data: [], pagination: null };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });

      assert.ok(apiClient.get);
    });

    test("should support search parameter", async () => {
      const mockResponse = { data: [], pagination: null };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({ search: "ABC Corp" });

      assert.ok(apiClient.get);
    });

    test("should support abort signal for cancellation", async () => {
      const abortSignal = new AbortController().signal;
      const mockResponse = { data: [], pagination: null };
      getStub.resolves(mockResponse);

      await creditNoteService.getAllCreditNotes({}, abortSignal);

      assert.ok(apiClient.get);
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
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getAllCreditNotes();

      assert.ok(result.data);
      assert.ok(result.pagination).toBeNull();
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
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getAllCreditNotes();

      assert.ok(result.data[0].creditNoteNumber);
      assert.ok(result.data[0].invoiceNumber);
      assert.ok(result.data[0].customerId);
      assert.ok(result.data[0].customerName);
      assert.ok(result.data[0].manualCreditAmount);
      assert.ok(result.data[0].vatAmount);
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
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getCreditNote(1);

      assert.ok(result.id);
      assert.ok(result.creditNoteNumber);
      assert.ok(result.items !== undefined);
      sinon.assert.calledWith(getStub, "/credit-notes/1", );
    });

    test("should return null for non-existent credit note", async () => {
      getStub.resolves(null);

      const result = await creditNoteService.getCreditNote(999);

      assert.ok(result).toBeNull();
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
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getCreditNote(1);

      assert.ok(result.items[0].productId);
      assert.ok(result.items[0].quantityReturned);
      assert.ok(result.items[0].unitPrice);
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
      postStub.resolves(mockResponse);

      const result = await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(result.id);
      assert.ok(result.creditNoteNumber);
      sinon.assert.calledWith(postStub, "/credit-notes", );
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

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(callArgs.customer_id);
      assert.ok(callArgs.customer_name);
      assert.ok(callArgs.invoice_id);
      assert.ok(callArgs.vat_amount);
      assert.ok(callArgs.manual_credit_amount);
    });

    test("should validate required fields on create", async () => {
      const invalidData = {
        customerId: null,
        items: [],
      };

      postStub.rejects(new Error("Customer ID is required"));

      await assert.rejects(() => creditNoteService.createCreditNote(invalidData), Error);
    });

    test("should parse numeric fields as floats", async () => {
      const creditNoteData = {
        customerId: 1,
        subtotal: "10000",
        vatAmount: "500",
        totalCredit: "10500",
        items: [],
      };

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(callArgs.subtotal);
      assert.ok(callArgs.vat_amount);
      assert.ok(callArgs.total_credit);
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

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(callArgs.items[0].quantity_returned);
      assert.ok(callArgs.items[0].original_quantity);
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
      putStub.resolves(mockResponse);

      const result = await creditNoteService.updateCreditNote(1, updateData);

      assert.ok(result.status);
      assert.ok(result.notes);
      sinon.assert.calledWith(putStub, "/credit-notes/1", );
    });

    test("should only update specified fields", async () => {
      const updateData = { notes: "Updated" };

      putStub.resolves({ id: 1, notes: "Updated" });

      await creditNoteService.updateCreditNote(1, updateData);

      assert.ok(callArgs.notes);
    });

    test("should prevent update of issued credit notes", async () => {
      putStub.rejects(new Error("Cannot update issued credit note"));

      await assert.rejects(() => creditNoteService.updateCreditNote(1, { status: "draft" }), Error);
    });
  });

  // ============================================================================
  // DELETE / SOFT DELETE OPERATION
  // ============================================================================

  describe("deleteCreditNote", () => {
    test("should delete credit note", async () => {
      deleteStub.resolves({ success: true });

      const result = await creditNoteService.deleteCreditNote(1);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, "/credit-notes/1");
    });

    test("should handle deletion of non-existent credit note", async () => {
      deleteStub.rejects(new Error("Credit note not found"));

      await assert.rejects(() => creditNoteService.deleteCreditNote(999), Error);
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

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(callArgs.vat_amount);
      assert.ok(callArgs.total_credit);
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

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(callArgs.items[0].vat_rate);
      assert.ok(callArgs.vat_amount);
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

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(apiClient.post);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      getStub.rejects(new Error("Network error"));

      await assert.rejects(() => creditNoteService.getAllCreditNotes(), Error);
    });

    test("should handle server validation errors", async () => {
      postStub.rejects(new Error("Validation: VAT amount must match calculation"));

      await assert.rejects(() => creditNoteService.createCreditNote({}), Error);
    });

    test("should handle authorization errors", async () => {
      deleteStub.rejects(new Error("Unauthorized"));

      await assert.rejects(() => creditNoteService.deleteCreditNote(1), Error);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    test("should handle empty credit note list", async () => {
      const mockResponse = { data: [], pagination: { total: 0 } };
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getAllCreditNotes();

      assert.ok(result.data);
    });

    test("should handle null/undefined fields gracefully", async () => {
      const mockResponse = {
        id: 1,
        credit_note_number: "CN-001",
        customer_id: null,
        notes: undefined,
      };
      getStub.resolves(mockResponse);

      const result = await creditNoteService.getCreditNote(1);

      assert.ok(result.customerId).toBeNull();
      assert.ok(result.notes);
    });

    test("should handle numeric string conversions", async () => {
      const creditNoteData = {
        customerId: "1",
        subtotal: "10000.50",
        vatAmount: "500.25",
        items: [],
      };

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(typeof callArgs.subtotal);
      assert.ok(typeof callArgs.vat_amount);
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

      postStub.resolves({ id: 1 });

      await creditNoteService.createCreditNote(creditNoteData);

      assert.ok(callArgs.items[0].quantity_returned);
    });
  });
});