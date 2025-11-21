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
 * Supports template-based styling for B&W printing
 */
const InvoiceTotalsSection = ({ invoice, primaryColor, template = null }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};
  const layout = template?.layout || {};

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

  // Get style based on template
  const fontFamily = fonts.body || 'Inter, system-ui, sans-serif';
  const textColor = colors.text || '#333333';
  const primaryTextColor = colors.primary || '#000000';
  const borderColor = colors.border || color;
  const compactMode = layout.compactMode || false;

  return (
    <div className="invoice-totals-section" style={{ fontFamily }}>
      {/* TOTALS SECTION */}
      <div className="flex justify-end mb-6">
        <div className={`${compactMode ? 'w-56' : 'w-64'} space-y-2 text-sm`} style={{ color: textColor }}>
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
          <div className="flex justify-between font-bold border-t pt-2" style={{
            borderColor,
            color: primaryTextColor,
          }}>
            <span>TOTAL</span>
            <span>AED {formatNumber(computedTotal)}</span>
          </div>
          {advanceAmount > 0 && (
            <>
              <div className="flex justify-between" style={{ color: colors.secondary || '#666666' }}>
                <span>Less: Advance Received</span>
                <span>- AED {formatNumber(advanceAmount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t-2 pt-2" style={{
                borderColor: primaryTextColor,
                color: primaryTextColor,
              }}>
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
