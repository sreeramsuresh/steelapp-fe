/**
 * Frontend Invoice Data Normalizer
 * CRITICAL: Converts snake_case API fields to camelCase frontend schema
 * FAIL-SAFE: Validates and normalizes invoice data from API
 */

import type { Invoice, CustomerDetails, InvoiceItem, PaymentRecord, DeliveryStatus } from '../types/invoice';

/**
 * Convert snake_case API response to camelCase Invoice object
 * @param rawInvoice - Raw invoice data from API (snake_case)
 * @param source - Source of the data for debugging
 * @returns Normalized Invoice with camelCase fields
 */
export function normalizeInvoice(rawInvoice: any, source = 'unknown'): Invoice | null {
  if (!rawInvoice || typeof rawInvoice !== 'object') {
    console.error(`❌ [Invoice Normalizer] Invalid invoice data from ${source}:`, rawInvoice);
    return null;
  }

  const errors: string[] = [];

  try {
    // Helper to safely parse dates
    const parseDate = (value: any, fieldName: string): string => {
      if (!value) return new Date().toISOString();
      
      // Handle Timestamp objects from Firestore/backend
      if (value?.seconds) {
        return new Date(parseInt(value.seconds) * 1000).toISOString();
      }
      
      // Handle string dates
      if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
        errors.push(`${fieldName} is not a valid date: ${value}`);
        return new Date().toISOString();
      }
      
      errors.push(`${fieldName} has unexpected type: ${typeof value}`);
      return new Date().toISOString();
    };

    // Helper to safely parse numbers
    const parseNumber = (value: any, fallback = 0): number => {
      if (value === null || value === undefined) return fallback;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    };

    // Normalize customer details (handle both snake_case and camelCase)
    const normalizeCustomerDetails = (raw: any): CustomerDetails => {
      if (!raw) {
        return {
          id: 0,
          name: 'Unknown Customer'
        };
      }

      return {
        id: raw.id || raw.customerId || 0,
        name: raw.name || raw.customerName || 'Unknown',
        email: raw.email || undefined,
        phone: raw.phone || undefined,
        address: raw.address || undefined,
        gstNumber: raw.gstNumber || raw.gstNumber || undefined
      };
    };

    // Normalize invoice items
    const normalizeItems = (items: any[]): InvoiceItem[] => {
      if (!Array.isArray(items)) return [];
      
      return items.map(item => ({
        id: item.id,
        productId: item.productId || item.productId || 0,
        productName: item.productName || item.productName || '',
        description: item.description || undefined,
        quantity: parseNumber(item.quantity, 0),
        rate: parseNumber(item.rate, 0),
        unit: item.unit || undefined,
        amount: parseNumber(item.amount, 0),
        vatRate: parseNumber(item.vatRate || item.vatRate, 0),
        vatAmount: parseNumber(item.vatAmount || item.vatAmount, 0)
      }));
    };

    // Normalize payments
    const normalizePayments = (payments: any[]): PaymentRecord[] | undefined => {
      if (!Array.isArray(payments)) return undefined;
      
      return payments.map(payment => ({
        id: payment.id || 0,
        amount: parseNumber(payment.amount, 0),
        paymentDate: parseDate(payment.paymentDate || payment.paymentDate, 'paymentDate'),
        paymentMethod: payment.paymentMethod || payment.paymentMethod || undefined,
        notes: payment.notes || undefined,
        createdAt: payment.createdAt || payment.createdAt || undefined
      }));
    };

    // Normalize delivery status
    const normalizeDeliveryStatus = (status: any): DeliveryStatus | undefined => {
      if (!status) return undefined;
      
      return {
        hasNotes: Boolean(status.hasNotes || status.hasNotes),
        count: parseNumber(status.count, 0),
        lastDeliveryDate: status.lastDeliveryDate || status.lastDeliveryDate || undefined
      };
    };

    // Build the normalized Invoice object (EXPLICIT snake_case → camelCase conversion)
    const normalized: Invoice = {
      // Core identifiers
      id: rawInvoice.id || 0,
      invoiceNumber: rawInvoice.invoiceNumber || rawInvoice.invoiceNumber || '',
      
      // Dates
      invoiceDate: parseDate(rawInvoice.invoiceDate || rawInvoice.invoiceDate, 'invoiceDate'),
      dueDate: parseDate(rawInvoice.dueDate || rawInvoice.dueDate, 'dueDate'),
      createdAt: rawInvoice.createdAt || rawInvoice.createdAt || undefined,
      updatedAt: rawInvoice.updatedAt || rawInvoice.updatedAt || undefined,
      deletedAt: rawInvoice.deletedAt || rawInvoice.deletedAt || null,
      
      // Customer information
      customerId: rawInvoice.customerId || rawInvoice.customerId || 0,
      customerDetails: normalizeCustomerDetails(
        rawInvoice.customerDetails || rawInvoice.customerDetails || rawInvoice.customer
      ),
      customerName: rawInvoice.customerName || rawInvoice.customerName || undefined,
      
      // Financial
      subtotal: parseNumber(rawInvoice.subtotal, 0),
      vatAmount: parseNumber(rawInvoice.vatAmount || rawInvoice.vatAmount, 0),
      total: parseNumber(rawInvoice.total || rawInvoice.totalAmount, 0),
      totalAmount: parseNumber(rawInvoice.totalAmount || rawInvoice.totalAmount || rawInvoice.total, 0),
      received: parseNumber(rawInvoice.received, 0),
      outstanding: parseNumber(rawInvoice.outstanding, 0),
      balanceDue: parseNumber(rawInvoice.balanceDue || rawInvoice.balanceDue, undefined),
      
      // Status
      status: rawInvoice.status || 'draft',
      paymentStatus: rawInvoice.paymentStatus || rawInvoice.paymentStatus || 'unpaid',
      
      // Items
      items: normalizeItems(rawInvoice.items || []),
      
      // Sales & Commission
      salesAgentId: rawInvoice.salesAgentId || rawInvoice.salesAgentId || null,
      salesAgentName: rawInvoice.salesAgentName || rawInvoice.salesAgentName || undefined,
      commissionAmount: parseNumber(rawInvoice.commissionAmount || rawInvoice.commissionAmount, undefined),
      commissionCalculated: Boolean(rawInvoice.commissionCalculated || rawInvoice.commissionCalculated),
      
      // Payments
      payments: normalizePayments(rawInvoice.payments || []),
      lastPaymentDate: rawInvoice.lastPaymentDate || rawInvoice.lastPaymentDate || null,
      
      // Delivery
      deliveryStatus: normalizeDeliveryStatus(rawInvoice.deliveryStatus || rawInvoice.deliveryStatus),
      
      // Soft delete & recreation
      deletionReason: rawInvoice.deletionReason || rawInvoice.deletionReason || null,
      recreatedFrom: rawInvoice.recreatedFrom || rawInvoice.recreatedFrom || null,
      
      // Notes
      notes: rawInvoice.notes || undefined,
      termsAndConditions: rawInvoice.termsAndConditions || rawInvoice.termsAndConditions || undefined,
      
      // Company details
      companyDetails: rawInvoice.companyDetails || rawInvoice.companyDetails || undefined
    };

    // Log validation errors if any
    if (errors.length > 0) {
      console.warn(`⚠️ [Invoice Normalizer] Validation warnings from ${source}:`);
      errors.forEach(error => console.warn(`   - ${error}`));
    }

    return normalized;
    
  } catch (error) {
    console.error(`❌ [Invoice Normalizer] Failed to normalize invoice from ${source}:`, error);
    console.error('   Raw data:', rawInvoice);
    return null;
  }
}

/**
 * Normalize array of invoices
 * @param rawInvoices - Array of raw invoice data from API
 * @param source - Source identifier for debugging
 * @returns Array of normalized Invoice objects
 */
export function normalizeInvoices(rawInvoices: any[], source = 'list'): Invoice[] {
  if (!Array.isArray(rawInvoices)) {
    console.error(`❌ [Invoice Normalizer] Expected array, got ${typeof rawInvoices}`);
    return [];
  }

  return rawInvoices
    .map((invoice, index) => normalizeInvoice(invoice, `${source}[${index}]`))
    .filter((invoice): invoice is Invoice => invoice !== null);
}
