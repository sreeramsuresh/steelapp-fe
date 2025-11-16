/**
 * Invoice gRPC Service - Frontend Wrapper
 *
 * This wraps the auto-generated gRPC-Web client with user-friendly methods
 * Provides type-safe API calls with automatic validation
 */

import { InvoiceServiceClient } from '../../grpc/generated/InvoiceServiceClientPb';
import {
  CreateInvoiceRequest,
  GetInvoiceRequest,
  ListInvoicesRequest,
  UpdateInvoiceRequest,
  DeleteInvoiceRequest,
  RecordPaymentRequest,
  VoidPaymentRequest,
  GetPaymentHistoryRequest,
  UpdateInvoiceStatusRequest,
  GenerateInvoiceNumberRequest,
  GetInvoiceAnalyticsRequest,
  SearchInvoicesRequest,
  Invoice,
  InvoiceItem
} from '../../grpc/generated/invoice_pb';
import { IdRequest, PageRequest } from '../../grpc/generated/common_pb';

// gRPC-Web client pointing to Envoy proxy
const client = new InvoiceServiceClient('http://localhost:8080');

// Helper to get auth metadata from localStorage
function getAuthMetadata() {
  const token = localStorage.getItem('token');
  return {
    authorization: `Bearer ${token}`
  };
}

// Helper to convert gRPC error to user-friendly message
function handleGrpcError(error: any): never {
  console.error('gRPC error:', error);

  if (error.code) {
    switch (error.code) {
      case 16: // UNAUTHENTICATED
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      case 7: // PERMISSION_DENIED
        throw new Error('You don\'t have permission to perform this action.');
      case 5: // NOT_FOUND
        throw new Error('Resource not found.');
      case 9: // FAILED_PRECONDITION
        throw new Error(error.message || 'Precondition failed.');
      default:
        throw new Error(error.message || 'An error occurred.');
    }
  }

  throw new Error(error.message || 'Network error. Please try again.');
}

export const invoiceGrpcService = {
  /**
   * Create a new invoice
   */
  async createInvoice(data: {
    customerId: number;
    invoiceDate: Date;
    dueDate?: Date;
    items: Array<{
      productId?: number;
      name: string;
      quantity: number;
      rate: number;
      amount: number;
      vatRate?: number;
      vatAmount?: number;
    }>;
    notes?: string;
    terms?: string;
  }): Promise<Invoice.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new CreateInvoiceRequest();

      request.setCustomerId(data.customerId);
      request.setInvoiceDate({ seconds: Math.floor(data.invoiceDate.getTime() / 1000) });

      if (data.dueDate) {
        request.setDueDate({ seconds: Math.floor(data.dueDate.getTime() / 1000) });
      }

      // Add items
      data.items.forEach(item => {
        const invoiceItem = new InvoiceItem();
        if (item.productId) invoiceItem.setProductId(item.productId);
        invoiceItem.setName(item.name);
        invoiceItem.setQuantity(item.quantity);
        invoiceItem.setRate(item.rate);
        invoiceItem.setAmount(item.amount);
        if (item.vatRate) invoiceItem.setVatRate(item.vatRate);
        if (item.vatAmount) invoiceItem.setVatAmount(item.vatAmount);
        request.addItems(invoiceItem);
      });

      if (data.notes) request.setNotes(data.notes);
      if (data.terms) request.setTerms(data.terms);

      client.createInvoice(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Get invoice by ID
   */
  async getInvoice(id: number): Promise<Invoice.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(id);

      client.getInvoice(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * List invoices with pagination
   */
  async listInvoices(params: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: number;
  } = {}): Promise<{ invoices: Invoice.AsObject[]; pageInfo: any }> {
    return new Promise((resolve, reject) => {
      const request = new ListInvoicesRequest();

      const pageRequest = new PageRequest();
      pageRequest.setPage(params.page || 1);
      pageRequest.setLimit(params.limit || 50);
      request.setPage(pageRequest);

      if (params.status) request.setStatus(params.status);
      if (params.customerId) request.setCustomerId(params.customerId);

      client.listInvoices(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve({
            invoices: result.invoicesList,
            pageInfo: result.pageInfo
          });
        }
      });
    });
  },

  /**
   * Update invoice
   */
  async updateInvoice(id: number, data: {
    customerId?: number;
    invoiceDate?: Date;
    dueDate?: Date;
    items?: Array<{
      id?: number;
      productId?: number;
      name: string;
      quantity: number;
      rate: number;
      amount: number;
      vatRate?: number;
      vatAmount?: number;
    }>;
    notes?: string;
    terms?: string;
  }): Promise<Invoice.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new UpdateInvoiceRequest();
      request.setId(id);

      const invoiceData = new CreateInvoiceRequest();
      if (data.customerId) invoiceData.setCustomerId(data.customerId);
      if (data.invoiceDate) {
        invoiceData.setInvoiceDate({ seconds: Math.floor(data.invoiceDate.getTime() / 1000) });
      }
      if (data.dueDate) {
        invoiceData.setDueDate({ seconds: Math.floor(data.dueDate.getTime() / 1000) });
      }

      // Add items if provided
      if (data.items) {
        data.items.forEach(item => {
          const invoiceItem = new InvoiceItem();
          if (item.id) invoiceItem.setId(item.id);
          if (item.productId) invoiceItem.setProductId(item.productId);
          invoiceItem.setName(item.name);
          invoiceItem.setQuantity(item.quantity);
          invoiceItem.setRate(item.rate);
          invoiceItem.setAmount(item.amount);
          if (item.vatRate) invoiceItem.setVatRate(item.vatRate);
          if (item.vatAmount) invoiceItem.setVatAmount(item.vatAmount);
          invoiceData.addItems(invoiceItem);
        });
      }

      if (data.notes) invoiceData.setNotes(data.notes);
      if (data.terms) invoiceData.setTerms(data.terms);

      request.setInvoice(invoiceData);

      client.updateInvoice(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Delete invoice (soft delete)
   */
  async deleteInvoice(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(id);

      client.deleteInvoice(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(id: number, status: string): Promise<Invoice.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new UpdateInvoiceStatusRequest();
      request.setId(id);
      request.setStatus(status);

      client.updateInvoiceStatus(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Record payment
   */
  async recordPayment(data: {
    invoiceId: number;
    amount: number;
    paymentDate: Date;
    method: string;
    referenceNo?: string;
    notes?: string;
  }): Promise<Invoice.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new RecordPaymentRequest();
      request.setInvoiceId(data.invoiceId);
      request.setAmount(data.amount);
      request.setPaymentDate({ seconds: Math.floor(data.paymentDate.getTime() / 1000) });
      request.setMethod(data.method);
      if (data.referenceNo) request.setReferenceNo(data.referenceNo);
      if (data.notes) request.setNotes(data.notes);

      client.recordPayment(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Void payment
   */
  async voidPayment(invoiceId: number, paymentId: number, reason?: string): Promise<Invoice.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new VoidPaymentRequest();
      request.setInvoiceId(invoiceId);
      request.setPaymentId(paymentId);
      if (reason) request.setReason(reason);

      client.voidPayment(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(invoiceId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(invoiceId);

      client.getPaymentHistory(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve(result.paymentsList || []);
        }
      });
    });
  },

  /**
   * Generate invoice number
   */
  async generateInvoiceNumber(status?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = new GenerateInvoiceNumberRequest();
      if (status) request.setStatus(status);

      client.generateInvoiceNumber(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.getInvoiceNumber());
        }
      });
    });
  },

  /**
   * Get invoice analytics
   */
  async getInvoiceAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = new GetInvoiceAnalyticsRequest();

      if (params.startDate && params.endDate) {
        request.setDateRange({
          startDate: { seconds: Math.floor(params.startDate.getTime() / 1000) },
          endDate: { seconds: Math.floor(params.endDate.getTime() / 1000) }
        });
      }

      client.getInvoiceAnalytics(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Search invoices
   */
  async searchInvoices(query: string, page: number = 1, limit: number = 50): Promise<{ invoices: Invoice.AsObject[]; pageInfo: any }> {
    return new Promise((resolve, reject) => {
      const request = new SearchInvoicesRequest();
      request.setQuery(query);

      const pageRequest = new PageRequest();
      pageRequest.setPage(page);
      pageRequest.setLimit(limit);
      request.setPage(pageRequest);

      client.searchInvoices(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve({
            invoices: result.invoicesList,
            pageInfo: result.pageInfo
          });
        }
      });
    });
  }
};
