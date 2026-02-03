import { apiClient } from "./api";
import { apiService } from "./axiosApi"; // Only for downloadPDF

/**
 * Transform quotation item data from server (snake_case) to frontend (camelCase)
 * Maps QuotationItem proto message fields
 */
export const transformQuotationItemFromServer = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    productId: item.productId || item.product_id,
    name: item.name || "",
    specification: item.specification || "",
    description: item.description || "",
    hsnCode: item.hsnCode || item.hsn_code || "",
    unit: item.unit || "",
    quantity: Number(item.quantity) || 0,
    rate: Number(item.rate) || 0,
    discount: Number(item.discount) || 0,
    discountType: item.discountType || item.discount_type || "",
    taxableAmount: Number(item.taxableAmount || item.taxable_amount) || 0,
    vatRate: Number(item.vatRate || item.vat_rate) || 0,
    amount: Number(item.amount) || 0,
    netAmount: Number(item.netAmount || item.net_amount) || 0,
    // Pricing basis fields
    pricingBasis: item.pricingBasis || item.pricing_basis || "",
    unitWeightKg: Number(item.unitWeightKg || item.unit_weight_kg) || 0,
    theoreticalWeightKg: Number(item.theoreticalWeightKg || item.theoretical_weight_kg) || 0,
    // Steel industry specific
    stockReserved: item.stockReserved || item.stock_reserved || false,
    reservationExpiry: item.reservationExpiry || item.reservation_expiry || "",
    estimatedLeadTimeDays: item.estimatedLeadTimeDays || item.estimated_lead_time_days || 0,
    deliverySchedule: item.deliverySchedule || item.delivery_schedule || "",
    alternativeProducts: item.alternativeProducts || item.alternative_products || "",
  };
};

/**
 * Normalize quotation status from gRPC enum to frontend string
 * Maps Protocol Buffer enum constants to lowercase frontend values
 */
const normalizeQuotationStatus = (rawStatus) => {
  // Handle null/undefined/empty
  if (!rawStatus || rawStatus === "") {
    return "draft";
  }

  // If already normalized (lowercase), return as-is
  if (rawStatus === rawStatus.toLowerCase()) {
    return rawStatus;
  }

  // Map gRPC enum constants to frontend strings
  const statusMap = {
    STATUS_DRAFT: "draft",
    STATUS_UNSPECIFIED: "draft",
    STATUS_SENT: "sent",
    STATUS_ACCEPTED: "accepted",
    STATUS_REJECTED: "rejected",
    STATUS_EXPIRED: "expired",
    STATUS_CONVERTED: "converted",
  };

  return statusMap[rawStatus] || "draft";
};

/**
 * Transform quotation data from server (snake_case) to frontend (camelCase)
 * Maps Quotation proto message fields
 */
export const transformQuotationFromServer = (serverData) => {
  if (!serverData) return null;

  return {
    id: serverData.id,
    companyId: serverData.companyId || serverData.company_id,
    quotationNumber: serverData.quotationNumber || serverData.quotation_number || "",
    customerId: serverData.customerId || serverData.customer_id,
    customerDetails: serverData.customerDetails || serverData.customer_details || {},
    quotationDate: serverData.quotationDate || serverData.quotation_date || "",
    validUntil: serverData.validUntil || serverData.valid_until || "",
    deliveryTerms: serverData.deliveryTerms || serverData.delivery_terms || "",
    paymentTerms: serverData.paymentTerms || serverData.payment_terms || "",
    notes: serverData.notes || "",
    termsAndConditions: serverData.termsAndConditions || serverData.terms_and_conditions || "",
    subtotal: Number(serverData.subtotal) || 0,
    vatAmount: Number(serverData.vatAmount || serverData.vat_amount) || 0,
    totalQuantity: Number(serverData.totalQuantity || serverData.total_quantity) || 0,
    totalWeight: Number(serverData.totalWeight || serverData.total_weight) || 0,
    otherCharges: Number(serverData.otherCharges || serverData.other_charges) || 0,
    total: (() => {
      const serverTotal = Number(serverData.total) || 0;
      if (serverTotal > 0) return serverTotal;

      // If total is 0/missing, calculate from components
      const subtotal = Number(serverData.subtotal) || 0;
      const packing = Number(serverData.packingCharges || serverData.packing_charges) || 0;
      const freight = Number(serverData.freightCharges || serverData.freight_charges) || 0;
      const insurance = Number(serverData.insuranceCharges || serverData.insurance_charges) || 0;
      const loading = Number(serverData.loadingCharges || serverData.loading_charges) || 0;
      const other = Number(serverData.otherCharges || serverData.other_charges) || 0;
      const vat = Number(serverData.vatAmount || serverData.vat_amount) || 0;

      const calculated = subtotal + packing + freight + insurance + loading + other + vat;
      return Math.max(calculated, 0);
    })(),
    status: normalizeQuotationStatus(serverData.status),
    convertedToInvoice: serverData.convertedToInvoice || serverData.converted_to_invoice || false,
    invoiceId: serverData.invoiceId || serverData.invoice_id,
    items: (serverData.items || []).map(transformQuotationItemFromServer),
    // Additional fields
    createdAt: serverData.createdAt || serverData.created_at,
    warehouseName: serverData.warehouseName || serverData.warehouse_name || "",
    packingCharges: Number(serverData.packingCharges || serverData.packing_charges) || 0,
    freightCharges: Number(serverData.freightCharges || serverData.freight_charges) || 0,
    insuranceCharges: Number(serverData.insuranceCharges || serverData.insurance_charges) || 0,
    loadingCharges: Number(serverData.loadingCharges || serverData.loading_charges) || 0,
    // Multi-currency and discount fields
    warehouseId: serverData.warehouseId || serverData.warehouse_id,
    currency: serverData.currency || "AED",
    discountType: serverData.discountType || serverData.discount_type || "",
    discountPercentage: Number(serverData.discountPercentage || serverData.discount_percentage) || 0,
    discountAmount: Number(serverData.discountAmount || serverData.discount_amount) || 0,
    customerPurchaseOrderNumber:
      serverData.customerPurchaseOrderNumber || serverData.customer_purchase_order_number || "",
    customerPurchaseOrderDate: serverData.customerPurchaseOrderDate || serverData.customer_purchase_order_date || "",
    exchangeRate: Number(serverData.exchangeRate || serverData.exchange_rate) || 1.0,
    // Steel industry specific
    priceValidityCondition: serverData.priceValidityCondition || serverData.price_validity_condition || "",
    volumeDiscountTiers: serverData.volumeDiscountTiers || serverData.volume_discount_tiers || "",
    // Audit
    updatedAt: serverData.updatedAt || serverData.updated_at,
  };
};

export const quotationService = {
  // Get all quotations with pagination and filters
  getAll: (params = {}) => {
    return apiClient.get("/quotations", params);
  },

  // Get quotation by ID
  getById: (id) => {
    return apiClient.get(`/quotations/${id}`);
  },

  // Create quotation
  create: (data) => {
    return apiClient.post("/quotations", data);
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
    return apiClient.get("/quotations/number/next");
  },

  // Generate and download PDF
  downloadPDF: async (id) => {
    const blob = await apiService.request({
      method: "GET",
      url: `/quotations/${id}/pdf`,
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = `Quotation-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  },
};
