import { getPaymentStatusConfig } from "./paymentUtils";
import {
  REMINDER_CONFIG,
  calculateDaysUntilDue,
  getReminderType,
} from "./reminderUtils";
import {
  assertValidInvoiceStatus,
  assertValidPaymentStatus,
} from "./invoiceTypes";

/**
 * Invoice Status Configurations
 */
export const INVOICE_STATUS_CONFIG = {
  draft: {
    label: "DRAFT INVOICE",
    bgLight: "bg-gray-100",
    bgDark: "bg-gray-900/30",
    textLight: "text-gray-800",
    textDark: "text-gray-300",
    borderLight: "border-gray-300",
    borderDark: "border-gray-600",
  },
  proforma: {
    label: "PROFORMA INVOICE",
    bgLight: "bg-blue-100",
    bgDark: "bg-blue-900/30",
    textLight: "text-blue-800",
    textDark: "text-blue-300",
    borderLight: "border-blue-300",
    borderDark: "border-blue-600",
  },
  sent: {
    label: "SENT",
    bgLight: "bg-blue-100",
    bgDark: "bg-blue-900/30",
    textLight: "text-blue-800",
    textDark: "text-blue-300",
    borderLight: "border-blue-300",
    borderDark: "border-blue-600",
  },
  issued: {
    label: "ISSUED",
    bgLight: "bg-green-100",
    bgDark: "bg-green-900/30",
    textLight: "text-green-800",
    textDark: "text-green-300",
    borderLight: "border-green-300",
    borderDark: "border-green-600",
  },
  overdue: {
    label: "OVERDUE",
    bgLight: "bg-red-100",
    bgDark: "bg-red-900/30",
    textLight: "text-red-800",
    textDark: "text-red-300",
    borderLight: "border-red-300",
    borderDark: "border-red-600",
  },
};

/**
 * Promise indicator configurations based on promise timing
 */
const getPromiseConfig = (daysUntilPromised) => {
  if (daysUntilPromised >= 7) {
    return {
      label: "Customer Promised",
      icon: "💬",
      bgLight: "bg-blue-50",
      bgDark: "bg-blue-900/20",
      textLight: "text-blue-700",
      textDark: "text-blue-300",
      borderLight: "border-blue-200",
      borderDark: "border-blue-800",
    };
  } else if (daysUntilPromised >= 1) {
    return {
      label: "Customer Promised",
      icon: "💬",
      bgLight: "bg-purple-50",
      bgDark: "bg-purple-900/20",
      textLight: "text-purple-700",
      textDark: "text-purple-300",
      borderLight: "border-purple-200",
      borderDark: "border-purple-800",
    };
  } else if (daysUntilPromised === 0) {
    return {
      label: "Customer Promised Today",
      icon: "💬",
      bgLight: "bg-indigo-50",
      bgDark: "bg-indigo-900/20",
      textLight: "text-indigo-700",
      textDark: "text-indigo-300",
      borderLight: "border-indigo-200",
      borderDark: "border-indigo-800",
    };
  } else {
    return {
      label: "Promise Broken",
      icon: "💬",
      bgLight: "bg-red-50",
      bgDark: "bg-red-900/20",
      textLight: "text-red-700",
      textDark: "text-red-300",
      borderLight: "border-red-200",
      borderDark: "border-red-800",
    };
  }
};

/**
 * Format days message for reminders and promises
 */
const formatDaysMessage = (days, type = "reminder") => {
  if (days === 0) {
    return type === "promise" ? "Promised Today" : "Due Today";
  }
  if (days > 0) {
    const prefix = type === "promise" ? "Promised" : "Payment due";
    return days === 1 ? `${prefix} in 1 day` : `${prefix} in ${days} days`;
  }

  const overdueDays = Math.abs(days);
  if (type === "promise") {
    return overdueDays === 1
      ? "Promise 1 day late"
      : `Promise ${overdueDays} days late`;
  }
  return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
};

/**
 * Get invoice status badge config
 */
function getInvoiceStatusBadge(invoice) {
  let status = invoice.status || "draft";

  // Handle proto enum default value (STATUS_UNSPECIFIED = 0 -> 'unspecified')
  if (status === "unspecified") {
    status = "draft";
  }

  // DEV-ONLY: Assert status is valid
  assertValidInvoiceStatus(status, "getInvoiceStatusBadge");

  // Exhaustive switch with runtime check
  let config;
  switch (status) {
    case "pending":
    case "draft":
      config = INVOICE_STATUS_CONFIG.draft;
      break;
    case "proforma":
      config = INVOICE_STATUS_CONFIG.proforma;
      break;
    case "sent":
      config = INVOICE_STATUS_CONFIG.sent;
      break;
    case "issued":
      config = INVOICE_STATUS_CONFIG.issued;
      break;
    case "cancelled":
      // Cancelled invoices use overdue styling (red)
      config = INVOICE_STATUS_CONFIG.overdue;
      break;
    default:
      // This should never happen if assertValidInvoiceStatus works
      console.error(
        `SCHEMA_MISMATCH[INVOICE_STATUS]: Unhandled invoice status in switch: '${status}'`,
      );
      config = INVOICE_STATUS_CONFIG.draft; // Fallback
      break;
  }

  return {
    type: "invoice_status",
    label: config.label,
    config,
  };
}

/**
 * Get payment status badge config (only for issued invoices)
 */
function getPaymentStatusBadge(invoice) {
  if (invoice.status !== "issued") return null;

  // invoiceService transforms snake_case to camelCase
  const paymentStatus = invoice.paymentStatus || "unpaid";

  // DEV-ONLY: Assert payment status is valid
  assertValidPaymentStatus(paymentStatus, "getPaymentStatusBadge");

  // Get config with exhaustive handling
  let config;
  switch (paymentStatus) {
    case "unpaid":
      config = getPaymentStatusConfig("unpaid");
      break;
    case "partially_paid":
      config = getPaymentStatusConfig("partially_paid");
      break;
    case "paid":
    case "fully_paid": // Alias
      config = getPaymentStatusConfig("paid");
      break;
    default:
      console.error(
        `SCHEMA_MISMATCH[PAYMENT_STATUS]: Unhandled payment status in switch: '${paymentStatus}'`,
      );
      config = getPaymentStatusConfig("unpaid"); // Fallback
      break;
  }

  return {
    type: "payment_status",
    label: config.label,
    config,
  };
}

/**
 * Check if reminder should be shown
 */
function shouldShowReminder(invoice) {
  // Only for issued invoices
  if (invoice.status !== "issued") return false;

  // Only for unpaid or partially paid (camelCase from invoiceService)
  const paymentStatus = invoice.paymentStatus || "unpaid";

  // DEV-ONLY: Validate payment status
  assertValidPaymentStatus(paymentStatus, "shouldShowReminder");

  // Exhaustive check
  switch (paymentStatus) {
    case "paid":
    case "fully_paid":
      return false;
    case "unpaid":
    case "partially_paid":
      return true;
    default:
      console.error(
        `SCHEMA_MISMATCH[PAYMENT_STATUS]: Unexpected payment status in shouldShowReminder: '${paymentStatus}'`,
      );
      return false;
  }
}

/**
 * Get reminder badge config
 */
function getReminderBadge(invoice) {
  if (!shouldShowReminder(invoice)) return null;

  // Use camelCase field from invoiceService
  const daysUntilDue = calculateDaysUntilDue(invoice.dueDate);
  const reminderType = getReminderType(daysUntilDue);
  const config = REMINDER_CONFIG[reminderType];
  const message = formatDaysMessage(daysUntilDue, "reminder");

  return {
    type: "reminder",
    label: message,
    icon: config.icon,
    config,
    title: `${config.label}: ${message}`,
  };
}

/**
 * Check if promise should be shown
 */
function shouldShowPromise(invoice) {
  // Only for issued invoices
  if (invoice.status !== "issued") return false;

  // Must have a promiseDate (camelCase from invoiceService)
  if (!invoice.promiseDate) return false;

  // Only for unpaid or partially paid (camelCase from invoiceService)
  const paymentStatus = invoice.paymentStatus || "unpaid";
  if (paymentStatus === "paid" || paymentStatus === "fully_paid") return false;

  return true;
}

/**
 * Get promise badge config
 */
function getPromiseBadge(invoice) {
  if (!shouldShowPromise(invoice)) return null;

  // Use camelCase field from invoiceService
  const daysUntilPromised = calculateDaysUntilDue(invoice.promiseDate);
  const config = getPromiseConfig(daysUntilPromised);
  const message = formatDaysMessage(daysUntilPromised, "promise");

  return {
    type: "promise",
    label: message,
    icon: config.icon,
    config,
    title: `${config.label}: ${message}`,
  };
}

/**
 * Main orchestrator function
 * Determines which status badges should be displayed for an invoice
 *
 * @param {Object} invoice - Invoice object from backend
 * @returns {Array} - Array of badge configs to render
 */
export function getInvoiceStatusBadges(invoice) {
  const badges = [];

  // 1. Always show invoice status (draft, issued, etc.)
  badges.push(getInvoiceStatusBadge(invoice));

  // 2. Show payment status ONLY for issued invoices
  const paymentBadge = getPaymentStatusBadge(invoice);
  if (paymentBadge) {
    badges.push(paymentBadge);
  }

  // 3. Show reminder ONLY for issued + unpaid/partially paid
  const reminderBadge = getReminderBadge(invoice);
  if (reminderBadge) {
    badges.push(reminderBadge);
  }

  // 4. Show promise ONLY if customer made a promise
  const promiseBadge = getPromiseBadge(invoice);
  if (promiseBadge) {
    badges.push(promiseBadge);
  }

  return badges.filter(Boolean);
}
