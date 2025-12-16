import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";
import { TIMEZONE_DISCLAIMER } from "../../utils/invoiceUtils";

/**
 * Invoice Footer Component
 * Displays on every page at the bottom
 * Shows contact info, timezone disclaimer, and page numbers
 * Supports template-based styling for B&W printing
 */
const InvoiceFooter = ({
  company,
  pageNumber,
  totalPages,
  primaryColor,
  template = null,
}) => {
  const _color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  const textColor = colors.secondary || "#666";
  const fontFamily = fonts.body || "Inter, system-ui, sans-serif";

  return (
    <div
      className="invoice-footer"
      style={{
        fontFamily,
        marginTop: "30px",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: "15px",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: "11px",
            lineHeight: 1.6,
            color: textColor,
          }}
        >
          Phone: {company?.phone || "+971506061680"} | Email:{" "}
          {company?.email || "admin@company.com"} | Website:
          www.ultimatesteels.com
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            marginTop: "4px",
            fontStyle: "italic",
            color: textColor,
          }}
        >
          {TIMEZONE_DISCLAIMER}
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            marginTop: "8px",
            color: textColor,
          }}
        >
          Page: {pageNumber} / {totalPages}
        </p>
      </div>
    </div>
  );
};

export default InvoiceFooter;
