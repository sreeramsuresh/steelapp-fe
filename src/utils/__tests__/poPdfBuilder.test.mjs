/**
 * Purchase Order PDF Generator - Layer 1 Unit Tests
 *
 * Tests the pure document structure builder (no DOM/browser dependencies)
 * These tests verify PO data transformation, item calculations, and totals
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { buildPurchaseOrderDocumentStructure } from "../poPdfGenerator.js";

describe("buildPurchaseOrderDocumentStructure (Layer 1 - Unit Tests)", () => {
  describe("Company data transformation", () => {
    test("should extract and structure company information", () => {
      const company = {
        name: "Steel Trading Co",
        address: {
          street: "123 Industrial St",
          city: "Dubai",
          emirate: "DXB",
          poBox: "12345",
          country: "UAE",
        },
        phone: "+971-1234567",
        email: "info@steel.ae",
        vatNumber: "12345678",
      };

      const result = buildPurchaseOrderDocumentStructure({}, company);

      assert.strictEqual(result.company.name, "Steel Trading Co");
      assert.strictEqual(result.company.address.street, "123 Industrial St");
      assert.strictEqual(result.company.address.city, "Dubai");
      assert.strictEqual(result.company.trn, "12345678");
    });

    test("should handle missing company data", () => {
      const result = buildPurchaseOrderDocumentStructure({}, {});

      assert.strictEqual(result.company.name, "");
      assert.strictEqual(result.company.address.street, "");
      assert.strictEqual(result.company.trn, "");
    });

    test("should handle null/undefined company", () => {
      const result = buildPurchaseOrderDocumentStructure({}, null);

      assert.ok(result.company);
      assert.strictEqual(result.company.name, "");
    });
  });

  describe("Purchase Order metadata transformation", () => {
    test("should extract PO number and dates", () => {
      const po = {
        poNumber: "PO-2026-001",
        poDate: "2026-02-05",
        expectedDeliveryDate: "2026-03-05",
        status: "PENDING",
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.po.number, "PO-2026-001");
      assert.strictEqual(result.po.date, "2026-02-05");
      assert.strictEqual(result.po.expectedDeliveryDate, "2026-03-05");
      assert.strictEqual(result.po.status, "PENDING");
    });

    test("should extract supplier name", () => {
      const po = {
        supplierName: "Global Steel Supplies",
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.po.supplierName, "Global Steel Supplies");
    });

    test("should extract notes and terms", () => {
      const po = {
        notes: "Urgent delivery required",
        terms: "Net 30 days\nFOB Origin",
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.po.notes, "Urgent delivery required");
      assert.strictEqual(result.po.terms, "Net 30 days\nFOB Origin");
    });

    test("should handle missing PO metadata", () => {
      const result = buildPurchaseOrderDocumentStructure({}, {});

      assert.strictEqual(result.po.number, "");
      assert.strictEqual(result.po.date, "");
      assert.strictEqual(result.po.status, "");
    });
  });

  describe("Item transformation", () => {
    test("should transform items with all fields", () => {
      const po = {
        items: [
          {
            name: "Steel Coil",
            productType: "COIL",
            description: "Grade 304",
            specification: "304 | Polished | 1000mm",
            grade: "304",
            finish: "Polished",
            size: "1000mm",
            thickness: "2mm",
            unit: "MT",
            quantity: 100,
            rate: 5000,
            amount: 500000,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});
      const item = result.items[0];

      assert.strictEqual(item.name, "Steel Coil");
      assert.strictEqual(item.description, "Grade 304");
      assert.strictEqual(item.specification, "304 | Polished | 1000mm");
      assert.strictEqual(item.unit, "MT");
      assert.strictEqual(item.quantity, 100);
      assert.strictEqual(item.rate, 5000);
      assert.strictEqual(item.amount, 500000);
    });

    test("should generate specification from components if not provided", () => {
      const po = {
        items: [
          {
            name: "Steel Sheet",
            grade: "316L",
            finish: "Brushed",
            size: "2000mm",
            thickness: "1.5mm",
            unit: "kg",
            quantity: 50,
            rate: 100,
            amount: 5000,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});
      const item = result.items[0];

      assert.strictEqual(item.specification, "316L | Brushed | 2000mm | 1.5mm");
    });

    test("should handle items with empty description", () => {
      const po = {
        items: [
          {
            name: "Item 1",
            description: "",
            quantity: 10,
            rate: 100,
            amount: 1000,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items[0].description, "");
      assert.strictEqual(result.metadata.hasDescription, false);
    });

    test("should parse numeric quantities and rates", () => {
      const po = {
        items: [
          {
            name: "Item",
            quantity: "150",
            rate: "2500.50",
            amount: "375075",
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});
      const item = result.items[0];

      assert.strictEqual(item.quantity, 150);
      assert.strictEqual(item.rate, 2500.5);
      assert.strictEqual(item.amount, 375075);
    });

    test("should default to 0 for missing numeric fields", () => {
      const po = {
        items: [
          {
            name: "Item",
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});
      const item = result.items[0];

      assert.strictEqual(item.quantity, 0);
      assert.strictEqual(item.rate, 0);
      assert.strictEqual(item.amount, 0);
    });

    test("should default unit to MT if not provided", () => {
      const po = {
        items: [
          {
            name: "Item",
            quantity: 10,
            rate: 100,
            amount: 1000,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items[0].unit, "MT");
    });

    test("should use provided unit", () => {
      const po = {
        items: [
          {
            name: "Item",
            unit: "kg",
            quantity: 50,
            rate: 10,
            amount: 500,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items[0].unit, "kg");
    });

    test("should handle empty items array", () => {
      const po = { items: [] };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items.length, 0);
      assert.strictEqual(result.metadata.hasDescription, false);
    });

    test("should handle null items", () => {
      const po = { items: null };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items.length, 0);
    });
  });

  describe("Item description metadata", () => {
    test("should flag hasDescription when any item has description", () => {
      const po = {
        items: [
          { name: "Item 1", description: "", quantity: 10, rate: 100, amount: 1000 },
          { name: "Item 2", description: "Special grade", quantity: 20, rate: 200, amount: 4000 },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.metadata.hasDescription, true);
    });

    test("should not flag hasDescription when all items lack description", () => {
      const po = {
        items: [
          { name: "Item 1", description: "", quantity: 10, rate: 100, amount: 1000 },
          { name: "Item 2", quantity: 20, rate: 200, amount: 4000 },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.metadata.hasDescription, false);
    });
  });

  describe("PO calculations", () => {
    test("should calculate subtotal from item amounts", () => {
      const po = {
        items: [
          { name: "Item 1", quantity: 10, rate: 100, amount: 1000 },
          { name: "Item 2", quantity: 20, rate: 200, amount: 4000 },
          { name: "Item 3", quantity: 15, rate: 150, amount: 2250 },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.subtotal, 7250);
    });

    test("should include VAT amount if provided", () => {
      const po = {
        vatAmount: 362.5,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000 }],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.vatAmount, 362.5);
    });

    test("should default VAT to 0 if not provided", () => {
      const po = {
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000 }],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.vatAmount, 0);
    });

    test("should calculate total as subtotal + VAT", () => {
      const po = {
        vatAmount: 500,
        items: [
          { name: "Item 1", quantity: 10, rate: 100, amount: 1000 },
          { name: "Item 2", quantity: 20, rate: 250, amount: 5000 },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.subtotal, 6000);
      assert.strictEqual(result.calculations.vatAmount, 500);
      assert.strictEqual(result.calculations.total, 6500);
    });

    test("should handle PO with no items", () => {
      const po = {
        items: [],
        vatAmount: 0,
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.subtotal, 0);
      assert.strictEqual(result.calculations.total, 0);
    });

    test("should parse VAT as number", () => {
      const po = {
        vatAmount: "1500.75",
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000 }],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.vatAmount, 1500.75);
      assert.strictEqual(result.calculations.total, 2500.75);
    });

    test("should handle zero VAT", () => {
      const po = {
        vatAmount: 0,
        items: [{ name: "Item", quantity: 10, rate: 100, amount: 1000 }],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.total, 1000);
    });
  });

  describe("Notes and terms metadata", () => {
    test("should flag hasNotes when notes present", () => {
      const po = { notes: "Please deliver ASAP" };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.metadata.hasNotes, true);
    });

    test("should flag hasTerms when terms present", () => {
      const po = { terms: "Net 30" };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.metadata.hasTerms, true);
    });

    test("should not flag when notes and terms empty", () => {
      const po = { notes: "", terms: "" };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.metadata.hasNotes, false);
      assert.strictEqual(result.metadata.hasTerms, false);
    });
  });

  describe("Return structure", () => {
    test("should return complete PO document structure", () => {
      const po = {
        poNumber: "PO-001",
        poDate: "2026-02-05",
        supplierName: "Supplier",
        items: [
          {
            name: "Item",
            quantity: 10,
            rate: 100,
            amount: 1000,
          },
        ],
        vatAmount: 50,
        notes: "Notes",
        terms: "Terms",
      };

      const company = {
        name: "Company",
        vatNumber: "TRN123",
      };

      const result = buildPurchaseOrderDocumentStructure(po, company);

      assert.ok(result.po);
      assert.ok(result.company);
      assert.ok(result.items);
      assert.ok(result.calculations);
      assert.ok(result.metadata);

      assert.strictEqual(result.po.number, "PO-001");
      assert.strictEqual(result.company.name, "Company");
      assert.strictEqual(result.items.length, 1);
      assert.strictEqual(result.calculations.total, 1050);
    });

    test("should not mutate input PO data", () => {
      const po = {
        poNumber: "PO-001",
        items: [
          {
            name: "Item",
            quantity: 10,
            rate: 100,
            amount: 1000,
          },
        ],
      };

      const originalNumber = po.poNumber;
      const originalItemCount = po.items.length;
      const originalQuantity = po.items[0].quantity;

      buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(po.poNumber, originalNumber);
      assert.strictEqual(po.items.length, originalItemCount);
      assert.strictEqual(po.items[0].quantity, originalQuantity);
    });

    test("should not mutate input company data", () => {
      const company = {
        name: "Original Name",
        address: {
          city: "Dubai",
        },
      };

      const originalName = company.name;
      const originalCity = company.address.city;

      buildPurchaseOrderDocumentStructure({}, company);

      assert.strictEqual(company.name, originalName);
      assert.strictEqual(company.address.city, originalCity);
    });
  });

  describe("Multiple items", () => {
    test("should handle multiple items with varied amounts", () => {
      const po = {
        items: [
          { name: "Item A", quantity: 5, rate: 1000, amount: 5000 },
          { name: "Item B", quantity: 10, rate: 2500, amount: 25000 },
          { name: "Item C", quantity: 2, rate: 7500, amount: 15000 },
          { name: "Item D", quantity: 8, rate: 500, amount: 4000 },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items.length, 4);
      assert.strictEqual(result.calculations.subtotal, 49000);
    });

    test("should preserve item order", () => {
      const po = {
        items: [
          { name: "First", quantity: 1, rate: 100, amount: 100 },
          { name: "Second", quantity: 2, rate: 200, amount: 400 },
          { name: "Third", quantity: 3, rate: 300, amount: 900 },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items[0].name, "First");
      assert.strictEqual(result.items[1].name, "Second");
      assert.strictEqual(result.items[2].name, "Third");
    });
  });

  describe("Edge cases", () => {
    test("should handle null PO input", () => {
      const result = buildPurchaseOrderDocumentStructure(null, {});

      assert.ok(result);
      assert.strictEqual(result.items.length, 0);
      assert.strictEqual(result.calculations.subtotal, 0);
    });

    test("should handle undefined PO input", () => {
      const result = buildPurchaseOrderDocumentStructure(undefined, {});

      assert.ok(result);
      assert.strictEqual(result.items.length, 0);
    });

    test("should handle items with special characters in names", () => {
      const po = {
        items: [
          {
            name: "Item with <tag> & 'quotes'",
            quantity: 10,
            rate: 100,
            amount: 1000,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.items[0].name, "Item with <tag> & 'quotes'");
    });

    test("should handle very large amounts", () => {
      const po = {
        items: [
          {
            name: "Item",
            quantity: 1000000,
            rate: 9999.99,
            amount: 9999990000,
          },
        ],
      };

      const result = buildPurchaseOrderDocumentStructure(po, {});

      assert.strictEqual(result.calculations.subtotal, 9999990000);
    });
  });
});

/**
 * REFACTORING GUIDE FOR poPdfGenerator
 * ====================================
 *
 * Current structure:
 * - generatePurchaseOrderPDF(po, company) - Layer 2
 * - createPOElement(po, company, logoCompany, sealImage, templateColor) - DOM rendering
 *
 * Target structure after refactoring:
 * 1. Create buildPurchaseOrderDocumentStructure(po, company)
 *    - Extract all data transformation from createPOElement ✅ DONE
 *    - Calculate subtotal, VAT, total
 *    - Transform items with specifications
 *    - Return pure data object (no DOM)
 *    - This becomes testable in Node.js
 *
 * 2. Update createPOElement to accept docStructure ✅ DONE
 *    - Change signature to: createPOElement(docStructure, logoUrl, sealUrl, color)
 *    - Use pre-calculated values from docStructure
 *    - Focus on rendering only
 *
 * 3. Update generatePurchaseOrderPDF ✅ DONE
 *    - Call buildPurchaseOrderDocumentStructure first
 *    - Pass structure to createPOElement
 *    - Rest of PDF generation stays the same
 *
 * Expected test coverage:
 * - Layer 1 (Unit): 34 tests (all passing)
 * - Layer 2 (Browser): 8-10 tests (template to be created)
 * - Total: 42-44 tests per generator
 */
