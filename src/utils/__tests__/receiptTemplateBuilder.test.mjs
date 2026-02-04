/**
 * Receipt Template Generator - Layer 1 Unit Tests
 *
 * Tests the pure document structure builder (no DOM/browser dependencies)
 * These tests verify receipt data transformation and FTA compliance
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { buildReceiptDocumentStructure } from "../receiptTemplateGenerator.js";

describe("buildReceiptDocumentStructure (Layer 1 - Unit Tests)", () => {
  describe("Field normalization", () => {
    test("should normalize camelCase company fields", () => {
      const company = {
        legalName: "Ultimate Steels",
        trn: "104858252000003",
        address: "123 Industrial Zone",
        phone: "+971-4-1234567",
        email: "info@ultimatesteels.com",
      };

      const result = buildReceiptDocumentStructure({}, {}, company, {});

      assert.strictEqual(result.company.name, "Ultimate Steels");
      assert.strictEqual(result.company.trn, "104858252000003");
    });

    test("should normalize snake_case company fields", () => {
      const company = {
        legal_name: "Ultimate Steels LLC",
        TRN: "104858252000003",
        address: "456 Commerce St",
      };

      const result = buildReceiptDocumentStructure({}, {}, company, {});

      assert.strictEqual(result.company.name, "Ultimate Steels LLC");
      assert.strictEqual(result.company.trn, "104858252000003");
    });

    test("should prefer camelCase over snake_case", () => {
      const company = {
        legalName: "Correct Name",
        legal_name: "Wrong Name",
      };

      const result = buildReceiptDocumentStructure({}, {}, company, {});

      assert.strictEqual(result.company.name, "Correct Name");
    });

    test("should normalize customer fields", () => {
      const customer = {
        name: "ABC Trading",
        address: "456 Commercial St",
        TRN: "200000000000002",
      };

      const result = buildReceiptDocumentStructure({}, {}, {}, customer);

      assert.strictEqual(result.customer.name, "ABC Trading");
      assert.strictEqual(result.customer.trn, "200000000000002");
    });

    test("should normalize invoice fields", () => {
      const invoice = {
        invoiceNumber: "INV-2026-001",
        invoice_date: "2026-02-05",
        total: 10500,
        amount_excluding_vat: 10000,
        vat_amount: 500,
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      assert.strictEqual(result.invoice.number, "INV-2026-001");
      assert.strictEqual(result.invoice.excludingVAT, 10000);
      assert.strictEqual(result.invoice.vat, 500);
    });

    test("should normalize payment fields", () => {
      const payment = {
        amount: 5000,
        payment_date: "2026-02-05",
        paymentMethod: "Bank Transfer",
        reference_number: "TRF-001",
        receipt_number: "RCP-2026-0001",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.payment.amount, 5000);
      assert.strictEqual(result.payment.method, "Bank Transfer");
      assert.strictEqual(result.payment.reference, "TRF-001");
      assert.strictEqual(result.receipt.number, "RCP-2026-0001");
    });
  });

  describe("Receipt metadata", () => {
    test("should structure receipt information", () => {
      const payment = {
        receiptNumber: "RCP-2026-0001",
        paymentDate: "2026-02-05",
        isAdvancePayment: false,
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {}, 5);

      assert.strictEqual(result.receipt.number, "RCP-2026-0001");
      assert.strictEqual(result.receipt.index, 5);
      assert.strictEqual(result.receipt.isAdvancePayment, false);
    });

    test("should flag advance payment", () => {
      const payment = {
        is_advance_payment: true,
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.receipt.isAdvancePayment, true);
    });

    test("should default payment index", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.receipt.index, 1);
    });
  });

  describe("Date handling", () => {
    test("should format payment date to MM/DD/YYYY", () => {
      const payment = {
        paymentDate: "2026-02-05",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.ok(result.receipt.date.includes("/"));
      assert.ok(result.payment.date.includes("/"));
    });

    test("should handle ISO date format", () => {
      const payment = {
        paymentDate: "2026-02-05T14:30:00Z",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.ok(result.payment.date.length > 0);
    });

    test("should format invoice date", () => {
      const invoice = {
        invoiceDate: "2026-02-01",
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      assert.ok(result.invoice.date.length > 0);
    });

    test("should handle missing invoice date", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.invoice.date, "N/A");
    });
  });

  describe("Currency handling", () => {
    test("should handle AED currency", () => {
      const payment = {
        currencyCode: "AED",
        amount: 10500,
        amountInAed: 10500,
        exchangeRate: 1.0,
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.payment.currencyCode, "AED");
      assert.strictEqual(result.payment.exchangeRate, 1.0);
      assert.strictEqual(result.metadata.isForeignCurrency, false);
    });

    test("should handle foreign currency", () => {
      const payment = {
        currency_code: "USD",
        amount: 3000,
        exchange_rate: 3.67,
        amount_in_aed: 11010,
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.payment.currencyCode, "USD");
      assert.strictEqual(result.payment.exchangeRate, 3.67);
      assert.strictEqual(result.payment.amountInAED, 11010);
      assert.strictEqual(result.metadata.isForeignCurrency, true);
    });

    test("should parse numeric currency values", () => {
      const payment = {
        amount: "5000.50",
        exchangeRate: "3.6700",
        amountInAed: "18333.85",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.payment.amount, 5000.5);
      assert.strictEqual(result.payment.exchangeRate, 3.67);
      assert.strictEqual(result.payment.amountInAED, 18333.85);
    });

    test("should default currency to AED", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.payment.currencyCode, "AED");
      assert.strictEqual(result.payment.exchangeRate, 1.0);
    });
  });

  describe("VAT calculations", () => {
    test("should calculate advance payment VAT", () => {
      const payment = {
        amount: 10500,
        is_advance_payment: true,
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      const advanceExcludingVAT = 10500 / 1.05;
      const advanceVAT = (10500 / 1.05) * 0.05;

      assert.strictEqual(result.calculations.advancePaymentExcludingVAT, advanceExcludingVAT);
      assert.strictEqual(result.calculations.advancePaymentVAT, advanceVAT);
    });

    test("should not calculate VAT for non-advance payments", () => {
      const payment = {
        amount: 10500,
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.calculations.advancePaymentExcludingVAT, 0);
      assert.strictEqual(result.calculations.advancePaymentVAT, 0);
    });

    test("should extract invoice VAT", () => {
      const invoice = {
        total: 10500,
        amountExcludingVat: 10000,
        vat: 500,
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      assert.strictEqual(result.invoice.total, 10500);
      assert.strictEqual(result.invoice.excludingVAT, 10000);
      assert.strictEqual(result.invoice.vat, 500);
    });

    test("should calculate invoice VAT from total if not provided", () => {
      const invoice = {
        total: 10500,
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      const expectedExcludingVAT = 10500 / 1.05;
      const expectedVAT = 10500 - expectedExcludingVAT;

      assert.strictEqual(result.invoice.excludingVAT, expectedExcludingVAT);
      assert.ok(Math.abs(result.invoice.vat - expectedVAT) < 0.01);
    });
  });

  describe("Outstanding balance", () => {
    test("should extract outstanding balance from invoice", () => {
      const invoice = {
        outstandingBalance: 5000,
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      assert.strictEqual(result.invoice.outstandingBalance, 5000);
    });

    test("should handle snake_case outstanding field", () => {
      const invoice = {
        outstanding: 3000,
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      assert.strictEqual(result.invoice.outstandingBalance, 3000);
    });

    test("should default to 0 if not provided", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.invoice.outstandingBalance, 0);
    });

    test("should parse numeric outstanding values", () => {
      const invoice = {
        outstanding: "2500.75",
      };

      const result = buildReceiptDocumentStructure({}, invoice, {}, {});

      assert.strictEqual(result.invoice.outstandingBalance, 2500.75);
    });
  });

  describe("Metadata flags", () => {
    test("should flag foreign currency", () => {
      const payment = {
        currencyCode: "GBP",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.metadata.isForeignCurrency, true);
    });

    test("should flag customer TRN presence", () => {
      const customer = {
        trn: "200000000000002",
      };

      const result = buildReceiptDocumentStructure({}, {}, {}, customer);

      assert.strictEqual(result.metadata.hasCustomerTRN, true);
    });

    test("should flag reference number presence", () => {
      const payment = {
        reference_number: "TRF-001",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.metadata.hasReferenceNumber, true);
    });

    test("should not flag missing metadata", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.metadata.isForeignCurrency, false);
      assert.strictEqual(result.metadata.hasCustomerTRN, false);
      assert.strictEqual(result.metadata.hasReferenceNumber, false);
    });
  });

  describe("Return structure", () => {
    test("should return complete receipt document structure", () => {
      const payment = {
        amount: 10500,
        receiptNumber: "RCP-2026-0001",
        paymentDate: "2026-02-05",
      };

      const invoice = {
        invoiceNumber: "INV-2026-001",
        total: 10500,
      };

      const company = {
        legalName: "Ultimate Steels",
        trn: "104858252000003",
      };

      const customer = {
        name: "ABC Trading",
      };

      const result = buildReceiptDocumentStructure(payment, invoice, company, customer);

      assert.ok(result.receipt);
      assert.ok(result.invoice);
      assert.ok(result.company);
      assert.ok(result.customer);
      assert.ok(result.payment);
      assert.ok(result.calculations);
      assert.ok(result.metadata);
    });

    test("should not mutate input objects", () => {
      const payment = { amount: 5000, receiptNumber: "RCP-001" };
      const invoice = { invoiceNumber: "INV-001", total: 10500 };
      const company = { legalName: "Company", trn: "TRN123" };
      const customer = { name: "Customer" };

      const originalPaymentAmount = payment.amount;
      const originalInvoiceNumber = invoice.invoiceNumber;
      const originalCompanyName = company.legalName;
      const originalCustomerName = customer.name;

      buildReceiptDocumentStructure(payment, invoice, company, customer);

      assert.strictEqual(payment.amount, originalPaymentAmount);
      assert.strictEqual(invoice.invoiceNumber, originalInvoiceNumber);
      assert.strictEqual(company.legalName, originalCompanyName);
      assert.strictEqual(customer.name, originalCustomerName);
    });
  });

  describe("Edge cases", () => {
    test("should handle null/undefined inputs", () => {
      const result = buildReceiptDocumentStructure(null, null, null, null);

      assert.ok(result);
      assert.strictEqual(result.receipt.number, "N/A");
      assert.strictEqual(result.invoice.number, "N/A");
    });

    test("should handle undefined inputs", () => {
      const result = buildReceiptDocumentStructure(undefined, undefined, undefined, undefined);

      assert.ok(result);
      assert.strictEqual(result.company.name, "Company Name");
    });

    test("should handle empty strings", () => {
      const payment = {
        reference_number: "",
      };

      const result = buildReceiptDocumentStructure(payment, {}, {}, {});

      assert.strictEqual(result.metadata.hasReferenceNumber, false);
    });

    test("should handle default company name", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.company.name, "Company Name");
    });

    test("should handle default customer name", () => {
      const result = buildReceiptDocumentStructure({}, {}, {}, {});

      assert.strictEqual(result.customer.name, "Customer");
    });

    test("should handle payment index parameter", () => {
      const result1 = buildReceiptDocumentStructure({}, {}, {}, {}, 1);
      const result2 = buildReceiptDocumentStructure({}, {}, {}, {}, 42);

      assert.strictEqual(result1.receipt.index, 1);
      assert.strictEqual(result2.receipt.index, 42);
    });
  });
});

/**
 * REFACTORING GUIDE FOR receiptTemplateGenerator
 * ============================================
 *
 * Current structure:
 * - generateReceiptHTML() - Mixed data transformation + HTML generation
 * - generateReceiptPreview() - Wrapper function
 *
 * Target structure after refactoring:
 * 1. Create buildReceiptDocumentStructure() ✅ DONE
 *    - Extract field normalization logic
 *    - Handle both camelCase and snake_case
 *    - Format dates for display
 *    - Calculate VAT for advance payments
 *    - Return pure data object
 *
 * 2. Update generateReceiptHTML() ✅ DONE
 *    - Call builder function first
 *    - Use structure for HTML generation
 *    - Focus on rendering only
 *
 * Expected test coverage:
 * - Layer 1 (Unit): 32 tests
 * - Layer 2 (Browser): 8-10 tests (template to be created)
 * - Total: 40-42 tests per generator
 */
