import { apiClient } from './api';

const transformInvoiceForServer = (invoiceData) => {
  return {
    invoice_number: invoiceData.invoiceNumber,
    customer_id: invoiceData.customer?.id || null,
    customer_details: invoiceData.customer,
    invoice_date: invoiceData.date,
    due_date: invoiceData.dueDate,
    subtotal: invoiceData.subtotal,
    vat_amount: invoiceData.vatAmount,
    total: invoiceData.total,
    status: invoiceData.status || 'draft',
    notes: invoiceData.notes,
    terms: invoiceData.terms,
    items: invoiceData.items?.map(item => ({
      product_id: item.productId || null,
      name: item.name,
      specification: item.specification,
      hsn_code: item.hsnCode,
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
    customer: typeof serverData.customer_details === 'string' 
      ? JSON.parse(serverData.customer_details) 
      : serverData.customer_details || {},
    subtotal: serverData.subtotal || 0,
    vatAmount: serverData.vat_amount || 0,
    total: serverData.total || 0,
    status: serverData.status || 'draft',
    notes: serverData.notes || '',
    terms: serverData.terms || '',
    items: serverData.items?.map(item => ({
      id: item.id,
      productId: item.product_id,
      name: item.name || '',
      specification: item.specification || '',
      hsnCode: item.hsn_code || '',
      unit: item.unit || '',
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      vatRate: item.vat_rate || 0,
      amount: item.amount || 0
    })) || [],
    createdAt: serverData.created_at,
    updatedAt: serverData.updated_at,
    // Audit trail fields for cancel and recreate
    recreated_from: serverData.recreated_from,
    original_id: serverData.original_id,
    new_invoice_id: serverData.new_invoice_id
  };
};

export const invoiceService = {
  async getInvoices(params = {}) {
    const response = await apiClient.get('/invoices', params);
    
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

  async deleteInvoice(id) {
    return apiClient.delete(`/invoices/${id}`);
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