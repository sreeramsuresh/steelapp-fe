/**
 * Account Statement Service Unit Tests
 * ✅ Tests account statement CRUD operations
 * ✅ Tests PDF generation and downloads
 * ✅ Tests on-the-fly statement generation
 * ✅ 100% coverage target for accountStatementService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../axiosApi.js', () => ({
  apiService: {
    request: vi.fn(),
  },
}));

import { accountStatementService } from '../accountStatementService';
import { apiClient } from '../api';
import { apiService } from '../axiosApi';

describe('accountStatementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('getAll', () => {
    test('should fetch all account statements with pagination', async () => {
      const mockStatements = [
        { id: 1, customerId: 101, startDate: '2024-01-01', endDate: '2024-01-31', balance: 50000 },
        { id: 2, customerId: 102, startDate: '2024-01-01', endDate: '2024-01-31', balance: 75000 },
      ];
      apiClient.get.mockResolvedValueOnce(mockStatements);

      const result = await accountStatementService.getAll({ page: 1, limit: 10 });

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/account-statements', { page: 1, limit: 10 });
    });

    test('should handle empty statements list', async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await accountStatementService.getAll();

      expect(result).toEqual([]);
    });

    test('should accept filter parameters', async () => {
      apiClient.get.mockResolvedValueOnce([]);

      await accountStatementService.getAll({ customerId: 101, status: 'paid' });

      expect(apiClient.get).toHaveBeenCalledWith('/account-statements', {
        customerId: 101,
        status: 'paid',
      });
    });
  });

  describe('getById', () => {
    test('should fetch single account statement by ID', async () => {
      const mockStatement = {
        id: 1,
        customerId: 101,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        openingBalance: 10000,
        closingBalance: 50000,
        transactions: [
          { date: '2024-01-05', description: 'Invoice INV-001', debit: 40000 },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockStatement);

      const result = await accountStatementService.getById(1);

      expect(result.id).toBe(1);
      expect(result.closingBalance).toBe(50000);
      expect(result.transactions).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith('/account-statements/1');
    });

    test('should handle statement not found', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Statement not found'));

      await expect(accountStatementService.getById(999)).rejects.toThrow('Statement not found');
    });
  });

  describe('create', () => {
    test('should create new account statement', async () => {
      const statementData = {
        customerId: 101,
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      };
      const mockResponse = { id: 3, ...statementData, status: 'created' };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await accountStatementService.create(statementData);

      expect(result.id).toBe(3);
      expect(apiClient.post).toHaveBeenCalledWith('/account-statements', statementData);
    });

    test('should validate required fields on create', async () => {
      const invalidData = { startDate: '2024-02-01' };
      apiClient.post.mockRejectedValueOnce(new Error('Missing customerId'));

      await expect(accountStatementService.create(invalidData)).rejects.toThrow('Missing customerId');
    });
  });

  describe('update', () => {
    test('should update existing account statement', async () => {
      const updates = { status: 'sent', sentDate: '2024-02-05' };
      const mockResponse = { id: 1, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await accountStatementService.update(1, updates);

      expect(result.status).toBe('sent');
      expect(apiClient.put).toHaveBeenCalledWith('/account-statements/1', updates);
    });

    test('should handle update not found', async () => {
      apiClient.put.mockRejectedValueOnce(new Error('Not found'));

      await expect(accountStatementService.update(999, {})).rejects.toThrow('Not found');
    });
  });

  describe('delete', () => {
    test('should delete account statement', async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await accountStatementService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/account-statements/1');
    });
  });

  describe('downloadPDF', () => {
    test('should download account statement as PDF', async () => {
      const mockBlob = new Blob(['test pdf content'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.downloadPDF(1);

      expect(apiService.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/account-statements/1/pdf',
        responseType: 'blob',
      });

      // Check that download was triggered
      const link = document.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.download).toContain('AccountStatement-1.pdf');
    });

    test('should handle PDF generation errors', async () => {
      apiService.request.mockRejectedValueOnce(new Error('PDF generation failed'));

      await expect(accountStatementService.downloadPDF(1)).rejects.toThrow('PDF generation failed');
    });
  });

  describe('generateOnTheFly', () => {
    test('should generate statement on-the-fly without saving', async () => {
      const statementParams = {
        customerId: 101,
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      };
      const mockBlob = new Blob(['generated pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.generateOnTheFly(statementParams);

      expect(apiService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/account-statements/generate',
        data: statementParams,
        responseType: 'blob',
      });

      // Check download was triggered with custom filename
      const link = document.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.download).toContain('2024-02-01');
    });

    test('should use customerId in filename', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.generateOnTheFly({
        customerId: 101,
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      });

      const link = document.querySelector('a');
      expect(link.download).toContain('101');
    });

    test('should use generic filename if no customerId', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.generateOnTheFly({
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      });

      const link = document.querySelector('a');
      expect(link.download).toContain('Customer');
    });

    test('should cleanup blob URL after download', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');

      await accountStatementService.generateOnTheFly({
        customerId: 101,
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      });

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(accountStatementService.getAll()).rejects.toThrow('Network error');
    });

    test('should propagate validation errors', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Validation failed'));

      await expect(
        accountStatementService.create({ customerId: 101 }),
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Response Handling', () => {
    test('should handle statement with multiple transactions', async () => {
      const mockStatement = {
        id: 1,
        customerId: 101,
        transactions: [
          { date: '2024-01-05', description: 'Invoice INV-001', debit: 40000 },
          { date: '2024-01-15', description: 'Payment', credit: 30000 },
          { date: '2024-01-25', description: 'Invoice INV-002', debit: 20000 },
        ],
      };
      apiClient.get.mockResolvedValueOnce(mockStatement);

      const result = await accountStatementService.getById(1);

      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].debit).toBe(40000);
      expect(result.transactions[1].credit).toBe(30000);
    });

    test('should handle statements with zero balance', async () => {
      const mockStatement = {
        id: 1,
        customerId: 101,
        openingBalance: 50000,
        closingBalance: 0,
      };
      apiClient.get.mockResolvedValueOnce(mockStatement);

      const result = await accountStatementService.getById(1);

      expect(result.closingBalance).toBe(0);
    });
  });
});
