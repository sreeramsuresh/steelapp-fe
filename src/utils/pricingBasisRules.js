/**
 * Pricing Basis Rules - Shared constants and helpers
 *
 * Enforces correct pricing basis by product category per industry standards:
 * - COIL  → PER_MT only
 * - SHEET → PER_PCS only
 * - PLATE → PER_MT or PER_PCS
 * - PIPE/TUBE → PER_PCS or PER_METER
 * - BAR   → PER_KG or PER_PCS
 * - FLAT  → PER_KG or PER_PCS
 */

export const ALLOWED_PRICING_BASIS = {
  COIL: ["PER_MT"],
  SHEET: ["PER_PCS"],
  PLATE: ["PER_MT", "PER_PCS"],
  PIPE: ["PER_PCS", "PER_METER"],
  TUBE: ["PER_PCS", "PER_METER"],
  BAR: ["PER_KG", "PER_PCS"],
  FLAT: ["PER_KG", "PER_PCS"],
};

export const DEFAULT_PRICING_BASIS = {
  COIL: "PER_MT",
  SHEET: "PER_PCS",
  PLATE: "PER_MT",
  PIPE: "PER_PCS",
  TUBE: "PER_PCS",
  BAR: "PER_KG",
  FLAT: "PER_KG",
};

export const PRICING_BASIS_LABELS = {
  PER_PCS: "per pc",
  PER_KG: "per pc",
  PER_MT: "per pc",
  PER_METER: "per pc",
  PER_LOT: "per pc",
};

/** Internal labels showing actual storage basis (for admin/debug use only) */
export const PRICING_BASIS_LABELS_INTERNAL = {
  PER_PCS: "per PC",
  PER_KG: "per KG",
  PER_MT: "per MT",
  PER_METER: "per Meter",
  PER_LOT: "per Lot",
};

export const ALL_PRICING_BASES = ["PER_PCS", "PER_KG", "PER_MT", "PER_METER", "PER_LOT"];

/**
 * Get allowed pricing bases for a product category.
 * Returns all bases if category is unknown/null.
 */
export function getAllowedBases(category) {
  if (!category) return ALL_PRICING_BASES;
  return ALLOWED_PRICING_BASIS[category.toUpperCase()] || ALL_PRICING_BASES;
}

/**
 * Get default pricing basis for a product category.
 * Falls back to PER_MT if category is unknown/null.
 */
export function getDefaultBasis(category) {
  if (!category) return "PER_MT";
  return DEFAULT_PRICING_BASIS[category.toUpperCase()] || "PER_MT";
}

/**
 * Check if a pricing basis requires unit_weight_kg for calculations.
 * Weight-based pricing (PER_MT, PER_KG) needs weight data.
 */
export function requiresWeight(basis) {
  return basis === "PER_MT" || basis === "PER_KG";
}

/**
 * Get display label for a pricing basis value.
 */
export function getBasisLabel(basis) {
  return PRICING_BASIS_LABELS[basis] || basis;
}

/**
 * Category-specific microcopy for UI tooltips/help text.
 */
export const PRICING_BASIS_MICROCOPY = {
  SHEET: "Stocked and sold as pieces. Weight is for reporting.",
  SHEET_PURCHASE: "Enter price per piece as on vendor invoice.",
  LOCKED: "Pricing basis locked after transactions. Create new SKU to change.",
};
