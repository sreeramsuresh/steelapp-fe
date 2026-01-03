import { apiClient } from './api';

/**
 * Transform quotation from server to frontend format
 */
export const transformQuotationFromServer = (data) => {
  if (!data) return null;

  return {
    id: data.id,
    companyId: data.companyId,
    internalReference: data.internalReference,
    supplierReference: data.supplierReference,
    supplierId: data.supplierId,
    supplierName: data.supplierName,
    supplierDetails: data.supplierDetails,
    quoteDate: data.quoteDate,
    validityDate: data.validityDate,
    receivedDate: data.receivedDate,
    deliveryTerms: data.deliveryTerms,
    paymentTerms: data.paymentTerms,
    incoterms: data.incoterms,
    notes: data.notes,
    currency: data.currency || 'AED',
    exchangeRate: Number(data.exchangeRate) || 1,
    subtotal: Number(data.subtotal) || 0,
    discountType: data.discountType,
    discountPercentage: Number(data.discountPercentage) || 0,
    discountAmount: Number(data.discountAmount) || 0,
    shippingCharges: Number(data.shippingCharges) || 0,
    freightCharges: Number(data.freightCharges) || 0,
    otherCharges: Number(data.otherCharges) || 0,
    vatAmount: Number(data.vatAmount) || 0,
    total: Number(data.total) || 0,
    status: data.status || 'draft',
    statusNotes: data.statusNotes,
    pdfFilePath: data.pdfFilePath,
    pdfOriginalFilename: data.pdfOriginalFilename,
    pdfType: data.pdfType,
    extractionMethod: data.extractionMethod,
    extractionTemplateId: data.extractionTemplateId,
    extractionConfidence: Number(data.extractionConfidence) || 0,
    extractionWarnings: data.extractionWarnings || [],
    purchaseOrderId: data.purchaseOrderId,
    convertedAt: data.convertedAt,
    convertedBy: data.convertedBy,
    approvedAt: data.approvedAt,
    approvedBy: data.approvedBy,
    rejectedAt: data.rejectedAt,
    rejectedBy: data.rejectedBy,
    rejectionReason: data.rejectionReason,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    items: (data.items || []).map(transformItemFromServer),
  };
};

/**
 * Transform quotation item from server
 */
export const transformItemFromServer = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    quotationId: item.quotationId,
    lineNumber: item.lineNumber || 1,
    productId: item.productId,
    productMatched: item.productMatched || false,
    productMatchConfidence: Number(item.productMatchConfidence) || 0,
    description: item.description || '',
    specifications: item.specifications || '',
    grade: item.grade || '',
    finish: item.finish || '',
    thickness: item.thickness || '',
    width: item.width || '',
    length: item.length || '',
    size: item.size || '',
    dimensions: item.dimensions || '',
    originCountry: item.originCountry || '',
    quantity: Number(item.quantity) || 0,
    unit: item.unit || 'KG',
    unitPrice: Number(item.unitPrice) || 0,
    amount: Number(item.amount) || 0,
    vatRate: Number(item.vatRate) || 5,
    vatAmount: Number(item.vatAmount) || 0,
    netAmount: Number(item.netAmount) || 0,
    extractionConfidence: Number(item.extractionConfidence) || 0,
    originalText: item.originalText || '',
    extractionWarnings: item.extractionWarnings || [],
    userCorrected: item.userCorrected || false,
    correctionNotes: item.correctionNotes || '',
  };
};

/**
 * Transform extraction template from server
 */
export const transformTemplateFromServer = (template) => {
  if (!template) return null;

  return {
    id: template.id,
    companyId: template.companyId,
    supplierId: template.supplierId,
    templateName: template.templateName,
    description: template.description,
    headerPatterns: template.headerPatterns || {},
    lineItemPatterns: template.lineItemPatterns || {},
    summaryPatterns: template.summaryPatterns || {},
    fieldMappings: template.fieldMappings || {},
    dateFormat: template.dateFormat || 'DD/MM/YYYY',
    currencyDefault: template.currencyDefault || 'AED',
    confidenceThreshold: Number(template.confidenceThreshold) || 70,
    isActive: template.isActive !== false,
    isDefault: template.isDefault || false,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
};

/**
 * Transform quotation to server format for create/update
 */
export const transformQuotationToServer = (data) => {
  return {
    supplierId: data.supplierId,
    supplierReference: data.supplierReference,
    quoteDate: data.quoteDate,
    validityDate: data.validityDate,
    receivedDate: data.receivedDate,
    deliveryTerms: data.deliveryTerms,
    paymentTerms: data.paymentTerms,
    incoterms: data.incoterms,
    notes: data.notes,
    currency: data.currency || 'AED',
    exchangeRate: data.exchangeRate || 1,
    discountType: data.discountType,
    discountPercentage: data.discountPercentage,
    discountAmount: data.discountAmount,
    shippingCharges: data.shippingCharges,
    freightCharges: data.freightCharges,
    otherCharges: data.otherCharges,
    items: (data.items || []).map((item) => ({
      id: item.id,
      productId: item.productId,
      description: item.description,
      specifications: item.specifications,
      grade: item.grade,
      finish: item.finish,
      thickness: item.thickness,
      width: item.width,
      length: item.length,
      size: item.size,
      dimensions: item.dimensions,
      originCountry: item.originCountry,
      quantity: item.quantity,
      unit: item.unit || 'KG',
      unitPrice: item.unitPrice,
      vatRate: item.vatRate || 5,
      userCorrected: item.userCorrected,
      correctionNotes: item.correctionNotes,
    })),
  };
};

// =====================================================
// QUOTATION CRUD
// =====================================================

/**
 * List supplier quotations with filters
 */
export const listSupplierQuotations = async (params = {}) => {
  const {
    page = 1,
    limit = 50,
    status,
    supplierId,
    fromDate,
    toDate,
    search,
    includeDeleted,
  } = params;

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status) queryParams.set('status', status);
  if (supplierId) queryParams.set('supplierId', String(supplierId));
  if (fromDate) queryParams.set('fromDate', fromDate);
  if (toDate) queryParams.set('toDate', toDate);
  if (search) queryParams.set('search', search);
  if (includeDeleted) queryParams.set('includeDeleted', 'true');

  try {
    const response = await apiClient.get(
      `/supplier-quotations?${queryParams.toString()}`,
    );

    return {
      quotations: (response?.quotations || []).map(
        transformQuotationFromServer,
      ),
      pageInfo: response?.pageInfo || { totalPages: 0, totalCount: 0 },
    };
  } catch (error) {
    console.error('Failed to load supplier quotations:', error);
    // Return empty result on error to prevent UI crash
    return {
      quotations: [],
      pageInfo: { totalPages: 0, totalCount: 0 },
    };
  }
};

/**
 * Get single supplier quotation by ID
 */
export const getSupplierQuotation = async (id) => {
  const response = await apiClient.get(`/supplier-quotations/${id}`);
  return transformQuotationFromServer(response.quotation);
};

/**
 * Create supplier quotation (manual entry)
 */
export const createSupplierQuotation = async (data) => {
  const response = await apiClient.post(
    '/supplier-quotations',
    transformQuotationToServer(data),
  );
  return transformQuotationFromServer(response.quotation);
};

/**
 * Update supplier quotation
 */
export const updateSupplierQuotation = async (id, data) => {
  const response = await apiClient.put(
    `/supplier-quotations/${id}`,
    transformQuotationToServer(data),
  );
  return transformQuotationFromServer(response.quotation);
};

/**
 * Delete supplier quotation
 */
export const deleteSupplierQuotation = async (id) => {
  const response = await apiClient.delete(`/supplier-quotations/${id}`);
  return response;
};

// =====================================================
// PDF UPLOAD & EXTRACTION
// =====================================================

/**
 * Upload PDF and extract quotation data
 */
export const uploadAndExtractPDF = async (file, options = {}) => {
  const { supplierId, templateId } = options;

  const formData = new FormData();
  formData.append('pdf', file);
  if (supplierId) formData.append('supplierId', String(supplierId));
  if (templateId) formData.append('templateId', String(templateId));

  const response = await apiClient.post(
    '/supplier-quotations/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return {
    success: response.success,
    quotation: transformQuotationFromServer(response.quotation),
    extractionDetails: response.extractionDetails,
  };
};

/**
 * Get upload processing status
 */
export const getUploadStatus = async (uploadId) => {
  const response = await apiClient.get(
    `/supplier-quotations/uploads/${uploadId}/status`,
  );
  return response;
};

// =====================================================
// STATUS MANAGEMENT
// =====================================================

/**
 * Approve supplier quotation
 */
export const approveSupplierQuotation = async (id, notes = '') => {
  const response = await apiClient.post(`/supplier-quotations/${id}/approve`, {
    notes,
  });
  return transformQuotationFromServer(response.quotation);
};

/**
 * Reject supplier quotation
 */
export const rejectSupplierQuotation = async (id, reason, notes = '') => {
  const response = await apiClient.post(`/supplier-quotations/${id}/reject`, {
    reason,
    notes,
  });
  return transformQuotationFromServer(response.quotation);
};

// =====================================================
// CONVERT TO PURCHASE ORDER
// =====================================================

/**
 * Convert quotation to purchase order
 */
export const convertToPurchaseOrder = async (id, options = {}) => {
  const { notes, adjustments } = options;

  const response = await apiClient.post(
    `/supplier-quotations/${id}/convert-to-po`,
    { notes, adjustments },
  );
  return response;
};

// =====================================================
// EXTRACTION TEMPLATES
// =====================================================

/**
 * List extraction templates
 */
export const listExtractionTemplates = async (params = {}) => {
  const { supplierId, includeInactive } = params;

  const queryParams = new URLSearchParams();
  if (supplierId) queryParams.set('supplierId', String(supplierId));
  if (includeInactive) queryParams.set('includeInactive', 'true');

  const response = await apiClient.get(
    `/supplier-quotations/templates?${queryParams.toString()}`,
  );

  return (response.templates || []).map(transformTemplateFromServer);
};

/**
 * Get single extraction template
 */
export const getExtractionTemplate = async (id) => {
  const response = await apiClient.get(`/supplier-quotations/templates/${id}`);
  return transformTemplateFromServer(response.template);
};

/**
 * Create extraction template
 */
export const createExtractionTemplate = async (data) => {
  const response = await apiClient.post('/supplier-quotations/templates', {
    supplierId: data.supplierId,
    templateName: data.templateName,
    description: data.description,
    headerPatterns: data.headerPatterns,
    lineItemPatterns: data.lineItemPatterns,
    summaryPatterns: data.summaryPatterns,
    fieldMappings: data.fieldMappings,
    dateFormat: data.dateFormat,
    currencyDefault: data.currencyDefault,
    confidenceThreshold: data.confidenceThreshold,
    isDefault: data.isDefault,
  });
  return transformTemplateFromServer(response.template);
};

/**
 * Update extraction template
 */
export const updateExtractionTemplate = async (id, data) => {
  const response = await apiClient.put(`/supplier-quotations/templates/${id}`, {
    supplierId: data.supplierId,
    templateName: data.templateName,
    description: data.description,
    headerPatterns: data.headerPatterns,
    lineItemPatterns: data.lineItemPatterns,
    summaryPatterns: data.summaryPatterns,
    fieldMappings: data.fieldMappings,
    dateFormat: data.dateFormat,
    currencyDefault: data.currencyDefault,
    confidenceThreshold: data.confidenceThreshold,
    isActive: data.isActive,
    isDefault: data.isDefault,
  });
  return transformTemplateFromServer(response.template);
};

/**
 * Delete extraction template
 */
export const deleteExtractionTemplate = async (id) => {
  const response = await apiClient.delete(
    `/supplier-quotations/templates/${id}`,
  );
  return response;
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    draft: 'gray',
    pending_review: 'yellow',
    approved: 'green',
    rejected: 'red',
    expired: 'orange',
    converted_to_po: 'blue',
    cancelled: 'gray',
  };
  return colors[status] || 'gray';
};

/**
 * Get status display text
 */
export const getStatusText = (status) => {
  const texts = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    expired: 'Expired',
    converted_to_po: 'Converted to PO',
    cancelled: 'Cancelled',
  };
  return texts[status] || status;
};

/**
 * Get confidence level (low/medium/high)
 */
export const getConfidenceLevel = (confidence) => {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
};

/**
 * Get confidence color
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 80) return 'green';
  if (confidence >= 50) return 'yellow';
  return 'red';
};

export default {
  // CRUD
  listSupplierQuotations,
  getSupplierQuotation,
  createSupplierQuotation,
  updateSupplierQuotation,
  deleteSupplierQuotation,
  // PDF
  uploadAndExtractPDF,
  getUploadStatus,
  // Status
  approveSupplierQuotation,
  rejectSupplierQuotation,
  // Conversion
  convertToPurchaseOrder,
  // Templates
  listExtractionTemplates,
  getExtractionTemplate,
  createExtractionTemplate,
  updateExtractionTemplate,
  deleteExtractionTemplate,
  // Helpers
  getStatusColor,
  getStatusText,
  getConfidenceLevel,
  getConfidenceColor,
  // Transformers
  transformQuotationFromServer,
  transformItemFromServer,
  transformTemplateFromServer,
  transformQuotationToServer,
};
