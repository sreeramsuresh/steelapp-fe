/**
 * ⚠️ PAYMENT LEDGER UTILITIES ⚠️
 *
 * Utilities for managing multiple payment installments and tracking
 * Supports unlimited installments with different payment modes
 */

// Payment mode configuration (UAE Standard Business Practices)
export const PAYMENT_MODES = {
  cash: {
    value: 'cash',
    label: 'Cash',
    icon: '💵',
    requiresRef: false,
    color: 'green'
  },
  cheque: {
    value: 'cheque',
    label: 'Cheque',
    icon: '🧾',
    requiresRef: true,
    refLabel: 'Cheque Number',
    color: 'blue'
  },
  pdc: {
    value: 'pdc',
    label: 'PDC (Post-Dated Cheque)',
    icon: '📅',
    requiresRef: true,
    refLabel: 'PDC Number',
    color: 'orange'
  },
  bank_transfer: {
    value: 'bank_transfer',
    label: 'Bank Transfer',
    icon: '🏦',
    requiresRef: true,
    refLabel: 'Transaction/Reference Number',
    color: 'teal'
  },
  credit_card: {
    value: 'credit_card',
    label: 'Credit Card',
    icon: '💳',
    requiresRef: true,
    refLabel: 'Transaction ID',
    color: 'purple'
  },
  debit_card: {
    value: 'debit_card',
    label: 'Debit Card',
    icon: '💳',
    requiresRef: true,
    refLabel: 'Transaction ID',
    color: 'indigo'
  },
  online: {
    value: 'online',
    label: 'Online Payment Gateway',
    icon: '🌐',
    requiresRef: true,
    refLabel: 'Transaction ID',
    color: 'cyan'
  },
  wire_transfer: {
    value: 'wire_transfer',
    label: 'Wire Transfer (International)',
    icon: '🌍',
    requiresRef: true,
    refLabel: 'Swift/Reference Number',
    color: 'blue'
  },
  mobile_wallet: {
    value: 'mobile_wallet',
    label: 'Mobile Wallet (Apple Pay/Google Pay)',
    icon: '📱',
    requiresRef: true,
    refLabel: 'Transaction ID',
    color: 'green'
  },
  other: {
    value: 'other',
    label: 'Other',
    icon: '📝',
    requiresRef: false,
    refLabel: 'Reference',
    color: 'gray'
  }
};

// Payment status configuration
export const PAYMENT_STATUS = {
  unpaid: {
    value: 'unpaid',
    label: 'UNPAID',
    color: 'red',
    bgLight: 'bg-red-100',
    bgDark: 'bg-red-900/30',
    textLight: 'text-red-800',
    textDark: 'text-red-300',
    borderLight: 'border-red-300',
    borderDark: 'border-red-600'
  },
  partially_paid: {
    value: 'partially_paid',
    label: 'PARTIALLY PAID',
    color: 'yellow',
    bgLight: 'bg-yellow-100',
    bgDark: 'bg-yellow-900/30',
    textLight: 'text-yellow-800',
    textDark: 'text-yellow-300',
    borderLight: 'border-yellow-300',
    borderDark: 'border-yellow-600'
  },
  fully_paid: {
    value: 'fully_paid',
    label: 'FULLY PAID',
    color: 'green',
    bgLight: 'bg-green-100',
    bgDark: 'bg-green-900/30',
    textLight: 'text-green-800',
    textDark: 'text-green-300',
    borderLight: 'border-green-300',
    borderDark: 'border-green-600'
  },
  overpaid: {
    value: 'overpaid',
    label: 'OVERPAID',
    color: 'blue',
    bgLight: 'bg-blue-100',
    bgDark: 'bg-blue-900/30',
    textLight: 'text-blue-800',
    textDark: 'text-blue-300',
    borderLight: 'border-blue-300',
    borderDark: 'border-blue-600'
  }
};

/**
 * Calculate total amount paid from payments array
 */
export const calculateTotalPaid = (payments = []) => {
  if (!Array.isArray(payments)) return 0;
  return payments.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount) || 0;
    return sum + amount;
  }, 0);
};

/**
 * Calculate balance due
 */
export const calculateBalanceDue = (invoiceTotal, payments = []) => {
  const total = parseFloat(invoiceTotal) || 0;
  const totalPaid = calculateTotalPaid(payments);
  return Math.max(0, total - totalPaid);
};

/**
 * Calculate payment status based on total paid vs invoice total
 */
export const calculatePaymentStatus = (invoiceTotal, payments = []) => {
  const total = parseFloat(invoiceTotal) || 0;
  const totalPaid = calculateTotalPaid(payments);

  if (total === 0) return 'unpaid';
  if (totalPaid === 0) return 'unpaid';
  if (totalPaid >= total) return 'fully_paid';
  return 'partially_paid';
};

/**
 * Get payment mode configuration
 */
export const getPaymentModeConfig = (modeValue) => {
  return PAYMENT_MODES[modeValue] || PAYMENT_MODES.other;
};

/**
 * Get payment status configuration
 */
export const getPaymentStatusConfig = (statusValue) => {
  return PAYMENT_STATUS[statusValue] || PAYMENT_STATUS.unpaid;
};

/**
 * Validate payment data
 */
export const validatePayment = (payment, invoiceTotal, existingPayments = []) => {
  const errors = [];

  // Amount validation
  if (!payment.amount || payment.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  // Date validation
  if (!payment.date) {
    errors.push('Payment date is required');
  }

  // Payment mode validation
  if (!payment.payment_mode) {
    errors.push('Payment mode is required');
  }

  // Reference number validation (for certain payment modes)
  const modeConfig = getPaymentModeConfig(payment.payment_mode);
  if (modeConfig.requiresRef && !payment.reference_number) {
    errors.push(`Reference number is required for ${modeConfig.label}`);
  }

  // Warning for amount exceeding balance (not an error, just a warning)
  const currentTotalPaid = calculateTotalPaid(existingPayments);
  const balanceDue = invoiceTotal - currentTotalPaid;
  if (payment.amount > balanceDue) {
    errors.push(`Warning: Amount exceeds balance due (${balanceDue.toFixed(2)})`);
  }

  return errors;
};

/**
 * Format payment for display
 */
export const formatPaymentDisplay = (payment) => {
  const modeConfig = getPaymentModeConfig(payment.payment_mode);
  return {
    ...payment,
    modeLabel: modeConfig.label,
    modeIcon: modeConfig.icon,
    formattedAmount: new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(payment.amount || 0),
    formattedDate: new Date(payment.date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  };
};

/**
 * Get last payment date
 */
export const getLastPaymentDate = (payments = []) => {
  if (!Array.isArray(payments) || payments.length === 0) return null;

  const sorted = [...payments].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  return sorted[0]?.date || null;
};

/**
 * Generate unique payment ID
 */
export const generatePaymentId = () => {
  return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
