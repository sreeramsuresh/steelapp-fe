import { toUAEDateProfessional } from "../../utils/invoiceUtils";
import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";

/**
 * Invoice Header Component
 * Displays on every page of the invoice
 * Shows company info and optionally invoice details on first page
 */
const InvoiceHeader = ({
  company,
  invoice,
  isFirstPage,
  primaryColor,
  template = null,
  documentType = "invoice",
}) => {
  const compAddr = company?.address || {};
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
    "http://localhost:3000";

  const docImageSettings = company?.settings?.documentImages?.[
    documentType
  ] || {
    showLogo: true,
    showSeal: true,
  };

  let companyLogo = null;
  if (docImageSettings.showLogo) {
    if (company?.pdfLogoUrl) {
      companyLogo = company.pdfLogoUrl.startsWith("/")
        ? `${baseUrl}${company.pdfLogoUrl}`
        : company.pdfLogoUrl;
    } else if (company?.logoUrl) {
      companyLogo = company.logoUrl.startsWith("/")
        ? `${baseUrl}${company.logoUrl}`
        : company.logoUrl;
    }
  }

  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const layout = template?.layout || {};
  const fonts = template?.fonts || {};
  const colors = template?.colors || {};

  const headerStyle = layout.headerStyle || "centered";
  const showLogo = layout.showLogo !== false && docImageSettings.showLogo;
  const showWatermark = layout.showWatermark === true;
  const fontFamily = fonts.heading || "Inter, system-ui, sans-serif";

  return (
    <div className="invoice-header" style={{ fontFamily }}>
      {showWatermark && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            fontSize: "72px",
            fontWeight: "bold",
            color: "rgba(0,0,0,0.03)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          INVOICE
        </div>
      )}

      <div
        className={`flex ${headerStyle === "centered" ? "flex-col items-center text-center" : "justify-between items-start"}`}
        style={{ marginBottom: "15px" }}
      >
        <div
          className={headerStyle === "centered" ? "mb-3" : ""}
          style={{ flex: 1 }}
        >
          <h1
            style={{
              fontSize: "16pt",
              fontWeight: "bold",
              color: colors.primary || "#111",
              fontFamily,
              marginBottom: "5px",
            }}
          >
            {company?.name || "Ultimate Steels Building Materials Trading"}
          </h1>
          <div
            style={{
              fontSize: "10pt",
              lineHeight: 1.6,
              color: "#555",
            }}
          >
            {compAddr.street && <p>{compAddr.street}</p>}
            {(compAddr.city || compAddr.country) && (
              <p>
                {[compAddr.city, compAddr.country].filter(Boolean).join(", ")}
              </p>
            )}
            {company?.phone && (
              <p>
                <strong>Mobile:</strong> {company.phone}
              </p>
            )}
            {company?.email && (
              <p>
                <strong>Email:</strong> {company.email}
              </p>
            )}
            <p style={{ fontWeight: 600, marginTop: "4px" }}>
              VAT Reg No: 104858252000003
            </p>
          </div>
        </div>

        {showLogo && companyLogo && (
          <div
            className={headerStyle === "centered" ? "mb-3" : ""}
            style={{ marginLeft: "20px" }}
          >
            <img
              src={companyLogo}
              alt="Company Logo"
              style={{ maxHeight: "100px", maxWidth: "300px" }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          borderTop:
            headerStyle === "letterhead"
              ? `3px double ${color}`
              : `2px solid ${color}`,
          marginBottom: "20px",
        }}
      ></div>

      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: colors.primary || color,
            color: "#ffffff",
            textAlign: "center",
            padding: "8px",
            fontSize: "14pt",
            fontWeight: "bold",
          }}
        >
          {invoice.status === "draft" && "DRAFT INVOICE"}
          {invoice.status === "proforma" && "PROFORMA INVOICE"}
          {(!invoice.status ||
            (invoice.status !== "draft" && invoice.status !== "proforma")) &&
            "TAX INVOICE"}
        </div>
      </div>

      {isFirstPage && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "25px",
            marginBottom: "20px",
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "13pt",
                fontWeight: "bold",
                color: colors.primary || "#111",
                marginBottom: "8px",
              }}
            >
              Invoice To:
            </h3>
            <div
              style={{
                fontSize: "10pt",
                lineHeight: 1.7,
                color: "#555",
              }}
            >
              {invoice.customer?.name && (
                <p style={{ fontWeight: 500 }}>{invoice.customer.name}</p>
              )}
              {invoice.customer?.address?.street && (
                <p>{invoice.customer.address.street}</p>
              )}
              {(invoice.customer?.address?.city ||
                invoice.customer?.address?.country) && (
                <p>
                  {[
                    invoice.customer.address.city,
                    invoice.customer.address.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {invoice.customer?.email && (
                <p>
                  <strong style={{ fontWeight: 600, color: "#333" }}>
                    Email:
                  </strong>{" "}
                  {invoice.customer.email}
                </p>
              )}
              {invoice.customer?.phone && (
                <p>Phone: {invoice.customer.phone}</p>
              )}
              {invoice.customer?.vatNumber && (
                <p>TRN: {invoice.customer.vatNumber}</p>
              )}
            </div>
          </div>

          <div
            style={{
              flex: "0 0 300px",
              border: `2px solid ${colors.primary || color}`,
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: colors.primary || color,
                color: "#ffffff",
                padding: "10px 15px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12pt",
                fontWeight: "bold",
              }}
            >
              <span>Invoice No:</span>
              <span>{invoice.invoiceNumber || ""}</span>
            </div>
            <div
              style={{
                padding: "15px",
                fontSize: "10pt",
                backgroundColor: "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontWeight: 600, color: "#333" }}>
                  Invoice Date:
                </span>
                <span style={{ textAlign: "right", color: "#555" }}>
                  {toUAEDateProfessional(invoice.date || new Date())}
                </span>
              </div>
              {invoice.customerPurchaseOrderNumber && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#333" }}>SO:</span>
                  <span style={{ textAlign: "right", color: "#555" }}>
                    {invoice.customerPurchaseOrderNumber}
                  </span>
                </div>
              )}
              {invoice.customerPurchaseOrderDate && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#333" }}>
                    Order Date:
                  </span>
                  <span style={{ textAlign: "right", color: "#555" }}>
                    {toUAEDateProfessional(invoice.customerPurchaseOrderDate)}
                  </span>
                </div>
              )}
              {invoice.dueDate && (
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontWeight: 600, color: "#333" }}>
                    Due Date:
                  </span>
                  <span style={{ textAlign: "right", color: "#555" }}>
                    {toUAEDateProfessional(invoice.dueDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isFirstPage && invoice.currency && invoice.currency !== "AED" && (
        <div
          style={{
            backgroundColor: "#f0f9ff",
            borderLeft: `3px solid ${colors.primary || color}`,
            padding: "10px",
            marginTop: "10px",
            fontSize: "11pt",
            color: "#111",
          }}
        >
          <span style={{ fontStyle: "italic" }}>
            Exchange Rate: 1 {invoice.currency} = {invoice.exchangeRate || 1}{" "}
            AED
          </span>
        </div>
      )}
    </div>
  );
};

export default InvoiceHeader;
