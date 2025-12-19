/**
 * Product Domain Contract Guard (GUARD #2 - SUSPENDERS)
 *
 * PURPOSE:
 * Guarantees that no UI component can accidentally consume raw API product objects.
 * All product data must pass through normalizeProduct() + assertProductDomain().
 *
 * This prevents silent pricing logic failures caused by:
 * - Missing camelCase fields (unitWeightKg, piecesPerMt, etc.)
 * - Invalid types (non-numeric weights)
 * - Normalization leaks (snake_case keys still present after normalization)
 *
 * INTEGRATION:
 * Called automatically by normalizeProduct() in fieldAccessors.js
 * Acts as the final contract verification before product data enters UI components
 */

// Environment configuration
const IS_DEVELOPMENT = import.meta.env.DEV;
const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Critical fields required for pricing logic
 * Format: { fieldName: { type: 'string' | 'number' | 'optional', description: '...' } }
 */
const CRITICAL_FIELDS = {
  // Required identity fields
  id: {
    type: 'required',
    check: (val) => val !== undefined && val !== null,
    description: 'Product ID is required',
  },
  name: {
    type: 'string',
    check: (val) => typeof val === 'string' && val.length > 0,
    description: 'Product name must be a non-empty string',
  },

  // Pricing-critical numeric fields (optional but must be valid if present)
  unitWeightKg: {
    type: 'optional-number',
    check: (val) =>
      val === null ||
      val === undefined ||
      (typeof val === 'number' && Number.isFinite(val) && val >= 0),
    description:
      'unitWeightKg must be a finite non-negative number or null/undefined',
  },
  piecesPerMt: {
    type: 'optional-number',
    check: (val) =>
      val === null ||
      val === undefined ||
      (typeof val === 'number' && Number.isFinite(val) && val > 0),
    description:
      'piecesPerMt must be a finite positive number or null/undefined',
  },

  // UOM fields (optional but must be valid if present)
  primaryUom: {
    type: 'optional-string',
    check: (val) =>
      val === null || val === undefined || typeof val === 'string',
    description: 'primaryUom must be a string or null/undefined',
  },
};

/**
 * Snake_case keys that should NOT exist after normalization
 * If any of these are present, it indicates a normalization leak
 */
const FORBIDDEN_SNAKE_CASE_KEYS = [
  'unit_weight_kg',
  'pieces_per_mt',
  'product_category',
  'pricing_basis',
  'primary_uom',
  'display_name',
  'full_name',
  'unique_name',
  'selling_price',
  'cost_price',
  'current_stock',
  'min_stock',
  'max_stock',
];

/**
 * Assert that a product object satisfies the domain contract
 *
 * RULES:
 * 1. Must have required fields (id, name)
 * 2. Critical numeric fields must be valid numbers if present
 * 3. Must not contain snake_case keys (normalization leak detection)
 *
 * @param {Object} product - Normalized product object
 * @throws {Error} In development if contract violated
 * @returns {void} Throws in dev, logs in production
 */
export function assertProductDomain(product) {
  if (!product || typeof product !== 'object') {
    const error = new Error(
      '[ProductContract] Product is null or not an object'
    );
    handleContractViolation(error, { product });
    return;
  }

  const violations = [];

  // RULE 1: Check critical fields
  for (const [fieldName, spec] of Object.entries(CRITICAL_FIELDS)) {
    const value = product[fieldName];

    if (!spec.check(value)) {
      violations.push(`${fieldName}: ${spec.description} (got: ${JSON.stringify(value)})`);
    }
  }

  // RULE 2: Detect normalization leaks (snake_case keys still present)
  const leakedKeys = FORBIDDEN_SNAKE_CASE_KEYS.filter(
    (key) => product[key] !== undefined && product[key] !== null
  );

  if (leakedKeys.length > 0) {
    violations.push(
      `Normalization leak detected: snake_case keys still present: ${leakedKeys.join(', ')}`
    );
  }

  // Report violations
  if (violations.length > 0) {
    const errorMessage = formatViolations(product, violations);
    const error = new Error(errorMessage);
    handleContractViolation(error, { product, violations });
  }
}

/**
 * Format contract violations into a readable error message
 *
 * @param {Object} product - Product object
 * @param {Array<string>} violations - Array of violation messages
 * @returns {string} Formatted error message
 */
function formatViolations(product, violations) {
  const productId = product.id || 'unknown';
  const productName =
    product.displayName ||
    product.name ||
    product.uniqueName ||
    'Unknown Product';

  let message = `[ProductContract] Contract violation for product ID ${productId} ("${productName}"):\n\n`;

  violations.forEach((violation, index) => {
    message += `  ${index + 1}. ${violation}\n`;
  });

  message += `\n💡 This indicates that normalizeProduct() is incomplete or bypassed.`;
  message += `\n   Check that all product API responses pass through normalizeProduct().`;

  return message;
}

/**
 * Handle contract violation based on environment
 *
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (product, violations)
 * @throws {Error} In development
 */
function handleContractViolation(error, context) {
  if (IS_DEVELOPMENT) {
    // FAIL IMMEDIATELY in development
    console.error('❌ PRODUCT CONTRACT VIOLATION (Development Mode)');
    console.error(error.message);
    console.error('\nProduct object:', context.product);
    console.error('\nViolations:', context.violations);
    throw error;
  } else if (IS_PRODUCTION) {
    // LOG + BLOCK in production (prevent corrupt data from reaching UI)
    console.error('⚠️  PRODUCT CONTRACT VIOLATION (Production Mode)');
    console.error(error.message);
    console.error(
      'Product data may be corrupt. Contact support if this error persists.'
    );

    // Option 1: Throw (strict - prevents corrupt data from rendering)
    // throw error;

    // Option 2: Mark as invalid and allow graceful degradation
    // This allows UI to show "invalid product" instead of crashing
    if (context.product) {
      context.product._contractViolation = true;
      context.product._contractErrors = context.violations;
    }
  }
}

/**
 * Check if a product has contract violations (for graceful degradation in prod)
 *
 * @param {Object} product - Product object
 * @returns {boolean} True if product has violations
 */
export function hasContractViolation(product) {
  return product && product._contractViolation === true;
}

/**
 * Get contract errors for a product (for debugging in prod)
 *
 * @param {Object} product - Product object
 * @returns {Array<string>} Array of violation messages
 */
export function getContractErrors(product) {
  return product && product._contractErrors ? product._contractErrors : [];
}

export default {
  assertProductDomain,
  hasContractViolation,
  getContractErrors,
};
