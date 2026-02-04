/**
 * Quotation PDF Generator - Layer 1 Unit Tests
 *
 * Tests the pure document structure builder (no DOM/browser dependencies)
 * These tests verify data transformation and calculation logic
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { buildQuotationDocumentStructure } from "../quotationPdfGenerator.js";

describe("buildQuotationDocumentStructure (Layer 1 - Unit Tests)", () => {
  describe("Company data transformation", () => {
    test("should extract and structure company information", () => {
      const quotation = { items: [] };
      const company = {
        name: "Test Corp",
        address: {
          street: "123 Main St",
          city: "Dubai",
          emirate: "DXB",
          poBox: "12345",
          country: "UAE",
        },
        phone: "+971-1234567",
        email: "test@corp.com",
        vatNumber: "12345678",
      };

      const result = buildQuotationDocumentStructure(quotation, company);

      assert.strictEqual(result.company.name, "Test Corp");
      assert.strictEqual(result.company.address.street, "123 Main St");
      assert.strictEqual(result.company.address.city, "Dubai");
      assert.strictEqual(result.company.address.emirate, "DXB");
      assert.strictEqual(result.company.phone, "+971-1234567");
      assert.strictEqual(result.company.email, "test@corp.com");
      assert.strictEqual(result.company.vatNumber, "12345678");
    });

    test("should handle missing company data with defaults", () => {
      const result = buildQuotationDocumentStructure({ items: [] }, {});

      assert.strictEqual(result.company.name, "Company");
      assert.strictEqual(result.company.address.street, "");
      assert.strictEqual(result.company.phone, "");
      assert.strictEqual(result.company.email, "");
    });

    test("should handle null company gracefully", () => {
      const result = buildQuotationDocumentStructure({ items: [] }, null);

      assert.ok(result.company);
      assert.strictEqual(result.company.name, "Company");
    });
  });

  describe("Quotation data transformation", () => {
    test("should extract quotation metadata", () => {
      const quotation = {
        quotationNumber: "Q-2026-001",
        quotationDate: "2026-02-05",
        validUntil: "2026-03-05",
        status: "DRAFT",
        items: [],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.quotation.number, "Q-2026-001");
      assert.strictEqual(result.quotation.date, "2026-02-05");
      assert.strictEqual(result.quotation.validUntil, "2026-03-05");
      assert.strictEqual(result.quotation.status, "DRAFT");
    });

    test("should handle missing quotation fields", () => {
      const result = buildQuotationDocumentStructure({}, {});

      assert.strictEqual(result.quotation.number, "");
      assert.strictEqual(result.quotation.date, "");
      assert.strictEqual(result.quotation.status, "");
    });
  });

  describe("Customer data transformation", () => {
    test("should extract customer name", () => {
      const quotation = {
        customerDetails: { name: "ABC Trading" },
        items: [],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.customer.name, "ABC Trading");
    });

    test("should use default customer name when missing", () => {
      const result = buildQuotationDocumentStructure({ items: [] }, {});

      assert.strictEqual(result.customer.name, "Customer");
    });
  });

  describe("Item transformation and calculations", () => {
    test("should transform items with all fields", () => {
      const quotation = {
        items: [
          {
            name: "Steel Sheet",
            grade: "304L",
            finish: "Polished",
            size: "1000mm",
            thickness: "2mm",
            unit: "kg",
            quantity: 100,
            rate: 500,
            amount: 50000,
            discount: 5000,
            discountType: "absolute",
            vatRate: 5,
            description: "High quality stainless steel",
          },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});
      const item = result.items[0];

      assert.strictEqual(item.name, "Steel Sheet");
      assert.strictEqual(item.specification, "304L | Polished | 1000mm | 2mm");
      assert.strictEqual(item.description, "High quality stainless steel");
      assert.strictEqual(item.quantity, 100);
      assert.strictEqual(item.rate, 500);
      assert.strictEqual(item.amount, 50000);
      assert.strictEqual(item.discount, 5000);
      assert.strictEqual(item.discountType, "absolute");
      assert.strictEqual(item.vatRate, 5);
    });

    test("should calculate VAT amount correctly", () => {
      const quotation = {
        items: [
          {
            name: "Product",
            amount: 10000,
            vatRate: 5,
          },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});
      const item = result.items[0];

      // VAT = 10000 * 5% = 500
      assert.strictEqual(item.vatAmount, 500);
      assert.strictEqual(item.total, 10500);
    });

    test("should calculate total with zero discount", () => {
      const quotation = {
        items: [
          {
            name: "Product",
            amount: 10000,
            discount: 0,
            vatRate: 5,
          },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});
      const item = result.items[0];

      assert.strictEqual(item.discount, 0);
      assert.strictEqual(item.total, 10500);
    });

    test("should handle multiple items", () => {
      const quotation = {
        items: [
          {
            name: "Item 1",
            amount: 1000,
            vatRate: 5,
          },
          {
            name: "Item 2",
            amount: 2000,
            vatRate: 5,
          },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.items.length, 2);
      assert.strictEqual(result.items[0].name, "Item 1");
      assert.strictEqual(result.items[1].name, "Item 2");
    });

    test("should handle missing items array", () => {
      const result = buildQuotationDocumentStructure({}, {});

      assert.strictEqual(Array.isArray(result.items), true);
      assert.strictEqual(result.items.length, 0);
    });

    test("should use default values for missing item fields", () => {
      const quotation = {
        items: [{ name: "Product" }],
      };

      const result = buildQuotationDocumentStructure(quotation, {});
      const item = result.items[0];

      assert.strictEqual(item.unit, "pcs");
      assert.strictEqual(item.quantity, 0);
      assert.strictEqual(item.rate, 0);
      assert.strictEqual(item.amount, 0);
      assert.strictEqual(item.discount, 0);
      assert.strictEqual(item.vatRate, 0);
    });

    test("should build specification from components", () => {
      const quotation = {
        items: [
          {
            name: "Steel",
            grade: "304",
            finish: "Brushed",
            size: "2000mm",
            thickness: "3mm",
          },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.items[0].specification, "304 | Brushed | 2000mm | 3mm");
    });

    test("should use provided specification over components", () => {
      const quotation = {
        items: [
          {
            name: "Steel",
            specification: "Custom Spec",
            grade: "304",
            finish: "Brushed",
          },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.items[0].specification, "Custom Spec");
    });
  });

  describe("Calculations", () => {
    test("should calculate subtotal correctly", () => {
      const quotation = {
        items: [
          { amount: 1000, vatRate: 0 },
          { amount: 2000, vatRate: 0 },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.calculations.subtotal, 3000);
    });

    test("should calculate total VAT amount", () => {
      const quotation = {
        items: [
          { amount: 1000, vatRate: 5 }, // 50
          { amount: 2000, vatRate: 10 }, // 200
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.calculations.gstAmount, 250);
    });

    test("should include other charges in total", () => {
      const quotation = {
        items: [{ amount: 1000, vatRate: 5 }],
        otherCharges: 100,
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      // subtotal: 1000, vat: 50, other: 100, total: 1150
      assert.strictEqual(result.calculations.subtotal, 1000);
      assert.strictEqual(result.calculations.gstAmount, 50);
      assert.strictEqual(result.calculations.otherCharges, 100);
      assert.strictEqual(result.calculations.total, 1150);
    });

    test("should handle zero other charges", () => {
      const quotation = {
        items: [{ amount: 1000, vatRate: 5 }],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.calculations.otherCharges, 0);
      assert.strictEqual(result.calculations.total, 1050);
    });

    test("should handle missing items gracefully in calculations", () => {
      const result = buildQuotationDocumentStructure({}, {});

      assert.strictEqual(result.calculations.subtotal, 0);
      assert.strictEqual(result.calculations.gstAmount, 0);
      assert.strictEqual(result.calculations.total, 0);
    });
  });

  describe("Metadata flags", () => {
    test("should detect when items have descriptions", () => {
      const quotation = {
        items: [
          { name: "Item 1", description: "Some description" },
          { name: "Item 2" },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.metadata.hasDescription, true);
    });

    test("should detect when no items have descriptions", () => {
      const quotation = {
        items: [{ name: "Item 1" }, { name: "Item 2" }],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.metadata.hasDescription, false);
    });

    test("should detect when items have discounts", () => {
      const quotation = {
        items: [
          { name: "Item 1", discount: 100 },
          { name: "Item 2", discount: 0 },
        ],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.metadata.hasItemDiscount, true);
    });

    test("should detect when no items have discounts", () => {
      const quotation = {
        items: [{ name: "Item 1", discount: 0 }, { name: "Item 2" }],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.metadata.hasItemDiscount, false);
    });
  });

  describe("Notes and Terms & Conditions", () => {
    test("should include notes when present", () => {
      const quotation = {
        notes: "This is a special quotation",
        items: [],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.notes, "This is a special quotation");
    });

    test("should include terms and conditions when present", () => {
      const quotation = {
        termsAndConditions: "Payment due within 30 days",
        items: [],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(result.termsAndConditions, "Payment due within 30 days");
    });

    test("should handle missing notes and T&C", () => {
      const result = buildQuotationDocumentStructure({ items: [] }, {});

      assert.strictEqual(result.notes, "");
      assert.strictEqual(result.termsAndConditions, "");
    });
  });

  describe("Return structure", () => {
    test("should return complete document structure", () => {
      const quotation = {
        quotationNumber: "Q-001",
        items: [],
      };

      const result = buildQuotationDocumentStructure(quotation, {});

      assert.ok(result.company);
      assert.ok(result.customer);
      assert.ok(result.quotation);
      assert.ok(Array.isArray(result.items));
      assert.ok(result.calculations);
      assert.ok(result.metadata);
      assert.strictEqual(typeof result.notes, "string");
      assert.strictEqual(typeof result.termsAndConditions, "string");
    });

    test("should not mutate input quotation", () => {
      const quotation = {
        items: [{ name: "Item 1", amount: 1000, vatRate: 5 }],
      };
      const originalAmount = quotation.items[0].amount;

      buildQuotationDocumentStructure(quotation, {});

      assert.strictEqual(quotation.items[0].amount, originalAmount);
    });

    test("should not mutate input company", () => {
      const company = { name: "Company" };
      const originalName = company.name;

      buildQuotationDocumentStructure({ items: [] }, company);

      assert.strictEqual(company.name, originalName);
    });
  });
});
