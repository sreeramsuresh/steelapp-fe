import { apiService } from './axiosApi';
import { normalizeProduct } from '../utils/fieldAccessors.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
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
    const data =
      options.body instanceof FormData
        ? options.body
        : typeof options.body === 'string'
          ? JSON.parse(options.body)
          : options.body;
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

  async delete(endpoint, config = {}) {
    return apiService.delete(endpoint, config);
  }
}

export const apiClient = new ApiClient();

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
    // eslint-disable-next-line no-console
    console.log('[invoicesAPI.downloadPDF] Starting PDF download for id:', id);

    const blob = await apiService.request({
      method: 'GET',
      url: `/invoices/${id}/pdf`,
      responseType: 'blob',
      timeout: 60000, // 60 seconds for PDF generation
    });

    // eslint-disable-next-line no-console
    console.log('[invoicesAPI.downloadPDF] Received blob:', {
      type: blob?.type,
      size: blob?.size,
      isBlob: blob instanceof Blob,
    });

    // Check if the response is actually a PDF or an error
    if (!blob || !(blob instanceof Blob)) {
       
      console.error('[invoicesAPI.downloadPDF] Response is not a blob:', blob);
      throw new Error('Invalid response from server - expected PDF blob');
    }

    // If the blob is JSON (error response), parse and throw
    if (blob.type === 'application/json') {
      const errorText = await blob.text();
       
      console.error(
        '[invoicesAPI.downloadPDF] Server returned error JSON:',
        errorText,
      );
      const errorData = JSON.parse(errorText);
      throw new Error(
        errorData.message || errorData.error || 'PDF generation failed',
      );
    }

    // Verify it's a PDF
    if (blob.type !== 'application/pdf' && blob.size < 1000) {
       
      console.warn(
        '[invoicesAPI.downloadPDF] Unexpected blob type:',
        blob.type,
      );
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    // eslint-disable-next-line no-console
    console.log('[invoicesAPI.downloadPDF] Created download URL:', downloadUrl);

    // Get invoice number for filename
    const invoice = await invoicesAPI.getById(id);
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    // eslint-disable-next-line no-console
    console.log('[invoicesAPI.downloadPDF] Downloading as:', filename);

    // Create download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    // eslint-disable-next-line no-console
    console.log('[invoicesAPI.downloadPDF] Download complete');
  },
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
  },
};

// Products API methods
export const productsAPI = {
  // Get all products with pagination and filters
  // GUARD #2: Automatically normalizes products (camelCase + contract assertion)
  getAll: async (params = {}) => {
    const response = await apiClient.get('/products', params);
    if (response.data?.products) {
      response.data.products = response.data.products.map(normalizeProduct);
    }
    return response;
  },

  // Get product by ID
  // GUARD #2: Automatically normalizes product (camelCase + contract assertion)
  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    if (response.data) {
      response.data = normalizeProduct(response.data);
    }
    return response;
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
  // GUARD #2: Automatically normalizes products (camelCase + contract assertion)
  search: async (query) => {
    const response = await apiClient.get('/products/search', { query });
    if (response.data?.products) {
      response.data.products = response.data.products.map(normalizeProduct);
    }
    return response;
  },

  // Get product categories
  getCategories: () => {
    return apiClient.get('/products/categories');
  },

  // Get products by category
  // GUARD #2: Automatically normalizes products (camelCase + contract assertion)
  getByCategory: async (category) => {
    const response = await apiClient.get(`/products/category/${category}`);
    if (response.data?.products) {
      response.data.products = response.data.products.map(normalizeProduct);
    }
    return response;
  },
};

// Suppliers API methods
// Export apiClient as api for import/export services
export const api = apiClient;

export const suppliersAPI = {
  // Get all suppliers with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/suppliers', params);
  },

  // Get supplier by ID
  getById: (id) => {
    return apiClient.get(`/suppliers/${id}`);
  },

  // Create supplier
  create: (supplierData) => {
    return apiClient.post('/suppliers', supplierData);
  },

  // Update supplier
  update: (id, supplierData) => {
    return apiClient.put(`/suppliers/${id}`, supplierData);
  },

  // Delete supplier
  delete: (id) => {
    return apiClient.delete(`/suppliers/${id}`);
  },

  // Search suppliers
  search: (query) => {
    return apiClient.get('/suppliers/search', { query });
  },

  // Get suppliers by category
  getByCategory: (category) => {
    return apiClient.get(`/suppliers/category/${category}`);
  },

  // Update supplier status
  updateStatus: (id, status) => {
    return apiClient.patch(`/suppliers/${id}/status`, { status });
  },

  // Get supplier analytics
  getAnalytics: (id) => {
    return apiClient.get(`/suppliers/${id}/analytics`);
  },

  // Get trade license status
  getTradeLicenseStatus: (id) => {
    return apiClient.get(`/suppliers/${id}/trade-license-status`);
  },

  // Get expiring trade licenses
  getExpiringTradeLicenses: (days = 30) => {
    return apiClient.get(`/suppliers/trade-license/expiring?days=${days}`);
  },

  // Add contact history
  addContactHistory: (id, historyData) => {
    return apiClient.post(`/suppliers/${id}/contact-history`, historyData);
  },

  // Upload suppliers from file
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/suppliers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Download upload template
  downloadTemplate: () => {
    return apiClient.get('/suppliers/upload/template', {
      responseType: 'blob',
    });
  },
};

// Payments API methods
export const paymentsAPI = {
  // Get all payments with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get('/payments', params);
  },

  // Get payment by ID
  getById: (id) => {
    return apiClient.get(`/payments/${id}`);
  },

  // Get payments by invoice ID
  getByInvoice: (invoiceId) => {
    return apiClient.get(`/payments/invoice/${invoiceId}`);
  },

  // Create payment
  create: (paymentData) => {
    return apiClient.post('/payments', paymentData);
  },

  // Void payment
  void: (id, voidReason) => {
    return apiClient.post(`/payments/${id}/void`, { voidReason });
  },

  // Restore payment
  restore: (id) => {
    return apiClient.post(`/payments/${id}/restore`);
  },
};

// Export apiClient as default for backward compatibility
export default apiClient;
