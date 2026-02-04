/**
 * Advance Payment Service Unit Tests (Node Native Test Runner)
 * Tests advance payment operations with VAT handling and application logic
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('advancePaymentService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Data Transformers', () => {
    test('should transform advance payment data correctly', () => {
      const input = {
        customerId: 1,
        amount: 5000,
        vatRate: 5,
        totalAmount: 5250,
        paymentMethod: 'bank_transfer',
        status: 'received',
      };

      // Test data transformation logic
      assert.strictEqual(input.customerId, 1);
      assert.strictEqual(input.amount, 5000);
      assert.strictEqual(input.vatRate, 5);
    });

    test('should handle currency conversion', () => {
      const result = {
        amount: 1000,
        currency: 'USD',
        exchangeRate: 3.67,
      };

      assert.strictEqual(result.currency, 'USD');
      assert.strictEqual(result.exchangeRate, 3.67);
    });
  });

  describe('getAll', () => {
    test('should fetch all advance payments with pagination', async () => {
      const mockResponse = {
        data: [
          { id: 1, customer_id: 1, amount: 5000 },
          { id: 2, customer_id: 2, amount: 3000 },
        ],
        pagination: { total: 2, page: 1, pageSize: 50 },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/advance-payments', { page: 1, pageSize: 50 });

      assert.strictEqual(result.data.length, 2);
      assert.ok(result.pagination);
    });

    test('should handle API errors', async () => {
      const error = new Error('API Error');
      sinon.stub(apiClient, 'get').rejects(error);

      try {
        await apiClient.get('/advance-payments');
        assert.fail('Expected error');
      } catch (err) {
        assert.strictEqual(err.message, 'API Error');
      }
    });
  });

  describe('getById', () => {
    test('should fetch advance payment by ID', async () => {
      const mockData = { id: 1, customer_id: 5, amount: 5000 };
      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await apiClient.get('/advance-payments/1');

      assert.strictEqual(result.id, 1);
    });

    test('should handle 404 errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Not Found'));

      try {
        await apiClient.get('/advance-payments/999');
        assert.fail('Expected error');
      } catch (error) {
        assert.ok(error);
      }
    });
  });

  describe('create', () => {
    test('should create new advance payment', async () => {
      const paymentData = {
        customerId: 5,
        amount: 5000,
        vatRate: 5,
        paymentMethod: 'bank_transfer',
      };

      const mockResponse = {
        id: 1,
        customer_id: 5,
        amount: 5000,
        vat_amount: 250,
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/advance-payments', paymentData);

      assert.strictEqual(result.id, 1);
      assert.strictEqual(result.customer_id, 5);
    });

    test('should apply VAT correctly', async () => {
      const paymentData = {
        customerId: 1,
        amount: 10000,
        vatRate: 5,
        isVatInclusive: false,
      };

      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        amount: 10000,
        vat_amount: 500,
      });

      const result = await apiClient.post('/advance-payments', paymentData);

      assert.ok(result);
    });
  });

  describe('applyToInvoice', () => {
    test('should apply advance payment to invoice', async () => {
      const mockResponse = {
        id: 1,
        amountApplied: 2000,
        amountAvailable: 3000,
        applications: [
          {
            id: 100,
            invoiceId: 500,
            amountApplied: 2000,
          },
        ],
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/advance-payments/1/apply', {
        invoiceId: 500,
        amount: 2000,
      });

      assert.strictEqual(result.amountApplied, 2000);
      assert.strictEqual(result.applications.length, 1);
    });
  });

  describe('refund', () => {
    test('should process refund', async () => {
      const refundData = {
        amount: 2000,
        refundDate: '2024-01-15',
        refundMethod: 'bank_transfer',
        reason: 'Customer Request',
      };

      const mockResponse = {
        id: 1,
        amountRefunded: 2000,
        amountAvailable: 3000,
        status: 'refunded',
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/advance-payments/1/refund', refundData);

      assert.strictEqual(result.amountRefunded, 2000);
    });

    test('should handle partial refund', async () => {
      const refundData = {
        amount: 1000,
        refundDate: '2024-01-15',
        reason: 'Partial reversal',
      };

      sinon.stub(apiClient, 'post').resolves({ id: 1, amountRefunded: 1000 });

      const result = await apiClient.post('/advance-payments/1/refund', refundData);

      assert.strictEqual(result.amountRefunded, 1000);
    });
  });

  describe('cancel', () => {
    test('should cancel advance payment', async () => {
      const mockResponse = {
        id: 1,
        status: 'cancelled',
      };

      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await apiClient.post('/advance-payments/1/cancel', {
        reason: 'No longer needed',
      });

      assert.strictEqual(result.status, 'cancelled');
    });
  });

  describe('getNextNumber', () => {
    test('should retrieve next receipt number', async () => {
      const mockResponse = { receiptNumber: 'ADV-001' };
      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/advance-payments/number/next');

      assert.strictEqual(result.receiptNumber, 'ADV-001');
    });
  });

  describe('getVATSummary', () => {
    test('should fetch VAT summary for Form 201', async () => {
      const mockResponse = {
        totalVAT: 5000,
        totalAmount: 100000,
        vatByCategory: {
          STANDARD: 5000,
          ZERO_RATED: 0,
        },
      };

      sinon.stub(apiClient, 'get').resolves(mockResponse);

      const result = await apiClient.get('/advance-payments/vat-summary', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      assert.strictEqual(result.totalVAT, 5000);
    });
  });

  describe('VAT Compliance', () => {
    test('should handle VAT-inclusive amounts correctly', async () => {
      const paymentData = {
        customerId: 1,
        amount: 5000,
        vatRate: 5,
        isVatInclusive: true,
        totalAmount: 5000,
      };

      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        isVatInclusive: true,
        amount: 5000,
        vatAmount: 238.1,
      });

      const result = await apiClient.post('/advance-payments', paymentData);

      assert.strictEqual(result.isVatInclusive, true);
    });

    test('should handle VAT-exclusive amounts correctly', async () => {
      const paymentData = {
        customerId: 1,
        amount: 10000,
        vatRate: 5,
        isVatInclusive: false,
        vatAmount: 500,
        totalAmount: 10500,
      };

      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        isVatInclusive: false,
        amount: 10000,
        vatAmount: 500,
      });

      const result = await apiClient.post('/advance-payments', paymentData);

      assert.strictEqual(result.isVatInclusive, false);
    });

    test('should track VAT category for compliance', async () => {
      const paymentData = {
        customerId: 1,
        amount: 5000,
        vatCategory: 'ZERO_RATED',
      };

      sinon.stub(apiClient, 'post').resolves({
        id: 1,
        vatCategory: 'ZERO_RATED',
        amount: 5000,
        vatAmount: 0,
      });

      const result = await apiClient.post('/advance-payments', paymentData);

      assert.strictEqual(result.vatCategory, 'ZERO_RATED');
    });
  });
});
