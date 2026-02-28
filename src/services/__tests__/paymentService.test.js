/**
 * Payment Service Unit Tests
 * ✅ Comprehensive test coverage for paymentService utilities
 * ✅ Tests data transformation, validation, normalization, receipt handling
 * ✅ 100% coverage target for paymentService.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  createPaymentPayload,
  formatReceiptNumber,
  getCompositeReference,
  getReceiptDetails,
  normalizePayment,
  PAYMENT_METHOD_OPTIONS,
  transformPaymentFromServer,
  validatePayment,
} from "../paymentService.js";

describe("paymentService", () => {
  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  describe("transformPaymentFromServer()", () => {
    it("should transform payment with camelCase conversion", () => {
      const serverData = {
        id: 1,
        company_id: 1,
        invoice_id: 100,
        payment_date: "2026-01-15",
        amount: "5000.00",
        payment_method: "bank_transfer",
        reference_number: "TXN-12345",
        receipt_number: "RCP-2026-0001",
        notes: "Payment received",
        created_at: "2026-01-15T10:00:00Z",
      };

      const result = transformPaymentFromServer(serverData);

      expect(result.id).toBe(1);
      expect(result.companyId).toBe(1);
      expect(result.invoiceId).toBe(100);
      expect(result.paymentDate).toBe("2026-01-15");
      expect(result.amount).toBe(5000);
      expect(result.paymentMethod).toBe("bank_transfer");
      expect(result.referenceNumber).toBe("TXN-12345");
      expect(result.receiptNumber).toBe("RCP-2026-0001");
      expect(result.notes).toBe("Payment received");
    });

    it("should handle multi-currency fields", () => {
      const serverData = {
        id: 1,
        amount: "1000.00",
        currency: "USD",
        exchange_rate: 3.67,
        amount_in_aed: "3670.00",
      };

      const result = transformPaymentFromServer(serverData);

      expect(result.amount).toBe(1000);
      expect(result.currency).toBe("USD");
      expect(result.exchangeRate).toBe(3.67);
      expect(result.amountInAed).toBe(3670);
    });

    it("should handle allocation fields", () => {
      const serverData = {
        id: 1,
        amount: 10000,
        allocated_amount: 8000,
        unallocated_amount: 2000,
        allocations: [
          {
            invoice_id: 1,
            invoice_number: "INV-001",
            allocated_amount: 5000,
            allocation_date: "2026-01-15",
          },
          {
            invoice_id: 2,
            invoice_number: "INV-002",
            allocated_amount: 3000,
            allocation_date: "2026-01-15",
          },
        ],
      };

      const result = transformPaymentFromServer(serverData);

      expect(result.allocatedAmount).toBe(8000);
      expect(result.unallocatedAmount).toBe(2000);
      expect(result.allocations.length).toBe(2);
      expect(result.allocations[0].invoiceId).toBe(1);
      expect(result.allocations[0].allocatedAmount).toBe(5000);
    });

    it("should handle voided payment", () => {
      const serverData = {
        id: 1,
        amount: 5000,
        voided: true,
        void_reason: "Duplicate payment",
        voided_by: "user123",
        voided_at: "2026-01-16T00:00:00Z",
      };

      const result = transformPaymentFromServer(serverData);

      expect(result.voided).toBe(true);
      expect(result.voidReason).toBe("Duplicate payment");
      expect(result.voidedBy).toBe("user123");
      expect(result.voidedAt).toBe("2026-01-16T00:00:00Z");
    });

    it("should handle receipt status and VAT compliance fields", () => {
      const serverData = {
        id: 1,
        receipt_number: "RCP-2026-0001",
        receipt_status: "issued",
        is_advance_payment: true,
        composite_reference: "INV-2026-0001-RCP-2026-0001",
        remarks: "Advance payment for order",
      };

      const result = transformPaymentFromServer(serverData);

      expect(result.receiptNumber).toBe("RCP-2026-0001");
      expect(result.receiptStatus).toBe("issued");
      expect(result.isAdvancePayment).toBe(true);
      expect(result.compositeReference).toBe("INV-2026-0001-RCP-2026-0001");
      expect(result.remarks).toBe("Advance payment for order");
    });

    it("should handle approval and settlement fields", () => {
      const serverData = {
        id: 1,
        approval_status: "approved",
        approved_by: "manager123",
        approved_at: "2026-01-15T14:00:00Z",
        settlement_type: "full",
        settlement_date: "2026-01-16",
      };

      const result = transformPaymentFromServer(serverData);

      expect(result.approvalStatus).toBe("approved");
      expect(result.approvedBy).toBe("manager123");
      expect(result.approvedAt).toBe("2026-01-15T14:00:00Z");
      expect(result.settlementType).toBe("full");
      expect(result.settlementDate).toBe("2026-01-16");
    });

    it("should handle null input", () => {
      const result = transformPaymentFromServer(null);
      expect(result).toBe(null);
    });

    it("should provide default values for optional fields", () => {
      const result = transformPaymentFromServer({});

      expect(result.amount).toBe(0);
      expect(result.currency).toBe("AED");
      expect(result.exchangeRate).toBe(1.0);
      expect(result.allocations).toEqual([]);
    });
  });

  // ============================================================================
  // PAYMENT PAYLOAD CREATION
  // ============================================================================

  describe("createPaymentPayload()", () => {
    it("should create basic payment payload", () => {
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      });

      expect(payload.amount).toBe(5000);
      expect(payload.paymentMethod).toBe("bank_transfer");
      expect(payload.paymentDate).toBe("2026-01-15");
      expect(payload.referenceNumber).toBe("");
      expect(payload.currency).toBe("AED");
      expect(payload.exchangeRate).toBe(1.0);
    });

    it("should handle AED currency (exchange rate 1.0)", () => {
      const payload = createPaymentPayload({
        amount: 1000,
        paymentMethod: "cash",
        paymentDate: "2026-01-15",
        currency: "AED",
        exchangeRate: 99.99, // Should be overridden to 1.0 for AED
      });

      expect(payload.currency).toBe("AED");
      expect(payload.exchangeRate).toBe(1.0);
      expect(payload.amountInAed).toBe(1000);
    });

    it("should calculate amountInAed for non-AED currencies", () => {
      const payload = createPaymentPayload({
        amount: 1000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        currency: "USD",
        exchangeRate: 3.67,
      });

      expect(payload.currency).toBe("USD");
      expect(payload.exchangeRate).toBe(3.67);
      expect(payload.amountInAed).toBe(3670); // 1000 * 3.67
    });

    it("should use provided amountInAed if given", () => {
      const payload = createPaymentPayload({
        amount: 1000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        currency: "USD",
        exchangeRate: 3.67,
        amountInAed: 3600, // Explicitly provided value
      });

      expect(payload.amountInAed).toBe(3600);
    });

    it("should include optional fields", () => {
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "cheque",
        paymentDate: "2026-01-15",
        referenceNumber: "CHQ-12345",
        notes: "Cheque deposited",
      });

      expect(payload.referenceNumber).toBe("CHQ-12345");
      expect(payload.notes).toBe("Cheque deposited");
    });

    it("should coerce string amounts to numbers", () => {
      const payload = createPaymentPayload({
        amount: "5000.50",
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      });

      expect(payload.amount).toBe(5000.5);
      expect(typeof payload.amount).toBe("number");
    });
  });

  // ============================================================================
  // PAYMENT VALIDATION
  // ============================================================================

  describe("validatePayment()", () => {
    it("should validate correct payment", () => {
      const payment = {
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject payment with zero amount", () => {
      const payment = {
        amount: 0,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(false);
      expect(result.errors.includes("Amount must be greater than 0").toBeTruthy());
    });

    it("should reject payment with negative amount", () => {
      const payment = {
        amount: -100,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(false);
      expect(result.errors.includes("Amount must be greater than 0").toBeTruthy());
    });

    it("should reject payment without method", () => {
      const payment = {
        amount: 5000,
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(false);
      expect(result.errors.includes("Payment method is required").toBeTruthy());
    });

    it("should reject payment without date", () => {
      const payment = {
        amount: 5000,
        paymentMethod: "bank_transfer",
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(false);
      expect(result.errors.includes("Payment date is required").toBeTruthy());
    });

    it("should validate payment with all required fields", () => {
      const payment = {
        amount: "5000.99",
        paymentMethod: "cheque",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should report multiple errors", () => {
      const payment = {
        amount: null,
        paymentMethod: null,
        paymentDate: null,
      };

      const result = validatePayment(payment);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });

  // ============================================================================
  // PAYMENT NORMALIZATION
  // ============================================================================

  describe("normalizePayment()", () => {
    it("should normalize payment from various sources", () => {
      const payment = {
        id: 1,
        amount: 5000,
        payment_method: "bank_transfer",
        payment_date: "2026-01-15",
        reference_number: "TXN-123",
      };

      const result = normalizePayment(payment);

      expect(result.id).toBe(1);
      expect(result.amount).toBe(5000);
      expect(result.paymentMethod).toBe("bank_transfer");
      expect(result.paymentDate).toBe("2026-01-15");
      expect(result.referenceNumber).toBe("TXN-123");
    });

    it("should handle alternative field names for payment method", () => {
      expect(normalizePayment({ method: "cash" }).paymentMethod).toBe("cash");
      expect(normalizePayment({ paymentMode: "cheque" }).paymentMethod).toBe("cheque");
      expect(normalizePayment({ payment_method: "bank_transfer" }).paymentMethod).toBe("bank_transfer");
    });

    it("should handle alternative field names for date", () => {
      expect(normalizePayment({ date: "2026-01-15" }).paymentDate).toBe("2026-01-15");
      expect(normalizePayment({ payment_date: "2026-01-15" }).paymentDate).toBe("2026-01-15");
      expect(normalizePayment({ paymentDate: "2026-01-15" }).paymentDate).toBe("2026-01-15");
    });

    it("should handle alternative field names for reference", () => {
      expect(normalizePayment({ referenceNo: "REF-123" }).referenceNumber).toBe("REF-123");
      expect(normalizePayment({ reference_number: "TXN-456" }).referenceNumber).toBe("TXN-456");
      expect(normalizePayment({ referenceNumber: "CHQ-789" }).referenceNumber).toBe("CHQ-789");
    });

    it("should handle receipt and VAT compliance fields", () => {
      const payment = {
        receipt_number: "RCP-2026-0001",
        receipt_status: "issued",
        is_advance_payment: true,
        composite_reference: "INV-001-RCP-2026-0001",
        remarks: "Payment for advance order",
      };

      const result = normalizePayment(payment);

      expect(result.receiptNumber).toBe("RCP-2026-0001");
      expect(result.receiptStatus).toBe("issued");
      expect(result.isAdvancePayment).toBe(true);
      expect(result.compositeReference).toBe("INV-001-RCP-2026-0001");
      expect(result.remarks).toBe("Payment for advance order");
    });

    it("should handle multi-currency fields", () => {
      const payment = {
        currency: "USD",
        exchange_rate: 3.67,
        amount_in_aed: 3670,
      };

      const result = normalizePayment(payment);

      expect(result.currency).toBe("USD");
      expect(result.exchangeRate).toBe(3.67);
      expect(result.amountInAed).toBe(3670);
    });

    it("should handle null input", () => {
      const result = normalizePayment(null);
      expect(result).toBe(null);
    });

    it("should provide defaults for missing fields", () => {
      const result = normalizePayment({});

      expect(result.amount).toBe(0);
      expect(result.paymentMethod).toBe("other");
      expect(result.voided).toBe(false);
      expect(result.currency).toBe("AED");
      expect(result.exchangeRate).toBe(1.0);
    });
  });

  // ============================================================================
  // RECEIPT HANDLING
  // ============================================================================

  describe("getReceiptDetails()", () => {
    it("should extract receipt details", () => {
      const payment = {
        receiptNumber: "RCP-2026-0001",
        compositeReference: "INV-001-RCP-2026-0001",
        receiptStatus: "issued",
        isAdvancePayment: false,
        remarks: "Payment received",
        paymentDate: "2026-01-15",
        amount: 5000,
        currency: "AED",
        exchangeRate: 1.0,
        amountInAed: 5000,
      };

      const result = getReceiptDetails(payment);

      expect(result.receiptNumber).toBe("RCP-2026-0001");
      expect(result.receiptStatus).toBe("issued");
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe("AED");
    });

    it("should return null if no receipt number", () => {
      const payment = { amount: 5000 };
      const result = getReceiptDetails(payment);
      expect(result).toBe(null);
    });

    it("should handle multi-currency receipt", () => {
      const payment = {
        receiptNumber: "RCP-2026-0001",
        amount: 1000,
        currency: "USD",
        exchangeRate: 3.67,
        amountInAed: 3670,
      };

      const result = getReceiptDetails(payment);

      expect(result.currency).toBe("USD");
      expect(result.exchangeRate).toBe(3.67);
      expect(result.amountInAed).toBe(3670);
    });

    it("should handle null payment", () => {
      const result = getReceiptDetails(null);
      expect(result).toBe(null);
    });
  });

  describe("formatReceiptNumber()", () => {
    it("should accept already formatted receipt number", () => {
      const formatted = formatReceiptNumber("RCP-2026-0001");
      expect(formatted).toBe("RCP-2026-0001");
    });

    it("should extract receipt number from composite reference", () => {
      const composite = "INV-2026-0001-RCP-2026-0001";
      const result = formatReceiptNumber(composite);
      expect(result).toBe("RCP-2026-0001");
    });

    it("should return null for invalid format", () => {
      const result = formatReceiptNumber("INVALID-123-456");
      expect(result).toBe(null);
    });

    it("should handle null input", () => {
      const result = formatReceiptNumber(null);
      expect(result).toBe(null);
    });

    it("should handle empty string", () => {
      const result = formatReceiptNumber("");
      expect(result).toBe(null);
    });

    it("should extract from various composite formats", () => {
      const result1 = formatReceiptNumber("INV-2026-0001-RCP-2026-0001");
      const result2 = formatReceiptNumber("RCP-2026-0005");
      const result3 = formatReceiptNumber("complex-prefix-RCP-2026-0010-suffix");

      expect(result1).toBe("RCP-2026-0001");
      expect(result2).toBe("RCP-2026-0005");
      expect(result3).toBe("RCP-2026-0010");
    });
  });

  describe("getCompositeReference()", () => {
    it("should return stored composite reference", () => {
      const payment = { compositeReference: "INV-001-RCP-2026-0001" };
      const result = getCompositeReference(payment);
      expect(result).toBe("INV-001-RCP-2026-0001");
    });

    it("should construct composite reference from payment and invoice", () => {
      const payment = { receiptNumber: "RCP-2026-0001" };
      const invoice = { invoiceNumber: "INV-2026-0001" };

      const result = getCompositeReference(payment, invoice);

      expect(result).toBe("INV-2026-0001-RCP-2026-0001");
    });

    it("should handle snake_case composite reference", () => {
      const payment = { composite_reference: "INV-001-RCP-2026-0001" };
      const result = getCompositeReference(payment);
      expect(result).toBe("INV-001-RCP-2026-0001");
    });

    it("should return null if insufficient data", () => {
      const payment = { amount: 5000 };
      const result = getCompositeReference(payment);
      expect(result).toBe(null);
    });

    it("should prioritize payment composite reference over construction", () => {
      const payment = {
        compositeReference: "EXISTING-REF",
        receiptNumber: "RCP-2026-0001",
      };
      const invoice = { invoiceNumber: "INV-2026-0001" };

      const result = getCompositeReference(payment, invoice);

      expect(result).toBe("EXISTING-REF");
    });
  });

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  describe("PAYMENT_METHOD_OPTIONS", () => {
    it("should have payment method options", () => {
      expect(PAYMENT_METHOD_OPTIONS instanceof Array).toBeTruthy();
      expect(PAYMENT_METHOD_OPTIONS.length > 0).toBeTruthy();
    });

    it("should have required payment methods", () => {
      const values = PAYMENT_METHOD_OPTIONS.map((opt) => opt.value);

      expect(values.includes("cash").toBeTruthy());
      expect(values.includes("bank_transfer").toBeTruthy());
      expect(values.includes("cheque").toBeTruthy());
      expect(values.includes("credit_card").toBeTruthy());
      expect(values.includes("other").toBeTruthy());
    });

    it("should have proper structure", () => {
      PAYMENT_METHOD_OPTIONS.forEach((option) => {
        expect(option["value"] !== undefined).toBeTruthy();
        expect(option["label"] !== undefined).toBeTruthy();
        expect(typeof option.value).toBe("string");
        expect(typeof option.label).toBe("string");
      });
    });

    it("should have unique values", () => {
      const values = PAYMENT_METHOD_OPTIONS.map((opt) => opt.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle very large payment amounts", () => {
      const payload = createPaymentPayload({
        amount: 999999999.99,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      });

      expect(payload.amount).toBe(999999999.99);
    });

    it("should handle decimal amounts", () => {
      const payload = createPaymentPayload({
        amount: 0.01,
        paymentMethod: "cash",
        paymentDate: "2026-01-15",
      });

      expect(payload.amount).toBe(0.01);
    });

    it("should handle special characters in notes", () => {
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        notes: "Payment for order #123 & special items (™ © ®)",
      });

      expect(payload.notes.includes("™").toBeTruthy());
    });

    it("should handle very long reference numbers", () => {
      const longRef = "A".repeat(100);
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        referenceNumber: longRef,
      });

      expect(payload.referenceNumber).toBe(longRef);
    });

    it("should handle various currency codes", () => {
      const currencies = ["USD", "EUR", "GBP", "SAR", "INR", "AED"];

      currencies.forEach((currency) => {
        const payload = createPaymentPayload({
          amount: 1000,
          paymentMethod: "bank_transfer",
          paymentDate: "2026-01-15",
          currency,
          exchangeRate: 3.67,
        });

        expect(payload.currency).toBe(currency);
      });
    });
  });
});
