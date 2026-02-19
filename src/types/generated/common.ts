/**
 * AUTO-GENERATED FROM PROTO FILES
 * Source: steelapprnp/proto/steelapp/common.proto
 *
 * DO NOT EDIT MANUALLY - Run `npm run generate-types` to regenerate
 *
 * These types match the gRPC backend schema exactly.
 * After API Gateway case conversion: snake_case -> camelCase
 */

// ============================================
// Pagination Types (from PageInfo message)
// ============================================

/**
 * Pagination response from API (camelCase after gateway conversion)
 * Maps to proto PageInfo message
 */
export interface PageInfo {
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Items per page */
  perPage: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/**
 * Pagination request parameters (camelCase for frontend)
 * Maps to proto PageRequest message
 */
export interface PageRequest {
  /** Page number (1-indexed) */
  page: number;
  /** Items per page (max 100) */
  limit: number;
  /** Optional search query */
  search?: string;
  /** Field to sort by */
  sortBy?: string;
  /** Sort order: 'asc' or 'desc' */
  sortOrder?: "asc" | "desc";
}

// ============================================
// Common Response Types
// ============================================

/**
 * Generic paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PageInfo;
}

/**
 * Invoice list response structure
 */
export interface InvoiceListResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoices: unknown[]; // Will be typed properly with Invoice type
  pagination: PageInfo | null;
}

/**
 * Customer list response structure
 */
export interface CustomerListResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customers: unknown[];
  pagination: PageInfo | null;
}

/**
 * Product list response structure
 */
export interface ProductListResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: unknown[];
  pagination: PageInfo | null;
}

// ============================================
// Error Types
// ============================================

export interface ErrorDetail {
  field: string;
  message: string;
  code: string;
}

// ============================================
// Money/Currency Types
// ============================================

export interface Money {
  amount: number;
  /** ISO 4217 currency code (e.g., "AED", "USD") */
  currency: string;
}

// ============================================
// Address Type
// ============================================

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// ============================================
// Audit Info
// ============================================

export interface AuditInfo {
  createdBy: number;
  createdAt: string; // ISO 8601 timestamp
  updatedBy: number;
  updatedAt: string;
  deletedBy?: number;
  deletedAt?: string;
}

// ============================================
// Status Enums
// ============================================

export type Status =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "inactive"
  | "completed"
  | "cancelled"
  | "issued"
  | "sent";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "overdue" | "refunded";
