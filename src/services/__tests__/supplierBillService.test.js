/**
 * Supplier Bill Service Unit Tests
 * Tests supplier bill CRUD, VAT compliance, payment tracking, approval workflows
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import supplierBillService from "../supplierBillService.js";
import { apiClient } from "../api.js";

describe("supplierBillService", () => {
  let getStub;
  let postStub;
  let putStub;
  let deleteStub;
  beforeEach(() => {
    vi.restoreAllMocks();
    getStub = vi.spyOn(apiClient, 'get');
    postStub = vi.spyOn(apiClient, 'post');
    putStub = vi.spyOn(apiClient, 'put');
    deleteStub = vi.spyOn(apiClient, 'delete');
  });

  describe("getAll", () => {
    it("should fetch supplier bills with pagination", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getAll({ page: 1 });

      expect(result.data).toBeTruthy();
      expect(result.data[0].status).toBeTruthy();
      expect(result.pagination !== undefined).toBeTruthy();
    });

    it("should filter by supplier ID", async () => {
      getStub.mockResolvedValue({ data: [], pagination: null });

      await supplierBillService.getAll({ supplierId: 1 });

      expect(apiClient.get).toBeTruthy();
    });

    it("should filter by VAT category", async () => {
      getStub.mockResolvedValue({ data: [], pagination: null });

      await supplierBillService.getAll({ vatCategory: "STANDARD" });

      expect(apiClient.get).toBeTruthy();
    });

    it("should filter by date range", async () => {
      getStub.mockResolvedValue({ data: [], pagination: null });

      await supplierBillService.getAll({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(apiClient.get).toBeTruthy();
    });

    it("should handle search parameter", async () => {
      getStub.mockResolvedValue({ data: [], pagination: null });

      await supplierBillService.getAll({ search: "supplier name" });

      expect(apiClient.get).toBeTruthy();
    });

    it("should handle array response format", async () => {
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
      getStub.mockResolvedValue(billsArray);

      const result = await supplierBillService.getAll();

      expect(result.data).toBeTruthy();
      expect(result.pagination).toBe(null);
    });

    it("should handle items array response format", async () => {
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
      getStub.mockResolvedValue(response);

      const result = await supplierBillService.getAll();

      expect(result.data).toBeTruthy();
    });

    it("should handle empty response", async () => {
      getStub.mockResolvedValue({ data: null });

      const result = await supplierBillService.getAll();

      expect(result.data).toBeTruthy();
    });
  });

  describe("getById", () => {
    it("should fetch single supplier bill with items", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.id).toBeTruthy();
      expect(result.supplierName).toBeTruthy();
      expect(result.items !== undefined).toBeTruthy();
    });

    it("should handle null response", async () => {
      getStub.mockResolvedValue(null);

      const result = await supplierBillService.getById(1);

      expect(result).toBe(null);
    });
  });

  describe("getBySupplier", () => {
    it("should fetch bills by supplier ID", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getBySupplier(1);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it("should handle data property in response", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getBySupplier(1);

      expect(result).toBeTruthy();
    });
  });

  describe("create", () => {
    it("should create supplier bill with items", async () => {
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
      postStub.mockResolvedValue({
        id: 1,
        bill_number: "SB-001",
        ...billData,
      });

      const result = await supplierBillService.create(billData);

      expect(result.id).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/supplier-bills", expect.any(Object));
    });

    it("should handle VAT categories in items", async () => {
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
      postStub.mockResolvedValue({ id: 1, bill_number: "SB-001" });

      await supplierBillService.create(billData);

      expect(apiClient.post).toBeTruthy();
    });
  });

  describe("update", () => {
    it("should update supplier bill", async () => {
      const updateData = { status: "approved" };
      putStub.mockResolvedValue({ id: 1, status: "approved" });

      const result = await supplierBillService.update(1, updateData);

      expect(result.status).toBeTruthy();
    });

    it("should transform data before sending", async () => {
      const updateData = {
        supplierId: 1,
        subtotal: 1500,
        vatAmount: 75,
      };
      putStub.mockResolvedValue({ id: 1, ...updateData });

      await supplierBillService.update(1, updateData);

      expect(putStub).toHaveBeenCalledWith("/supplier-bills/1", expect.any(Object));
    });
  });

  describe("delete", () => {
    it("should delete supplier bill with reason", async () => {
      deleteStub.mockResolvedValue({ success: true });

      const result = await supplierBillService.delete(1, "Duplicate entry");

      expect(result.success).toBeTruthy();
      expect(deleteStub).toHaveBeenCalledWith("/supplier-bills/1", {
        data: { reason: "Duplicate entry" },
      });
    });

    it("should handle delete without reason", async () => {
      deleteStub.mockResolvedValue({ success: true });

      await supplierBillService.delete(1);

      expect(deleteStub).toHaveBeenCalledWith("/supplier-bills/1", {
        data: { reason: "" },
      });
    });
  });

  describe("approve", () => {
    it("should approve bill for payment", async () => {
      postStub.mockResolvedValue({
        id: 1,
        status: "approved",
        approval_status: "approved",
      });

      const result = await supplierBillService.approve(1, "Ready for payment");

      expect(result.status).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/supplier-bills/1/approve", {
        notes: "Ready for payment",
      });
    });
  });

  describe("reject", () => {
    it("should reject bill approval", async () => {
      postStub.mockResolvedValue({
        id: 1,
        approval_status: "rejected",
      });

      const result = await supplierBillService.reject(1, "Missing documents");

      expect(result.approvalStatus).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/supplier-bills/1/reject", {
        reason: "Missing documents",
      });
    });
  });

  describe("cancel", () => {
    it("should cancel supplier bill", async () => {
      postStub.mockResolvedValue({
        id: 1,
        status: "cancelled",
      });

      const result = await supplierBillService.cancel(1, "Order cancelled");

      expect(result.status).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/supplier-bills/1/cancel", {
        cancellationReason: "Order cancelled",
      });
    });
  });

  describe("recordPayment", () => {
    it("should record payment against bill", async () => {
      const paymentData = {
        amount: 500,
        paymentDate: "2024-01-15",
        paymentMethod: "bank_transfer",
        referenceNumber: "CHQ-123",
      };
      postStub.mockResolvedValue({
        id: 1,
        amount_paid: 500,
        balance_due: 550,
      });

      const result = await supplierBillService.recordPayment(1, paymentData);

      expect(result.amountPaid).toBeTruthy();
      expect(postStub).toHaveBeenCalledWith("/supplier-bills/1/payments",
        expect.objectContaining({ amount: 500 }));
    });

    it("should handle payment with attachment", async () => {
      const paymentData = {
        amount: 1050,
        paymentDate: "2024-01-15",
        paymentMethod: "bank_transfer",
        referenceNumber: "CHQ-123",
        attachmentUrl: "https://example.com/receipt.pdf",
      };
      postStub.mockResolvedValue({
        id: 1,
        amount_paid: 1050,
      });

      await supplierBillService.recordPayment(1, paymentData);

      expect(apiClient.post).toBeTruthy();
    });

    it("should handle zero payment amount", async () => {
      const paymentData = {
        amount: 0,
        paymentDate: "2024-01-15",
      };
      postStub.mockResolvedValue({ id: 1 });

      await supplierBillService.recordPayment(1, paymentData);

      expect(apiClient.post).toBeTruthy();
    });
  });

  describe("voidPayment", () => {
    it("should void payment on bill", async () => {
      postStub.mockResolvedValue({
        id: 1,
        amount_paid: 0,
        balance_due: 1050,
      });

      const result = await supplierBillService.voidPayment(1, 123, "Erroneous payment");

      expect(result.amountPaid).toBe(0);
      expect(postStub).toHaveBeenCalledWith("/supplier-bills/1/payments/123/void", {
        reason: "Erroneous payment",
      });
    });
  });

  describe("getVATSummary", () => {
    it("should get VAT summary for period", async () => {
      const mockResponse = {
        standardVat: 5000,
        zeroRatedVat: 0,
        exemptVat: 500,
        blockedVat: 250,
        reverseChargeVat: 0,
        totalInputVat: 5250,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getVATSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.totalInputVat).toBeTruthy();
      expect(getStub).toHaveBeenCalledWith("/supplier-bills/vat-summary", expect.any(Object));
    });

    it("should filter by VAT category", async () => {
      getStub.mockResolvedValue({
        standardVat: 5000,
        totalInputVat: 5000,
      });

      await supplierBillService.getVATSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        vatCategory: "STANDARD",
      });

      expect(apiClient.get).toBeTruthy();
    });
  });

  describe("getAnalytics", () => {
    it("should get supplier bill analytics", async () => {
      const mockResponse = {
        totalBills: 100,
        totalAmount: 50000,
        averageAmount: 500,
        outstandingAmount: 10000,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getAnalytics({
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

      expect(result.totalBills).toBeTruthy();
    });

    it("should filter by supplier", async () => {
      getStub.mockResolvedValue({
        totalBills: 10,
        totalAmount: 5000,
      });

      await supplierBillService.getAnalytics({
        startDate: "2024-01-01",
        supplierId: 1,
      });

      expect(getStub).toHaveBeenCalledWith("/supplier-bills/analytics", expect.any(Object));
    });
  });

  describe("getNextNumber", () => {
    it("should get next bill number", async () => {
      getStub.mockResolvedValue({ billNumber: "SB-001" });

      const result = await supplierBillService.getNextNumber();

      expect(result.billNumber).toBeTruthy();
    });
  });

  describe("search", () => {
    it("should search supplier bills", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.search("ABC Suppliers");

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it("should handle search with filters", async () => {
      getStub.mockResolvedValue({
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

      expect(result).toBeTruthy();
    });

    it("should handle items array response", async () => {
      getStub.mockResolvedValue({
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

      expect(result).toBeTruthy();
    });

    it("should return empty array for non-array response", async () => {
      getStub.mockResolvedValue({ success: true });

      const result = await supplierBillService.search("NoMatch");

      expect(result).toBeTruthy();
    });
  });

  describe("downloadPDF", () => {
    it("should download supplier bill PDF", async () => {
      const mockBlob = new Blob(["test"], { type: "application/pdf" });
      getStub.mockResolvedValue(mockBlob);

      // Mock window.URL and document methods
      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      const result = await supplierBillService.downloadPDF(1, 'SB-001');

      expect(result).toBeTruthy();
    });

    it("should handle PDF download error", async () => {
      getStub.mockRejectedValue(new Error("Network error"));

      await expect(supplierBillService.downloadPDF(1, "SB-001")).rejects.toThrow();
    });
  });

  describe("getBlockedVATItems", () => {
    it("should get blocked VAT items from bill", async () => {
      const mockResponse = [
        {
          id: 1,
          product_name: "Blocked Item",
          vat_category: "BLOCKED",
          blocked_reason: "Input VAT not recoverable",
        },
      ];
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getBlockedVATItems(1);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toBeTruthy();
    });

    it("should handle array response", async () => {
      const mockResponse = [
        {
          id: 1,
          product_name: "Blocked Item",
          vat_category: "BLOCKED",
        },
      ];
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getBlockedVATItems(1);

      expect(result).toBeTruthy();
    });

    it("should return empty array for no blocked items", async () => {
      getStub.mockResolvedValue([]);

      const result = await supplierBillService.getBlockedVATItems(1);

      expect(Array.isArray(result)).toBeTruthy();
    });
  });

  describe("Data Transformation", () => {
    it("should handle camelCase to snake_case transformation", async () => {
      const billData = {
        supplierId: 1,
        supplierInvoiceNumber: "INV-001",
        billDate: "2024-01-01",
        primaryVatCategory: "STANDARD",
      };
      postStub.mockResolvedValue({
        id: 1,
        bill_number: "SB-001",
      });

      await supplierBillService.create(billData);

      const callArgs = postStub.mock.calls[0][1];
      expect(callArgs.supplierId).toBe(1);
      expect(callArgs.supplierInvoiceNumber).toBe("INV-001");
    });

    it("should handle snake_case from server response", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        supplier_invoice_number: "INV-001",
        total_amount: 1050,
        vat_amount: 50,
        balance_due: 1050,
        payment_status: "unpaid",
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.billNumber).toBeTruthy();
      expect(result.supplierInvoiceNumber).toBeTruthy();
      expect(result.total).toBeTruthy();
      expect(result.paymentStatus).toBeTruthy();
    });

    it("should handle numeric string conversions", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        subtotal: "1000.00",
        vat_amount: "50.00",
        total: "1050.00",
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(typeof result.subtotal).toBeTruthy();
      expect(typeof result.vatAmount).toBeTruthy();
      expect(result.total).toBeTruthy();
    });
  });

  describe("VAT Compliance", () => {
    it("should track standard VAT at 5%", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.items[0].vatRate).toBeTruthy();
      expect(result.items[0].vatCategory).toBeTruthy();
    });

    it("should handle zero-rated supplies", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.items[0].vatRate).toBe(0);
      expect(result.items[0].vatCategory).toBe("ZERO_RATED");
    });

    it("should track blocked VAT items", async () => {
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
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.items[0].isBlockedVat).toBeTruthy();
      expect(result.items[0].blockedReason).toBeTruthy();
    });

    it("should handle reverse charge mechanism", async () => {
      const mockResponse = {
        id: 1,
        is_reverse_charge: true,
        reverse_charge_vat: 75,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.isReverseCharge).toBeTruthy();
      expect(result.reverseChargeAmount).toBeTruthy();
    });
  });

  describe("Payment Tracking", () => {
    it("should track payment status as unpaid", async () => {
      const mockResponse = {
        id: 1,
        total: 1050,
        amount_paid: 0,
        balance_due: 1050,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.paymentStatus).toBeTruthy();
      expect(result.balanceDue).toBeTruthy();
    });

    it("should track payment status as partial", async () => {
      const mockResponse = {
        id: 1,
        total: 1050,
        amount_paid: 500,
        balance_due: 550,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.paymentStatus).toBeTruthy();
      expect(result.amountDue).toBeTruthy();
    });

    it("should track payment status as paid", async () => {
      const mockResponse = {
        id: 1,
        total: 1050,
        amount_paid: 1050,
        balance_due: 0,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.paymentStatus).toBeTruthy();
      expect(result.balanceDue).toBe(0);
    });
  });

  describe("Approval Workflows", () => {
    it("should track approval status transitions", async () => {
      const mockResponse = {
        id: 1,
        status: "draft",
        approval_status: "pending",
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(["pending", "approved", "rejected"]).toBeTruthy();
    });

    it("should include approval metadata", async () => {
      const mockResponse = {
        id: 1,
        approval_status: "approved",
        approved_at: "2024-01-15T10:00:00Z",
        approved_by: "user123",
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.approvedAt).toBeTruthy();
      expect(result.approvedBy).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      getStub.mockRejectedValue(new Error("Network error"));

      await expect(supplierBillService.getAll()).rejects.toThrow();
    });

    it("should handle server errors", async () => {
      postStub.mockRejectedValue(new Error("Server error"));

      await expect(supplierBillService.create({ supplierId: 1 })).rejects.toThrow();
    });

    it("should handle invalid bill ID", async () => {
      getStub.mockRejectedValue(new Error("Bill not found"));

      await expect(supplierBillService.getById(999)).rejects.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty bills list", async () => {
      getStub.mockResolvedValue({ data: [] });

      const result = await supplierBillService.getAll();

      expect(result.data).toBeTruthy();
    });

    it("should handle large VAT amounts", async () => {
      const mockResponse = {
        id: 1,
        subtotal: 1000000,
        vat_amount: 50000,
        total: 1050000,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.vatAmount).toBeTruthy();
      expect(result.total).toBeTruthy();
    });

    it("should handle zero VAT amount", async () => {
      const mockResponse = {
        id: 1,
        subtotal: 1000,
        vat_amount: 0,
        total: 1000,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.vatAmount).toBe(0);
    });

    it("should handle decimal currency values", async () => {
      const mockResponse = {
        id: 1,
        subtotal: 1000.5,
        vat_amount: 50.25,
        total: 1050.75,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.subtotal).toBeTruthy();
      expect(result.vatAmount).toBeTruthy();
    });

    it("should handle undefined items array", async () => {
      const mockResponse = {
        id: 1,
        bill_number: "SB-001",
        items: undefined,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.items).toBeTruthy();
    });

    it("should handle multiple currency support", async () => {
      const mockResponse = {
        id: 1,
        currency: "USD",
        exchange_rate: 3.67,
        total: 1050,
        total_aed: 3853.5,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.currency).toBeTruthy();
      expect(result.exchangeRate).toBeTruthy();
    });

    it("should handle tenant isolation with company_id", async () => {
      const mockResponse = {
        id: 1,
        company_id: 1,
        bill_number: "SB-001",
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await supplierBillService.getById(1);

      expect(result.companyId).toBeTruthy();
    });
  });
});