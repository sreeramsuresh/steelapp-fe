/**
 * Canonical Customer Type (camelCase only)
 * This is the NORMALIZED frontend schema after customerNormalizer processes API data.
 * 
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The customerNormalizer converts snake_case → camelCase.
 */

/**
 * Main Customer interface - CAMELCASE ONLY
 * All fields that exist after customerNormalizer processing
 */
export interface Customer {
  // Core identifiers
  id: number;
  name: string;
  company?: string;
  
  // Contact information
  email?: string;
  phone?: string;
  address?: string;
  
  // Tax & Compliance
  vatNumber?: string;
  trn?: string; // Tax registration number
  
  // Financial
  creditLimit?: number;
  currentCredit?: number;
  paymentTerms?: string;
  revenue?: number;
  
  // Metadata
  status?: string;
  orders?: number;
  customer?: object; // Nested customer reference
}

/**
 * Type guard to check if object is a valid Customer
 */
export function isCustomer(obj: any): obj is Customer {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string'
  );
}
