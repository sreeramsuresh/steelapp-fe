import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldTooltips, getFieldTooltip, getAvailableTooltipFields } from "../fieldTooltips.js";

test("fieldTooltips - Constants", async (t) => {
  await t.test("should export fieldTooltips object with customer fields", () => {
    assert.ok(fieldTooltips.customerName);
    assert.ok(fieldTooltips.customerEmail);
    assert.ok(fieldTooltips.customerPhone);
    assert.ok(fieldTooltips.vatNumber);
    assert.ok(fieldTooltips.creditLimit);
    assert.ok(fieldTooltips.paymentTerms);
  });

  await t.test("should export fieldTooltips object with invoice fields", () => {
    assert.ok(fieldTooltips.invoiceDate);
    assert.ok(fieldTooltips.dueDate);
    assert.ok(fieldTooltips.invoiceStatus);
    assert.ok(fieldTooltips.supplyType);
  });

  await t.test("should export fieldTooltips object with product fields", () => {
    assert.ok(fieldTooltips.productName);
    assert.ok(fieldTooltips.unitPrice);
    assert.ok(fieldTooltips.quantity);
  });

  await t.test("should export fieldTooltips object with purchase order fields", () => {
    assert.ok(fieldTooltips.poDate);
    assert.ok(fieldTooltips.supplierName);
    assert.ok(fieldTooltips.expectedDelivery);
  });

  await t.test("should export fieldTooltips object with container fields", () => {
    assert.ok(fieldTooltips.containerNumber);
    assert.ok(fieldTooltips.billOfLading);
    assert.ok(fieldTooltips.customsClearanceStatus);
  });

  await t.test("should export fieldTooltips object with financial fields", () => {
    assert.ok(fieldTooltips.currency);
    assert.ok(fieldTooltips.totalAmount);
    assert.ok(fieldTooltips.discountPercentage);
  });

  await t.test("all field values should be non-empty strings", () => {
    Object.entries(fieldTooltips).forEach(([key, value]) => {
      assert.equal(typeof value, "string", `${key} should be a string`);
      assert.ok(value.length > 0, `${key} should not be empty`);
    });
  });
});

test("getFieldTooltip", async (t) => {
  await t.test("should return tooltip for existing field", () => {
    const tooltip = getFieldTooltip("customerName");
    assert.equal(tooltip, fieldTooltips.customerName);
    assert.ok(tooltip.includes("customer"));
  });

  await t.test("should return empty string for non-existent field", () => {
    const tooltip = getFieldTooltip("nonExistentField");
    assert.equal(tooltip, "");
  });

  await t.test("should handle null gracefully", () => {
    const tooltip = getFieldTooltip(null);
    assert.equal(tooltip, "");
  });

  await t.test("should handle undefined gracefully", () => {
    const tooltip = getFieldTooltip(undefined);
    assert.equal(tooltip, "");
  });

  await t.test("should be case-sensitive", () => {
    const lowerTooltip = getFieldTooltip("customername");
    const upperTooltip = getFieldTooltip("CUSTOMERNAME");
    const properTooltip = getFieldTooltip("customerName");

    assert.equal(lowerTooltip, "");
    assert.equal(upperTooltip, "");
    assert.equal(properTooltip, fieldTooltips.customerName);
  });

  await t.test("should work with all customer-related fields", () => {
    const customerFields = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "vatNumber",
      "creditLimit",
      "paymentTerms",
    ];

    customerFields.forEach((field) => {
      const tooltip = getFieldTooltip(field);
      assert.ok(tooltip.length > 0, `${field} should have a tooltip`);
    });
  });

  await t.test("should work with all invoice-related fields", () => {
    const invoiceFields = ["invoiceDate", "dueDate", "invoiceStatus", "supplyType"];

    invoiceFields.forEach((field) => {
      const tooltip = getFieldTooltip(field);
      assert.ok(tooltip.length > 0, `${field} should have a tooltip`);
    });
  });

  await t.test("should work with all product-related fields", () => {
    const productFields = ["productName", "unitPrice", "quantity"];

    productFields.forEach((field) => {
      const tooltip = getFieldTooltip(field);
      assert.ok(tooltip.length > 0, `${field} should have a tooltip`);
    });
  });
});

test("getAvailableTooltipFields", async (t) => {
  await t.test("should return array of all field names", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(Array.isArray(fields));
    assert.ok(fields.length > 0);
  });

  await t.test("should return same number of fields as fieldTooltips keys", () => {
    const fields = getAvailableTooltipFields();
    const expectedCount = Object.keys(fieldTooltips).length;
    assert.equal(fields.length, expectedCount);
  });

  await t.test("should contain all expected customer fields", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(fields.includes("customerName"));
    assert.ok(fields.includes("customerEmail"));
    assert.ok(fields.includes("customerPhone"));
    assert.ok(fields.includes("vatNumber"));
    assert.ok(fields.includes("creditLimit"));
    assert.ok(fields.includes("paymentTerms"));
  });

  await t.test("should contain all expected invoice fields", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(fields.includes("invoiceDate"));
    assert.ok(fields.includes("dueDate"));
    assert.ok(fields.includes("invoiceStatus"));
    assert.ok(fields.includes("supplyType"));
  });

  await t.test("should contain all expected product fields", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(fields.includes("productName"));
    assert.ok(fields.includes("unitPrice"));
    assert.ok(fields.includes("quantity"));
  });

  await t.test("should contain all expected purchase order fields", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(fields.includes("poDate"));
    assert.ok(fields.includes("supplierName"));
    assert.ok(fields.includes("expectedDelivery"));
  });

  await t.test("should contain all expected container fields", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(fields.includes("containerNumber"));
    assert.ok(fields.includes("billOfLading"));
    assert.ok(fields.includes("customsClearanceStatus"));
  });

  await t.test("should contain all expected financial fields", () => {
    const fields = getAvailableTooltipFields();
    assert.ok(fields.includes("currency"));
    assert.ok(fields.includes("totalAmount"));
    assert.ok(fields.includes("discountPercentage"));
  });

  await t.test("should return unique field names", () => {
    const fields = getAvailableTooltipFields();
    const uniqueFields = new Set(fields);
    assert.equal(fields.length, uniqueFields.size);
  });

  await t.test("should return fields in consistent order", () => {
    const fields1 = getAvailableTooltipFields();
    const fields2 = getAvailableTooltipFields();
    assert.deepEqual(fields1, fields2);
  });

  await t.test("all returned field names should have corresponding tooltips", () => {
    const fields = getAvailableTooltipFields();
    fields.forEach((field) => {
      const tooltip = getFieldTooltip(field);
      assert.ok(tooltip.length > 0, `${field} should have a non-empty tooltip`);
    });
  });
});
