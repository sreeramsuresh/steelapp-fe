/**
 * Bank Reconciliation Service Unit Tests (Node Native Test Runner)
 * Tests bank ledger and statement management
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

describe('bankReconciliationService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getBankLedger', () => {
    test('should fetch bank ledger for account', async () => {
      const mockLedger = [
        {
          date: '2024-02-01',
          description: 'Opening balance',
          debit: 50000,
          credit: 0,
          balance: 50000,
        },
        {
          date: '2024-02-02',
          description: 'Deposit',
          debit: 10000,
          credit: 0,
          balance: 60000,
        },
      ];
      sinon.stub(apiClient, 'get').resolves({ data: mockLedger });

      const result = await apiClient.get('/bank-reconciliation/bank-ledger/BANK001', {
        params: { startDate: '2024-02-01', endDate: '2024-02-28' },
      });

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.data[1].balance, 60000);
    });
  });

  describe('getBankReconciliation', () => {
    test('should fetch bank reconciliation statement', async () => {
      const mockBRS = {
        id: 1,
        statementDate: '2024-02-29',
        bankBalance: 75000,
        bookBalance: 74500,
        difference: 500,
        reconciled: false,
      };
      sinon.stub(apiClient, 'get').resolves({ data: mockBRS });

      const result = await apiClient.get('/bank-reconciliation/brs/1');

      assert.strictEqual(result.data.statementDate, '2024-02-29');
      assert.strictEqual(result.data.difference, 500);
    });
  });

  describe('importBankStatement', () => {
    test('should import bank statement lines', async () => {
      const lines = [
        { date: '2024-02-01', description: 'Initial', amount: 50000 },
        { date: '2024-02-02', description: 'Deposit', amount: 10000 },
      ];
      const mockResponse = { imported: 2, errors: 0 };
      sinon.stub(apiClient, 'post').resolves({ data: mockResponse });

      const result = await apiClient.post('/bank-reconciliation/import-statement', {
        statementId: 1,
        lines,
      });

      assert.strictEqual(result.data.imported, 2);
    });
  });

  describe('matchBankLine', () => {
    test('should match bank statement line to journal entry', async () => {
      const mockResponse = { matched: true, lineId: 100, journalId: 500 };
      sinon.stub(apiClient, 'post').resolves({ data: mockResponse });

      const result = await apiClient.post('/bank-reconciliation/match', {
        lineId: 100,
        journalId: 500,
      });

      assert.strictEqual(result.data.matched, true);
    });
  });

  describe('reconcile', () => {
    test('should mark reconciliation as complete', async () => {
      const mockResponse = { id: 1, reconciled: true, reconciledAt: '2024-02-29T00:00:00Z' };
      sinon.stub(apiClient, 'put').resolves({ data: mockResponse });

      const result = await apiClient.put('/bank-reconciliation/1/reconcile', {});

      assert.strictEqual(result.data.reconciled, true);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await apiClient.get('/bank-reconciliation/bank-ledger/BANK001');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle API errors', async () => {
      sinon.stub(apiClient, 'post').rejects(new Error('Invalid bank statement'));

      try {
        await apiClient.post('/bank-reconciliation/import-statement', {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid bank statement');
      }
    });
  });
});
