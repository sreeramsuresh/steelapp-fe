import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import vatAmendmentService from '../vatAmendmentService';
import { apiClient } from '../api';

vi.mock('../api');

describe('vatAmendmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all VAT amendments with pagination', async () => {
      apiClient.get.mockResolvedValue({
        data: [
          { id: 1, amendmentNumber: 'VA001', status: 'draft' },
        ],
        pagination: { page: 1, totalPages: 1 },
      });

      const result = await vatAmendmentService.getAll({ page: 1, pageSize: 50 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle array response format', async () => {
      apiClient.get.mockResolvedValue([
        { id: 1, amendmentNumber: 'VA001' },
      ]);

      const result = await vatAmendmentService.getAll();

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeNull();
    });

    it('should handle items array response format', async () => {
      apiClient.get.mockResolvedValue({
        items: [{ id: 1, amendmentNumber: 'VA001' }],
        pagination: { page: 1 },
      });

      const result = await vatAmendmentService.getAll();

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).not.toBeNull();
    });
  });

  describe('getById', () => {
    it('should fetch single VAT amendment', async () => {
      const mockAmendment = {
        id: 1,
        amendmentNumber: 'VA001',
        status: 'draft',
        amendmentType: 'VOLUNTARY_DISCLOSURE',
      };

      apiClient.get.mockResolvedValue(mockAmendment);

      const result = await vatAmendmentService.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/1');
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('getByVatReturn', () => {
    it('should fetch amendments for a VAT return', async () => {
      apiClient.get.mockResolvedValue([
        { id: 1, amendmentNumber: 'VA001' },
      ]);

      const result = await vatAmendmentService.getByVatReturn(1);

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/by-return/1');
    });
  });

  describe('getPending', () => {
    it('should fetch pending amendments', async () => {
      apiClient.get.mockResolvedValue([
        { id: 1, amendmentNumber: 'VA001', status: 'pending_review' },
      ]);

      const result = await vatAmendmentService.getPending();

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/pending');
    });
  });

  describe('create', () => {
    it('should create new VAT amendment', async () => {
      const amendmentData = {
        amendmentType: 'VOLUNTARY_DISCLOSURE',
        originalVatReturnId: 1,
        status: 'draft',
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        amendmentNumber: 'VA001',
        ...amendmentData,
      });

      const result = await vatAmendmentService.create(amendmentData);

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments', expect.any(Object));
      expect(result).toHaveProperty('id');
    });
  });

  describe('update', () => {
    it('should update existing amendment', async () => {
      const amendmentData = { status: 'pending_review' };

      apiClient.put.mockResolvedValue({
        id: 1,
        ...amendmentData,
      });

      const result = await vatAmendmentService.update(1, amendmentData);

      expect(apiClient.put).toHaveBeenCalledWith('/vat-amendments/1', expect.any(Object));
      expect(result).toHaveProperty('id');
    });
  });

  describe('delete', () => {
    it('should delete amendment', async () => {
      apiClient.delete.mockResolvedValue({ success: true });

      const result = await vatAmendmentService.delete(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/vat-amendments/1');
      expect(result).toHaveProperty('success', true);
    });
  });

  describe('submit', () => {
    it('should submit amendment to FTA', async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: 'submitted',
      });

      const result = await vatAmendmentService.submit(1);

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments/1/submit');
      expect(result).toHaveProperty('status', 'submitted');
    });
  });

  describe('recordAcknowledgement', () => {
    it('should record FTA acknowledgement', async () => {
      const acknowledgement = {
        ftaReferenceNumber: 'FTA123',
        ftaResponseDate: '2024-01-15',
        actualPenalty: 5000,
      };

      apiClient.post.mockResolvedValue({
        id: 1,
        status: 'acknowledged',
      });

      const result = await vatAmendmentService.recordAcknowledgement(1, acknowledgement);

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments/1/acknowledge', acknowledgement);
      expect(result).toHaveProperty('status', 'acknowledged');
    });
  });

  describe('recordRejection', () => {
    it('should record FTA rejection', async () => {
      const rejection = { reason: 'Incomplete documentation' };

      apiClient.post.mockResolvedValue({
        id: 1,
        status: 'rejected_by_fta',
      });

      const result = await vatAmendmentService.recordRejection(1, rejection);

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments/1/reject', rejection);
      expect(result).toHaveProperty('status', 'rejected_by_fta');
    });
  });

  describe('cancel', () => {
    it('should cancel amendment', async () => {
      apiClient.post.mockResolvedValue({
        id: 1,
        status: 'cancelled',
      });

      const result = await vatAmendmentService.cancel(1, 'Changed decision');

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments/1/cancel', {
        cancellationReason: 'Changed decision',
      });
      expect(result).toHaveProperty('status', 'cancelled');
    });
  });

  describe('calculatePenalty', () => {
    it('should calculate penalty for amendment', async () => {
      apiClient.get.mockResolvedValue({
        estimatedPenalty: 5000,
        penaltyRate: 20,
      });

      const result = await vatAmendmentService.calculatePenalty(1);

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/1/calculate-penalty');
      expect(result).toHaveProperty('estimatedPenalty');
    });
  });

  describe('calculatePenaltyPreview', () => {
    it('should calculate penalty preview', async () => {
      const params = {
        vatAmount: 10000,
        originalFilingDate: '2024-01-01',
        discoveryDate: '2024-02-15',
      };

      apiClient.post.mockResolvedValue({
        estimatedPenalty: 2000,
      });

      const result = await vatAmendmentService.calculatePenaltyPreview(params);

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments/calculate-penalty-preview', params);
      expect(result).toHaveProperty('estimatedPenalty');
    });
  });

  describe('recordPenaltyPayment', () => {
    it('should record penalty payment', async () => {
      const paymentData = { amount: 5000, date: '2024-02-20' };

      apiClient.post.mockResolvedValue({
        id: 1,
        penaltyPaid: true,
      });

      const result = await vatAmendmentService.recordPenaltyPayment(1, paymentData);

      expect(apiClient.post).toHaveBeenCalledWith('/vat-amendments/1/pay-penalty', paymentData);
      expect(result).toHaveProperty('penaltyPaid', true);
    });
  });

  describe('getNextNumber', () => {
    it('should get next amendment number', async () => {
      apiClient.get.mockResolvedValue({
        amendmentNumber: 'VA025',
      });

      const result = await vatAmendmentService.getNextNumber();

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/number/next');
      expect(result).toHaveProperty('amendmentNumber', 'VA025');
    });
  });

  describe('getSummary', () => {
    it('should get amendment summary', async () => {
      const params = { startDate: '2024-01-01', endDate: '2024-12-31' };

      apiClient.get.mockResolvedValue({
        totalAmendments: 10,
        totalPenalties: 50000,
      });

      const result = await vatAmendmentService.getSummary(params);

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/summary', params);
      expect(result).toHaveProperty('totalAmendments');
    });
  });

  describe('getAuditTrail', () => {
    it('should get audit trail for amendment', async () => {
      apiClient.get.mockResolvedValue([
        { action: 'created', timestamp: '2024-01-15' },
      ]);

      const result = await vatAmendmentService.getAuditTrail(1);

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/1/audit-trail');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('downloadDisclosureForm', () => {
    it('should download voluntary disclosure form', async () => {
      const mockBlob = new Blob(['PDF content']);
      apiClient.get.mockResolvedValue(mockBlob);

      const result = await vatAmendmentService.downloadDisclosureForm(1);

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/1/disclosure-form', {
        responseType: 'blob',
      });
      expect(result).toBe(true);
    });
  });

  describe('search', () => {
    it('should search amendments', async () => {
      apiClient.get.mockResolvedValue({
        data: [{ id: 1, amendmentNumber: 'VA001' }],
      });

      const result = await vatAmendmentService.search('VA', { status: 'draft' });

      expect(Array.isArray(result)).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments', {
        search: 'VA',
        status: 'draft',
      });
    });
  });

  describe('checkAmendmentRequired', () => {
    it('should check if amendment is required', async () => {
      apiClient.get.mockResolvedValue({
        requiresAmendment: true,
        errorAmount: 15000,
        threshold: 10000,
      });

      const result = await vatAmendmentService.checkAmendmentRequired(1);

      expect(apiClient.get).toHaveBeenCalledWith('/vat-amendments/check-required/1');
      expect(result).toHaveProperty('requiresAmendment', true);
    });
  });
});
