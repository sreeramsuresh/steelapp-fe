/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Frontend Purchase Order Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes purchase order data from API
 */

/**
 * Convert snake_case API response to camelCase PurchaseOrder object
 * @param rawPO - Raw purchase order data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized PurchaseOrder with camelCase fields
 */
export function normalizePurchaseOrder(rawPO: any, source = "unknown"): any | null {
  if (!rawPO || typeof rawPO !== "object") {
    console.error(`❌ [PurchaseOrder Normalizer] Invalid purchase order data from ${source}:`, rawPO);
    return null;
  }

  try {
    // Helper to safely parse numbers
    const parseNumber = (value: any, fallback: any = undefined): number | undefined => {
      if (value === null || value === undefined) return fallback;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    };

    // Helper to safely parse dates
    const parseDate = (value: any): string | undefined => {
      if (!value) return undefined;

      // Handle Timestamp objects
      if (value?.seconds) {
        return new Date(parseInt(value.seconds) * 1000).toISOString();
      }

      // Handle string dates
      if (typeof value === "string") {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      return undefined;
    };

    // Build the normalized PurchaseOrder object
    const normalized: any = {
      // Core identifiers
      id: rawPO.id || 0,
      companyId: rawPO.company_id || rawPO.companyId,
      poNumber: rawPO.poNumber || rawPO.po_number || "",
      poDate: parseDate(rawPO.poDate || rawPO.po_date),
      dueDate: parseDate(rawPO.dueDate || rawPO.due_date),
      expectedDeliveryDate: parseDate(rawPO.expectedDeliveryDate || rawPO.expected_delivery_date),

      // Supplier information
      supplierName: rawPO.supplierName || rawPO.supplier_name || undefined,
      supplierEmail: rawPO.supplierEmail || rawPO.supplier_email || undefined,
      supplierPhone: rawPO.supplierPhone || rawPO.supplier_phone || undefined,
      supplierAddress: rawPO.supplierAddress || rawPO.supplier_address || undefined,
      supplierTRN: rawPO.supplierTRN || rawPO.supplier_trn || undefined,
      supplierContactName: rawPO.supplierContactName || rawPO.supplier_contact_name || undefined,
      supplierContactEmail: rawPO.supplierContactEmail || rawPO.supplier_contact_email || undefined,
      supplierContactPhone: rawPO.supplierContactPhone || rawPO.supplier_contact_phone || undefined,

      // Buyer information
      buyerName: rawPO.buyerName || rawPO.buyer_name || undefined,
      buyerEmail: rawPO.buyerEmail || rawPO.buyer_email || undefined,
      buyerPhone: rawPO.buyerPhone || rawPO.buyer_phone || undefined,
      buyerDepartment: rawPO.buyerDepartment || rawPO.buyer_department || undefined,

      // Financial
      subtotal: parseNumber(rawPO.subtotal, 0),
      vatAmount: parseNumber(rawPO.vatAmount || rawPO.vat_amount, 0),
      total: parseNumber(rawPO.total, 0),
      currency: rawPO.currency || "INR",

      // Discounts & Charges
      discountPercentage: parseNumber(rawPO.discountPercentage || rawPO.discount_percentage, undefined),
      discountAmount: parseNumber(rawPO.discountAmount || rawPO.discount_amount, undefined),
      discountType: rawPO.discountType || rawPO.discount_type || undefined,
      shippingCharges: parseNumber(rawPO.shippingCharges || rawPO.shipping_charges, undefined),
      freightCharges: parseNumber(rawPO.freightCharges || rawPO.freight_charges, undefined),
      handlingCharges: parseNumber(rawPO.handlingCharges || rawPO.handling_charges, undefined),
      otherCharges: parseNumber(rawPO.otherCharges || rawPO.other_charges, undefined),

      // Terms & Conditions
      terms: rawPO.terms || undefined,
      paymentTerms: rawPO.paymentTerms || rawPO.payment_terms || undefined,
      incoterms: rawPO.incoterms || undefined,

      // Items & Status
      items: rawPO.items || [],
      stockStatus: rawPO.stockStatus || rawPO.stock_status || undefined,

      // Approval workflow (5 fields)
      approvalStatus: rawPO.approvalStatus || rawPO.approval_status || undefined,
      approvalDate: parseDate(rawPO.approvalDate || rawPO.approval_date),
      approvedBy: rawPO.approvedBy || rawPO.approved_by || undefined,
      approvedAt: parseDate(rawPO.approvedAt || rawPO.approved_at),
      approvalComments: rawPO.approvalComments || rawPO.approval_comments || undefined,
      rejectionReason: rawPO.rejection_reason || rawPO.rejectionReason || undefined,

      // Stock tracking (3 fields)
      stockReceived: Boolean(rawPO.stock_received || rawPO.stockReceived),
      stockReceivedDate: parseDate(rawPO.stock_received_date || rawPO.stockReceivedDate),
      partialReceived: Boolean(rawPO.partial_received || rawPO.partialReceived),

      // Payment tracking (3 fields)
      paymentStatus: rawPO.payment_status || rawPO.paymentStatus || undefined,
      paidAmount: parseNumber(rawPO.paid_amount || rawPO.paidAmount, undefined),
      outstandingAmount: parseNumber(rawPO.outstanding_amount || rawPO.outstandingAmount, undefined),

      // Notes
      notes: rawPO.notes || undefined,

      // Audit trail
      createdAt: parseDate(rawPO.created_at || rawPO.createdAt),
      updatedAt: parseDate(rawPO.updated_at || rawPO.updatedAt),
      createdBy: rawPO.created_by || rawPO.createdBy || undefined,
      updatedBy: rawPO.updated_by || rawPO.updatedBy || undefined,
    };

    return normalized;
  } catch (error) {
    console.error(`❌ [PurchaseOrder Normalizer] Failed to normalize purchase order from ${source}:`, error);
    console.error("   Raw data:", rawPO);
    return null;
  }
}

/**
 * Normalize array of purchase orders
 * @param rawPOs - Array of raw purchase order data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized PurchaseOrder objects
 */
export function normalizePurchaseOrders(rawPOs: any[], source = "list"): any[] {
  if (!Array.isArray(rawPOs)) {
    console.error(`❌ [PurchaseOrder Normalizer] Expected array, got ${typeof rawPOs}`);
    return [];
  }

  return rawPOs
    .map((po, index) => normalizePurchaseOrder(po, `${source}[${index}]`))
    .filter((po): po is any => po !== null);
}
