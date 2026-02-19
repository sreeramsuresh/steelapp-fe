/**
 * Runtime API Response Validators
 *
 * Export all Zod schemas and validation helpers.
 * Use these to validate API responses at runtime.
 */

export {
  CustomerListResponseSchema,
  createPaginatedResponseSchema,
  InvoiceListResponseSchema,
  // Schemas
  PageInfoSchema,
  ProductListResponseSchema,
  safePagination,
  // Types
  type ValidationResult,
  validateInvoiceListResponse,
  // Helpers
  validatePagination,
} from "./schemas";
