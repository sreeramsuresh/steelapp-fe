import { apiClient } from "./api.js";

// Backend expects and returns pure snake_case - no transformation needed
// Field validators enforce snake_case consistency
const transformCreditNoteForServer = (creditNoteData) => {
  return {
    // Explicit snake_case transformations (no spread to avoid conflicting keys)
    credit_note_number: creditNoteData.creditNoteNumber ?? creditNoteData.credit_note_number ?? "",
    invoice_id: creditNoteData.invoiceId ?? creditNoteData.invoice_id,
    credit_note_date: creditNoteData.creditNoteDate ?? creditNoteData.credit_note_date,
    status: creditNoteData.status,
    credit_note_type: creditNoteData.creditNoteType ?? creditNoteData.credit_note_type,
    reason_for_return: creditNoteData.reasonForReturn ?? creditNoteData.reason_for_return,
    // Extract customer fields if customer object provided
    customer_id: creditNoteData.customerId ?? creditNoteData.customer?.id,
    customer_name: creditNoteData.customerName ?? creditNoteData.customer?.name,
    customer_address: creditNoteData.customerAddress ?? creditNoteData.customer?.address,
    customer_phone: creditNoteData.customerPhone ?? creditNoteData.customer?.phone,
    customer_email: creditNoteData.customerEmail ?? creditNoteData.customer?.email,
    customer_trn: creditNoteData.customerTrn ?? creditNoteData.customer?.trn,
    notes: creditNoteData.notes ?? "",
    // Settlement / refund fields
    refund_method: creditNoteData.refundMethod ?? creditNoteData.refund_method ?? "",
    refund_date: creditNoteData.refundDate ?? creditNoteData.refund_date ?? null,
    refund_reference: creditNoteData.refundReference ?? creditNoteData.refund_reference ?? "",
    // Ensure numeric fields are numbers
    subtotal: parseFloat(creditNoteData.subtotal ?? 0),
    vat_amount: parseFloat(creditNoteData.vatAmount ?? 0),
    total_credit: parseFloat(creditNoteData.totalCredit ?? 0),
    manual_credit_amount: parseFloat(creditNoteData.manualCreditAmount ?? 0),
    // Ensure items is array with numeric fields converted
    items: (creditNoteData.items ?? []).map((item) => ({
      ...item,
      quantity_returned: parseFloat(item.quantityReturned ?? item.quantity ?? 0),
      original_quantity: parseFloat(item.originalQuantity ?? 0),
      rate: parseFloat(item.rate ?? 0),
      amount: parseFloat(item.amount ?? 0),
      vat_rate: item.vatRate !== undefined && item.vatRate !== null ? parseFloat(item.vatRate) : 5,
      vat_amount: parseFloat(item.vatAmount ?? 0),
      restocked_quantity: parseFloat(item.restockedQuantity ?? 0),
      damaged_quantity: parseFloat(item.damagedQuantity ?? 0),
      defective_quantity: parseFloat(item.defectiveQuantity ?? 0),
    })),
  };
};

// Backend returns data - transform to consistent camelCase for frontend
const transformCreditNoteFromServer = (serverData) => {
  if (!serverData) return null;

  // Transform items if present
  const items = (serverData.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId ?? item.product_id,
    productName: item.productName ?? item.product_name ?? item.description ?? "",
    description: item.description ?? item.productName ?? item.product_name ?? "",
    quantity: parseFloat(item.quantity ?? 0),
    quantityReturned: parseFloat(item.quantityReturned ?? item.quantity_returned ?? 0),
    unitPrice: parseFloat(item.unitPrice ?? item.unit_price ?? item.rate ?? 0),
    amount: parseFloat(item.amount ?? item.total ?? 0),
    selected: (item.quantityReturned ?? item.quantity_returned ?? 0) > 0,
  }));

  return {
    id: serverData.id,
    // BUG #1: creditNoteNumber - frontend expects creditNoteNumber, proto sends credit_note_number
    creditNoteNumber: serverData.creditNoteNumber ?? serverData.credit_note_number ?? "",
    // BUG #2: credit_note_number - frontend expects credit_note_number, proto sends credit_note_number
    credit_note_number: serverData.credit_note_number ?? serverData.creditNoteNumber ?? "",
    // BUG #3: invoiceId - frontend expects invoiceId, proto sends invoice_id
    invoiceId: serverData.invoiceId ?? serverData.invoice_id ?? null,
    // BUG #4: invoice_id - frontend expects invoice_id, proto sends invoice_id
    invoice_id: serverData.invoice_id ?? serverData.invoiceId ?? null,
    invoiceNumber: serverData.invoiceNumber ?? serverData.invoice_number ?? "",
    // BUG #5: customer_id - frontend expects customer_id, proto sends customer_id
    customer_id: serverData.customer_id ?? serverData.customerId ?? null,
    customerId: serverData.customerId ?? serverData.customer_id,
    // BUG #6: customer_name - frontend expects customer_name, proto sends customer_name
    customer_name: serverData.customer_name ?? serverData.customerName ?? "",
    customerName: serverData.customerName ?? serverData.customer_name ?? "",
    customer: {
      id: serverData.customerId ?? serverData.customer_id,
      name: serverData.customerName ?? serverData.customer_name ?? "",
      address: serverData.customerAddress ?? serverData.customer_address ?? {},
      phone: serverData.customerPhone ?? serverData.customer_phone ?? "",
      email: serverData.customerEmail ?? serverData.customer_email ?? "",
      trn: serverData.customerTrn ?? serverData.customer_trn ?? "",
    },
    creditNoteDate: serverData.creditNoteDate ?? serverData.credit_note_date ?? new Date().toISOString().split("T")[0],
    status: serverData.status ?? "draft",
    creditNoteType: serverData.creditNoteType ?? serverData.credit_note_type ?? "RETURN_WITH_QC",
    // BUG #10: credit_note_type - frontend expects credit_note_type, proto sends credit_note_type
    credit_note_type: serverData.credit_note_type ?? serverData.creditNoteType ?? "RETURN_WITH_QC",
    reasonForReturn: serverData.reasonForReturn ?? serverData.reason_for_return ?? "",
    // BUG #7: adjustment_type - frontend expects adjustment_type (mapped from reason_for_return)
    adjustment_type: serverData.adjustment_type ?? serverData.adjustmentType ?? serverData.reason_for_return ?? "",
    // BUG #8: reason_category - frontend expects reason_category, proto sends return_reason_category
    reason_category: serverData.reason_category ?? serverData.reasonCategory ?? serverData.return_reason_category ?? "",
    // BUG #9: reasonCat - frontend expects reasonCat (short alias for reason_category)
    reasonCat: serverData.reasonCat ?? serverData.reasonCategory ?? serverData.return_reason_category ?? "",
    items,
    subtotal: parseFloat(serverData.subtotal ?? serverData.sub_total ?? 0),
    vatAmount: parseFloat(serverData.vatAmount ?? serverData.vat_amount ?? 0),
    // BUG #11: vat_amount - frontend expects vat_amount, proto sends vat_amount
    vat_amount: parseFloat(serverData.vat_amount ?? serverData.vatAmount ?? 0),
    totalCredit: parseFloat(serverData.totalCredit ?? serverData.total_credit ?? 0),
    // BUG #12: manualCreditAmount - frontend expects manualCreditAmount, proto sends manual_credit_amount
    manualCreditAmount: parseFloat(serverData.manualCreditAmount ?? serverData.manual_credit_amount ?? 0),
    // BUG #13: manual_credit_amount - frontend expects manual_credit_amount, proto sends manual_credit_amount
    manual_credit_amount: parseFloat(serverData.manual_credit_amount ?? serverData.manualCreditAmount ?? 0),
    notes: serverData.notes ?? "",
    // Settlement / refund fields
    refundMethod: serverData.refundMethod ?? serverData.refund_method ?? "",
    refundDate: serverData.refundDate ?? serverData.refund_date ?? null,
    refundReference: serverData.refundReference ?? serverData.refund_reference ?? "",
    createdAt: serverData.createdAt ?? serverData.created_at ?? serverData.audit?.createdAt ?? null,
    updatedAt: serverData.updatedAt ?? serverData.updated_at ?? serverData.audit?.updatedAt ?? null,
  };
};

class CreditNoteService {
  constructor() {
    this.endpoint = "/credit-notes";
  }

  // Get all credit notes with optional filters
  async getAllCreditNotes(params = {}, signal = null) {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search,
      status: params.status,
      invoice_id: params.invoiceId,
      customer_id: params.customerId,
      start_date: params.startDate,
      end_date: params.endDate,
    };

    // Remove undefined params
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined) delete queryParams[key];
    });

    const axiosConfig = signal ? { signal } : {};

    const response = await apiClient.get(this.endpoint, queryParams, axiosConfig);

    // Normalize pageInfo to { total, totalPages, currentPage, pageSize }
    const normalizePagination = (pi) => {
      if (!pi) return null;
      return {
        total: pi.totalItems ?? pi.total ?? 0,
        totalPages: pi.totalPages ?? 1,
        currentPage: pi.currentPage ?? 1,
        pageSize: pi.pageSize ?? 20,
      };
    };

    // Handle paginated response - API returns { creditNotes: [...], pageInfo: {...} }
    if (response?.creditNotes && Array.isArray(response.creditNotes)) {
      return {
        data: response.creditNotes.map(transformCreditNoteFromServer),
        pagination: normalizePagination(response.pageInfo),
      };
    }

    // Fallback: handle { data: [...] } shape or raw array
    if (response?.data && Array.isArray(response.data)) {
      return {
        data: response.data.map(transformCreditNoteFromServer),
        pagination: normalizePagination(response.pageInfo ?? response.pagination),
      };
    }

    // Handle non-paginated response (array directly)
    const creditNotes = Array.isArray(response) ? response : [];
    return {
      data: creditNotes.map(transformCreditNoteFromServer),
      pagination: null,
    };
  }

  // Get single credit note by ID
  async getCreditNote(id, config = {}) {
    const response = await apiClient.get(`${this.endpoint}/${id}`, config);
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

  // Update credit note status (legacy - use specific transition methods instead)
  async updateCreditNoteStatus(id, status) {
    return apiClient.patch(`${this.endpoint}/${id}/status`, { status });
  }

  // ============================================
  // Status Transition Methods (NEW)
  // ============================================

  // Get allowed status transitions for a credit note
  async getAllowedTransitions(id) {
    return apiClient.get(`${this.endpoint}/${id}/allowed-transitions`);
  }

  // Issue a draft credit note (draft -> issued)
  async issueCreditNote(id) {
    const response = await apiClient.post(`${this.endpoint}/${id}/issue`);
    return transformCreditNoteFromServer(response);
  }

  // Apply credit to customer account (issued/items_inspected -> applied)
  async applyCreditNote(id, notes = "") {
    const response = await apiClient.post(`${this.endpoint}/${id}/apply`, {
      notes,
    });
    return transformCreditNoteFromServer(response);
  }

  // Complete the credit note (applied/refunded -> completed)
  async completeCreditNote(id, notes = "") {
    const response = await apiClient.post(`${this.endpoint}/${id}/complete`, {
      notes,
    });
    return transformCreditNoteFromServer(response);
  }

  // Cancel the credit note (any except completed -> cancelled)
  async cancelCreditNote(id, cancellationReason = "") {
    const response = await apiClient.post(`${this.endpoint}/${id}/cancel`, {
      cancellation_reason: cancellationReason,
    });
    return transformCreditNoteFromServer(response);
  }

  // Get credit notes for a specific invoice
  async getCreditNotesByInvoice(invoiceId) {
    const response = await apiClient.get(`${this.endpoint}/by-invoice/${invoiceId}`);
    const creditNotes = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : [];
    return creditNotes.map(transformCreditNoteFromServer);
  }

  // Get next credit note number
  async getNextCreditNoteNumber() {
    return apiClient.get(`${this.endpoint}/number/next`);
  }

  // Update inspection for returned items
  async updateInspection(creditNoteId, itemId, inspectionData) {
    return apiClient.patch(`${this.endpoint}/${creditNoteId}/items/${itemId}/inspection`, {
      inspection_date: inspectionData.inspectionDate,
      inspection_notes: inspectionData.inspectionNotes,
      restocked_quantity: inspectionData.restockedQuantity,
      damaged_quantity: inspectionData.damagedQuantity,
      defective_quantity: inspectionData.defectiveQuantity,
      return_status: inspectionData.returnStatus,
    });
  }

  // Mark items as received (issued -> items_received) - RETURN_WITH_QC only
  async markItemsReceived(creditNoteId, receivedData = {}) {
    const response = await apiClient.post(`${this.endpoint}/${creditNoteId}/receive-items`, {
      notes: receivedData.notes ?? "",
      items: (receivedData.items ?? []).map((item) => ({
        credit_note_item_id: item.creditNoteItemId ?? item.id,
        quantity_received: item.quantityReceived,
        warehouse_id: item.warehouseId,
      })),
    });
    return transformCreditNoteFromServer(response);
  }

  // Mark items as inspected with QC results (items_received -> items_inspected)
  // Handles inventory restock and scrap creation
  async markItemsInspected(creditNoteId, inspectionData) {
    const response = await apiClient.post(`${this.endpoint}/${creditNoteId}/inspect-items`, {
      qc_result: inspectionData.qcResult, // 'GOOD', 'BAD', or 'PARTIAL'
      qc_notes: inspectionData.qcNotes ?? "",
      item_results: (inspectionData.itemResults ?? []).map((item) => ({
        credit_note_item_id: item.creditNoteItemId ?? item.id,
        restocked_quantity: item.restockedQuantity ?? 0,
        damaged_quantity: item.damagedQuantity ?? 0,
        defective_quantity: item.defectiveQuantity ?? 0,
        inspection_notes: item.inspectionNotes ?? "",
        warehouse_id: item.warehouseId ?? 0,
        scrap_reason_category: item.scrapReasonCategory ?? "OTHER",
        scrap_reason: item.scrapReason ?? "",
      })),
    });
    return transformCreditNoteFromServer(response);
  }

  // Process refund (issued/items_inspected -> refunded)
  async refundCreditNote(creditNoteId, refundData = {}) {
    const response = await apiClient.post(`${this.endpoint}/${creditNoteId}/refund`, {
      refund_method: refundData.refundMethod ?? "",
      refund_reference: refundData.refundReference ?? "",
      notes: refundData.notes ?? "",
    });
    return transformCreditNoteFromServer(response);
  }

  // Get credit note analytics
  async getCreditNoteAnalytics(params = {}) {
    return apiClient.get(`${this.endpoint}/analytics`, params);
  }

  // Search credit notes
  async searchCreditNotes(searchTerm, filters = {}) {
    return apiClient.get(this.endpoint, {
      search: searchTerm,
      ...filters,
    });
  }

  // ============================================
  // Scrap Items Methods (NEW)
  // ============================================

  // Get all scrap items with filters
  async getScrapItems(params = {}) {
    const queryParams = {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      product_id: params.productId,
      reason_category: params.reasonCategory,
    };
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined) delete queryParams[key];
    });
    return apiClient.get(`${this.endpoint}/scrap-items`, queryParams);
  }

  // Get scrap items for a specific credit note
  async getScrapItemsByCreditNote(creditNoteId) {
    return apiClient.get(`${this.endpoint}/${creditNoteId}/scrap-items`);
  }

  // ============================================
  // PDF Generation Methods (UAE VAT Compliance)
  // ============================================

  /**
   * Download credit note PDF
   * Rule 2: PREVIEW = On-demand PDF, never stored
   * Rule 6: Consistent preview path
   * Rule 7: Data = Single source of truth
   */
  async downloadPDF(id, creditNoteNumber = null) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}/pdf`, {
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `credit-note-${creditNoteNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("[CreditNoteService] PDF download failed:", error);
      throw error;
    }
  }

  /**
   * Open credit note PDF in new tab for preview/print
   */
  async previewPDF(id) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}/pdf`, {
        responseType: "blob",
      });

      // Open in new tab
      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up after delay
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);

      return true;
    } catch (error) {
      console.error("[CreditNoteService] PDF preview failed:", error);
      throw error;
    }
  }
}

export const creditNoteService = new CreditNoteService();
