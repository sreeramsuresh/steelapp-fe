import { apiClient } from './api';

const transformInvoiceForServer = (invoiceData) => {
  return {
    invoice_number: invoiceData.invoiceNumber,
    customer_id: invoiceData.customer?.id || null,
    customer_details: invoiceData.customer,
    invoice_date: invoiceData.date,
    due_date: invoiceData.dueDate,
    // Invoice-level discount (for backend recomputation)
    discount_type: invoiceData.discountType || 'amount',
    discount_percentage: invoiceData.discountPercentage || 0,
    discount_amount: invoiceData.discountAmount || 0,
    // Charges
    packing_charges: invoiceData.packingCharges || 0,
    freight_charges: invoiceData.freightCharges || 0,
    insurance_charges: invoiceData.insuranceCharges || 0,
    loading_charges: invoiceData.loadingCharges || 0,
    other_charges: invoiceData.otherCharges || 0,
    mode_of_payment: invoiceData.modeOfPayment || null,
    cheque_number: invoiceData.chequeNumber || null,
    advance_received: invoiceData.advanceReceived || 0,
    // Warehouse data
    warehouse_id: invoiceData.warehouseId || null,
    warehouse_name: invoiceData.warehouseName || '',
    warehouse_code: invoiceData.warehouseCode || '',
    warehouse_city: invoiceData.warehouseCity || '',
    subtotal: invoiceData.subtotal,
    vat_amount: invoiceData.vatAmount,
    total: invoiceData.total,
    status: invoiceData.status || 'draft',
    notes: invoiceData.notes,
    terms: invoiceData.terms,
    items: invoiceData.items?.map(item => ({
      product_id: item.productId || null,
      name: item.name,
      finish: item.finish,
      size: item.size,
      thickness: item.thickness,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      vat_rate: item.vatRate,
      amount: item.amount
    })) || []
  };
};

const transformInvoiceFromServer = (serverData) => {
  return {
    id: serverData.id,
    // Backend middleware converts to camelCase, so use camelCase property names
    invoiceNumber: serverData.invoiceNumber || serverData.invoice_number || '',
    date: serverData.invoiceDate || serverData.invoice_date,
    dueDate: serverData.dueDate || serverData.due_date,
    modeOfPayment: serverData.modeOfPayment || serverData.mode_of_payment || '',
    chequeNumber: serverData.chequeNumber || serverData.cheque_number || '',
    customer: typeof serverData.customerDetails === 'string'
      ? JSON.parse(serverData.customerDetails)
      : (serverData.customerDetails || serverData.customer_details || {}),
    subtotal: serverData.subtotal || 0,
    vatAmount: serverData.vatAmount || serverData.vat_amount || 0,
    total: serverData.total || 0,
    discountType: serverData.discountType || serverData.discount_type || 'amount',
    discountPercentage: serverData.discountPercentage || serverData.discount_percentage || 0,
    discountAmount: serverData.discountAmount || serverData.discount_amount || 0,
    packingCharges: serverData.packingCharges || serverData.packing_charges || 0,
    freightCharges: serverData.freightCharges || serverData.freight_charges || 0,
    insuranceCharges: serverData.insuranceCharges || serverData.insurance_charges || 0,
    loadingCharges: serverData.loadingCharges || serverData.loading_charges || 0,
    otherCharges: serverData.otherCharges || serverData.other_charges || 0,
    advanceReceived: serverData.advanceReceived || serverData.advance_received || 0,
    status: serverData.status || 'draft',
    notes: serverData.notes || '',
    terms: serverData.terms || '',
    taxNotes: serverData.taxNotes || serverData.tax_notes || '',
    currency: serverData.currency || 'AED',
    exchangeRate: serverData.exchangeRate || serverData.exchange_rate || 1,
    warehouseId: serverData.warehouseId || serverData.warehouse_id || null,
    warehouseName: serverData.warehouseName || serverData.warehouse_name || '',
    warehouseCode: serverData.warehouseCode || serverData.warehouse_code || '',
    warehouseCity: serverData.warehouseCity || serverData.warehouse_city || '',
    items: serverData.items?.map(item => ({
      id: item.id,
      productId: item.productId || item.product_id,
      name: item.name || '',
      finish: item.finish || '',
      size: item.size || '',
      thickness: item.thickness || '',
      specification: item.specification || '',
      hsnCode: item.hsnCode || item.hsn_code || '',
      unit: item.unit || '',
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      vatRate: item.vatRate || item.vat_rate || 5,
      amount: item.amount || 0
    })) || [],
    createdAt: serverData.createdAt || serverData.created_at,
    updatedAt: serverData.updatedAt || serverData.updated_at,
    // Audit trail fields for cancel and recreate
    recreated_from: serverData.recreatedFrom || serverData.recreated_from,
    original_id: serverData.originalId || serverData.original_id,
    new_invoice_id: serverData.newInvoiceId || serverData.new_invoice_id,
    // Soft delete fields
    deletedAt: serverData.deletedAt || serverData.deleted_at,
    deletionReason: serverData.deletionReason || serverData.deletion_reason,
    deletionReasonCode: serverData.deletionReasonCode || serverData.deletion_reason_code,
    deletedByUserId: serverData.deletedByUserId || serverData.deleted_by_user_id,
    // Payment data (from backend aggregation - GOLD STANDARD)
    // Backend calculates these, frontend just displays
    received: serverData.received !== undefined ? Number(serverData.received) : 0,
    outstanding: serverData.outstanding !== undefined ? Number(serverData.outstanding) : 0,
    paymentStatus: serverData.paymentStatus || serverData.payment_status || 'unpaid',
    payments: serverData.payments || [],
    // Promise data (for payment reminders)
    promiseDate: serverData.promiseDate || serverData.promise_date || null,
    promiseAmount: serverData.promiseAmount !== undefined ? Number(serverData.promiseAmount) : (serverData.promise_amount !== undefined ? Number(serverData.promise_amount) : null)
  };
};

export const invoiceService = {
  async getInvoices(params = {}, signal = null) {
    // Separate signal from params and create proper axios config
    const axiosConfig = {
      params: params
    };

    // Add abort signal if provided
    if (signal) {
      axiosConfig.signal = signal;
    }

    const response = await apiClient.get('/invoices', axiosConfig);

    // Handle paginated response
    if (response.invoices && response.pagination) {
      return {
        invoices: response.invoices.map(transformInvoiceFromServer),
        pagination: response.pagination
      };
    }

    // Handle non-paginated response (for backward compatibility)
    const invoices = response.invoices || response;
    return {
      invoices: Array.isArray(invoices)
        ? invoices.map(transformInvoiceFromServer)
        : [],
      pagination: null
    };
  },

  async getInvoice(id) {
    const response = await apiClient.get(`/invoices/${id}`);
    return transformInvoiceFromServer(response);
  },

  async createInvoice(invoiceData) {
    const transformedData = transformInvoiceForServer(invoiceData);
    const response = await apiClient.post('/invoices', transformedData);
    return transformInvoiceFromServer(response);
  },

  async updateInvoice(id, invoiceData) {
    const transformedData = transformInvoiceForServer(invoiceData);
    const response = await apiClient.put(`/invoices/${id}`, transformedData);
    return transformInvoiceFromServer(response);
  },

  async deleteInvoice(id, deletionData = {}) {
    // Soft delete with reason for audit trail
    // Axios DELETE requires data to be wrapped in config.data
    return apiClient.delete(`/invoices/${id}`, { data: deletionData });
  },

  async restoreInvoice(id) {
    // Restore soft-deleted invoice
    return apiClient.patch(`/invoices/${id}/restore`, {});
  },

  async updateInvoiceStatus(id, status) {
    return apiClient.patch(`/invoices/${id}/status`, { status });
  },

  async getNextInvoiceNumber() {
    return apiClient.get('/invoices/number/next');
  },

  async getInvoiceAnalytics(params = {}) {
    return apiClient.get('/invoices/analytics', params);
  },

  async searchInvoices(searchTerm, filters = {}) {
    return apiClient.get('/invoices', {
      search: searchTerm,
      ...filters
    });
  },

  async searchForCreditNote(query) {
    // Fast autocomplete search for invoices eligible for credit notes
    const response = await apiClient.get('/invoices/search-for-credit-note', { q: query });
    return response;
  },

  async getInvoicesByCustomer(customerId) {
    return apiClient.get('/invoices', { customer_id: customerId });
  },

  async getInvoicesByDateRange(startDate, endDate) {
    return apiClient.get('/invoices', {
      start_date: startDate,
      end_date: endDate
    });
  },

  async getInvoicesByStatus(status) {
    return apiClient.get('/invoices', { status });
  },

  async addInvoicePayment(id, payload) {
    // payload: { payment_date, amount, method, reference_no, notes, attachment_url }
    return apiClient.post(`/invoices/${id}/payments`, payload);
  },

  async voidInvoicePayment(invoiceId, paymentId, reason) {
    return apiClient.post(`/invoices/${invoiceId}/payments/${paymentId}/void`, { reason });
  }
};
