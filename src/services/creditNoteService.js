import { apiClient } from './api.js';

// Backend expects and returns pure snake_case - no transformation needed
// Field validators enforce snake_case consistency
const transformCreditNoteForServer = (creditNoteData) => {
  return {
    ...creditNoteData,
    // Extract customer fields if customer object provided
    customer_id: creditNoteData.customerId || creditNoteData.customer?.id,
    customer_name: creditNoteData.customerName || creditNoteData.customer?.name,
    customer_address: creditNoteData.customerAddress || creditNoteData.customer?.address,
    customer_phone: creditNoteData.customerPhone || creditNoteData.customer?.phone,
    customer_email: creditNoteData.customerEmail || creditNoteData.customer?.email,
    customer_trn: creditNoteData.customerTrn || creditNoteData.customer?.trn,
    // Ensure numeric fields are numbers
    subtotal: parseFloat(creditNoteData.subtotal || 0),
    vat_amount: parseFloat(creditNoteData.vatAmount || 0),
    total_credit: parseFloat(creditNoteData.totalCredit || 0),
    // Ensure items is array with numeric fields converted
    items: (creditNoteData.items || []).map(item => ({
      ...item,
      quantity_returned: parseFloat(item.quantityReturned || item.quantity || 0),
      original_quantity: parseFloat(item.originalQuantity || 0),
      rate: parseFloat(item.rate || 0),
      amount: parseFloat(item.amount || 0),
      vat_rate: parseFloat(item.vatRate || 5),
      vat_amount: parseFloat(item.vatAmount || 0),
      restocked_quantity: parseFloat(item.restockedQuantity || 0),
      damaged_quantity: parseFloat(item.damagedQuantity || 0),
      defective_quantity: parseFloat(item.defectiveQuantity || 0)
    }))
  };
};

// Backend returns pure snake_case - pass through with minimal processing
const transformCreditNoteFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    ...serverData,
    // Build customer object from flat fields
    customer: {
      id: serverData.customerId,
      name: serverData.customerName || '',
      address: serverData.customerAddress || '',
      phone: serverData.customerPhone || '',
      email: serverData.customerEmail || '',
      trn: serverData.customerTrn || ''
    },
    // Ensure numeric fields are numbers
    subtotal: parseFloat(serverData.subtotal || 0),
    vat_amount: parseFloat(serverData.vatAmount || 0),
    total_credit: parseFloat(serverData.totalCredit || 0),
    // Ensure items is array
    items: (serverData.items || []).map(item => ({
      ...item,
      quantity_returned: parseFloat(item.quantityReturned || item.quantity || 0),
      original_quantity: parseFloat(item.originalQuantity || 0),
      rate: parseFloat(item.rate || 0),
      amount: parseFloat(item.amount || 0),
      vat_rate: parseFloat(item.vatRate || 5),
      vat_amount: parseFloat(item.vatAmount || 0),
      restocked_quantity: parseFloat(item.restockedQuantity || 0),
      damaged_quantity: parseFloat(item.damagedQuantity || 0),
      defective_quantity: parseFloat(item.defectiveQuantity || 0)
    }))
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
