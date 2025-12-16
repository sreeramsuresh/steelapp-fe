/**
 * Runtime API Response Validators
 *
 * Export all Zod schemas and validation helpers.
 * Use these to validate API responses at runtime.
 */

export {
  // Schemas
  PageInfoSchema,
  InvoiceListResponseSchema,
  CustomerListResponseSchema,
  ProductListResponseSchema,
  createPaginatedResponseSchema,

  // Helpers
  validatePagination,
  validateInvoiceListResponse,
  safePagination,

  // Types
  type ValidationResult,
} from "./schemas";
