/**
 * Field Accessors - Safe access to API fields with snake_case/camelCase fallbacks
 *
 * The API Gateway converts snake_case (backend) to camelCase (frontend), but
 * inconsistencies can occur. These utilities handle both formats gracefully.
 *
 * Usage:
 *   import { getProductDisplayName, getPrice, getStock } from '@/utils/fieldAccessors';
 *   const name = getProductDisplayName(product);
 */

import { assertProductDomain } from "./productContract.js";

/**
 * Convert camelCase to snake_case
 * @param {string} str - camelCase string
 * @returns {string} snake_case string
 */
export const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
};

/**
 * Generic safe field accessor - handles both camelCase and snake_case
 * @param {Object} obj - Object to access
 * @param {string} camelCase - camelCase field name
 * @returns {any} Field value or undefined
 */
export const safeField = (obj, camelCase) => {
  if (!obj || typeof obj !== "object") return undefined;
  if (obj[camelCase] !== undefined) return obj[camelCase];
  const snakeCase = toSnakeCase(camelCase);
  return obj[snakeCase];
};

/**
 * CANONICAL PRODUCT NAME ACCESSORS
 *
 * The products table has 4 name columns (unique_name, full_name, display_name, name).
 * A DB trigger sets all 4 to the same SSOT value (e.g. "SS-304-Sheet-2B-1220x2440-1.5mm").
 * Today they never diverge, but the accessors below are the SINGLE SOURCE OF TRUTH
 * for precedence order — so if user-override of display_name is added later,
 * only this file needs to change.
 *
 * Use case mapping:
 *   UI labels/titles/tooltips → getProductDisplayName()
 *   System identifiers/sort keys/payloads → getProductUniqueName()
 *   Legacy callers that used getProductFullName → alias of getProductUniqueName()
 */

/**
 * Get product display name for UI rendering (labels, titles, tooltips).
 *
 * Precedence (first non-empty wins):
 *   1. displayName / display_name  — user-facing override (if it ever diverges)
 *   2. uniqueName  / unique_name   — canonical SSOT identity
 *   3. name                        — legacy column
 *
 * @param {Object} product - Product object (camelCase or snake_case fields)
 * @returns {string} Display name or empty string
 */
export const getProductDisplayName = (product) => {
  if (!product) return "";
  return product.displayName || product.display_name || product.uniqueName || product.unique_name || product.name || "";
};

/**
 * Get product unique/system name for identifiers, sort keys, and API payloads.
 *
 * Precedence (first non-empty wins):
 *   1. uniqueName / unique_name   — canonical SSOT identity
 *   2. fullName   / full_name     — always == unique_name (set by DB trigger)
 *   3. name                       — legacy column
 *
 * @param {Object} product - Product object (camelCase or snake_case fields)
 * @returns {string} Unique name or empty string
 */
export const getProductUniqueName = (product) => {
  if (!product) return "";
  return product.uniqueName || product.unique_name || product.fullName || product.full_name || product.name || "";
};

/**
 * @deprecated Use getProductUniqueName() instead.
 * Kept for backward compatibility — identical behavior.
 */
export const getProductFullName = getProductUniqueName;

/**
 * Get price from product with fallbacks
 * @param {Object} product - Product object
 * @param {'selling' | 'cost'} type - Price type (default: 'selling')
 * @returns {number} Price value or 0
 */
export const getPrice = (product, type = "selling") => {
  if (!product) return 0;
  if (type === "selling") {
    return product.sellingPrice ?? product.selling_price ?? product.price ?? 0;
  }
  return product.costPrice ?? product.cost_price ?? product.purchasePrice ?? product.purchase_price ?? 0;
};

/**
 * Get stock levels from product with fallbacks
 * @param {Object} product - Product object
 * @returns {{ current: number, min: number, max: number }} Stock levels
 */
export const getStock = (product) => {
  if (!product) return { current: 0, min: 0, max: 0 };
  return {
    current: product.currentStock ?? product.current_stock ?? product.quantity ?? 0,
    min: product.minStock ?? product.min_stock ?? product.reorderLevel ?? product.reorder_level ?? 0,
    max: product.maxStock ?? product.max_stock ?? 0,
  };
};

/**
 * Get timestamp field with fallbacks
 * @param {Object} obj - Object containing timestamp
 * @param {'createdAt' | 'updatedAt' | 'deletedAt'} field - Timestamp field name
 * @returns {string | null} ISO timestamp string or null
 */
export const getTimestamp = (obj, field = "createdAt") => {
  if (!obj) return null;
  const snakeCase = toSnakeCase(field);
  return obj[field] || obj[snakeCase] || null;
};

/**
 * Get customer fields with fallbacks
 * @param {Object} customer - Customer object
 * @returns {Object} Normalized customer fields
 */
export const getCustomerFields = (customer) => {
  if (!customer) return {};
  return {
    id: customer.id,
    name: customer.name || customer.companyName || customer.company_name || "",
    email: customer.email || "",
    phone: customer.phone || customer.phoneNumber || customer.phone_number || "",
    creditLimit: customer.creditLimit ?? customer.credit_limit ?? 0,
    currentCredit: customer.currentCredit ?? customer.current_credit ?? 0,
    paymentTerms: customer.paymentTerms || customer.payment_terms || "",
    trnNumber: customer.trnNumber || customer.trn_number || "",
  };
};

/**
 * Get invoice fields with fallbacks
 * @param {Object} invoice - Invoice object
 * @returns {Object} Normalized invoice fields
 */
export const getInvoiceFields = (invoice) => {
  if (!invoice) return {};
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || "",
    customerId: invoice.customerId ?? invoice.customer_id,
    status: invoice.status || "",
    paymentStatus: invoice.paymentStatus || invoice.payment_status || "",
    deliveryStatus: invoice.deliveryStatus || invoice.delivery_status || null,
    subtotal: invoice.subtotal ?? 0,
    vatAmount: invoice.vatAmount ?? invoice.vat_amount ?? 0,
    total: invoice.total ?? 0,
    totalPaid: invoice.totalPaid ?? invoice.total_paid ?? invoice.received ?? 0,
    balance: invoice.balance ?? invoice.outstanding ?? 0,
    createdAt: invoice.createdAt || invoice.created_at || null,
    updatedAt: invoice.updatedAt || invoice.updated_at || null,
  };
};

/**
 * Normalize a product object to always use camelCase
 * Use this when you need all fields normalized at once
 * @param {Object} product - Product object (may have mixed case fields)
 * @returns {Object} Product with camelCase fields
 */
export const normalizeProduct = (product) => {
  if (!product) return null;

  // Extract display/full/unique name with fallback chain
  const displayName = product.displayName || product.display_name || "";
  const fullName = product.fullName || product.full_name || "";
  const uniqueName = product.uniqueName || product.unique_name || "";

  // Step 1: Normalize snake_case → camelCase
  const normalized = {
    ...product,
    // Name fields
    displayName,
    fullName,
    uniqueName,
    // Provide a default name for the contract guard
    name: product.name || displayName || fullName || uniqueName || "",
    // Price fields
    sellingPrice: product.sellingPrice ?? product.selling_price ?? 0,
    costPrice: product.costPrice ?? product.cost_price ?? 0,
    // Stock fields
    currentStock: product.currentStock ?? product.current_stock ?? 0,
    minStock: product.minStock ?? product.min_stock ?? 0,
    maxStock: product.maxStock ?? product.max_stock ?? 0,
    // Size fields
    sizeInch: product.sizeInch || product.size_inch || "",
    // Origin
    origin: product.origin || "UAE",
    // BUGFIX: Critical fields for unit conversion & auto-pricing
    unitWeightKg: product.unitWeightKg ?? product.unit_weight_kg ?? null,
    piecesPerMt: product.piecesPerMt ?? product.pieces_per_mt ?? null,
    productCategory: product.productCategory || product.product_category || "",
    pricingBasis: product.pricingBasis ?? product.pricing_basis ?? null,
    primaryUom: product.primaryUom ?? product.primary_uom ?? null,
    form: product.form || "",
    // Additional dimension fields
    thickness: product.thickness || "",
    width: product.width || "",
    length: product.length || "",
    diameter: product.diameter || "",
  };

  // Step 2: Remove snake_case keys to prevent normalization leaks
  // This ensures the assertion won't fail on snake_case key presence
  delete normalized.unit_weight_kg;
  delete normalized.pieces_per_mt;
  delete normalized.product_category;
  delete normalized.pricing_basis;
  delete normalized.primary_uom;
  delete normalized.display_name;
  delete normalized.full_name;
  delete normalized.unique_name;
  delete normalized.selling_price;
  delete normalized.cost_price;
  delete normalized.current_stock;
  delete normalized.min_stock;
  delete normalized.max_stock;
  delete normalized.size_inch;

  // Step 3: Assert domain contract (GUARD #2 - SUSPENDERS)
  // This prevents corrupt product data from reaching UI components
  assertProductDomain(normalized);

  return normalized;
};

/**
 * Normalize unit of measure from proto enum format to display value
 * Handles: UNIT_OF_MEASURE_PCS -> PCS, UNIT_OF_MEASURE_KG -> KG, etc.
 * @param {Object|string} itemOrUnit - Item object with unit fields or raw unit string
 * @returns {string} Normalized UoM (e.g., 'PCS', 'KG', 'MT')
 */
export const normalizeUom = (itemOrUnit) => {
  let rawUom;
  if (typeof itemOrUnit === "string") {
    rawUom = itemOrUnit;
  } else if (itemOrUnit && typeof itemOrUnit === "object") {
    rawUom =
      itemOrUnit.unit ||
      itemOrUnit.unit_of_measure ||
      itemOrUnit.unitOfMeasure ||
      itemOrUnit.quantity_uom ||
      itemOrUnit.quantityUom ||
      "";
  } else {
    rawUom = "";
  }

  if (rawUom.startsWith("UNIT_OF_MEASURE_")) {
    return rawUom.replace("UNIT_OF_MEASURE_", "");
  }
  return rawUom || "PCS";
};

export default {
  safeField,
  toSnakeCase,
  getProductDisplayName,
  getProductUniqueName,
  getProductFullName,
  getPrice,
  getStock,
  getTimestamp,
  getCustomerFields,
  getInvoiceFields,
  normalizeProduct,
  normalizeUom,
};
