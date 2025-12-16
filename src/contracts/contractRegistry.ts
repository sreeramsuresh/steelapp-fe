import { z } from 'zod';

/**
 * Contract Registry - DEV-only API contract validation
 *
 * Maps "METHOD /path/pattern" to Zod schemas for request/response validation.
 * Supports URL patterns with :param segments (e.g., /invoices/:id).
 *
 * Usage:
 *   contractRegistry['POST /invoices'] = {
 *     request: z.object({ ... }),
 *     response: z.object({ ... })
 *   }
 */

// ============================================================================
// SHARED SCHEMAS (Reusable Components)
// ============================================================================

/**
 * Manual Allocation Schema (Strict)
 * Used in invoice line items for batch allocation.
 */
const ManualAllocationSchema = z.object({
  batch_id: z.number().int().positive('batch_id must be positive'),
  quantity: z.union([z.number(), z.string()]).refine(
    (val) => {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: 'quantity must be a positive number or numeric string' }
  ),
});

/**
 * Invoice Line Item Schema (Strict)
 * Critical fields for stock allocation and invoicing.
 *
 * IMPORTANT: Validates the snake_case payload sent by invoiceService.transformInvoiceForServer(),
 * not the camelCase React state. The transformation happens BEFORE this guard.
 */
const InvoiceItemSchema = z
  .object({
    // Identity (snake_case from API)
    id: z.string().uuid().optional(),
    line_item_temp_id: z.string().uuid().optional(),
    product_id: z.number().int().positive().optional(),
    name: z.string().min(1, 'name is required'),

    // Quantities and pricing (snake_case)
    quantity: z.number().positive('quantity must be positive'),
    quantity_uom: z.enum(['KG', 'PCS', 'MT', 'M']).optional(),
    rate: z.number().nonnegative('rate must be non-negative'),
    amount: z.number().nonnegative('amount must be non-negative'),

    // Stock allocation (CRITICAL - snake_case)
    source_type: z.enum(['WAREHOUSE', 'LOCAL_DROP_SHIP', 'IMPORT_DROP_SHIP']).optional(),
    warehouse_id: z.number().int().positive().optional().nullable(),
    allocation_mode: z.enum(['AUTO_FIFO', 'MANUAL']).optional().nullable(),
    manual_allocations: z.array(ManualAllocationSchema).optional(),

    // VAT (snake_case)
    vat_rate: z.number().min(0).max(100).optional(),
    supply_type: z.enum(['standard', 'zero_rated', 'exempt', 'reverse_charge']).optional(),

    // Optional fields (snake_case - not validated strictly)
    discount: z.number().optional(),
    category: z.string().optional(),
    commodity: z.string().optional(),
    grade: z.string().optional(),
    finish: z.string().optional(),
    size: z.string().optional(),
    thickness: z.string().optional(),
    origin: z.string().optional(),
    unit: z.string().optional(),
    pricing_basis: z.string().optional(),
    unit_weight_kg: z.number().optional(),
    theoretical_weight_kg: z.number().optional(),
    reservation_id: z.number().optional(),
    reservation_expires_at: z.string().optional(),
  })
  .strict() // Reject unknown keys
  // Custom validation: If source_type is WAREHOUSE, must have allocation_mode and manual_allocations
  .refine(
    (item) => {
      if (item.source_type === 'WAREHOUSE') {
        return item.allocation_mode !== undefined && item.allocation_mode !== null;
      }
      return true;
    },
    {
      message: 'WAREHOUSE items must have allocation_mode',
      path: ['allocation_mode'],
    }
  )
  .refine(
    (item) => {
      if (item.source_type === 'WAREHOUSE' && item.allocation_mode) {
        return Array.isArray(item.manual_allocations);
      }
      return true;
    },
    {
      message: 'WAREHOUSE items must have manual_allocations array',
      path: ['manual_allocations'],
    }
  );

// ============================================================================
// ENDPOINT CONTRACTS
// ============================================================================

/**
 * POST /invoices - Create Invoice
 *
 * Validates:
 * - Required fields: customer_id, items
 * - Items must have valid allocation_mode and manual_allocations for WAREHOUSE type
 * - Numeric fields are properly typed
 *
 * IMPORTANT: Validates snake_case payload from transformInvoiceForServer()
 */
const CreateInvoiceRequestSchema = z.object({
  customer_id: z.number().int().positive('customer_id must be positive').nullable(),
  customer_details: z.any().optional(), // Allow any customer object shape
  status: z.enum(['draft', 'proforma', 'issued']).optional(),
  invoice_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  items: z.array(InvoiceItemSchema).min(1, 'items array must not be empty'),
  discount_amount: z.number().nonnegative().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  discount_type: z.enum(['amount', 'percentage']).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  // Allow other fields without strict validation
  subtotal: z.number().optional(),
  vat_amount: z.number().optional(),
  total: z.number().optional(),
  warehouse_id: z.number().nullable().optional(),
  mode_of_payment: z.string().nullable().optional(),
});

const CreateInvoiceResponseSchema = z.object({
  id: z.number().int().positive(),
  invoiceNumber: z.string(),
  status: z.string(),
  totalAmount: z.number().nonnegative(),
  // Allow other fields
});

/**
 * PUT /invoices/:id - Update Invoice
 *
 * Same validation as create, but id is in URL params.
 */
const UpdateInvoiceRequestSchema = CreateInvoiceRequestSchema;

const UpdateInvoiceResponseSchema = z.object({
  id: z.number().int().positive(),
  invoiceNumber: z.string(),
  status: z.string(),
  // Allow other fields
});

/**
 * DELETE /batch-reservations/line-item - Cancel Line Item Reservations
 *
 * Validates:
 * - Required: lineItemTempId (UUID format)
 * - Optional: draftInvoiceId
 */
const CancelLineItemReservationsRequestSchema = z
  .object({
    draftInvoiceId: z.number().int().nonnegative('draftInvoiceId must be non-negative'),
    lineItemTempId: z.string().uuid('lineItemTempId must be a valid UUID'),
  })
  .strict(); // Reject unknown keys

const CancelLineItemReservationsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  cancelledCount: z.number().int().nonnegative(),
  quantityReleased: z.number().nonnegative(),
});

/**
 * POST /batch-reservations/fifo - Reserve Batches via FIFO
 *
 * Validates required fields for FIFO allocation.
 */
const ReserveBatchesFIFORequestSchema = z
  .object({
    draftInvoiceId: z.number().int().nonnegative(),
    productId: z.number().int().positive('productId must be positive'),
    warehouseId: z.number().int().positive('warehouseId must be positive'),
    requiredQuantity: z.union([z.number(), z.string()]).refine(
      (val) => {
        const num = typeof val === 'number' ? val : parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'requiredQuantity must be positive' }
    ),
    unit: z.enum(['KG', 'PCS', 'MT', 'M']),
    lineItemTempId: z.string().uuid('lineItemTempId must be a valid UUID'),
  })
  .strict();

const ReserveBatchesFIFOResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  allocations: z.array(z.object({
    reservationId: z.number(),
    batchId: z.number(),
    batchNumber: z.string(),
    quantity: z.number(),
    unitCost: z.number(),
    totalCost: z.number(),
  })).optional(),
  totalQuantity: z.number().optional(),
  totalCost: z.number().optional(),
  expiresAt: z.string().optional(),
  isPartial: z.boolean().optional(),
  shortfall: z.number().optional(),
});

// ============================================================================
// CONTRACT REGISTRY
// ============================================================================

export interface ContractDefinition {
  request?: z.ZodTypeAny;
  response?: z.ZodTypeAny;
}

export const contractRegistry: Record<string, ContractDefinition> = {
  // Invoice Management
  'POST /invoices': {
    request: CreateInvoiceRequestSchema,
    response: CreateInvoiceResponseSchema,
  },

  'PUT /invoices/:id': {
    request: UpdateInvoiceRequestSchema,
    response: UpdateInvoiceResponseSchema,
  },

  // Batch Reservations
  'DELETE /batch-reservations/line-item': {
    request: CancelLineItemReservationsRequestSchema,
    response: CancelLineItemReservationsResponseSchema,
  },

  'POST /batch-reservations/fifo': {
    request: ReserveBatchesFIFORequestSchema,
    response: ReserveBatchesFIFOResponseSchema,
  },

  // Add more contracts as needed...
};

/**
 * Get all registered contract keys for debugging.
 */
export function getRegisteredContracts(): string[] {
  return Object.keys(contractRegistry);
}
