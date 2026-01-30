/**
 * Inventory Synchronization Utilities
 * Ensures consistent inventory data across Products and Warehouses modules
 *
 * PROBLEM: Products and Warehouses modules were loading inventory from different
 * sources, causing data inconsistencies (e.g., different stock counts, low stock alerts).
 *
 * SOLUTION: Centralized data transformation and caching to ensure single source of truth
 */

// Simple in-memory cache to ensure both modules see the same data within a session
const INVENTORY_CACHE = {
  lastFetch: null,
  data: null,
  ttl: 30000, // Cache for 30 seconds to ensure consistency across modules
};

/**
 * Get cached inventory data if still fresh
 * @returns {Object|null} Cached data or null if expired/not available
 */
export function getCachedInventoryData() {
  if (!INVENTORY_CACHE.data || !INVENTORY_CACHE.lastFetch) {
    return null;
  }

  const now = Date.now();
  const age = now - INVENTORY_CACHE.lastFetch;

  // Return cached data if still within TTL
  if (age < INVENTORY_CACHE.ttl) {
    return INVENTORY_CACHE.data;
  }

  // Cache expired
  INVENTORY_CACHE.data = null;
  INVENTORY_CACHE.lastFetch = null;
  return null;
}

/**
 * Store inventory data in cache for module synchronization
 * @param {Object} data - Inventory data to cache
 */
export function setCachedInventoryData(data) {
  INVENTORY_CACHE.data = data;
  INVENTORY_CACHE.lastFetch = Date.now();
}

/**
 * Clear inventory cache to force fresh fetch
 */
export function clearInventoryCache() {
  INVENTORY_CACHE.data = null;
  INVENTORY_CACHE.lastFetch = null;
}

/**
 * Transform inventory data consistently across modules
 * Ensures products and warehouses modules see identical data
 * @param {Object} rawData - Raw inventory data from API
 * @returns {Object} Transformed and normalized inventory data
 */
export function normalizeInventoryData(rawData) {
  if (!rawData) return null;

  return {
    products: Array.isArray(rawData.products) ? rawData.products : [],
    warehouses: Array.isArray(rawData.warehouses) ? rawData.warehouses : [],
    summary: {
      totalProducts: rawData.summary?.totalProducts || 0,
      lowStockCount: rawData.summary?.lowStockCount || 0,
      outOfStockCount: rawData.summary?.outOfStockCount || 0,
      totalStockValue: rawData.summary?.totalStockValue || 0,
      warehouseCount: rawData.summary?.warehouseCount || 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Trigger synchronized refresh across both modules
 * Call this when inventory changes (create, update, delete)
 * @param {Function} productsRefetch - Products module refetch function
 * @param {Function} warehousesRefetch - Warehouses module refetch function
 */
export async function triggerSynchronizedInventoryRefresh(
  productsRefetch,
  warehousesRefetch,
) {
  // Clear cache first
  clearInventoryCache();

  // Trigger both refetches in parallel
  await Promise.all([
    productsRefetch?.(),
    warehousesRefetch?.(),
  ]).catch((error) => {
    console.warn('Error during synchronized inventory refresh:', error);
  });
}

/**
 * Calculate low stock items from product list
 * Used by both Products and Warehouses modules for consistent count
 * @param {Array} products - List of products with stock info
 * @param {number} minimumStockLevel - Threshold below which stock is considered low
 * @returns {number} Count of low stock items
 */
export function calculateLowStockCount(
  products,
  minimumStockLevel = 50,
) {
  if (!Array.isArray(products)) return 0;

  return products.filter((product) => {
    const quantity = product.quantity_on_hand || product.quantityOnHand || 0;
    return quantity > 0 && quantity < minimumStockLevel;
  }).length;
}

/**
 * Ensure both modules use the same stock status mapping
 * @param {number} quantity - Stock quantity
 * @param {number} minimumLevel - Minimum stock level threshold
 * @returns {string} Stock status: 'in_stock' | 'low_stock' | 'out_of_stock'
 */
export function getConsistentStockStatus(
  quantity,
  minimumLevel = 50,
) {
  const qty = Number(quantity) || 0;

  if (qty === 0) {
    return 'out_of_stock';
  }

  if (qty < minimumLevel) {
    return 'low_stock';
  }

  return 'in_stock';
}

export default {
  getCachedInventoryData,
  setCachedInventoryData,
  clearInventoryCache,
  normalizeInventoryData,
  triggerSynchronizedInventoryRefresh,
  calculateLowStockCount,
  getConsistentStockStatus,
};
