/**
 * Product Naming Service
 * Handles API calls for product naming verification
 */

import { apiService } from "./axiosApi.js";

export const productNamingService = {
  /**
   * Verify naming logic for a product type with given attributes
   * @param {string} productType - Type of product (sheet, pipe, tube, coil, bar, anglebar)
   * @param {object} attributes - Product attributes (grade, finish, dimensions, etc.)
   * @returns {Promise<object>} Verification result with uniqueName and displayName
   */
  async verifyNamingLogic(productType, attributes) {
    try {
      return await apiService.post("/product-naming/verify", { productType, ...attributes });
    } catch (error) {
      console.error("Product naming verification error:", error);
      throw error;
    }
  },

  /**
   * Verify all product types with sample data
   * @returns {Promise<Array>} Array of verification results for all product types
   */
  async verifyAllProductTypes() {
    const testCases = [
      {
        productType: "sheet",
        grade: "316L",
        finish: "2B",
        width: "1220mm",
        thickness: "2mm",
        length: "2440mm",
        millCountry: "KR",
        mill: "POSCO",
      },
      {
        productType: "pipe",
        grade: "304",
        finish: "BA",
        diameter: "2inch",
        schedule: "Sch40",
        millCountry: "TH",
        mill: "TISCO",
      },
      {
        productType: "tube",
        grade: "316",
        finish: "2B",
        diameter: "25mm",
        thickness: "1.5mm",
        millCountry: "IN",
        mill: "JINDAL",
      },
      {
        productType: "coil",
        grade: "304",
        finish: "2B",
        width: "1000mm",
        thickness: "1mm",
        millCountry: "CN",
        mill: "TISCO",
      },
      {
        productType: "bar",
        grade: "316",
        finish: "BRIGHT",
        diameter: "20mm",
        millCountry: "JP",
        mill: "NSC",
      },
      {
        productType: "anglebar",
        grade: "304",
        finish: "2B",
        size: "50x50x6mm",
        millCountry: "KR",
        mill: "POSCO",
      },
    ];

    const results = await Promise.allSettled(
      testCases.map(async (testCase) => {
        const { productType, ...attributes } = testCase;
        try {
          const result = await this.verifyNamingLogic(productType, attributes);
          return {
            productType,
            status: "success",
            ...result,
          };
        } catch (error) {
          return {
            productType,
            status: "error",
            error: error.message,
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          productType: testCases[index].productType,
          status: "error",
          error: result.reason?.message || "Unknown error",
        };
      }
    });
  },
};
