/**
 * Payment Service - Standard payment payload handling
 * Ensures consistent camelCase field names for API Gateway auto-conversion
 *
 * Architecture:
 * Frontend (camelCase) -> API Gateway (auto-converts) -> gRPC Backend (snake_case)
 *
 * This service ensures all payment-related components use the same field names
 * so the API Gateway middleware can reliably convert them.
 */

/**
 * Standard payment payload structure (camelCase for frontend)
 * API Gateway middleware converts to snake_case automatically:
 * - paymentMethod -> payment_method
 * - paymentDate -> payment_date
 * - referenceNumber -> reference_number
 * - exchangeRate -> exchange_rate (Phase 1)
 * - amountInAed -> amount_in_aed (Phase 1)
 *
 * @param {Object} params - Payment parameters
 * @param {number|string} params.amount - Payment amount
 * @param {string} params.paymentMethod - Payment method (cash, bank_transfer, cheque, etc.)
 * @param {string} params.paymentDate - Payment date (YYYY-MM-DD format)
 * @param {string} [params.referenceNumber] - Reference/transaction number
 * @param {string} [params.notes] - Additional notes
 * @param {string} [params.currency] - Currency code (AED, USD, EUR, GBP, SAR, INR)
 * @param {number} [params.exchangeRate] - Exchange rate to AED (1 currency = X AED)
 * @param {number} [params.amountInAed] - Amount converted to AED for VAT reporting
 * @returns {Object} Standardized payment payload
 */
export const createPaymentPayload = ({
  amount,
  paymentMethod,
  paymentDate,
  referenceNumber = '',
  notes = '',
  // Phase 1: Multi-currency fields
  currency = 'AED',
  exchangeRate = 1.0,
  amountInAed = null,
}) => ({
  amount: Number(amount),
  paymentMethod,
  paymentDate,
  referenceNumber,
  notes,
  // Phase 1: Multi-currency fields for FX tracking
  currency,
  exchangeRate: currency === 'AED' ? 1.0 : Number(exchangeRate),
  amountInAed: currency === 'AED' ? Number(amount) : (amountInAed ?? Number(amount) * Number(exchangeRate)),
});

/**
 * Payment method options for UI dropdowns
 * Values match what API Gateway expects (will be converted to proto enum)
 */
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'pdc', label: 'PDC (Post-Dated Cheque)' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'online', label: 'Online Payment Gateway' },
  { value: 'wire_transfer', label: 'Wire Transfer (International)' },
  { value: 'mobile_wallet', label: 'Mobile Wallet (Apple Pay/Google Pay)' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

/**
 * Validate payment payload before submission
 * @param {Object} payment - Payment payload
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePayment = (payment) => {
  const errors = [];

  if (!payment.amount || payment.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!payment.paymentMethod) {
    errors.push('Payment method is required');
  }

  if (!payment.paymentDate) {
    errors.push('Payment date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Normalize a payment object from various sources to standard camelCase format
 * Handles different field name variations from API responses or legacy code
 *
 * @param {Object} payment - Raw payment object from any source
 * @returns {Object} Normalized payment with camelCase field names
 */
export const normalizePayment = (payment) => {
  if (!payment) return null;

  return {
    id: payment.id,
    amount: Number(payment.amount) || 0,
    // Handle various method field names
    paymentMethod: payment.paymentMethod || payment.payment_method || payment.method || payment.paymentMode || 'other',
    // Handle various date field names
    paymentDate: payment.paymentDate || payment.payment_date || payment.date || null,
    // Handle various reference field names
    referenceNumber: payment.referenceNumber || payment.reference_number || payment.referenceNo || '',
    notes: payment.notes || '',
    // Preserve additional fields that might be present
    voided: payment.voided || false,
    voidedAt: payment.voidedAt || payment.voided_at || null,
    createdAt: payment.createdAt || payment.created_at || null,
    // VAT Compliance Fields (Migration 113-114)
    receiptNumber: payment.receiptNumber || payment.receipt_number || null,
    compositeReference: payment.compositeReference || payment.composite_reference || null,
    receiptStatus: payment.receiptStatus || payment.receipt_status || 'draft',
    isAdvancePayment: payment.isAdvancePayment || payment.is_advance_payment || false,
    remarks: payment.remarks || '',
    // Phase 1: Multi-currency fields
    currency: payment.currency || 'AED',
    exchangeRate: Number(payment.exchangeRate || payment.exchange_rate) || 1.0,
    amountInAed: Number(payment.amountInAed || payment.amount_in_aed) || Number(payment.amount) || 0,
  };
};

/**
 * Get receipt details for a payment
 * Extracts receipt-related information for display/printing
 *
 * @param {Object} payment - Payment object with receipt details
 * @returns {Object} Receipt details object
 */
export const getReceiptDetails = (payment) => {
  if (!payment?.receiptNumber) return null;

  return {
    receiptNumber: payment.receiptNumber || payment.receipt_number,
    compositeReference: payment.compositeReference || payment.composite_reference,
    receiptStatus: payment.receiptStatus || payment.receipt_status || 'draft',
    isAdvancePayment: payment.isAdvancePayment || payment.is_advance_payment || false,
    remarks: payment.remarks || '',
    paymentDate: payment.paymentDate || payment.payment_date,
    amount: payment.amount,
    currency: payment.currency || 'AED',
    exchangeRate: Number(payment.exchangeRate || payment.exchange_rate) || 1.0,
    amountInAed: Number(payment.amountInAed || payment.amount_in_aed) || Number(payment.amount) || 0,
  };
};

/**
 * Format receipt number for display (RCP-YYYY-NNNN)
 * Validates and normalizes receipt number format
 *
 * @param {string} receiptNumber - Receipt number string
 * @returns {string|null} Formatted receipt number or null if invalid
 */
export const formatReceiptNumber = (receiptNumber) => {
  if (!receiptNumber) return null;
  
  // Already formatted
  if (/^RCP-\d{4}-\d{4}$/.test(receiptNumber)) {
    return receiptNumber;
  }
  
  // Try to extract from composite reference (INV-YYYY-NNNN-RCP-YYYY-NNNN)
  const match = receiptNumber.match(/RCP-(\d{4})-(\d{4})/);
  if (match) {
    return `RCP-${match[1]}-${match[2]}`;
  }
  
  return null;
};

/**
 * Extract composite reference for audit trail
 * Format: INV-YYYY-NNNN-RCP-YYYY-NNNN
 *
 * @param {Object} payment - Payment with composite reference
 * @param {Object} invoice - Invoice object (fallback)
 * @returns {string|null} Composite reference for audit trail
 */
export const getCompositeReference = (payment, invoice = null) => {
  if (payment?.compositeReference || payment?.composite_reference) {
    return payment.compositeReference || payment.composite_reference;
  }
  
  // Fallback: construct from invoice and receipt
  if (invoice?.invoiceNumber && payment?.receiptNumber) {
    return `${invoice.invoiceNumber}-${formatReceiptNumber(payment.receiptNumber)}`;
  }
  
  return null;
};

export default {
  createPaymentPayload,
  validatePayment,
  normalizePayment,
  PAYMENT_METHOD_OPTIONS,
};
