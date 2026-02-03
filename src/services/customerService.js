import { apiClient } from "./api";

/**
 * Transform customer data from server (snake_case) to frontend (camelCase)
 * API Gateway handles auto-conversion, but this ensures explicit mapping
 */
export const transformCustomerFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    name: serverData.name || "",
    address: serverData.address, // JSONB object
    phone: serverData.phone || "",
    email: serverData.email || "",
    trn: serverData.trn || "",
    paymentTerms: serverData.paymentTerms || serverData.payment_terms || 0,
    creditLimit: parseFloat(serverData.creditLimit || serverData.credit_limit) || 0,
    currentBalance: parseFloat(serverData.currentBalance || serverData.current_balance) || 0,
    status: serverData.status || "ACTIVE",
    notes: serverData.notes || "",
    // Additional fields
    company: serverData.company || "",
    alternatePhone: serverData.alternatePhone || serverData.alternate_phone || "",
    contactPerson: serverData.contactPerson || serverData.contact_person || "",
    website: serverData.website || "",
    vatNumber: serverData.vatNumber || serverData.vat_number || "",
    panNumber: serverData.panNumber || serverData.pan_number || "",
    pricelistId: serverData.pricelistId || serverData.pricelist_id,
    // Compliance fields
    cinNumber: serverData.cinNumber || serverData.cin_number || "",
    tradeLicenseNumber: serverData.tradeLicenseNumber || serverData.trade_license_number || "",
    tradeLicenseExpiry: serverData.tradeLicenseExpiry || serverData.trade_license_expiry,
    isDesignatedZone: serverData.isDesignatedZone || serverData.is_designated_zone || false,
    // Credit management
    creditUtilizationPercentage:
      parseFloat(serverData.creditUtilizationPercentage || serverData.credit_utilization_percentage) || 0,
    paymentHistoryScore: parseFloat(serverData.paymentHistoryScore || serverData.payment_history_score) || 1.0,
    creditUsed: parseFloat(serverData.creditUsed || serverData.credit_used) || 0,
    creditAvailable: parseFloat(serverData.creditAvailable || serverData.credit_available) || 0,
    creditScore: parseFloat(serverData.creditScore || serverData.credit_score) || 0,
    creditGrade: serverData.creditGrade || serverData.credit_grade || "",
    paymentTermsDays: serverData.paymentTermsDays || serverData.payment_terms_days || 0,
    dsoDays: serverData.dsoDays || serverData.dso_days || 0,
    // Aging buckets
    agingCurrent: parseFloat(serverData.agingCurrent || serverData.aging_current) || 0,
    aging1To30: parseFloat(serverData.aging1To30 || serverData.aging_1_30) || 0,
    aging31To60: parseFloat(serverData.aging31To60 || serverData.aging_31_60) || 0,
    aging61To90: parseFloat(serverData.aging61To90 || serverData.aging_61_90) || 0,
    aging90Plus: parseFloat(serverData.aging90Plus || serverData.aging_90_plus) || 0,
    // Dates
    lastPaymentDate: serverData.lastPaymentDate || serverData.last_payment_date,
    creditReviewDate: serverData.creditReviewDate || serverData.credit_review_date,
    lastCreditUpdated: serverData.lastCreditUpdated || serverData.last_credit_updated,
    // Analytics
    customerCode: serverData.customerCode || serverData.customer_code || "",
    code: serverData.code || serverData.customerCode || serverData.customer_code || "",
    dsoValue: parseFloat(serverData.dsoValue || serverData.dso_value) || 0,
    creditUtilization: parseFloat(serverData.creditUtilization || serverData.credit_utilization) || 0,
    totalOutstanding: parseFloat(serverData.totalOutstanding || serverData.total_outstanding) || 0,
    trnNumber: serverData.trnNumber || serverData.trn_number || serverData.trn || "",
    currentCredit: parseFloat(serverData.currentCredit || serverData.current_credit) || 0,
    // Generated columns
    city: serverData.city || "",
    country: serverData.country || "",
    // Audit
    createdAt: serverData.createdAt || serverData.created_at,
    updatedAt: serverData.updatedAt || serverData.updated_at,
  };
};

export const customerService = {
  async getCustomers(params = {}) {
    return apiClient.get("/customers", params);
  },

  async getCustomer(id) {
    return apiClient.get(`/customers/${id}`);
  },

  async createCustomer(customerData) {
    return apiClient.post("/customers", customerData);
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
        status: "archived",
      });
    } catch (e1) {
      if (e1?.response?.status !== 404) throw e1;
    }

    // 2) Generic PATCH on resource
    try {
      return await apiClient.patch(`/customers/${id}`, { status: "archived" });
    } catch (e2) {
      if (e2?.response?.status !== 404) throw e2;
    }

    // 3) Minimal PUT with status-only (some servers accept partial PUT)
    try {
      return await apiClient.put(`/customers/${id}`, { status: "archived" });
    } catch (e3) {
      // 4) Full PUT with curated payload (only allowed fields)
      if (e3?.response?.status === 400 || e3?.response?.status === 404) {
        const current = await apiClient.get(`/customers/${id}`);
        const address =
          typeof current?.address === "string" || current?.address == null ? current?.address || "" : current.address; // backend accepts object per UI usage

        const payload = {
          name: current?.name ?? "",
          email: current?.email ?? "",
          phone: current?.phone ?? "",
          address,
          company: current?.company ?? "",
          credit_limit: Number(current?.creditLimit) || 0,
          current_credit: Number(current?.currentCredit) || 0,
          status: "archived",
          trn_number: current?.trnNumber ?? "",
          payment_terms: current?.paymentTerms ?? "",
          default_currency: current?.defaultCurrency ?? "AED",
          contact_name: current?.contactName ?? "",
          contact_email: current?.contactEmail ?? "",
          contact_phone: current?.contactPhone ?? "",
        };

        return await apiClient.put(`/customers/${id}`, payload);
      }
      throw e3;
    }
  },

  async addContactHistory(customerId, contactData) {
    return apiClient.post(`/customers/${customerId}/contact-history`, contactData);
  },

  async getCustomerAnalytics(customerId) {
    return apiClient.get(`/customers/${customerId}/analytics`);
  },

  async searchCustomers(searchTerm, filters = {}) {
    return apiClient.get("/customers", {
      search: searchTerm,
      ...filters,
    });
  },
};
