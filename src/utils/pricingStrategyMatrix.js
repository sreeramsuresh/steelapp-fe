/**
 * Margin Thresholds Configuration
 * Epic 8: Channel-specific margin thresholds for price validation
 *
 * PHASE 0 SSOT NOTE:
 * Pricing policy (category → pricing unit mapping) has moved to the database.
 * Use the `usePricingPolicy` hook from "../hooks/usePricingPolicy" instead of
 * the deprecated functions in this file.
 *
 * This file now contains ONLY margin threshold logic which is UI-specific
 * and not yet migrated to the database.
 */

/**
 * Procurement channels
 */
export const PROCUREMENT_CHANNELS = {
  LOCAL: 'LOCAL',
  IMPORTED: 'IMPORTED',
};

/**
 * Margin thresholds per procurement channel
 * These define the color coding for margin warnings in the UI
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
    return 'red';
  }
  if (marginValue < thresholds.warning) {
    return 'amber';
  }
  return 'green';
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

  if (color === 'red') {
    return `Below ${thresholds.minimum}% minimum for ${channel} products`;
  }
  if (color === 'amber') {
    return `Below ${thresholds.warning}% recommended for ${channel} products`;
  }
  return `Good margin for ${channel} products`;
}

// =============================================================================
// DEPRECATED EXPORTS - Use usePricingPolicy hook instead
// These are kept for backwards compatibility during Phase 0 transition
// =============================================================================

/**
 * @deprecated Use usePricingPolicy hook instead. Will be removed in Phase 1.
 */
export const PRODUCT_CATEGORIES = {
  COILS: 'COILS',
  SHEETS: 'SHEETS',
  PIPES: 'PIPES',
  TUBES: 'TUBES',
  FITTINGS: 'FITTINGS',
  RODS: 'RODS',
  BARS: 'BARS',
  FASTENERS: 'FASTENERS',
  ANGLES: 'ANGLES',
  CHANNELS: 'CHANNELS',
  BEAMS: 'BEAMS',
};

/**
 * @deprecated Use usePricingPolicy hook instead. Will be removed in Phase 1.
 */
export const PRICING_UNITS = {
  WEIGHT: 'WEIGHT',
  AREA: 'AREA',
  PIECE: 'PIECE',
  LENGTH: 'LENGTH',
};

/**
 * @deprecated Use usePricingPolicy hook instead. Will be removed in Phase 1.
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
 * @deprecated Use usePricingPolicy hook instead. Will be removed in Phase 1.
 */
export const PRICING_UNIT_LABELS = {
  [PRICING_UNITS.WEIGHT]: 'Per Kilogram (KG)',
  [PRICING_UNITS.AREA]: 'Per Square Meter (m2)',
  [PRICING_UNITS.PIECE]: 'Per Piece/Unit',
  [PRICING_UNITS.LENGTH]: 'Per Meter',
};

/**
 * @deprecated Use usePricingPolicy hook's getPricingUnitForCategory instead.
 */
export function getPricingUnitForCategory(category) {
  console.warn(
    '[DEPRECATED] getPricingUnitForCategory from pricingStrategyMatrix.js is deprecated. Use usePricingPolicy hook instead.',
  );
  if (!category) return null;
  const upperCategory = category.toUpperCase();
  return CATEGORY_PRICING_MATRIX[upperCategory] || null;
}

/**
 * @deprecated Use usePricingPolicy hook's validateCategoryPricingUnit instead.
 */
export function validateCategoryPricingUnit(category, pricingUnit) {
  console.warn(
    '[DEPRECATED] validateCategoryPricingUnit from pricingStrategyMatrix.js is deprecated. Use usePricingPolicy hook instead.',
  );
  if (!category) {
    return { isValid: false, error: 'Product category is required' };
  }
  if (!pricingUnit) {
    return { isValid: false, error: 'Pricing unit is required' };
  }
  const expectedUnit = CATEGORY_PRICING_MATRIX[category.toUpperCase()];
  if (!expectedUnit) {
    return { isValid: false, error: `Unknown product category: ${category}` };
  }
  if (pricingUnit.toUpperCase() !== expectedUnit) {
    return {
      isValid: false,
      error: `Invalid pricing unit for ${category}. Expected: ${PRICING_UNIT_LABELS[expectedUnit]}`,
      expectedUnit,
    };
  }
  return { isValid: true, error: null, expectedUnit };
}

export default {
  // Active exports
  PROCUREMENT_CHANNELS,
  MARGIN_THRESHOLDS,
  getMarginThresholds,
  getMarginColor,
  getMarginStatusMessage,
  // Deprecated exports (kept for backwards compatibility)
  PRODUCT_CATEGORIES,
  PRICING_UNITS,
  CATEGORY_PRICING_MATRIX,
  PRICING_UNIT_LABELS,
  getPricingUnitForCategory,
  validateCategoryPricingUnit,
};
