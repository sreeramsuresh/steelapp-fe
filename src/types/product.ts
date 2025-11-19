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
  name: string;
  fullName?: string;
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
export function isProduct(obj: any): obj is Product {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string'
  );
}
