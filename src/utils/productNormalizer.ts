/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Frontend Product Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes product data from API
 */

/**
 * Convert snake_case API response to camelCase Product object
 * @param rawProduct - Raw product data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized Product with camelCase fields
 */
export function normalizeProduct(rawProduct: any, source = "unknown"): any | null {
  if (!rawProduct || typeof rawProduct !== "object") {
    console.error(`❌ [Product Normalizer] Invalid product data from ${source}:`, rawProduct);
    return null;
  }

  try {
    // Helper to safely parse numbers
    const parseNumber = (value: any, fallback: unknown = undefined): number | undefined => {
      if (value === null || value === undefined) return fallback;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };

    // Build the normalized Product object (EXPLICIT snake_case → camelCase conversion)
    const normalized: unknown = {
      // Core identifiers
      id: rawProduct.id || 0,
      // uniqueName: Technical identifier with origin (source of truth for identity)
      // Used in dropdowns to distinguish Local vs Imported products
      uniqueName: rawProduct.uniqueName || rawProduct.unique_name || "",
      // displayName: User-friendly name for documents/invoices (without origin)
      displayName: rawProduct.displayName || rawProduct.display_name || "",
      // Keep legacy 'name' for backward compatibility, prefer displayName
      name: rawProduct.displayName || rawProduct.display_name || rawProduct.name || rawProduct.product_name || "",
      // fullName: Deprecated alias for uniqueName (for backward compatibility only)
      fullName: rawProduct.uniqueName || rawProduct.unique_name || rawProduct.fullName || rawProduct.full_name || "",
      title: rawProduct.title || rawProduct.displayName || rawProduct.display_name || "",
      description: rawProduct.description || undefined,

      // Category & Classification
      category: rawProduct.category || undefined,
      commodity: rawProduct.commodity || undefined,
      grade: rawProduct.grade || undefined,
      gradeVariant: rawProduct.gradeVariant || rawProduct.grade_variant || undefined,
      steelGrade: rawProduct.steelGrade || rawProduct.steel_grade || rawProduct.grade || undefined,

      // Dimensions
      thickness: rawProduct.thickness || undefined,
      thick: rawProduct.thick || rawProduct.thickness || undefined,
      width: rawProduct.width || undefined,
      length: rawProduct.length || undefined,
      size: rawProduct.size || undefined,
      sizeInch: rawProduct.sizeInch || rawProduct.size_inch || undefined,
      nbSize: rawProduct.nbSize || rawProduct.nb_size || undefined,
      diameter: rawProduct.diameter || undefined,
      od: rawProduct.od || undefined,
      dimensions: rawProduct.dimensions || undefined,

      // Finish & Specifications
      finish: rawProduct.finish || undefined,
      finishType: rawProduct.finishType || rawProduct.finish_type || undefined,
      surfaceFinish: rawProduct.surfaceFinish || rawProduct.surface_finish || rawProduct.finish || undefined,
      specifications: rawProduct.specifications || undefined,
      specification: rawProduct.specification || rawProduct.specifications || undefined,
      schedule: rawProduct.schedule || undefined,

      // Pricing
      price: parseNumber(rawProduct.price || rawProduct.selling_price || rawProduct.sellingPrice, undefined),
      sellingPrice: parseNumber(rawProduct.sellingPrice || rawProduct.selling_price || rawProduct.price, undefined),
      costPrice: parseNumber(rawProduct.costPrice || rawProduct.cost_price, undefined),
      purchasePrice: parseNumber(rawProduct.purchasePrice || rawProduct.purchase_price, undefined),
      unitPrice: parseNumber(rawProduct.unitPrice || rawProduct.unit_price, undefined),

      // Inventory & Stock
      currentStock: parseNumber(rawProduct.currentStock || rawProduct.current_stock, undefined),
      minStock: parseNumber(rawProduct.minStock || rawProduct.min_stock, undefined),
      maxStock: parseNumber(rawProduct.maxStock || rawProduct.max_stock, undefined),
      quantity: parseNumber(rawProduct.quantity, undefined),
      unit: rawProduct.unit || undefined,
      location: rawProduct.location || undefined,

      // Tax & Compliance
      hsnCode: rawProduct.hsnCode || rawProduct.hsn_code || undefined,
      gstRate: parseNumber(rawProduct.gstRate || rawProduct.gst_rate, undefined),

      // Analytics & Metrics
      revenue: parseNumber(rawProduct.revenue, undefined),
      revenueGrowth: parseNumber(rawProduct.revenueGrowth || rawProduct.revenue_growth, undefined),
      prevRevenue: parseNumber(rawProduct.prevRevenue || rawProduct.prev_revenue, undefined),
      sales: parseNumber(rawProduct.sales, undefined),
      orders: parseNumber(rawProduct.orders, undefined),
      ordersGrowth: parseNumber(rawProduct.ordersGrowth || rawProduct.orders_growth, undefined),
      prevOrders: parseNumber(rawProduct.prevOrders || rawProduct.prev_orders, undefined),
      quantityGrowth: parseNumber(rawProduct.quantityGrowth || rawProduct.quantity_growth, undefined),
      prevQuantity: parseNumber(rawProduct.prevQuantity || rawProduct.prev_quantity, undefined),

      // Related Data
      supplier: rawProduct.supplier || undefined,
      product: rawProduct.product || undefined,
      image: rawProduct.image || undefined,
    };

    return normalized;
  } catch (error) {
    console.error(`❌ [Product Normalizer] Failed to normalize product from ${source}:`, error);
    console.error("   Raw data:", rawProduct);
    return null;
  }
}

/**
 * Normalize array of products
 * @param rawProducts - Array of raw product data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized Product objects
 */
export function normalizeProducts(rawProducts: unknown[], source = "list"): unknown[] {
  if (!Array.isArray(rawProducts)) {
    console.error(`❌ [Product Normalizer] Expected array, got ${typeof rawProducts}`);
    return [];
  }

  return rawProducts
    .map((product, index) => normalizeProduct(product, `${source}[${index}]`))
    .filter((product): product is any => product !== null);
}
