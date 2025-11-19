/**
 * Canonical Invoice Type (camelCase only)
 * This is the NORMALIZED frontend schema after invoiceNormalizer processes API data.
 * 
 * IMPORTANT: Backend/API uses snake_case. Frontend MUST use camelCase.
 * The invoiceNormalizer converts snake_case → camelCase.
 */

export interface CustomerDetails {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export interface InvoiceItem {
  id?: number;
  productId: number;
  productName: string;
  description?: string;
  quantity: number;
  rate: number;
  unit?: string;
  amount: number;
  vatRate?: number;
  vatAmount?: number;
}

export interface PaymentRecord {
  id: number;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
  createdAt?: string;
}

export interface DeliveryStatus {
  hasNotes: boolean;
  count: number;
  lastDeliveryDate?: string;
}

/**
 * Main Invoice interface - CAMELCASE ONLY
 * All fields that exist after invoiceNormalizer processing
 */
export interface Invoice {
  // Core identifiers
  id: number;
  invoiceNumber: string;
  
  // Dates (ISO 8601 strings)
  invoiceDate: string;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  
  // Customer information
  customerId: number;
  customerDetails: CustomerDetails;
  customerName?: string; // Denormalized for quick access
  
  // Financial
  subtotal: number;
  vatAmount: number;
  total: number;
  totalAmount: number; // Alias for total
  received: number;
  outstanding: number;
  balanceDue?: number;
  
  // Status fields
  status: 'draft' | 'issued' | 'cancelled' | 'void';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  
  // Items
  items: InvoiceItem[];
  
  // Sales & Commission
  salesAgentId?: number | null;
  salesAgentName?: string;
  commissionAmount?: number;
  commissionCalculated?: boolean;
  
  // Payment tracking
  payments?: PaymentRecord[];
  lastPaymentDate?: string | null;
  
  // Delivery tracking
  deliveryStatus?: DeliveryStatus;
  
  // Soft delete & recreation
  deletionReason?: string | null;
  recreatedFrom?: string | null;
  
  // Notes & metadata
  notes?: string;
  termsAndConditions?: string;
  
  // Company details (if embedded)
  companyDetails?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    gstNumber?: string;
    logoUrl?: string;
    sealUrl?: string;
  };
}

/**
 * Type guard to check if object is a valid Invoice
 */
export function isInvoice(obj: any): obj is Invoice {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.invoiceNumber === 'string' &&
    typeof obj.status === 'string'
  );
}
