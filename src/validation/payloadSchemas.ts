/**
 * Frontend Payload Validation
 * Lightweight validation before sending requests to API
 * Catches obvious mistakes early with clear error messages
 *
 * NOTE: Field names are in camelCase (frontend convention)
 */

/**
 * Schema definition type
 */
interface PayloadSchema {
  required?: string[];
  positiveNumbers?: string[];
  arrays?: string[];
  emails?: string[];
}

/**
 * Schema definitions for frontend payloads
 */
const payloadSchemas: Record<string, PayloadSchema> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICE PAYLOADS
  // ═══════════════════════════════════════════════════════════════════════════
  createInvoice: {
    required: ['customerId', 'items'],
    positiveNumbers: ['customerId', 'subtotal', 'total'],
    arrays: ['items'],
  },

  updateInvoice: {
    positiveNumbers: ['customerId', 'subtotal', 'total'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT PAYLOADS
  // ═══════════════════════════════════════════════════════════════════════════
  recordPayment: {
    required: ['amount', 'paymentDate', 'method'],
    positiveNumbers: ['amount'],
  },

  createPayment: {
    required: ['invoiceId', 'amount', 'paymentDate', 'method'],
    positiveNumbers: ['invoiceId', 'amount'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT PAYLOADS
  // ═══════════════════════════════════════════════════════════════════════════
  createProduct: {
    required: ['name'],
    positiveNumbers: [
      'price',
      'sellingPrice',
      'costPrice',
      'currentStock',
      'minStock',
      'gstRate',
    ],
  },

  updateProduct: {
    positiveNumbers: [
      'price',
      'sellingPrice',
      'costPrice',
      'currentStock',
      'minStock',
      'gstRate',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMER PAYLOADS
  // ═══════════════════════════════════════════════════════════════════════════
  createCustomer: {
    required: ['name'],
    positiveNumbers: ['creditLimit'],
    emails: ['email'],
  },

  updateCustomer: {
    positiveNumbers: ['creditLimit'],
    emails: ['email'],
  },
};

/**
 * Simple email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a payload against its schema
 * @param name - Schema name (e.g., 'createInvoice', 'recordPayment')
 * @param payload - Payload object to validate
 * @returns Array of error messages (empty if valid)
 */
export function validatePayload(
  name: string,
  payload: Record<string, unknown>,
): string[] {
  const schema = payloadSchemas[name];
  const errors: string[] = [];

  if (!schema) {
    // No schema defined - pass through (don't block)
    if (import.meta.env.DEV) {
      console.warn(`[validatePayload] No schema defined for '${name}'`);
    }
    return errors;
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      const value = payload[field];
      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is required`);
      }
    }
  }

  // Check positive numbers
  if (schema.positiveNumbers) {
    for (const field of schema.positiveNumbers) {
      const value = payload[field];
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else if (num < 0) {
          errors.push(`${field} cannot be negative`);
        }
      }
    }
  }

  // Check arrays
  if (schema.arrays) {
    for (const field of schema.arrays) {
      const value = payload[field];
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
        } else if (schema.required?.includes(field) && value.length === 0) {
          errors.push(`${field} cannot be empty`);
        }
      }
    }
  }

  // Check emails
  if (schema.emails) {
    for (const field of schema.emails) {
      const value = payload[field];
      if (value && typeof value === 'string' && !EMAIL_REGEX.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }
    }
  }

  return errors;
}

/**
 * Validate and throw if invalid (for use in async functions)
 * @param name - Schema name
 * @param payload - Payload to validate
 * @throws Error with validation details
 */
export function assertValidPayload(
  name: string,
  payload: Record<string, unknown>,
): void {
  const errors = validatePayload(name, payload);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Check if a payload is valid (returns boolean)
 * @param name - Schema name
 * @param payload - Payload to validate
 * @returns true if valid, false otherwise
 */
export function isValidPayload(
  name: string,
  payload: Record<string, unknown>,
): boolean {
  return validatePayload(name, payload).length === 0;
}

export { payloadSchemas };
export type { PayloadSchema };
