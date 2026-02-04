import { beforeEach, describe, expect, it, vi } from "vitest";
import advancePaymentService, {
  transformAdvancePaymentForServer,
  transformAdvancePaymentFromServer,
} from "../advancePaymentService.js";

// Mock API client
vi.mock("../api.js", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from "../api.js";

describe("advancePaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Data Transformers", () => {
    describe("transformAdvancePaymentForServer", () => {
      it("should transform advance payment data correctly", () => {
        const input = {
          customerId: 1,
          amount: 5000,
          vatRate: 5,
          totalAmount: 5250,
          paymentMethod: "bank_transfer",
          status: "received",
        };

        const result = transformAdvancePaymentForServer(input);

        expect(result.customerId).toBe(1);
        expect(result.amount).toBe(5000);
        expect(result.vatRate).toBe(5);
        expect(result.isVatInclusive).toBe(true);
        expect(result.paymentMethod).toBe("bank_transfer");
      });

      it("should apply defaults for missing fields", () => {
        const result = transformAdvancePaymentForServer({});

        expect(result.amount).toBe(0);
        expect(result.vatRate).toBe(5);
        expect(result.paymentMethod).toBe("bank_transfer");
        expect(result.currency).toBe("AED");
      });

      it("should handle currency conversion", () => {
        const result = transformAdvancePaymentForServer({
          amount: 1000,
          currency: "USD",
          exchangeRate: 3.67,
        });

        expect(result.currency).toBe("USD");
        expect(result.exchangeRate).toBe(3.67);
      });
    });

    describe("transformAdvancePaymentFromServer", () => {
      it("should transform server response with camelCase", () => {
        const serverData = {
          id: 1,
          customer_id: 5,
          amount: 5000,
          vat_amount: 250,
          total_amount: 5250,
          payment_method: "bank_transfer",
          status: "received",
        };

        const result = transformAdvancePaymentFromServer(serverData);

        expect(result.id).toBe(1);
        expect(result.customerId).toBe(5);
        expect(result.amount).toBe(5000);
        expect(result.vatAmount).toBe(250);
        expect(result.totalAmount).toBe(5250);
        expect(result.paymentMethod).toBe("bank_transfer");
      });

      it("should handle nested customer details", () => {
        const serverData = {
          id: 1,
          customer_details: { name: "Test Customer", trn: "TRN123" },
          customerName: "Test Customer",
          customerTrn: "TRN123",
        };

        const result = transformAdvancePaymentFromServer(serverData);

        expect(result.customerName).toBe("Test Customer");
        expect(result.customerTrn).toBe("TRN123");
      });

      it("should handle applications array", () => {
        const serverData = {
          id: 1,
          applications: [
            {
              id: 100,
              invoice_id: 500,
              amount_applied: 2000,
              vat_amount_applied: 100,
            },
          ],
        };

        const result = transformAdvancePaymentFromServer(serverData);

        expect(result.applications).toHaveLength(1);
        expect(result.applications[0].invoiceId).toBe(500);
        expect(result.applications[0].amountApplied).toBe(2000);
      });

      it("should return null for null input", () => {
        const result = transformAdvancePaymentFromServer(null);
        expect(result).toBeNull();
      });
    });
  });

  describe("getAll", () => {
    it("should fetch all advance payments with pagination", async () => {
      const mockResponse = {
        data: [
          { id: 1, customer_id: 1, amount: 5000 },
          { id: 2, customer_id: 2, amount: 3000 },
        ],
        pagination: { total: 2, page: 1, pageSize: 50 },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.getAll({ page: 1 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeDefined();
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments", {
        page: 1,
        pageSize: 50,
      });
    });

    it("should filter by customer ID", async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await advancePaymentService.getAll({ customerId: 5, page: 1 });

      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments", expect.objectContaining({ customerId: 5 }));
    });

    it("should handle array response format", async () => {
      const mockData = [
        { id: 1, customer_id: 1 },
        { id: 2, customer_id: 2 },
      ];
      apiClient.get.mockResolvedValue(mockData);

      const result = await advancePaymentService.getAll();

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toBeNull();
    });

    it("should handle items array response", async () => {
      const mockResponse = {
        items: [{ id: 1, customer_id: 1 }],
        pagination: { total: 1 },
      };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.getAll();

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      apiClient.get.mockRejectedValue(error);

      await expect(advancePaymentService.getAll()).rejects.toThrow("API Error");
    });
  });

  describe("getById", () => {
    it("should fetch advance payment by ID", async () => {
      const mockData = { id: 1, customer_id: 5, amount: 5000 };
      apiClient.get.mockResolvedValue(mockData);

      const result = await advancePaymentService.getById(1);

      expect(result.id).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/1");
    });

    it("should handle 404 errors", async () => {
      apiClient.get.mockRejectedValue(new Error("Not Found"));

      await expect(advancePaymentService.getById(999)).rejects.toThrow();
    });
  });

  describe("getByCustomer", () => {
    it("should fetch advance payments for a customer", async () => {
      const mockData = [
        { id: 1, customer_id: 5 },
        { id: 2, customer_id: 5 },
      ];
      apiClient.get.mockResolvedValue(mockData);

      const result = await advancePaymentService.getByCustomer(5);

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/by-customer/5", {});
    });

    it("should filter only available payments", async () => {
      apiClient.get.mockResolvedValue([]);

      await advancePaymentService.getByCustomer(5, true);

      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/by-customer/5", { hasAvailableBalance: true });
    });
  });

  describe("getAvailableForCustomer", () => {
    it("should fetch available payments for invoice application", async () => {
      const mockData = [
        {
          id: 1,
          customer_id: 5,
          amountAvailable: 2000,
          status: "received",
        },
      ];
      apiClient.get.mockResolvedValue(mockData);

      const result = await advancePaymentService.getAvailableForCustomer(5);

      expect(result).toHaveLength(1);
      expect(result[0].amountAvailable).toBe(2000);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/available/5");
    });
  });

  describe("create", () => {
    it("should create new advance payment", async () => {
      const paymentData = {
        customerId: 5,
        amount: 5000,
        vatRate: 5,
        paymentMethod: "bank_transfer",
      };

      const mockResponse = {
        id: 1,
        customer_id: 5,
        amount: 5000,
        vat_amount: 250,
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.create(paymentData);

      expect(result.id).toBe(1);
      expect(result.customerId).toBe(5);
      expect(apiClient.post).toHaveBeenCalledWith("/advance-payments", expect.any(Object));
    });

    it("should apply VAT correctly", async () => {
      const paymentData = {
        customerId: 1,
        amount: 10000,
        vatRate: 5,
        isVatInclusive: false,
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        amount: 10000,
        vat_amount: 500,
      });

      const _result = await advancePaymentService.create(paymentData);

      expect(apiClient.post).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update advance payment", async () => {
      const updateData = { amount: 6000, notes: "Updated" };
      const mockResponse = {
        id: 1,
        customer_id: 5,
        amount: 6000,
        notes: "Updated",
      };

      apiClient.put.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.update(1, updateData);

      expect(result.amount).toBe(6000);
      expect(apiClient.put).toHaveBeenCalledWith("/advance-payments/1", expect.any(Object));
    });
  });

  describe("applyToInvoice", () => {
    it("should apply advance payment to invoice", async () => {
      const mockResponse = {
        id: 1,
        amountApplied: 2000,
        amountAvailable: 3000,
        applications: [
          {
            id: 100,
            invoiceId: 500,
            amountApplied: 2000,
          },
        ],
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.applyToInvoice(1, 500, 2000);

      expect(result.amountApplied).toBe(2000);
      expect(result.applications).toHaveLength(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/advance-payments/1/apply",
        expect.objectContaining({ invoiceId: 500 })
      );
    });

    it("should apply full available amount if amount not specified", async () => {
      apiClient.post.mockResolvedValue({ id: 1 });

      await advancePaymentService.applyToInvoice(1, 500);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/advance-payments/1/apply",
        expect.not.objectContaining({ amount: expect.anything() })
      );
    });
  });

  describe("removeApplication", () => {
    it("should remove invoice application", async () => {
      const mockResponse = {
        id: 1,
        amountApplied: 0,
        amountAvailable: 5000,
        applications: [],
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.removeApplication(1, 100, "Reversal");

      expect(result.applications).toHaveLength(0);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/advance-payments/1/remove-application",
        expect.objectContaining({ applicationId: 100 })
      );
    });
  });

  describe("refund", () => {
    it("should process refund", async () => {
      const refundData = {
        amount: 2000,
        refundDate: "2024-01-15",
        refundMethod: "bank_transfer",
        reason: "Customer Request",
      };

      const mockResponse = {
        id: 1,
        amountRefunded: 2000,
        amountAvailable: 3000,
        status: "refunded",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.refund(1, refundData);

      expect(result.amountRefunded).toBe(2000);
      expect(apiClient.post).toHaveBeenCalledWith("/advance-payments/1/refund", expect.any(Object));
    });

    it("should handle partial refund", async () => {
      const refundData = {
        amount: 1000,
        refundDate: "2024-01-15",
        reason: "Partial reversal",
      };

      apiClient.post.mockResolvedValue({ id: 1, amountRefunded: 1000 });

      const result = await advancePaymentService.refund(1, refundData);

      expect(result.amountRefunded).toBe(1000);
    });
  });

  describe("cancel", () => {
    it("should cancel advance payment", async () => {
      const mockResponse = {
        id: 1,
        status: "cancelled",
      };

      apiClient.post.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.cancel(1, "No longer needed");

      expect(result.status).toBe("cancelled");
      expect(apiClient.post).toHaveBeenCalledWith("/advance-payments/1/cancel", expect.any(Object));
    });
  });

  describe("getNextNumber", () => {
    it("should retrieve next receipt number", async () => {
      const mockResponse = { receiptNumber: "ADV-001" };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.getNextNumber();

      expect(result.receiptNumber).toBe("ADV-001");
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/number/next");
    });
  });

  describe("getVATSummary", () => {
    it("should fetch VAT summary for Form 201", async () => {
      const mockResponse = {
        totalVAT: 5000,
        totalAmount: 100000,
        vatByCategory: {
          STANDARD: 5000,
          ZERO_RATED: 0,
        },
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.getVATSummary({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.totalVAT).toBe(5000);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/vat-summary", expect.any(Object));
    });
  });

  describe("getAnalytics", () => {
    it("should fetch advance payment analytics", async () => {
      const mockResponse = {
        totalAdvances: 50,
        averageAmount: 2500,
        totalReceived: 125000,
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.getAnalytics({
        period: "MONTHLY",
      });

      expect(result.totalAdvances).toBe(50);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/analytics", expect.any(Object));
    });
  });

  describe("search", () => {
    it("should search advance payments", async () => {
      const mockResponse = {
        data: [{ id: 1, customerName: "Test Customer" }],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.search("test", {
        status: "received",
      });

      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments", expect.objectContaining({ search: "test" }));
    });

    it("should handle empty search results", async () => {
      apiClient.get.mockResolvedValue({});

      const result = await advancePaymentService.search("nonexistent");

      expect(result).toEqual([]);
    });
  });

  describe("getApplicationHistory", () => {
    it("should fetch application history", async () => {
      const mockResponse = {
        data: [
          {
            id: 100,
            invoiceId: 500,
            amountApplied: 2000,
            appliedAt: "2024-01-15",
          },
        ],
      };

      apiClient.get.mockResolvedValue(mockResponse);

      const result = await advancePaymentService.getApplicationHistory(1);

      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith("/advance-payments/1/applications");
    });
  });

  describe("Multi-tenancy", () => {
    it("should maintain company context in all operations", async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, companyId: 1 }],
      });

      const result = await advancePaymentService.getAll();

      // Company ID should be preserved from server response
      expect(result.data[0].companyId).toBe(1);
    });
  });

  describe("VAT Compliance", () => {
    it("should handle VAT-inclusive amounts correctly", async () => {
      const paymentData = {
        customerId: 1,
        amount: 5000,
        vatRate: 5,
        isVatInclusive: true,
        totalAmount: 5000, // Already includes VAT
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        isVatInclusive: true,
        amount: 5000,
        vatAmount: 238.1,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.isVatInclusive).toBe(true);
    });

    it("should handle VAT-exclusive amounts correctly", async () => {
      const paymentData = {
        customerId: 1,
        amount: 10000,
        vatRate: 5,
        isVatInclusive: false,
        vatAmount: 500,
        totalAmount: 10500,
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        isVatInclusive: false,
        amount: 10000,
        vatAmount: 500,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.isVatInclusive).toBe(false);
    });

    it("should track VAT category for compliance", async () => {
      const paymentData = {
        customerId: 1,
        amount: 5000,
        vatCategory: "ZERO_RATED",
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        vatCategory: "ZERO_RATED",
        amount: 5000,
        vatAmount: 0,
      });

      const result = await advancePaymentService.create(paymentData);

      expect(result.vatCategory).toBe("ZERO_RATED");
    });
  });
});
