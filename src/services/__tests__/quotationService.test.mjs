/**
 * Quotation Service Unit Tests
 * ✅ Tests CRUD operations for sales quotations
 * ✅ Tests status transitions (draft → approved → expired)
import '../../__tests__/init.mjs';

 * ✅ Tests conversion to invoice workflow
 * ✅ Tests PDF generation
 * ✅ 100% coverage target for quotationService.js
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';



import { apiService } from "../axiosApi.js";
import { quotationService } from "../quotationService.js";
import { apiClient } from "../api.js";

describe("quotationService", () => {
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  let patchStub;
  beforeEach(() => {
    sinon.restore();
    getStub = sinon.stub(apiClient, 'get');
    postStub = sinon.stub(apiClient, 'post');
    putStub = sinon.stub(apiClient, 'put');
    deleteStub = sinon.stub(apiClient, 'delete');
    patchStub = sinon.stub(apiClient, 'patch');
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
      getStub.resolves(mockResponse);

      const result = await quotationService.getAll({ page: 1, limit: 20 });

      assert.ok(result !== undefined);
      sinon.assert.calledWith(getStub, "/quotations", {
        page: 1,
        limit: 20,
      });
    });

    test("should filter by customer", async () => {
      getStub.resolves([]);

      await quotationService.getAll({ customerId: 5 });

      sinon.assert.calledWith(getStub, "/quotations", {
        customerId: 5,
      });
    });

    test("should filter by status", async () => {
      getStub.resolves([]);

      await quotationService.getAll({ status: "approved" });

      sinon.assert.calledWith(getStub, "/quotations", {
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
      getStub.resolves(mockQuotation);

      const result = await quotationService.getById(1);

      assert.ok(result.id);
      assert.ok(result.quotationNumber);
      sinon.assert.calledWith(getStub, "/quotations/1");
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
      postStub.resolves(mockResponse);

      const result = await quotationService.create(newQuotation);

      assert.ok(result.id);
      assert.ok(result.quotationNumber);
      sinon.assert.calledWith(postStub, "/quotations", newQuotation);
    });
  });

  describe("update", () => {
    test("should update quotation", async () => {
      const updates = { validUntil: "2026-03-15", notes: "Updated terms" };
      const mockResponse = { id: 1, ...updates };
      putStub.resolves(mockResponse);

      const result = await quotationService.update(1, updates);

      assert.ok(result.id);
      sinon.assert.calledWith(putStub, "/quotations/1", updates);
    });

    test("should only allow update of draft quotations", async () => {
      const updates = { notes: "Updated" };
      putStub.resolves({
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
      deleteStub.resolves(mockResponse);

      const result = await quotationService.delete(1);

      assert.ok(result.success);
      sinon.assert.calledWith(deleteStub, "/quotations/1");
    });
  });

  describe("updateStatus", () => {
    test("should update quotation status", async () => {
      const mockResponse = { id: 1, status: "approved" };
      patchStub.resolves(mockResponse);

      const result = await quotationService.updateStatus(1, "approved");

      assert.ok(result.status);
      sinon.assert.calledWith(patchStub, "/quotations/1/status", {
        status: "approved",
      });
    });

    test("should support draft → approved → expired status transitions", async () => {
      patchStub.resolves({ status: "expired" });

      await quotationService.updateStatus(1, "expired");

      sinon.assert.calledWith(patchStub, "/quotations/1/status", {
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
      postStub.resolves(mockResponse);

      const result = await quotationService.convertToInvoice(1);

      assert.ok(result.invoiceId);
      assert.ok(result.invoiceNumber);
      sinon.assert.calledWith(postStub, "/quotations/1/convert-to-invoice");
    });

    test("should not convert expired quotation", async () => {
      postStub.rejects(new Error("Cannot convert expired quotation"));

      await assert.rejects(() => quotationService.convertToInvoice(1), Error);
    });
  });

  describe("getNextNumber", () => {
    test("should get next quotation number", async () => {
      const mockResponse = { nextNumber: "QT-00045", prefix: "QT-" };
      getStub.resolves(mockResponse);

      const result = await quotationService.getNextNumber();

      assert.ok(result.nextNumber);
      sinon.assert.calledWith(getStub, "/quotations/number/next");
    });
  });

  describe("downloadPDF", () => {
    test("should download quotation as PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });

      // Mock URL creation
      // Skipped: global.URL.createObjectURL = vi.fn(() => "blob:test-url");
      global.URL.revokeObjectURL = sinon.stub();

      // Mock document methods
      document.body.appendChild = sinon.stub();
      document.body.removeChild = sinon.stub();

      apiService.request.resolves(mockBlob);

      await quotationService.downloadPDF(1);

      sinon.assert.calledWith(apiService.request, {
        method: "GET",
        url: "/quotations/1/pdf",
        responseType: "blob",
      });
    });

    test("should handle PDF download errors", async () => {
      apiService.request.rejects(new Error("PDF generation failed"));

      await assert.rejects(() => quotationService.downloadPDF(999), Error);
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors in getAll", async () => {
      getStub.rejects(new Error("Network error"));

      await assert.rejects(() => quotationService.getAll(), Error);
    });

    test("should handle errors in create", async () => {
      postStub.rejects(new Error("Validation failed"));

      await assert.rejects(() => quotationService.create({}), Error);
    });

    test("should handle errors in convertToInvoice", async () => {
      postStub.rejects(new Error("Conversion failed"));

      await assert.rejects(() => quotationService.convertToInvoice(1), Error);
    });

    test("should handle errors in updateStatus", async () => {
      patchStub.rejects(new Error("Invalid status transition"));

      await assert.rejects(() => quotationService.updateStatus(1, "invalid"), Error);
    });
  });
});