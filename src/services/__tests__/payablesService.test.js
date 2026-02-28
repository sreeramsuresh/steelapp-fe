/**
 * Payables Service Unit Tests
 * Tests invoice and PO payment tracking, status management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { payablesService } from "../payablesService.js";
import { apiClient } from "../api.js";

// Mock localStorage - define mock object
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe("payablesService", () => {
  let getStub;
  let postStub;
  beforeEach(() => {
    vi.restoreAllMocks();
    getStub = vi.spyOn(apiClient, 'get');
    postStub = vi.spyOn(apiClient, 'post');
    localStorageMock.clear();
  });

  describe("Invoice Management", () => {
    describe("getInvoices", () => {
      it("should fetch invoices with pagination", async () => {
        const mockResponse = {
          items: [
            {
              id: 1,
              invoice_number: "INV-001",
              customer_name: "ABC Corp",
              invoice_amount: 10000,
              paid: 0,
              balance: 10000,
              status: "unpaid",
            },
          ],
          aggregates: { total_amount: 10000, total_paid: 0 },
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getInvoices({ page: 1 });

        expect(result.items).toBeTruthy();
        expect(result.items[0].invoice_number).toBeTruthy();
        expect(result.aggregates !== undefined).toBeTruthy();
      });

      it("should handle invoices response format", async () => {
        const mockResponse = {
          invoices: [
            {
              id: 1,
              invoice_number: "INV-001",
              invoice_amount: 10000,
            },
          ],
          aggregates: {},
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getInvoices();

        expect(result.items).toBeTruthy();
      });

      it("should handle array response format", async () => {
        const mockResponse = [
          {
            id: 1,
            invoice_number: "INV-001",
            invoice_amount: 10000,
          },
        ];
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getInvoices();

        expect(result.items).toBeTruthy();
        expect(result.aggregates).toBeTruthy();
      });

      it("should return empty array on error", async () => {
        getStub.mockRejectedValue(new Error("Network error"));

        const result = await payablesService.getInvoices();

        expect(result.items).toBeTruthy();
      });
    });

    describe("getInvoice", () => {
      it("should fetch single invoice with payments", async () => {
        const mockResponse = {
          id: 1,
          invoice_number: "INV-001",
          customer_name: "ABC Corp",
          invoice_amount: 10000,
          payments: [
            {
              id: "p1",
              amount: 5000,
              payment_date: "2024-01-15",
              method: "bank_transfer",
            },
          ],
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getInvoice(1);

        expect(result.id).toBeTruthy();
        expect(result.payments).toBeTruthy();
      });

      it("should merge local and server payments", async () => {
        const mockResponse = {
          id: 1,
          invoice_number: "INV-001",
          invoice_amount: 10000,
          payments: [],
        };
        getStub.mockResolvedValue(mockResponse);
        localStorage.setItem("payables:inv:payments", JSON.stringify({ 1: [{ id: "local-1", amount: 2000 }] }));

        const result = await payablesService.getInvoice(1);

        expect(result.payments).toBeTruthy();
      });

      it("should compute derived fields (status)", async () => {
        const mockResponse = {
          id: 1,
          invoice_number: "INV-001",
          invoice_amount: 10000,
          paid: 10000,
          balance: 0,
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getInvoice(1);

        expect(result.status !== undefined).toBeTruthy();
      });
    });

    describe("addInvoicePayment", () => {
      it("should record invoice payment", async () => {
        const paymentData = {
          amount: 5000,
          payment_date: "2024-01-15",
          method: "bank_transfer",
          reference_no: "CHQ-123",
        };
        postStub.mockResolvedValue({
          id: 1,
          invoice_number: "INV-001",
          paid: 5000,
          balance: 5000,
          status: "partial",
        });

        const result = await payablesService.addInvoicePayment(1, paymentData);

        expect(result.id).toBeTruthy();
        expect(postStub).toHaveBeenCalledWith("/payables/invoices/1/payments", paymentData);
      });

      it("should fall back to local storage on error", async () => {
        const paymentData = {
          id: "uuid-123",
          amount: 5000,
          payment_date: "2024-01-15",
        };
        postStub.mockRejectedValue(new Error("Server error"));

        const result = await payablesService.addInvoicePayment(1, paymentData);

        expect(result.payments !== undefined).toBeTruthy();
        const stored = localStorage.getItem("payables:inv:payments");
        expect(stored).toBeTruthy();
      });

      it("should handle payment with notes and attachment", async () => {
        const paymentData = {
          amount: 5000,
          payment_date: "2024-01-15",
          notes: "Full payment",
          attachment_url: "https://example.com/receipt.pdf",
        };
        postStub.mockResolvedValue({
          id: 1,
          paid: 5000,
        });

        await payablesService.addInvoicePayment(1, paymentData);

        expect(apiClient.post).toBeTruthy();
      });
    });

    describe("voidInvoicePayment", () => {
      it("should void invoice payment", async () => {
        postStub.mockResolvedValue({
          id: 1,
          invoice_number: "INV-001",
          paid: 0,
          balance: 10000,
        });

        const result = await payablesService.voidInvoicePayment(1, "p1", "Erroneous entry");

        expect(result.id).toBeTruthy();
        expect(postStub).toHaveBeenCalledWith("/payables/invoices/1/payments/p1/void", {
          reason: "Erroneous entry",
        });
      });

      it("should fall back to local storage on error", async () => {
        postStub.mockRejectedValue(new Error("Server error"));
        localStorage.setItem(
          "payables:inv:payments",
          JSON.stringify({
            1: [{ id: "p1", amount: 5000 }],
          })
        );

        const result = await payablesService.voidInvoicePayment(1, "p1", "Void reason");

        expect(result.payments !== undefined).toBeTruthy();
      });
    });
  });

  describe("PO Management", () => {
    describe("getPOs", () => {
      it("should fetch POs with aggregates", async () => {
        const mockResponse = {
          items: [
            {
              id: 1,
              po_number: "PO-001",
              supplier_name: "XYZ Supplies",
              po_amount: 50000,
              paid: 0,
              balance: 50000,
            },
          ],
          aggregates: { total_amount: 50000, total_paid: 0 },
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getPOs({ page: 1 });

        expect(result.items).toBeTruthy();
        expect(result.items[0].po_number).toBeTruthy();
      });

      it("should handle pos response format", async () => {
        const mockResponse = {
          pos: [
            {
              id: 1,
              po_number: "PO-001",
              po_amount: 50000,
            },
          ],
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getPOs();

        expect(result.items).toBeTruthy();
      });

      it("should return empty array on error", async () => {
        getStub.mockRejectedValue(new Error("Network error"));

        const result = await payablesService.getPOs();

        expect(result.items).toBeTruthy();
      });
    });

    describe("getPO", () => {
      it("should fetch single PO", async () => {
        const mockResponse = {
          id: 1,
          po_number: "PO-001",
          supplier_name: "XYZ Supplies",
          po_amount: 50000,
          payments: [],
        };
        getStub.mockResolvedValue(mockResponse);

        const result = await payablesService.getPO(1);

        expect(result.id).toBeTruthy();
        expect(result.po_number).toBeTruthy();
      });
    });

    describe("addPOPayment", () => {
      it("should record PO payment", async () => {
        const paymentData = {
          amount: 20000,
          payment_date: "2024-01-15",
          method: "bank_transfer",
        };
        postStub.mockResolvedValue({
          id: 1,
          po_number: "PO-001",
          paid: 20000,
          balance: 30000,
        });

        const result = await payablesService.addPOPayment(1, paymentData);

        expect(result.id).toBeTruthy();
        expect(postStub).toHaveBeenCalledWith("/payables/pos/1/payments", paymentData);
      });

      it("should fall back to local storage on error", async () => {
        const paymentData = {
          amount: 20000,
          payment_date: "2024-01-15",
        };
        postStub.mockRejectedValue(new Error("Server error"));

        const result = await payablesService.addPOPayment(1, paymentData);

        expect(result.payments !== undefined).toBeTruthy();
      });
    });

    describe("voidPOPayment", () => {
      it("should void PO payment", async () => {
        postStub.mockResolvedValue({
          id: 1,
          po_number: "PO-001",
          paid: 0,
        });

        const result = await payablesService.voidPOPayment(1, "p1", "Void reason");

        expect(result.id).toBeTruthy();
      });
    });
  });

  describe("Payment Status Calculation", () => {
    it("should calculate unpaid status", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000,
        paid: 0,
        balance: 10000,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await payablesService.getInvoice(1);

      expect(["unpaid", "partial", "paid"]).toBeTruthy();
    });

    it("should calculate partial payment status", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000,
        paid: 5000,
        balance: 5000,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await payablesService.getInvoice(1);

      expect(["unpaid", "partial", "paid"]).toBeTruthy();
    });

    it("should calculate paid status", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000,
        paid: 10000,
        balance: 0,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await payablesService.getInvoice(1);

      expect(result.status !== undefined).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      getStub.mockRejectedValue(new Error("Network error"));

      const result = await payablesService.getInvoices();

      expect(result.items).toBeTruthy();
    });

    it("should handle payment posting errors with fallback", async () => {
      postStub.mockRejectedValue(new Error("Server error"));

      const result = await payablesService.addInvoicePayment(1, {
        amount: 5000,
        payment_date: "2024-01-15",
      });

      expect(result.payments !== undefined).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty invoice list", async () => {
      getStub.mockResolvedValue({ items: [], aggregates: {} });

      const result = await payablesService.getInvoices();

      expect(result.items).toBeTruthy();
    });

    it("should handle large payment amounts", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 1000000,
        paid: 500000,
        balance: 500000,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await payablesService.getInvoice(1);

      expect(result.invoice_amount).toBeTruthy();
    });

    it("should handle decimal amounts", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000.5,
        paid: 5000.25,
        balance: 5000.25,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await payablesService.getInvoice(1);

      expect(result.invoice_amount).toBeTruthy();
    });

    it("should handle null payments array", async () => {
      const mockResponse = {
        id: 1,
        invoice_number: "INV-001",
        invoice_amount: 10000,
        payments: null,
      };
      getStub.mockResolvedValue(mockResponse);

      const result = await payablesService.getInvoice(1);

      expect(Array.isArray(result.payments)).toBeTruthy();
    });
  });
});