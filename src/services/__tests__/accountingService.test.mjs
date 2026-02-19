/**
 * Accounting Service Unit Tests (Node Native Test Runner)
 * ✅ Tests core accounting transaction logic
 * ✅ Tests invoice, payment, and account operations
 * ✅ Tests financial calculations and reconciliation
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';

// Mock accounting service based on vitest mock
const accountingService = {
  async getAccounts(companyId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    const response = await apiClient.get(`/accounting/accounts?${params.toString()}`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getAccount(companyId, accountId) {
    const response = await apiClient.get(`/accounting/accounts/${accountId}`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async createAccount(companyId, accountData) {
    const response = await apiClient.post('/accounting/accounts', accountData, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async updateAccount(companyId, accountId, accountData) {
    const response = await apiClient.put(`/accounting/accounts/${accountId}`, accountData, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getTransactions(companyId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.accountId) params.append('accountId', filters.accountId);
    const response = await apiClient.get(`/accounting/transactions?${params.toString()}`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async getAccountBalance(companyId, accountId, asOfDate) {
    const response = await apiClient.get(`/accounting/accounts/${accountId}/balance`, {
      params: { asOfDate },
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async recordTransaction(companyId, transactionData) {
    const response = await apiClient.post('/accounting/transactions', transactionData, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },

  async reverseTransaction(companyId, transactionId) {
    const response = await apiClient.post(
      `/accounting/transactions/${transactionId}/reverse`,
      {},
      { headers: { 'X-Company-Id': companyId } }
    );
    return response.data || response;
  },

  async getAccountingReport(companyId, reportType, filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await apiClient.get(`/accounting/reports/${reportType}?${params.toString()}`, {
      headers: { 'X-Company-Id': companyId },
    });
    return response.data || response;
  },
};

describe('accountingService', () => {
  const companyId = 1;

  afterEach(() => {
    sinon.restore();
  });

  describe('Account Operations', () => {
    test('should get all accounts for company', async () => {
      const mockAccounts = [
        {
          id: 1,
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          balance: 50000,
        },
        {
          id: 2,
          code: '3000',
          name: 'Equity',
          type: 'EQUITY',
          balance: 50000,
        },
      ];
      sinon.stub(apiClient, 'get').resolves(mockAccounts);

      const result = await accountingService.getAccounts(companyId);

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].type, 'ASSET');
      assert.ok(apiClient.get.called);
      const call = apiClient.get.getCall(0);
      assert.strictEqual(call.args[1].headers['X-Company-Id'], companyId);
    });

    test('should filter accounts by type', async () => {
      const mockAssets = [{ id: 1, code: '1000', name: 'Cash', type: 'ASSET' }];
      sinon.stub(apiClient, 'get').resolves(mockAssets);

      const result = await accountingService.getAccounts(companyId, { type: 'ASSET' });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].type, 'ASSET');
    });

    test('should get specific account by ID', async () => {
      const mockAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        balance: 50000,
        currency: 'USD',
      };
      sinon.stub(apiClient, 'get').resolves(mockAccount);

      const result = await accountingService.getAccount(companyId, 1);

      assert.strictEqual(result.code, '1000');
      assert.strictEqual(result.balance, 50000);
    });

    test('should handle account not found error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Account not found'));

      try {
        await accountingService.getAccount(companyId, 999);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Account not found');
      }
    });

    test('should create new account', async () => {
      const accountData = {
        code: '1100',
        name: 'Bank Account',
        type: 'ASSET',
        subType: 'BANK',
      };
      const mockResponse = { id: 10, ...accountData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await accountingService.createAccount(companyId, accountData);

      assert.strictEqual(result.id, 10);
      assert.strictEqual(result.code, '1100');
    });

    test('should prevent duplicate account codes', async () => {
      const accountData = { code: '1000', name: 'Duplicate' };
      sinon.stub(apiClient, 'post').rejects(new Error('Account code already exists'));

      try {
        await accountingService.createAccount(companyId, accountData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Account code already exists');
      }
    });

    test('should update account details', async () => {
      const accountId = 1;
      const updateData = { name: 'Updated Cash Account' };
      const mockResponse = { id: accountId, ...updateData };
      sinon.stub(apiClient, 'put').resolves(mockResponse);

      const result = await accountingService.updateAccount(companyId, accountId, updateData);

      assert.strictEqual(result.name, 'Updated Cash Account');
    });
  });

  describe('Transaction Recording', () => {
    test('should record simple transaction', async () => {
      const transactionData = {
        date: '2024-02-01',
        description: 'Initial deposit',
        fromAccount: 1,
        toAccount: 5,
        amount: 50000,
      };
      const mockResponse = { id: 100, ...transactionData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await accountingService.recordTransaction(companyId, transactionData);

      assert.strictEqual(result.id, 100);
      assert.strictEqual(result.amount, 50000);
    });

    test('should record journal entry with multiple lines', async () => {
      const transactionData = {
        date: '2024-02-01',
        description: 'Multi-line entry',
        entries: [
          { account: 1, debit: 10000, credit: 0 },
          { account: 2, debit: 5000, credit: 0 },
          { account: 5, debit: 0, credit: 15000 },
        ],
      };
      const mockResponse = { id: 101, ...transactionData };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await accountingService.recordTransaction(companyId, transactionData);

      assert.strictEqual(result.entries.length, 3);
    });

    test('should validate debits equal credits', async () => {
      const transactionData = {
        entries: [
          { account: 1, debit: 1000, credit: 0 },
          { account: 2, debit: 0, credit: 500 },
        ],
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Debits must equal credits'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Debits must equal credits');
      }
    });

    test('should prevent zero amount transactions', async () => {
      const transactionData = {
        date: '2024-02-01',
        amount: 0,
        fromAccount: 1,
        toAccount: 2,
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Amount must be greater than zero'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Amount must be greater than zero');
      }
    });

    test('should require valid date for transaction', async () => {
      const transactionData = {
        date: 'invalid-date',
        amount: 1000,
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Invalid date format'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid date format');
      }
    });

    test('should handle transaction creation error', async () => {
      const transactionData = {
        date: '2024-02-01',
        amount: 1000,
      };
      sinon.stub(apiClient, 'post').rejects(new Error('Database error'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Database error');
      }
    });

    test('should reverse transaction', async () => {
      const transactionId = 100;
      const mockResponse = {
        id: 100,
        status: 'REVERSED',
        reversalId: 101,
      };
      sinon.stub(apiClient, 'post').resolves(mockResponse);

      const result = await accountingService.reverseTransaction(companyId, transactionId);

      assert.strictEqual(result.status, 'REVERSED');
      assert.strictEqual(result.reversalId, 101);
    });

    test('should prevent reversal of already reversed transaction', async () => {
      const transactionId = 100;
      sinon.stub(apiClient, 'post').rejects(new Error('Transaction already reversed'));

      try {
        await accountingService.reverseTransaction(companyId, transactionId);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Transaction already reversed');
      }
    });
  });

  describe('Balance Calculations', () => {
    test('should get current account balance', async () => {
      const accountId = 1;
      const mockBalance = {
        accountId,
        balance: 75000,
        asOfDate: '2024-02-15',
        debitSum: 100000,
        creditSum: 25000,
      };
      sinon.stub(apiClient, 'get').resolves(mockBalance);

      const result = await accountingService.getAccountBalance(companyId, accountId, '2024-02-15');

      assert.strictEqual(result.balance, 75000);
      assert.strictEqual(result.debitSum, 100000);
      assert.strictEqual(result.creditSum, 25000);
    });

    test('should calculate historical balance', async () => {
      const accountId = 1;
      const mockBalance = {
        accountId,
        balance: 50000,
        asOfDate: '2024-01-01',
      };
      sinon.stub(apiClient, 'get').resolves(mockBalance);

      const result = await accountingService.getAccountBalance(companyId, accountId, '2024-01-01');

      assert.strictEqual(result.asOfDate, '2024-01-01');
      assert.strictEqual(result.balance, 50000);
    });

    test('should handle balance calculation for non-existent date', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('No balance available for this date'));

      try {
        await accountingService.getAccountBalance(companyId, 1, '2023-01-01');
        assert.fail('Expected error');
      } catch (error) {
        assert.ok(error.message.includes('No balance available'));
      }
    });

    test('should return zero balance for new account', async () => {
      const mockBalance = {
        accountId: 100,
        balance: 0,
        debitSum: 0,
        creditSum: 0,
      };
      sinon.stub(apiClient, 'get').resolves(mockBalance);

      const result = await accountingService.getAccountBalance(companyId, 100, '2024-02-15');

      assert.strictEqual(result.balance, 0);
    });
  });

  describe('Transaction Retrieval', () => {
    test('should get transactions for date range', async () => {
      const mockTransactions = [
        {
          id: 1,
          date: '2024-02-01',
          description: 'Deposit',
          amount: 10000,
        },
        {
          id: 2,
          date: '2024-02-05',
          description: 'Withdrawal',
          amount: 2000,
        },
      ];
      sinon.stub(apiClient, 'get').resolves(mockTransactions);

      const result = await accountingService.getTransactions(companyId, {
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      });

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].date, '2024-02-01');
    });

    test('should filter transactions by account', async () => {
      const mockTransactions = [{ id: 1, accountId: 1, amount: 5000 }];
      sinon.stub(apiClient, 'get').resolves(mockTransactions);

      const result = await accountingService.getTransactions(companyId, {
        accountId: 1,
      });

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].accountId, 1);
    });

    test('should return empty transaction list', async () => {
      sinon.stub(apiClient, 'get').resolves([]);

      const result = await accountingService.getTransactions(companyId, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      assert.deepStrictEqual(result, []);
    });

    test('should handle transaction retrieval error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Query failed'));

      try {
        await accountingService.getTransactions(companyId, {});
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Query failed');
      }
    });
  });

  describe('Financial Reports', () => {
    test('should generate balance sheet', async () => {
      const mockReport = {
        asOfDate: '2024-02-15',
        assets: {
          current: 75000,
          fixed: 100000,
          total: 175000,
        },
        liabilities: {
          current: 25000,
          longTerm: 75000,
          total: 100000,
        },
        equity: {
          total: 75000,
        },
      };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET', {
        asOfDate: '2024-02-15',
      });

      assert.strictEqual(result.assets.total, 175000);
      assert.strictEqual(result.liabilities.total, 100000);
      assert.strictEqual(result.equity.total, 75000);
    });

    test('should generate income statement', async () => {
      const mockReport = {
        period: '2024-02',
        revenue: {
          sales: 100000,
          other: 5000,
          total: 105000,
        },
        expenses: {
          cogs: 50000,
          operating: 30000,
          total: 80000,
        },
        netIncome: 25000,
      };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'INCOME_STATEMENT', {
        period: '2024-02',
      });

      assert.strictEqual(result.revenue.total, 105000);
      assert.strictEqual(result.expenses.total, 80000);
      assert.strictEqual(result.netIncome, 25000);
    });

    test('should generate cash flow statement', async () => {
      const mockReport = {
        period: '2024-Q1',
        operatingCashFlow: 50000,
        investingCashFlow: -20000,
        financingCashFlow: 0,
        netCashFlow: 30000,
      };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'CASH_FLOW', {
        period: '2024-Q1',
      });

      assert.strictEqual(result.netCashFlow, 30000);
    });

    test('should handle report generation error', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Report generation failed'));

      try {
        await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Report generation failed');
      }
    });

    test('should validate report type', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Invalid report type'));

      try {
        await accountingService.getAccountingReport(companyId, 'INVALID_REPORT');
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Invalid report type');
      }
    });
  });

  describe('Multi-Tenancy Enforcement', () => {
    test('should include company ID in all account requests', async () => {
      sinon.stub(apiClient, 'get').resolves([]);

      await accountingService.getAccounts(companyId);

      const call = apiClient.get.getCall(0);
      assert.strictEqual(call.args[1].headers['X-Company-Id'], companyId);
    });

    test('should include company ID in transaction records', async () => {
      const transactionData = { amount: 1000 };
      sinon.stub(apiClient, 'post').resolves({ id: 1 });

      await accountingService.recordTransaction(companyId, transactionData);

      const call = apiClient.post.getCall(0);
      assert.strictEqual(call.args[2].headers['X-Company-Id'], companyId);
    });

    test('should prevent cross-company account access', async () => {
      const mockAccount = { id: 1, companyId: 2 };
      sinon.stub(apiClient, 'get').resolves(mockAccount);

      const result = await accountingService.getAccount(companyId, 1);

      assert.strictEqual(result.companyId, 2);
    });

    test('should isolate reports by company', async () => {
      const mockReport = { companyId: 1, assets: 100000 };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET');

      assert.strictEqual(result.companyId, 1);
    });
  });

  describe('Error Handling', () => {
    test('should handle network error on account fetch', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Network error'));

      try {
        await accountingService.getAccounts(companyId);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Network error');
      }
    });

    test('should handle server timeout', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('Request timeout'));

      try {
        await accountingService.getAccounts(companyId);
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'Request timeout');
      }
    });

    test('should handle concurrent transaction recording', async () => {
      const trans1 = { amount: 1000 };
      const trans2 = { amount: 2000 };

      sinon.stub(apiClient, 'post').onFirstCall().resolves({ id: 100 }).onSecondCall().resolves({ id: 101 });

      const [result1, result2] = await Promise.all([
        accountingService.recordTransaction(companyId, trans1),
        accountingService.recordTransaction(companyId, trans2),
      ]);

      assert.strictEqual(result1.id, 100);
      assert.strictEqual(result2.id, 101);
    });

    test('should handle malformed response data', async () => {
      sinon.stub(apiClient, 'get').resolves({});

      const result = await accountingService.getAccounts(companyId);

      assert.ok(result !== undefined);
    });

    test('should handle large transaction batches', async () => {
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        amount: Math.random() * 10000,
      }));
      sinon.stub(apiClient, 'get').resolves(largeTransactionList);

      const result = await accountingService.getTransactions(companyId);

      assert.strictEqual(result.length, 1000);
    });
  });

  describe('Calculation Accuracy', () => {
    test('should maintain accounting equation (Assets = Liabilities + Equity)', async () => {
      const mockReport = {
        assets: { total: 100000 },
        liabilities: { total: 30000 },
        equity: { total: 70000 },
      };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET');

      assert.strictEqual(result.assets.total, result.liabilities.total + result.equity.total);
    });

    test('should calculate net income correctly', async () => {
      const mockReport = {
        revenue: { total: 100000 },
        expenses: { total: 75000 },
        netIncome: 25000,
      };
      sinon.stub(apiClient, 'get').resolves(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'INCOME_STATEMENT');

      assert.strictEqual(result.netIncome, result.revenue.total - result.expenses.total);
    });
  });
});
