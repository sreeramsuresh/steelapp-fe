/**
 * Unit Conversion Service
 * Phase 1: Pricing Governance - Unit Conversion Rules
 *
 * Provides API access for unit conversions between MT, PCS, SQM, METER.
 * Uses conversion formulas based on product dimensions and material properties.
 *
 * Note: company_id is extracted from authenticated user context (JWT token).
 */

import { api } from './api';

export const unitConversionService = {
  /**
   * List all conversion formulas for the company
   * @returns {Promise<{formulas: Array}>}
   */
  async listConversionFormulas() {
    try {
      const response = await api.get('/unit-conversions/formulas');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion formulas:', error);
      throw error;
    }
  },

  /**
   * Get conversion formula for a specific category
   * @param {string} category - Category name (e.g., "sheet", "pipe")
   * @returns {Promise<{formula: Object|null}>}
   */
  async getConversionFormula(category) {
    try {
      const response = await api.get(`/unit-conversions/formulas/${category}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching formula for category ${category}:`, error);
      throw error;
    }
  },

  /**
   * Calculate weight for a product
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity
   * @param {string} unitCode - Unit code (PCS, METER, SQM, etc.)
   * @returns {Promise<{weight_kg: number, weight_mt: number, formula_type: string, calculation_notes: string, is_theoretical: boolean}>}
   */
  async calculateWeight(productId, quantity, unitCode) {
    try {
      const response = await api.post('/unit-conversions/calculate-weight', {
        product_id: productId,
        quantity,
        unit_code: unitCode,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating weight:', error);
      throw error;
    }
  },

  /**
   * Convert between units for a product
   * Phase 1.1: Returns structured response with success/error info
   * @param {number} productId - Product ID
   * @param {number} fromQuantity - Source quantity
   * @param {string} fromUnit - Source unit code
   * @param {string} toUnit - Target unit code
   * @returns {Promise<{to_quantity: number, conversion_factor: number, notes: string, success: boolean, error_code: string|null, message: string|null, missing_fields: string[], pricing_mode: string|null, display_only: boolean}>}
   */
  async convertUnits(productId, fromQuantity, fromUnit, toUnit) {
    try {
      const response = await api.post('/unit-conversions/convert', {
        product_id: productId,
        from_quantity: fromQuantity,
        from_unit: fromUnit,
        to_unit: toUnit,
      });
      return response.data;
    } catch (error) {
      console.error('Error converting units:', error);
      throw error;
    }
  },

  /**
   * Get product weight specifications
   * @param {number} productId - Product ID
   * @returns {Promise<{spec: Object|null, category_formula: Object|null}>}
   */
  async getProductWeightSpec(productId) {
    try {
      const response = await api.get(`/unit-conversions/weight-specs/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching weight spec for product ${productId}:`, error);
      throw error;
    }
  },

  /**
   * Save product weight specifications
   * Phase 1.1: Requires change_reason for audit trail
   * @param {Object} spec - Weight spec object with product_id
   * @param {string} changeReason - Mandatory reason for audit trail
   * @returns {Promise<{spec: Object}>}
   */
  async saveProductWeightSpec(spec, changeReason) {
    if (!changeReason || changeReason.trim() === '') {
      throw new Error('change_reason is required for audit trail');
    }
    try {
      const response = await api.post('/unit-conversions/weight-specs', {
        spec,
        change_reason: changeReason,
      });
      return response.data;
    } catch (error) {
      console.error('Error saving weight spec:', error);
      throw error;
    }
  },

  /**
   * Batch calculate weights for multiple items (invoice lines)
   * @param {Array<{product_id: number, quantity: number, unit_code: string}>} items
   * @returns {Promise<{results: Array, total_weight_kg: number, total_weight_mt: number}>}
   */
  async batchCalculateWeight(items) {
    try {
      const response = await api.post('/unit-conversions/batch-calculate-weight', { items });
      return response.data;
    } catch (error) {
      console.error('Error batch calculating weights:', error);
      throw error;
    }
  },
};

export default unitConversionService;
