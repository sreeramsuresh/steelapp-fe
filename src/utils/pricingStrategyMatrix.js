/**
 * Category-Based Pricing Strategy Matrix
 * Epic 8: Enforces product category-based pricing strategies
 *
 * Business Rules:
 * - COILS → WEIGHT_BASED (per kg)
 * - SHEETS → AREA_BASED (per m²)
 * - PIPES/TUBES → PIECE_BASED (per unit)
 * - FITTINGS → PIECE_BASED (per unit)
 * - RODS/BARS → WEIGHT_BASED (per kg)
 * - FASTENERS → PIECE_BASED (per box/kg)
 */

/**
 * Product categories
 */
export const PRODUCT_CATEGORIES = {
  COILS: "COILS",
  SHEETS: "SHEETS",
  PIPES: "PIPES",
  TUBES: "TUBES",
  FITTINGS: "FITTINGS",
  RODS: "RODS",
  BARS: "BARS",
  FASTENERS: "FASTENERS",
  ANGLES: "ANGLES",
  CHANNELS: "CHANNELS",
  BEAMS: "BEAMS",
};

/**
 * Pricing unit types
 */
export const PRICING_UNITS = {
  WEIGHT: "WEIGHT", // per kg/MT
  AREA: "AREA", // per m²
  PIECE: "PIECE", // per unit/piece
  LENGTH: "LENGTH", // per meter
};

/**
 * Category to Pricing Unit Mapping Matrix
 * Defines the mandatory pricing unit for each product category
 */
export const CATEGORY_PRICING_MATRIX = {
  [PRODUCT_CATEGORIES.COILS]: PRICING_UNITS.WEIGHT,
  [PRODUCT_CATEGORIES.SHEETS]: PRICING_UNITS.AREA,
  [PRODUCT_CATEGORIES.PIPES]: PRICING_UNITS.PIECE,
  [PRODUCT_CATEGORIES.TUBES]: PRICING_UNITS.PIECE,
  [PRODUCT_CATEGORIES.FITTINGS]: PRICING_UNITS.PIECE,
  [PRODUCT_CATEGORIES.RODS]: PRICING_UNITS.WEIGHT,
  [PRODUCT_CATEGORIES.BARS]: PRICING_UNITS.WEIGHT,
  [PRODUCT_CATEGORIES.FASTENERS]: PRICING_UNITS.PIECE,
  [PRODUCT_CATEGORIES.ANGLES]: PRICING_UNITS.WEIGHT,
  [PRODUCT_CATEGORIES.CHANNELS]: PRICING_UNITS.WEIGHT,
  [PRODUCT_CATEGORIES.BEAMS]: PRICING_UNITS.WEIGHT,
};

/**
 * Pricing unit display labels
 */
export const PRICING_UNIT_LABELS = {
  [PRICING_UNITS.WEIGHT]: "Per Kilogram (KG)",
  [PRICING_UNITS.AREA]: "Per Square Meter (m²)",
  [PRICING_UNITS.PIECE]: "Per Piece/Unit",
  [PRICING_UNITS.LENGTH]: "Per Meter",
};

/**
 * Procurement channels
 */
export const PROCUREMENT_CHANNELS = {
  LOCAL: "LOCAL",
  IMPORTED: "IMPORTED",
};

/**
 * Margin thresholds per procurement channel
 */
export const MARGIN_THRESHOLDS = {
  [PROCUREMENT_CHANNELS.LOCAL]: {
    minimum: 5, // 5% minimum for local products
    warning: 7, // Show amber if < 7%
    good: 8, // Green if >= 8%
  },
  [PROCUREMENT_CHANNELS.IMPORTED]: {
    minimum: 8, // 8% minimum for imported products
    warning: 10, // Show amber if < 10%
    good: 10, // Green if >= 10%
  },
};

/**
 * Get the mandatory pricing unit for a product category
 * @param {string} category - Product category
 * @returns {string|null} Pricing unit or null if invalid category
 */
export function getPricingUnitForCategory(category) {
  if (!category) return null;
  const upperCategory = category.toUpperCase();
  return CATEGORY_PRICING_MATRIX[upperCategory] || null;
}

/**
 * Validate if a pricing unit is compatible with a category
 * @param {string} category - Product category
 * @param {string} pricingUnit - Pricing unit to validate
 * @returns {Object} Validation result with isValid and error message
 */
export function validateCategoryPricingUnit(category, pricingUnit) {
  if (!category) {
    return {
      isValid: false,
      error: "Product category is required",
    };
  }

  if (!pricingUnit) {
    return {
      isValid: false,
      error: "Pricing unit is required",
    };
  }

  const expectedUnit = getPricingUnitForCategory(category);
  if (!expectedUnit) {
    return {
      isValid: false,
      error: `Unknown product category: ${category}`,
    };
  }

  const upperPricingUnit = pricingUnit.toUpperCase();
  if (upperPricingUnit !== expectedUnit) {
    return {
      isValid: false,
      error: `Invalid pricing unit for ${category}. Expected: ${PRICING_UNIT_LABELS[expectedUnit]}`,
      expectedUnit,
    };
  }

  return {
    isValid: true,
    error: null,
    expectedUnit,
  };
}

/**
 * Get margin threshold configuration for a procurement channel
 * @param {string} channel - Procurement channel (LOCAL or IMPORTED)
 * @returns {Object} Margin thresholds
 */
export function getMarginThresholds(channel) {
  const upperChannel = channel?.toUpperCase();
  return (
    MARGIN_THRESHOLDS[upperChannel] ||
    MARGIN_THRESHOLDS[PROCUREMENT_CHANNELS.LOCAL]
  );
}

/**
 * Get margin status color based on margin value and procurement channel
 * @param {number} margin - Margin percentage
 * @param {string} channel - Procurement channel
 * @returns {string} Color status: 'red', 'amber', or 'green'
 */
export function getMarginColor(margin, channel = PROCUREMENT_CHANNELS.LOCAL) {
  const thresholds = getMarginThresholds(channel);
  const marginValue = parseFloat(margin) || 0;

  if (marginValue < thresholds.minimum) {
    return "red";
  }
  if (marginValue < thresholds.warning) {
    return "amber";
  }
  return "green";
}

/**
 * Get margin status message
 * @param {number} margin - Margin percentage
 * @param {string} channel - Procurement channel
 * @returns {string} Status message
 */
export function getMarginStatusMessage(
  margin,
  channel = PROCUREMENT_CHANNELS.LOCAL,
) {
  const thresholds = getMarginThresholds(channel);
  const marginValue = parseFloat(margin) || 0;
  const color = getMarginColor(margin, channel);

  if (color === "red") {
    return `Below ${thresholds.minimum}% minimum for ${channel} products`;
  }
  if (color === "amber") {
    return `Below ${thresholds.warning}% recommended for ${channel} products`;
  }
  return `Good margin for ${channel} products`;
}

/**
 * Auto-suggest pricing unit based on category
 * @param {string} category - Product category
 * @returns {Object} Suggested pricing unit with label and rationale
 */
export function suggestPricingUnit(category) {
  const unit = getPricingUnitForCategory(category);
  if (!unit) {
    return {
      unit: null,
      label: null,
      rationale: "Unknown category",
    };
  }

  const rationale = getCategoryRationale(category, unit);

  return {
    unit,
    label: PRICING_UNIT_LABELS[unit],
    rationale,
  };
}

/**
 * Get rationale for category-pricing unit pairing
 * @param {string} category - Product category
 * @param {string} unit - Pricing unit
 * @returns {string} Business rationale
 */
function getCategoryRationale(category, unit) {
  const rationales = {
    [PRODUCT_CATEGORIES.COILS]:
      "Coils are priced by weight due to variable dimensions",
    [PRODUCT_CATEGORIES.SHEETS]:
      "Sheets are priced by area (m²) for consistent pricing across sizes",
    [PRODUCT_CATEGORIES.PIPES]:
      "Pipes are priced per piece based on standard lengths",
    [PRODUCT_CATEGORIES.TUBES]:
      "Tubes are priced per piece based on standard lengths",
    [PRODUCT_CATEGORIES.FITTINGS]:
      "Fittings are priced per piece as discrete units",
    [PRODUCT_CATEGORIES.RODS]:
      "Rods are priced by weight due to variable lengths",
    [PRODUCT_CATEGORIES.BARS]:
      "Bars are priced by weight due to variable lengths",
    [PRODUCT_CATEGORIES.FASTENERS]: "Fasteners are priced per piece or box",
    [PRODUCT_CATEGORIES.ANGLES]: "Angles are priced by weight",
    [PRODUCT_CATEGORIES.CHANNELS]: "Channels are priced by weight",
    [PRODUCT_CATEGORIES.BEAMS]: "Beams are priced by weight",
  };

  return rationales[category] || `Auto-determined pricing unit: ${unit}`;
}

export default {
  PRODUCT_CATEGORIES,
  PRICING_UNITS,
  CATEGORY_PRICING_MATRIX,
  PRICING_UNIT_LABELS,
  PROCUREMENT_CHANNELS,
  MARGIN_THRESHOLDS,
  getPricingUnitForCategory,
  validateCategoryPricingUnit,
  getMarginThresholds,
  getMarginColor,
  getMarginStatusMessage,
  suggestPricingUnit,
};
