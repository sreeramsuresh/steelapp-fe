/**
 * safeAccess.js - Defensive data access helpers
 *
 * These utilities handle null/undefined values gracefully to prevent
 * "Cannot read properties of undefined" errors that crash widgets.
 *
 * Usage:
 *   import { safeEntries, safeGet, safeArray } from '../utils/safeAccess';
 *
 *   // Instead of: Object.entries(data)
 *   // Use: safeEntries(data)
 *
 *   // Instead of: user?.address?.city
 *   // Use: safeGet(user, 'address.city', 'Unknown')
 */

/**
 * Safely get Object.entries() - returns [] if obj is null/undefined
 *
 * @param {Object} obj - The object to get entries from
 * @returns {Array} Array of [key, value] pairs, or empty array
 *
 * @example
 * const breakdown = safeEntries(data?.breakdown);
 * breakdown.forEach(([category, info]) => console.log(category, info));
 */
export const safeEntries = (obj) => {
  if (obj === null || obj === undefined) {
    return [];
  }
  if (typeof obj !== "object" || Array.isArray(obj)) {
    return [];
  }
  try {
    return Object.entries(obj);
  } catch {
    return [];
  }
};

/**
 * Safely get Object.keys() - returns [] if obj is null/undefined
 *
 * @param {Object} obj - The object to get keys from
 * @returns {Array} Array of keys, or empty array
 *
 * @example
 * const categories = safeKeys(products);
 * if (categories.length === 0) {
 *   console.log('No products available');
 * }
 */
export const safeKeys = (obj) => {
  if (obj === null || obj === undefined) {
    return [];
  }
  if (typeof obj !== "object" || Array.isArray(obj)) {
    return [];
  }
  try {
    return Object.keys(obj);
  } catch {
    return [];
  }
};

/**
 * Safely get Object.values() - returns [] if obj is null/undefined
 *
 * @param {Object} obj - The object to get values from
 * @returns {Array} Array of values, or empty array
 *
 * @example
 * const allProducts = safeValues(inventory);
 * const totalStock = allProducts.reduce((sum, p) => sum + p.quantity, 0);
 */
export const safeValues = (obj) => {
  if (obj === null || obj === undefined) {
    return [];
  }
  if (typeof obj !== "object" || Array.isArray(obj)) {
    return [];
  }
  try {
    return Object.values(obj);
  } catch {
    return [];
  }
};

/**
 * Safely access nested object properties using a path string
 *
 * @param {Object} obj - The object to access
 * @param {string} path - Dot-separated path (e.g., 'user.address.city')
 * @param {*} defaultValue - Value to return if path doesn't exist
 * @returns {*} The value at the path, or defaultValue
 *
 * @example
 * const city = safeGet(customer, 'billing.address.city', 'Unknown');
 * const name = safeGet(invoice, 'items.0.productName', 'No Product');
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }

  if (typeof path !== "string" || path === "") {
    return defaultValue;
  }

  try {
    const keys = path.split(".");
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }

      // Handle array indices (e.g., 'items.0.name')
      if (Array.isArray(result)) {
        const index = parseInt(key, 10);
        if (isNaN(index) || index < 0 || index >= result.length) {
          return defaultValue;
        }
        result = result[index];
      } else if (typeof result === "object") {
        result = result[key];
      } else {
        return defaultValue;
      }
    }

    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Safely ensure a value is an array - returns [] if not an array
 *
 * @param {*} arr - The value to check
 * @returns {Array} The original array, or empty array if invalid
 *
 * @example
 * const items = safeArray(invoice?.lineItems);
 * items.map(item => <LineItem key={item.id} {...item} />);
 */
export const safeArray = (arr) => {
  if (Array.isArray(arr)) {
    return arr;
  }
  return [];
};

/**
 * Safely convert a value to a number - returns defaultValue if NaN
 *
 * @param {*} val - The value to convert
 * @param {number} defaultValue - Value to return if conversion fails (default: 0)
 * @returns {number} The numeric value, or defaultValue
 *
 * @example
 * const total = safeNumber(invoice?.total, 0);
 * const qty = safeNumber(item?.quantity, 1);
 */
export const safeNumber = (val, defaultValue = 0) => {
  if (val === null || val === undefined || val === "") {
    return defaultValue;
  }

  const num = Number(val);

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return num;
};

/**
 * Safely convert a value to a string - returns defaultValue if null/undefined
 *
 * @param {*} val - The value to convert
 * @param {string} defaultValue - Value to return if conversion fails (default: '')
 * @returns {string} The string value, or defaultValue
 *
 * @example
 * const customerName = safeString(customer?.name, 'Unknown Customer');
 * const status = safeString(invoice?.status, 'pending');
 */
export const safeString = (val, defaultValue = "") => {
  if (val === null || val === undefined) {
    return defaultValue;
  }

  if (typeof val === "string") {
    return val;
  }

  try {
    return String(val);
  } catch {
    return defaultValue;
  }
};

/**
 * Safely check if an object has a property
 *
 * @param {Object} obj - The object to check
 * @param {string} key - The property name
 * @returns {boolean} True if the property exists
 *
 * @example
 * if (safeHas(data, 'breakdown')) {
 *   renderBreakdown(data.breakdown);
 * }
 */
export const safeHas = (obj, key) => {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return false;
  }
  try {
    return Object.prototype.hasOwnProperty.call(obj, key);
  } catch {
    return false;
  }
};

/**
 * Safely get the length of an array or object
 *
 * @param {Array|Object} value - The value to check
 * @returns {number} Length of array or number of keys, or 0
 *
 * @example
 * const itemCount = safeLength(cart?.items);
 * if (itemCount === 0) showEmptyCart();
 */
export const safeLength = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (typeof value === "object") {
    try {
      return Object.keys(value).length;
    } catch {
      return 0;
    }
  }

  return 0;
};

// Default export with all utilities
export default {
  safeEntries,
  safeKeys,
  safeValues,
  safeGet,
  safeArray,
  safeNumber,
  safeString,
  safeHas,
  safeLength,
};
