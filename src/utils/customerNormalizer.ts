/**
 * Frontend Customer Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes customer data from API
 */

/**
 * Convert snake_case API response to camelCase Customer object
 * @param rawCustomer - Raw customer data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized Customer with camelCase fields
 */
export function normalizeCustomer(rawCustomer: any, source = 'unknown'): any | null {
  if (!rawCustomer || typeof rawCustomer !== 'object') {
    console.error(`❌ [Customer Normalizer] Invalid customer data from ${source}:`, rawCustomer);
    return null;
  }

  const errors: string[] = [];

  try {
    // Helper to safely parse numbers
    const parseNumber = (value: any, fallback: any = undefined): number | undefined => {
      if (value === null || value === undefined) return fallback;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    };

    // Build the normalized Customer object
    const normalized: any = {
      // Core identifiers
      id: rawCustomer.id || 0,
      name: rawCustomer.name || rawCustomer.customer_name || '',
      company: rawCustomer.company || rawCustomer.company_name || undefined,
      
      // Contact information
      email: rawCustomer.email || rawCustomer.email_address || undefined,
      phone: rawCustomer.phone || rawCustomer.phone_number || undefined,
      address: rawCustomer.address || undefined,
      
      // Tax & Compliance
      vatNumber: rawCustomer.vatNumber || rawCustomer.vat_number || rawCustomer.gstNumber || rawCustomer.gst_number || undefined,
      trn: rawCustomer.trn || rawCustomer.tax_registration_number || undefined,
      
      // Financial
      creditLimit: parseNumber(rawCustomer.creditLimit || rawCustomer.credit_limit, undefined),
      currentCredit: parseNumber(rawCustomer.currentCredit || rawCustomer.current_credit, undefined),
      paymentTerms: rawCustomer.paymentTerms || rawCustomer.payment_terms || undefined,
      revenue: parseNumber(rawCustomer.revenue, undefined),
      
      // Metadata
      status: rawCustomer.status || undefined,
      orders: parseNumber(rawCustomer.orders, undefined),
      customer: rawCustomer.customer || undefined,
    };

    // Log validation errors if any
    if (errors.length > 0) {
      console.warn(`⚠️ [Customer Normalizer] Validation warnings from ${source}:`);
      errors.forEach(error => console.warn(`   - ${error}`));
    }

    return normalized;
    
  } catch (error) {
    console.error(`❌ [Customer Normalizer] Failed to normalize customer from ${source}:`, error);
    console.error('   Raw data:', rawCustomer);
    return null;
  }
}

/**
 * Normalize array of customers
 * @param rawCustomers - Array of raw customer data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized Customer objects
 */
export function normalizeCustomers(rawCustomers: any[], source = 'list'): any[] {
  if (!Array.isArray(rawCustomers)) {
    console.error(`❌ [Customer Normalizer] Expected array, got ${typeof rawCustomers}`);
    return [];
  }

  return rawCustomers
    .map((customer, index) => normalizeCustomer(customer, `${source}[${index}]`))
    .filter((customer): customer is any => customer !== null);
}
