import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as supplierQuotationService from '../supplierQuotationService';
import { apiClient } from '../api';

vi.mock('../api');

describe('supplierQuotationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listSupplierQuotations', () => {
    it('should list supplier quotations with pagination', async () => {
      apiClient.get.mockResolvedValue({
        quotations: [{ id: 1, supplierReference: 'SQ001' }],
        pageInfo: { totalPages: 1, totalCount: 1 },
      });

      const result = await supplierQuotationService.listSupplierQuotations({ page: 1, limit: 50 });

      expect(result).toHaveProperty('quotations');
      expect(result).toHaveProperty('pageInfo');
      expect(Array.isArray(result.quotations)).toBe(true);
    });

    it('should return empty list on error', async () => {
      apiClient.get.mockRejectedValue(new Error('API Error'));

      const result = await supplierQuotationService.listSupplierQuotations();

      expect(result.quotations).toEqual([]);
      expect(result.pageInfo.totalPages).toBe(0);
    });
  });

  describe('getSupplierQuotation', () => {
    it('should fetch single supplier quotation', async () => {
      apiClient.get.mockResolvedValue({
        quotation: { id: 1, supplierReference: 'SQ001', status: 'draft' },
      });

      const result = await supplierQuotationService.getSupplierQuotation(1);

      expect(apiClient.get).toHaveBeenCalledWith('/supplier-quotations/1');
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('createSupplierQuotation', () => {
    it('should create new supplier quotation', async () => {
      const quotationData = {
        supplierId: 1,
        supplierReference: 'SQ001',
        quoteDate: '2024-01-15',
        items: [],
      };

      apiClient.post.mockResolvedValue({
        quotation: { id: 1, ...quotationData },
      });

      const result = await supplierQuotationService.createSupplierQuotation(quotationData);

      expect(apiClient.post).toHaveBeenCalledWith('/supplier-quotations', expect.any(Object));
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateSupplierQuotation', () => {
    it('should update existing quotation', async () => {
      const quotationData = { status: 'pending_review' };

      apiClient.put.mockResolvedValue({
        quotation: { id: 1, ...quotationData },
      });

      const result = await supplierQuotationService.updateSupplierQuotation(1, quotationData);

      expect(apiClient.put).toHaveBeenCalledWith('/supplier-quotations/1', expect.any(Object));
      expect(result).toHaveProperty('id');
    });
  });

  describe('deleteSupplierQuotation', () => {
    it('should delete quotation', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await supplierQuotationService.deleteSupplierQuotation(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/supplier-quotations/1');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('uploadAndExtractPDF', () => {
    it('should upload and extract PDF quotation', async () => {
      const file = new File(['content'], 'quote.pdf', { type: 'application/pdf' });

      apiClient.post.mockResolvedValue({
        success: true,
        quotation: { id: 1, extractionConfidence: 85 },
        extractionDetails: { itemsFound: 5 },
      });

      const result = await supplierQuotationService.uploadAndExtractPDF(file, { supplierId: 1 });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('quotation');
      expect(result).toHaveProperty('extractionDetails');
    });
  });

  describe('getUploadStatus', () => {
    it('should get upload processing status', async () => {
      apiClient.get.mockResolvedValue({
        status: 'completed',
        quotationId: 1,
      });

      const result = await supplierQuotationService.getUploadStatus('upload-123');

      expect(apiClient.get).toHaveBeenCalledWith('/supplier-quotations/uploads/upload-123/status');
      expect(result).toHaveProperty('status', 'completed');
    });
  });

  describe('approveSupplierQuotation', () => {
    it('should approve quotation', async () => {
      apiClient.post.mockResolvedValue({
        quotation: { id: 1, status: 'approved' },
      });

      const result = await supplierQuotationService.approveSupplierQuotation(1, 'Looks good');

      expect(apiClient.post).toHaveBeenCalledWith('/supplier-quotations/1/approve', {
        notes: 'Looks good',
      });
      expect(result).toHaveProperty('status', 'approved');
    });
  });

  describe('rejectSupplierQuotation', () => {
    it('should reject quotation', async () => {
      apiClient.post.mockResolvedValue({
        quotation: { id: 1, status: 'rejected' },
      });

      const result = await supplierQuotationService.rejectSupplierQuotation(1, 'Too expensive', 'High price');

      expect(apiClient.post).toHaveBeenCalledWith('/supplier-quotations/1/reject', {
        reason: 'Too expensive',
        notes: 'High price',
      });
      expect(result).toHaveProperty('status', 'rejected');
    });
  });

  describe('convertToPurchaseOrder', () => {
    it('should convert quotation to purchase order', async () => {
      apiClient.post.mockResolvedValue({
        success: true,
        purchaseOrderId: 100,
      });

      const result = await supplierQuotationService.convertToPurchaseOrder(1, {
        notes: 'Standard terms',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/supplier-quotations/1/convert-to-po', {
        notes: 'Standard terms',
        adjustments: undefined,
      });
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('listExtractionTemplates', () => {
    it('should list extraction templates', async () => {
      apiClient.get.mockResolvedValue({
        templates: [{ id: 1, templateName: 'Standard Format' }],
      });

      const result = await supplierQuotationService.listExtractionTemplates({ supplierId: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  describe('getExtractionTemplate', () => {
    it('should fetch extraction template', async () => {
      apiClient.get.mockResolvedValue({
        template: { id: 1, templateName: 'Standard Format' },
      });

      const result = await supplierQuotationService.getExtractionTemplate(1);

      expect(apiClient.get).toHaveBeenCalledWith('/supplier-quotations/templates/1');
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('createExtractionTemplate', () => {
    it('should create extraction template', async () => {
      const templateData = {
        supplierId: 1,
        templateName: 'New Template',
        headerPatterns: {},
      };

      apiClient.post.mockResolvedValue({
        template: { id: 1, ...templateData },
      });

      const result = await supplierQuotationService.createExtractionTemplate(templateData);

      expect(apiClient.post).toHaveBeenCalledWith('/supplier-quotations/templates', expect.any(Object));
      expect(result).toHaveProperty('id');
    });
  });

  describe('updateExtractionTemplate', () => {
    it('should update extraction template', async () => {
      const templateData = { templateName: 'Updated Template' };

      apiClient.put.mockResolvedValue({
        template: { id: 1, ...templateData },
      });

      const result = await supplierQuotationService.updateExtractionTemplate(1, templateData);

      expect(apiClient.put).toHaveBeenCalledWith('/supplier-quotations/templates/1', expect.any(Object));
      expect(result).toHaveProperty('id');
    });
  });

  describe('deleteExtractionTemplate', () => {
    it('should delete extraction template', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await supplierQuotationService.deleteExtractionTemplate(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/supplier-quotations/templates/1');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('getStatusColor', () => {
    it('should return color for status', () => {
      expect(supplierQuotationService.getStatusColor('draft')).toBe('gray');
      expect(supplierQuotationService.getStatusColor('approved')).toBe('green');
      expect(supplierQuotationService.getStatusColor('rejected')).toBe('red');
    });
  });

  describe('getStatusText', () => {
    it('should return display text for status', () => {
      expect(supplierQuotationService.getStatusText('draft')).toBe('Draft');
      expect(supplierQuotationService.getStatusText('approved')).toBe('Approved');
      expect(supplierQuotationService.getStatusText('rejected')).toBe('Rejected');
    });
  });

  describe('getConfidenceLevel', () => {
    it('should return confidence level based on percentage', () => {
      expect(supplierQuotationService.getConfidenceLevel(85)).toBe('high');
      expect(supplierQuotationService.getConfidenceLevel(65)).toBe('medium');
      expect(supplierQuotationService.getConfidenceLevel(40)).toBe('low');
    });
  });

  describe('getConfidenceColor', () => {
    it('should return color based on confidence', () => {
      expect(supplierQuotationService.getConfidenceColor(85)).toBe('green');
      expect(supplierQuotationService.getConfidenceColor(65)).toBe('yellow');
      expect(supplierQuotationService.getConfidenceColor(40)).toBe('red');
    });
  });
});
