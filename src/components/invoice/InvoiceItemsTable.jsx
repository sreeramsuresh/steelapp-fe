import React from 'react';
import { calculateTRN, formatNumber } from '../../utils/invoiceUtils';
import { DEFAULT_TEMPLATE_SETTINGS } from '../../constants/defaultTemplateSettings';

/**
 * Invoice Items Table Component
 * Displays line items for current page
 * Supports different table styles based on template
 */
const InvoiceItemsTable = ({
  items,
  startingIndex = 0,
  isFirstPage,
  isContinued,
  primaryColor,
  template = null,
}) => {
  const color = primaryColor || DEFAULT_TEMPLATE_SETTINGS.colors.primary;
  const layout = template?.layout || {};
  const colors = template?.colors || {};
  const fonts = template?.fonts || {};
  
  // Get table style from template
  const itemsStyle = layout.itemsStyle || 'full-grid';
  const alternatingRows = layout.alternatingRows !== false;
  const headerBg = colors.primary || color; // Use primary color for header
  const borderColor = colors.border || '#cccccc';
  const accentColor = colors.accent || '#f0f0f0';

  // Check if header should use light or dark text (B&W template has light gray header)
  const isLightHeader = itemsStyle === 'no-borders' || itemsStyle === 'bold-header';
  const headerTextColor = isLightHeader ? (colors.primary || color) : '#ffffff';

  // Table style configurations
  const getTableStyles = () => {
    switch (itemsStyle) {
      case 'horizontal-lines':
        return {
          table: { borderCollapse: 'collapse' },
          headerRow: { backgroundColor: headerBg, borderBottom: `2px solid ${headerBg}` },
          headerCell: { border: 'none', borderBottom: `2px solid ${headerBg}` },
          bodyRow: () => ({
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${borderColor}`,
          }),
          bodyCell: { border: 'none' },
        };
      case 'no-borders':
        return {
          table: { borderCollapse: 'collapse' },
          headerRow: { backgroundColor: 'transparent', borderBottom: `2px solid ${headerBg}` },
          headerCell: { border: 'none', fontWeight: 'bold' },
          bodyRow: () => ({
            backgroundColor: 'transparent',
          }),
          bodyCell: { border: 'none', borderBottom: `1px solid #eeeeee` },
        };
      case 'bold-header':
        // Print Ready (B&W) - uses light gray header with dark text
        return {
          table: { borderCollapse: 'collapse', border: `1px solid ${borderColor}` },
          headerRow: { backgroundColor: colors.headerBg || '#e0e0e0', borderBottom: `2px solid ${borderColor}` },
          headerCell: { border: `1px solid ${borderColor}`, fontWeight: 'bold' },
          bodyRow: (idx) => ({
            backgroundColor: alternatingRows && idx % 2 === 1 ? accentColor : '#ffffff',
          }),
          bodyCell: { border: `1px solid ${borderColor}` },
        };
      case 'full-grid':
      default:
        return {
          table: { borderCollapse: 'collapse', border: `1px solid ${borderColor}` },
          headerRow: { backgroundColor: headerBg },
          headerCell: { border: `1px solid ${borderColor}` },
          bodyRow: (idx) => ({
            backgroundColor: alternatingRows && idx % 2 === 1 ? accentColor : '#ffffff',
          }),
          bodyCell: { border: `1px solid ${borderColor}` },
        };
    }
  };

  const styles = getTableStyles();
  const fontFamily = fonts.body || 'Inter, system-ui, sans-serif';

  return (
    <div className="invoice-items-table mb-6" style={{ fontFamily }}>
      {/* Continuation indicator for pages after first */}
      {isContinued && !isFirstPage && (
        <div className="table-continued-header mb-2 text-xs italic" style={{ color: colors.secondary || '#666666' }}>
          (Continued from previous page)
        </div>
      )}

      {/* TABLE SECTION - UAE VAT Compliant */}
      <table className="w-full" style={{ ...styles.table, fontSize: '11px' }}>
        <thead>
          <tr style={styles.headerRow}>
            <th className="px-2 py-2 text-left text-xs font-bold" style={{ ...styles.headerCell, width: '4%', color: headerTextColor }}>Sr.</th>
            <th className="px-2 py-2 text-left text-xs font-bold" style={{ ...styles.headerCell, width: '44%', color: headerTextColor }}>Description</th>
            <th className="px-2 py-2 text-center text-xs font-bold" style={{ ...styles.headerCell, width: '6%', color: headerTextColor }}>Qty</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ ...styles.headerCell, width: '10%', color: headerTextColor }}>Unit Price</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ ...styles.headerCell, width: '10%', color: headerTextColor }}>Net Amt</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ ...styles.headerCell, width: '16%', color: headerTextColor }}>VAT</th>
            <th className="px-2 py-2 text-right text-xs font-bold" style={{ ...styles.headerCell, width: '10%', color: headerTextColor }}>Total</th>
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
              <tr key={index} style={styles.bodyRow(index)}>
                <td className="px-2 py-2 text-xs" style={styles.bodyCell}>{globalIndex + 1}</td>
                <td className="px-2 py-2 text-xs font-medium" style={styles.bodyCell}>{item.name || ''}</td>
                <td className="px-2 py-2 text-xs text-center" style={styles.bodyCell}>{item.quantity || 0}</td>
                <td className="px-2 py-2 text-xs text-right" style={styles.bodyCell}>{formatNumber(item.rate || 0)}</td>
                <td className="px-2 py-2 text-xs text-right" style={styles.bodyCell}>{formatNumber(amountNum)}</td>
                <td className="px-2 py-2 text-xs text-right" style={styles.bodyCell}>{formatNumber(vatAmount)} ({vatRate > 0 ? `${vatRate}%` : '0%'})</td>
                <td className="px-2 py-2 text-xs text-right font-medium" style={styles.bodyCell}>{formatNumber(totalWithVAT)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {itemsStyle !== 'no-borders' && (
        <div style={{ borderTop: `2px solid ${borderColor}`, marginTop: '2px' }}></div>
      )}
    </div>
  );
};

export default InvoiceItemsTable;
