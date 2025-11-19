/**
 * Frontend Supplier Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes supplier data from API
 */

/**
 * Convert snake_case API response to camelCase Supplier object
 * @param rawSupplier - Raw supplier data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized Supplier with camelCase fields
 */
export function normalizeSupplier(rawSupplier: any, source = 'unknown'): any | null {
  if (!rawSupplier || typeof rawSupplier !== 'object') {
    console.error(`❌ [Supplier Normalizer] Invalid supplier data from ${source}:`, rawSupplier);
    return null;
  }

  const errors: string[] = [];

  try {
    // Build the normalized Supplier object
    const normalized: any = {
      // Core identifiers
      id: rawSupplier.id || 0,
      name: rawSupplier.name || rawSupplier.supplier_name || '',
      
      // Contact information
      email: rawSupplier.email || rawSupplier.email_address || undefined,
      phone: rawSupplier.phone || rawSupplier.phone_number || undefined,
      address: rawSupplier.address || undefined,
      
      // Tax & Compliance
      trn: rawSupplier.trn || rawSupplier.tax_registration_number || undefined,
      
      // Financial
      paymentTerms: rawSupplier.paymentTerms || rawSupplier.payment_terms || undefined
    };

    // Log validation errors if any
    if (errors.length > 0) {
      console.warn(`⚠️ [Supplier Normalizer] Validation warnings from ${source}:`);
      errors.forEach(error => console.warn(`   - ${error}`));
    }

    return normalized;
    
  } catch (error) {
    console.error(`❌ [Supplier Normalizer] Failed to normalize supplier from ${source}:`, error);
    console.error('   Raw data:', rawSupplier);
    return null;
  }
}

/**
 * Normalize array of suppliers
 * @param rawSuppliers - Array of raw supplier data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized Supplier objects
 */
export function normalizeSuppliers(rawSuppliers: any[], source = 'list'): any[] {
  if (!Array.isArray(rawSuppliers)) {
    console.error(`❌ [Supplier Normalizer] Expected array, got ${typeof rawSuppliers}`);
    return [];
  }

  return rawSuppliers
    .map((supplier, index) => normalizeSupplier(supplier, `${source}[${index}]`))
    .filter((supplier): supplier is any => supplier !== null);
}
