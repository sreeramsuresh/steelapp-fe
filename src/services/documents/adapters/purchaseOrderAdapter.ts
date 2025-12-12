// ═══════════════════════════════════════════════════════════════
// PURCHASE ORDER ADAPTER (Rule 9)
// Transforms between backend API and canonical DocumentState
// ═══════════════════════════════════════════════════════════════

import {
  DocumentState,
  DocumentAdapter,
} from '../../../config/documents/types';

interface PurchaseOrderApiResponse {
  id?: number;
  po_number: string;
  vendor_id: number;
  vendor_details: any;
  po_date: string;
  expected_delivery_date?: string | null;
  currency?: string;
  exchange_rate?: number;
  reference?: string | null;
  payment_terms?: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  created_at?: string;
  updated_at?: string;
  items: PurchaseOrderItemApiResponse[];
}

interface PurchaseOrderItemApiResponse {
  id?: number;
  product_id: number | null;
  product_name: string;
  description?: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface PurchaseOrderApiPayload {
  po_number?: string;
  vendor_id: number;
  vendor_details: any;
  po_date: string;
  expected_delivery_date?: string | null;
  currency?: string;
  exchange_rate?: number;
  reference?: string | null;
  payment_terms?: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  items: any[];
}

function parseVendorDetails(vendorDetails: any): any {
  if (typeof vendorDetails === 'string') {
    try {
      return JSON.parse(vendorDetails);
    } catch {
      return {};
    }
  }
  return vendorDetails || {};
}

export const purchaseOrderAdapter: DocumentAdapter<PurchaseOrderApiResponse, PurchaseOrderApiPayload> = {
  toForm(apiResponse: PurchaseOrderApiResponse): DocumentState {
    const vendor = parseVendorDetails(apiResponse.vendor_details);

    return {
      header: {
        docNumber: apiResponse.po_number || '',
        date: apiResponse.po_date || new Date().toISOString().split('T')[0],
        dueDate: apiResponse.expected_delivery_date || null,
        currency: apiResponse.currency || 'AED',
        exchangeRate: apiResponse.exchange_rate || 1,
        reference: apiResponse.reference || null,
        paymentTerms: apiResponse.payment_terms || null,
        emirate: null,
      },
      party: {
        id: apiResponse.vendor_id || null,
        type: 'vendor',
        name: vendor.name || '',
        company: vendor.company || null,
        trn: vendor.trn || null,
        email: vendor.email || null,
        phone: vendor.phone || null,
        address: {
          street: vendor.address || '',
          city: vendor.city || '',
          emirate: vendor.emirate || '',
          country: vendor.country || 'UAE',
          postalCode: vendor.postal_code || null,
        },
      },
      lines: (apiResponse.items || []).map((item, index) => ({
        id: `line_${apiResponse.id || 'new'}_${index}`,
        productId: item.product_id || null,
        productName: item.product_name || '',
        description: item.description || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'PCS',
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
        vatRate: 0, // PO typically no VAT
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
        updatedAt: apiResponse.updated_at || null,
        createdBy: null,
        isLocked: false,
      },
    };
  },

  fromForm(document: DocumentState): PurchaseOrderApiPayload {
    const vendorDetails = {
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
      po_number: document.header.docNumber || undefined,
      vendor_id: document.party.id!,
      vendor_details: vendorDetails,
      po_date: document.header.date,
      expected_delivery_date: document.header.dueDate,
      currency: document.header.currency,
      exchange_rate: document.header.exchangeRate,
      reference: document.header.reference,
      payment_terms: document.header.paymentTerms,
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
        amount: line.amount,
      })),
    };
  },
};

export default purchaseOrderAdapter;
