/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Frontend Delivery Note Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes delivery note data from API
 */

/**
 * Convert snake_case API response to camelCase DeliveryNote object
 * @param rawDN - Raw delivery note data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized DeliveryNote with camelCase fields
 */
export function normalizeDeliveryNote(rawDN: any, source = "unknown"): any | null {
  if (!rawDN || typeof rawDN !== "object") {
    console.error(`❌ [DeliveryNote Normalizer] Invalid delivery note data from ${source}:`, rawDN);
    return null;
  }

  try {
    // Helper to safely parse dates
    const parseDate = (value: any): string | undefined => {
      if (!value) return undefined;

      // Handle Timestamp objects
      if (value?.seconds) {
        return new Date(parseInt(value.seconds, 10) * 1000).toISOString();
      }

      // Handle string dates
      if (typeof value === "string") {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      return undefined;
    };

    // Build the normalized DeliveryNote object
    const normalized: any = {
      // Core identifiers
      id: rawDN.id || 0,
      companyId: rawDN.company_id || rawDN.companyId,
      deliveryNoteNumber: rawDN.deliveryNoteNumber || rawDN.delivery_note_number || "",
      deliveryDate: parseDate(rawDN.deliveryDate || rawDN.delivery_date),

      // Related documents
      invoiceId: rawDN.invoiceId || rawDN.invoice_id || undefined,
      invoiceNumber: rawDN.invoiceNumber || rawDN.invoice_number || undefined,
      purchaseOrderId: rawDN.purchaseOrderId || rawDN.purchase_order_id || undefined,

      // Customer linkage
      customerId: rawDN.customer_id || rawDN.customerId || undefined,

      // Customer & Delivery
      customerDetails: rawDN.customerDetails || rawDN.customer_details || undefined,
      deliveryAddress: rawDN.deliveryAddress || rawDN.delivery_address || undefined,

      // Driver & Vehicle
      driverName: rawDN.driverName || rawDN.driver_name || undefined,
      driverPhone: rawDN.driverPhone || rawDN.driver_phone || undefined,
      vehicleNumber: rawDN.vehicleNumber || rawDN.vehicle_number || undefined,

      // Items & Status
      items: rawDN.items || [],
      status: rawDN.status || undefined,
      isPartial: Boolean(rawDN.isPartial || rawDN.is_partial),

      // PDF generation (2 fields)
      pdfUrl: rawDN.pdf_url || rawDN.pdfUrl || undefined,
      pdfGeneratedAt: parseDate(rawDN.pdf_generated_at || rawDN.pdfGeneratedAt),

      // Notes & Metadata
      notes: rawDN.notes || undefined,
      hasNotes: Boolean(rawDN.hasNotes || rawDN.has_notes),

      // Audit trail
      createdAt: parseDate(rawDN.created_at || rawDN.createdAt),
      updatedAt: parseDate(rawDN.updated_at || rawDN.updatedAt),
      createdBy: rawDN.created_by || rawDN.createdBy || undefined,
      updatedBy: rawDN.updated_by || rawDN.updatedBy || undefined,
      tooltip: rawDN.tooltip || undefined,
      enabled: Boolean(rawDN.enabled),
    };

    return normalized;
  } catch (error) {
    console.error(`❌ [DeliveryNote Normalizer] Failed to normalize delivery note from ${source}:`, error);
    console.error("   Raw data:", rawDN);
    return null;
  }
}

/**
 * Normalize array of delivery notes
 * @param rawDNs - Array of raw delivery note data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized DeliveryNote objects
 */
export function normalizeDeliveryNotes(rawDNs: any[], source = "list"): any[] {
  if (!Array.isArray(rawDNs)) {
    console.error(`❌ [DeliveryNote Normalizer] Expected array, got ${typeof rawDNs}`);
    return [];
  }

  return rawDNs
    .map((dn, index) => normalizeDeliveryNote(dn, `${source}[${index}]`))
    .filter((dn): dn is any => dn !== null);
}
