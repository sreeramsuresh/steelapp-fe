/**
 * Development-time guards for Invoice objects
 * CRITICAL: Loudly warns when code accesses snake_case or unknown fields
 * ONLY ACTIVE IN DEVELOPMENT (production has zero overhead)
 */

import type { Invoice } from '../types/invoice';

/**
 * All valid camelCase keys that should exist on a normalized Invoice
 * THIS IS THE SINGLE SOURCE OF TRUTH for allowed Invoice fields
 */
const ALLOWED_INVOICE_KEYS = new Set<keyof Invoice | string>([
  // Core identifiers
  'id',
  'invoiceNumber',
  
  // Dates
  'invoiceDate',
  'dueDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
  
  // Customer information
  'customerId',
  'customerDetails',
  'customerName',
  
  // Financial
  'subtotal',
  'vatAmount',
  'total',
  'totalAmount',
  'received',
  'outstanding',
  'balanceDue',
  
  // Status
  'status',
  'paymentStatus',
  
  // Items & Payments
  'items',
  'payments',
  'lastPaymentDate',
  
  // Sales & Commission
  'salesAgentId',
  'salesAgentName',
  'commissionAmount',
  'commissionCalculated',
  
  // Delivery
  'deliveryStatus',
  
  // Soft delete & recreation
  'deletionReason',
  'recreatedFrom',
  
  // Notes
  'notes',
  'termsAndConditions',
  
  // Company
  'companyDetails',
  
  // Internal/special properties (allow these without warning)
  'constructor',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  '__proto__',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__'
]);

/**
 * Common snake_case fields that developers might accidentally use
 * These trigger LOUD warnings with stack traces
 */
const FORBIDDEN_SNAKE_CASE_FIELDS = new Set([
  'invoice_number',
  'invoice_date',
  'due_date',
  'customer_id',
  'customer_details',
  'customer_name',
  'vat_amount',
  'total_amount',
  'payment_status',
  'sales_agent_id',
  'sales_agent_name',
  'commission_amount',
  'commission_calculated',
  'balance_due',
  'delivery_status',
  'deleted_at',
  'created_at',
  'updated_at',
  'last_payment_date',
  'deletion_reason',
  'recreated_from',
  'terms_and_conditions',
  'company_details'
]);

/**
 * Wrap an Invoice object with a dev-time Proxy that warns on snake_case access
 * @param invoice - The normalized Invoice object
 * @returns Proxied invoice (dev) or original invoice (production)
 */
export function guardInvoiceDev(invoice: Invoice): Invoice {
  // In production, return the invoice as-is (zero overhead)
  if (import.meta.env.PROD) {
    return invoice;
  }

  // In development, wrap with a Proxy that monitors property access
  return new Proxy(invoice, {
    get(target, prop: string | symbol, receiver) {
      // Ignore symbol properties (used by React, JSON.stringify, etc.)
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver);
      }

      const propName = String(prop);

      // 🚨 CRITICAL ERROR: Snake_case field accessed
      if (FORBIDDEN_SNAKE_CASE_FIELDS.has(propName)) {
        const stack = new Error().stack;
        console.error(
          `\n` +
          `🚨🚨🚨 CRITICAL BUG DETECTED 🚨🚨🚨\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Snake_case field '${propName}' accessed on Invoice!\n` +
          `\n` +
          `❌ WRONG:  invoice.${propName}\n` +
          `✅ CORRECT: invoice.${snakeToCamel(propName)}\n` +
          `\n` +
          `This is the EXACT bug that caused InvoiceList to show\n` +
          `empty cells. Frontend MUST use camelCase after\n` +
          `invoiceNormalizer processing.\n` +
          `\n` +
          `Fix this immediately in:\n` +
          `${stack?.split('\n')[2] || 'Unknown location'}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        );
        console.trace('Full stack trace:');
        
        // Return undefined (same as accessing non-existent property)
        return undefined;
      }

      // ⚠️ WARNING: Unknown field accessed (might be typo or new field)
      if (propName.includes('_')) {
        const stack = new Error().stack;
        console.warn(
          `\n` +
          `⚠️ WARNING: Snake_case property '${propName}' accessed on Invoice\n` +
          `This field is not in the known forbidden list, but contains underscore.\n` +
          `Frontend should use camelCase. Did you mean '${snakeToCamel(propName)}'?\n` +
          `Location: ${stack?.split('\n')[2] || 'Unknown'}\n`
        );
      }

      // ℹ️ INFO: Unknown but camelCase field accessed (new field or typo)
      if (!ALLOWED_INVOICE_KEYS.has(propName) && !propName.startsWith('_')) {
        console.info(
          `ℹ️ Unknown Invoice field '${propName}' accessed. ` +
          `If this is a new field, add it to ALLOWED_INVOICE_KEYS in devGuards.ts`
        );
      }

      // Return the actual property value
      return Reflect.get(target, prop, receiver);
    },

    set(target, prop: string | symbol, value, receiver) {
      const propName = String(prop);

      // Warn on setting snake_case properties
      if (typeof prop === 'string' && FORBIDDEN_SNAKE_CASE_FIELDS.has(propName)) {
        console.error(
          `🚨 Attempted to SET snake_case field '${propName}' on Invoice! ` +
          `Use camelCase: ${snakeToCamel(propName)}`
        );
        return false;
      }

      return Reflect.set(target, prop, value, receiver);
    }
  });
}

/**
 * Guard an array of invoices in development
 * @param invoices - Array of normalized invoices
 * @returns Guarded invoices (dev) or original (production)
 */
export function guardInvoicesDev(invoices: Invoice[]): Invoice[] {
  if (import.meta.env.PROD) {
    return invoices;
  }

  return invoices.map(guardInvoiceDev);
}

/**
 * Simple snake_case to camelCase converter for error messages
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
