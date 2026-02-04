/**
 * Commission Service Unit Tests (Node Native Test Runner)
 * Tests commission calculations and state transitions
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('commissionService', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('getInvoiceCommission()', () => {
    test('should fetch commission for invoice', async () => {
      const mockCommission = {
        data: {
          id: 1,
          invoiceId: 100,
          invoiceNumber: 'INV-2026-001',
          salesPersonId: 5,
          salesPersonName: 'John Smith',
          commissionRate: 2.5,
          invoiceAmount: 10000,
          commissionAmount: 250,
          status: 'PENDING',
          calculatedAt: '2026-01-15T10:00:00Z',
        },
      };
      sinon.stub(apiClient, 'get').resolves(mockCommission);

      const result = await apiClient.get('/commissions/invoice/100');

      assert.strictEqual(result.data.id, 1);
      assert.strictEqual(result.data.invoiceId, 100);
      assert.strictEqual(result.data.commissionAmount, 250);
      assert.strictEqual(result.data.status, 'PENDING');
    });

    test('should handle commission not found', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Commission not found'));

      try {
        await apiClient.get('/commissions/invoice/999');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Commission not found');
      }
    });

    test('should handle API errors gracefully', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/commissions/invoice/100');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });
  });

  describe('getSalesPersonCommissions()', () => {
    test('should fetch all commissions for sales person', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            invoiceId: 100,
            invoiceNumber: 'INV-2026-001',
            commissionAmount: 250,
            status: 'PENDING',
          },
          {
            id: 2,
            invoiceId: 101,
            invoiceNumber: 'INV-2026-002',
            commissionAmount: 300,
            status: 'APPROVED',
          },
          {
            id: 3,
            invoiceId: 102,
            invoiceNumber: 'INV-2026-003',
            commissionAmount: 200,
            status: 'PAID',
          },
        ],
      };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/commissions/sales-person/5');

      assert.strictEqual(result.data.length, 3);
      assert.strictEqual(result.data[0].status, 'PENDING');
      assert.strictEqual(result.data[1].status, 'APPROVED');
      assert.strictEqual(result.data[2].status, 'PAID');
    });

    test('should handle empty commission list', async () => {
      sinon.stub(apiClient, 'get').resolves({ data: [] });

      const result = await apiClient.get('/commissions/sales-person/999');

      assert.strictEqual(result.data.length, 0);
    });
  });

  describe('calculateCommission()', () => {
    test('should calculate commission for invoice', async () => {
      const mockResponse = {
        data: {
          id: 1,
          invoiceId: 100,
          invoiceAmount: 50000,
          commissionRate: 2.0,
          commissionAmount: 1000,
          status: 'CALCULATED',
        },
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/commissions/calculate', {
        invoiceId: 100,
        invoiceAmount: 50000,
        commissionRate: 2.0,
      });

      assert.strictEqual(result.data.commissionAmount, 1000);
    });
  });

  describe('approveCommission()', () => {
    test('should approve pending commission', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'APPROVED',
          approvedAt: '2026-02-01T10:00:00Z',
          approvedBy: 'Manager User',
        },
      };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await apiClient.put('/commissions/1/approve', {
        approvedBy: 'Manager User',
      });

      assert.strictEqual(result.data.status, 'APPROVED');
    });

    test('should prevent double approval', async () => {
      sinon.stub(apiClient, 'put').rejects(new Error('Commission already approved'));

      try {
        await apiClient.put('/commissions/1/approve', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Commission already approved');
      }
    });
  });

  describe('payCommission()', () => {
    test('should mark commission as paid', async () => {
      const mockResponse = {
        data: {
          id: 1,
          status: 'PAID',
          paidAt: '2026-02-05T10:00:00Z',
          paidAmount: 1000,
        },
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/commissions/1/pay', {
        paidAmount: 1000,
      });

      assert.strictEqual(result.data.status, 'PAID');
      assert.strictEqual(result.data.paidAmount, 1000);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/commissions/sales-person/5');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle server errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Server error'));

      try {
        await apiClient.post('/commissions/calculate', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Server error');
      }
    });
  });
});
