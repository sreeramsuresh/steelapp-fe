/**
 * Default Invoice Template Settings
 *
 * These are the default settings for the invoice template.
 * Users can customize these in Company Settings > Document Templates
 * and reset to these defaults at any time.
 */

/**
 * Default document template colors
 * Each document type has its own primary color that can be customized.
 * When useInvoiceSettings is true, the document uses the invoice template color instead.
 */
export const DEFAULT_DOCUMENT_TEMPLATE_COLORS = {
  quotation: { primaryColor: '#009999', useInvoiceSettings: false },      // Teal
  purchaseOrder: { primaryColor: '#2563eb', useInvoiceSettings: false },  // Blue
  deliveryNote: { primaryColor: '#0d9488', useInvoiceSettings: false },   // Teal-600
  creditNote: { primaryColor: '#dc2626', useInvoiceSettings: false },     // Red
  statement: { primaryColor: '#4f46e5', useInvoiceSettings: false },      // Indigo
};

export const DEFAULT_TEMPLATE_SETTINGS = {
  // === VERSION ===
  version: '1.0.0', // Used to track template migrations

  // === COLORS ===
  colors: {
    primary: '#008080',        // Main teal color for headers, lines (rgb: 0, 128, 128)
    secondary: '#0d9488',      // Lighter teal for accents (teal-600: rgb: 13, 148, 136)
    textPrimary: '#000000',    // Black for main text
    textSecondary: '#404040',  // Dark gray for secondary text (rgb: 64, 64, 64)
    textLight: '#808080',      // Light gray for labels (rgb: 128, 128, 128)
    tableBgEven: '#FAFAFA',    // Very light gray for alternating rows (rgb: 250, 250, 250)
    tableBgOdd: '#FFFFFF',     // White for alternating rows
    borderColor: '#C8C8C8',    // Light gray for borders (rgb: 200, 200, 200)
  },

  // === LAYOUT ===
  layout: {
    pageWidth: 210,            // A4 width in mm
    pageHeight: 297,           // A4 height in mm
    marginTop: 15,             // Top margin in mm
    marginBottom: 15,          // Bottom margin in mm
    marginLeft: 15,            // Left margin in mm
    marginRight: 15,           // Right margin in mm
    headerHeight: 50,          // Header section height in mm
    footerHeight: 30,          // Footer section height in mm
    lineSpacing: 4,            // Default line spacing in mm
    sectionSpacing: 8,         // Spacing between sections in mm
  },

  // === TYPOGRAPHY ===
  typography: {
    fontFamily: 'helvetica',   // Base font: helvetica, times, courier
    fontSize: {
      base: 9,                 // Default body text size in pt
      small: 7,                // Small text (footer, labels) in pt
      medium: 9,               // Medium text (table content) in pt
      large: 11,               // Large text (headings) in pt
      xlarge: 12,              // Extra large (company name) in pt
    },
    lineHeight: 1.2,           // Line height multiplier
  },

  // === BRANDING ===
  branding: {
    showLogo: true,            // Show company logo
    logoMaxWidth: 50,          // Maximum logo width in mm
    logoMaxHeight: 15,         // Maximum logo height in mm
    logoPosition: 'right',     // Logo position: left, right, center
    showSeal: true,            // Show company seal/stamp
    sealSize: 20,              // Seal size in mm (square)
    companyNameInHeader: true, // Show company name in header
    showVATNumber: true,       // Show VAT registration number
  },

  // === CONTENT VISIBILITY ===
  visibility: {
    // Header section
    showCompanyAddress: true,
    showCompanyPhone: true,
    showCompanyEmail: true,
    showCompanyWebsite: true,

    // Invoice info
    showInvoiceDate: true,
    showDueDate: true,
    showCustomerPO: true,
    showCustomerPODate: true,

    // Table columns
    showItemNumber: true,      // Sr. column
    showDescription: true,
    showQuantity: true,
    showUnitPrice: true,
    showVAT: true,
    showPrice: true,

    // Summary section
    showSubtotal: true,
    showDiscount: true,
    showVATAmount: true,
    showTotal: true,

    // Optional sections
    showNotes: true,           // Show notes section
    showTerms: true,           // Show payment terms section
    showWarehouse: true,       // Show warehouse information

    // Footer
    showSignature: true,       // Show authorized signatory section
    showCompanySeal: true,     // Show company seal in footer
    showContactInfo: true,     // Show phone/email/website in footer
    showPageNumbers: true,     // Show page numbers
  },

  // === TABLE CONFIGURATION ===
  table: {
    headerBgColor: '#008080',  // Table header background (matches primary color)
    headerTextColor: '#FFFFFF', // Table header text color (white)
    showAlternatingRows: true,  // Alternate row colors
    rowHeight: 7,              // Default row height in mm
    borderWidth: 0.3,          // Table border width in mm
    columnWidths: {            // Column widths as percentages (should total 100)
      sno: 7,                  // Serial number: 7%
      description: 51,         // Description: 51%
      quantity: 10,            // Quantity: 10%
      unitPrice: 15,           // Unit Price: 15%
      vat: 10,                 // VAT: 10%
      price: 17,               // Price: 17%
    },
  },

  // === FORMATTING ===
  formatting: {
    currencySymbol: 'AED',     // Currency symbol
    currencyPosition: 'before', // before or after number
    decimalPlaces: 2,          // Number of decimal places
    thousandsSeparator: ',',   // Thousands separator
    decimalSeparator: '.',     // Decimal separator
    dateFormat: 'DD-MM-YYYY',  // Date format: DD-MM-YYYY, MM-DD-YYYY, YYYY-MM-DD
    showCurrencySymbol: true,  // Show currency symbol in amounts
  },

  // === TEXT LABELS ===
  labels: {
    // Can be used for multi-language support in the future
    invoiceTo: 'Invoice To:',
    invoiceNo: 'Invoice No:',
    invoiceDate: 'Invoice Date:',
    dueDate: 'Due Date:',
    salesOrder: 'SO:',
    orderDate: 'Order Date:',

    // Table headers
    serialNo: 'Sr.',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    vat: 'VAT',
    price: 'Price',

    // Summary
    subtotal: 'SubTotal',
    discount: 'Discount',
    vatAmount: 'VAT',
    total: 'TOTAL',

    // Footer
    paymentTerm: 'Payment Term:',
    comment: 'Comment:',
    warehouse: 'Warehouse:',
    authorizedSignatory: 'Authorized Signatory',
    companySeal: 'Company Seal',
    page: 'Page:',
  },

  // === CUSTOM FOOTER TEXT ===
  footer: {
    showCustomText: false,
    customText: '',            // Custom footer text (if enabled)
  },

  // === ADVANCED OPTIONS ===
  advanced: {
    pdfQuality: 'high',        // high, medium, low
    compression: true,         // Enable PDF compression
    embedFonts: false,         // Embed fonts in PDF (larger file size)
    allowPrinting: true,       // PDF printing permission
    allowCopying: true,        // PDF copying permission
  },
};

/**
 * Get default template settings
 * @returns {Object} Copy of default template settings
 */
export const getDefaultTemplateSettings = () => {
  return JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_SETTINGS));
};

/**
 * Merge user settings with defaults (for backward compatibility)
 * @param {Object} userSettings - User's custom settings
 * @returns {Object} Merged settings
 */
export const mergeTemplateSettings = (userSettings) => {
  if (!userSettings || Object.keys(userSettings).length === 0) {
    return getDefaultTemplateSettings();
  }

  // Deep merge user settings with defaults
  const merged = JSON.parse(JSON.stringify(DEFAULT_TEMPLATE_SETTINGS));

  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };

  const result = deepMerge(merged, userSettings);

  // Auto-sync: Ensure table header background matches primary color
  // This handles backward compatibility for old settings with mismatched colors
  if (result.colors?.primary && result.table) {
    result.table.headerBgColor = result.colors.primary;
  }

  return result;
};

/**
 * Validate template settings
 * @param {Object} settings - Settings to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateTemplateSettings = (settings) => {
  const errors = [];

  // Validate colors (must be valid hex colors)
  const hexColorPattern = /^#[0-9A-F]{6}$/i;
  if (settings.colors) {
    Object.entries(settings.colors).forEach(([key, value]) => {
      if (typeof value === 'string' && !hexColorPattern.test(value)) {
        errors.push(`Invalid color for ${key}: ${value}`);
      }
    });
  }

  // Validate margins (must be positive numbers)
  if (settings.layout) {
    ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].forEach(margin => {
      if (settings.layout[margin] && (settings.layout[margin] < 0 || settings.layout[margin] > 50)) {
        errors.push(`Invalid ${margin}: must be between 0 and 50mm`);
      }
    });
  }

  // Validate font sizes (must be positive numbers)
  if (settings.typography?.fontSize) {
    Object.entries(settings.typography.fontSize).forEach(([key, value]) => {
      if (value < 6 || value > 24) {
        errors.push(`Invalid font size for ${key}: must be between 6 and 24pt`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get the template color for a specific document type.
 * Falls back to invoice template color if useInvoiceSettings is true or if no settings exist.
 *
 * @param {string} documentType - One of: quotation, purchaseOrder, deliveryNote, creditNote, statement
 * @param {Object} companySettings - The company settings object
 * @returns {string} Hex color code for the document template
 */
export const getDocumentTemplateColor = (documentType, companySettings) => {
  // Get the invoice/main template color as fallback
  const invoiceColor = companySettings?.settings?.invoiceTemplate?.colors?.primary
    || companySettings?.settings?.templateCustomColors?.primary
    || DEFAULT_TEMPLATE_SETTINGS.colors.primary
    || '#0d9488';

  // Get document-specific settings
  const docSettings = companySettings?.settings?.documentTemplates?.[documentType];

  // If no document settings exist or useInvoiceSettings is true, use invoice color
  if (!docSettings || docSettings.useInvoiceSettings) {
    return invoiceColor;
  }

  // Return document-specific color, or default if not set
  return docSettings.primaryColor
    || DEFAULT_DOCUMENT_TEMPLATE_COLORS[documentType]?.primaryColor
    || invoiceColor;
};

/**
 * Get default document template settings, merged with any existing settings
 *
 * @param {Object} existingSettings - Existing document template settings from company
 * @returns {Object} Merged document template settings
 */
export const mergeDocumentTemplateSettings = (existingSettings) => {
  if (!existingSettings || Object.keys(existingSettings).length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_DOCUMENT_TEMPLATE_COLORS));
  }

  // Merge with defaults
  const merged = JSON.parse(JSON.stringify(DEFAULT_DOCUMENT_TEMPLATE_COLORS));
  Object.keys(merged).forEach(docType => {
    if (existingSettings[docType]) {
      merged[docType] = {
        ...merged[docType],
        ...existingSettings[docType],
      };
    }
  });

  return merged;
};
