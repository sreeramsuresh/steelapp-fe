import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";
import { calculateDiscountedTRN, calculateSubtotal, calculateTotal, formatNumber } from "../../utils/invoiceUtils";

/**
 * Invoice Totals Section Component
 * Displays subtotal, discount, VAT, total, advance, and balance due
 * ONLY SHOWN ON LAST PAGE
 */
const InvoiceTotalsSection = ({ invoice, primaryColor, template = null }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  // Compute summary values
  const computedSubtotal = calculateSubtotal(invoice.items || []);
  const computedVatAmount = calculateDiscountedTRN(
    invoice.items || [],
    invoice.discountType,
    invoice.discountPercentage,
    invoice.discountAmount
  );
  const additionalCharges =
    (parseFloat(invoice.packingCharges) || 0) +
    (parseFloat(invoice.freightCharges) || 0) +
    (parseFloat(invoice.loadingCharges) || 0) +
    (parseFloat(invoice.otherCharges) || 0);
  const discountPercent = parseFloat(invoice.discountPercentage) || 0;
  const discountFlat = parseFloat(invoice.discountAmount) || 0;
  const computedDiscount =
    (invoice.discountType === "percentage" ? (computedSubtotal * discountPercent) / 100 : discountFlat) || 0;
  const computedTotal = calculateTotal(
    Math.max(0, computedSubtotal - computedDiscount) + additionalCharges,
    computedVatAmount
  );

  // Calculate advance and balance due
  const advanceAmount = parseFloat(invoice.advanceReceived) || 0;
  const balanceDue = Math.max(0, computedTotal - advanceAmount);

  const fontFamily = fonts.body || "Inter, system-ui, sans-serif";

  return (
    <div className="invoice-totals-section" style={{ fontFamily }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "280px",
            padding: "8px 10px",
            backgroundColor: "#f9fafb",
            borderRadius: "4px",
          }}
        >
          {/* SubTotal */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
              fontSize: "10pt",
              padding: "2px 0",
            }}
          >
            <span style={{ color: "#555", fontWeight: 500 }}>SubTotal</span>
            <span style={{ textAlign: "right", color: "#333", fontWeight: 500 }}>
              AED {formatNumber(computedSubtotal)}
            </span>
          </div>

          {/* Discount */}
          {computedDiscount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
                fontSize: "10pt",
                padding: "2px 0",
              }}
            >
              <span style={{ color: "#555", fontWeight: 500 }}>Discount</span>
              <span style={{ textAlign: "right", color: "#333", fontWeight: 500 }}>
                - AED {formatNumber(computedDiscount)}
              </span>
            </div>
          )}

          {/* VAT */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
              fontSize: "10pt",
              padding: "2px 0",
            }}
          >
            <span style={{ color: "#555", fontWeight: 500 }}>VAT</span>
            <span style={{ textAlign: "right", color: "#333", fontWeight: 500 }}>
              AED {formatNumber(computedVatAmount)}
            </span>
          </div>

          {/* TOTAL */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: `2px solid ${colors.primary || color}`,
              paddingTop: "6px",
              marginTop: "4px",
              fontSize: "10pt",
              fontWeight: "bold",
            }}
          >
            <span>TOTAL</span>
            <span style={{ textAlign: "right" }}>AED {formatNumber(computedTotal)}</span>
          </div>

          {/* Advance and Balance Due */}
          {advanceAmount > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "2px solid #d1d5db",
                  paddingTop: "6px",
                  marginTop: "4px",
                  fontSize: "10pt",
                  color: colors.primary || color,
                }}
              >
                <span>Less: Advance Received</span>
                <span style={{ textAlign: "right" }}>- AED {formatNumber(advanceAmount)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                  fontSize: "10pt",
                  fontWeight: "bold",
                  color: balanceDue > 0 ? "#dc2626" : "#059669",
                }}
              >
                <span>Balance Due</span>
                <span style={{ textAlign: "right" }}>AED {formatNumber(balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotalsSection;
