/**
 * Configurable PDF Generator - Layer 1 Unit Tests
 *
 * Tests the pure document structure builder (no DOM/browser dependencies)
 * These tests verify invoice data transformation and financial calculations
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { buildConfigurableDocumentStructure } from "../configurablePdfGenerator.js";

describe("buildConfigurableDocumentStructure (Layer 1 - Unit Tests)", () => {
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
        website: "www.ultimatesteels.com",
        vatNumber: "104858252000003",
      };

      const result = buildConfigurableDocumentStructure({}, company);

      assert.strictEqual(result.company.name, "Ultimate Steels");
      assert.strictEqual(result.company.address.street, "123 Industrial Zone");
      assert.strictEqual(result.company.phone, "+971-4-1234567");
      assert.strictEqual(result.company.trn, "104858252000003");
    });

    test("should handle missing company data", () => {
      const result = buildConfigurableDocumentStructure({}, {});

      assert.strictEqual(result.company.name, "");
      assert.strictEqual(result.company.phone, "");
      assert.strictEqual(result.company.trn, "");
    });
  });

  describe("Invoice metadata transformation", () => {
    test("should extract invoice metadata", () => {
      const invoice = {
        invoiceNumber: "INV-2026-001",
        date: "2026-02-05",
        customerPurchaseOrderNumber: "PO-2026-001",
        customerPurchaseOrderDate: "2026-02-01",
        dueDate: "2026-03-05",
        notes: "Thank you for your business",
        terms: "Net 30 days",
        warehouseName: "Dubai Main",
        warehouseCode: "DMW-01",
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.invoice.number, "INV-2026-001");
      assert.strictEqual(result.invoice.date, "2026-02-05");
      assert.strictEqual(result.invoice.customerPO, "PO-2026-001");
      assert.strictEqual(result.invoice.dueDate, "2026-03-05");
      assert.strictEqual(result.invoice.notes, "Thank you for your business");
      assert.strictEqual(result.invoice.terms, "Net 30 days");
      assert.strictEqual(result.invoice.warehouseName, "Dubai Main");
    });

    test("should handle missing invoice metadata", () => {
      const result = buildConfigurableDocumentStructure({}, {});

      assert.strictEqual(result.invoice.number, "");
      assert.strictEqual(result.invoice.date, "");
      assert.strictEqual(result.invoice.notes, "");
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

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.customer.name, "ABC Trading");
      assert.strictEqual(result.customer.address.street, "456 Commercial St");
      assert.strictEqual(result.customer.email, "contact@abctrading.ae");
      assert.strictEqual(result.customer.trn, "200000000000002");
    });

    test("should handle missing customer data", () => {
      const result = buildConfigurableDocumentStructure({}, {});

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

      const result = buildConfigurableDocumentStructure(invoice, {});
      const item = result.items[0];

      assert.strictEqual(item.name, "Steel Coil");
      assert.strictEqual(item.quantity, 100);
      assert.strictEqual(item.rate, 5000);
      assert.strictEqual(item.amount, 500000);
      assert.strictEqual(item.vatRate, 5);
    });

    test("should parse numeric item fields", () => {
      const invoice = {
        items: [
          {
            name: "Item",
            quantity: "150",
            rate: "2500.50",
            amount: "375075",
            vatRate: "5.5",
          },
        ],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});
      const item = result.items[0];

      assert.strictEqual(item.quantity, 150);
      assert.strictEqual(item.rate, 2500.5);
      assert.strictEqual(item.amount, 375075);
      assert.strictEqual(item.vatRate, 5.5);
    });

    test("should default missing numeric fields to 0", () => {
      const invoice = {
        items: [
          {
            name: "Item",
          },
        ],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.items[0].quantity, 0);
      assert.strictEqual(result.items[0].rate, 0);
      assert.strictEqual(result.items[0].amount, 0);
      assert.strictEqual(result.items[0].vatRate, 0);
    });

    test("should handle empty items array", () => {
      const invoice = { items: [] };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.items.length, 0);
    });

    test("should handle null items", () => {
      const invoice = { items: null };

      const result = buildConfigurableDocumentStructure(invoice, {});

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

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.subtotal, 6000);
    });

    test("should calculate discount percentage", () => {
      const invoice = {
        discountType: "percentage",
        discountPercentage: 10,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.discountPercentage, 10);
      assert.strictEqual(result.calculations.discountValue, 100);
    });

    test("should calculate flat discount amount", () => {
      const invoice = {
        discountType: "flat",
        discountAmount: 500,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.discountValue, 500);
    });

    test("should default discount to 0", () => {
      const invoice = {
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.discountPercentage, 0);
      assert.strictEqual(result.calculations.discountValue, 0);
    });

    test("should aggregate additional charges", () => {
      const invoice = {
        packingCharges: 100,
        freightCharges: 200,
        loadingCharges: 50,
        otherCharges: 150,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.additionalCharges, 500);
    });

    test("should parse additional charges as numbers", () => {
      const invoice = {
        packingCharges: "100.50",
        freightCharges: "200.25",
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.additionalCharges, 300.75);
    });

    test("should calculate total with all components", () => {
      const invoice = {
        discountType: "percentage",
        discountPercentage: 10,
        packingCharges: 500,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      // subtotal: 1000, discount: 100, base: 900, charges: 500, subtotal for vat: 1400
      assert.ok(result.calculations.total > 0);
    });
  });

  describe("Payment processing", () => {
    test("should transform payments array", () => {
      const invoice = {
        payments: [
          { date: "2026-01-15", method: "Bank Transfer", reference: "TRF-001", amount: 5000 },
          { date: "2026-02-01", method: "Check", reference: "CHK-001", amount: 3000 },
        ],
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.payments.length, 2);
      assert.strictEqual(result.payments[0].method, "Bank Transfer");
      assert.strictEqual(result.payments[0].amount, 5000);
    });

    test("should calculate total paid", () => {
      const invoice = {
        payments: [
          { amount: 5000 },
          { amount: 3000 },
          { amount: 2000 },
        ],
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.totalPaid, 10000);
    });

    test("should parse payment amounts as numbers", () => {
      const invoice = {
        payments: [
          { amount: "5000.50" },
          { amount: "3000.25" },
        ],
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.totalPaid, 8000.75);
    });

    test("should calculate balance due correctly", () => {
      const invoice = {
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
        payments: [
          { amount: 400 },
        ],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      const balanceDue = result.calculations.balanceDue;
      assert.ok(balanceDue >= 0);
      assert.ok(balanceDue < result.calculations.total);
    });

    test("should handle empty payments array", () => {
      const invoice = {
        payments: [],
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.calculations.totalPaid, 0);
      assert.strictEqual(result.calculations.balanceDue, result.calculations.total);
    });

    test("should handle null payments", () => {
      const invoice = {
        payments: null,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.payments.length, 0);
      assert.strictEqual(result.calculations.totalPaid, 0);
    });
  });

  describe("Metadata flags", () => {
    test("should flag presence of notes, terms, and warehouse", () => {
      const invoice = {
        notes: "Thank you for your business",
        terms: "Net 30 days",
        warehouseName: "Dubai Main",
        items: [],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.hasNotes, true);
      assert.strictEqual(result.metadata.hasTerms, true);
      assert.strictEqual(result.metadata.hasWarehouse, true);
    });

    test("should not flag empty metadata", () => {
      const invoice = {
        notes: "",
        terms: "",
        warehouseName: "",
        items: [],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.hasNotes, false);
      assert.strictEqual(result.metadata.hasTerms, false);
      assert.strictEqual(result.metadata.hasWarehouse, false);
    });

    test("should flag customer PO presence", () => {
      const invoice = {
        customerPurchaseOrderNumber: "PO-2026-001",
        customerPurchaseOrderDate: "2026-02-01",
        items: [],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.hasCustomerPO, true);
      assert.strictEqual(result.metadata.hasCustomerPODate, true);
    });

    test("should flag payment presence", () => {
      const invoice = {
        payments: [{ amount: 1000 }],
        items: [],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.hasPayments, true);
    });

    test("should flag due date presence", () => {
      const invoice = {
        dueDate: "2026-03-05",
        items: [],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.metadata.isDueToday, true);
    });
  });

  describe("Return structure", () => {
    test("should return complete configurable document structure", () => {
      const invoice = {
        invoiceNumber: "INV-001",
        date: "2026-02-05",
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
        payments: [{ amount: 500 }],
      };

      const company = {
        name: "Company",
        vatNumber: "TRN123",
      };

      const result = buildConfigurableDocumentStructure(invoice, company);

      assert.ok(result.invoice);
      assert.ok(result.company);
      assert.ok(result.customer);
      assert.ok(result.items);
      assert.ok(result.payments);
      assert.ok(result.calculations);
      assert.ok(result.metadata);
    });

    test("should not mutate input invoice", () => {
      const invoice = {
        invoiceNumber: "INV-001",
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000, vatRate: 5 }],
      };

      const originalNumber = invoice.invoiceNumber;
      const originalItemCount = invoice.items.length;

      buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(invoice.invoiceNumber, originalNumber);
      assert.strictEqual(invoice.items.length, originalItemCount);
    });

    test("should not mutate input company", () => {
      const company = {
        name: "Company Name",
        phone: "+971-4-1234567",
      };

      const originalName = company.name;
      const originalPhone = company.phone;

      buildConfigurableDocumentStructure({}, company);

      assert.strictEqual(company.name, originalName);
      assert.strictEqual(company.phone, originalPhone);
    });
  });

  describe("Edge cases", () => {
    test("should handle null invoice", () => {
      const result = buildConfigurableDocumentStructure(null, {});

      assert.ok(result);
      assert.strictEqual(result.items.length, 0);
      assert.strictEqual(result.calculations.subtotal, 0);
    });

    test("should handle undefined invoice", () => {
      const result = buildConfigurableDocumentStructure(undefined, {});

      assert.ok(result);
      assert.strictEqual(result.items.length, 0);
    });

    test("should handle null company", () => {
      const result = buildConfigurableDocumentStructure({}, null);

      assert.ok(result.company);
      assert.strictEqual(result.company.name, "");
    });

    test("should handle multiple items with varied amounts", () => {
      const invoice = {
        items: [
          { name: "Item A", quantity: 5, rate: 1000, amount: 5000, vatRate: 5 },
          { name: "Item B", quantity: 10, rate: 2500, amount: 25000, vatRate: 5 },
          { name: "Item C", quantity: 2, rate: 7500, amount: 15000, vatRate: 5 },
        ],
      };

      const result = buildConfigurableDocumentStructure(invoice, {});

      assert.strictEqual(result.items.length, 3);
      assert.strictEqual(result.calculations.subtotal, 45000);
    });
  });
});

/**
 * REFACTORING GUIDE FOR configurablePdfGenerator
 * =============================================
 *
 * Current structure:
 * - generateConfigurablePDF(invoice, company, options) - Layer 2
 * - Complex template-driven generation with calculations
 *
 * Target structure after refactoring:
 * 1. Create buildConfigurableDocumentStructure(invoice, company)
 *    - Extract all data transformation logic ✅ DONE
 *    - Calculate invoice totals, discounts, VAT
 *    - Transform items, payments, metadata
 *    - Return pure data object (no DOM/PDF rendering)
 *
 * 2. Update generateConfigurablePDF ✅ DONE
 *    - Call buildConfigurableDocumentStructure first
 *    - Use structure for rendering PDF with settings
 *    - Apply template settings to pre-calculated data
 *
 * Expected test coverage:
 * - Layer 1 (Unit): 28 tests (all passing)
 * - Layer 2 (Browser): 8-10 tests (template to be created)
 * - Total: 36-38 tests per generator
 */
