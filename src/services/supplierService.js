import { apiClient } from './api';

/**
 * Transform supplier data from server (snake_case) to frontend (camelCase)
 * Maps Supplier proto message fields
 */
export const transformSupplierFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    code: serverData.code || '',
    name: serverData.name || '',
    company: serverData.company || '',
    address: serverData.address, // JSONB object
    email: serverData.email || '',
    phone: serverData.phone || '',
    alternatePhone:
      serverData.alternatePhone || serverData.alternate_phone || '',
    contactName: serverData.contactName || serverData.contact_name || '',
    contactEmail: serverData.contactEmail || serverData.contact_email || '',
    contactPhone: serverData.contactPhone || serverData.contact_phone || '',
    website: serverData.website || '',
    vatNumber: serverData.vatNumber || serverData.vat_number || '',
    trnNumber: serverData.trnNumber || serverData.trn_number || '',
    tradeLicenseNumber:
      serverData.tradeLicenseNumber || serverData.trade_license_number || '',
    tradeLicenseExpiry:
      serverData.tradeLicenseExpiry || serverData.trade_license_expiry,
    supplierType: serverData.supplierType || serverData.supplier_type || '',
    category: serverData.category || '',
    country: serverData.country || '',
    paymentTerms: serverData.paymentTerms || serverData.payment_terms || 0,
    defaultCurrency:
      serverData.defaultCurrency || serverData.default_currency || 'AED',
    currentCredit:
      Number(serverData.currentCredit || serverData.current_credit) || 0,
    status: serverData.status || 'ACTIVE',
    notes: serverData.notes || '',
    // Financial & Business Info
    countryId: serverData.countryId || serverData.country_id,
    businessLicense:
      serverData.businessLicense || serverData.business_license || '',
    taxId: serverData.taxId || serverData.tax_id || '',
    bankDetails: serverData.bankDetails || serverData.bank_details || '',
    certifications: serverData.certifications || '',
    creditLimit: Number(serverData.creditLimit || serverData.credit_limit) || 0,
    // UAE VAT Compliance
    isDesignatedZone:
      serverData.isDesignatedZone || serverData.is_designated_zone || false,
    // Procurement Performance Metrics
    onTimeDeliveryPct:
      Number(serverData.onTimeDeliveryPct || serverData.on_time_delivery_pct) ||
      0,
    avgDeliveryVarianceDays:
      Number(
        serverData.avgDeliveryVarianceDays ||
          serverData.avg_delivery_variance_days,
      ) || 0,
    lateDeliveryCount:
      serverData.lateDeliveryCount || serverData.late_delivery_count || 0,
    totalDeliveryCount:
      serverData.totalDeliveryCount || serverData.total_delivery_count || 0,
    supplierScore:
      Number(serverData.supplierScore || serverData.supplier_score) || 0,
    supplierRating:
      serverData.supplierRating || serverData.supplier_rating || '',
    lastMetricUpdate:
      serverData.lastMetricUpdate || serverData.last_metric_update,
    // Aliases
    contactPerson: serverData.contactPerson || serverData.contact_person || '',
    score: Number(serverData.score) || 0,
    rating: serverData.rating || '',
    reason: serverData.reason || '',
    // v2 Procurement Classification
    supplierLocation:
      serverData.supplierLocation || serverData.supplier_location || '',
    isMill: serverData.isMill || serverData.is_mill || false,
    primaryCountry:
      serverData.primaryCountry || serverData.primary_country || '',
    typicalLeadTimeDays:
      serverData.typicalLeadTimeDays || serverData.typical_lead_time_days || 0,
    // Additional fields
    city: serverData.city || '',
    isActive: serverData.isActive || serverData.is_active || true,
    // Stainless Steel Industry Specifics
    mtcRequirement:
      serverData.mtcRequirement || serverData.mtc_requirement || false,
    materialGradeSpecialization:
      serverData.materialGradeSpecialization ||
      serverData.material_grade_specialization ||
      '',
    productFormCapabilities:
      serverData.productFormCapabilities ||
      serverData.product_form_capabilities ||
      '',
    minimumOrderQuantity:
      serverData.minimumOrderQuantity ||
      serverData.minimum_order_quantity ||
      '',
    qualityCertifications:
      serverData.qualityCertifications ||
      serverData.quality_certifications ||
      '',
    // Document File Paths
    tradeLicenseFilePath:
      serverData.tradeLicenseFilePath ||
      serverData.trade_license_file_path ||
      '',
    vatCertificateFilePath:
      serverData.vatCertificateFilePath ||
      serverData.vat_certificate_file_path ||
      '',
    isoCertificatesFilePath:
      serverData.isoCertificatesFilePath ||
      serverData.iso_certificates_file_path ||
      '',
    uploadedDocuments:
      serverData.uploadedDocuments || serverData.uploaded_documents || '',
    // Audit
    createdAt: serverData.createdAt || serverData.created_at,
    updatedAt: serverData.updatedAt || serverData.updated_at,
  };
};

const LS_KEY = 'steel-app-suppliers';

const ls = {
  all() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
      return [];
    }
  },
  save(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch {
      /* ignore storage errors */
    }
  },
  upsert(s) {
    const list = ls.all();
    const idx = list.findIndex((x) => x.id === s.id);
    if (idx >= 0) list[idx] = s;
    else list.push(s);
    ls.save(list);
    return s;
  },
  remove(id) {
    const list = ls.all().filter((x) => x.id !== id);
    ls.save(list);
  },
};

export const supplierService = {
  async getSuppliers(params = {}) {
    // Safeguard: some backends don't expose /suppliers. Avoid noisy 404 logs.
    const enabled =
      (import.meta.env.VITE_ENABLE_SUPPLIERS || '').toString().toLowerCase() ===
      'true';
    if (!enabled) {
      // Use local storage cache only
      return { suppliers: ls.all() };
    }
    try {
      const res = await apiClient.get('/suppliers', params);
      // Contract validation in axiosApi ensures: {suppliers: [], pageInfo: {...}}
      // Trust the contract - no fallbacks needed
      return res;
    } catch (_e) {
      return { suppliers: ls.all() };
    }
  },

  async getSupplier(id) {
    try {
      return await apiClient.get(`/suppliers/${id}`);
    } catch {
      return ls.all().find((s) => s.id === id);
    }
  },

  async createSupplier(data) {
    try {
      return await apiClient.post('/suppliers', data);
    } catch {
      const local = { ...data, id: data.id || `sup_${Date.now()}` };
      return ls.upsert(local);
    }
  },

  async updateSupplier(id, data) {
    try {
      return await apiClient.put(`/suppliers/${id}`, data);
    } catch {
      const updated = { ...data, id };
      return ls.upsert(updated);
    }
  },

  async deleteSupplier(id) {
    try {
      return await apiClient.delete(`/suppliers/${id}`);
    } catch {
      ls.remove(id);
      return { success: true };
    }
  },
};

export default supplierService;
