// ═══════════════════════════════════════════════════════════════
// QUOTATION ADAPTER (Rule 9)
// ═══════════════════════════════════════════════════════════════

import {
  DocumentState,
  DocumentAdapter,
} from '../../../config/documents/types';

interface QuotationApiResponse {
  id?: number;
  quotation_number: string;
  customer_id: number;
  customer_details: any;
  quotation_date: string;
  valid_until?: string | null;
  currency?: string;
  exchange_rate?: number;
  reference?: string | null;
  delivery_terms?: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  created_at?: string;
  items: any[];
}

interface QuotationApiPayload {
  quotation_number?: string;
  customer_id: number;
  customer_details: any;
  quotation_date: string;
  valid_until?: string | null;
  currency?: string;
  exchange_rate?: number;
  reference?: string | null;
  delivery_terms?: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  items: any[];
}

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

export const quotationAdapter: DocumentAdapter<QuotationApiResponse, QuotationApiPayload> = {
  toForm(apiResponse: QuotationApiResponse): DocumentState {
    const customer = parseCustomerDetails(apiResponse.customer_details);

    return {
      header: {
        docNumber: apiResponse.quotation_number || '',
        date: apiResponse.quotation_date || new Date().toISOString().split('T')[0],
        dueDate: apiResponse.valid_until || null,
        currency: apiResponse.currency || 'AED',
        exchangeRate: apiResponse.exchange_rate || 1,
        reference: apiResponse.reference || null,
        paymentTerms: null,
        emirate: null,
        deliveryTerms: apiResponse.delivery_terms || null,
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
        productName: item.product_name || item.name || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'PCS',
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
        vatRate: Number(item.vat_rate) || 0,
        vatAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
      })),
      charges: [],
      discount: {
        type: 'amount',
        value: 0,
      },
      totals: {
        subtotal: Number(apiResponse.subtotal) || 0,
        discountAmount: 0,
        chargesTotal: 0,
        chargesVat: 0,
        vatAmount: Number(apiResponse.vat_amount) || 0,
        total: Number(apiResponse.total) || 0,
        totalAed: Number(apiResponse.total) * (Number(apiResponse.exchange_rate) || 1),
      },
      notes: {
        customerNotes: apiResponse.notes || '',
        internalNotes: '',
        termsAndConditions: apiResponse.terms || '',
      },
      meta: {
        id: apiResponse.id,
        status: apiResponse.status as any,
        createdAt: apiResponse.created_at || null,
        updatedAt: null,
        createdBy: null,
        isLocked: false,
      },
    };
  },

  fromForm(document: DocumentState): QuotationApiPayload {
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

    return {
      quotation_number: document.header.docNumber || undefined,
      customer_id: document.party.id!,
      customer_details: customerDetails,
      quotation_date: document.header.date,
      valid_until: document.header.dueDate,
      currency: document.header.currency,
      exchange_rate: document.header.exchangeRate,
      reference: document.header.reference,
      delivery_terms: document.header.deliveryTerms,
      subtotal: document.totals.subtotal,
      vat_amount: document.totals.vatAmount,
      total: document.totals.total,
      status: document.meta.status,
      notes: document.notes.customerNotes || null,
      terms: document.notes.termsAndConditions || null,
      items: document.lines.map((line) => ({
        product_id: line.productId,
        product_name: line.productName,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        rate: line.rate,
        vat_rate: line.vatRate,
        amount: line.amount,
      })),
    };
  },
};

export default quotationAdapter;
