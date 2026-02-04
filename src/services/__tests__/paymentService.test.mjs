import '../../__tests__/init.mjs';
/**
 * Payment Service Unit Tests
 * ✅ Comprehensive test coverage for paymentService utilities
 * ✅ Tests data transformation, validation, normalization, receipt handling
 * ✅ 100% coverage target for paymentService.js
 */

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
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
    test("should transform payment with camelCase conversion", () => {
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

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.companyId, 1);
      assert.strictEqual(result.invoiceId, 100);
      assert.strictEqual(result.paymentDate, "2026-01-15");
      assert.strictEqual(result.amount, 5000);
      assert.strictEqual(result.paymentMethod, "bank_transfer");
      assert.strictEqual(result.referenceNumber, "TXN-12345");
      assert.strictEqual(result.receiptNumber, "RCP-2026-0001");
      assert.strictEqual(result.notes, "Payment received");
    });

    test("should handle multi-currency fields", () => {
      const serverData = {
        id: 1,
        amount: "1000.00",
        currency: "USD",
        exchange_rate: 3.67,
        amount_in_aed: "3670.00",
      };

      const result = transformPaymentFromServer(serverData);

      assert.strictEqual(result.amount, 1000);
      assert.strictEqual(result.currency, "USD");
      assert.strictEqual(result.exchangeRate, 3.67);
      assert.strictEqual(result.amountInAed, 3670);
    });

    test("should handle allocation fields", () => {
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

      assert.strictEqual(result.allocatedAmount, 8000);
      assert.strictEqual(result.unallocatedAmount, 2000);
      assert.strictEqual(result.allocations.length, 2);
      assert.strictEqual(result.allocations[0].invoiceId, 1);
      assert.strictEqual(result.allocations[0].allocatedAmount, 5000);
    });

    test("should handle voided payment", () => {
      const serverData = {
        id: 1,
        amount: 5000,
        voided: true,
        void_reason: "Duplicate payment",
        voided_by: "user123",
        voided_at: "2026-01-16T00:00:00Z",
      };

      const result = transformPaymentFromServer(serverData);

      assert.strictEqual(result.voided, true);
      assert.strictEqual(result.voidReason, "Duplicate payment");
      assert.strictEqual(result.voidedBy, "user123");
      assert.strictEqual(result.voidedAt, "2026-01-16T00:00:00Z");
    });

    test("should handle receipt status and VAT compliance fields", () => {
      const serverData = {
        id: 1,
        receipt_number: "RCP-2026-0001",
        receipt_status: "issued",
        is_advance_payment: true,
        composite_reference: "INV-2026-0001-RCP-2026-0001",
        remarks: "Advance payment for order",
      };

      const result = transformPaymentFromServer(serverData);

      assert.strictEqual(result.receiptNumber, "RCP-2026-0001");
      assert.strictEqual(result.receiptStatus, "issued");
      assert.strictEqual(result.isAdvancePayment, true);
      assert.strictEqual(result.compositeReference, "INV-2026-0001-RCP-2026-0001");
      assert.strictEqual(result.remarks, "Advance payment for order");
    });

    test("should handle approval and settlement fields", () => {
      const serverData = {
        id: 1,
        approval_status: "approved",
        approved_by: "manager123",
        approved_at: "2026-01-15T14:00:00Z",
        settlement_type: "full",
        settlement_date: "2026-01-16",
      };

      const result = transformPaymentFromServer(serverData);

      assert.strictEqual(result.approvalStatus, "approved");
      assert.strictEqual(result.approvedBy, "manager123");
      assert.strictEqual(result.approvedAt, "2026-01-15T14:00:00Z");
      assert.strictEqual(result.settlementType, "full");
      assert.strictEqual(result.settlementDate, "2026-01-16");
    });

    test("should handle null input", () => {
      const result = transformPaymentFromServer(null);
      assert.strictEqual(result, null);
    });

    test("should provide default values for optional fields", () => {
      const result = transformPaymentFromServer({});

      assert.strictEqual(result.amount, 0);
      assert.strictEqual(result.currency, "AED");
      assert.strictEqual(result.exchangeRate, 1.0);
      assert.deepStrictEqual(result.allocations, []);
    });
  });

  // ============================================================================
  // PAYMENT PAYLOAD CREATION
  // ============================================================================

  describe("createPaymentPayload()", () => {
    test("should create basic payment payload", () => {
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      });

      assert.strictEqual(payload.amount, 5000);
      assert.strictEqual(payload.paymentMethod, "bank_transfer");
      assert.strictEqual(payload.paymentDate, "2026-01-15");
      assert.strictEqual(payload.referenceNumber, "");
      assert.strictEqual(payload.currency, "AED");
      assert.strictEqual(payload.exchangeRate, 1.0);
    });

    test("should handle AED currency (exchange rate 1.0)", () => {
      const payload = createPaymentPayload({
        amount: 1000,
        paymentMethod: "cash",
        paymentDate: "2026-01-15",
        currency: "AED",
        exchangeRate: 99.99, // Should be overridden to 1.0 for AED
      });

      assert.strictEqual(payload.currency, "AED");
      assert.strictEqual(payload.exchangeRate, 1.0);
      assert.strictEqual(payload.amountInAed, 1000);
    });

    test("should calculate amountInAed for non-AED currencies", () => {
      const payload = createPaymentPayload({
        amount: 1000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        currency: "USD",
        exchangeRate: 3.67,
      });

      assert.strictEqual(payload.currency, "USD");
      assert.strictEqual(payload.exchangeRate, 3.67);
      assert.strictEqual(payload.amountInAed, 3670); // 1000 * 3.67
    });

    test("should use provided amountInAed if given", () => {
      const payload = createPaymentPayload({
        amount: 1000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        currency: "USD",
        exchangeRate: 3.67,
        amountInAed: 3600, // Explicitly provided value
      });

      assert.strictEqual(payload.amountInAed, 3600);
    });

    test("should include optional fields", () => {
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "cheque",
        paymentDate: "2026-01-15",
        referenceNumber: "CHQ-12345",
        notes: "Cheque deposited",
      });

      assert.strictEqual(payload.referenceNumber, "CHQ-12345");
      assert.strictEqual(payload.notes, "Cheque deposited");
    });

    test("should coerce string amounts to numbers", () => {
      const payload = createPaymentPayload({
        amount: "5000.50",
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      });

      assert.strictEqual(payload.amount, 5000.5);
      assert.strictEqual(typeof payload.amount, "number");
    });
  });

  // ============================================================================
  // PAYMENT VALIDATION
  // ============================================================================

  describe("validatePayment()", () => {
    test("should validate correct payment", () => {
      const payment = {
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.errors, []);
    });

    test("should reject payment with zero amount", () => {
      const payment = {
        amount: 0,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Amount must be greater than 0"));
    });

    test("should reject payment with negative amount", () => {
      const payment = {
        amount: -100,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Amount must be greater than 0"));
    });

    test("should reject payment without method", () => {
      const payment = {
        amount: 5000,
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Payment method is required"));
    });

    test("should reject payment without date", () => {
      const payment = {
        amount: 5000,
        paymentMethod: "bank_transfer",
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Payment date is required"));
    });

    test("should validate payment with all required fields", () => {
      const payment = {
        amount: "5000.99",
        paymentMethod: "cheque",
        paymentDate: "2026-01-15",
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test("should report multiple errors", () => {
      const payment = {
        amount: null,
        paymentMethod: null,
        paymentDate: null,
      };

      const result = validatePayment(payment);

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 3);
    });
  });

  // ============================================================================
  // PAYMENT NORMALIZATION
  // ============================================================================

  describe("normalizePayment()", () => {
    test("should normalize payment from various sources", () => {
      const payment = {
        id: 1,
        amount: 5000,
        payment_method: "bank_transfer",
        payment_date: "2026-01-15",
        reference_number: "TXN-123",
      };

      const result = normalizePayment(payment);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.amount, 5000);
      assert.strictEqual(result.paymentMethod, "bank_transfer");
      assert.strictEqual(result.paymentDate, "2026-01-15");
      assert.strictEqual(result.referenceNumber, "TXN-123");
    });

    test("should handle alternative field names for payment method", () => {
      assert.strictEqual(normalizePayment({ method: "cash" }).paymentMethod, "cash");
      assert.strictEqual(normalizePayment({ paymentMode: "cheque" }).paymentMethod, "cheque");
      assert.strictEqual(normalizePayment({ payment_method: "bank_transfer" }).paymentMethod, "bank_transfer");
    });

    test("should handle alternative field names for date", () => {
      assert.strictEqual(normalizePayment({ date: "2026-01-15" }).paymentDate, "2026-01-15");
      assert.strictEqual(normalizePayment({ payment_date: "2026-01-15" }).paymentDate, "2026-01-15");
      assert.strictEqual(normalizePayment({ paymentDate: "2026-01-15" }).paymentDate, "2026-01-15");
    });

    test("should handle alternative field names for reference", () => {
      assert.strictEqual(normalizePayment({ referenceNo: "REF-123" }).referenceNumber, "REF-123");
      assert.strictEqual(normalizePayment({ reference_number: "TXN-456" }).referenceNumber, "TXN-456");
      assert.strictEqual(normalizePayment({ referenceNumber: "CHQ-789" }).referenceNumber, "CHQ-789");
    });

    test("should handle receipt and VAT compliance fields", () => {
      const payment = {
        receipt_number: "RCP-2026-0001",
        receipt_status: "issued",
        is_advance_payment: true,
        composite_reference: "INV-001-RCP-2026-0001",
        remarks: "Payment for advance order",
      };

      const result = normalizePayment(payment);

      assert.strictEqual(result.receiptNumber, "RCP-2026-0001");
      assert.strictEqual(result.receiptStatus, "issued");
      assert.strictEqual(result.isAdvancePayment, true);
      assert.strictEqual(result.compositeReference, "INV-001-RCP-2026-0001");
      assert.strictEqual(result.remarks, "Payment for advance order");
    });

    test("should handle multi-currency fields", () => {
      const payment = {
        currency: "USD",
        exchange_rate: 3.67,
        amount_in_aed: 3670,
      };

      const result = normalizePayment(payment);

      assert.strictEqual(result.currency, "USD");
      assert.strictEqual(result.exchangeRate, 3.67);
      assert.strictEqual(result.amountInAed, 3670);
    });

    test("should handle null input", () => {
      const result = normalizePayment(null);
      assert.strictEqual(result, null);
    });

    test("should provide defaults for missing fields", () => {
      const result = normalizePayment({});

      assert.strictEqual(result.amount, 0);
      assert.strictEqual(result.paymentMethod, "other");
      assert.strictEqual(result.voided, false);
      assert.strictEqual(result.currency, "AED");
      assert.strictEqual(result.exchangeRate, 1.0);
    });
  });

  // ============================================================================
  // RECEIPT HANDLING
  // ============================================================================

  describe("getReceiptDetails()", () => {
    test("should extract receipt details", () => {
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

      assert.strictEqual(result.receiptNumber, "RCP-2026-0001");
      assert.strictEqual(result.receiptStatus, "issued");
      assert.strictEqual(result.amount, 5000);
      assert.strictEqual(result.currency, "AED");
    });

    test("should return null if no receipt number", () => {
      const payment = { amount: 5000 };
      const result = getReceiptDetails(payment);
      assert.strictEqual(result, null);
    });

    test("should handle multi-currency receipt", () => {
      const payment = {
        receiptNumber: "RCP-2026-0001",
        amount: 1000,
        currency: "USD",
        exchangeRate: 3.67,
        amountInAed: 3670,
      };

      const result = getReceiptDetails(payment);

      assert.strictEqual(result.currency, "USD");
      assert.strictEqual(result.exchangeRate, 3.67);
      assert.strictEqual(result.amountInAed, 3670);
    });

    test("should handle null payment", () => {
      const result = getReceiptDetails(null);
      assert.strictEqual(result, null);
    });
  });

  describe("formatReceiptNumber()", () => {
    test("should accept already formatted receipt number", () => {
      const formatted = formatReceiptNumber("RCP-2026-0001");
      assert.strictEqual(formatted, "RCP-2026-0001");
    });

    test("should extract receipt number from composite reference", () => {
      const composite = "INV-2026-0001-RCP-2026-0001";
      const result = formatReceiptNumber(composite);
      assert.strictEqual(result, "RCP-2026-0001");
    });

    test("should return null for invalid format", () => {
      const result = formatReceiptNumber("INVALID-123-456");
      assert.strictEqual(result, null);
    });

    test("should handle null input", () => {
      const result = formatReceiptNumber(null);
      assert.strictEqual(result, null);
    });

    test("should handle empty string", () => {
      const result = formatReceiptNumber("");
      assert.strictEqual(result, null);
    });

    test("should extract from various composite formats", () => {
      const result1 = formatReceiptNumber("INV-2026-0001-RCP-2026-0001");
      const result2 = formatReceiptNumber("RCP-2026-0005");
      const result3 = formatReceiptNumber("complex-prefix-RCP-2026-0010-suffix");

      assert.strictEqual(result1, "RCP-2026-0001");
      assert.strictEqual(result2, "RCP-2026-0005");
      assert.strictEqual(result3, "RCP-2026-0010");
    });
  });

  describe("getCompositeReference()", () => {
    test("should return stored composite reference", () => {
      const payment = { compositeReference: "INV-001-RCP-2026-0001" };
      const result = getCompositeReference(payment);
      assert.strictEqual(result, "INV-001-RCP-2026-0001");
    });

    test("should construct composite reference from payment and invoice", () => {
      const payment = { receiptNumber: "RCP-2026-0001" };
      const invoice = { invoiceNumber: "INV-2026-0001" };

      const result = getCompositeReference(payment, invoice);

      assert.strictEqual(result, "INV-2026-0001-RCP-2026-0001");
    });

    test("should handle snake_case composite reference", () => {
      const payment = { composite_reference: "INV-001-RCP-2026-0001" };
      const result = getCompositeReference(payment);
      assert.strictEqual(result, "INV-001-RCP-2026-0001");
    });

    test("should return null if insufficient data", () => {
      const payment = { amount: 5000 };
      const result = getCompositeReference(payment);
      assert.strictEqual(result, null);
    });

    test("should prioritize payment composite reference over construction", () => {
      const payment = {
        compositeReference: "EXISTING-REF",
        receiptNumber: "RCP-2026-0001",
      };
      const invoice = { invoiceNumber: "INV-2026-0001" };

      const result = getCompositeReference(payment, invoice);

      assert.strictEqual(result, "EXISTING-REF");
    });
  });

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  describe("PAYMENT_METHOD_OPTIONS", () => {
    test("should have payment method options", () => {
      assert.ok(PAYMENT_METHOD_OPTIONS instanceof Array);
      assert.ok(PAYMENT_METHOD_OPTIONS.length > 0);
    });

    test("should have required payment methods", () => {
      const values = PAYMENT_METHOD_OPTIONS.map((opt) => opt.value);

      assert.ok(values.includes("cash"));
      assert.ok(values.includes("bank_transfer"));
      assert.ok(values.includes("cheque"));
      assert.ok(values.includes("credit_card"));
      assert.ok(values.includes("other"));
    });

    test("should have proper structure", () => {
      PAYMENT_METHOD_OPTIONS.forEach((option) => {
        assert.ok(option["value"] !== undefined);
        assert.ok(option["label"] !== undefined);
        assert.strictEqual(typeof option.value, "string");
        assert.strictEqual(typeof option.label, "string");
      });
    });

    test("should have unique values", () => {
      const values = PAYMENT_METHOD_OPTIONS.map((opt) => opt.value);
      const uniqueValues = new Set(values);
      assert.strictEqual(uniqueValues.size, values.length);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    test("should handle very large payment amounts", () => {
      const payload = createPaymentPayload({
        amount: 999999999.99,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
      });

      assert.strictEqual(payload.amount, 999999999.99);
    });

    test("should handle decimal amounts", () => {
      const payload = createPaymentPayload({
        amount: 0.01,
        paymentMethod: "cash",
        paymentDate: "2026-01-15",
      });

      assert.strictEqual(payload.amount, 0.01);
    });

    test("should handle special characters in notes", () => {
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        notes: "Payment for order #123 & special items (™ © ®)",
      });

      assert.ok(payload.notes.includes("™"));
    });

    test("should handle very long reference numbers", () => {
      const longRef = "A".repeat(100);
      const payload = createPaymentPayload({
        amount: 5000,
        paymentMethod: "bank_transfer",
        paymentDate: "2026-01-15",
        referenceNumber: longRef,
      });

      assert.strictEqual(payload.referenceNumber, longRef);
    });

    test("should handle various currency codes", () => {
      const currencies = ["USD", "EUR", "GBP", "SAR", "INR", "AED"];

      currencies.forEach((currency) => {
        const payload = createPaymentPayload({
          amount: 1000,
          paymentMethod: "bank_transfer",
          paymentDate: "2026-01-15",
          currency,
          exchangeRate: 3.67,
        });

        assert.strictEqual(payload.currency, currency);
      });
    });
  });
});
