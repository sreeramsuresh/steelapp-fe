# Document Type Styling Guide - CSS, Fonts, and Templates

Complete reference for all CSS, font, color, and layout settings for every document type in both preview and PDF generation.

---

## 1. GLOBAL DEFAULTS (Frontend Preview)

**File:** `/mnt/d/Ultimate Steel/steelapp-fe/src/constants/defaultTemplateSettings.js`

### Base Colors

```javascript
colors: {
  primary: '#008080',        // Main teal (RGB: 0, 128, 128)
  secondary: '#0d9488',      // Lighter teal (teal-600: RGB: 13, 148, 136)
  textPrimary: '#000000',    // Black
  textSecondary: '#404040',  // Dark gray
  textLight: '#808080',      // Medium gray
  tableBgEven: '#FAFAFA',    // Very light gray (alternating rows)
  tableBgOdd: '#FFFFFF',     // White
  borderColor: '#C8C8C8',    // Light gray for borders
}
```

### Typography (Frontend)

```javascript
typography: {
  fontFamily: 'helvetica',   // Base font
  fontSize: {
    base: 8,                 // Body text (addresses, dates)
    small: 7,                // Footer, small labels
    medium: 8,               // Table content
    large: 9,                // Section headers
    xlarge: 12,              // Company name (bold)
    title: 10,               // Document title banner
    tableHeader: 7,          // Table headers (bold, white)
  },
  lineHeight: 1.2,
}
```

### Layout (Frontend)

```javascript
layout: {
  pageWidth: 210,            // A4 width in mm
  pageHeight: 297,           // A4 height in mm
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
  headerHeight: 50,
  footerHeight: 30,
  lineSpacing: 4,
  sectionSpacing: 8,
}
```

### Branding (Frontend)

```javascript
branding: {
  showLogo: true,
  logoMaxWidth: 50,          // mm
  logoMaxHeight: 15,         // mm
  logoPosition: 'right',     // left, right, center
  showSeal: true,
  sealSize: 20,              // mm (square)
  companyNameInHeader: true,
  showVATNumber: true,
}
```

### Table Configuration (Frontend)

```javascript
table: {
  headerBgColor: '#008080',  // Matches primary color
  headerTextColor: '#FFFFFF',
  showAlternatingRows: true,
  rowHeight: 7,              // mm
  borderWidth: 0.3,          // mm
  columnWidths: {
    sno: 7,                  // Serial number
    description: 51,
    quantity: 10,
    unitPrice: 15,
    vat: 10,
    price: 17,
  },
}
```

---

## 2. DOCUMENT TYPE: INVOICE

### Frontend Preview Colors

```javascript
// File: /mnt/d/Ultimate Steel/steelapp-fe/src/constants/defaultTemplateSettings.js

PRIMARY_COLOR: '#008080'     // Teal (default)

Can be customized in:
company.settings.invoiceTemplate.colors.primary
```

### Frontend Invoice Component Styling

**File:** `/mnt/d/Ultimate Steel/steelapp-fe/src/components/invoice/InvoiceHeader.jsx`

```javascript
// Header styles
<h1 style={{
  color: primaryColor,       // Theme color (teal)
  fontSize: 24,              // px
  fontWeight: 'bold',
  margin: 0,
}}>
  Company Name
</h1>

// Company details
<div style={{
  fontSize: 12,
  color: '#666',
  marginTop: 4,
}}>
  Address, phone, email, VAT
</div>

// Logo conditional rendering
{showLogo && companyLogo && (
  <img src={companyLogo} alt="Company Logo" className="h-24 w-auto" />
)}

// Document title
<div style={{
  backgroundColor: primaryColor,
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 'bold',
  padding: 12,
  textAlign: 'center',
  border: `1px solid ${primaryColor}`,
}}>
  INVOICE / DRAFT INVOICE / PROFORMA INVOICE
</div>

// Info box borders and backgrounds
<div style={{
  borderColor: primaryColor,
}}>
  <div style={{
    backgroundColor: primaryColor,
    color: '#ffffff',
    padding: 12,
    fontWeight: 'bold',
  }}>
    Invoice No / Invoice Date / Due Date
  </div>
</div>
```

### PDF Generation CSS (Backend)

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js`

#### Base CSS (lines 468-515)

```css
body {
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.5;
  color: #333;
  font-size: 11pt;
  background: white;
}

.container {
  width: 210mm;              /* A4 */
  min-height: 297mm;
  margin: 0 auto;
  padding: 20mm 15mm;
}

/* Document-specific CSS */
.company-name {
  font-size: 16pt;
  font-weight: bold;
  color: #111;
}

.company-details {
  font-size: 10pt;
  line-height: 1.6;
  color: #555;
}

.company-logo img {
  max-height: 100px;
  max-width: 300px;
}

.header-line {
  border-top: 2px solid ${primaryColor};  /* Dynamic color */
  margin-bottom: 20px;
}

.document-title {
  background-color: ${primaryColor};
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 14pt;
  font-weight: bold;
  margin-bottom: 20px;
}

.items-table thead th {
  background-color: ${primaryColor};
  color: white;
  font-weight: bold;
  padding: 12px 10px;
  font-size: 10.5pt;
}

.items-table tbody td {
  padding: 12px 10px;
  font-size: 10pt;
  border-bottom: 1px solid #e5e7eb;
}

.items-table tbody tr:nth-child(even) {
  background-color: #f9fafb;
}

.totals-section {
  float: right;
  width: 300px;
  padding: 15px;
  background-color: #f9fafb;
}

.totals-row.total {
  border-top: 2px solid ${primaryColor};
  font-size: 13pt;
  font-weight: bold;
}

.payment-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 9pt;
  font-weight: 600;
  text-transform: uppercase;
}

.payment-status-badge.paid {
  background-color: #d1fae5;
  color: #065f46;
}

.payment-status-badge.unpaid {
  background-color: #fee2e2;
  color: #991b1b;
}

.payment-status-badge.partial {
  background-color: #fef3c7;
  color: #92400e;
}
```

#### Invoice-Specific CSS

```css
/* Invoice number and details box */
.details-box {
  flex: 0 0 300px;
  border: 2px solid ${primaryColor};
  border-radius: 4px;
  overflow: hidden;
}

.details-box-header {
  background-color: ${primaryColor};
  color: white;
  padding: 10px 15px;
  font-size: 12pt;
  font-weight: bold;
}

.details-box-body {
  padding: 15px;
  font-size: 10pt;
  background-color: #f9fafb;
}

.details-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.details-label {
  font-weight: 600;
  color: #333;
}

.details-value {
  text-align: right;
  color: #555;
}
```

---

## 3. DOCUMENT TYPE: QUOTATION

### Frontend Quotation Preview Colors

```javascript
PRIMARY_COLOR: '#009999'     // Teal (from DEFAULT_DOCUMENT_TEMPLATE_COLORS)

File: /mnt/d/Ultimate Steel/steelapp-fe/src/components/quotations/QuotationPreview.jsx
```

### Frontend Quotation Styling

```javascript
const templateColor = getDocumentTemplateColor("quotation", company);

// Color applied to:
// - Document header background
// - Section titles
// - Status badges
// - Border colors
```

### PDF Generation for Quotation

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js` (Line 2191)

```css
/* Quotation-Specific Styles */
.validity-info {
  background-color: #f0f8ff;         /* Light blue background */
  border: 1px solid ${primaryColor};
  border-radius: 4px;
  padding: 15px;
  margin: 20px 0;
}

.validity-title {
  font-weight: bold;
  color: ${primaryColor};
  margin-bottom: 5px;
}

/* Same base styles as invoice:
   - Same table header color: ${primaryColor}
   - Same totals section
   - Same alternating rows
   - Same font sizes and spacing
*/
```

---

## 4. DOCUMENT TYPE: CREDIT NOTE

### Frontend Credit Note Preview Colors

```javascript
PRIMARY_COLOR: '#dc2626'     // Red/Danger color
useInvoiceSettings: false

File: /mnt/d/Ultimate Steel/steelapp-fe/src/components/credit-notes/CreditNotePreview.jsx
```

### Frontend Credit Note Styling

```javascript
const dangerColor = "#dc2626";
const templateColor = dangerColor; // Always red for credit notes

// Applied to:
// - Header background: dangerColor
// - Section titles: dangerColor
// - Borders: dangerColor
// - Badges and highlights: dangerColor
```

### PDF Generation for Credit Note

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js` (Line 2343)

```javascript
const dangerColor = '#dc2626';
const primaryColor = dangerColor;    // Override to red

// Styles:
.document-title {
  background-color: #dc2626;         // Red background
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 14pt;
  font-weight: bold;
}

.header {
  border-bottom: 2px solid #dc2626;  // Red bottom border
}

.company-name {
  color: #dc2626;                    // Red text
}

.warning-text {
  color: #dc2626;                    // Red warning text
  font-weight: bold;
}

/* Table header */
.items-table thead th {
  background-color: #dc2626;         // Red header background
}

/* Totals */
.totals-row.total {
  border-top: 2px solid #dc2626;
  color: #dc2626;
}

/* Credit amount displayed in red */
.amount-value {
  font-size: 16pt;
  font-weight: bold;
  color: #dc2626;
}

/* Format total as negative in red */
<div style={{color: '#dc2626'}}>
  (${formatCurrency(creditNote.total)})
</div>
```

---

## 5. DOCUMENT TYPE: DELIVERY NOTE

### Frontend Delivery Note Preview Colors

```javascript
PRIMARY_COLOR: '#0d9488'     // Teal-600
useInvoiceSettings: false

File: /mnt/d/Ultimate Steel/steelapp-fe/src/components/delivery-notes/DeliveryNotePreview.jsx
```

### PDF Generation for Delivery Note

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js` (Line 2481)

```javascript
const primaryColor = safeGet(
  company,
  'settings.invoice_template.colors.primary',
  '#0d9488'  // Default teal
);

// Uses getDocumentCSS(primaryColor, 'delivery-note')
// All base styles apply with teal color scheme

.document-title {
  background-color: #0d9488;
  color: white;
}

// Status indicators for delivery
.delivery-status {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9pt;
  font-weight: bold;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-partial {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-completed {
  background-color: #d1fae5;
  color: #065f46;
}
```

---

## 6. DOCUMENT TYPE: PURCHASE ORDER

### Frontend Purchase Order Colors

```javascript
PRIMARY_COLOR: '#2563eb'     // Blue
useInvoiceSettings: false

File: /mnt/d/Ultimate Steel/steelapp-fe/src/components/purchase-orders/PurchaseOrderPreview.jsx (if exists)
```

### PDF Generation for Purchase Order

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js` (Line 2054)

```javascript
const primaryColor = '#0d9488';     // Teal for PO

// Custom PO specific styles
.po-title {
  background-color: ${primaryColor};
  color: white;
  text-align: center;
  padding: 15px 0;
  margin: 20px 0;
  font-size: 20px;
  font-weight: bold;
}

.signature-section {
  display: flex;
  justify-content: space-between;
  margin-top: 60px;
  padding-top: 40px;
}

.signature-line {
  border-top: 1px solid #000;
  margin-top: 30px;
  padding-top: 10px;
  width: 150px;
}
```

---

## 7. DOCUMENT TYPE: PAYMENT RECEIPT

### Frontend Payment Receipt Colors

```javascript
PRIMARY_COLOR: '#1e40af'     // Blue (default)
Format: A5 (smaller size)

File: /mnt/d/Ultimate Steel/steelapp-fe/src/components/payments/PaymentReceiptPreview.jsx
```

### PDF Generation for Payment Receipt

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js` (Line 1700)

```javascript
const primaryColor = safeGet(company, 'primary_color', '#1e40af');

// A5 size specific (half A4)
.receipt-container {
  width: 148mm;              // A5 width
  height: 210mm;             // A5 height
  padding: 12mm;
  margin: 0 auto;
  background: white;
  position: relative;
}

.receipt-header {
  text-align: center;
  margin-bottom: 15px;
  border-bottom: 3px solid ${primaryColor};
  padding-bottom: 12px;
}

.company-name {
  font-size: 14pt;
  font-weight: bold;
  color: ${primaryColor};
  margin-bottom: 4px;
}

.company-logo img {
  max-height: 50px;          // Smaller for receipt
}

.amount-value {
  font-size: 16pt;
  font-weight: bold;
  color: ${primaryColor};
}

.amount-words {
  font-size: 9pt;
  color: #555;
  font-style: italic;
  padding: 8px;
  background-color: white;
  border-left: 3px solid ${primaryColor};
}

.section-title {
  font-size: 10pt;
  font-weight: bold;
  color: ${primaryColor};
  margin-bottom: 8px;
  border-bottom: 1px solid ${primaryColor};
  padding-bottom: 4px;
}
```

---

## 8. DOCUMENT TYPE: ACCOUNT STATEMENT

### Frontend Account Statement Colors

```javascript
PRIMARY_COLOR: '#4f46e5'     // Indigo
Format: Full A4

File: /mnt/d/Ultimate Steel/steelapp-fe/src/components/statements/AccountStatementPreview.jsx
```

### PDF Generation for Account Statement

**File:** `/mnt/d/Ultimate Steel/steelapprnp/services/pdfService.js` (Line 1878)

```javascript
const primaryColor = DEFAULT_PRIMARY_COLOR;  // '#008080' (teal)

// Statement-specific styles
.transactions-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.transactions-table th,
.transactions-table td {
  border: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
}

.transactions-table th {
  background-color: ${primaryColor};  // Teal header
  color: white;
  font-weight: bold;
}

.transactions-table tr:nth-child(even) {
  background-color: #f9fafb;
}

.summary {
  margin-top: 30px;
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  padding: 5px 0;
}

.summary-item.total {
  font-weight: bold;
  font-size: 18px;
  color: ${primaryColor};
  border-top: 2px solid ${primaryColor};
  padding-top: 10px;
}
```

---

## 9. Fonts Summary

### All Documents Use Same Base Fonts

| Element             | Font            | Size (PDF) | Size (Preview) | Weight | Color             |
| ------------------- | --------------- | ---------- | -------------- | ------ | ----------------- |
| Company Name        | Arial/Helvetica | 16pt       | 24px           | Bold   | Dynamic (primary) |
| Document Title      | Arial/Helvetica | 14pt       | 14px           | Bold   | White on color    |
| Section Headers     | Arial/Helvetica | 13pt       | 16px           | Bold   | Dynamic (primary) |
| Body Text           | Arial/Helvetica | 10pt       | 12px           | Normal | #333              |
| Table Headers       | Arial/Helvetica | 10.5pt     | 10pt           | Bold   | White on color    |
| Table Content       | Arial/Helvetica | 10pt       | 10pt           | Normal | #333              |
| Small Text (footer) | Arial/Helvetica | 9pt        | 9px            | Normal | #666              |
| Labels              | Arial/Helvetica | 10pt       | 12px           | 600    | #404040           |

---

## 10. Color Scheme by Document Type

```javascript
// Frontend Color Assignments
{
  quotation: {
    primaryColor: '#009999',    // Teal
    useInvoiceSettings: false,
  },
  purchaseOrder: {
    primaryColor: '#2563eb',    // Blue
    useInvoiceSettings: false,
  },
  deliveryNote: {
    primaryColor: '#0d9488',    // Teal-600
    useInvoiceSettings: false,
  },
  creditNote: {
    primaryColor: '#dc2626',    // Red/Danger
    useInvoiceSettings: false,
  },
  statement: {
    primaryColor: '#4f46e5',    // Indigo
    useInvoiceSettings: false,
  },
}

// Invoice uses its own invoice_template.colors.primary
// Default: '#008080' (teal)
```

---

## 11. Space and Layout Metrics

### All Documents (Frontend)

```javascript
layout: {
  pageWidth: 210,            // A4 width in mm
  pageHeight: 297,           // A4 height in mm
  marginTop: 15,             // mm
  marginBottom: 15,          // mm
  marginLeft: 15,            // mm
  marginRight: 15,           // mm
  headerHeight: 50,          // mm
  footerHeight: 30,          // mm
  lineSpacing: 4,            // mm
  sectionSpacing: 8,         // mm
}
```

### Receipt Only (PDF)

```javascript
// A5 size (half A4)
.receipt-container {
  width: 148mm;              // A5 width
  height: 210mm;             // A5 height (landscape rotation)
  padding: 12mm;
}
```

---

## 12. Table Column Widths

### All Documents Use Same Configuration

```javascript
table: {
  columnWidths: {
    sno: 7,                  // Serial number: 7%
    description: 51,         // Product/item description: 51%
    quantity: 10,            // Quantity: 10%
    unitPrice: 15,           // Unit price: 15%
    vat: 10,                 // VAT/tax: 10%
    price: 17,               // Total price: 17%
  },
}
// Total: 100%
```

---

## 13. Text Formatting

### All Documents

```javascript
formatting: {
  currencySymbol: 'AED',
  currencyPosition: 'before',  // Before number (e.g., AED 1,000.00)
  decimalPlaces: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  dateFormat: 'DD-MM-YYYY',
  showCurrencySymbol: true,
}
```

---

## 14. Visibility Toggles (Frontend)

Users can control visibility of:

```javascript
visibility: {
  // Header
  showCompanyAddress: true,
  showCompanyPhone: true,
  showCompanyEmail: true,
  showCompanyWebsite: true,

  // Invoice info
  showInvoiceDate: true,
  showDueDate: true,
  showCustomerPO: true,

  // Table columns
  showItemNumber: true,
  showDescription: true,
  showQuantity: true,
  showUnitPrice: true,
  showVAT: true,
  showPrice: true,

  // Summary
  showSubtotal: true,
  showDiscount: true,
  showVATAmount: true,
  showTotal: true,

  // Optional sections
  showNotes: true,
  showTerms: true,
  showSignature: true,
  showPageNumbers: true,
}
```

---

## 15. Customization Points

Users can customize:

### In Company Settings (Frontend)

```javascript
company.settings = {
  invoiceTemplate: {
    colors: {
      primary: "#008080", // Any hex color
      // + all other colors
    },
    typography: {
      fontFamily: "helvetica",
      fontSize: {
        // Customizable sizes
      },
    },
    layout: {
      // All margins, spacing
    },
    branding: {
      showLogo: true / false,
      logoMaxWidth: 50,
      logoPosition: "left" | "right" | "center",
      // ...
    },
    visibility: {
      // Each element can be toggled
    },
    table: {
      columnWidths: {
        // Can adjust percentages
      },
    },
  },
  documentImages: {
    invoice: { showLogo: true, showSeal: true },
    quotation: { showLogo: true, showSeal: false },
    // ... per document type
  },
};
```

---

## 16. Performance Metrics

| Metric                    | Value     | Notes                 |
| ------------------------- | --------- | --------------------- |
| PDF File Size (Invoice)   | 100-300KB | Depends on image size |
| PDF File Size (Statement) | 50-150KB  | No images typically   |
| PDF Generation Time       | 200-300ms | Per document          |
| Browser Render Time       | 100-200ms | Preview update        |
| CSS File Size             | ~5KB      | Dynamically generated |

---

## Summary Table

| Aspect            | Invoice | Quotation | Credit Note | Delivery Note | PO      | Receipt | Statement |
| ----------------- | ------- | --------- | ----------- | ------------- | ------- | ------- | --------- |
| Default Color     | #008080 | #009999   | #dc2626     | #0d9488       | #0d9488 | #1e40af | #4f46e5   |
| Page Size         | A4      | A4        | A5          | A4            | A4      | A5      | A4        |
| Font Family       | Arial   | Arial     | Arial       | Arial         | Arial   | Arial   | Arial     |
| Base Font Size    | 10pt    | 10pt      | 10pt        | 10pt          | 10pt    | 9pt     | 10pt      |
| Logo Support      | Yes     | Yes       | Yes         | Yes           | Yes     | Yes     | No        |
| Seal Support      | Yes     | Yes       | Yes         | Yes           | Yes     | Yes     | No        |
| Table Present     | Yes     | Yes       | Yes         | Yes           | Yes     | No      | Yes       |
| Signature Section | Yes     | No        | No          | No            | Yes     | No      | No        |
| Status Badge      | Yes     | Yes       | Yes         | Yes           | No      | No      | No        |
| Multi-page        | Yes     | Yes       | No          | Yes           | Yes     | No      | Yes       |
