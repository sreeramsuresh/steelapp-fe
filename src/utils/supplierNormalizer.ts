/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // Helper to safely parse dates
  const parseDate = (value: any): string | undefined => {
    if (!value) return undefined;
    if (value?.seconds) return new Date(parseInt(value.seconds) * 1000).toISOString();
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return undefined;
  };

  try {
    // Build the normalized Supplier object
    const normalized: any = {
      // Core identifiers
      id: rawSupplier.id || 0,
      companyId: rawSupplier.company_id || rawSupplier.companyId,
      name: rawSupplier.name || rawSupplier.supplier_name || '',
      
      // Contact information
      email: rawSupplier.email || rawSupplier.email_address || undefined,
      phone: rawSupplier.phone || rawSupplier.phone_number || undefined,
      contactPerson: rawSupplier.contact_person || rawSupplier.contactPerson || undefined,
      website: rawSupplier.website || undefined,
      address: rawSupplier.address || undefined,
      
      // Tax & Compliance (6 fields)
      trn: rawSupplier.trn || rawSupplier.tax_registration_number || undefined,
      vatNumber: rawSupplier.vat_number || rawSupplier.vatNumber || undefined,
      businessLicense: rawSupplier.business_license || rawSupplier.businessLicense || undefined,
      taxId: rawSupplier.tax_id || rawSupplier.taxId || undefined,
      certifications: rawSupplier.certifications || undefined,  // JSON string
      isDesignatedZone: rawSupplier.isDesignatedZone || rawSupplier.is_designated_zone || false,
      
      // Financial (4 fields)
      paymentTerms: rawSupplier.payment_terms || rawSupplier.paymentTerms || undefined,
      creditLimit: rawSupplier.credit_limit || rawSupplier.creditLimit || undefined,
      currentCredit: rawSupplier.current_credit || rawSupplier.currentCredit || undefined,
      bankDetails: rawSupplier.bank_details || rawSupplier.bankDetails || undefined,  // JSON string
      defaultCurrency: rawSupplier.default_currency || rawSupplier.defaultCurrency || 'AED',
      
      // Categorization
      category: rawSupplier.category || undefined,
      country: rawSupplier.country || undefined,
      countryId: rawSupplier.country_id || rawSupplier.countryId || undefined,
      
      // Status & Audit (3 fields)
      isActive: rawSupplier.is_active !== undefined ? Boolean(rawSupplier.is_active) : true,
      createdAt: parseDate(rawSupplier.created_at || rawSupplier.createdAt),
      updatedAt: parseDate(rawSupplier.updated_at || rawSupplier.updatedAt),
      
      // Notes
      notes: rawSupplier.notes || undefined,
    };

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
