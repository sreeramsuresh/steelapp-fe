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

/**
 * Convert camelCase to snake_case
 * @param {string} str - camelCase string
 * @returns {string} snake_case string
 */
export const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, (m) => `_${  m.toLowerCase()}`);
};

/**
 * Generic safe field accessor - handles both camelCase and snake_case
 * @param {Object} obj - Object to access
 * @param {string} camelCase - camelCase field name
 * @returns {any} Field value or undefined
 */
export const safeField = (obj, camelCase) => {
  if (!obj || typeof obj !== 'object') return undefined;
  if (obj[camelCase] !== undefined) return obj[camelCase];
  const snakeCase = toSnakeCase(camelCase);
  return obj[snakeCase];
};

/**
 * Get product display name with all fallbacks
 * Priority: displayName > display_name > fullName > full_name > name
 * @param {Object} product - Product object
 * @returns {string} Display name or empty string
 */
export const getProductDisplayName = (product) => {
  if (!product) return '';
  return (
    product.displayName ||
    product.display_name ||
    product.fullName ||
    product.full_name ||
    product.name ||
    ''
  );
};

/**
 * Get product full name (with origin) with all fallbacks
 * Priority: fullName > full_name > displayName > display_name > name
 * @param {Object} product - Product object
 * @returns {string} Full name or empty string
 */
export const getProductFullName = (product) => {
  if (!product) return '';
  return (
    product.fullName ||
    product.full_name ||
    product.displayName ||
    product.display_name ||
    product.name ||
    ''
  );
};

/**
 * Get price from product with fallbacks
 * @param {Object} product - Product object
 * @param {'selling' | 'cost'} type - Price type (default: 'selling')
 * @returns {number} Price value or 0
 */
export const getPrice = (product, type = 'selling') => {
  if (!product) return 0;
  if (type === 'selling') {
    return (
      product.sellingPrice ??
      product.selling_price ??
      product.price ??
      0
    );
  }
  return (
    product.costPrice ??
    product.cost_price ??
    product.purchasePrice ??
    product.purchase_price ??
    0
  );
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
export const getTimestamp = (obj, field = 'createdAt') => {
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
    name: customer.name || customer.companyName || customer.company_name || '',
    email: customer.email || '',
    phone: customer.phone || customer.phoneNumber || customer.phone_number || '',
    creditLimit: customer.creditLimit ?? customer.credit_limit ?? 0,
    currentCredit: customer.currentCredit ?? customer.current_credit ?? 0,
    paymentTerms: customer.paymentTerms || customer.payment_terms || '',
    trnNumber: customer.trnNumber || customer.trn_number || '',
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
    invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || '',
    customerId: invoice.customerId ?? invoice.customer_id,
    status: invoice.status || '',
    paymentStatus: invoice.paymentStatus || invoice.payment_status || '',
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
  return {
    ...product,
    // Name fields
    displayName: product.displayName || product.display_name || '',
    fullName: product.fullName || product.full_name || '',
    uniqueName: product.uniqueName || product.unique_name || '',
    // Price fields
    sellingPrice: product.sellingPrice ?? product.selling_price ?? 0,
    costPrice: product.costPrice ?? product.cost_price ?? 0,
    // Stock fields
    currentStock: product.currentStock ?? product.current_stock ?? 0,
    minStock: product.minStock ?? product.min_stock ?? 0,
    maxStock: product.maxStock ?? product.max_stock ?? 0,
    // Size fields
    sizeInch: product.sizeInch || product.size_inch || '',
    // Origin
    origin: product.origin || 'UAE',
  };
};

export default {
  safeField,
  toSnakeCase,
  getProductDisplayName,
  getProductFullName,
  getPrice,
  getStock,
  getTimestamp,
  getCustomerFields,
  getInvoiceFields,
  normalizeProduct,
};
