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
  
  // Financial & Credit Management
  creditLimit?: number;
  currentCredit?: number;
  // Phase 5: Enhanced Credit Management
  creditUsed?: number;                    // Amount of credit currently utilized
  creditAvailable?: number;               // Available credit (credit_limit - credit_used)
  creditScore?: number;                   // Credit score 0-100 based on DSO and payment history
  creditGrade?: string;                   // Credit grade A|B|C|D|E
  dsoDay?: number;                        // Days Sales Outstanding
  
  // Aging Analysis (5 buckets)
  agingCurrent?: number;                  // Not yet due
  aging1_30?: number;                     // 1-30 days overdue
  aging31_60?: number;                    // 31-60 days overdue
  aging61_90?: number;                    // 61-90 days overdue
  aging90_plus?: number;                  // 90+ days overdue
  
  // Credit tracking
  lastPaymentDate?: string | null;        // When last payment was received
  creditReviewDate?: string | null;       // Next credit review date
  lastCreditUpdated?: string | null;      // When credit metrics were last calculated
  
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
export function isCustomer(obj: unknown): obj is Customer {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string'
  );
}
