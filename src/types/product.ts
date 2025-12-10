/**
 * Canonical Product Type (camelCase only)
 * This is the NORMALIZED frontend schema after productNormalizer processes API data.
 * 
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The productNormalizer converts snake_case → camelCase.
 */

/**
 * Main Product interface - CAMELCASE ONLY
 * All fields that exist after productNormalizer processing
 */
export interface Product {
  // Core identifiers
  id: number;
  
  // SSOT Naming Fields (canonical product naming)
  uniqueName?: string;       // Technical identifier: SS-304-Sheet-2B-1220mm-1.5mm-2440mm (with origin)
  displayName?: string;      // User-friendly display name (without origin, for invoices/documents)
  
  // Legacy naming fields (keep for backward compatibility)
  name: string;              // Deprecated: use displayName instead
  fullName?: string;         // Deprecated: use uniqueName instead
  title?: string;
  description?: string;
  
  // Category & Classification
  category?: string;
  commodity?: string;
  grade?: string;
  gradeVariant?: string;
  steelGrade?: string;
  
  // Dimensions
  thickness?: string | number;
  thick?: string | number; // Alias for thickness
  width?: string | number;
  length?: string | number;
  size?: string;
  sizeInch?: string | number;
  nbSize?: string;
  diameter?: string | number;
  od?: string | number; // Outer diameter
  dimensions?: string | object;
  
  // Finish & Specifications
  finish?: string;
  finishType?: string;
  surfaceFinish?: string; // Alias for finish
  specifications?: string;
  specification?: string; // Singular alias
  schedule?: string;

  // Phase 3: Product Master Data (added 2025-12-02)
  hsCode?: string;                    // Harmonized System code (6-10 digits for customs)
  countryOfOrigin?: string;           // Manufacturing country for export docs
  millName?: string;                  // Steel mill/manufacturer name
  productCategory?: string;           // Product category (COIL, SHEET, PLATE, PIPE, TUBE, BAR, FLAT)
  surfaceFinishOptions?: string | Array<{finish: string, available: boolean}>; // Available finishes
  
  // Pricing
  price?: number;
  sellingPrice?: number;
  costPrice?: number;
  purchasePrice?: number;
  unitPrice?: number;
  
  // Inventory & Stock
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  quantity?: number;
  unit?: string;
  location?: string;
  
  // Tax & Compliance
  hsnCode?: string;
  gstRate?: number;
  
  // Analytics & Metrics
  revenue?: number;
  revenueGrowth?: number;
  prevRevenue?: number;
  sales?: number;
  orders?: number;
  ordersGrowth?: number;
  prevOrders?: number;
  quantityGrowth?: number;
  prevQuantity?: number;
  
  // Related Data
  supplier?: string | object;
  product?: object; // Nested product reference
  image?: string;
}

/**
 * Type guard to check if object is a valid Product
 */
export function isProduct(obj: unknown): obj is Product {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.name === 'string'
  );
}
