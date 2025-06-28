const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  setAuthHeader(token) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  removeAuthHeader() {
    delete this.defaultHeaders['Authorization'];
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Handle FormData (for file uploads)
    if (config.body instanceof FormData) {
      // Remove Content-Type header for FormData, let browser set it with boundary
      delete config.headers['Content-Type'];
    } else if (config.body && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error Response for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      
      // Check if it's a connection error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please make sure the backend server is running on http://localhost:5001');
      }
      
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    // Filter out undefined values to prevent them from being sent as "undefined" strings
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => value !== undefined && value !== null && value !== '')
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
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
    const url = `${apiClient.baseURL}/delivery-notes/${id}/pdf`;
    const response = await fetch(url, {
      headers: apiClient.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
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
    const url = `${apiClient.baseURL}/invoices/${id}/pdf`;
    const response = await fetch(url, {
      headers: apiClient.defaultHeaders
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
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