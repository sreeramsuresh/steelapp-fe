/**
 * TRN (Tax Registration Number) Verification Service
 *
 * UAE FTA TRN Verification Integration
 *
 * Features:
 * - Local format validation (always works)
 * - FTA API verification (when configured)
 * - Graceful fallback with manual verification link
 * - Support for UAE and GCC country TRN formats
 */

import { apiClient } from "./api";

/**
 * TRN Format patterns for client-side validation
 * Mirrors backend validation for instant feedback
 */
const TRN_FORMATS = {
  AE: {
    pattern: /^\d{15}$/,
    description: "15 digits exactly (e.g., 100-1234-5678-9123)",
    example: "100123456789123",
    displayFormat: "XXX-XXXX-XXXX-XXXX",
    country: "UAE",
  },
  SA: {
    pattern: /^3\d{14}$/,
    description: "15 digits starting with 3",
    example: "310123456789012",
    country: "Saudi Arabia",
  },
  BH: {
    pattern: /^\d{13}$/,
    description: "13 digits",
    example: "1234567890123",
    country: "Bahrain",
  },
  OM: {
    pattern: /^\d{8}$/,
    description: "8 digits",
    example: "12345678",
    country: "Oman",
  },
  KW: {
    pattern: /^.+$/,
    description: "No standard format (VAT not implemented)",
    example: "N/A",
    country: "Kuwait",
  },
  QA: {
    pattern: /^.+$/,
    description: "No standard format (VAT not implemented)",
    example: "N/A",
    country: "Qatar",
  },
};

/**
 * TRN Verification Service
 */
export const trnService = {
  /**
   * Format TRN for display (XXX-XXXX-XXXX-XXXX)
   * UAE Federal Decree-Law No. 8 of 2017, Article 65
   *
   * @param {string} trn - Raw 15-digit TRN
   * @returns {string} Formatted TRN or original if invalid
   */
  formatForDisplay(trn) {
    if (!trn) return "";
    const clean = String(trn).replace(/[\s-]/g, "");
    if (clean.length !== 15 || !/^\d{15}$/.test(clean)) return trn;
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}-${clean.slice(11)}`;
  },

  /**
   * Normalize TRN input (remove spaces and dashes, keep only digits)
   *
   * @param {string} trn - User input with possible formatting
   * @returns {string} Clean 15-digit TRN or original if cannot normalize
   */
  normalizeInput(trn) {
    if (!trn) return "";
    return String(trn).replace(/[\s-]/g, "");
  },

  /**
   * Validate and format TRN as user types (for controlled inputs)
   * Allows partial input but formats complete 15-digit TRNs
   *
   * @param {string} trn - User input
   * @returns {object} { value: string, isValid: boolean, isComplete: boolean }
   */
  handleInput(trn) {
    const clean = this.normalizeInput(trn);
    const digitsOnly = clean.replace(/\D/g, "");

    // Limit to 15 digits
    const limited = digitsOnly.slice(0, 15);

    return {
      value: limited,
      isValid: limited.length === 15,
      isComplete: limited.length === 15,
      displayValue:
        limited.length === 15 ? this.formatForDisplay(limited) : limited,
    };
  },

  /**
   * Validate TRN format locally (instant, no API call)
   *
   * @param {string} trn - Tax Registration Number
   * @param {string} countryCode - ISO 2-letter country code (default: AE)
   * @returns {object} Validation result
   */
  validateFormat(trn, countryCode = "AE") {
    if (!trn || typeof trn !== "string") {
      return {
        valid: false,
        error: "TRN is required",
      };
    }

    // Clean the TRN (remove spaces, dashes)
    const cleanTRN = trn.replace(/[\s-]/g, "");

    // Get format rules for country
    const format = TRN_FORMATS[countryCode.toUpperCase()];
    if (!format) {
      return {
        valid: false,
        error: `Unknown country code: ${countryCode}`,
        supportedCountries: Object.keys(TRN_FORMATS),
      };
    }

    // Validate against pattern
    if (!format.pattern.test(cleanTRN)) {
      return {
        valid: false,
        error: `Invalid ${format.country} TRN format`,
        expectedFormat: format.description,
        example: format.example,
        provided: cleanTRN,
      };
    }

    return {
      valid: true,
      trn: cleanTRN,
      countryCode: countryCode.toUpperCase(),
      country: format.country,
      formatDescription: format.description,
    };
  },

  /**
   * Verify TRN with backend API (may call FTA if configured)
   *
   * @param {string} trn - Tax Registration Number
   * @param {string} countryCode - ISO 2-letter country code (default: AE)
   * @returns {Promise<object>} Verification result
   */
  async verify(trn, countryCode = "AE") {
    try {
      const response = await apiClient.post("/trn/verify", {
        trn,
        country_code: countryCode,
      });

      return {
        success: true,
        ...response,
      };
    } catch (error) {
      // Handle API errors gracefully
      const errorData = error.response?.data || {};

      return {
        success: false,
        verified: null,
        formatValid: errorData.format_valid || false,
        apiConfigured: errorData.api_configured || false,
        error: errorData.message || error.message || "Verification failed",
        errorCode: errorData.error_code || "UNKNOWN_ERROR",
        manualVerificationUrl:
          errorData.manual_verification_url ||
          "https://tax.gov.ae/en/trn.verification.aspx",
      };
    }
  },

  /**
   * Validate TRN format via backend API
   * Use this for more thorough server-side validation
   *
   * @param {string} trn - Tax Registration Number
   * @param {string} countryCode - ISO 2-letter country code (default: AE)
   * @returns {Promise<object>} Validation result
   */
  async validateRemote(trn, countryCode = "AE") {
    try {
      const response = await apiClient.post("/trn/validate", {
        trn,
        country_code: countryCode,
      });

      return {
        success: true,
        ...response,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error:
          error.response?.data?.message || error.message || "Validation failed",
      };
    }
  },

  /**
   * Get TRN verification service status
   *
   * @returns {Promise<object>} Service status
   */
  async getStatus() {
    try {
      const response = await apiClient.get("/trn/status");
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to get service status",
      };
    }
  },

  /**
   * Get supported TRN formats
   *
   * @returns {Promise<object>} Supported formats
   */
  async getFormats() {
    try {
      const response = await apiClient.get("/trn/formats");
      return {
        success: true,
        ...response,
      };
    } catch (error) {
      // Fallback to local formats if API fails
      return {
        success: true,
        formats: Object.entries(TRN_FORMATS).map(([code, format]) => ({
          countryCode: code,
          country: format.country,
          description: format.description,
          example: format.example,
        })),
        defaultCountry: "AE",
        source: "local_fallback",
      };
    }
  },

  /**
   * Get local TRN formats (no API call)
   *
   * @returns {object} TRN formats
   */
  getLocalFormats() {
    return TRN_FORMATS;
  },

  /**
   * Get format info for a specific country
   *
   * @param {string} countryCode - ISO 2-letter country code
   * @returns {object|null} Format info or null if not found
   */
  getFormatForCountry(countryCode) {
    return TRN_FORMATS[countryCode?.toUpperCase()] || null;
  },

  /**
   * Check if a country has VAT implemented
   *
   * @param {string} countryCode - ISO 2-letter country code
   * @returns {boolean} True if VAT is implemented
   */
  hasVatSystem(countryCode) {
    const noVatCountries = ["KW", "QA"];
    return !noVatCountries.includes(countryCode?.toUpperCase());
  },

  /**
   * Manual verification URL
   */
  manualVerificationUrl: "https://tax.gov.ae/en/trn.verification.aspx",
};

export default trnService;
