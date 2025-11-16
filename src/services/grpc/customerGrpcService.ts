/**
 * Customer gRPC Service - Frontend Wrapper
 *
 * Type-safe customer operations using gRPC-Web
 */

import { CustomerServiceClient } from '../../grpc/generated/CustomerServiceClientPb';
import {
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ListCustomersRequest,
  SearchCustomersRequest,
  Customer
} from '../../grpc/generated/customer_pb';
import { IdRequest, PageRequest, Address } from '../../grpc/generated/common_pb';

const client = new CustomerServiceClient('http://localhost:8080');

function getAuthMetadata() {
  const token = localStorage.getItem('token');
  return {
    authorization: `Bearer ${token}`
  };
}

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
        throw new Error('Customer not found.');
      default:
        throw new Error(error.message || 'An error occurred.');
    }
  }

  throw new Error(error.message || 'Network error. Please try again.');
}

export const customerGrpcService = {
  /**
   * Create a new customer
   */
  async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    trn?: string;
    paymentTerms?: string;
    creditLimit?: number;
    notes?: string;
  }): Promise<Customer.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new CreateCustomerRequest();

      request.setName(data.name);
      if (data.email) request.setEmail(data.email);
      if (data.phone) request.setPhone(data.phone);
      if (data.trn) request.setTrn(data.trn);
      if (data.paymentTerms) request.setPaymentTerms(data.paymentTerms);
      if (data.creditLimit) request.setCreditLimit(data.creditLimit);
      if (data.notes) request.setNotes(data.notes);

      if (data.address) {
        const address = new Address();
        if (data.address.street) address.setStreet(data.address.street);
        if (data.address.city) address.setCity(data.address.city);
        if (data.address.state) address.setState(data.address.state);
        if (data.address.postalCode) address.setPostalCode(data.address.postalCode);
        if (data.address.country) address.setCountry(data.address.country);
        request.setAddress(address);
      }

      client.createCustomer(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Get customer by ID
   */
  async getCustomer(id: number): Promise<Customer.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(id);

      client.getCustomer(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * List customers with pagination
   */
  async listCustomers(params: {
    page?: number;
    limit?: number;
    status?: string;
    includeDeleted?: boolean;
  } = {}): Promise<{ customers: Customer.AsObject[]; pageInfo: any }> {
    return new Promise((resolve, reject) => {
      const request = new ListCustomersRequest();

      const pageRequest = new PageRequest();
      pageRequest.setPage(params.page || 1);
      pageRequest.setLimit(params.limit || 50);
      request.setPage(pageRequest);

      if (params.status) request.setStatus(params.status);
      if (params.includeDeleted) request.setIncludeDeleted(true);

      client.listCustomers(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve({
            customers: result.customersList,
            pageInfo: result.pageInfo
          });
        }
      });
    });
  },

  /**
   * Update customer
   */
  async updateCustomer(id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    trn?: string;
    paymentTerms?: string;
    creditLimit?: number;
    notes?: string;
  }): Promise<Customer.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new UpdateCustomerRequest();
      request.setId(id);

      const customerData = new CreateCustomerRequest();
      if (data.name) customerData.setName(data.name);
      if (data.email) customerData.setEmail(data.email);
      if (data.phone) customerData.setPhone(data.phone);
      if (data.trn) customerData.setTrn(data.trn);
      if (data.paymentTerms) customerData.setPaymentTerms(data.paymentTerms);
      if (data.creditLimit) customerData.setCreditLimit(data.creditLimit);
      if (data.notes) customerData.setNotes(data.notes);

      if (data.address) {
        const address = new Address();
        if (data.address.street) address.setStreet(data.address.street);
        if (data.address.city) address.setCity(data.address.city);
        if (data.address.state) address.setState(data.address.state);
        if (data.address.postalCode) address.setPostalCode(data.address.postalCode);
        if (data.address.country) address.setCountry(data.address.country);
        customerData.setAddress(address);
      }

      request.setCustomer(customerData);

      client.updateCustomer(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(id);

      client.deleteCustomer(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Search customers
   */
  async searchCustomers(query: string, page: number = 1, limit: number = 50): Promise<{ customers: Customer.AsObject[]; pageInfo: any }> {
    return new Promise((resolve, reject) => {
      const request = new SearchCustomersRequest();
      request.setQuery(query);

      const pageRequest = new PageRequest();
      pageRequest.setPage(page);
      pageRequest.setLimit(limit);
      request.setPage(pageRequest);

      client.searchCustomers(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve({
            customers: result.customersList,
            pageInfo: result.pageInfo
          });
        }
      });
    });
  }
};
