// ═══════════════════════════════════════════════════════════════
// DOCUMENT CALCULATOR HOOK (Rule 5 & 6)
// Centralized calculation logic for all document types
// VAT calculations follow UAE FTA rounding rules
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import {
  DocumentState,
  LineItem,
  ChargeItem,
  DocumentDiscount,
  CalculatorResult,
  LineCalculation,
  CalculatorOptions,
} from '../../config/documents/types';

const DEFAULT_OPTIONS: CalculatorOptions = {
  vatInclusive: false,
  roundingMode: 'per-line',
  currencyPrecision: 2,
  discountBeforeVat: true, // UAE standard: discount first, then VAT
};

/**
 * Round to specified precision (UAE FTA requires 2 decimal places)
 */
function round(value: number, precision: number = 2): number {
  return parseFloat(value.toFixed(precision));
}

/**
 * Calculate VAT/TRN amount with UAE FTA rounding
 */
function calculateVAT(amount: number, vatRate: number): number {
  const rate = parseFloat(String(vatRate)) || 0;
  return round((amount * rate) / 100);
}

/**
 * Calculate line item amounts (per-line rounding)
 */
function calculateLineItem(line: LineItem, options: CalculatorOptions): LineCalculation {
  const quantity = parseFloat(String(line.quantity)) || 0;
  const rate = parseFloat(String(line.rate)) || 0;
  const discountPercent = parseFloat(String(line.discountPercent)) || 0;
  const vatRate = parseFloat(String(line.vatRate)) || 0;

  // Base amount (quantity × rate)
  let amount = round(quantity * rate, options.currencyPrecision);

  // Line discount (if enabled)
  let discountAmount = 0;
  if (discountPercent > 0) {
    discountAmount = round((amount * discountPercent) / 100, options.currencyPrecision);
    amount = round(amount - discountAmount, options.currencyPrecision);
  }

  // VAT calculation (after discount per UAE rules)
  const vatAmount = calculateVAT(amount, vatRate);

  // Net amount (amount + VAT if inclusive, otherwise just amount)
  const netAmount = options.vatInclusive
    ? round(amount + vatAmount, options.currencyPrecision)
    : amount;

  return {
    amount,
    vatAmount,
    discountAmount,
    netAmount,
  };
}

/**
 * Calculate charge item VAT
 */
function calculateChargeVAT(charge: ChargeItem, options: CalculatorOptions): number {
  const amount = parseFloat(String(charge.amount)) || 0;
  const vatRate = parseFloat(String(charge.vatRate)) || 0;
  return calculateVAT(amount, vatRate);
}

/**
 * Calculate invoice-level discount and resulting VAT adjustment
 */
function calculateInvoiceDiscount(
  lines: LineItem[],
  discount: DocumentDiscount,
  subtotal: number,
  options: CalculatorOptions,
): { discountAmount: number; vatAmount: number } {
  const discountValue = parseFloat(String(discount.value)) || 0;

  if (discountValue === 0 || lines.length === 0) {
    return { discountAmount: 0, vatAmount: 0 };
  }

  let discountAmount = 0;

  if (discount.type === 'percent') {
    // Percentage-based discount
    discountAmount = round((subtotal * discountValue) / 100, options.currencyPrecision);
  } else {
    // Amount-based discount (cap at subtotal)
    discountAmount = Math.min(discountValue, subtotal);
  }

  // Recalculate VAT after discount (proportional allocation)
  let vatSum = 0;

  if (subtotal > 0) {
    for (const line of lines) {
      const lineAmount = parseFloat(String(line.amount)) || 0;
      const lineShare = lineAmount / subtotal;
      const lineDiscount = round(discountAmount * lineShare, options.currencyPrecision);
      const netLineAmount = round(Math.max(0, lineAmount - lineDiscount), options.currencyPrecision);
      const lineVatRate = parseFloat(String(line.vatRate)) || 0;
      vatSum += calculateVAT(netLineAmount, lineVatRate);
    }
  }

  return {
    discountAmount: round(discountAmount, options.currencyPrecision),
    vatAmount: round(vatSum, options.currencyPrecision),
  };
}

/**
 * Main calculator hook
 */
export function useDocumentCalculator(
  document: DocumentState,
  options: Partial<CalculatorOptions> = {},
): CalculatorResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return useMemo(() => {
    const lines = document.lines || [];
    const charges = document.charges || [];
    const discount = document.discount || { type: 'amount', value: 0 };
    const exchangeRate = parseFloat(String(document.header.exchangeRate)) || 1;

    // Calculate line items
    const lineCalculations = lines.map((line) => calculateLineItem(line, opts));

    // Subtotal (sum of line amounts before invoice discount)
    const subtotal = round(
      lineCalculations.reduce((sum, calc) => sum + calc.amount, 0),
      opts.currencyPrecision,
    );

    // Line VAT (before invoice discount)
    const lineVAT = round(
      lineCalculations.reduce((sum, calc) => sum + calc.vatAmount, 0),
      opts.currencyPrecision,
    );

    // Invoice-level discount and adjusted VAT
    const discountCalc = calculateInvoiceDiscount(lines, discount, subtotal, opts);

    // Charges
    const chargesTotal = round(
      charges.reduce((sum, charge) => sum + (parseFloat(String(charge.amount)) || 0), 0),
      opts.currencyPrecision,
    );

    const chargesVat = round(
      charges.reduce((sum, charge) => sum + calculateChargeVAT(charge, opts), 0),
      opts.currencyPrecision,
    );

    // Total VAT (adjusted for discount + charges VAT)
    const vatAmount = round(discountCalc.vatAmount + chargesVat, opts.currencyPrecision);

    // Final total
    const total = round(
      subtotal - discountCalc.discountAmount + chargesTotal + vatAmount,
      opts.currencyPrecision,
    );

    // Total in AED (for foreign currency invoices)
    const totalAed = round(total * exchangeRate, opts.currencyPrecision);

    return {
      lineAmounts: lineCalculations,
      subtotal,
      discountAmount: discountCalc.discountAmount,
      chargesTotal,
      chargesVat,
      vatAmount,
      total,
      totalAed,
    };
  }, [document, opts]);
}

/**
 * Calculate a single line item (for real-time updates)
 */
export function calculateLine(
  quantity: number,
  rate: number,
  discountPercent: number = 0,
  vatRate: number = 0,
  options: Partial<CalculatorOptions> = {},
): LineCalculation {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const line: LineItem = {
    id: 'temp',
    productId: null,
    productName: '',
    description: '',
    quantity,
    unit: '',
    rate,
    amount: 0,
    vatRate,
    vatAmount: 0,
    discountPercent,
    discountAmount: 0,
  };

  return calculateLineItem(line, opts);
}

/**
 * Calculate charge VAT amount
 */
export function calculateChargeVATAmount(
  amount: number,
  vatRate: number,
  options: Partial<CalculatorOptions> = {},
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return calculateVAT(amount, vatRate);
}

/**
 * Format currency with proper precision
 */
export function formatCurrency(
  value: number,
  currency: string = 'AED',
  precision: number = 2,
): string {
  return `${currency} ${value.toFixed(precision)}`;
}

/**
 * Validate discount value (returns error message or null)
 */
export function validateDiscount(
  discount: DocumentDiscount,
  subtotal: number,
): string | null {
  const value = parseFloat(String(discount.value)) || 0;

  if (value < 0) {
    return 'Discount cannot be negative';
  }

  if (discount.type === 'percent' && value > 100) {
    return 'Percentage discount cannot exceed 100%';
  }

  if (discount.type === 'amount' && value > subtotal) {
    return 'Discount amount cannot exceed subtotal';
  }

  return null;
}

export default useDocumentCalculator;
