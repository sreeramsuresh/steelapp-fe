/**
 * Account Statement Service Unit Tests
 * ✅ Tests account statement CRUD operations
 * ✅ Tests PDF generation and downloads
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

import { apiClient } from '../api.js';
import { apiService } from '../axiosApi.js';
import { accountStatementService } from '../accountStatementService.js';

describe('accountStatementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('getAll', () => {
    test('should fetch all account statements', async () => {
      const mockStatements = [
        { id: 1, customerId: 101, startDate: '2024-01-01', balance: 50000 },
        { id: 2, customerId: 102, startDate: '2024-01-01', balance: 75000 },
      ];
      apiClient.get.mockResolvedValueOnce(mockStatements);

      const result = await accountStatementService.getAll({ page: 1 });

      expect(result).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/account-statements', { page: 1 });
    });

    test('should handle empty results', async () => {
      apiClient.get.mockResolvedValueOnce([]);

      const result = await accountStatementService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('should fetch statement by ID', async () => {
      const mockStatement = { id: 1, customerId: 101, balance: 50000 };
      apiClient.get.mockResolvedValueOnce(mockStatement);

      const result = await accountStatementService.getById(1);

      expect(result.id).toBe(1);
      expect(apiClient.get).toHaveBeenCalledWith('/account-statements/1');
    });

    test('should handle not found error', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Not found'));

      await expect(accountStatementService.getById(999)).rejects.toThrow('Not found');
    });
  });

  describe('create', () => {
    test('should create account statement', async () => {
      const data = { customerId: 101, startDate: '2024-02-01', endDate: '2024-02-29' };
      const mockResponse = { id: 3, ...data };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      const result = await accountStatementService.create(data);

      expect(result.id).toBe(3);
      expect(apiClient.post).toHaveBeenCalledWith('/account-statements', data);
    });
  });

  describe('update', () => {
    test('should update statement', async () => {
      const updates = { status: 'sent' };
      const mockResponse = { id: 1, ...updates };
      apiClient.put.mockResolvedValueOnce(mockResponse);

      const result = await accountStatementService.update(1, updates);

      expect(result.status).toBe('sent');
      expect(apiClient.put).toHaveBeenCalledWith('/account-statements/1', updates);
    });
  });

  describe('delete', () => {
    test('should delete statement', async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true });

      const result = await accountStatementService.delete(1);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/account-statements/1');
    });
  });

  describe('downloadPDF', () => {
    test('should download PDF', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.downloadPDF(1);

      expect(apiService.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/account-statements/1/pdf',
        responseType: 'blob',
      });

      const link = document.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.download).toContain('AccountStatement-1.pdf');
    });
  });

  describe('generateOnTheFly', () => {
    test('should generate statement on-the-fly', async () => {
      const params = { customerId: 101, startDate: '2024-02-01', endDate: '2024-02-29' };
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.generateOnTheFly(params);

      expect(apiService.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/account-statements/generate',
        data: params,
        responseType: 'blob',
      });

      const link = document.querySelector('a');
      expect(link.download).toContain('Statement-101');
    });

    test('should use generic filename without customerId', async () => {
      const params = { startDate: '2024-02-01', endDate: '2024-02-29' };
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await accountStatementService.generateOnTheFly(params);

      const link = document.querySelector('a');
      expect(link.download).toContain('Statement-Customer');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(accountStatementService.getAll()).rejects.toThrow('Network error');
    });

    test('should handle PDF generation errors', async () => {
      apiService.request.mockRejectedValueOnce(new Error('PDF failed'));

      await expect(accountStatementService.downloadPDF(1)).rejects.toThrow('PDF failed');
    });
  });
});
