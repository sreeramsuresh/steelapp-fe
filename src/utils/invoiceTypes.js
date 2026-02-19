/**
 * Invoice and Payment Status Type Definitions
 *
 * CRITICAL: These are the ONLY allowed status values.
 * Any new status MUST be added here and all switch statements updated.
 *
 * Purpose: Prevent silent schema drift and catch unknown statuses early in dev.
 */

/**
 * @typedef {'draft' | 'pending' | 'proforma' | 'issued' | 'sent' | 'cancelled' | 'unspecified'} InvoiceStatus
 *
 * Allowed invoice statuses:
 * - draft: Invoice is being prepared
 * - pending: Invoice is pending (awaiting action)
 * - proforma: Proforma invoice (quote-like)
 * - sent: Invoice has been sent to customer (treated similar to issued)
 * - issued: Invoice has been finalized and issued
 * - cancelled: Invoice was cancelled and recreated
 * - unspecified: Default value (STATUS_UNSPECIFIED = 0), treated as draft
 */

/**
 * @typedef {'unpaid' | 'partially_paid' | 'paid' | 'fully_paid'} PaymentStatus
 *
 * Allowed payment statuses:
 * - unpaid: No payments received
 * - partially_paid: Some payments received, balance remains
 * - paid: Fully paid (current standard)
 * - fully_paid: Alias for paid (legacy support)
 */

/**
 * Valid invoice status values
 * Note: 'unspecified' is the default enum value (STATUS_UNSPECIFIED = 0), treated as 'draft'
 */
export const VALID_INVOICE_STATUSES = ["draft", "pending", "proforma", "issued", "sent", "cancelled", "unspecified"];

/**
 * Valid payment status values
 */
export const VALID_PAYMENT_STATUSES = ["unpaid", "partially_paid", "paid", "fully_paid"];

/**
 * Validate invoice status matches allowed enum
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
export function isValidInvoiceStatus(status) {
  return VALID_INVOICE_STATUSES.includes(status);
}

/**
 * Validate payment status matches allowed enum
 * @param {string} paymentStatus - Payment status to validate
 * @returns {boolean}
 */
export function isValidPaymentStatus(paymentStatus) {
  return VALID_PAYMENT_STATUSES.includes(paymentStatus);
}

/**
 * Assert invoice status is valid (dev-only)
 * Logs SCHEMA_MISMATCH error if status is not in allowed list
 *
 * @param {string} status - Invoice status
 * @param {string} context - Where this check is called from (for debugging)
 */
export function assertValidInvoiceStatus(status, context = "unknown") {
  if (process.env.NODE_ENV === "production") return;

  if (!isValidInvoiceStatus(status)) {
    console.error(`SCHEMA_MISMATCH[INVOICE_STATUS]: Unknown invoice status '${status}' in ${context}`, {
      receivedStatus: status,
      allowedStatuses: VALID_INVOICE_STATUSES,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Assert payment status is valid (dev-only)
 * Logs SCHEMA_MISMATCH error if payment status is not in allowed list
 *
 * @param {string} paymentStatus - Payment status
 * @param {string} context - Where this check is called from (for debugging)
 */
export function assertValidPaymentStatus(paymentStatus, context = "unknown") {
  if (process.env.NODE_ENV === "production") return;

  if (!isValidPaymentStatus(paymentStatus)) {
    console.error(`SCHEMA_MISMATCH[PAYMENT_STATUS]: Unknown payment status '${paymentStatus}' in ${context}`, {
      receivedStatus: paymentStatus,
      allowedStatuses: VALID_PAYMENT_STATUSES,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get user-friendly label for invoice status
 * @param {InvoiceStatus} status
 * @returns {string}
 */
export function getInvoiceStatusLabel(status) {
  switch (status) {
    case "draft":
      return "Draft";
    case "pending":
      return "Pending";
    case "proforma":
      return "Proforma";
    case "sent":
      return "Sent";
    case "issued":
      return "Issued";
    case "cancelled":
      return "Cancelled";
    default:
      console.error(`SCHEMA_MISMATCH[INVOICE_STATUS]: Unhandled status in getInvoiceStatusLabel: '${status}'`);
      return "Unknown";
  }
}

/**
 * Get user-friendly label for payment status
 * @param {PaymentStatus} paymentStatus
 * @returns {string}
 */
export function getPaymentStatusLabel(paymentStatus) {
  switch (paymentStatus) {
    case "unpaid":
      return "Unpaid";
    case "partially_paid":
      return "Partially Paid";
    case "paid":
    case "fully_paid":
      return "Paid";
    default:
      console.error(`SCHEMA_MISMATCH[PAYMENT_STATUS]: Unhandled status in getPaymentStatusLabel: '${paymentStatus}'`);
      return "Unknown";
  }
}
