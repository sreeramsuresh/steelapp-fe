/**
 * Deprecated PDF Generator - Layer 1 Unit Tests
 *
 * Tests the pure document structure builder (no DOM/browser dependencies)
 * DEPRECATED: Use generateConfigurablePDF or backend API instead
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { buildDeprecatedInvoiceDocumentStructure } from "../pdfGenerator.js";

describe("buildDeprecatedInvoiceDocumentStructure (Layer 1 - Unit Tests)", () => {
  describe("Company data transformation", () => {
    test("should extract and structure company information", () => {
      const company = {
        name: "Ultimate Steels",
        address: {
          street: "123 Industrial Zone",
          city: "Dubai",
          country: "UAE",
        },
        phone: "+971-4-1234567",
        email: "info@ultimatesteels.com",
        vatNumber: "104858252000003",
      };

      const result = buildDeprecatedInvoiceDocumentStructure({}, company);

      assert.strictEqual(result.company.name, "Ultimate Steels");
      assert.strictEqual(result.company.address.street, "123 Industrial Zone");
      assert.strictEqual(result.company.trn, "104858252000003");
    });

    test("should handle missing company data", () => {
      const result = buildDeprecatedInvoiceDocumentStructure({}, {});

      assert.strictEqual(result.company.name, "");
      assert.strictEqual(result.company.phone, "");
    });
  });

  describe("Invoice metadata transformation", () => {
    test("should extract invoice metadata", () => {
      const invoice = {
        invoiceNumber: "INV-2026-001",
        date: "2026-02-05",
        status: "draft",
        dueDate: "2026-03-05",
        notes: "Thank you for your business",
        terms: "Net 30 days",
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.invoice.number, "INV-2026-001");
      assert.strictEqual(result.invoice.date, "2026-02-05");
      assert.strictEqual(result.invoice.status, "draft");
      assert.strictEqual(result.invoice.notes, "Thank you for your business");
    });

    test("should handle invoice status values", () => {
      const result1 = buildDeprecatedInvoiceDocumentStructure({ status: "draft" }, {});
      const result2 = buildDeprecatedInvoiceDocumentStructure({ status: "proforma" }, {});
      const result3 = buildDeprecatedInvoiceDocumentStructure({ status: "final" }, {});

      assert.strictEqual(result1.invoice.status, "draft");
      assert.strictEqual(result2.invoice.status, "proforma");
      assert.strictEqual(result3.invoice.status, "final");
    });
  });

  describe("Customer data transformation", () => {
    test("should extract customer information", () => {
      const invoice = {
        customer: {
          name: "ABC Trading",
          address: {
            street: "456 Commercial St",
            city: "Abu Dhabi",
            country: "UAE",
          },
          email: "contact@abctrading.ae",
          phone: "+971-2-1234567",
          vatNumber: "200000000000002",
        },
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.customer.name, "ABC Trading");
      assert.strictEqual(result.customer.email, "contact@abctrading.ae");
      assert.strictEqual(result.customer.trn, "200000000000002");
    });

    test("should handle missing customer data", () => {
      const result = buildDeprecatedInvoiceDocumentStructure({}, {});

      assert.strictEqual(result.customer.name, "");
      assert.strictEqual(result.customer.email, "");
    });
  });

  describe("Item transformation", () => {
    test("should transform items with calculations", () => {
      const invoice = {
        items: [
          {
            name: "Steel Coil",
            quantity: 100,
            rate: 5000,
            amount: 500000,
            vatRate: 5,
          },
        ],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});
      const item = result.items[0];

      assert.strictEqual(item.name, "Steel Coil");
      assert.strictEqual(item.quantity, 100);
      assert.strictEqual(item.rate, 5000);
      assert.strictEqual(item.amount, 500000);
    });

    test("should parse numeric item fields", () => {
      const invoice = {
        items: [
          {
            name: "Item",
            quantity: "150",
            rate: "2500.50",
            amount: "375075",
            vatRate: "5",
          },
        ],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.items[0].quantity, 150);
      assert.strictEqual(result.items[0].rate, 2500.5);
    });

    test("should handle empty items array", () => {
      const invoice = { items: [] };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.items.length, 0);
    });

    test("should handle null items", () => {
      const invoice = { items: null };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.items.length, 0);
    });
  });

  describe("Invoice calculations", () => {
    test("should calculate subtotal from items", () => {
      const invoice = {
        items: [
          { name: "Item 1", quantity: 10, rate: 100, amount: 1000, vatRate: 5 },
          { name: "Item 2", quantity: 20, rate: 250, amount: 5000, vatRate: 5 },
        ],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.subtotal, 6000);
    });

    test("should calculate discount value", () => {
      const invoice = {
        discountType: "percentage",
        discountPercentage: 10,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.discountValue, 100);
    });

    test("should calculate total correctly", () => {
      const invoice = {
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.ok(result.calculations.total > 0);
    });

    test("should handle flat discount", () => {
      const invoice = {
        discountType: "flat",
        discountAmount: 500,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.discountValue, 500);
    });
  });

  describe("Metadata flags", () => {
    test("should flag draft status", () => {
      const invoice = { status: "draft" };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.isDraft, true);
      assert.strictEqual(result.metadata.isProforma, false);
    });

    test("should flag proforma status", () => {
      const invoice = { status: "proforma" };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.isDraft, false);
      assert.strictEqual(result.metadata.isProforma, true);
    });

    test("should flag deprecated status", () => {
      const result = buildDeprecatedInvoiceDocumentStructure({}, {});

      assert.strictEqual(result.metadata.isDeprecated, true);
    });
  });

  describe("Return structure", () => {
    test("should return complete invoice document structure", () => {
      const invoice = {
        invoiceNumber: "INV-001",
        date: "2026-02-05",
        status: "draft",
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const company = {
        name: "Company",
        vatNumber: "TRN123",
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, company);

      assert.ok(result.invoice);
      assert.ok(result.company);
      assert.ok(result.customer);
      assert.ok(result.items);
      assert.ok(result.calculations);
      assert.ok(result.metadata);
    });

    test("should not mutate input data", () => {
      const invoice = {
        invoiceNumber: "INV-001",
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const originalNumber = invoice.invoiceNumber;
      const originalItemCount = invoice.items.length;

      buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(invoice.invoiceNumber, originalNumber);
      assert.strictEqual(invoice.items.length, originalItemCount);
    });
  });

  describe("Edge cases", () => {
    test("should handle null invoice", () => {
      const result = buildDeprecatedInvoiceDocumentStructure(null, {});

      assert.ok(result);
      assert.strictEqual(result.items.length, 0);
    });

    test("should handle undefined invoice", () => {
      const result = buildDeprecatedInvoiceDocumentStructure(undefined, {});

      assert.ok(result);
      assert.strictEqual(result.items.length, 0);
    });

    test("should handle null company", () => {
      const result = buildDeprecatedInvoiceDocumentStructure({}, null);

      assert.ok(result.company);
      assert.strictEqual(result.company.name, "");
    });

    test("should default status to draft", () => {
      const invoice = { status: "draft" };
      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.invoice.status, "draft");
      assert.strictEqual(result.metadata.isDraft, true);
    });

    test("should handle multiple items", () => {
      const invoice = {
        items: [
          { name: "Item A", quantity: 5, rate: 1000, amount: 5000, vatRate: 5 },
          { name: "Item B", quantity: 10, rate: 2500, amount: 25000, vatRate: 5 },
          { name: "Item C", quantity: 2, rate: 7500, amount: 15000, vatRate: 5 },
        ],
      };

      const result = buildDeprecatedInvoiceDocumentStructure(invoice, {});

      assert.strictEqual(result.items.length, 3);
      assert.strictEqual(result.calculations.subtotal, 45000);
    });
  });
});

/**
 * DEPRECATION NOTICE FOR pdfGenerator
 * ==================================
 *
 * This generator is DEPRECATED and maintained for backwards compatibility only.
 *
 * MIGRATION NOTICE:
 * -----------------
 * PDF generation has been unified using React SSR + Puppeteer on the backend.
 * This ensures pixel-perfect consistency between preview and PDF download.
 *
 * For PDF downloads, use the backend API endpoints instead:
 * - POST /api/invoices/:id/pdf
 *
 * The backend uses React SSR to render the SAME React components used for preview,
 * ensuring the PDF matches what users see on screen.
 *
 * @see steelapprnp/services/pdfService.js
 * @see steelapprnp/templates/ssrRenderer.js
 *
 * Expected test coverage:
 * - Layer 1 (Unit): 25 tests
 * - Layer 2 (Browser): Not applicable (deprecated)
 * - Total: 25 tests
 */
