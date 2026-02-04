import { test } from "node:test";
import assert from "node:assert/strict";
import { assertProductDomain, hasContractViolation, getContractErrors } from "../productContract.js";

test("assertProductDomain", async (t) => {
  await t.test("should accept valid product object", () => {
    const validProduct = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: 2.5,
      piecesPerMt: 400,
      primaryUom: "PCS",
    };
    assert.doesNotThrow(() => {
      assertProductDomain(validProduct);
    });
  });

  await t.test("should accept product with optional fields as null", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: null,
      piecesPerMt: null,
      primaryUom: null,
    };
    assert.doesNotThrow(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should accept product with optional fields undefined", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: undefined,
      piecesPerMt: undefined,
      primaryUom: undefined,
    };
    assert.doesNotThrow(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should accept product with minimal fields", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
    };
    assert.doesNotThrow(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product without id", () => {
    const product = {
      name: "SS-304-SHEET",
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product without name", () => {
    const product = {
      id: 1,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with empty string name", () => {
    const product = {
      id: 1,
      name: "",
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with invalid unitWeightKg type", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: "invalid",
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with negative unitWeightKg", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: -5,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with invalid piecesPerMt type", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      piecesPerMt: "invalid",
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with non-positive piecesPerMt", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      piecesPerMt: 0,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with snake_case keys (normalization leak)", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unit_weight_kg: 2.5,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with pricing_basis snake_case key", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      pricing_basis: "PER_MT",
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with multiple snake_case keys", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unit_weight_kg: 2.5,
      pieces_per_mt: 400,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject null product", () => {
    assert.throws(() => {
      assertProductDomain(null);
    });
  });

  await t.test("should reject undefined product", () => {
    assert.throws(() => {
      assertProductDomain(undefined);
    });
  });

  await t.test("should reject non-object product", () => {
    assert.throws(() => {
      assertProductDomain("not an object");
    });
    assert.throws(() => {
      assertProductDomain(123);
    });
    assert.throws(() => {
      assertProductDomain([]);
    });
  });

  await t.test("should accept product with additional camelCase fields", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      displayName: "Stainless Steel 304 Sheet",
      category: "SHEETS",
    };
    assert.doesNotThrow(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with NaN unitWeightKg", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: NaN,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });

  await t.test("should reject product with Infinity unitWeightKg", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      unitWeightKg: Infinity,
    };
    assert.throws(() => {
      assertProductDomain(product);
    });
  });
});

test("hasContractViolation", async (t) => {
  await t.test("should return false for valid product", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
    };
    const violation = hasContractViolation(product);
    assert.equal(violation, false);
  });

  await t.test("should return true for product with _contractViolation flag", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      _contractViolation: true,
    };
    const violation = hasContractViolation(product);
    assert.equal(violation, true);
  });

  await t.test("should return false for product with _contractViolation false", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      _contractViolation: false,
    };
    const violation = hasContractViolation(product);
    assert.equal(violation, false);
  });

  await t.test("should return false for null/undefined", () => {
    assert.equal(hasContractViolation(null), false);
    assert.equal(hasContractViolation(undefined), false);
  });
});

test("getContractErrors", async (t) => {
  await t.test("should return empty array for product without errors", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
    };
    const errors = getContractErrors(product);
    assert.deepEqual(errors, []);
  });

  await t.test("should return errors from _contractErrors", () => {
    const errors = ["Error 1", "Error 2"];
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      _contractErrors: errors,
    };
    const result = getContractErrors(product);
    assert.deepEqual(result, errors);
  });

  await t.test("should return empty array for null/undefined", () => {
    assert.deepEqual(getContractErrors(null), []);
    assert.deepEqual(getContractErrors(undefined), []);
  });

  await t.test("should return empty array for product with undefined _contractErrors", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      _contractErrors: undefined,
    };
    const errors = getContractErrors(product);
    assert.deepEqual(errors, []);
  });

  await t.test("should return empty array for product with null _contractErrors", () => {
    const product = {
      id: 1,
      name: "SS-304-SHEET",
      _contractErrors: null,
    };
    const errors = getContractErrors(product);
    assert.deepEqual(errors, []);
  });
});
