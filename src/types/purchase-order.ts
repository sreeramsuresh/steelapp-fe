/**
 * Canonical PurchaseOrder Type (camelCase only)
 * This is the NORMALIZED frontend schema after purchaseOrderNormalizer processes API data.
 *
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The purchaseOrderNormalizer converts snake_case → camelCase.
 */

/**
 * Main PurchaseOrder interface - CAMELCASE ONLY
 * All fields that exist after purchaseOrderNormalizer processing
 */
export interface PurchaseOrder {
  // Core identifiers
  poNumber: string;
  poDate?: string;
  dueDate?: string;
  expectedDeliveryDate?: string;

  // Supplier information
  supplierName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierTRN?: string;
  supplierContactName?: string;
  supplierContactEmail?: string;
  supplierContactPhone?: string;

  // Buyer information
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerDepartment?: string;

  // Financial
  subtotal: number;
  vatAmount: number;
  total: number;
  currency?: string;

  // Discounts & Charges
  discountPercentage?: number;
  discountAmount?: number;
  discountType?: string;
  shippingCharges?: number;
  freightCharges?: number;
  handlingCharges?: number;
  otherCharges?: number;

  // Terms & Conditions
  terms?: string;
  paymentTerms?: string;
  incoterms?: string;

  // Items & Status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: unknown[];
  stockStatus?: string;

  // Approval
  approvalStatus?: string;
  approvalDate?: string;
  approvedBy?: string;
  approvalComments?: string;

  // Notes
  notes?: string;
}

/**
 * Type guard to check if object is a valid PurchaseOrder
 */
export function isPurchaseOrder(obj: unknown): obj is PurchaseOrder {
  if (!obj || typeof obj !== "object") return false;
  const record = obj as Record<string, unknown>;
  return typeof record.poNumber === "string" && typeof record.total === "number";
}
