// ═══════════════════════════════════════════════════════════════
// INVOICE ADAPTER (Rule 9 - IO Transformation)
// Transforms between backend API (snake_case) and canonical DocumentState
// ═══════════════════════════════════════════════════════════════

import {
  DocumentState,
  DocumentAdapter,
} from '../../../config/documents/types';

/**
 * Backend API response shape (snake_case from gRPC/API Gateway)
 */
interface InvoiceApiResponse {
  id?: number;
  invoice_number: string;
  customer_id: number;
  customer_details: any; // JSON or object
  invoice_date: string;
  due_date: string | null;
  currency?: string;
  exchange_rate?: number;
  reference?: string | null;
  payment_terms?: string | null;
  emirate?: string | null;
  discount_type: 'amount' | 'percent';
  discount_percentage: number;
  discount_amount: number;
  packing_charges: number;
  freight_charges: number;
  insurance_charges: number;
  loading_charges: number;
  other_charges: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  internal_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  is_locked?: boolean;
  items: InvoiceItemApiResponse[];
}

interface InvoiceItemApiResponse {
  id?: number;
  product_id: number | null;
  name: string;
  finish?: string;
  size?: string;
  thickness?: string;
  unit: string;
  quantity: number;
  rate: number;
  vat_rate: number;
  amount: number;
  discount_percent?: number;
  discount_amount?: number;
  quantity_uom?: string;
}

/**
 * Backend API payload shape (snake_case for gRPC/API Gateway)
 */
interface InvoiceApiPayload {
  invoice_number?: string;
  customer_id: number;
  customer_details: any;
  invoice_date: string;
  due_date: string | null;
  currency?: string;
  exchange_rate?: number;
  reference?: string | null;
  payment_terms?: string | null;
  emirate?: string | null;
  discount_type: 'amount' | 'percent';
  discount_percentage: number;
  discount_amount: number;
  packing_charges: number;
  freight_charges: number;
  insurance_charges: number;
  loading_charges: number;
  other_charges: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  internal_notes?: string | null;
  items: InvoiceItemApiPayload[];
}

interface InvoiceItemApiPayload {
  product_id: number | null;
  name: string;
  finish?: string;
  size?: string;
  thickness?: string;
  unit: string;
  quantity: number;
  rate: number;
  vat_rate: number;
  amount: number;
  discount_percent?: number;
  discount_amount?: number;
  quantity_uom?: string;
}

/**
 * Parse customer_details (might be JSON string or object)
 */
function parseCustomerDetails(customerDetails: any): any {
  if (typeof customerDetails === 'string') {
    try {
      return JSON.parse(customerDetails);
    } catch {
      return {};
    }
  }
  return customerDetails || {};
}

/**
 * Build product description from steel item fields
 */
function buildProductDescription(item: InvoiceItemApiResponse): string {
  const parts = [item.finish, item.size, item.thickness].filter(Boolean);
  return parts.join(' ');
}

/**
 * Invoice Adapter
 */
export const invoiceAdapter: DocumentAdapter<InvoiceApiResponse, InvoiceApiPayload> = {
  /**
   * Transform API response to canonical DocumentState
   */
  toForm(apiResponse: InvoiceApiResponse): DocumentState {
    const customer = parseCustomerDetails(apiResponse.customer_details);

    return {
      header: {
        docNumber: apiResponse.invoice_number || '',
        date: apiResponse.invoice_date || new Date().toISOString().split('T')[0],
        dueDate: apiResponse.due_date || null,
        currency: apiResponse.currency || 'AED',
        exchangeRate: apiResponse.exchange_rate || 1,
        reference: apiResponse.reference || null,
        paymentTerms: apiResponse.payment_terms || null,
        emirate: apiResponse.emirate || null,
      },
      party: {
        id: apiResponse.customer_id || null,
        type: 'customer',
        name: customer.name || '',
        company: customer.company || null,
        trn: customer.trn || null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: {
          street: customer.address || '',
          city: customer.city || '',
          emirate: customer.emirate || '',
          country: customer.country || 'UAE',
          postalCode: customer.postal_code || null,
        },
      },
      lines: (apiResponse.items || []).map((item, index) => ({
        id: `line_${apiResponse.id || 'new'}_${index}`,
        productId: item.product_id || null,
        productName: item.name || '',
        description: buildProductDescription(item),
        quantity: Number(item.quantity) || 0,
        unit: item.unit || item.quantity_uom || 'PCS',
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
        vatRate: Number(item.vat_rate) || 0,
        vatAmount: 0, // Calculated by hook
        discountPercent: Number(item.discount_percent) || 0,
        discountAmount: Number(item.discount_amount) || 0,
      })),
      charges: [
        {
          type: 'packing',
          label: 'Packing',
          amount: Number(apiResponse.packing_charges) || 0,
          vatRate: 0,
          vatAmount: 0,
        },
        {
          type: 'freight',
          label: 'Freight',
          amount: Number(apiResponse.freight_charges) || 0,
          vatRate: 0,
          vatAmount: 0,
        },
        {
          type: 'insurance',
          label: 'Insurance',
          amount: Number(apiResponse.insurance_charges) || 0,
          vatRate: 0,
          vatAmount: 0,
        },
        {
          type: 'loading',
          label: 'Loading',
          amount: Number(apiResponse.loading_charges) || 0,
          vatRate: 0,
          vatAmount: 0,
        },
        {
          type: 'other',
          label: 'Other Charges',
          amount: Number(apiResponse.other_charges) || 0,
          vatRate: 0,
          vatAmount: 0,
        },
      ].filter((charge) => charge.amount > 0),
      discount: {
        type: apiResponse.discount_type || 'amount',
        value:
          apiResponse.discount_type === 'percent'
            ? Number(apiResponse.discount_percentage) || 0
            : Number(apiResponse.discount_amount) || 0,
      },
      totals: {
        subtotal: Number(apiResponse.subtotal) || 0,
        discountAmount: Number(apiResponse.discount_amount) || 0,
        chargesTotal:
          (Number(apiResponse.packing_charges) || 0) +
          (Number(apiResponse.freight_charges) || 0) +
          (Number(apiResponse.insurance_charges) || 0) +
          (Number(apiResponse.loading_charges) || 0) +
          (Number(apiResponse.other_charges) || 0),
        chargesVat: 0, // Calculated by hook
        vatAmount: Number(apiResponse.vat_amount) || 0,
        total: Number(apiResponse.total) || 0,
        totalAed: Number(apiResponse.total) * (Number(apiResponse.exchange_rate) || 1),
      },
      notes: {
        customerNotes: apiResponse.notes || '',
        internalNotes: apiResponse.internal_notes || '',
        termsAndConditions: apiResponse.terms || '',
      },
      meta: {
        id: apiResponse.id,
        status: apiResponse.status as any,
        createdAt: apiResponse.created_at || null,
        updatedAt: apiResponse.updated_at || null,
        createdBy: apiResponse.created_by || null,
        isLocked: apiResponse.is_locked || false,
      },
    };
  },

  /**
   * Transform canonical DocumentState to API payload
   */
  fromForm(document: DocumentState): InvoiceApiPayload {
    // Build customer_details object
    const customerDetails = {
      id: document.party.id,
      name: document.party.name,
      company: document.party.company,
      trn: document.party.trn,
      email: document.party.email,
      phone: document.party.phone,
      address: document.party.address.street,
      city: document.party.address.city,
      emirate: document.party.address.emirate,
      country: document.party.address.country,
      postal_code: document.party.address.postalCode,
    };

    // Extract charges
    const charges = {
      packing_charges: 0,
      freight_charges: 0,
      insurance_charges: 0,
      loading_charges: 0,
      other_charges: 0,
    };

    document.charges.forEach((charge) => {
      switch (charge.type) {
        case 'packing':
          charges.packing_charges = charge.amount;
          break;
        case 'freight':
          charges.freight_charges = charge.amount;
          break;
        case 'insurance':
          charges.insurance_charges = charge.amount;
          break;
        case 'loading':
          charges.loading_charges = charge.amount;
          break;
        case 'other':
          charges.other_charges = charge.amount;
          break;
      }
    });

    return {
      invoice_number: document.header.docNumber || undefined,
      customer_id: document.party.id!,
      customer_details: customerDetails,
      invoice_date: document.header.date,
      due_date: document.header.dueDate,
      currency: document.header.currency,
      exchange_rate: document.header.exchangeRate,
      reference: document.header.reference,
      payment_terms: document.header.paymentTerms,
      emirate: document.header.emirate,
      discount_type: document.discount.type,
      discount_percentage: document.discount.type === 'percent' ? document.discount.value : 0,
      discount_amount: document.discount.type === 'amount' ? document.discount.value : document.totals.discountAmount,
      ...charges,
      subtotal: document.totals.subtotal,
      vat_amount: document.totals.vatAmount,
      total: document.totals.total,
      status: document.meta.status,
      notes: document.notes.customerNotes || null,
      terms: document.notes.termsAndConditions || null,
      internal_notes: document.notes.internalNotes || null,
      items: document.lines.map((line) => ({
        product_id: line.productId,
        name: line.productName,
        // Note: finish/size/thickness extraction would require parsing description
        // or maintaining them separately in LineItem - omitting for now
        unit: line.unit,
        quantity: line.quantity,
        rate: line.rate,
        vat_rate: line.vatRate,
        amount: line.amount,
        discount_percent: line.discountPercent,
        discount_amount: line.discountAmount,
        quantity_uom: line.unit,
      })),
    };
  },
};

export default invoiceAdapter;
