import { apiClient } from './api.js';

// Transform credit note data from UI format to server format
const transformCreditNoteForServer = (creditNoteData) => {
  return {
    credit_note_number: creditNoteData.creditNoteNumber || creditNoteData.credit_note_number,
    invoice_id: creditNoteData.invoiceId || creditNoteData.invoice_id,
    invoice_number: creditNoteData.invoiceNumber || creditNoteData.invoice_number,
    customer_id: creditNoteData.customerId || creditNoteData.customer?.id || creditNoteData.customer_id,
    customer_name: creditNoteData.customerName || creditNoteData.customer?.name || creditNoteData.customer_name,
    customer_address: creditNoteData.customerAddress || creditNoteData.customer?.address || creditNoteData.customer_address,
    customer_phone: creditNoteData.customerPhone || creditNoteData.customer?.phone || creditNoteData.customer_phone,
    customer_email: creditNoteData.customerEmail || creditNoteData.customer?.email || creditNoteData.customer_email,
    customer_trn: creditNoteData.customerTrn || creditNoteData.customer?.trn || creditNoteData.customer_trn,
    credit_note_date: creditNoteData.creditNoteDate || creditNoteData.credit_note_date,
    status: creditNoteData.status || 'draft',
    reason_for_return: creditNoteData.reasonForReturn || creditNoteData.reason_for_return || '',
    items: (creditNoteData.items || []).map(item => ({
      invoice_item_id: item.invoiceItemId || item.invoice_item_id || null,
      product_id: item.productId || item.product_id || null,
      product_name: item.productName || item.product_name || item.name,
      description: item.description || '',
      quantity_returned: parseFloat(item.quantityReturned || item.quantity_returned || item.quantity || 0),
      original_quantity: parseFloat(item.originalQuantity || item.original_quantity || 0),
      rate: parseFloat(item.rate || 0),
      amount: parseFloat(item.amount || 0),
      vat_rate: parseFloat(item.vatRate || item.vat_rate || 5),
      vat_amount: parseFloat(item.vatAmount || item.vat_amount || 0),
      // Return/Inspection fields
      return_status: item.returnStatus || item.return_status || 'in_transit_return',
      inspection_date: item.inspectionDate || item.inspection_date || null,
      inspection_notes: item.inspectionNotes || item.inspection_notes || '',
      restocked_quantity: parseFloat(item.restockedQuantity || item.restocked_quantity || 0),
      damaged_quantity: parseFloat(item.damagedQuantity || item.damaged_quantity || 0),
      defective_quantity: parseFloat(item.defectiveQuantity || item.defective_quantity || 0),
      warehouse_id: item.warehouseId || item.warehouse_id || null
    })),
    subtotal: parseFloat(creditNoteData.subtotal || 0),
    vat_amount: parseFloat(creditNoteData.vatAmount || creditNoteData.vat_amount || 0),
    total_credit: parseFloat(creditNoteData.totalCredit || creditNoteData.total_credit || 0),
    refund_method: creditNoteData.refundMethod || creditNoteData.refund_method || null,
    refund_date: creditNoteData.refundDate || creditNoteData.refund_date || null,
    refund_reference: creditNoteData.refundReference || creditNoteData.refund_reference || '',
    notes: creditNoteData.notes || ''
  };
};

// Transform credit note data from server format to UI format
const transformCreditNoteFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    creditNoteNumber: serverData.credit_note_number || serverData.creditNoteNumber,
    invoiceId: serverData.invoice_id || serverData.invoiceId,
    invoiceNumber: serverData.invoice_number || serverData.invoiceNumber,
    customer: {
      id: serverData.customer_id || serverData.customerId,
      name: serverData.customer_name || serverData.customerName || '',
      address: serverData.customer_address || serverData.customerAddress || '',
      phone: serverData.customer_phone || serverData.customerPhone || '',
      email: serverData.customer_email || serverData.customerEmail || '',
      trn: serverData.customer_trn || serverData.customerTrn || ''
    },
    creditNoteDate: serverData.credit_note_date || serverData.creditNoteDate,
    status: serverData.status || 'draft',
    reasonForReturn: serverData.reason_for_return || serverData.reasonForReturn || '',
    items: (serverData.items || []).map(item => ({
      id: item.id,
      invoiceItemId: item.invoice_item_id || item.invoiceItemId,
      productId: item.product_id || item.productId,
      productName: item.product_name || item.productName || item.name,
      description: item.description || '',
      quantityReturned: parseFloat(item.quantity_returned || item.quantityReturned || item.quantity || 0),
      originalQuantity: parseFloat(item.original_quantity || item.originalQuantity || 0),
      rate: parseFloat(item.rate || 0),
      amount: parseFloat(item.amount || 0),
      vatRate: parseFloat(item.vat_rate || item.vatRate || 5),
      vatAmount: parseFloat(item.vat_amount || item.vatAmount || 0),
      // Return/Inspection fields
      returnStatus: item.return_status || item.returnStatus || 'in_transit_return',
      inspectionDate: item.inspection_date || item.inspectionDate || null,
      inspectionNotes: item.inspection_notes || item.inspectionNotes || '',
      restockedQuantity: parseFloat(item.restocked_quantity || item.restockedQuantity || 0),
      damagedQuantity: parseFloat(item.damaged_quantity || item.damagedQuantity || 0),
      defectiveQuantity: parseFloat(item.defective_quantity || item.defectiveQuantity || 0),
      warehouseId: item.warehouse_id || item.warehouseId || null
    })),
    subtotal: parseFloat(serverData.subtotal || 0),
    vatAmount: parseFloat(serverData.vat_amount || serverData.vatAmount || 0),
    totalCredit: parseFloat(serverData.total_credit || serverData.totalCredit || 0),
    refundMethod: serverData.refund_method || serverData.refundMethod || null,
    refundDate: serverData.refund_date || serverData.refundDate || null,
    refundReference: serverData.refund_reference || serverData.refundReference || '',
    notes: serverData.notes || '',
    createdAt: serverData.created_at || serverData.createdAt,
    updatedAt: serverData.updated_at || serverData.updatedAt
  };
};

class CreditNoteService {
  constructor() {
    this.endpoint = '/credit-notes';
  }

  // Get all credit notes with optional filters
  async getAllCreditNotes(params = {}, signal = null) {
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 50,
      search: params.search || undefined,
      status: params.status || undefined,
      invoice_id: params.invoiceId || undefined,
      customer_id: params.customerId || undefined,
      start_date: params.startDate || undefined,
      end_date: params.endDate || undefined
    };

    // Remove undefined params
    Object.keys(queryParams).forEach(
      (key) => queryParams[key] === undefined && delete queryParams[key]
    );

    const axiosConfig = {};
    if (signal) {
      axiosConfig.signal = signal;
    }

    const response = await apiClient.get(this.endpoint, { ...queryParams, ...axiosConfig });

    // Handle paginated response
    if (response.data && Array.isArray(response.data)) {
      return {
        data: response.data.map(transformCreditNoteFromServer),
        pagination: response.pagination || null
      };
    }

    // Handle non-paginated response
    const creditNotes = Array.isArray(response) ? response : (response.data || []);
    return {
      data: creditNotes.map(transformCreditNoteFromServer),
      pagination: null
    };
  }

  // Get single credit note by ID
  async getCreditNote(id) {
    const response = await apiClient.get(`${this.endpoint}/${id}`);
    return transformCreditNoteFromServer(response);
  }

  // Create new credit note
  async createCreditNote(creditNoteData) {
    const transformedData = transformCreditNoteForServer(creditNoteData);
    const response = await apiClient.post(this.endpoint, transformedData);
    return transformCreditNoteFromServer(response);
  }

  // Update existing credit note
  async updateCreditNote(id, creditNoteData) {
    const transformedData = transformCreditNoteForServer(creditNoteData);
    const response = await apiClient.put(`${this.endpoint}/${id}`, transformedData);
    return transformCreditNoteFromServer(response);
  }

  // Delete credit note (soft delete)
  async deleteCreditNote(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  // Update credit note status
  async updateCreditNoteStatus(id, status) {
    return apiClient.patch(`${this.endpoint}/${id}/status`, { status });
  }

  // Get credit notes for a specific invoice
  async getCreditNotesByInvoice(invoiceId) {
    const response = await apiClient.get(`${this.endpoint}/by-invoice/${invoiceId}`);
    const creditNotes = Array.isArray(response) ? response : (response.data || []);
    return creditNotes.map(transformCreditNoteFromServer);
  }

  // Get next credit note number
  async getNextCreditNoteNumber() {
    return apiClient.get(`${this.endpoint}/number/next`);
  }

  // Update inspection for returned items
  async updateInspection(creditNoteId, itemId, inspectionData) {
    return apiClient.patch(
      `${this.endpoint}/${creditNoteId}/items/${itemId}/inspection`,
      {
        inspection_date: inspectionData.inspectionDate,
        inspection_notes: inspectionData.inspectionNotes,
        restocked_quantity: inspectionData.restockedQuantity,
        damaged_quantity: inspectionData.damagedQuantity,
        defective_quantity: inspectionData.defectiveQuantity,
        return_status: inspectionData.returnStatus
      }
    );
  }

  // Mark items as received
  async markItemsReceived(creditNoteId, receivedData) {
    return apiClient.patch(`${this.endpoint}/${creditNoteId}/receive`, {
      received_date: receivedData.receivedDate,
      received_by: receivedData.receivedBy,
      items: receivedData.items.map(item => ({
        item_id: item.itemId,
        quantity_received: item.quantityReceived,
        condition_notes: item.conditionNotes
      }))
    });
  }

  // Process refund
  async processRefund(creditNoteId, refundData) {
    return apiClient.patch(`${this.endpoint}/${creditNoteId}/refund`, {
      refund_method: refundData.refundMethod,
      refund_date: refundData.refundDate,
      refund_reference: refundData.refundReference,
      refund_amount: refundData.refundAmount
    });
  }

  // Restock items (after inspection approval)
  async restockItems(creditNoteId, restockData) {
    return apiClient.post(`${this.endpoint}/${creditNoteId}/restock`, {
      items: restockData.items.map(item => ({
        item_id: item.itemId,
        quantity_to_restock: item.quantityToRestock,
        warehouse_id: item.warehouseId,
        stock_location: item.stockLocation
      }))
    });
  }

  // Get credit note analytics
  async getCreditNoteAnalytics(params = {}) {
    return apiClient.get(`${this.endpoint}/analytics`, params);
  }

  // Search credit notes
  async searchCreditNotes(searchTerm, filters = {}) {
    return apiClient.get(this.endpoint, {
      search: searchTerm,
      ...filters
    });
  }
}

export const creditNoteService = new CreditNoteService();
