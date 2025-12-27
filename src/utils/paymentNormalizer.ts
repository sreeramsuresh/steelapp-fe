/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Frontend Payment Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes payment data from API
 */

/**
 * Convert snake_case API response to camelCase Payment object
 * @param rawPayment - Raw payment data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized Payment with camelCase fields
 */
export function normalizePayment(
  rawPayment: any,
  source = 'unknown',
): any | null {
  if (!rawPayment || typeof rawPayment !== 'object') {
    console.error(
      `❌ [Payment Normalizer] Invalid payment data from ${source}:`,
      rawPayment,
    );
    return null;
  }

  try {
    // Helper to safely parse numbers
    const parseNumber = (
      value: any,
      fallback: any = undefined,
    ): number | undefined => {
      if (value === null || value === undefined) return fallback;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    };

    // Helper to safely parse dates
    const parseDate = (value: any): string | undefined => {
      if (!value) return undefined;

      // Handle Timestamp objects from Firestore/backend
      if (value?.seconds) {
        return new Date(parseInt(value.seconds) * 1000).toISOString();
      }

      // Handle string dates
      if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      return undefined;
    };

    // Build the normalized Payment object
    const normalized: any = {
      // Core identifiers
      id: rawPayment.id || 0,
      invoiceNumber:
        rawPayment.invoiceNumber || rawPayment.invoice_number || undefined,

      // Payment details
      amount: parseNumber(rawPayment.amount, 0),
      paymentDate: parseDate(rawPayment.paymentDate || rawPayment.payment_date),
      date: parseDate(
        rawPayment.date || rawPayment.paymentDate || rawPayment.payment_date,
      ),

      // Payment method/mode
      paymentMethod:
        rawPayment.paymentMethod || rawPayment.payment_method || undefined,
      paymentMode:
        rawPayment.paymentMode || rawPayment.payment_mode || undefined,
      method:
        rawPayment.method ||
        rawPayment.paymentMethod ||
        rawPayment.payment_method ||
        undefined,

      // Reference tracking
      referenceNumber:
        rawPayment.referenceNumber || rawPayment.reference_number || undefined,
      reference:
        rawPayment.reference ||
        rawPayment.referenceNumber ||
        rawPayment.reference_number ||
        undefined,
      receiptNumber:
        rawPayment.receiptNumber || rawPayment.receipt_number || undefined,
      receiptGenerated: Boolean(
        rawPayment.receipt_generated || rawPayment.receiptGenerated,
      ),

      // Notes & metadata
      notes: rawPayment.notes || undefined,
      createdAt: parseDate(rawPayment.createdAt || rawPayment.created_at),
      updatedAt: parseDate(rawPayment.updatedAt || rawPayment.updated_at),
      createdBy: rawPayment.created_by || rawPayment.createdBy || undefined,
      updatedBy: rawPayment.updated_by || rawPayment.updatedBy || undefined,

      // Void tracking (4 fields)
      voided: Boolean(rawPayment.voided),
      voidedAt: parseDate(rawPayment.voidedAt || rawPayment.voided_at),
      voidedBy: rawPayment.voided_by || rawPayment.voidedBy || undefined,
      voidReason: rawPayment.void_reason || rawPayment.voidReason || undefined,
    };

    return normalized;
  } catch (error) {
    console.error(
      `❌ [Payment Normalizer] Failed to normalize payment from ${source}:`,
      error,
    );
    console.error('   Raw data:', rawPayment);
    return null;
  }
}

/**
 * Normalize array of payments
 * @param rawPayments - Array of raw payment data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized Payment objects
 */
export function normalizePayments(rawPayments: any[], source = 'list'): any[] {
  if (!Array.isArray(rawPayments)) {
    console.error(
      `❌ [Payment Normalizer] Expected array, got ${typeof rawPayments}`,
    );
    return [];
  }

  return rawPayments
    .map((payment, index) => normalizePayment(payment, `${source}[${index}]`))
    .filter((payment): payment is any => payment !== null);
}
