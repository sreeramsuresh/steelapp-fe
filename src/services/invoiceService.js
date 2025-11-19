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

// Backend returns pure snake_case - no transformation needed
// Field validators enforce snake_case consistency
const transformInvoiceFromServer = (serverData) => {
  return {
    ...serverData,
    // Ensure customer_details is parsed if it's a string
    customer: typeof serverData.customerDetails === 'string'
      ? JSON.parse(serverData.customerDetails)
      : serverData.customerDetails || serverData.customer || {},
    // Ensure numeric fields are numbers
    received: serverData.received !== undefined ? Number(serverData.received) : 0,
    outstanding: serverData.outstanding !== undefined ? Number(serverData.outstanding) : 0,
    subtotal: serverData.subtotal !== undefined ? Number(serverData.subtotal) : 0,
    vat_amount: serverData.vatAmount !== undefined ? Number(serverData.vatAmount) : 0,
    total: serverData.total !== undefined ? Number(serverData.total) : 0,
    // Ensure items is an array
    items: Array.isArray(serverData.items) ? serverData.items : []
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
