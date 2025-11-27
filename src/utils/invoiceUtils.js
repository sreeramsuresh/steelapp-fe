import {
  toUAETime,
  toUAEDateForInput,
  toUAEDateProfessional,
  toUAEDateTimeProfessional,
  toUAEDateShort,
  toUAEPaymentDateTime,
  TIMEZONE_DISCLAIMER,
  TIMEZONE_LABEL,
} from './timezone';

export const calculateItemAmount = (quantity, rate) => {
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  return qty * rt;
};

/**
 * Calculate VAT/TRN amount with proper UAE FTA rounding
 * Uses toFixed(2) for standard rounding to 2 decimal places
 * @param {number} amount - Base amount before VAT
 * @param {number} trnRate - VAT rate percentage (e.g., 5 for 5%)
 * @returns {number} Rounded VAT amount
 */
export const calculateTRN = (amount, trnRate) => {
  const amt = parseFloat(amount) || 0;
  const rate = parseFloat(trnRate) || 0;
  // UAE FTA compliant rounding - always round to 2 decimal places
  return parseFloat(((amt * rate) / 100).toFixed(2));
};

// Keep for backward compatibility
export const calculateVAT = (amount, vatRate) => {
  return calculateTRN(amount, vatRate);
};

export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);
};

/**
 * Calculate total VAT/TRN for all items with proper UAE FTA rounding
 * @param {Array} items - Invoice line items
 * @returns {number} Total VAT amount (rounded to 2 decimal places)
 */
export const calculateTotalTRN = (items) => {
  const totalVat = items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    const rate = parseFloat(item.vatRate) || 0;
    return sum + calculateTRN(amount, rate);
  }, 0);
  // Final rounding for UAE FTA compliance
  return parseFloat(totalVat.toFixed(2));
};

/**
 * Compute VAT after applying invoice-level discount per UAE FTA rules
 * - Percentage: reduce each line by the percent, then apply VAT per line
 * - Amount: allocate discount proportionally by line amount, then apply VAT per line
 * @param {Array} items - Invoice line items
 * @param {string} discountType - 'percentage' or 'amount'
 * @param {number} discountPercent - Discount percentage (if type is percentage)
 * @param {number} discountAmount - Discount amount (if type is amount)
 * @returns {number} Total VAT after discount (rounded to 2 decimal places)
 */
export const calculateDiscountedTRN = (items, discountType, discountPercent, discountAmount) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  if (total <= 0) return 0;

  const pct = parseFloat(discountPercent) || 0;
  const amt = parseFloat(discountAmount) || 0;

  let vatSum = 0;
  if (discountType === 'percentage' && pct > 0) {
    const factor = Math.max(0, 1 - pct / 100);
    for (const it of items) {
      const lineAmt = parseFloat(((parseFloat(it.amount) || 0) * factor).toFixed(2));
      const rate = parseFloat(it.vatRate) || 0;
      vatSum += calculateTRN(lineAmt, rate);
    }
    // UAE FTA compliant final rounding
    return parseFloat(vatSum.toFixed(2));
  }

  // Amount-based or no/invalid type
  const cap = Math.min(Math.max(0, amt), total);
  if (cap === 0) return calculateTotalTRN(items);

  for (const it of items) {
    const base = parseFloat(it.amount) || 0;
    const share = base / total;
    const allocated = parseFloat((cap * share).toFixed(2));
    const net = parseFloat(Math.max(0, base - allocated).toFixed(2));
    const rate = parseFloat(it.vatRate) || 0;
    vatSum += calculateTRN(net, rate);
  }
  // UAE FTA compliant final rounding
  return parseFloat(vatSum.toFixed(2));
};

// Keep for backward compatibility
export const calculateTotalVAT = (items) => {
  return calculateTotalTRN(items);
};

export const calculateTotal = (subtotal, vatAmount) => {
  const sub = parseFloat(subtotal) || 0;
  const vat = parseFloat(vatAmount) || 0;
  return sub + vat;
};

/**
 * ⚠️ CRITICAL BUSINESS RULE - DO NOT MODIFY WITHOUT EXPLICIT USER APPROVAL ⚠️
 *
 * Document numbering format: PREFIX-YYYYMM-NNNN (all with yearly reset)
 * - Invoice: INV-YYYYMM-NNNN
 * - Purchase Order: PO-YYYYMM-NNNN
 * - Quotation: QT-YYYYMM-NNNN
 * - Delivery Note: DN-YYYYMM-NNNN
 *
 * Last Confirmed: 2025-01-07 by User
 * Documentation: See /NAMING_CONVENTIONS.md
 */

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `INV-${yearMonth}-0001`;
};

export const generatePONumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `PO-${yearMonth}-0001`;
};

export const generateQuotationNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `QT-${yearMonth}-0001`;
};

export const generateDeliveryNoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `DN-${yearMonth}-0001`;
};

export const formatCurrency = (amount) => {
  // Handle NaN, null, undefined, or non-numeric values
  const numericAmount = parseFloat(amount);
  const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;

  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(safeAmount);
};

/**
 * Format date for display in UAE timezone
 * All dates from the backend are stored in UTC and should be displayed in UAE time
 * @param {string|Date|object} date - UTC date (can be proto Timestamp with seconds property)
 * @returns {string} Formatted date in UAE timezone (e.g., "January 15, 2025")
 */
export const formatDate = (date) => {
  return toUAETime(date, { format: 'long' });
};

/**
 * Format datetime for display in UAE timezone
 * @param {string|Date|object} date - UTC datetime
 * @returns {string} Formatted datetime in UAE timezone (e.g., "Jan 15, 2025, 02:30 PM")
 */
export const formatDateTime = (date) => {
  return toUAETime(date, { format: 'datetime' });
};

/**
 * Format as DD/MM/YYYY in UAE timezone
 * @param {string|Date|object} date - UTC date
 * @returns {string} Date in DD/MM/YYYY format (UAE timezone)
 */
export const formatDateDMY = (date) => {
  return toUAETime(date, { format: 'short' });
};

/**
 * Format date for HTML input fields (YYYY-MM-DD) in UAE timezone
 * When displaying a UTC date in an input field, we show the UAE local date
 * @param {string|Date|object} date - UTC date
 * @returns {string} Date in YYYY-MM-DD format (UAE timezone)
 */
export const formatDateForInput = (date) => {
  return toUAEDateForInput(date);
};

// Normalize LLC formatting function
export const normalizeLLC = (companyName) => {
  if (!companyName) return '';
  
  // Regex to match any variation of LLC with optional periods, spaces, and case variations
  const llcPattern = /\b[Ll]\.?\s*[Ll]\.?\s*[Cc]\.?\b/g;
  
  // Replace all variations with standardized "LLC"
  return companyName.replace(llcPattern, 'LLC');
};

// Title-case each word: capitalize first letter, lowercase the rest
export const titleCase = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value).trim().toLowerCase();
  // Capitalize first alpha after a word boundary
  return s.replace(/\b([a-z])/g, (m, p1) => p1.toUpperCase());
};

// Numeric currency without symbol (e.g., 1,234.56)
export const formatNumber = (value, fractionDigits = 2) => {
  const num = Number(value);
  const safe = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
};

/**
 * Get company image URLs for PDF generation from company profile
 * ONLY uses images uploaded in Company Settings - no defaults
 * @param {Object} company - Company data from API
 * @returns {Object} { logoUrl, sealUrl }
 */
export const getCompanyImages = (company) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
  
  // Get logo URL - prioritize pdf_logo_url, fallback to logo_url
  let logoUrl = null;
  if (company?.pdfLogoUrl) {
    logoUrl = company.pdfLogoUrl.startsWith('/') 
      ? `${baseUrl}${company.pdfLogoUrl}` 
      : company.pdfLogoUrl;
  } else if (company?.logoUrl) {
    logoUrl = company.logoUrl.startsWith('/') 
      ? `${baseUrl}${company.logoUrl}` 
      : company.logoUrl;
  }
  
  // Get seal URL - use pdf_seal_url only
  let sealUrl = null;
  if (company?.pdfSealUrl) {
    sealUrl = company.pdfSealUrl.startsWith('/') 
      ? `${baseUrl}${company.pdfSealUrl}` 
      : company.pdfSealUrl;
  }
  
  return { logoUrl, sealUrl };
};

/**
 * Format an address object to displayable strings
 * @param {Object|string} address - Address object or string
 * @returns {Object} { line1, line2, full }
 */
export const formatAddress = (address) => {
  if (!address) return { line1: '', line2: '', full: '' };

  // If already a string, return as-is
  if (typeof address === 'string') {
    return { line1: address, line2: '', full: address };
  }

  const line1 = address.street || '';
  const cityParts = [address.city, address.state, address.postal_code].filter(Boolean);
  const line2Parts = [...cityParts];
  if (address.country) line2Parts.push(address.country);
  const line2 = line2Parts.join(', ');

  return {
    line1,
    line2,
    full: [line1, line2].filter(Boolean).join(', '),
  };
};

// ============================================================================
// RE-EXPORT PROFESSIONAL PDF DATE FORMATS
// These are the preferred formats for business documents (invoices, PDFs, etc.)
// ============================================================================

/**
 * Professional date format: "26 November 2025"
 * Use for: Invoice Date, Due Date, Order Date
 */
export { toUAEDateProfessional };

/**
 * Professional datetime format: "26 November 2025, 10:14 AM GST (UTC+4)"
 * Use for: Created/Updated timestamps in PDFs
 */
export { toUAEDateTimeProfessional };

/**
 * Short date format: "26/11/2025"
 * Use for: Compact date displays in tables
 */
export { toUAEDateShort };

/**
 * Payment datetime format: "26 Nov 2025, 2:30 PM GST"
 * Use for: Payment history entries
 */
export { toUAEPaymentDateTime };

/**
 * Timezone disclaimer for PDF footers
 * Value: "All dates and times are in Gulf Standard Time (GST, UTC+4)"
 */
export { TIMEZONE_DISCLAIMER };

/**
 * Short timezone label for inline use
 * Value: "GST (UTC+4)"
 */
export { TIMEZONE_LABEL };
