/**
 * Canonical Supplier Type (camelCase only)
 * This is the NORMALIZED frontend schema after supplierNormalizer processes API data.
 *
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The supplierNormalizer converts snake_case → camelCase.
 */

/**
 * Main Supplier interface - CAMELCASE ONLY
 * All fields that exist after supplierNormalizer processing
 */
export interface Supplier {
  // Core identifiers
  id: number;
  name: string;

  // Contact information
  email?: string;
  phone?: string;
  address?: string;

  // Tax & Compliance
  trn?: string; // Tax registration number

  // Financial
  paymentTerms?: string;
}

/**
 * Type guard to check if object is a valid Supplier
 */
export function isSupplier(obj: unknown): obj is Supplier {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return typeof record.id === 'number' && typeof record.name === 'string';
}
