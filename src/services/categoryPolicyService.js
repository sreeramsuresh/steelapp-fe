/**
 * Category Policy Service
 * Phase 0: Single Source of Truth - Fetches pricing policies from DB
 *
 * This service replaces the hardcoded pricingStrategyMatrix.js
 * by fetching category-level pricing rules from the database.
 *
 * Note: company_id is extracted from authenticated user context (JWT token).
 * The _companyId parameters are deprecated and ignored - kept only for
 * backwards compatibility during Phase 0 transition.
 */

import { api } from "./api";

// Dev-only warning for deprecated _companyId parameter usage
const IS_DEV = import.meta.env?.DEV || process.env.NODE_ENV === "development";

function _warnDeprecatedCompanyId(methodName, companyId) {
  if (IS_DEV && companyId !== undefined && companyId !== null) {
    console.warn(
      `[categoryPolicyService.${methodName}] DEPRECATED: _companyId parameter is ignored. ` +
        `company_id is extracted from auth context. Passed value: ${companyId}`
    );
  }
}

export const categoryPolicyService = {
  /**
   * Get all category policies for a company
   * Note: company_id is extracted from authenticated user context (not passed as param)
   * @param {number} _companyId - Deprecated, kept for backwards compatibility
   * @param {boolean} activeOnly - Filter to active only (default: true)
   * @returns {Promise<{policies: Array, taxonomy_status: Object}>}
   */
  async listCategoryPolicies(_companyId, activeOnly = true) {
    // Note: _companyId parameter is deprecated and ignored - company_id is extracted from auth context
    // warnDeprecatedCompanyId('listCategoryPolicies', _companyId);
    try {
      const response = await api.get("/category-policies", {
        params: {
          active_only: activeOnly,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching category policies:", error);
      throw error;
    }
  },

  /**
   * Get pricing policy for a specific category
   * Note: company_id is extracted from authenticated user context (not passed as param)
   * @param {number} _companyId - Deprecated, kept for backwards compatibility
   * @param {string} category - Category name (e.g., "coil", "sheet")
   * @returns {Promise<{policy: Object, is_frozen: boolean}>}
   */
  async getCategoryPolicy(_companyId, category) {
    // Note: _companyId parameter is deprecated and ignored - company_id is extracted from auth context
    // warnDeprecatedCompanyId('getCategoryPolicy', _companyId);
    try {
      const response = await api.get(`/category-policies/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching policy for category ${category}:`, error);
      throw error;
    }
  },

  /**
   * Get all product subtypes, optionally filtered by category
   * Note: company_id is extracted from authenticated user context (not passed as param)
   * @param {number} _companyId - Deprecated, kept for backwards compatibility
   * @param {string} category - Optional category filter
   * @returns {Promise<{subtypes: Array}>}
   */
  async getProductSubtypes(_companyId, category = null) {
    // Note: _companyId parameter is deprecated and ignored - company_id is extracted from auth context
    // warnDeprecatedCompanyId('getProductSubtypes', _companyId);
    try {
      const params = {};
      if (category) {
        params.category = category;
      }
      const response = await api.get("/category-policies/subtypes/list", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching product subtypes:", error);
      throw error;
    }
  },

  /**
   * Get the current taxonomy freeze status
   * Note: company_id is extracted from authenticated user context (not passed as param)
   * @param {number} _companyId - Deprecated, kept for backwards compatibility
   * @returns {Promise<{status: Object, is_frozen: boolean}>}
   */
  async getTaxonomyStatus(_companyId) {
    // Note: _companyId parameter is deprecated and ignored - company_id is extracted from auth context
    // warnDeprecatedCompanyId('getTaxonomyStatus', _companyId);
    try {
      const response = await api.get("/category-policies/taxonomy/status");
      return response.data;
    } catch (error) {
      console.error("Error fetching taxonomy status:", error);
      throw error;
    }
  },

  /**
   * COMPATIBILITY LAYER: Get pricing unit for a category
   * Mimics getPricingUnitForCategory from pricingStrategyMatrix.js
   *
   * Maps DB pricing_mode to frontend PRICING_UNITS:
   * - MT_ONLY → WEIGHT
   * - PCS_ONLY → PIECE
   * - CONVERTIBLE → WEIGHT (default, can be overridden)
   *
   * @param {Object} policy - Category policy from getCategoryPolicy
   * @returns {string} Pricing unit (WEIGHT, PIECE, AREA, LENGTH)
   */
  getPricingUnitFromPolicy(policy) {
    if (!policy || !policy.pricing_mode) {
      return null;
    }

    const modeMap = {
      MT_ONLY: "WEIGHT",
      PCS_ONLY: "PIECE",
      CONVERTIBLE: "WEIGHT", // Default to weight for convertible
    };

    return modeMap[policy.pricing_mode] || null;
  },

  /**
   * COMPATIBILITY LAYER: Check if category requires weight
   *
   * @param {Object} policy - Category policy from getCategoryPolicy
   * @returns {boolean}
   */
  requiresWeight(policy) {
    if (!policy) {
      return false;
    }
    return policy.requires_weight === true;
  },

  /**
   * COMPATIBILITY LAYER: Check if pricing mode allows convertible pricing
   *
   * @param {Object} policy - Category policy from getCategoryPolicy
   * @returns {boolean}
   */
  isConvertible(policy) {
    return policy?.pricing_mode === "CONVERTIBLE";
  },

  /**
   * Build a local cache map from policies for quick lookup
   * @param {Array} policies - Array of CategoryPolicy objects
   * @returns {Map<string, Object>} Map of category -> policy
   */
  buildPolicyCache(policies) {
    const cache = new Map();
    if (policies && Array.isArray(policies)) {
      for (const policy of policies) {
        cache.set(policy.category.toLowerCase(), policy);
      }
    }
    return cache;
  },
};

export default categoryPolicyService;
