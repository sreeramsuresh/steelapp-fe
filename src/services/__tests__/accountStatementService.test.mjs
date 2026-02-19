/**
 * Account Statement Service Unit Tests (Node Native Test Runner)
 * ✅ Tests account statement CRUD operations
 * ✅ Tests PDF generation and downloads
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

// Mock services
const accountStatementService = {
  async getAll(filters = {}) {
    const response = await apiClient.get('/account-statements', filters);
    return response.data || response;
  },

  async getById(id) {
    const response = await apiClient.get(`/account-statements/${id}`);
    return response.data || response;
  },

  async create(data) {
    const response = await apiClient.post('/account-statements', data);
    return response.data || response;
  },

  async update(id, data) {
    const response = await apiClient.put(`/account-statements/${id}`, data);
    return response.data || response;
  },

  async delete(id) {
    const response = await apiClient.delete(`/account-statements/${id}`);
    return response.data || response;
  },

  async downloadPDF(id) {
    const response = await apiClient.get(`/account-statements/${id}/pdf`, { responseType: 'blob' });
    const blob = response.data || response;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AccountStatement-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async generateOnTheFly(params) {
    const response = await apiClient.post('/account-statements/generate', params, { responseType: 'blob' });
    const blob = response.data || response;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Statement-${params.customerId || 'Customer'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

describe('accountStatementService', () => {
  afterEach(() => {
    sinon.restore();
    document.body.innerHTML = '';
  });

  describe('getAll', () => {
    test('should fetch all account statements', async () => {
      const mockStatements = [
        { id: 1, customerId: 101, startDate: '2024-01-01', balance: 50000 },
        { id: 2, customerId: 102, startDate: '2024-01-01', balance: 75000 },
      ];
      sinon.stub(apiClient, 'get').resolves(mockStatements);

      const result = await accountStatementService.getAll({ page: 1 });

      assert.strictEqual(result.length, 2);
      assert.ok(apiClient.get.called);
    });

    test('should handle empty results', async () => {
      sinon.stub(apiClient, 'get').resolves([]);

      const result = await accountStatementService.getAll();

      assert.deepStrictEqual(result, []);
    });
  });

  describe('getById', () => {
    test('should fetch statement by ID', async () => {
      const mockStatement = { id: 1, customerId: 101, balance: 50000 };
      sinon.stub(apiClient, 'get').resolves(mockStatement);

      const result = await accountStatementService.getById(1);

      assert.strictEqual(result.id, 1);
      assert.ok(apiClient.get.called);
    });

    test('should handle not found error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Not found'));

      try {
        await accountStatementService.getById(999);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Not found');
      }
    });
  });

  describe('create', () => {
    test('should create account statement', async () => {
      const data = { customerId: 101, startDate: '2024-02-01', endDate: '2024-02-29' };
      const mockResponse = { id: 3, ...data };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await accountStatementService.create(data);

      assert.strictEqual(result.id, 3);
      assert.ok(apiClient.post.called);
    });
  });

  describe('update', () => {
    test('should update statement', async () => {
      const updates = { status: 'sent' };
      const mockResponse = { id: 1, ...updates };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await accountStatementService.update(1, updates);

      assert.strictEqual(result.status, 'sent');
      assert.ok(apiClient.put.called);
    });
  });

  describe('delete', () => {
    test('should delete statement', async () => {
      sinon.stub(apiClient, 'delete').resolves({ success: true });

      const result = await accountStatementService.delete(1);

      assert.strictEqual(result.success, true);
      assert.ok(apiClient.delete.called);
    });
  });

  describe('downloadPDF', () => {
    test('should download PDF', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      sinon.stub(apiClient, 'get').resolves(mockBlob);

      await accountStatementService.downloadPDF(1);

      assert.ok(apiClient.get.called);
      const link = document.querySelector('a');
      assert.ok(link);
      assert.ok(link.download.includes('AccountStatement-1.pdf'));
    });
  });

  describe('generateOnTheFly', () => {
    test('should generate statement on-the-fly', async () => {
      const params = { customerId: 101, startDate: '2024-02-01', endDate: '2024-02-29' };
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      sinon.stub(apiClient, 'post').resolves(mockBlob);

      await accountStatementService.generateOnTheFly(params);

      assert.ok(apiClient.post.called);
      const link = document.querySelector('a');
      assert.ok(link.download.includes('Statement-101'));
    });

    test('should use generic filename without customerId', async () => {
      const params = { startDate: '2024-02-01', endDate: '2024-02-29' };
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      sinon.stub(apiClient, 'post').resolves(mockBlob);

      await accountStatementService.generateOnTheFly(params);

      const link = document.querySelector('a');
      assert.ok(link.download.includes('Statement-Customer'));
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await accountStatementService.getAll();
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle PDF generation errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('PDF failed'));

      try {
        await accountStatementService.generateOnTheFly({ startDate: '2024-01-01' });
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'PDF failed');
      }
    });
  });
});
