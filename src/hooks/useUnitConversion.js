/**
 * useUnitConversion Hook
 * Phase 1: Pricing Governance - Unit Conversion Rules
 *
 * Provides unit conversion capabilities for products, enabling
 * conversion between MT, PCS, SQM, and METER units based on
 * product dimensions and material properties.
 *
 * Usage:
 *   const {
 *     calculateWeight,
 *     convertUnits,
 *     formulas,
 *     loading
 *   } = useUnitConversion();
 *
 *   // Calculate weight for a product
 *   const { weight_kg, weight_mt } = await calculateWeight(productId, 10, 'PCS');
 *
 *   // Convert between units
 *   const { to_quantity } = await convertUnits(productId, 100, 'PCS', 'MT');
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import unitConversionService from '../services/unitConversionService';

/**
 * Formula types (matching DB values)
 */
export const FORMULA_TYPES = {
  DIMENSIONAL: 'DIMENSIONAL', // L × W × T × density (sheets, plates, coils)
  WEIGHT_PER_UNIT: 'WEIGHT_PER_UNIT', // qty × weight_per_piece/meter (pipes, fittings)
  DIRECT: 'DIRECT', // Already in weight units
};

/**
 * Standard unit codes
 */
export const UNIT_CODES = {
  MT: 'MT', // Metric Ton
  KG: 'KG', // Kilogram
  PCS: 'PCS', // Pieces
  METER: 'METER', // Meters
  SQM: 'SQM', // Square meters
  SFT: 'SFT', // Square feet (Phase 1.1: UAE market)
};

/**
 * Pricing modes (Phase 1.1: Governance)
 */
export const PRICING_MODES = {
  MT_ONLY: 'MT_ONLY', // Weight-based only
  PCS_ONLY: 'PCS_ONLY', // Piece-based only (no conversion)
  CONVERTIBLE: 'CONVERTIBLE', // Can convert between units
};

/**
 * Conversion error codes (Phase 1.1)
 */
export const CONVERSION_ERRORS = {
  CONVERSION_NOT_ALLOWED: 'CONVERSION_NOT_ALLOWED',
  DISPLAY_ONLY: 'DISPLAY_ONLY',
  MISSING_WEIGHT_INPUTS: 'MISSING_WEIGHT_INPUTS',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  UNSUPPORTED_UNIT: 'UNSUPPORTED_UNIT',
  UNKNOWN_PRICING_MODE: 'UNKNOWN_PRICING_MODE',
};

/**
 * Default stainless steel density (kg/m³)
 */
export const DEFAULT_DENSITY = 7930;

/**
 * useUnitConversion Hook
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetchFormulas - Auto-fetch formulas on mount (default: true)
 * @returns {Object} Hook result
 */
export function useUnitConversion(options = {}) {
  const { autoFetchFormulas = true } = options;

  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build formula cache by category
  const formulaCache = useMemo(() => {
    const cache = new Map();
    formulas.forEach((formula) => {
      cache.set(formula.category.toLowerCase(), formula);
    });
    return cache;
  }, [formulas]);

  /**
   * Fetch all conversion formulas
   */
  const fetchFormulas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await unitConversionService.listConversionFormulas();
      setFormulas(result.formulas || []);
    } catch (err) {
      console.error('Failed to fetch conversion formulas:', err);
      setError(err.message || 'Failed to fetch conversion formulas');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get formula for a specific category from cache
   * @param {string} category - Category name
   * @returns {Object|null} Conversion formula or null
   */
  const getFormulaForCategory = useCallback(
    (category) => {
      if (!category) return null;
      return formulaCache.get(category.toLowerCase()) || null;
    },
    [formulaCache],
  );

  /**
   * Calculate weight for a product
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity
   * @param {string} unitCode - Unit code (PCS, METER, SQM, etc.)
   * @returns {Promise<{weight_kg: number, weight_mt: number, formula_type: string, calculation_notes: string, is_theoretical: boolean}>}
   */
  const calculateWeight = useCallback(async (productId, quantity, unitCode) => {
    try {
      const result = await unitConversionService.calculateWeight(productId, quantity, unitCode);
      return result;
    } catch (err) {
      console.error('Error calculating weight:', err);
      throw err;
    }
  }, []);

  /**
   * Convert between units for a product
   * Phase 1.1: Returns structured response with success/error info
   * @param {number} productId - Product ID
   * @param {number} fromQuantity - Source quantity
   * @param {string} fromUnit - Source unit code
   * @param {string} toUnit - Target unit code
   * @returns {Promise<{to_quantity: number, conversion_factor: number, notes: string, success: boolean, error_code: string|null, message: string|null, missing_fields: string[], pricing_mode: string|null, display_only: boolean}>}
   */
  const convertUnits = useCallback(async (productId, fromQuantity, fromUnit, toUnit) => {
    try {
      const result = await unitConversionService.convertUnits(
        productId,
        fromQuantity,
        fromUnit,
        toUnit,
      );
      return result;
    } catch (err) {
      console.error('Error converting units:', err);
      throw err;
    }
  }, []);

  /**
   * Check if conversion is allowed for a pricing mode
   * Phase 1.1: Helper to determine if conversion should be attempted
   * @param {string} pricingMode - Pricing mode (MT_ONLY, PCS_ONLY, CONVERTIBLE)
   * @param {string} fromUnit - Source unit
   * @param {string} toUnit - Target unit
   * @returns {{allowed: boolean, reason: string|null}}
   */
  const isConversionAllowed = useCallback((pricingMode, fromUnit, toUnit) => {
    if (fromUnit === toUnit) {
      return { allowed: true, reason: null };
    }

    switch (pricingMode) {
      case PRICING_MODES.PCS_ONLY:
        return {
          allowed: false,
          reason: 'This product category does not support unit conversion',
        };
      case PRICING_MODES.MT_ONLY:
        if ((fromUnit === 'MT' || fromUnit === 'KG') && (toUnit === 'MT' || toUnit === 'KG')) {
          return { allowed: true, reason: null };
        }
        return {
          allowed: false,
          reason: 'This product category only allows MT↔KG conversion',
        };
      case PRICING_MODES.CONVERTIBLE:
        return { allowed: true, reason: null };
      default:
        return { allowed: true, reason: null };
    }
  }, []);

  /**
   * Get product weight specifications
   * @param {number} productId - Product ID
   * @returns {Promise<{spec: Object|null, category_formula: Object|null}>}
   */
  const getProductWeightSpec = useCallback(async (productId) => {
    try {
      const result = await unitConversionService.getProductWeightSpec(productId);
      return result;
    } catch (err) {
      console.error('Error fetching weight spec:', err);
      throw err;
    }
  }, []);

  /**
   * Save product weight specifications
   * Phase 1.1: Requires changeReason for audit trail
   * @param {Object} spec - Weight spec with product_id
   * @param {string} changeReason - Mandatory reason for audit trail
   * @returns {Promise<{spec: Object}>}
   */
  const saveProductWeightSpec = useCallback(async (spec, changeReason) => {
    try {
      const result = await unitConversionService.saveProductWeightSpec(spec, changeReason);
      return result;
    } catch (err) {
      console.error('Error saving weight spec:', err);
      throw err;
    }
  }, []);

  /**
   * Batch calculate weights for multiple items (invoice lines)
   * @param {Array<{product_id: number, quantity: number, unit_code: string}>} items
   * @returns {Promise<{results: Array, total_weight_kg: number, total_weight_mt: number}>}
   */
  const batchCalculateWeight = useCallback(async (items) => {
    try {
      const result = await unitConversionService.batchCalculateWeight(items);
      return result;
    } catch (err) {
      console.error('Error batch calculating weights:', err);
      throw err;
    }
  }, []);

  /**
   * Check if a category supports dimensional calculation
   * @param {string} category - Category name
   * @returns {boolean}
   */
  const isDimensional = useCallback(
    (category) => {
      const formula = getFormulaForCategory(category);
      return formula?.formula_type === FORMULA_TYPES.DIMENSIONAL;
    },
    [getFormulaForCategory],
  );

  /**
   * Check if a category uses weight per unit
   * @param {string} category - Category name
   * @returns {boolean}
   */
  const isWeightPerUnit = useCallback(
    (category) => {
      const formula = getFormulaForCategory(category);
      return formula?.formula_type === FORMULA_TYPES.WEIGHT_PER_UNIT;
    },
    [getFormulaForCategory],
  );

  /**
   * Get density for a category (kg/m³)
   * @param {string} category - Category name
   * @returns {number} Density in kg/m³
   */
  const getDensity = useCallback(
    (category) => {
      const formula = getFormulaForCategory(category);
      return formula?.density_kg_m3 || DEFAULT_DENSITY;
    },
    [getFormulaForCategory],
  );

  /**
   * Get all available categories with formulas
   * @returns {string[]} Array of category names
   */
  const getCategories = useCallback(() => {
    return Array.from(formulaCache.keys());
  }, [formulaCache]);

  // Auto-fetch formulas on mount
  useEffect(() => {
    if (autoFetchFormulas) {
      fetchFormulas();
    }
  }, [autoFetchFormulas, fetchFormulas]);

  return {
    // Data
    formulas,
    loading,
    error,

    // Formula methods
    fetchFormulas,
    getFormulaForCategory,
    isDimensional,
    isWeightPerUnit,
    getDensity,
    getCategories,

    // Conversion methods
    calculateWeight,
    convertUnits,
    batchCalculateWeight,
    isConversionAllowed, // Phase 1.1: Policy gate helper

    // Weight spec methods
    getProductWeightSpec,
    saveProductWeightSpec,

    // Constants
    FORMULA_TYPES,
    UNIT_CODES,
    DEFAULT_DENSITY,
    PRICING_MODES, // Phase 1.1: Governance
    CONVERSION_ERRORS, // Phase 1.1: Error codes
  };
}

export default useUnitConversion;
