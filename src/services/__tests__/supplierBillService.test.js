/**
 * Supplier Bill Service Unit Tests
 * Tests supplier bill CRUD, VAT compliance, payment tracking, approval workflows
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../api.js", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("../utils/fieldAccessors", () => ({
  normalizeUom: vi.fn((item) => item.unit || "PCS"),
}));

import { apiClient } from "../api";
import supplierBillService from "../supplierBillService";

describe("supplierBillService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe("draft");
      expect(result.pagination).toBeDefined();
    });

    test("should filter by supplier ID", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({ supplierId: 1 });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter by VAT category", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({ vatCategory: "STANDARD" });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should filter by date range", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(apiClient.get).toHaveBeenCalled();
    });

    test("should handle search parameter", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [], pagination: null });

      await supplierBillService.getAll({ search: "supplier name" });

      expect(apiClient.get).toHaveBeenCalled();
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

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeNull();
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

      expect(result.data).toHaveLength(1);
    });

    test("should handle empty response", async () => {
      apiClient.get.mockResolvedValueOnce({ data: null });

      const result = await supplierBillService.getAll();

      expect(result.data).toEqual([]);
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

      expect(result.id).toBe(1);
      expect(result.supplierName).toBe("ABC Suppliers");
      expect(result.items).toBeDefined();
    });

    test("should handle null response", async () => {
      apiClient.get.mockResolvedValueOnce(null);

      const result = await supplierBillService.getById(1);

      expect(result).toBeNull();
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

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
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

      expect(result).toHaveLength(1);
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

      expect(result.id).toBe(1);
      expect(apiClient.post).toHaveBeenCalledWith("/supplier-bills", expect.any(Object));
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

      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    test("should update supplier bill", async () => {
      const updateData = { status: "approved" };
      apiClient.put.mockResolvedValueOnce({ id: 1, status: "approved" });

      const result = await supplierBillService.update(1, updateData);

      expect(result.status).toBe("approved");
    });

    test("should transform data before sending", async () => {
      const updateData = {
        supplierId: 1,
        subtotal: 1500,
        vatAmount: 75,
      };
      apiClient.put.mockResolvedValueOnce({ id: 1, ...updateData });

      await supplierBillService.update(1, updateData);

      expect(apiClient.put).toHaveBeenCalledWith("/supplier-bills/1", expect.any(Object));
    });
  });

  describe("delete", () => {
    test("should delete supplier bill with reason", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await supplierBillService.delete(1, "Duplicate entry");

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith("/supplier-bills/1", {
        data: { reason: "Duplicate entry" },
      });
    });

    test("should handle delete without reason", async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      await supplierBillService.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith("/supplier-bills/1", {
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

      expect(result.status).toBe("approved");
      expect(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/approve", {
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

      expect(result.approvalStatus).toBe("rejected");
      expect(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/reject", {
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

      expect(result.status).toBe("cancelled");
      expect(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/cancel", {
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

      expect(result.amountPaid).toBe(500);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/supplier-bills/1/payments",
        expect.objectContaining({ amount: 500 })
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

      expect(apiClient.post).toHaveBeenCalled();
    });

    test("should handle zero payment amount", async () => {
      const paymentData = {
        amount: 0,
        paymentDate: "2024-01-15",
      };
      apiClient.post.mockResolvedValueOnce({ id: 1 });

      await supplierBillService.recordPayment(1, paymentData);

      expect(apiClient.post).toHaveBeenCalled();
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

      expect(result.amountPaid).toBe(0);
      expect(apiClient.post).toHaveBeenCalledWith("/supplier-bills/1/payments/123/void", {
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

      expect(result.totalInputVat).toBe(5250);
      expect(apiClient.get).toHaveBeenCalledWith("/supplier-bills/vat-summary", expect.any(Object));
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

      expect(apiClient.get).toHaveBeenCalled();
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

      expect(result.totalBills).toBe(100);
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

      expect(apiClient.get).toHaveBeenCalledWith("/supplier-bills/analytics", expect.any(Object));
    });
  });

  describe("getNextNumber", () => {
    test("should get next bill number", async () => {
      apiClient.get.mockResolvedValueOnce({ billNumber: "SB-001" });

      const result = await supplierBillService.getNextNumber();

      expect(result.billNumber).toBe("SB-001");
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

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
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

      expect(result).toHaveLength(1);
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

      expect(result).toHaveLength(1);
    });

    test("should return empty array for non-array response", async () => {
      apiClient.get.mockResolvedValueOnce({ success: true });

      const result = await supplierBillService.search("NoMatch");

      expect(result).toEqual([]);
    });
  });

  describe("downloadPDF", () => {
    test("should download supplier bill PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });
      apiClient.get.mockResolvedValueOnce(mockBlob);

      // Mock window.URL and document methods
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();
      document.createElement = vi.fn(() => ({
        href: "",
        download: "",
        click: vi.fn(),
      }));
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const result = await supplierBillService.downloadPDF(1, "SB-001");

      expect(result).toBe(true);
    });

    test("should handle PDF download error", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(supplierBillService.downloadPDF(1, "SB-001")).rejects.toThrow();
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

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
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

      expect(result).toHaveLength(1);
    });

    test("should return empty array for no blocked items", async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await supplierBillService.getBlockedVATItems(1);

      expect(result).toEqual([]);
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
      expect(callArgs).toHaveProperty("supplierId", 1);
      expect(callArgs).toHaveProperty("supplierInvoiceNumber", "INV-001");
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

      expect(result.billNumber).toBe("SB-001");
      expect(result.supplierInvoiceNumber).toBe("INV-001");
      expect(result.total).toBe(1050);
      expect(result.paymentStatus).toBe("unpaid");
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

      expect(typeof result.subtotal).toBe("number");
      expect(typeof result.vatAmount).toBe("number");
      expect(result.total).toBe(1050);
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

      expect(result.items[0].vatRate).toBe(5);
      expect(result.items[0].vatCategory).toBe("STANDARD");
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

      expect(result.items[0].vatRate).toBe(0);
      expect(result.items[0].vatCategory).toBe("ZERO_RATED");
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

      expect(result.items[0].isBlockedVat).toBe(true);
      expect(result.items[0].blockedReason).toBe("Input VAT not recoverable");
    });

    test("should handle reverse charge mechanism", async () => {
      const mockResponse = {
        id: 1,
        is_reverse_charge: true,
        reverse_charge_vat: 75,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.isReverseCharge).toBe(true);
      expect(result.reverseChargeAmount).toBe(75);
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

      expect(result.paymentStatus).toBe("unpaid");
      expect(result.balanceDue).toBe(1050);
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

      expect(result.paymentStatus).toBe("partial");
      expect(result.amountDue).toBe(550);
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

      expect(result.paymentStatus).toBe("paid");
      expect(result.balanceDue).toBe(0);
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

      expect(["pending", "approved", "rejected"]).toContain(result.approvalStatus);
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

      expect(result.approvedAt).toBe("2024-01-15T10:00:00Z");
      expect(result.approvedBy).toBe("user123");
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      await expect(supplierBillService.getAll()).rejects.toThrow();
    });

    test("should handle server errors", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Server error"));

      await expect(supplierBillService.create({ supplierId: 1 })).rejects.toThrow();
    });

    test("should handle invalid bill ID", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Bill not found"));

      await expect(supplierBillService.getById(999)).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty bills list", async () => {
      apiClient.get.mockResolvedValueOnce({ data: [] });

      const result = await supplierBillService.getAll();

      expect(result.data).toEqual([]);
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

      expect(result.vatAmount).toBe(50000);
      expect(result.total).toBe(1050000);
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

      expect(result.vatAmount).toBe(0);
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

      expect(result.subtotal).toBe(1000.5);
      expect(result.vatAmount).toBe(50.25);
    });

    test("should handle undefined items array", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        items: undefined,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.items).toEqual([]);
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

      expect(result.currency).toBe("USD");
      expect(result.exchangeRate).toBe(3.67);
    });

    test("should handle tenant isolation with company_id", async () => {
      const mockResponse = {
        id: 1,
        company_id: 1,
        bill_number: "SB-001",
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.companyId).toBe(1);
    });
  });
});
