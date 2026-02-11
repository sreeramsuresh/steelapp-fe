/**
 * Unit Tests: Frontend Pricing Basis Rules Utility
 *
 * Tests the shared constants and helpers in pricingBasisRules.js.
 * No API or DB required — pure function tests.
 */

import { describe, expect, it } from "vitest";
import {
  ALL_PRICING_BASES,
  ALLOWED_PRICING_BASIS,
  DEFAULT_PRICING_BASIS,
  getAllowedBases,
  getBasisLabel,
  getDefaultBasis,
  PRICING_BASIS_LABELS,
  requiresWeight,
} from "../pricingBasisRules";

describe("getAllowedBases", () => {
  it("returns [PER_MT] for COIL", () => {
    expect(getAllowedBases("COIL")).toEqual(["PER_MT"]);
  });

  it("returns [PER_PCS] for SHEET", () => {
    expect(getAllowedBases("SHEET")).toEqual(["PER_PCS"]);
  });

  it("returns [PER_MT, PER_PCS] for PLATE", () => {
    expect(getAllowedBases("PLATE")).toEqual(["PER_MT", "PER_PCS"]);
  });

  it("handles case-insensitive input (pipe → PIPE)", () => {
    expect(getAllowedBases("pipe")).toEqual(["PER_PCS", "PER_METER"]);
  });

  it("returns all bases for null category", () => {
    expect(getAllowedBases(null)).toEqual(ALL_PRICING_BASES);
  });

  it("returns all bases for unknown category", () => {
    expect(getAllowedBases("UNKNOWN")).toEqual(ALL_PRICING_BASES);
  });

  it("returns [PER_KG, PER_PCS] for BAR", () => {
    expect(getAllowedBases("BAR")).toEqual(["PER_KG", "PER_PCS"]);
  });
});

describe("getDefaultBasis", () => {
  it("returns PER_PCS for SHEET", () => {
    expect(getDefaultBasis("SHEET")).toBe("PER_PCS");
  });

  it("returns PER_KG for BAR", () => {
    expect(getDefaultBasis("BAR")).toBe("PER_KG");
  });

  it("returns PER_MT for null (fallback)", () => {
    expect(getDefaultBasis(null)).toBe("PER_MT");
  });

  it("returns PER_MT for unknown category (fallback)", () => {
    expect(getDefaultBasis("UNKNOWN")).toBe("PER_MT");
  });

  it("handles case-insensitive input", () => {
    expect(getDefaultBasis("coil")).toBe("PER_MT");
  });
});

describe("requiresWeight", () => {
  it("returns true for PER_MT", () => {
    expect(requiresWeight("PER_MT")).toBe(true);
  });

  it("returns true for PER_KG", () => {
    expect(requiresWeight("PER_KG")).toBe(true);
  });

  it("returns false for PER_PCS", () => {
    expect(requiresWeight("PER_PCS")).toBe(false);
  });

  it("returns false for PER_METER", () => {
    expect(requiresWeight("PER_METER")).toBe(false);
  });

  it("returns false for PER_LOT", () => {
    expect(requiresWeight("PER_LOT")).toBe(false);
  });
});

describe("getBasisLabel", () => {
  it('returns "per PC" for PER_PCS', () => {
    expect(getBasisLabel("PER_PCS")).toBe("per PC");
  });

  it('returns "per MT" for PER_MT', () => {
    expect(getBasisLabel("PER_MT")).toBe("per MT");
  });

  it('returns "per Meter" for PER_METER', () => {
    expect(getBasisLabel("PER_METER")).toBe("per Meter");
  });

  it("returns the raw value for unknown basis", () => {
    expect(getBasisLabel("CUSTOM")).toBe("CUSTOM");
  });
});

describe("Constants consistency", () => {
  it("ALL_PRICING_BASES has 5 entries", () => {
    expect(ALL_PRICING_BASES).toHaveLength(5);
  });

  it("PRICING_BASIS_LABELS covers all bases", () => {
    for (const basis of ALL_PRICING_BASES) {
      expect(PRICING_BASIS_LABELS).toHaveProperty(basis);
    }
  });

  it("every default is within the allowed set", () => {
    for (const [category, defaultBasis] of Object.entries(DEFAULT_PRICING_BASIS)) {
      const allowed = ALLOWED_PRICING_BASIS[category];
      expect(allowed).toBeDefined();
      expect(allowed).toContain(defaultBasis);
    }
  });

  it("frontend ALLOWED_PRICING_BASIS matches expected backend values", () => {
    // These must stay in sync with productLocalService.js
    expect(ALLOWED_PRICING_BASIS.COIL).toEqual(["PER_MT"]);
    expect(ALLOWED_PRICING_BASIS.SHEET).toEqual(["PER_PCS"]);
    expect(ALLOWED_PRICING_BASIS.PLATE).toEqual(["PER_MT", "PER_PCS"]);
    expect(ALLOWED_PRICING_BASIS.PIPE).toEqual(["PER_PCS", "PER_METER"]);
    expect(ALLOWED_PRICING_BASIS.BAR).toEqual(["PER_KG", "PER_PCS"]);
  });
});
