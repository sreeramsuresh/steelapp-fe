import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSsotPattern,
  parseSsotName,
  generateSsotName,
  getSsotErrorMessage,
  needsSsotMigration,
} from "../productSsotValidation.js";
import ssotModule from "../productSsotValidation.js";

const { VALID_GRADES, VALID_FORMS, VALID_FINISHES } = ssotModule;

test("SSOT Constants", async (t) => {
  await t.test("should have valid grades", () => {
    assert.ok(VALID_GRADES.includes("304"));
    assert.ok(VALID_GRADES.includes("316L"));
    assert.ok(VALID_GRADES.length > 0);
  });

  await t.test("should have valid forms", () => {
    assert.ok(VALID_FORMS.includes("SHEET"));
    assert.ok(VALID_FORMS.includes("COIL"));
    assert.ok(VALID_FORMS.includes("PIPE"));
    assert.ok(VALID_FORMS.length > 0);
  });

  await t.test("should have valid finishes", () => {
    assert.ok(VALID_FINISHES.includes("2B"));
    assert.ok(VALID_FINISHES.includes("BA"));
    assert.ok(VALID_FINISHES.length > 0);
  });
});

test("validateSsotPattern", async (t) => {
  await t.test("should validate correct SSOT pattern", () => {
    const result = validateSsotPattern("SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(result.isValid, true);
    assert.equal(result.error, null);
  });

  await t.test("should accept COIL length designation", () => {
    const result = validateSsotPattern("SS-304-COIL-2B-1250mm-2.0mm-COIL");
    assert.equal(result.isValid, true);
  });

  await t.test("should reject missing SS prefix", () => {
    const result = validateSsotPattern("304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes("SS-"));
  });

  await t.test("should reject invalid pattern", () => {
    const result = validateSsotPattern("SS-304-SHEET-2B-invalid");
    assert.equal(result.isValid, false);
  });

  await t.test("should reject invalid grade", () => {
    const result = validateSsotPattern("SS-999-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes("grade"));
  });

  await t.test("should reject invalid form", () => {
    const result = validateSsotPattern("SS-304-INVALID-2B-1250mm-2.0mm-2500mm");
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes("form"));
  });

  await t.test("should reject invalid finish", () => {
    const result = validateSsotPattern("SS-304-SHEET-INVALID-1250mm-2.0mm-2500mm");
    assert.equal(result.isValid, false);
    assert.ok(result.error.includes("finish"));
  });

  await t.test("should require uppercase SS prefix", () => {
    const result = validateSsotPattern("ss-304-sheet-2b-1250mm-2.0mm-2500mm");
    assert.equal(result.isValid, false);
  });

  await t.test("should reject null/undefined", () => {
    const result1 = validateSsotPattern(null);
    const result2 = validateSsotPattern(undefined);
    assert.equal(result1.isValid, false);
    assert.equal(result2.isValid, false);
  });

  await t.test("should reject empty string", () => {
    const result = validateSsotPattern("");
    assert.equal(result.isValid, false);
  });

  await t.test("should accept decimal thickness", () => {
    const result = validateSsotPattern("SS-304-SHEET-2B-1250mm-2.5mm-2500mm");
    assert.equal(result.isValid, true);
  });

  await t.test("should not accept decimal width (only thickness allows decimals)", () => {
    const result = validateSsotPattern("SS-304-SHEET-2B-1250.5mm-2.0mm-2500mm");
    assert.equal(result.isValid, false);
  });

  await t.test("should include pattern in response", () => {
    const result = validateSsotPattern("invalid");
    assert.ok(result.pattern);
    assert.ok(result.pattern.includes("SS-"));
  });

  await t.test("should include example in error response", () => {
    const result = validateSsotPattern("invalid");
    assert.ok(result.example || result.pattern);
  });
});

test("parseSsotName", async (t) => {
  await t.test("should parse valid SSOT name", () => {
    const parsed = parseSsotName("SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.ok(parsed);
    assert.equal(parsed.grade, "304");
    assert.equal(parsed.form, "SHEET");
    assert.equal(parsed.finish, "2B");
    assert.equal(parsed.width, 1250);
    assert.equal(parsed.thickness, 2.0);
    assert.equal(parsed.length, 2500);
  });

  await t.test("should parse COIL length", () => {
    const parsed = parseSsotName("SS-304-COIL-2B-1250mm-2.0mm-COIL");
    assert.ok(parsed);
    assert.equal(parsed.length, "COIL");
  });

  await t.test("should parse decimal thickness only", () => {
    const parsed = parseSsotName("SS-316L-SHEET-BA-1000mm-0.8mm-3000mm");
    assert.ok(parsed);
    assert.equal(parsed.width, 1000);
    assert.equal(parsed.thickness, 0.8);
    assert.equal(parsed.length, 3000);
  });

  await t.test("should include prefix in parsed result", () => {
    const parsed = parseSsotName("SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(parsed.prefix, "SS");
  });

  await t.test("should include raw value in parsed result", () => {
    const parsed = parseSsotName("SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(parsed.raw, "SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
  });

  await t.test("should return null for invalid SSOT name", () => {
    const parsed = parseSsotName("SS-999-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(parsed, null);
  });

  await t.test("should return null for null/undefined", () => {
    const parsed1 = parseSsotName(null);
    const parsed2 = parseSsotName(undefined);
    assert.equal(parsed1, null);
    assert.equal(parsed2, null);
  });

  await t.test("should require uppercase SS prefix in parsing", () => {
    const parsed = parseSsotName("ss-304-sheet-2b-1250mm-2.0mm-2500mm");
    assert.equal(parsed, null);
  });
});

test("generateSsotName", async (t) => {
  await t.test("should generate valid SSOT name", () => {
    const name = generateSsotName({
      grade: "304",
      form: "SHEET",
      finish: "2B",
      width: 1250,
      thickness: 2.0,
      length: 2500,
    });
    assert.ok(name.includes("SS-304-SHEET-2B-1250mm") && name.includes("mm-2500mm"));
  });

  await t.test("should generate COIL designations", () => {
    const name = generateSsotName({
      grade: "304",
      form: "COIL",
      finish: "BA",
      width: 1000,
      thickness: 0.8,
      length: "COIL",
    });
    assert.equal(name, "SS-304-COIL-BA-1000mm-0.8mm-COIL");
  });

  await t.test("should handle lowercase component values", () => {
    const name = generateSsotName({
      grade: "304",
      form: "sheet",
      finish: "2b",
      width: 1250,
      thickness: 2.0,
      length: 2500,
    });
    assert.ok(name.includes("SS-304-SHEET-2B"));
  });

  await t.test("should throw for missing grade", () => {
    assert.throws(() => {
      generateSsotName({
        form: "SHEET",
        finish: "2B",
        width: 1250,
        thickness: 2.0,
        length: 2500,
      });
    });
  });

  await t.test("should throw for missing form", () => {
    assert.throws(() => {
      generateSsotName({
        grade: "304",
        finish: "2B",
        width: 1250,
        thickness: 2.0,
        length: 2500,
      });
    });
  });

  await t.test("should throw for missing finish", () => {
    assert.throws(() => {
      generateSsotName({
        grade: "304",
        form: "SHEET",
        width: 1250,
        thickness: 2.0,
        length: 2500,
      });
    });
  });

  await t.test("should throw for missing width", () => {
    assert.throws(() => {
      generateSsotName({
        grade: "304",
        form: "SHEET",
        finish: "2B",
        thickness: 2.0,
        length: 2500,
      });
    });
  });

  await t.test("should throw for missing thickness", () => {
    assert.throws(() => {
      generateSsotName({
        grade: "304",
        form: "SHEET",
        finish: "2B",
        width: 1250,
        length: 2500,
      });
    });
  });

  await t.test("should throw for missing length", () => {
    assert.throws(() => {
      generateSsotName({
        grade: "304",
        form: "SHEET",
        finish: "2B",
        width: 1250,
        thickness: 2.0,
      });
    });
  });

  await t.test("should generate names that pass validation", () => {
    const name = generateSsotName({
      grade: "316L",
      form: "PIPE",
      finish: "BA",
      width: 25,
      thickness: 1.5,
      length: 6000,
    });
    const validation = validateSsotPattern(name);
    assert.equal(validation.isValid, true);
  });
});

test("getSsotErrorMessage", async (t) => {
  await t.test("should return empty string for valid SSOT name", () => {
    const message = getSsotErrorMessage("SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(message, "");
  });

  await t.test("should return error message for invalid pattern", () => {
    const message = getSsotErrorMessage("INVALID");
    assert.ok(message.length > 0);
    assert.ok(message.includes("pattern") || message.includes("expected"));
  });

  await t.test("should include pattern in error message", () => {
    const message = getSsotErrorMessage("INVALID");
    assert.ok(message.includes("SS-"));
  });

  await t.test("should include example in error message", () => {
    const message = getSsotErrorMessage("INVALID");
    assert.ok(message.includes("SS-304-SHEET-2B-1250mm-2.0mm-2500mm"));
  });

  await t.test("should handle null/undefined gracefully", () => {
    const message1 = getSsotErrorMessage(null);
    const message2 = getSsotErrorMessage(undefined);
    assert.ok(message1.length > 0);
    assert.ok(message2.length > 0);
  });
});

test("needsSsotMigration", async (t) => {
  await t.test("should return false for valid SSOT name", () => {
    const needs = needsSsotMigration("SS-304-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(needs, false);
  });

  await t.test("should return true for legacy name format", () => {
    const needs = needsSsotMigration("Stainless Steel 304 Sheet");
    assert.equal(needs, true);
  });

  await t.test("should return true for partial SSOT name", () => {
    const needs = needsSsotMigration("SS-304-SHEET");
    assert.equal(needs, true);
  });

  await t.test("should return false for null/undefined (falsy values short-circuit)", () => {
    const needs1 = needsSsotMigration(null);
    const needs2 = needsSsotMigration(undefined);
    assert.equal(needs1, false);
    assert.equal(needs2, false);
  });

  await t.test("should return false for empty string (falsy values short-circuit)", () => {
    const needs = needsSsotMigration("");
    assert.equal(needs, false);
  });

  await t.test("should return true for invalid grade", () => {
    const needs = needsSsotMigration("SS-999-SHEET-2B-1250mm-2.0mm-2500mm");
    assert.equal(needs, true);
  });
});
