/**
 * Canonical Payment Type (camelCase only)
 * This is the NORMALIZED frontend schema after paymentNormalizer processes API data.
 * 
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The paymentNormalizer converts snake_case → camelCase.
 */

/**
 * Main Payment interface - CAMELCASE ONLY
 * All fields that exist after paymentNormalizer processing
 */
export interface Payment {
  // Core identifiers
  id: number;
  invoiceNumber?: string;

  // Payment details
  amount: number;
  paymentDate?: string;
  date?: string; // Alias for paymentDate

  // Payment method/mode
  paymentMethod?: string;
  paymentMode?: string;
  method?: string; // Alias for paymentMethod

  // Reference tracking
  referenceNumber?: string;
  reference?: string; // Alias for referenceNumber
  receiptNumber?: string;

  // Notes & metadata
  notes?: string;
  createdAt?: string;

  // Void tracking
  voided?: boolean;
  voidedAt?: string;

  // Multi-currency Payment Support (Phase 1 - Migration 103)
  // Enables FX tracking for international transactions
  currency?: string;           // ISO 4217 code (AED, USD, EUR, GBP, SAR)
  exchangeRate?: number;       // Exchange rate: 1 currency unit = X AED
  amountInAed?: number;        // Payment amount converted to AED for VAT reporting
}

/**
 * Type guard to check if object is a valid Payment
 */
export function isPayment(obj: unknown): obj is Payment {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.amount === 'number'
  );
}
