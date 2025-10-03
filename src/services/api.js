import { apiService } from './axiosApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  setAuthHeader(token) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    // Also set on axios-based service so interceptors use it
    apiService.setAuthToken(token);
  }

  removeAuthHeader() {
    delete this.defaultHeaders['Authorization'];
    apiService.removeAuthToken();
  }

  // Deprecated fetch-based request kept for backward compatibility if needed
  // New code should use the axios-based methods below which benefit from interceptors
  async request(endpoint, options = {}) {
    // Delegate to axios-based apiService
    const method = (options.method || 'GET').toUpperCase();
    const data = options.body instanceof FormData ? options.body : (typeof options.body === 'string' ? JSON.parse(options.body) : options.body);
    switch (method) {
      case 'GET':
        return apiService.get(endpoint);
      case 'POST':
        return apiService.post(endpoint, data);
      case 'PUT':
        return apiService.put(endpoint, data);
      case 'PATCH':
        return apiService.patch(endpoint, data);
      case 'DELETE':
        return apiService.delete(endpoint);
      default:
        return apiService.request({ method, url: endpoint, data });
    }
  }

  async get(endpoint, params = {}) {
    return apiService.get(endpoint, params);
  }

  async post(endpoint, data) {
    return apiService.post(endpoint, data);
  }

  async put(endpoint, data) {
    return apiService.put(endpoint, data);
  }

  async patch(endpoint, data) {
    return apiService.patch(endpoint, data);
  }

  async delete(endpoint) {
    return apiService.delete(endpoint);
  }
}

export const apiClient = new ApiClient();

// Delivery Notes API methods
export const deliveryNotesAPI = {
  // Get all delivery notes with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/delivery-notes', params);
  },

  // Get delivery note by ID
  getById: (id) => {
    return apiClient.get(`/delivery-notes/${id}`);
  },

  // Create delivery note from invoice
  create: (deliveryNoteData) => {
    return apiClient.post('/delivery-notes', deliveryNoteData);
  },

  // Update delivery quantities (partial delivery)
  updateDelivery: (deliveryNoteId, itemId, deliveryData) => {
    return apiClient.patch(`/delivery-notes/${deliveryNoteId}/items/${itemId}/deliver`, deliveryData);
  },

  // Update delivery note status
  updateStatus: (id, status) => {
    return apiClient.patch(`/delivery-notes/${id}/status`, { status });
  },

  // Delete delivery note
  delete: (id) => {
    return apiClient.delete(`/delivery-notes/${id}`);
  },

  // Get next delivery note number
  getNextNumber: () => {
    return apiClient.get('/delivery-notes/number/next');
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    // Use axios-based service to leverage interceptors and auth headers
    const blob = await apiService.request({
      method: 'GET',
      url: `/delivery-notes/${id}/pdf`,
      responseType: 'blob'
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Get delivery note number for filename
    const deliveryNote = await deliveryNotesAPI.getById(id);
    const filename = `delivery-note-${deliveryNote.delivery_note_number}.pdf`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  }
};

// Enhanced Invoices API methods
export const invoicesAPI = {
  // Get all invoices with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/invoices', params);
  },

  // Get invoice by ID
  getById: (id) => {
    return apiClient.get(`/invoices/${id}`);
  },

  // Create invoice
  create: (invoiceData) => {
    return apiClient.post('/invoices', invoiceData);
  },

  // Update invoice
  update: (id, invoiceData) => {
    return apiClient.put(`/invoices/${id}`, invoiceData);
  },

  // Update invoice status
  updateStatus: (id, status) => {
    return apiClient.patch(`/invoices/${id}/status`, { status });
  },

  // Delete invoice
  delete: (id) => {
    return apiClient.delete(`/invoices/${id}`);
  },

  // Get next invoice number
  getNextNumber: () => {
    return apiClient.get('/invoices/number/next');
  },

  // Get analytics
  getAnalytics: (params = {}) => {
    return apiClient.get('/invoices/analytics', params);
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const blob = await apiService.request({
      method: 'GET',
      url: `/invoices/${id}/pdf`,
      responseType: 'blob'
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Get invoice number for filename
    const invoice = await invoicesAPI.getById(id);
    const filename = `invoice-${invoice.invoice_number}.pdf`;
    
    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  }
};

// Purchase Orders API methods
export const purchaseOrdersAPI = {
  // Get all purchase orders with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/purchase-orders', params);
  },

  // Get purchase order by ID
  getById: (id) => {
    return apiClient.get(`/purchase-orders/${id}`);
  },

  // Create purchase order
  create: (poData) => {
    return apiClient.post('/purchase-orders', poData);
  },

  // Update purchase order
  update: (id, poData) => {
    return apiClient.put(`/purchase-orders/${id}`, poData);
  },
  // Update only transit status (if backend supports it)
  updateTransitStatus: (id, transit_status) => {
    return apiClient.patch(`/purchase-orders/${id}/transit-status`, { transit_status });
  },

  // Update purchase order status
  updateStatus: (id, status) => {
    return apiClient.patch(`/purchase-orders/${id}/status`, { status });
  },

  // Delete purchase order
  delete: (id) => {
    return apiClient.delete(`/purchase-orders/${id}`);
  },

  // Get next PO number
  getNextNumber: () => {
    return apiClient.get('/purchase-orders/number/next');
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const apiUrl = `${apiClient.baseURL}/purchase-orders/${id}/pdf`;
    const response = await fetch(apiUrl, {
      headers: apiClient.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = `PurchaseOrder-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  }
};

// Account Statements API methods
export const accountStatementsAPI = {
  // Get all account statements with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/account-statements', params);
  },

  // Get account statement by ID
  getById: (id) => {
    return apiClient.get(`/account-statements/${id}`);
  },

  // Create account statement
  create: (data) => {
    return apiClient.post('/account-statements', data);
  },

  // Update account statement
  update: (id, data) => {
    return apiClient.put(`/account-statements/${id}`, data);
  },

  // Delete account statement
  delete: (id) => {
    return apiClient.delete(`/account-statements/${id}`);
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const apiUrl = `${apiClient.baseURL}/account-statements/${id}/pdf`;
    const response = await fetch(apiUrl, {
      headers: apiClient.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = `AccountStatement-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  }
};

// Transit API methods
export const transitAPI = {
  // Get all items in transit
  getAll: (params = {}) => {
    // This combines data from invoices and purchase orders that are in transit
    return apiClient.get('/transit', params);
  },

  // Get transit tracking for specific item
  getTracking: (type, id) => {
    return apiClient.get(`/transit/${type}/${id}`);
  },

  // Update transit status
  updateStatus: (type, id, status) => {
    return apiClient.patch(`/transit/${type}/${id}/status`, { status });
  }
};

// Customers API methods
export const customersAPI = {
  // Get all customers with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/customers', params);
  },

  // Get customer by ID
  getById: (id) => {
    return apiClient.get(`/customers/${id}`);
  },

  // Create customer
  create: (customerData) => {
    return apiClient.post('/customers', customerData);
  },

  // Update customer
  update: (id, customerData) => {
    return apiClient.put(`/customers/${id}`, customerData);
  },

  // Delete customer
  delete: (id) => {
    return apiClient.delete(`/customers/${id}`);
  },

  // Search customers
  search: (query) => {
    return apiClient.get('/customers/search', { query });
  }
};

// Products API methods
export const productsAPI = {
  // Get all products with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/products', params);
  },

  // Get product by ID
  getById: (id) => {
    return apiClient.get(`/products/${id}`);
  },

  // Create product
  create: (productData) => {
    return apiClient.post('/products', productData);
  },

  // Update product
  update: (id, productData) => {
    return apiClient.put(`/products/${id}`, productData);
  },

  // Delete product
  delete: (id) => {
    return apiClient.delete(`/products/${id}`);
  },

  // Search products
  search: (query) => {
    return apiClient.get('/products/search', { query });
  },

  // Get product categories
  getCategories: () => {
    return apiClient.get('/products/categories');
  },

  // Get products by category
  getByCategory: (category) => {
    return apiClient.get(`/products/category/${category}`);
  }
};

// Quotations API methods
export const quotationsAPI = {
  // Get all quotations with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/quotations', params);
  },

  // Get quotation by ID
  getById: (id) => {
    return apiClient.get(`/quotations/${id}`);
  },

  // Create quotation
  create: (data) => {
    return apiClient.post('/quotations', data);
  },

  // Update quotation
  update: (id, data) => {
    return apiClient.put(`/quotations/${id}`, data);
  },

  // Delete quotation
  delete: (id) => {
    return apiClient.delete(`/quotations/${id}`);
  },

  // Update quotation status
  updateStatus: (id, status) => {
    return apiClient.patch(`/quotations/${id}/status`, { status });
  },

  // Convert quotation to invoice
  convertToInvoice: (id) => {
    return apiClient.post(`/quotations/${id}/convert-to-invoice`);
  },

  // Get next quotation number
  getNextNumber: () => {
    return apiClient.get('/quotations/number/next');
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const apiUrl = `${apiClient.baseURL}/quotations/${id}/pdf`;
    const response = await fetch(apiUrl, {
      headers: apiClient.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = `Quotation-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  }
};
