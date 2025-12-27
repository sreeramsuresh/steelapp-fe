/**
 * usePricingPolicy Hook
 * Phase 0: Single Source of Truth - DB is the authority for pricing policies
 *
 * This hook replaces the hardcoded pricingStrategyMatrix.js by fetching
 * category-level pricing rules from the database via the CategoryPolicy API.
 *
 * Usage:
 *   const { policies, getPolicyForCategory, isFrozen, loading, error } = usePricingPolicy(companyId);
 *
 *   // Get policy for a category
 *   const coilPolicy = getPolicyForCategory('coil');
 *   console.log(coilPolicy.pricing_mode); // 'MT_ONLY'
 *
 *   // Check if taxonomy is frozen
 *   if (isFrozen) {
 *     // Policy changes are locked
 *   }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import categoryPolicyService from '../services/categoryPolicyService';

/**
 * Pricing mode constants (matching DB values)
 */
export const PRICING_MODES = {
  MT_ONLY: 'MT_ONLY', // Weight-based only (per metric ton)
  PCS_ONLY: 'PCS_ONLY', // Piece-based only
  CONVERTIBLE: 'CONVERTIBLE', // Can sell by weight or piece
};

/**
 * Primary unit constants
 */
export const PRIMARY_UNITS = {
  MT: 'MT', // Metric Ton
  PCS: 'PCS', // Pieces
};

/**
 * Mapping from DB pricing_mode to legacy PRICING_UNITS
 * For backwards compatibility with existing code
 */
export const PRICING_MODE_TO_UNIT = {
  MT_ONLY: 'WEIGHT',
  PCS_ONLY: 'PIECE',
  CONVERTIBLE: 'WEIGHT', // Default to weight, but UI should allow toggle
};

/**
 * usePricingPolicy Hook
 *
 * @param {number} companyId - Company ID to fetch policies for
 * @param {Object} options - Hook options
 * @param {boolean} options.autoFetch - Auto-fetch on mount (default: true)
 * @param {boolean} options.activeOnly - Filter to active policies (default: true)
 * @returns {Object} Hook result
 */
export function usePricingPolicy(companyId, options = {}) {
  const { autoFetch = true, activeOnly = true } = options;

  const [policies, setPolicies] = useState([]);
  const [taxonomyStatus, setTaxonomyStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build a cache map for quick lookups
  const policyCache = useMemo(() => {
    return categoryPolicyService.buildPolicyCache(policies);
  }, [policies]);

  // Check if taxonomy is frozen
  const isFrozen = useMemo(() => {
    if (!taxonomyStatus) return false;
    return ['FROZEN', 'ACTIVE'].includes(taxonomyStatus.status);
  }, [taxonomyStatus]);

  /**
   * Fetch all category policies for the company
   */
  const fetchPolicies = useCallback(async () => {
    if (!companyId) {
      setError('Company ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await categoryPolicyService.listCategoryPolicies(
        companyId,
        activeOnly,
      );
      setPolicies(result.policies || []);
      setTaxonomyStatus(result.taxonomy_status || null);
    } catch (err) {
      console.error('Failed to fetch pricing policies:', err);
      setError(err.message || 'Failed to fetch pricing policies');
    } finally {
      setLoading(false);
    }
  }, [companyId, activeOnly]);

  /**
   * Get policy for a specific category from cache
   * @param {string} category - Category name (e.g., "coil", "sheet")
   * @returns {Object|null} Category policy or null if not found
   */
  const getPolicyForCategory = useCallback(
    (category) => {
      if (!category) return null;
      return policyCache.get(category.toLowerCase()) || null;
    },
    [policyCache],
  );

  /**
   * Get pricing unit for a category (backwards compatible)
   * Maps to legacy PRICING_UNITS values: WEIGHT, PIECE, AREA, LENGTH
   *
   * @param {string} category - Category name
   * @returns {string|null} Pricing unit or null if policy not found
   */
  const getPricingUnitForCategory = useCallback(
    (category) => {
      const policy = getPolicyForCategory(category);
      return categoryPolicyService.getPricingUnitFromPolicy(policy);
    },
    [getPolicyForCategory],
  );

  /**
   * Check if a category requires weight
   * @param {string} category - Category name
   * @returns {boolean}
   */
  const requiresWeight = useCallback(
    (category) => {
      const policy = getPolicyForCategory(category);
      return categoryPolicyService.requiresWeight(policy);
    },
    [getPolicyForCategory],
  );

  /**
   * Check if a category has convertible pricing
   * @param {string} category - Category name
   * @returns {boolean}
   */
  const isConvertible = useCallback(
    (category) => {
      const policy = getPolicyForCategory(category);
      return categoryPolicyService.isConvertible(policy);
    },
    [getPolicyForCategory],
  );

  /**
   * Get all available categories
   * @returns {string[]} Array of category names
   */
  const getCategories = useCallback(() => {
    return Array.from(policyCache.keys());
  }, [policyCache]);

  /**
   * Validate pricing unit for a category
   * Mimics validateCategoryPricingUnit from pricingStrategyMatrix.js
   *
   * @param {string} category - Category name
   * @param {string} pricingUnit - Pricing unit to validate
   * @returns {{isValid: boolean, error: string|null, expectedUnit: string|null}}
   */
  const validateCategoryPricingUnit = useCallback(
    (category, pricingUnit) => {
      if (!category) {
        return {
          isValid: false,
          error: 'Product category is required',
          expectedUnit: null,
        };
      }

      if (!pricingUnit) {
        return {
          isValid: false,
          error: 'Pricing unit is required',
          expectedUnit: null,
        };
      }

      const expectedUnit = getPricingUnitForCategory(category);
      if (!expectedUnit) {
        return {
          isValid: false,
          error: `Unknown product category: ${category}`,
          expectedUnit: null,
        };
      }

      const policy = getPolicyForCategory(category);

      // For CONVERTIBLE, allow both WEIGHT and PIECE
      if (policy?.pricing_mode === 'CONVERTIBLE') {
        const validUnits = ['WEIGHT', 'PIECE'];
        if (!validUnits.includes(pricingUnit.toUpperCase())) {
          return {
            isValid: false,
            error: `Invalid pricing unit for ${category}. Expected: WEIGHT or PIECE`,
            expectedUnit: 'WEIGHT',
          };
        }
        return {
          isValid: true,
          error: null,
          expectedUnit: pricingUnit.toUpperCase(),
        };
      }

      // For MT_ONLY or PCS_ONLY, strict validation
      if (pricingUnit.toUpperCase() !== expectedUnit) {
        const unitLabels = {
          WEIGHT: 'Per Kilogram (KG)',
          PIECE: 'Per Piece/Unit',
        };
        return {
          isValid: false,
          error: `Invalid pricing unit for ${category}. Expected: ${unitLabels[expectedUnit] || expectedUnit}`,
          expectedUnit,
        };
      }

      return {
        isValid: true,
        error: null,
        expectedUnit,
      };
    },
    [getPolicyForCategory, getPricingUnitForCategory],
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && companyId) {
      fetchPolicies();
    }
  }, [autoFetch, companyId, fetchPolicies]);

  return {
    // Data
    policies,
    taxonomyStatus,
    isFrozen,
    loading,
    error,

    // Methods
    fetchPolicies,
    getPolicyForCategory,
    getPricingUnitForCategory,
    requiresWeight,
    isConvertible,
    getCategories,
    validateCategoryPricingUnit,

    // Constants
    PRICING_MODES,
    PRIMARY_UNITS,
  };
}

export default usePricingPolicy;
