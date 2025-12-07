/**
 * PDF-Aligned Style Specification
 *
 * Source of Truth: steelapprnp/services/pdfService.js (getBaseCSS + getDocumentCSS)
 *
 * This file ensures visual consistency between:
 * 1. Invoice Preview (React components)
 * 2. Company Settings UI (InvoiceTemplateSettings)
 * 3. PDF Download (Backend pdfService.js)
 *
 * All values extracted from production PDF generation code.
 */

// =============================================================================
// TYPOGRAPHY - Font Sizes
// =============================================================================

/**
 * PDF Typography Scale (in points)
 * 1pt = 1.333px (at 96dpi)
 */
export const PDF_FONT_SIZES = {
  // Headers
  companyName: '16pt',      // ~21px - Main company name
  documentTitle: '14pt',    // ~19px - TAX INVOICE banner
  sectionHeader: '13pt',    // ~17px - "Invoice To:", "Invoice No:"
  detailsBoxHeader: '12pt', // ~16px - Invoice number box header

  // Body text
  body: '11pt',             // ~15px - Default body text
  tableHeader: '10.5pt',    // ~14px - Table column headers
  tableBody: '10pt',        // ~13px - Table content, details
  companyDetails: '10pt',   // ~13px - Address, phone, email

  // Small text
  footer: '11pt',           // ~15px - Footer sections
  footerContact: '11pt',    // ~15px - Contact info in footer
  signatureLabel: '9pt',    // ~12px - Signature labels
  sealDetails: '9pt',       // ~12px - Seal text
  warningText: '10pt',      // ~13px - Warning boxes
};

/**
 * Tailwind equivalents for PDF font sizes
 * Use these classes in React components
 */
export const TAILWIND_FONT_SIZES = {
  companyName: 'text-[16pt]',      // or text-xl (1.25rem ≈ 20px)
  documentTitle: 'text-[14pt]',    // or text-lg (1.125rem ≈ 18px)
  sectionHeader: 'text-[13pt]',    // or text-base (1rem ≈ 16px)
  detailsBoxHeader: 'text-[12pt]', // or text-base
  body: 'text-[11pt]',             // or text-sm (0.875rem ≈ 14px)
  tableHeader: 'text-[10.5pt]',    // or text-sm
  tableBody: 'text-[10pt]',        // or text-xs (0.75rem ≈ 12px)
  companyDetails: 'text-[10pt]',
  footer: 'text-[11pt]',
  signatureLabel: 'text-[9pt]',
  sealDetails: 'text-[9pt]',
};

// =============================================================================
// TYPOGRAPHY - Line Heights
// =============================================================================

export const PDF_LINE_HEIGHTS = {
  base: 1.5,              // Default body
  companyDetails: 1.6,    // Company info section
  recipientContent: 1.7,  // Customer info section
  sealDetails: 1.5,       // Seal text
  footer: 1.6,            // Footer paragraphs
  tableBody: 1.5,         // Table rows
};

export const TAILWIND_LINE_HEIGHTS = {
  base: 'leading-normal',       // 1.5
  companyDetails: 'leading-relaxed', // 1.625
  recipientContent: 'leading-loose', // 1.75 (closest to 1.7)
  tableBody: 'leading-normal',  // 1.5
};

// =============================================================================
// TYPOGRAPHY - Font Families
// =============================================================================

export const PDF_FONT_FAMILIES = {
  base: 'Arial, Helvetica, sans-serif',
  // Alternative for modern look
  modern: 'Inter, system-ui, sans-serif',
};

// =============================================================================
// LAYOUT - Page Dimensions (A4)
// =============================================================================

export const PDF_PAGE = {
  width: '210mm',
  height: '297mm',
  padding: {
    vertical: '20mm',
    horizontal: '15mm',
  },
  // For preview scaling
  aspectRatio: 297 / 210, // ~1.414
};

// =============================================================================
// LAYOUT - Component Dimensions
// =============================================================================

export const PDF_DIMENSIONS = {
  // Details box (Invoice Number box)
  detailsBox: {
    width: '300px',
    borderRadius: '4px',
    borderWidth: '2px',
  },

  // Totals section
  totalsSection: {
    width: '300px',
    padding: '15px',
    borderRadius: '4px',
  },

  // Company logo
  logo: {
    maxHeight: '100px',
    maxWidth: '300px',
  },

  // Company seal
  seal: {
    width: '80px',
    height: '80px',
  },

  // Signature section
  signature: {
    boxMinWidth: '180px',
    lineMarginTop: '30px',
  },
};

// =============================================================================
// LAYOUT - Spacing
// =============================================================================

export const PDF_SPACING = {
  // Section margins
  sectionMarginBottom: '20px',
  headerMarginBottom: '15px',

  // Header line
  headerLineMarginBottom: '20px',

  // Details row
  detailsRowMargin: '8px',

  // Table
  tableCellPadding: '12px 10px',
  tableMarginBottom: '20px',

  // Totals
  totalsRowMargin: '12px',
  totalsSectionMarginTop: '15px',

  // Footer
  footerMarginTop: '30px',
  footerPaddingTop: '15px',
  footerHeadingMarginBottom: '8px',

  // Signature
  signatureMarginTop: '30px',
  signatureMarginBottom: '20px',
};

export const TAILWIND_SPACING = {
  sectionMarginBottom: 'mb-5',      // 20px
  headerMarginBottom: 'mb-4',       // 16px (closest to 15px)
  headerLineMarginBottom: 'mb-5',   // 20px
  detailsRowMargin: 'mb-2',         // 8px
  tableCellPadding: 'px-3 py-3',    // 12px
  tableMarginBottom: 'mb-5',        // 20px
  totalsRowMargin: 'mb-3',          // 12px
  footerMarginTop: 'mt-8',          // 32px (closest to 30px)
  footerPaddingTop: 'pt-4',         // 16px (closest to 15px)
};

// =============================================================================
// COLORS - Base Palette
// =============================================================================

export const PDF_COLORS = {
  // Text colors
  textPrimary: '#111',      // Company name, headings
  textBody: '#333',         // Default body text
  textSecondary: '#555',    // Company details, recipient content
  textMuted: '#666',        // Footer contact

  // Backgrounds
  bgLight: '#f9fafb',       // Alternating rows, details box body, totals bg
  bgInfo: '#f0f9ff',        // Info boxes
  bgWarning: '#fef3c7',     // Warning boxes

  // Borders
  borderLight: '#e5e7eb',   // Table rows, footer
  borderMedium: '#d1d5db',  // Table divider

  // Status colors
  success: '#059669',       // Paid stamp, payments
  successLight: '#d1fae5',  // Paid badge bg
  successText: '#065f46',   // Paid badge text

  danger: '#dc2626',        // Credit notes, unpaid
  dangerLight: '#fee2e2',   // Unpaid badge bg
  dangerText: '#991b1b',    // Unpaid badge text

  warning: '#fbbf24',       // Warning border
  warningText: '#92400e',   // Warning heading
  warningTextDark: '#78350f', // Warning body

  // Default primary (teal)
  primary: '#008080',
};

// =============================================================================
// TABLE STYLING
// =============================================================================

export const PDF_TABLE = {
  // Header
  headerFontSize: '10.5pt',
  headerFontWeight: 'bold',
  headerTextColor: '#ffffff',
  headerPadding: '12px 10px',

  // Body
  bodyFontSize: '10pt',
  bodyPadding: '12px 10px',
  bodyLineHeight: 1.5,
  bodyBorderBottom: '1px solid #e5e7eb',

  // Alternating rows
  alternatingRowBg: '#f9fafb',

  // Divider
  dividerBorder: '2px solid #d1d5db',
};

// =============================================================================
// DETAILS BOX STYLING (Invoice Number Box)
// =============================================================================

export const PDF_DETAILS_BOX = {
  width: '300px',
  border: '2px solid', // + primaryColor
  borderRadius: '4px',

  // Header
  headerPadding: '10px 15px',
  headerFontSize: '12pt',
  headerFontWeight: 'bold',
  headerTextColor: '#ffffff',
  // headerBg: primaryColor

  // Body
  bodyPadding: '15px',
  bodyFontSize: '10pt',
  bodyBg: '#f9fafb',

  // Rows
  rowMargin: '8px',
  labelFontWeight: '600',
  labelColor: '#333',
  valueColor: '#555',
};

// =============================================================================
// TOTALS SECTION STYLING
// =============================================================================

export const PDF_TOTALS = {
  // Container
  width: '300px',
  padding: '15px',
  bg: '#f9fafb',
  borderRadius: '4px',

  // Rows
  rowFontSize: '10.5pt',
  rowMargin: '12px',
  rowPadding: '5px 0',
  labelColor: '#555',
  labelFontWeight: '500',
  amountColor: '#333',
  amountFontWeight: '500',

  // Total row
  totalFontSize: '13pt',
  totalFontWeight: 'bold',
  totalBorderTop: '2px solid', // + primaryColor
  totalPaddingTop: '12px',
  totalMarginTop: '10px',

  // Payment row
  paymentFontSize: '11pt',
  paymentBorderTop: '2px solid #d1d5db',
  paymentPaddingTop: '10px',

  // Balance row
  balanceFontSize: '12pt',
  balanceFontWeight: 'bold',
  balanceUnpaidColor: '#dc2626',
  balancePaidColor: '#059669',
};

// =============================================================================
// SIGNATURE & SEAL STYLING
// =============================================================================

export const PDF_SIGNATURE = {
  // Section
  marginTop: '30px',
  marginBottom: '20px',

  // Signature box
  boxMinWidth: '180px',
  lineMarginTop: '30px',
  lineMarginBottom: '8px',
  lineBorder: '1px solid #333',
  labelFontSize: '9pt',
  labelColor: '#555',

  // Seal
  sealWidth: '80px',
  sealHeight: '80px',
  sealDetailsFontSize: '9pt',
  sealDetailsColor: '#555',
  sealDetailsLineHeight: 1.5,
};

// =============================================================================
// FOOTER STYLING
// =============================================================================

export const PDF_FOOTER = {
  marginTop: '30px',
  paddingTop: '15px',
  borderTop: '1px solid #e5e7eb',

  headingFontSize: '14pt',
  headingMarginBottom: '8px',
  // headingColor: primaryColor

  textFontSize: '11pt',
  textLineHeight: 1.6,

  contactFontSize: '11pt',
  contactColor: '#666',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get inline styles object for a component
 * Use in React: style={getPdfStyle('companyName')}
 */
export const getPdfStyle = (component, primaryColor = PDF_COLORS.primary) => {
  const styles = {
    companyName: {
      fontSize: PDF_FONT_SIZES.companyName,
      fontWeight: 'bold',
      color: PDF_COLORS.textPrimary,
      marginBottom: '5px',
    },
    companyDetails: {
      fontSize: PDF_FONT_SIZES.companyDetails,
      lineHeight: PDF_LINE_HEIGHTS.companyDetails,
      color: PDF_COLORS.textSecondary,
    },
    sectionHeader: {
      fontSize: PDF_FONT_SIZES.sectionHeader,
      fontWeight: 'bold',
      color: PDF_COLORS.textPrimary,
      marginBottom: '8px',
    },
    recipientContent: {
      fontSize: PDF_FONT_SIZES.tableBody,
      lineHeight: PDF_LINE_HEIGHTS.recipientContent,
      color: PDF_COLORS.textSecondary,
    },
    detailsBoxHeader: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      padding: PDF_DETAILS_BOX.headerPadding,
      fontSize: PDF_DETAILS_BOX.headerFontSize,
      fontWeight: 'bold',
    },
    detailsBoxBody: {
      padding: PDF_DETAILS_BOX.bodyPadding,
      fontSize: PDF_DETAILS_BOX.bodyFontSize,
      backgroundColor: PDF_DETAILS_BOX.bodyBg,
    },
    tableHeader: {
      backgroundColor: primaryColor,
      color: '#ffffff',
      fontWeight: 'bold',
      padding: PDF_TABLE.headerPadding,
      fontSize: PDF_TABLE.headerFontSize,
    },
    tableCell: {
      padding: PDF_TABLE.bodyPadding,
      fontSize: PDF_TABLE.bodyFontSize,
      borderBottom: PDF_TABLE.bodyBorderBottom,
      verticalAlign: 'top',
      lineHeight: PDF_TABLE.bodyLineHeight,
    },
    totalsRow: {
      fontSize: PDF_TOTALS.rowFontSize,
      marginBottom: PDF_TOTALS.rowMargin,
      padding: PDF_TOTALS.rowPadding,
    },
    totalRow: {
      fontSize: PDF_TOTALS.totalFontSize,
      fontWeight: 'bold',
      borderTop: `${PDF_TOTALS.totalBorderTop} ${primaryColor}`,
      paddingTop: PDF_TOTALS.totalPaddingTop,
      marginTop: PDF_TOTALS.totalMarginTop,
    },
    footerHeading: {
      fontSize: PDF_FOOTER.headingFontSize,
      marginBottom: PDF_FOOTER.headingMarginBottom,
      color: primaryColor,
    },
    footerText: {
      fontSize: PDF_FOOTER.textFontSize,
      lineHeight: PDF_FOOTER.textLineHeight,
    },
    signatureLabel: {
      fontSize: PDF_SIGNATURE.labelFontSize,
      color: PDF_SIGNATURE.labelColor,
    },
  };

  return styles[component] || {};
};

/**
 * Convert pt to px (approximate)
 * 1pt ≈ 1.333px at 96dpi
 */
export const ptToPx = (pt) => {
  const num = parseFloat(pt);
  return `${Math.round(num * 1.333)}px`;
};

/**
 * Get CSS class string for PDF-aligned styling
 */
export const getPdfClasses = (component) => {
  const classes = {
    companyName: 'text-[16pt] font-bold text-gray-900 mb-1',
    companyDetails: 'text-[10pt] leading-relaxed text-gray-600',
    sectionHeader: 'text-[13pt] font-bold text-gray-900 mb-2',
    recipientContent: 'text-[10pt] leading-loose text-gray-600',
    tableHeader: 'text-[10.5pt] font-bold text-white px-3 py-3',
    tableCell: 'text-[10pt] px-3 py-3 border-b border-gray-200',
    totalsRow: 'text-[10.5pt] mb-3',
    totalRow: 'text-[13pt] font-bold border-t-2 pt-3 mt-3',
    footer: 'text-[11pt] leading-relaxed',
    signatureLabel: 'text-[9pt] text-gray-600',
  };

  return classes[component] || '';
};

export default {
  PDF_FONT_SIZES,
  PDF_LINE_HEIGHTS,
  PDF_FONT_FAMILIES,
  PDF_PAGE,
  PDF_DIMENSIONS,
  PDF_SPACING,
  PDF_COLORS,
  PDF_TABLE,
  PDF_DETAILS_BOX,
  PDF_TOTALS,
  PDF_SIGNATURE,
  PDF_FOOTER,
  TAILWIND_FONT_SIZES,
  TAILWIND_LINE_HEIGHTS,
  TAILWIND_SPACING,
  getPdfStyle,
  getPdfClasses,
  ptToPx,
};
