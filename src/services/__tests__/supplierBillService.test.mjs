/**
 * Supplier Bill Service Unit Tests
 * Tests supplier bill CRUD, VAT compliance, payment tracking, approval workflows
 */

import { beforeEach, describe, expect, test, vi } from "vitest";



import supplierBillService from "../supplierBillService.js";
import { apiClient } from "../api.js";

describe("supplierBillService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("getAll", () => {
    test("should fetch supplier bills with pagination", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            bill_number: "SB-001",
            supplier_invoice_number: "INV-001",
            status: "draft",
            subtotal: 1000,
            vat_amount: 50,
            total: 1050,
          },
        ],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getAll({ page: 1 });

      assert.ok(result.data).toHaveLength(1);
      assert.ok(result.data[0].status).toBe("draft");
      assert.ok(result.pagination).toBeDefined();
    });

    test("should filter by supplier ID", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({ supplierId: 1 });

      assert.ok(apiClient.get).toHaveBeenCalled();
    });

    test("should filter by VAT category", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({ vatCategory: "STANDARD" });

      assert.ok(apiClient.get).toHaveBeenCalled();
    });

    test("should filter by date range", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      assert.ok(apiClient.get).toHaveBeenCalled();
    });

    test("should handle search parameter", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({ search: "supplier name" });

      assert.ok(apiClient.get).toHaveBeenCalled();
    });

    test("should handle array response format", async () => {
      const billsArray = [
        {
          id: 1,
          bill_number: "SB-001",
          status: "draft",
          subtotal: 1000,
          vat_amount: 50,
          total: 1050,
        },
      ];
      apiClient.get.mockResolvedValueOnce(billsArray);

      const result = await supplierBillService.getAll();

      assert.ok(result.data).toHaveLength(1);
      assert.ok(result.pagination).toBeNull();
    });

    test("should handle items array response format", async () => {
      const response = {
        items: [
          {
            id: 1,
            bill_number: "SB-001",
            status: "draft",
            subtotal: 1000,
            vat_amount: 50,
            total: 1050,
          },
        ],
        pagination: { page: 1, total: 1 },
      };
      apiClient.get.mockResolvedValueOnce(response);

      const result = await supplierBillService.getAll();

      assert.ok(result.data).toHaveLength(1);
    });

    test("should handle empty response", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await supplierBillService.getAll();

      assert.ok(result.data).toEqual([]);
    });
  });

  describe("getById", () => {
    test("should fetch single supplier bill with items", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        supplier_invoice_number: "INV-001",
        supplier_name: "ABC Suppliers",
        subtotal: 1000,
        vat_amount: 50,
        total: 1050,
        status: "draft",
        items: [
          {
            product_name: "Material A",
            quantity: 100,
            unit_price: 10,
            vat_rate: 5,
            vat_category: "STANDARD",
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.id).toBe(1);
      assert.ok(result.supplierName).toBe("ABC Suppliers");
      assert.ok(result.items).toBeDefined();
    });

    test("should handle null response", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await supplierBillService.getById(1);

      assert.ok(result).toBeNull();
    });
  });

  describe("getBySupplier", () => {
    test("should fetch bills by supplier ID", async () => {
      const mockResponse = [
        {
          id: 1,
          bill_number: "SB-001",
          supplier_id: 1,
          status: "draft",
          subtotal: 1000,
          vat_amount: 50,
          total: 1050,
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getBySupplier(1);

      assert.ok(Array.isArray(result)).toBe(true);
      assert.ok(result).toHaveLength(1);
    });

    test("should handle data property in response", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            bill_number: "SB-001",
            status: "draft",
            subtotal: 1000,
            vat_amount: 50,
            total: 1050,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getBySupplier(1);

      assert.ok(result).toHaveLength(1);
    });
  });

  describe("create", () => {
    test("should create supplier bill with items", async () => {
      const billData = {
        supplierId: 1,
        supplierInvoiceNumber: "INV-001",
        billDate: "2024-01-01",
        items: [
          {
            productId: 1,
            quantity: 100,
            unitPrice: 10,
            vatRate: 5,
            vatCategory: "STANDARD",
          },
        ],
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        bill_number: "SB-001",
        ...billData,
      });

      const result = await supplierBillService.create(billData);

      assert.ok(result.id).toBe(1);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/supplier-bills", );
    });

    test("should handle VAT categories in items", async () => {
      const billData = {
        supplierId: 1,
        items: [
          {
            productId: 1,
            quantity: 100,
            unitPrice: 10,
            vatCategory: "BLOCKED",
            isBlockedVat: true,
          },
        ],
      };
      apiClient.post.mockResolvedValueOnce({ id: 1, bill_number: "SB-001" });

      await supplierBillService.create(billData);

      assert.ok(apiClient.post).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    test("should update supplier bill", async () => {
      const updateData = { status: "approved" };
      apiClient.put.mockResolvedValueOnce({ id: 1, status: "approved" });

      const result = await supplierBillService.update(1, updateData);

      assert.ok(result.status).toBe("approved");
    });

    test("should transform data before sending", async () => {
      const updateData = {
        supplierId: 1,
        subtotal: 1500,
        vatAmount: 75,
      };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      await supplierBillService.update(1, updateData);

      assert.ok(apiClient.put).toHaveBeenCalledWith("/supplier-bills/1", );
    });
  });

  describe("delete", () => {
    test("should delete supplier bill with reason", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await supplierBillService.delete(1, "Duplicate entry");

      assert.ok(result.success).toBe(true);
      assert.ok(apiClient.delete).toHaveBeenCalledWith("/supplier-bills/1", {
        data: { reason: "Duplicate entry" },
      });
    });

    test("should handle delete without reason", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      await supplierBillService.delete(1);

      assert.ok(apiClient.delete).toHaveBeenCalledWith("/supplier-bills/1", {
        data: { reason: "" },
      });
    });
  });

  describe("approve", () => {
    test("should approve bill for payment", async () => {
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        status: "approved",
        approval_status: "approved",
      });

      const result = await supplierBillService.approve(1, "Ready for payment");

      assert.ok(result.status).toBe("approved");
      assert.ok(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/approve", {
        notes: "Ready for payment",
      });
    });
  });

  describe("reject", () => {
    test("should reject bill approval", async () => {
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        approval_status: "rejected",
      });

      const result = await supplierBillService.reject(1, "Missing documents");

      assert.ok(result.approvalStatus).toBe("rejected");
      assert.ok(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/reject", {
        reason: "Missing documents",
      });
    });
  });

  describe("cancel", () => {
    test("should cancel supplier bill", async () => {
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        status: "cancelled",
      });

      const result = await supplierBillService.cancel(1, "Order cancelled");

      assert.ok(result.status).toBe("cancelled");
      assert.ok(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/cancel", {
        cancellationReason: "Order cancelled",
      });
    });
  });

  describe("recordPayment", () => {
    test("should record payment against bill", async () => {
      const paymentData = {
        amount: 500,
        paymentDate: "2024-01-15",
        paymentMethod: "bank_transfer",
        referenceNumber: "CHQ-123",
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        amount_paid: 500,
        balance_due: 550,
      });

      const result = await supplierBillService.recordPayment(1, paymentData);

      assert.ok(result.amountPaid).toBe(500);
      assert.ok(apiClient.post).toHaveBeenCalledWith(
        "/supplier-bills/1/payments",
        Object.keys({ amount: 500 }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should handle payment with attachment", async () => {
      const paymentData = {
        amount: 1050,
        paymentDate: "2024-01-15",
        paymentMethod: "bank_transfer",
        referenceNumber: "CHQ-123",
        attachmentUrl: "https://example.com/receipt.pdf",
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        amount_paid: 1050,
      });

      await supplierBillService.recordPayment(1, paymentData);

      assert.ok(apiClient.post).toHaveBeenCalled();
    });

    test("should handle zero payment amount", async () => {
      const paymentData = {
        amount: 0,
        paymentDate: "2024-01-15",
      };
      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await supplierBillService.recordPayment(1, paymentData);

      assert.ok(apiClient.post).toHaveBeenCalled();
    });
  });

  describe("voidPayment", () => {
    test("should void payment on bill", async () => {
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        amount_paid: 0,
        balance_due: 1050,
      });

      const result = await supplierBillService.voidPayment(1, 123, "Erroneous payment");

      assert.ok(result.amountPaid).toBe(0);
      assert.ok(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/payments/123/void", {
        reason: "Erroneous payment",
      });
    });
  });

  describe("getVATSummary", () => {
    test("should get VAT summary for period", async () => {
      const mockResponse = {
        standardVat: 5000,
        zeroRatedVat: 0,
        exemptVat: 500,
        blockedVat: 250,
        reverseChargeVat: 0,
        totalInputVat: 5250,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getVATSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      assert.ok(result.totalInputVat).toBe(5250);
      assert.ok(apiClient.get).toHaveBeenCalledWith("/supplier-bills/vat-summary", );
    });

    test("should filter by VAT category", async () => {
      apiClient.get.mockResolvedValueOnce({
        standardVat: 5000,
        totalInputVat: 5000,
      });

      await supplierBillService.getVATSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        vatCategory: "STANDARD",
      });

      assert.ok(apiClient.get).toHaveBeenCalled();
    });
  });

  describe("getAnalytics", () => {
    test("should get supplier bill analytics", async () => {
      const mockResponse = {
        totalBills: 100,
        totalAmount: 50000,
        averageAmount: 500,
        outstandingAmount: 10000,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getAnalytics({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      assert.ok(result.totalBills).toBe(100);
    });

    test("should filter by supplier", async () => {
      apiClient.get.mockResolvedValueOnce({
        totalBills: 10,
        totalAmount: 5000,
      });

      await supplierBillService.getAnalytics({
        startDate: "2024-01-01",
        supplierId: 1,
      });

      assert.ok(apiClient.get).toHaveBeenCalledWith("/supplier-bills/analytics", );
    });
  });

  describe("getNextNumber", () => {
    test("should get next bill number", async () => {
      apiClient.get.mockResolvedValueOnce({ billNumber: "SB-001" });

      const result = await supplierBillService.getNextNumber();

      assert.ok(result.billNumber).toBe("SB-001");
    });
  });

  describe("search", () => {
    test("should search supplier bills", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            bill_number: "SB-001",
            status: "draft",
            subtotal: 1000,
            vat_amount: 50,
            total: 1050,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.search("ABC Suppliers");

      assert.ok(Array.isArray(result)).toBe(true);
      assert.ok(result).toHaveLength(1);
    });

    test("should handle search with filters", async () => {
      apiClient.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            bill_number: "SB-001",
            status: "approved",
            subtotal: 1000,
            vat_amount: 50,
            total: 1050,
          },
        ],
      });

      const result = await supplierBillService.search("ABC", { status: "approved" });

      assert.ok(result).toHaveLength(1);
    });

    test("should handle items array response", async () => {
      apiClient.get.mockResolvedValueOnce({
        items: [
          {
            id: 1,
            bill_number: "SB-001",
            status: "draft",
            subtotal: 1000,
            vat_amount: 50,
            total: 1050,
          },
        ],
      });

      const result = await supplierBillService.search("Supplier");

      assert.ok(result).toHaveLength(1);
    });

    test("should return empty array for non-array response", async () => {
      apiClient.get.mockResolvedValueOnce({ success: true });

      const result = await supplierBillService.search("NoMatch");

      assert.ok(result).toEqual([]);
    });
  });

  describe("downloadPDF", () => {
    test("should download supplier bill PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });
      apiClient.get.mockResolvedValueOnce(mockBlob);

      // Mock window.URL and document methods
      // Skipped: global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();
      document.createElement = vi.fn(() => ({
        href: "",
        download: "",
        click: vi.fn(),
      }));
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const result = await supplierBillService.downloadPDF(1, "SB-001");

      assert.ok(result).toBe(true);
    });

    test("should handle PDF download error", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(supplierBillService.downloadPDF(1, "SB-001"), Error);
    });
  });

  describe("getBlockedVATItems", () => {
    test("should get blocked VAT items from bill", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            product_name: "Blocked Item",
            vat_category: "BLOCKED",
            blocked_reason: "Input VAT not recoverable",
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getBlockedVATItems(1);

      assert.ok(Array.isArray(result)).toBe(true);
      assert.ok(result).toHaveLength(1);
    });

    test("should handle array response", async () => {
      const mockResponse = [
        {
          id: 1,
          product_name: "Blocked Item",
          vat_category: "BLOCKED",
        },
      ];
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getBlockedVATItems(1);

      assert.ok(result).toHaveLength(1);
    });

    test("should return empty array for no blocked items", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await supplierBillService.getBlockedVATItems(1);

      assert.ok(result).toEqual([]);
    });
  });

  describe("Data Transformation", () => {
    test("should handle camelCase to snake_case transformation", async () => {
      const billData = {
        supplierId: 1,
        supplierInvoiceNumber: "INV-001",
        billDate: "2024-01-01",
        primaryVatCategory: "STANDARD",
      };
      apiClient.post.mockResolvedValueOnce({
        id: 1,
        bill_number: "SB-001",
      });

      await supplierBillService.create(billData);

      const callArgs = apiClient.post.mock.calls[0][1];
      assert.ok(callArgs).toHaveProperty("supplierId", 1);
      assert.ok(callArgs).toHaveProperty("supplierInvoiceNumber", "INV-001");
    });

    test("should handle snake_case from server response", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        supplier_invoice_number: "INV-001",
        total_amount: 1050,
        vat_amount: 50,
        balance_due: 1050,
        payment_status: "unpaid",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.billNumber).toBe("SB-001");
      assert.ok(result.supplierInvoiceNumber).toBe("INV-001");
      assert.ok(result.total).toBe(1050);
      assert.ok(result.paymentStatus).toBe("unpaid");
    });

    test("should handle numeric string conversions", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        subtotal: "1000.00",
        vat_amount: "50.00",
        total: "1050.00",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(typeof result.subtotal).toBe("number");
      assert.ok(typeof result.vatAmount).toBe("number");
      assert.ok(result.total).toBe(1050);
    });
  });

  describe("VAT Compliance", () => {
    test("should track standard VAT at 5%", async () => {
      const mockResponse = {
        id: 1,
        items: [
          {
            quantity: 100,
            unit_price: 10,
            vat_rate: 5,
            vat_category: "STANDARD",
            vat_amount: 50,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.items[0].vatRate).toBe(5);
      assert.ok(result.items[0].vatCategory).toBe("STANDARD");
    });

    test("should handle zero-rated supplies", async () => {
      const mockResponse = {
        id: 1,
        items: [
          {
            quantity: 100,
            unit_price: 10,
            vatRate: 0,
            vat_category: "ZERO_RATED",
            vat_amount: 0,
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.items[0].vatRate).toBe(0);
      assert.ok(result.items[0].vatCategory).toBe("ZERO_RATED");
    });

    test("should track blocked VAT items", async () => {
      const mockResponse = {
        id: 1,
        items: [
          {
            quantity: 100,
            unit_price: 10,
            vat_category: "BLOCKED",
            is_blocked_vat: true,
            blocked_reason: "Input VAT not recoverable",
          },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.items[0].isBlockedVat).toBe(true);
      assert.ok(result.items[0].blockedReason).toBe("Input VAT not recoverable");
    });

    test("should handle reverse charge mechanism", async () => {
      const mockResponse = {
        id: 1,
        is_reverse_charge: true,
        reverse_charge_vat: 75,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.isReverseCharge).toBe(true);
      assert.ok(result.reverseChargeAmount).toBe(75);
    });
  });

  describe("Payment Tracking", () => {
    test("should track payment status as unpaid", async () => {
      const mockResponse = {
        id: 1,
        total: 1050,
        amount_paid: 0,
        balance_due: 1050,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.paymentStatus).toBe("unpaid");
      assert.ok(result.balanceDue).toBe(1050);
    });

    test("should track payment status as partial", async () => {
      const mockResponse = {
        id: 1,
        total: 1050,
        amount_paid: 500,
        balance_due: 550,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.paymentStatus).toBe("partial");
      assert.ok(result.amountDue).toBe(550);
    });

    test("should track payment status as paid", async () => {
      const mockResponse = {
        id: 1,
        total: 1050,
        amount_paid: 1050,
        balance_due: 0,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.paymentStatus).toBe("paid");
      assert.ok(result.balanceDue).toBe(0);
    });
  });

  describe("Approval Workflows", () => {
    test("should track approval status transitions", async () => {
      const mockResponse = {
        id: 1,
        status: "draft",
        approval_status: "pending",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(["pending", "approved", "rejected"]).toContain(result.approvalStatus);
    });

    test("should include approval metadata", async () => {
      const mockResponse = {
        id: 1,
        approval_status: "approved",
        approved_at: "2024-01-15T10:00:00Z",
        approved_by: "user123",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.approvedAt).toBe("2024-01-15T10:00:00Z");
      assert.ok(result.approvedBy).toBe("user123");
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      assert.rejects(supplierBillService.getAll(), Error);
    });

    test("should handle server errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Server error"));

      assert.rejects(supplierBillService.create({ supplierId: 1 }), Error);
    });

    test("should handle invalid bill ID", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Bill not found"));

      assert.rejects(supplierBillService.getById(999), Error);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty bills list", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      const result = await supplierBillService.getAll();

      assert.ok(result.data).toEqual([]);
    });

    test("should handle large VAT amounts", async () => {
      const mockResponse = {
        id: 1,
        subtotal: 1000000,
        vat_amount: 50000,
        total: 1050000,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.vatAmount).toBe(50000);
      assert.ok(result.total).toBe(1050000);
    });

    test("should handle zero VAT amount", async () => {
      const mockResponse = {
        id: 1,
        subtotal: 1000,
        vat_amount: 0,
        total: 1000,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.vatAmount).toBe(0);
    });

    test("should handle decimal currency values", async () => {
      const mockResponse = {
        id: 1,
        subtotal: 1000.5,
        vat_amount: 50.25,
        total: 1050.75,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.subtotal).toBe(1000.5);
      assert.ok(result.vatAmount).toBe(50.25);
    });

    test("should handle undefined items array", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        items: undefined,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.items).toEqual([]);
    });

    test("should handle multiple currency support", async () => {
      const mockResponse = {
        id: 1,
        currency: "USD",
        exchange_rate: 3.67,
        total: 1050,
        total_aed: 3853.5,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.currency).toBe("USD");
      assert.ok(result.exchangeRate).toBe(3.67);
    });

    test("should handle tenant isolation with company_id", async () => {
      const mockResponse = {
        id: 1,
        company_id: 1,
        bill_number: "SB-001",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      assert.ok(result.companyId).toBe(1);
    });
  });
});