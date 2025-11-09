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
    invoiceNumber: serverData.invoice_number || '',
    date: serverData.invoice_date,
    dueDate: serverData.due_date,
    modeOfPayment: serverData.mode_of_payment || '',
    chequeNumber: serverData.cheque_number || '',
    customer: typeof serverData.customer_details === 'string' 
      ? JSON.parse(serverData.customer_details) 
      : serverData.customer_details || {},
    subtotal: serverData.subtotal || 0,
    vatAmount: serverData.vat_amount || 0,
    total: serverData.total || 0,
    discountType: serverData.discount_type || 'amount',
    discountPercentage: serverData.discount_percentage || 0,
    discountAmount: serverData.discount_amount || 0,
    packingCharges: serverData.packing_charges || 0,
    freightCharges: serverData.freight_charges || 0,
    insuranceCharges: serverData.insurance_charges || 0,
    loadingCharges: serverData.loading_charges || 0,
    otherCharges: serverData.other_charges || 0,
    advanceReceived: serverData.advance_received || 0,
    status: serverData.status || 'draft',
    notes: serverData.notes || '',
    terms: serverData.terms || '',
    taxNotes: serverData.tax_notes || '',
    currency: serverData.currency || 'AED',
    exchangeRate: serverData.exchange_rate || 1,
    warehouseId: serverData.warehouse_id || null,
    warehouseName: serverData.warehouse_name || '',
    warehouseCode: serverData.warehouse_code || '',
    warehouseCity: serverData.warehouse_city || '',
    items: serverData.items?.map(item => ({
      id: item.id,
      productId: item.product_id,
      name: item.name || '',
      finish: item.finish || '',
      size: item.size || '',
      thickness: item.thickness || '',
      specification: item.specification || '',
      hsnCode: item.hsn_code || '',
      unit: item.unit || '',
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      vatRate: item.vat_rate || 5,
      amount: item.amount || 0
    })) || [],
    createdAt: serverData.created_at,
    updatedAt: serverData.updated_at,
    // Audit trail fields for cancel and recreate
    recreated_from: serverData.recreated_from,
    original_id: serverData.original_id,
    new_invoice_id: serverData.new_invoice_id,
    // Soft delete fields
    deletedAt: serverData.deleted_at,
    deletionReason: serverData.deletion_reason,
    deletionReasonCode: serverData.deletion_reason_code,
    deletedByUserId: serverData.deleted_by_user_id
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
  }
};
