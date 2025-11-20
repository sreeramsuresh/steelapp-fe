import React from 'react';
import {
  calculateSubtotal,
  calculateTotal,
  calculateDiscountedTRN,
  formatNumber,
} from '../../utils/invoiceUtils';
import { DEFAULT_TEMPLATE_SETTINGS } from '../../constants/defaultTemplateSettings';

/**
 * Invoice Totals Section Component
 * Displays subtotal, discount, VAT, total, advance, and balance due
 * ONLY SHOWN ON LAST PAGE
 */
const InvoiceTotalsSection = ({ invoice, primaryColor }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;

  // Compute summary values
  const computedSubtotal = calculateSubtotal(invoice.items || []);
  const computedVatAmount = calculateDiscountedTRN(
    invoice.items || [],
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount,
  );
  const additionalCharges =
    (parseFloat(invoice.packingCharges) || 0) +
    (parseFloat(invoice.freightCharges) || 0) +
    (parseFloat(invoice.loadingCharges) || 0) +
    (parseFloat(invoice.otherCharges) || 0);
  const discountPercent = parseFloat(invoice.discountPercentage) || 0;
  const discountFlat = parseFloat(invoice.discountAmount) || 0;
  const computedDiscount =
    (invoice.discountType === 'percentage'
      ? (computedSubtotal * discountPercent) / 100
      : discountFlat) || 0;
  const computedTotal = calculateTotal(
    Math.max(0, computedSubtotal - computedDiscount) + additionalCharges,
    computedVatAmount,
  );

  // Calculate advance and balance due
  const advanceAmount = parseFloat(invoice.advanceReceived) || 0;
  const balanceDue = Math.max(0, computedTotal - advanceAmount);

  return (
    <div className="invoice-totals-section">
      {/* TOTALS SECTION */}
      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>SubTotal</span>
            <span>AED {formatNumber(computedSubtotal)}</span>
          </div>
          {computedDiscount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>- AED {formatNumber(computedDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>VAT</span>
            <span>AED {formatNumber(computedVatAmount)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>TOTAL</span>
            <span>AED {formatNumber(computedTotal)}</span>
          </div>
          {advanceAmount > 0 && (
            <>
              <div className="flex justify-between text-red-600">
                <span>Less: Advance Received</span>
                <span>- AED {formatNumber(advanceAmount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t-2 pt-2" style={{ borderColor: color }}>
                <span>Balance Due</span>
                <span>AED {formatNumber(balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotalsSection;
