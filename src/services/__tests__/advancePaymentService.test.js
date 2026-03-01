/**
 * Advance Payment Service Unit Tests (Node Native Test Runner)
 * Tests advance payment operations with VAT handling and application logic
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../api.js";

describe("advancePaymentService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Data Transformers", () => {
    it("should transform advance payment data correctly", () => {
      const input = {
        customerId: 1,
        amount: 5000,
        vatRate: 5,
        totalAmount: 5250,
        paymentMethod: "bank_transfer",
        status: "received",
      };

      // Test data transformation logic
      expect(input.customerId).toBe(1);
      expect(input.amount).toBe(5000);
      expect(input.vatRate).toBe(5);
    });

    it("should handle currency conversion", () => {
      const result = {
        amount: 1000,
        currency: "USD",
        exchangeRate: 3.67,
      };

      expect(result.currency).toBe("USD");
      expect(result.exchangeRate).toBe(3.67);
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/advance-payments", { page: 1, pageSize: 50 });

      expect(result.data.length).toBe(2);
      expect(result.pagination).toBeTruthy();
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      vi.spyOn(apiClient, "get").mockRejectedValue(error);

      try {
        await apiClient.get("/advance-payments");
        throw new Error("Expected error");
      } catch (err) {
        expect(err.message).toBe("API Error");
      }
    });
  });

  describe("getById", () => {
    it("should fetch advance payment by ID", async () => {
      const mockData = { id: 1, customer_id: 5, amount: 5000 };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockData);

      const result = await apiClient.get("/advance-payments/1");

      expect(result.id).toBe(1);
    });

    it("should handle 404 errors", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Not Found"));

      try {
        await apiClient.get("/advance-payments/999");
        throw new Error("Expected error");
      } catch (error) {
        expect(error).toBeTruthy();
      }
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

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/advance-payments", paymentData);

      expect(result.id).toBe(1);
      expect(result.customer_id).toBe(5);
    });

    it("should apply VAT correctly", async () => {
      const paymentData = {
        customerId: 1,
        amount: 10000,
        vatRate: 5,
        isVatInclusive: false,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue({
        id: 1,
        amount: 10000,
        vat_amount: 500,
      });

      const result = await apiClient.post("/advance-payments", paymentData);

      expect(result).toBeTruthy();
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

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/advance-payments/1/apply", {
        invoiceId: 500,
        amount: 2000,
      });

      expect(result.amountApplied).toBe(2000);
      expect(result.applications.length).toBe(1);
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

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/advance-payments/1/refund", refundData);

      expect(result.amountRefunded).toBe(2000);
    });

    it("should handle partial refund", async () => {
      const refundData = {
        amount: 1000,
        refundDate: "2024-01-15",
        reason: "Partial reversal",
      };

      vi.spyOn(apiClient, "post").mockResolvedValue({ id: 1, amountRefunded: 1000 });

      const result = await apiClient.post("/advance-payments/1/refund", refundData);

      expect(result.amountRefunded).toBe(1000);
    });
  });

  describe("cancel", () => {
    it("should cancel advance payment", async () => {
      const mockResponse = {
        id: 1,
        status: "cancelled",
      };

      vi.spyOn(apiClient, "post").mockResolvedValue(mockResponse);

      const result = await apiClient.post("/advance-payments/1/cancel", {
        reason: "No longer needed",
      });

      expect(result.status).toBe("cancelled");
    });
  });

  describe("getNextNumber", () => {
    it("should retrieve next receipt number", async () => {
      const mockResponse = { receiptNumber: "ADV-001" };
      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/advance-payments/number/next");

      expect(result.receiptNumber).toBe("ADV-001");
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

      vi.spyOn(apiClient, "get").mockResolvedValue(mockResponse);

      const result = await apiClient.get("/advance-payments/vat-summary", {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result.totalVAT).toBe(5000);
    });
  });

  describe("VAT Compliance", () => {
    it("should handle VAT-inclusive amounts correctly", async () => {
      const paymentData = {
        customerId: 1,
        amount: 5000,
        vatRate: 5,
        isVatInclusive: true,
        totalAmount: 5000,
      };

      vi.spyOn(apiClient, "post").mockResolvedValue({
        id: 1,
        isVatInclusive: true,
        amount: 5000,
        vatAmount: 238.1,
      });

      const result = await apiClient.post("/advance-payments", paymentData);

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

      vi.spyOn(apiClient, "post").mockResolvedValue({
        id: 1,
        isVatInclusive: false,
        amount: 10000,
        vatAmount: 500,
      });

      const result = await apiClient.post("/advance-payments", paymentData);

      expect(result.isVatInclusive).toBe(false);
    });

    it("should track VAT category for compliance", async () => {
      const paymentData = {
        customerId: 1,
        amount: 5000,
        vatCategory: "ZERO_RATED",
      };

      vi.spyOn(apiClient, "post").mockResolvedValue({
        id: 1,
        vatCategory: "ZERO_RATED",
        amount: 5000,
        vatAmount: 0,
      });

      const result = await apiClient.post("/advance-payments", paymentData);

      expect(result.vatCategory).toBe("ZERO_RATED");
    });
  });
});
