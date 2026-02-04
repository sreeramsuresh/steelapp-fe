import { DEFAULT_TEMPLATE_SETTINGS } from "../../constants/defaultTemplateSettings";
import { calculateTRN, formatNumber } from "../../utils/invoiceUtils";

/**
 * Get display name for invoice line item
 */
const getItemDisplayName = (item) => {
  const name = item.name || item.displayName || item.display_name || "";
  const origin = item.origin || item.productOrigin || "";

  if (!origin || origin.toUpperCase() === "UAE") {
    return name;
  }

  return `${name} - ${origin}`;
};

/**
 * Invoice Items Table Component
 * Displays line items for current page
 */
const InvoiceItemsTable = ({ items, startingIndex = 0, isFirstPage, isContinued, primaryColor, template = null }) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const layout = template?.layout || {};
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};

  const itemsStyle = layout.itemsStyle || "full-grid";
  const alternatingRows = layout.alternatingRows !== false;
  const headerBg = colors.primary || color;
  const borderColor = colors.border || "#e5e7eb";
  const accentColor = colors.accent || "#f9fafb";

  const isLightHeader = itemsStyle === "no-borders" || itemsStyle === "bold-header";
  const headerTextColor = isLightHeader ? colors.primary || color : "#ffffff";

  const getTableStyles = () => {
    switch (itemsStyle) {
      case "horizontal-lines":
        return {
          table: { borderCollapse: "collapse" },
          headerRow: {
            backgroundColor: headerBg,
            borderBottom: `2px solid ${headerBg}`,
          },
          headerCell: { border: "none", borderBottom: `2px solid ${headerBg}` },
          bodyRow: () => ({
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }),
          bodyCell: { border: "none" },
        };
      case "no-borders":
        return {
          table: { borderCollapse: "collapse" },
          headerRow: {
            backgroundColor: "transparent",
            borderBottom: `2px solid ${headerBg}`,
          },
          headerCell: { border: "none", fontWeight: "bold" },
          bodyRow: () => ({
            backgroundColor: "transparent",
          }),
          bodyCell: { border: "none", borderBottom: "1px solid #eeeeee" },
        };
      case "bold-header":
        return {
          table: {
            borderCollapse: "collapse",
            border: `1px solid ${borderColor}`,
          },
          headerRow: {
            backgroundColor: colors.headerBg || "#e0e0e0",
            borderBottom: `2px solid ${borderColor}`,
          },
          headerCell: {
            border: `1px solid ${borderColor}`,
            fontWeight: "bold",
          },
          bodyRow: (idx) => ({
            backgroundColor: alternatingRows && idx % 2 === 1 ? accentColor : "#ffffff",
          }),
          bodyCell: { border: `1px solid ${borderColor}` },
        };
      default:
        return {
          table: {
            borderCollapse: "collapse",
            border: `1px solid ${borderColor}`,
          },
          headerRow: { backgroundColor: headerBg },
          headerCell: { border: `1px solid ${borderColor}` },
          bodyRow: (idx) => ({
            backgroundColor: alternatingRows && idx % 2 === 1 ? accentColor : "#ffffff",
          }),
          bodyCell: { border: `1px solid ${borderColor}` },
        };
    }
  };

  const styles = getTableStyles();
  const fontFamily = fonts.body || "Inter, system-ui, sans-serif";

  return (
    <div className="invoice-items-table" style={{ fontFamily, marginBottom: "20px" }}>
      {isContinued && !isFirstPage && (
        <div
          style={{
            marginBottom: "8px",
            fontSize: "10px",
            fontStyle: "italic",
            color: colors.secondary || "#666",
          }}
        >
          (Continued from previous page)
        </div>
      )}

      <table style={{ ...styles.table, width: "100%", fontSize: "10px" }}>
        <thead>
          <tr style={styles.headerRow}>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "left",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "4%",
                color: headerTextColor,
              }}
            >
              Sr.
            </th>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "left",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "44%",
                color: headerTextColor,
              }}
            >
              Description
            </th>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "center",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "6%",
                color: headerTextColor,
              }}
            >
              Qty
            </th>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "right",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "10%",
                color: headerTextColor,
              }}
            >
              Unit Price
            </th>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "right",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "10%",
                color: headerTextColor,
              }}
            >
              Net Amt
            </th>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "right",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "16%",
                color: headerTextColor,
              }}
            >
              VAT
            </th>
            <th
              style={{
                ...styles.headerCell,
                padding: "12px 10px",
                textAlign: "right",
                fontSize: "10.5px",
                fontWeight: "bold",
                width: "10%",
                color: headerTextColor,
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((item, index) => {
            const amountNum = parseFloat(item.amount) || 0;
            const vatRate = parseFloat(item.vatRate) || 0;
            const vatAmount = calculateTRN(amountNum, vatRate);
            const totalWithVAT = amountNum + vatAmount;
            const globalIndex = startingIndex + index;

            return (
              <tr key={item.id || item.name || `item-${index}`} style={styles.bodyRow(index)}>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {globalIndex + 1}
                </td>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    fontWeight: 500,
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {getItemDisplayName(item)}
                </td>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    textAlign: "center",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {item.quantity || 0}
                </td>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    textAlign: "right",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {formatNumber(item.rate || 0)}
                </td>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    textAlign: "right",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {formatNumber(amountNum)}
                </td>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    textAlign: "right",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {formatNumber(vatAmount)} ({vatRate > 0 ? `${vatRate}%` : "0%"})
                </td>
                <td
                  style={{
                    ...styles.bodyCell,
                    padding: "12px 10px",
                    fontSize: "10px",
                    textAlign: "right",
                    fontWeight: 500,
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {formatNumber(totalWithVAT)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {itemsStyle !== "no-borders" && (
        <div
          style={{
            borderTop: "2px solid #d1d5db",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        ></div>
      )}
    </div>
  );
};

export default InvoiceItemsTable;
