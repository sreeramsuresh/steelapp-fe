import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PROCUREMENT_CHANNELS,
  MARGIN_THRESHOLDS,
  getMarginThresholds,
  getMarginColor,
  getMarginStatusMessage,
  PRODUCT_CATEGORIES,
  PRICING_UNITS,
  CATEGORY_PRICING_MATRIX,
  PRICING_UNIT_LABELS,
  getPricingUnitForCategory,
  validateCategoryPricingUnit,
} from "../pricingStrategyMatrix.js";

test("PROCUREMENT_CHANNELS", async (t) => {
  await t.test("should have LOCAL channel", () => {
    assert.equal(PROCUREMENT_CHANNELS.LOCAL, "LOCAL");
  });

  await t.test("should have IMPORTED channel", () => {
    assert.equal(PROCUREMENT_CHANNELS.IMPORTED, "IMPORTED");
  });

  await t.test("should have exactly 2 channels", () => {
    assert.equal(Object.keys(PROCUREMENT_CHANNELS).length, 2);
  });
});

test("MARGIN_THRESHOLDS", async (t) => {
  await t.test("should have thresholds for LOCAL channel", () => {
    assert.ok(MARGIN_THRESHOLDS[PROCUREMENT_CHANNELS.LOCAL]);
    assert.equal(MARGIN_THRESHOLDS.LOCAL.minimum, 5);
    assert.equal(MARGIN_THRESHOLDS.LOCAL.warning, 7);
    assert.equal(MARGIN_THRESHOLDS.LOCAL.good, 8);
  });

  await t.test("should have thresholds for IMPORTED channel", () => {
    assert.ok(MARGIN_THRESHOLDS[PROCUREMENT_CHANNELS.IMPORTED]);
    assert.equal(MARGIN_THRESHOLDS.IMPORTED.minimum, 8);
    assert.equal(MARGIN_THRESHOLDS.IMPORTED.warning, 10);
    assert.equal(MARGIN_THRESHOLDS.IMPORTED.good, 10);
  });

  await t.test("should have increasing threshold values for LOCAL", () => {
    const local = MARGIN_THRESHOLDS.LOCAL;
    assert.ok(local.minimum < local.warning);
    assert.ok(local.warning <= local.good);
  });

  await t.test("should have increasing threshold values for IMPORTED", () => {
    const imported = MARGIN_THRESHOLDS.IMPORTED;
    assert.ok(imported.minimum < imported.warning);
    assert.ok(imported.warning <= imported.good);
  });
});

test("getMarginThresholds", async (t) => {
  await t.test("should return LOCAL thresholds for LOCAL channel", () => {
    const thresholds = getMarginThresholds("LOCAL");
    assert.equal(thresholds.minimum, 5);
    assert.equal(thresholds.warning, 7);
    assert.equal(thresholds.good, 8);
  });

  await t.test("should return IMPORTED thresholds for IMPORTED channel", () => {
    const thresholds = getMarginThresholds("IMPORTED");
    assert.equal(thresholds.minimum, 8);
    assert.equal(thresholds.warning, 10);
    assert.equal(thresholds.good, 10);
  });

  await t.test("should handle lowercase channel names", () => {
    const thresholds = getMarginThresholds("local");
    assert.equal(thresholds.minimum, 5);
  });

  await t.test("should default to LOCAL for invalid channel", () => {
    const thresholds = getMarginThresholds("INVALID");
    assert.equal(thresholds.minimum, 5);
  });

  await t.test("should handle null/undefined by defaulting to LOCAL", () => {
    const thresholds1 = getMarginThresholds(null);
    const thresholds2 = getMarginThresholds(undefined);
    assert.equal(thresholds1.minimum, 5);
    assert.equal(thresholds2.minimum, 5);
  });
});

test("getMarginColor", async (t) => {
  await t.test("should return red for below minimum LOCAL", () => {
    const color = getMarginColor(3, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "red");
  });

  await t.test("should return amber for between minimum and warning LOCAL", () => {
    const color = getMarginColor(6, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "amber");
  });

  await t.test("should return green for at or above warning LOCAL", () => {
    const color = getMarginColor(8, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "green");
  });

  await t.test("should return red for below minimum IMPORTED", () => {
    const color = getMarginColor(5, PROCUREMENT_CHANNELS.IMPORTED);
    assert.equal(color, "red");
  });

  await t.test("should return amber for between minimum and warning IMPORTED", () => {
    const color = getMarginColor(9, PROCUREMENT_CHANNELS.IMPORTED);
    assert.equal(color, "amber");
  });

  await t.test("should return green for at or above warning IMPORTED", () => {
    const color = getMarginColor(10, PROCUREMENT_CHANNELS.IMPORTED);
    assert.equal(color, "green");
  });

  await t.test("should handle zero margin", () => {
    const color = getMarginColor(0, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "red");
  });

  await t.test("should handle negative margin", () => {
    const color = getMarginColor(-5, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "red");
  });

  await t.test("should handle string margin values", () => {
    const color = getMarginColor("6", PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "amber");
  });

  await t.test("should default to LOCAL channel", () => {
    const color1 = getMarginColor(6);
    const color2 = getMarginColor(6, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color1, color2);
  });

  await t.test("should handle very high margins", () => {
    const color = getMarginColor(100, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(color, "green");
  });
});

test("getMarginStatusMessage", async (t) => {
  await t.test("should return appropriate message for red status LOCAL", () => {
    const message = getMarginStatusMessage(3, PROCUREMENT_CHANNELS.LOCAL);
    assert.ok(message.includes("Below"));
    assert.ok(message.includes("5%"));
    assert.ok(message.includes("minimum"));
  });

  await t.test("should return appropriate message for amber status LOCAL", () => {
    const message = getMarginStatusMessage(6, PROCUREMENT_CHANNELS.LOCAL);
    assert.ok(message.includes("Below"));
    assert.ok(message.includes("7%"));
    assert.ok(message.includes("recommended"));
  });

  await t.test("should return appropriate message for green status LOCAL", () => {
    const message = getMarginStatusMessage(8, PROCUREMENT_CHANNELS.LOCAL);
    assert.ok(message.includes("Good margin"));
    assert.ok(message.includes("LOCAL"));
  });

  await t.test("should return appropriate message for red status IMPORTED", () => {
    const message = getMarginStatusMessage(5, PROCUREMENT_CHANNELS.IMPORTED);
    assert.ok(message.includes("Below"));
    assert.ok(message.includes("8%"));
    assert.ok(message.includes("minimum"));
  });

  await t.test("should return appropriate message for amber status IMPORTED", () => {
    const message = getMarginStatusMessage(9, PROCUREMENT_CHANNELS.IMPORTED);
    assert.ok(message.includes("Below"));
    assert.ok(message.includes("10%"));
    assert.ok(message.includes("recommended"));
  });

  await t.test("should return appropriate message for green status IMPORTED", () => {
    const message = getMarginStatusMessage(10, PROCUREMENT_CHANNELS.IMPORTED);
    assert.ok(message.includes("Good margin"));
    assert.ok(message.includes("IMPORTED"));
  });

  await t.test("should default to LOCAL channel", () => {
    const message1 = getMarginStatusMessage(6);
    const message2 = getMarginStatusMessage(6, PROCUREMENT_CHANNELS.LOCAL);
    assert.equal(message1, message2);
  });
});

test("PRODUCT_CATEGORIES - Deprecated", async (t) => {
  await t.test("should have COILS category", () => {
    assert.equal(PRODUCT_CATEGORIES.COILS, "COILS");
  });

  await t.test("should have SHEETS category", () => {
    assert.equal(PRODUCT_CATEGORIES.SHEETS, "SHEETS");
  });

  await t.test("should have all expected categories", () => {
    const expected = [
      "COILS",
      "SHEETS",
      "PIPES",
      "TUBES",
      "FITTINGS",
      "RODS",
      "BARS",
      "FASTENERS",
      "ANGLES",
      "CHANNELS",
      "BEAMS",
    ];
    const actual = Object.values(PRODUCT_CATEGORIES);
    expected.forEach((cat) => {
      assert.ok(actual.includes(cat));
    });
  });
});

test("PRICING_UNITS - Deprecated", async (t) => {
  await t.test("should have WEIGHT unit", () => {
    assert.equal(PRICING_UNITS.WEIGHT, "WEIGHT");
  });

  await t.test("should have AREA unit", () => {
    assert.equal(PRICING_UNITS.AREA, "AREA");
  });

  await t.test("should have PIECE unit", () => {
    assert.equal(PRICING_UNITS.PIECE, "PIECE");
  });

  await t.test("should have LENGTH unit", () => {
    assert.equal(PRICING_UNITS.LENGTH, "LENGTH");
  });
});

test("CATEGORY_PRICING_MATRIX - Deprecated", async (t) => {
  await t.test("should map COILS to WEIGHT", () => {
    assert.equal(CATEGORY_PRICING_MATRIX[PRODUCT_CATEGORIES.COILS], PRICING_UNITS.WEIGHT);
  });

  await t.test("should map SHEETS to AREA", () => {
    assert.equal(CATEGORY_PRICING_MATRIX[PRODUCT_CATEGORIES.SHEETS], PRICING_UNITS.AREA);
  });

  await t.test("should map PIPES to PIECE", () => {
    assert.equal(CATEGORY_PRICING_MATRIX[PRODUCT_CATEGORIES.PIPES], PRICING_UNITS.PIECE);
  });

  await t.test("should have mappings for all categories", () => {
    Object.values(PRODUCT_CATEGORIES).forEach((category) => {
      assert.ok(CATEGORY_PRICING_MATRIX[category], `Category ${category} should have a mapping`);
    });
  });
});

test("getPricingUnitForCategory - Deprecated", async (t) => {
  await t.test("should return WEIGHT for COILS", () => {
    const unit = getPricingUnitForCategory("COILS");
    assert.equal(unit, PRICING_UNITS.WEIGHT);
  });

  await t.test("should return AREA for SHEETS", () => {
    const unit = getPricingUnitForCategory("SHEETS");
    assert.equal(unit, PRICING_UNITS.AREA);
  });

  await t.test("should handle lowercase category names", () => {
    const unit = getPricingUnitForCategory("coils");
    assert.equal(unit, PRICING_UNITS.WEIGHT);
  });

  await t.test("should return null for invalid category", () => {
    const unit = getPricingUnitForCategory("INVALID");
    assert.equal(unit, null);
  });

  await t.test("should return null for null/undefined", () => {
    const unit1 = getPricingUnitForCategory(null);
    const unit2 = getPricingUnitForCategory(undefined);
    assert.equal(unit1, null);
    assert.equal(unit2, null);
  });
});

test("validateCategoryPricingUnit - Deprecated", async (t) => {
  await t.test("should validate COILS with WEIGHT", () => {
    const result = validateCategoryPricingUnit("COILS", PRICING_UNITS.WEIGHT);
    assert.equal(result.isValid, true);
    assert.equal(result.error, null);
  });

  await t.test("should reject COILS with AREA", () => {
    const result = validateCategoryPricingUnit("COILS", PRICING_UNITS.AREA);
    assert.equal(result.isValid, false);
    assert.ok(result.error);
  });

  await t.test("should handle missing category", () => {
    const result = validateCategoryPricingUnit(null, PRICING_UNITS.WEIGHT);
    assert.equal(result.isValid, false);
    assert.ok(result.error);
  });

  await t.test("should handle missing pricing unit", () => {
    const result = validateCategoryPricingUnit("COILS", null);
    assert.equal(result.isValid, false);
    assert.ok(result.error);
  });

  await t.test("should handle invalid category", () => {
    const result = validateCategoryPricingUnit("INVALID", PRICING_UNITS.WEIGHT);
    assert.equal(result.isValid, false);
    assert.ok(result.error);
  });

  await t.test("should be case-insensitive for pricing unit", () => {
    const result1 = validateCategoryPricingUnit("COILS", "weight");
    const result2 = validateCategoryPricingUnit("COILS", PRICING_UNITS.WEIGHT);
    assert.equal(result1.isValid, result2.isValid);
  });

  await t.test("should return expected unit in result", () => {
    const result = validateCategoryPricingUnit("COILS", PRICING_UNITS.WEIGHT);
    assert.equal(result.expectedUnit, PRICING_UNITS.WEIGHT);
  });
});
