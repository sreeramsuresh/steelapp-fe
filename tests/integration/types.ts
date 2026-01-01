/**
 * Integration Test Type Definitions
 *
 * Provides proper TypeScript interfaces for:
 * - Database entities (Company, Customer, Invoice, etc.)
 * - API responses
 * - Factory function overrides
 * - Error types
 */

// =============================================================================
// Database Entity Types
// =============================================================================

export interface Company {
  id: number;
  company_id: string;
  company_name: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
  customer_id: string;
  company_id: string;
  customer_name: string;
  name: string;
  email?: string;
  phone?: string;
  credit_limit?: number;
  created_at: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  supplier_id: string;
  company_id: string;
  supplier_name: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  product_id: string;
  company_id: string;
  product_name: string;
  sku?: string;
  grade?: string;
  form?: string;
  finish?: string;
  unit_price?: number;
  created_at: string;
  updated_at?: string;
}

export interface Warehouse {
  id: number;
  warehouse_id: string;
  company_id: string;
  warehouse_name: string;
  name: string;
  location?: string;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  invoice_id: string;
  company_id: string;
  customer_id: string;
  invoice_number?: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface SupplierBill {
  id: number;
  bill_id?: string;
  company_id: string;
  supplier_id: string;
  bill_number?: string;
  supplier_invoice_number?: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  status: 'draft' | 'posted' | 'paid' | 'cancelled';
  vat_category?: string;
  is_blocked_vat?: boolean;
  blocked_vat_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface StockBatch {
  id: number;
  batch_id: string;
  company_id: string;
  warehouse_id: string;
  product_id: string;
  batch_no: string;
  quantity: number;
  quantity_remaining: number;
  quantity_reserved: number;
  unit_cost: number;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  payment_id: string;
  company_id: string;
  invoice_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  created_at: string;
}

export interface JournalEntry {
  id: number;
  company_id: string;
  invoice_id?: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  description?: string;
  created_at: string;
}

// =============================================================================
// Factory Override Types
// =============================================================================

export interface CompanyOverrides {
  company_name?: string;
  name?: string;
}

export interface CustomerOverrides {
  company_id?: string;
  customer_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  credit_limit?: number;
}

export interface SupplierOverrides {
  company_id?: string;
  supplier_name?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface ProductOverrides {
  company_id?: string;
  product_name?: string;
  name?: string;
  sku?: string;
  grade?: string;
  form?: string;
  finish?: string;
  unit_price?: number;
}

export interface WarehouseOverrides {
  company_id?: string;
  warehouse_name?: string;
  name?: string;
  location?: string;
}

export interface InvoiceOverrides {
  company_id?: string;
  customer_id?: string;
  subtotal?: number;
  vat_rate?: number;
  status?: string;
}

export interface StockBatchOverrides {
  company_id?: string;
  warehouse_id?: string;
  product_id?: string;
  batch_no?: string;
  quantity?: number;
  unit_cost?: number;
}

export interface SupplierBillOverrides {
  company_id?: string;
  supplier_id?: string;
  subtotal?: number;
  vat_rate?: number;
  status?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface CreateInvoiceResponse {
  invoice: Invoice;
  invoice_id: string;
  success: boolean;
}

export interface RecordPaymentResponse {
  payment: Payment;
  payment_id: string;
  success: boolean;
}

export interface PostInvoiceResponse {
  invoice: Invoice;
  journal_entries?: JournalEntry[];
  success: boolean;
}

export interface CreateSupplierBillResponse {
  bill: SupplierBill;
  bill_id: string;
  id?: string;
  supplier_id?: string;
  success: boolean;
}

export interface GenericApiResponse<T = unknown> {
  data?: T;
  success: boolean;
  error?: string;
  message?: string;
}

// =============================================================================
// gRPC Client Types
// =============================================================================

export interface ServiceClient {
  baseUrl: string;
  ready: boolean;
}

export interface CreateInvoiceParams {
  customer_id: string;
  company_id: string;
  subtotal: number;
  vat_rate: number;
  invoice_items?: InvoiceItem[];
}

export interface RecordPaymentParams {
  invoice_id: string;
  amount: number;
  payment_method: string;
  company_id: string;
}

export interface PostInvoiceParams {
  invoice_id: string;
  company_id: string;
}

export interface CreateSupplierBillParams {
  supplier_id: string;
  company_id: string;
  amount: number;
  bill_date?: string;
}

// =============================================================================
// Error Types
// =============================================================================

export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

export interface ValidationError extends Error {
  field?: string;
  value?: unknown;
}

// Type guard for database errors
export function isDatabaseError(err: unknown): err is DatabaseError {
  return err instanceof Error && 'code' in err;
}

// Type guard for checking if object has company_id
export function hasCompanyId(obj: unknown): obj is { company_id: string } {
  return typeof obj === 'object' && obj !== null && 'company_id' in obj;
}

// =============================================================================
// Tenant Isolation Types
// =============================================================================

export interface TenantIsolationResult {
  companyARowCount: number;
  companyBRowCount: number;
  isIsolated: boolean;
}

export interface TenantRow {
  company_id: string;
  [key: string]: unknown;
}
