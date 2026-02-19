/**
 * Product SSOT (Single Source of Truth) Naming Validation
 *
 * Pattern: SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm
 *
 * Examples:
 * - SS-304-SHEET-2B-1250mm-2.0mm-2500mm
 * - SS-316L-PIPE-BA-25mm-1.5mm-6000mm
 * - SS-430-COIL-BA-1000mm-0.8mm-COIL
 * - SS-201-ROD-BRIGHT-12mm-12mm-6000mm
 */

/**
 * SSOT Pattern Regex
 * Validates product naming follows the standard pattern
 */
const SSOT_PATTERN_REGEX = /^SS-[A-Z0-9]+-[A-Z]+-[A-Z0-9]+-\d+mm-\d+(\.\d+)?mm-(\d+mm|COIL)$/i;

/**
 * Valid product forms
 */
const VALID_FORMS = ["SHEET", "COIL", "PIPE", "TUBE", "ROD", "BAR", "FITTING", "FASTENER", "ANGLE", "CHANNEL", "BEAM"];

/**
 * Valid stainless steel grades
 */
const VALID_GRADES = ["201", "304", "304L", "316", "316L", "321", "310S", "409", "410", "420", "430", "904L"];

/**
 * Valid surface finishes
 */
const VALID_FINISHES = ["2B", "BA", "NO1", "NO4", "HL", "MIRROR", "BRUSHED", "SATIN", "BRIGHT", "MILL"];

/**
 * Validate if a product name follows SSOT pattern
 * @param {string} productName - Product unique name to validate
 * @returns {Object} Validation result with isValid and error message
 */
export function validateSsotPattern(productName) {
  if (!productName || typeof productName !== "string") {
    return {
      isValid: false,
      error: "Product name is required",
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
    };
  }

  const trimmedName = productName.trim();

  if (!trimmedName.startsWith("SS-")) {
    return {
      isValid: false,
      error: 'Product name must start with "SS-"',
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
    };
  }

  if (!SSOT_PATTERN_REGEX.test(trimmedName)) {
    return {
      isValid: false,
      error: "Product name does not follow SSOT pattern",
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
      example: "SS-304-SHEET-2B-1250mm-2.0mm-2500mm",
    };
  }

  // Parse components
  const parts = trimmedName.split("-");
  if (parts.length < 7) {
    return {
      isValid: false,
      error: "Product name missing required components",
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
    };
  }

  const [_prefix, grade, form, finish] = parts;

  // Validate grade
  if (!VALID_GRADES.includes(grade.toUpperCase())) {
    return {
      isValid: false,
      error: `Invalid grade "${grade}". Valid grades: ${VALID_GRADES.join(", ")}`,
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
    };
  }

  // Validate form
  if (!VALID_FORMS.includes(form.toUpperCase())) {
    return {
      isValid: false,
      error: `Invalid form "${form}". Valid forms: ${VALID_FORMS.join(", ")}`,
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
    };
  }

  // Validate finish
  if (!VALID_FINISHES.includes(finish.toUpperCase())) {
    return {
      isValid: false,
      error: `Invalid finish "${finish}". Valid finishes: ${VALID_FINISHES.join(", ")}`,
      pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
    };
  }

  return {
    isValid: true,
    error: null,
    pattern: "SS-{Grade}-{Form}-{Finish}-{Width}mm-{Thickness}mm-{Length}mm",
  };
}

/**
 * Parse SSOT product name into components
 * @param {string} productName - SSOT-formatted product name
 * @returns {Object|null} Parsed components or null if invalid
 */
export function parseSsotName(productName) {
  const validation = validateSsotPattern(productName);
  if (!validation.isValid) {
    return null;
  }

  const parts = productName.split("-");

  // Extract dimensions (remove 'mm' suffix)
  const width = parts[4].replace("mm", "");
  const thickness = parts[5].replace("mm", "");
  const length = parts[6].replace("mm", "");

  return {
    prefix: parts[0],
    grade: parts[1],
    form: parts[2],
    finish: parts[3],
    width: parseFloat(width),
    thickness: parseFloat(thickness),
    length: length === "COIL" ? "COIL" : parseFloat(length),
    raw: productName,
  };
}

/**
 * Generate SSOT product name from components
 * @param {Object} components - Product components
 * @returns {string} SSOT-formatted product name
 */
export function generateSsotName({ grade, form, finish, width, thickness, length }) {
  if (!grade || !form || !finish || !width || !thickness || !length) {
    throw new Error("All components are required to generate SSOT name");
  }

  return `SS-${grade.toUpperCase()}-${form.toUpperCase()}-${finish.toUpperCase()}-${width}mm-${thickness}mm-${length === "COIL" ? "COIL" : `${length}mm`}`;
}

/**
 * Get user-friendly error message for SSOT validation
 * @param {string} productName - Product name that failed validation
 * @returns {string} User-friendly error message
 */
export function getSsotErrorMessage(productName) {
  const validation = validateSsotPattern(productName);
  if (validation.isValid) {
    return "";
  }

  return `${validation.error}\n\nExpected pattern: ${validation.pattern}\nExample: SS-304-SHEET-2B-1250mm-2.0mm-2500mm`;
}

/**
 * Check if product name needs SSOT migration
 * @param {string} productName - Current product name
 * @returns {boolean} True if name needs migration
 */
export function needsSsotMigration(productName) {
  if (!productName) return false;
  return !validateSsotPattern(productName).isValid;
}

export default {
  validateSsotPattern,
  parseSsotName,
  generateSsotName,
  getSsotErrorMessage,
  needsSsotMigration,
  VALID_GRADES,
  VALID_FORMS,
  VALID_FINISHES,
};
