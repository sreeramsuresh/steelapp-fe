import { apiClient } from './api';

export const customerService = {
  async getCustomers(params = {}) {
    return apiClient.get('/customers', params);
  },

  async getCustomer(id) {
    return apiClient.get(`/customers/${id}`);
  },

  async createCustomer(customerData) {
    return apiClient.post('/customers', customerData);
  },

  async updateCustomer(id, customerData) {
    return apiClient.put(`/customers/${id}`, customerData);
  },

  async deleteCustomer(id, config = {}) {
    return apiClient.delete(`/customers/${id}`, config);
  },

  async archiveCustomer(id) {
    // Try PATCH /:id/status → PATCH /:id → PUT /:id (status-only) → PUT /:id (full payload)
    // This maximizes compatibility with differing backends
    // 1) Preferred: dedicated status endpoint
    try {
      return await apiClient.patch(`/customers/${id}/status`, {
        status: 'archived',
      });
    } catch (e1) {
      if (e1?.response?.status !== 404) throw e1;
    }

    // 2) Generic PATCH on resource
    try {
      return await apiClient.patch(`/customers/${id}`, { status: 'archived' });
    } catch (e2) {
      if (e2?.response?.status !== 404) throw e2;
    }

    // 3) Minimal PUT with status-only (some servers accept partial PUT)
    try {
      return await apiClient.put(`/customers/${id}`, { status: 'archived' });
    } catch (e3) {
      // 4) Full PUT with curated payload (only allowed fields)
      if (e3?.response?.status === 400 || e3?.response?.status === 404) {
        const current = await apiClient.get(`/customers/${id}`);
        const address =
          typeof current?.address === 'string' || current?.address == null
            ? current?.address || ''
            : current.address; // backend accepts object per UI usage

        const payload = {
          name: current?.name ?? '',
          email: current?.email ?? '',
          phone: current?.phone ?? '',
          address,
          company: current?.company ?? '',
          credit_limit: Number(current?.creditLimit) || 0,
          current_credit: Number(current?.currentCredit) || 0,
          status: 'archived',
          trn_number: current?.trnNumber ?? '',
          payment_terms: current?.paymentTerms ?? '',
          default_currency: current?.defaultCurrency ?? 'AED',
          contact_name: current?.contactName ?? '',
          contact_email: current?.contactEmail ?? '',
          contact_phone: current?.contactPhone ?? '',
        };

        return await apiClient.put(`/customers/${id}`, payload);
      }
      throw e3;
    }
  },

  async addContactHistory(customerId, contactData) {
    return apiClient.post(
      `/customers/${customerId}/contact-history`,
      contactData,
    );
  },

  async getCustomerAnalytics(customerId) {
    return apiClient.get(`/customers/${customerId}/analytics`);
  },

  async searchCustomers(searchTerm, filters = {}) {
    return apiClient.get('/customers', {
      search: searchTerm,
      ...filters,
    });
  },
};
