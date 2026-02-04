import {
  TIMEZONE_DISCLAIMER,
  TIMEZONE_LABEL,
  toUAEDateForInput,
  toUAEDateProfessional,
  toUAEDateShort,
  toUAEDateTimeProfessional,
  toUAEPaymentDateTime,
  toUAETime,
} from "./timezone";

/**
 * Calculate invoice line item amount based on UAE stainless steel trading conventions.
 *
 * PRICING BASIS RULES:
 * - PER_PCS: qty (pieces) × rate = amount
 * - PER_KG: qty (pieces) × unitWeightKg × rate = amount
 * - PER_MT: qty (pieces) × (unitWeightKg / 1000) × rate = amount
 * - PER_METER: qty (meters) × rate = amount
 * - PER_LOT: rate (qty is informational only)
 *
 * SPECIAL CASE - COILS:
 * When quantityUom is 'MT' or 'KG', quantity IS the weight (not pieces).
 * - quantityUom='MT': qty × rate = amount
 * - quantityUom='KG': (qty / 1000) × rate = amount (for PER_MT pricing)
 *
 * @param {number} quantity - Quantity (pieces for discrete items, weight for coils)
 * @param {number} rate - Rate per unit of pricing basis
 * @param {string} pricingBasis - PER_PCS, PER_KG, PER_MT, PER_METER, PER_LOT
 * @param {number} unitWeightKg - Weight per piece in kg (for discrete items)
 * @param {string} quantityUom - Unit of measure for quantity: PCS, KG, MT
 * @returns {number} Calculated amount rounded to 2 decimal places
 */
export const calculateItemAmount = (
  quantity,
  rate,
  pricingBasis = "PER_MT",
  unitWeightKg = null,
  quantityUom = "PCS"
) => {
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  const unitWt = parseFloat(unitWeightKg) || 0;

  if (qty === 0 || rt === 0) return 0;

  // Normalize inputs
  const basis = (pricingBasis || "PER_MT").toUpperCase();
  const uom = (quantityUom || "PCS").toUpperCase();

  let amount = 0;

  // CASE 1: Quantity is already in weight (coils, bulk material)
  if (uom === "MT") {
    // Quantity is in metric tons
    if (basis === "PER_MT") {
      amount = qty * rt;
    } else if (basis === "PER_KG") {
      amount = qty * 1000 * rt; // Convert MT to KG
    } else {
      // Fallback for unexpected basis with MT quantity
      amount = qty * rt;
    }
  } else if (uom === "KG") {
    // Quantity is in kilograms
    if (basis === "PER_MT") {
      amount = (qty / 1000) * rt; // Convert KG to MT
    } else if (basis === "PER_KG") {
      amount = qty * rt;
    } else {
      // Fallback
      amount = qty * rt;
    }
  }
  // CASE 2: Quantity is in pieces (discrete items: sheets, pipes, bars, fittings)
  else {
    switch (basis) {
      case "PER_PCS":
        // Simple: pieces × rate per piece
        amount = qty * rt;
        break;

      case "PER_KG":
        // pieces × weight per piece (kg) × rate per kg
        if (unitWt > 0) {
          amount = qty * unitWt * rt;
        } else {
          // Fallback if no unit weight (treat as per piece)
          console.warn("calculateItemAmount: PER_KG pricing but no unitWeightKg provided");
          amount = qty * rt;
        }
        break;

      case "PER_MT":
        // pieces × weight per piece (kg) / 1000 × rate per MT
        if (unitWt > 0) {
          const totalWeightMT = (qty * unitWt) / 1000;
          amount = totalWeightMT * rt;
        } else {
          // Fallback if no unit weight (treat as per piece) - LOG WARNING
          console.warn("calculateItemAmount: PER_MT pricing but no unitWeightKg provided");
          amount = qty * rt;
        }
        break;

      case "PER_METER":
        // qty (in meters) × rate per meter
        amount = qty * rt;
        break;

      case "PER_LOT":
        // Rate is for the entire lot, quantity is informational
        amount = rt;
        break;

      default:
        // Unknown basis - fallback to simple multiplication
        console.warn(`calculateItemAmount: Unknown pricing basis "${basis}", using qty × rate`);
        amount = qty * rt;
    }
  }

  // Round to 2 decimal places for currency
  return parseFloat(amount.toFixed(2));
};

/**
 * Calculate theoretical weight for an invoice line item.
 * Used for display and audit trail.
 *
 * @param {number} quantity - Quantity (pieces or weight depending on UOM)
 * @param {number} unitWeightKg - Weight per piece in kg
 * @param {string} quantityUom - PCS, KG, or MT
 * @returns {number} Total weight in kg
 */
export const calculateTheoreticalWeight = (quantity, unitWeightKg, quantityUom = "PCS") => {
  const qty = parseFloat(quantity) || 0;
  const unitWt = parseFloat(unitWeightKg) || 0;
  const uom = (quantityUom || "PCS").toUpperCase();

  if (uom === "MT") {
    return qty * 1000; // Convert MT to KG
  } else if (uom === "KG") {
    return qty; // Already in KG
  } else {
    // PCS - calculate from unit weight
    return qty * unitWt;
  }
};

/**
 * Validate quantity precision based on UOM rules.
 * Matches backend uomConversionService.validateQuantityPrecision
 *
 * RULES:
 * - PCS, BUNDLE: Must be whole numbers (no decimals)
 * - KG, MT: Up to 3 decimal places allowed
 * - METER: Up to 2 decimal places allowed
 *
 * @param {number} quantity - Quantity to validate
 * @param {string} unit - Unit of measure (PCS, KG, MT, BUNDLE, METER)
 * @returns {Object} { valid: boolean, message?: string }
 */
export const validateQuantityPrecision = (quantity, unit) => {
  const qty = parseFloat(quantity);
  const uom = (unit || "PCS").toUpperCase();

  // Check for valid number
  if (Number.isNaN(qty) || qty < 0) {
    return { valid: false, message: "Quantity must be a positive number" };
  }

  // Units requiring whole numbers
  const wholeNumberUnits = ["PCS", "BUNDLE", "PIECE", "PIECES", "SET", "SETS"];

  if (wholeNumberUnits.includes(uom)) {
    if (!Number.isInteger(qty)) {
      return {
        valid: false,
        message: `${uom} quantities must be whole numbers. Got: ${qty}`,
      };
    }
  }

  // Check decimal precision for weight units
  if (uom === "KG" || uom === "MT") {
    const decimalPlaces = (qty.toString().split(".")[1] || "").length;
    if (decimalPlaces > 3) {
      return {
        valid: false,
        message: `${uom} quantities allow max 3 decimal places. Got: ${decimalPlaces}`,
      };
    }
  }

  if (uom === "METER" || uom === "M") {
    const decimalPlaces = (qty.toString().split(".")[1] || "").length;
    if (decimalPlaces > 2) {
      return {
        valid: false,
        message: `METER quantities allow max 2 decimal places. Got: ${decimalPlaces}`,
      };
    }
  }

  return { valid: true };
};

/**
 * Convert quantity between units of measure.
 * Matches backend uomConversionService.convertQuantity
 *
 * SUPPORTED CONVERSIONS:
 * - KG ↔ MT (factor: 1000)
 * - PCS ↔ KG (requires unitWeightKg)
 * - PCS ↔ MT (requires unitWeightKg)
 *
 * @param {number} quantity - Quantity to convert
 * @param {string} fromUnit - Source UOM (PCS, KG, MT)
 * @param {string} toUnit - Target UOM (PCS, KG, MT)
 * @param {number} unitWeightKg - Weight per piece in kg (required for PCS conversions)
 * @returns {number} Converted quantity
 * @throws {Error} If conversion results in fractional pieces
 */
export const convertQuantity = (quantity, fromUnit, toUnit, unitWeightKg = null) => {
  const qty = parseFloat(quantity);
  const from = (fromUnit || "PCS").toUpperCase();
  const to = (toUnit || "PCS").toUpperCase();
  const unitWt = parseFloat(unitWeightKg) || 0;

  // Validate input
  if (Number.isNaN(qty) || qty < 0) {
    throw new Error("Invalid quantity: must be a non-negative number");
  }

  // Same unit - no conversion needed
  if (from === to) return qty;

  // Zero quantity - no conversion needed
  if (qty === 0) return 0;

  let converted;

  // KG ↔ MT conversions
  if (from === "KG" && to === "MT") {
    converted = qty / 1000;
  } else if (from === "MT" && to === "KG") {
    converted = qty * 1000;
  }
  // PCS → KG
  else if (from === "PCS" && to === "KG") {
    if (!unitWt || unitWt <= 0) {
      throw new Error("Unit weight required for PCS to KG conversion");
    }
    converted = qty * unitWt;
  }
  // KG → PCS
  else if (from === "KG" && to === "PCS") {
    if (!unitWt || unitWt <= 0) {
      throw new Error("Unit weight required for KG to PCS conversion");
    }
    converted = qty / unitWt;
    // Validate whole pieces
    if (!Number.isInteger(converted)) {
      const rounded = Math.round(converted * 100) / 100;
      throw new Error(
        `Conversion results in fractional pieces (${rounded}). ` + `${qty} KG ÷ ${unitWt} kg/piece = ${rounded} pieces`
      );
    }
  }
  // PCS → MT
  else if (from === "PCS" && to === "MT") {
    if (!unitWt || unitWt <= 0) {
      throw new Error("Unit weight required for PCS to MT conversion");
    }
    converted = (qty * unitWt) / 1000;
  }
  // MT → PCS
  else if (from === "MT" && to === "PCS") {
    if (!unitWt || unitWt <= 0) {
      throw new Error("Unit weight required for MT to PCS conversion");
    }
    const kgQty = qty * 1000;
    converted = kgQty / unitWt;
    // Validate whole pieces
    if (!Number.isInteger(converted)) {
      const rounded = Math.round(converted * 100) / 100;
      throw new Error(
        `Conversion results in fractional pieces (${rounded}). ` +
          `${qty} MT = ${kgQty} KG ÷ ${unitWt} kg/piece = ${rounded} pieces`
      );
    }
  }
  // Unsupported conversion
  else {
    throw new Error(`Unsupported conversion: ${from} to ${to}`);
  }

  return converted;
};

/**
 * Check if conversion between two units is possible.
 *
 * @param {string} fromUnit - Source UOM
 * @param {string} toUnit - Target UOM
 * @param {number} unitWeightKg - Weight per piece (for PCS conversions)
 * @returns {boolean} True if conversion is possible
 */
export const canConvertQuantity = (fromUnit, toUnit, unitWeightKg = null) => {
  const from = (fromUnit || "PCS").toUpperCase();
  const to = (toUnit || "PCS").toUpperCase();

  // Same unit always works
  if (from === to) return true;

  // KG ↔ MT always works
  if ((from === "KG" && to === "MT") || (from === "MT" && to === "KG")) {
    return true;
  }

  // PCS conversions require unit weight
  const pcsConversions = ["PCS", "KG", "MT"];
  if (pcsConversions.includes(from) && pcsConversions.includes(to)) {
    return unitWeightKg && parseFloat(unitWeightKg) > 0;
  }

  return false;
};

/**
 * Validate actual weight against theoretical weight with tolerance.
 * Industry standard tolerances for stainless steel products.
 *
 * @param {number} actualWeightKg - Actual weighed weight
 * @param {number} theoreticalWeightKg - Calculated theoretical weight
 * @param {string} productCategory - Product category (PLATES, COILS, PIPES, FITTINGS, etc.)
 * @returns {Object} { valid, varianceKg, variancePct, tolerancePct, message, severity }
 */
export const validateWeightTolerance = (actualWeightKg, theoreticalWeightKg, productCategory = "PLATES") => {
  const actual = parseFloat(actualWeightKg) || 0;
  const theoretical = parseFloat(theoreticalWeightKg) || 0;

  // Tolerance by product category (industry standard)
  const tolerances = {
    PLATES: 3,
    SHEETS: 3,
    COILS: 5,
    PIPES: 10,
    TUBES: 10,
    FITTINGS: 2,
    FLANGES: 2,
    BARS: 3,
    DEFAULT: 5,
  };

  const category = (productCategory || "DEFAULT").toUpperCase();
  const tolerancePct = tolerances[category] || tolerances.DEFAULT;

  // Handle edge cases
  if (theoretical === 0) {
    if (actual === 0) {
      return {
        valid: true,
        varianceKg: 0,
        variancePct: 0,
        tolerancePct,
        message: "No weight data",
        severity: "none",
      };
    }
    return {
      valid: false,
      varianceKg: actual,
      variancePct: 100,
      tolerancePct,
      message: "Theoretical weight is zero but actual weight provided",
      severity: "error",
    };
  }

  // Calculate variance
  const varianceKg = actual - theoretical;
  const variancePct = (varianceKg / theoretical) * 100;
  const absVariancePct = Math.abs(variancePct);

  // Check if within tolerance
  const valid = absVariancePct <= tolerancePct;

  // Determine severity for UI display
  let severity = "success";
  if (absVariancePct > tolerancePct * 2) {
    severity = "error"; // Exceeds 2x tolerance - block
  } else if (absVariancePct > tolerancePct) {
    severity = "warning"; // Exceeds tolerance - warn
  } else if (absVariancePct > tolerancePct * 0.5) {
    severity = "caution"; // Over 50% of tolerance
  }

  return {
    valid,
    varianceKg: parseFloat(varianceKg.toFixed(3)),
    variancePct: parseFloat(variancePct.toFixed(2)),
    tolerancePct,
    message: valid
      ? `Within tolerance (${absVariancePct.toFixed(1)}% vs ±${tolerancePct}% allowed)`
      : `Exceeds tolerance: ${absVariancePct.toFixed(1)}% variance (±${tolerancePct}% allowed for ${category})`,
    severity,
  };
};

/**
 * Calculate weight variance fields (simpler version for display)
 *
 * @param {number} actualWeightKg - Actual weighed weight
 * @param {number} theoreticalWeightKg - Calculated theoretical weight
 * @returns {Object} { varianceKg, variancePct }
 */
export const calculateWeightVariance = (actualWeightKg, theoreticalWeightKg) => {
  const actual = parseFloat(actualWeightKg) || 0;
  const theoretical = parseFloat(theoreticalWeightKg) || 0;

  if (theoretical === 0) {
    return { varianceKg: actual, variancePct: actual === 0 ? 0 : 100 };
  }

  const varianceKg = actual - theoretical;
  const variancePct = (varianceKg / theoretical) * 100;

  return {
    varianceKg: parseFloat(varianceKg.toFixed(3)),
    variancePct: parseFloat(variancePct.toFixed(2)),
  };
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
  if (discountType === "percentage" && pct > 0) {
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
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `INV-${yearMonth}-0001`;
};

export const generatePONumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `PO-${yearMonth}-0001`;
};

export const generateQuotationNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `QT-${yearMonth}-0001`;
};

export const generateDeliveryNoteNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `DN-${yearMonth}-0001`;
};

export const formatCurrency = (amount) => {
  // Handle NaN, null, undefined, or non-numeric values
  const numericAmount = parseFloat(amount);
  const safeAmount = Number.isNaN(numericAmount) ? 0 : numericAmount;

  // Bug #38 fix: Explicitly set decimal places to ensure consistent formatting
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

/**
 * Format date for display in UAE timezone
 * All dates from the backend are stored in UTC and should be displayed in UAE time
 * @param {string|Date|object} date - UTC date (can be proto Timestamp with seconds property)
 * @returns {string} Formatted date in UAE timezone (e.g., "January 15, 2025")
 */
export const formatDate = (date) => {
  return toUAETime(date, { format: "long" });
};

/**
 * Format datetime for display in UAE timezone
 * @param {string|Date|object} date - UTC datetime
 * @returns {string} Formatted datetime in UAE timezone (e.g., "Jan 15, 2025, 02:30 PM")
 */
export const formatDateTime = (date) => {
  return toUAETime(date, { format: "datetime" });
};

/**
 * Format as DD/MM/YYYY in UAE timezone
 * @param {string|Date|object} date - UTC date
 * @returns {string} Date in DD/MM/YYYY format (UAE timezone)
 */
export const formatDateDMY = (date) => {
  return toUAETime(date, { format: "short" });
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
  if (!companyName) return "";

  // Regex to match any variation of LLC with optional periods, spaces, and case variations
  const llcPattern = /\b[Ll]\.?\s*[Ll]\.?\s*[Cc]\.?\b/g;

  // Replace all variations with standardized "LLC"
  return companyName.replace(llcPattern, "LLC");
};

// Title-case each word: capitalize first letter, lowercase the rest
export const titleCase = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value).trim().toLowerCase();
  // Capitalize first alpha after a word boundary
  return s.replace(/\b([a-z])/g, (_m, p1) => p1.toUpperCase());
};

// Numeric currency without symbol (e.g., 1,234.56)
export const formatNumber = (value, fractionDigits = 2) => {
  const num = Number(value);
  const safe = Number.isNaN(num) ? 0 : num;
  return new Intl.NumberFormat("en-AE", {
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
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";

  // Get logo URL - prioritize pdf_logo_url, fallback to logo_url
  let logoUrl = null;
  if (company?.pdfLogoUrl) {
    logoUrl = company.pdfLogoUrl.startsWith("/") ? `${baseUrl}${company.pdfLogoUrl}` : company.pdfLogoUrl;
  } else if (company?.logoUrl) {
    logoUrl = company.logoUrl.startsWith("/") ? `${baseUrl}${company.logoUrl}` : company.logoUrl;
  }

  // Get seal URL - use pdf_seal_url only
  let sealUrl = null;
  if (company?.pdfSealUrl) {
    sealUrl = company.pdfSealUrl.startsWith("/") ? `${baseUrl}${company.pdfSealUrl}` : company.pdfSealUrl;
  }

  return { logoUrl, sealUrl };
};

/**
 * Format an address object to displayable strings
 * @param {Object|string} address - Address object, JSON string, or plain string
 * @returns {Object} { line1, line2, full }
 */
export const formatAddress = (address) => {
  if (!address) return { line1: "", line2: "", full: "" };

  // If string, check if it's JSON and try to parse it
  if (typeof address === "string") {
    // Try to parse as JSON if it looks like JSON
    if (address.startsWith("{") || address.startsWith("[")) {
      try {
        const parsed = JSON.parse(address);
        // Recursively call with parsed object
        return formatAddress(parsed);
      } catch {
        // Not valid JSON, treat as plain string
        return { line1: address, line2: "", full: address };
      }
    }
    // Plain string address
    return { line1: address, line2: "", full: address };
  }

  const line1 = address.street || "";
  const cityParts = [address.city, address.state, address.postal_code].filter(Boolean);
  const line2Parts = [...cityParts];
  if (address.country) line2Parts.push(address.country);
  const line2 = line2Parts.join(", ");

  return {
    line1,
    line2,
    full: [line1, line2].filter(Boolean).join(", "),
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
