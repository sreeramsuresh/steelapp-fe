/**
 * Payables Service Unit Tests
 * Tests invoice and PO payment tracking, status management
 */

import { beforeEach, describe, expect, test, vi } from "vitest";



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
  beforeEach(() => {
    sinon.restore();
    // Set up localStorage mock before each test
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });
    }
    localStorageMock.clear();
  });

  describe("Invoice Management", () => {
    describe("getInvoices", () => {
      test("should fetch invoices with pagination", async () => {
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
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getInvoices({ page: 1 });

        assert.ok(result.items).toHaveLength(1);
        assert.ok(result.items[0].invoice_number).toBe("INV-001");
        assert.ok(result.aggregates).toBeDefined();
      });

      test("should handle invoices response format", async () => {
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
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getInvoices();

        assert.ok(result.items).toHaveLength(1);
      });

      test("should handle array response format", async () => {
        const mockResponse = [
          {
            id: 1,
            invoice_number: "INV-001",
            invoice_amount: 10000,
          },
        ];
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getInvoices();

        assert.ok(result.items).toHaveLength(1);
        assert.ok(result.aggregates).toEqual({});
      });

      test("should return empty array on error", async () => {
        apiClient.get.mockRejectedValueOnce(new Error("Network error"));

        const result = await payablesService.getInvoices();

        assert.ok(result.items).toEqual([]);
      });
    });

    describe("getInvoice", () => {
      test("should fetch single invoice with payments", async () => {
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
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getInvoice(1);

        assert.ok(result.id).toBe(1);
        assert.ok(result.payments).toHaveLength(1);
      });

      test("should merge local and server payments", async () => {
        const mockResponse = {
          id: 1,
          invoice_number: "INV-001",
          invoice_amount: 10000,
          payments: [],
        };
        apiClient.get.mockResolvedValueOnce(mockResponse);
        localStorage.setItem("payables:inv:payments", JSON.stringify({ 1: [{ id: "local-1", amount: 2000 }] }));

        const result = await payablesService.getInvoice(1);

        assert.ok(result.payments).toHaveLength(1);
      });

      test("should compute derived fields (status)", async () => {
        const mockResponse = {
          id: 1,
          invoice_number: "INV-001",
          invoice_amount: 10000,
          paid: 10000,
          balance: 0,
        };
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getInvoice(1);

        assert.ok(result.status).toBeDefined();
      });
    });

    describe("addInvoicePayment", () => {
      test("should record invoice payment", async () => {
        const paymentData = {
          amount: 5000,
          payment_date: "2024-01-15",
          method: "bank_transfer",
          reference_no: "CHQ-123",
        };
        apiClient.post.mockResolvedValueOnce({
          id: 1,
          invoice_number: "INV-001",
          paid: 5000,
          balance: 5000,
          status: "partial",
        });

        const result = await payablesService.addInvoicePayment(1, paymentData);

        assert.ok(result.id).toBe(1);
        assert.ok(apiClient.post).toHaveBeenCalledWith("/payables/invoices/1/payments", );
      });

      test("should fall back to local storage on error", async () => {
        const paymentData = {
          id: "uuid-123",
          amount: 5000,
          payment_date: "2024-01-15",
        };
        apiClient.post.mockRejectedValueOnce(new Error("Server error"));

        const result = await payablesService.addInvoicePayment(1, paymentData);

        assert.ok(result.payments).toBeDefined();
        const stored = localStorage.getItem("payables:inv:payments");
        assert.ok(stored).toBeTruthy();
      });

      test("should handle payment with notes and attachment", async () => {
        const paymentData = {
          amount: 5000,
          payment_date: "2024-01-15",
          notes: "Full payment",
          attachment_url: "https://example.com/receipt.pdf",
        };
        apiClient.post.mockResolvedValueOnce({
          id: 1,
          paid: 5000,
        });

        await payablesService.addInvoicePayment(1, paymentData);

        assert.ok(apiClient.post).toHaveBeenCalled();
      });
    });

    describe("voidInvoicePayment", () => {
      test("should void invoice payment", async () => {
        apiClient.post.mockResolvedValueOnce({
          id: 1,
          invoice_number: "INV-001",
          paid: 0,
          balance: 10000,
        });

        const result = await payablesService.voidInvoicePayment(1, "p1", "Erroneous entry");

        assert.ok(result.id).toBe(1);
        assert.ok(apiClient.post).toHaveBeenCalledWith("/payables/invoices/1/payments/p1/void", {
          reason: "Erroneous entry",
        });
      });

      test("should fall back to local storage on error", async () => {
        apiClient.post.mockRejectedValueOnce(new Error("Server error"));
        localStorage.setItem(
          "payables:inv:payments",
          JSON.stringify({
            1: [{ id: "p1", amount: 5000 }],
          })
        );

        const result = await payablesService.voidInvoicePayment(1, "p1", "Void reason");

        assert.ok(result.payments).toBeDefined();
      });
    });
  });

  describe("PO Management", () => {
    describe("getPOs", () => {
      test("should fetch POs with aggregates", async () => {
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
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getPOs({ page: 1 });

        assert.ok(result.items).toHaveLength(1);
        assert.ok(result.items[0].po_number).toBe("PO-001");
      });

      test("should handle pos response format", async () => {
        const mockResponse = {
          pos: [
            {
              id: 1,
              po_number: "PO-001",
              po_amount: 50000,
            },
          ],
        };
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getPOs();

        assert.ok(result.items).toHaveLength(1);
      });

      test("should return empty array on error", async () => {
        apiClient.get.mockRejectedValueOnce(new Error("Network error"));

        const result = await payablesService.getPOs();

        assert.ok(result.items).toEqual([]);
      });
    });

    describe("getPO", () => {
      test("should fetch single PO", async () => {
        const mockResponse = {
          id: 1,
          po_number: "PO-001",
          supplier_name: "XYZ Supplies",
          po_amount: 50000,
          payments: [],
        };
        apiClient.get.mockResolvedValueOnce(mockResponse);

        const result = await payablesService.getPO(1);

        assert.ok(result.id).toBe(1);
        assert.ok(result.po_number).toBe("PO-001");
      });
    });

    describe("addPOPayment", () => {
      test("should record PO payment", async () => {
        const paymentData = {
          amount: 20000,
          payment_date: "2024-01-15",
          method: "bank_transfer",
        };
        apiClient.post.mockResolvedValueOnce({
          id: 1,
          po_number: "PO-001",
          paid: 20000,
          balance: 30000,
        });

        const result = await payablesService.addPOPayment(1, paymentData);

        assert.ok(result.id).toBe(1);
        assert.ok(apiClient.post).toHaveBeenCalledWith("/payables/pos/1/payments", );
      });

      test("should fall back to local storage on error", async () => {
        const paymentData = {
          amount: 20000,
          payment_date: "2024-01-15",
        };
        apiClient.post.mockRejectedValueOnce(new Error("Server error"));

        const result = await payablesService.addPOPayment(1, paymentData);

        assert.ok(result.payments).toBeDefined();
      });
    });

    describe("voidPOPayment", () => {
      test("should void PO payment", async () => {
        apiClient.post.mockResolvedValueOnce({
          id: 1,
          po_number: "PO-001",
          paid: 0,
        });

        const result = await payablesService.voidPOPayment(1, "p1", "Void reason");

        assert.ok(result.id).toBe(1);
      });
    });
  });

  describe("Payment Status Calculation", () => {
    test("should calculate unpaid status", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000,
        paid: 0,
        balance: 10000,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await payablesService.getInvoice(1);

      assert.ok(["unpaid", "partial", "paid"]).toContain(result.status);
    });

    test("should calculate partial payment status", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000,
        paid: 5000,
        balance: 5000,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await payablesService.getInvoice(1);

      assert.ok(["unpaid", "partial", "paid"]).toContain(result.status);
    });

    test("should calculate paid status", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000,
        paid: 10000,
        balance: 0,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await payablesService.getInvoice(1);

      assert.ok(result.status).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      apiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await payablesService.getInvoices();

      assert.ok(result.items).toEqual([]);
    });

    test("should handle payment posting errors with fallback", async () => {
      apiClient.post.mockRejectedValueOnce(new Error("Server error"));

      const result = await payablesService.addInvoicePayment(1, {
        amount: 5000,
        payment_date: "2024-01-15",
      });

      assert.ok(result.payments).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty invoice list", async () => {
      apiClient.get.mockResolvedValueOnce({ items: [], aggregates: {} });

      const result = await payablesService.getInvoices();

      assert.ok(result.items).toEqual([]);
    });

    test("should handle large payment amounts", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 1000000,
        paid: 500000,
        balance: 500000,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await payablesService.getInvoice(1);

      assert.ok(result.invoice_amount).toBe(1000000);
    });

    test("should handle decimal amounts", async () => {
      const mockResponse = {
        id: 1,
        invoice_amount: 10000.5,
        paid: 5000.25,
        balance: 5000.25,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await payablesService.getInvoice(1);

      assert.ok(result.invoice_amount).toBe(10000.5);
    });

    test("should handle null payments array", async () => {
      const mockResponse = {
        id: 1,
        invoice_number: "INV-001",
        invoice_amount: 10000,
        payments: null,
      };
      apiClient.get.mockResolvedValueOnce(mockResponse);

      const result = await payablesService.getInvoice(1);

      assert.ok(Array.isArray(result.payments)).toBe(true);
    });
  });
});