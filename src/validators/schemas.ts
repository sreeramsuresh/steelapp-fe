/**
 * Runtime API Response Validators using Zod
 *
 * These schemas validate API responses at runtime to catch
 * schema mismatches that might slip past TypeScript.
 *
 * Usage:
 *   const result = PaginationSchema.safeParse(response.pagination);
 *   if (!result.success) {
 *     console.warn('Pagination schema mismatch:', result.error);
 *   }
 */

import { z } from "zod";

// ============================================
// Pagination Schema (CRITICAL - prevents NaN bugs)
// ============================================

/**
 * PageInfo schema - validates pagination response fields
 * All fields are required to prevent NaN issues
 */
export const PageInfoSchema = z.object({
  totalItems: z.number({
    error: "totalItems is required",
    message: "totalItems must be a number",
  }),
  totalPages: z.number({
    error: "totalPages is required",
    message: "totalPages must be a number",
  }),
  currentPage: z.number({
    error: "currentPage is required",
    message: "currentPage must be a number",
  }),
  perPage: z.number({
    error: "perPage is required",
    message: "perPage must be a number",
  }),
  hasNext: z.boolean().optional(),
  hasPrev: z.boolean().optional(),
});

/**
 * Generic paginated response schema factory
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PageInfoSchema,
  });

// ============================================
// Invoice List Response Schema
// ============================================

export const InvoiceListResponseSchema = z.object({
  invoices: z.array(z.any()), // Invoice items - loose validation
  pagination: PageInfoSchema.nullable(),
});

// ============================================
// Customer List Response Schema
// ============================================

export const CustomerListResponseSchema = z.object({
  customers: z.array(z.any()),
  pagination: PageInfoSchema.nullable(),
});

// ============================================
// Product List Response Schema
// ============================================

export const ProductListResponseSchema = z.object({
  products: z.array(z.any()),
  pagination: PageInfoSchema.nullable(),
});

// ============================================
// Validation Helper Functions
// ============================================

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: z.ZodError;
      data: null;
    };

/**
 * Validate pagination response and log warnings for mismatches
 */
export function validatePagination(
  pagination: unknown,
  context?: string
): ValidationResult<z.infer<typeof PageInfoSchema>> {
  const result = PageInfoSchema.safeParse(pagination);

  if (!result.success) {
    console.warn(
      `[API Contract Violation] Pagination schema mismatch${context ? ` in ${context}` : ""}:`,
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
    );
    return { success: false, error: result.error, data: null };
  }

  return { success: true, data: result.data };
}

/**
 * Validate invoice list response
 */
export function validateInvoiceListResponse(
  response: unknown
): ValidationResult<z.infer<typeof InvoiceListResponseSchema>> {
  const result = InvoiceListResponseSchema.safeParse(response);

  if (!result.success) {
    console.warn(
      "[API Contract Violation] Invoice list response schema mismatch:",
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
    );
    return { success: false, error: result.error, data: null };
  }

  return { success: true, data: result.data };
}

/**
 * Safe pagination accessor - returns defaults if validation fails
 * Use this to prevent NaN in UI when API returns unexpected shape
 */
export function safePagination(pagination: unknown): {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const result = PageInfoSchema.safeParse(pagination);

  if (result.success) {
    return {
      totalItems: result.data.totalItems,
      totalPages: result.data.totalPages,
      currentPage: result.data.currentPage,
      perPage: result.data.perPage,
      hasNext: result.data.hasNext ?? false,
      hasPrev: result.data.hasPrev ?? false,
    };
  }

  // Return safe defaults to prevent NaN
  console.warn("[safePagination] Invalid pagination, using defaults");
  return {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    perPage: 10,
    hasNext: false,
    hasPrev: false,
  };
}
