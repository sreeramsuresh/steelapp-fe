/**
 * UOM Validation Service
 *
 * Frontend service for UOM pre-validation API.
 * Validates quantities before form submission to provide instant feedback.
 */

import { apiClient } from "./api.js";

export const uomValidationService = {
  /**
   * Validate quantity precision for a given UOM.
   * PCS/BUNDLE must be whole numbers.
   *
   * @param {number} quantity - Quantity to validate
   * @param {string} unit - Unit of measure (PCS, KG, MT, BUNDLE, METER)
   * @returns {Promise<{valid: boolean, message?: string}>}
   */
  async validateQuantity(quantity, unit) {
    try {
      const response = await apiClient.post("/uom/validate-quantity", {
        quantity,
        unit: unit || "PCS",
      });
      return response;
    } catch (error) {
      // Fail open - let backend catch it during save
      console.warn("UOM validation API error:", error);
      return { valid: true };
    }
  },

  /**
   * Convert quantity between units.
   *
   * @param {number} quantity - Quantity to convert
   * @param {string} fromUnit - Source unit
   * @param {string} toUnit - Target unit
   * @param {number|null} unitWeightKg - Weight per piece (required for PCS conversions)
   * @returns {Promise<{success: boolean, converted?: number, error?: string}>}
   */
  async convert(quantity, fromUnit, toUnit, unitWeightKg = null) {
    try {
      const response = await apiClient.post("/uom/convert", {
        quantity,
        fromUnit,
        toUnit,
        unitWeightKg,
      });
      return response;
    } catch (error) {
      console.warn("UOM conversion API error:", error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Validate weight tolerance (actual vs theoretical).
   *
   * @param {number} actualWeightKg - Actual weighed weight
   * @param {number} theoreticalWeightKg - Calculated theoretical weight
   * @param {string} productCategory - PLATES, COILS, PIPES, FITTINGS
   * @returns {Promise<{valid: boolean, varianceKg: number, variancePct: number, tolerancePct: number, message: string}>}
   */
  async validateWeightTolerance(actualWeightKg, theoreticalWeightKg, productCategory = "PLATES") {
    try {
      const response = await apiClient.post("/uom/validate-weight-tolerance", {
        actualWeightKg,
        theoreticalWeightKg,
        productCategory,
      });
      return response;
    } catch (error) {
      console.warn("Weight tolerance validation error:", error);
      return {
        valid: true,
        varianceKg: 0,
        variancePct: 0,
        tolerancePct: 5,
        message: "Validation unavailable",
      };
    }
  },

  /**
   * Calculate weight variance fields.
   *
   * @param {number} actualWeightKg - Actual weighed weight
   * @param {number} theoreticalWeightKg - Calculated theoretical weight
   * @returns {Promise<{varianceKg: number, variancePct: number}>}
   */
  async calculateVariance(actualWeightKg, theoreticalWeightKg) {
    try {
      const response = await apiClient.post("/uom/calculate-variance", {
        actualWeightKg,
        theoreticalWeightKg,
      });
      return response;
    } catch (error) {
      console.warn("Variance calculation error:", error);
      return { varianceKg: 0, variancePct: 0 };
    }
  },

  /**
   * Get list of valid UOMs.
   *
   * @returns {Promise<{units: string[]}>}
   */
  async getValidUnits() {
    try {
      const response = await apiClient.get("/uom/valid-units");
      return response;
    } catch (error) {
      console.warn("Failed to fetch valid units:", error);
      return { units: ["PCS", "KG", "MT", "BUNDLE", "METER"] };
    }
  },

  /**
   * Batch validate multiple invoice items.
   * Call this before form submission.
   *
   * @param {Array<{name: string, quantity: number, unit: string}>} items - Items to validate
   * @returns {Promise<{valid: boolean, results: Array<{name: string, valid: boolean, message?: string}>}>}
   */
  async validateInvoiceItems(items) {
    try {
      const response = await apiClient.post("/uom/validate-invoice-items", {
        items,
      });
      return response;
    } catch (error) {
      console.warn("Batch validation API error:", error);
      // Fail open - let backend catch during save
      return {
        valid: true,
        results: items.map((item) => ({ name: item.name, valid: true })),
      };
    }
  },
};

export default uomValidationService;
