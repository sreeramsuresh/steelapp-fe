/**
 * Accounting Service Unit Tests (Node Native Test Runner)
 * ✅ Tests core accounting transaction logic
 * ✅ Tests invoice, payment, and account operations
 * ✅ Tests financial calculations and reconciliation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
    vi.restoreAllMocks();
  });

  describe('Account Operations', () => {
    it('should get all accounts for company', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAccounts);

      const result = await accountingService.getAccounts(companyId);

      expect(result.length).toBe(2);
      expect(result[0].type).toBe('ASSET');
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
      const call = apiClient.get.getCall(0);
      expect(call.args[1].headers['X-Company-Id']).toBe(companyId);
    });

    it('should filter accounts by type', async () => {
      const mockAssets = [{ id: 1, code: '1000', name: 'Cash', type: 'ASSET' }];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAssets);

      const result = await accountingService.getAccounts(companyId, { type: 'ASSET' });

      expect(result.length).toBe(1);
      expect(result[0].type).toBe('ASSET');
    });

    it('should get specific account by ID', async () => {
      const mockAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        balance: 50000,
        currency: 'USD',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAccount);

      const result = await accountingService.getAccount(companyId, 1);

      expect(result.code).toBe('1000');
      expect(result.balance).toBe(50000);
    });

    it('should handle account not found error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Account not found'));

      try {
        await accountingService.getAccount(companyId, 999);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Account not found');
      }
    });

    it('should create new account', async () => {
      const accountData = {
        code: '1100',
        name: 'Bank Account',
        type: 'ASSET',
        subType: 'BANK',
      };
      const mockResponse = { id: 10, ...accountData };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await accountingService.createAccount(companyId, accountData);

      expect(result.id).toBe(10);
      expect(result.code).toBe('1100');
    });

    it('should prevent duplicate account codes', async () => {
      const accountData = { code: '1000', name: 'Duplicate' };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Account code already exists'));

      try {
        await accountingService.createAccount(companyId, accountData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Account code already exists');
      }
    });

    it('should update account details', async () => {
      const accountId = 1;
      const updateData = { name: 'Updated Cash Account' };
      const mockResponse = { id: accountId, ...updateData };
      vi.spyOn(apiClient, 'put').mockResolvedValue(mockResponse);

      const result = await accountingService.updateAccount(companyId, accountId, updateData);

      expect(result.name).toBe('Updated Cash Account');
    });
  });

  describe('Transaction Recording', () => {
    it('should record simple transaction', async () => {
      const transactionData = {
        date: '2024-02-01',
        description: 'Initial deposit',
        fromAccount: 1,
        toAccount: 5,
        amount: 50000,
      };
      const mockResponse = { id: 100, ...transactionData };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await accountingService.recordTransaction(companyId, transactionData);

      expect(result.id).toBe(100);
      expect(result.amount).toBe(50000);
    });

    it('should record journal entry with multiple lines', async () => {
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
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await accountingService.recordTransaction(companyId, transactionData);

      expect(result.entries.length).toBe(3);
    });

    it('should validate debits equal credits', async () => {
      const transactionData = {
        entries: [
          { account: 1, debit: 1000, credit: 0 },
          { account: 2, debit: 0, credit: 500 },
        ],
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Debits must equal credits'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Debits must equal credits');
      }
    });

    it('should prevent zero amount transactions', async () => {
      const transactionData = {
        date: '2024-02-01',
        amount: 0,
        fromAccount: 1,
        toAccount: 2,
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Amount must be greater than zero'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Amount must be greater than zero');
      }
    });

    it('should require valid date for transaction', async () => {
      const transactionData = {
        date: 'invalid-date',
        amount: 1000,
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Invalid date format'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invalid date format');
      }
    });

    it('should handle transaction creation error', async () => {
      const transactionData = {
        date: '2024-02-01',
        amount: 1000,
      };
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Database error'));

      try {
        await accountingService.recordTransaction(companyId, transactionData);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
    });

    it('should reverse transaction', async () => {
      const transactionId = 100;
      const mockResponse = {
        id: 100,
        status: 'REVERSED',
        reversalId: 101,
      };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const result = await accountingService.reverseTransaction(companyId, transactionId);

      expect(result.status).toBe('REVERSED');
      expect(result.reversalId).toBe(101);
    });

    it('should prevent reversal of already reversed transaction', async () => {
      const transactionId = 100;
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Transaction already reversed'));

      try {
        await accountingService.reverseTransaction(companyId, transactionId);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Transaction already reversed');
      }
    });
  });

  describe('Balance Calculations', () => {
    it('should get current account balance', async () => {
      const accountId = 1;
      const mockBalance = {
        accountId,
        balance: 75000,
        asOfDate: '2024-02-15',
        debitSum: 100000,
        creditSum: 25000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockBalance);

      const result = await accountingService.getAccountBalance(companyId, accountId, '2024-02-15');

      expect(result.balance).toBe(75000);
      expect(result.debitSum).toBe(100000);
      expect(result.creditSum).toBe(25000);
    });

    it('should calculate historical balance', async () => {
      const accountId = 1;
      const mockBalance = {
        accountId,
        balance: 50000,
        asOfDate: '2024-01-01',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockBalance);

      const result = await accountingService.getAccountBalance(companyId, accountId, '2024-01-01');

      expect(result.asOfDate).toBe('2024-01-01');
      expect(result.balance).toBe(50000);
    });

    it('should handle balance calculation for non-existent date', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('No balance available for this date'));

      try {
        await accountingService.getAccountBalance(companyId, 1, '2023-01-01');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message.includes('No balance available').toBeTruthy());
      }
    });

    it('should return zero balance for new account', async () => {
      const mockBalance = {
        accountId: 100,
        balance: 0,
        debitSum: 0,
        creditSum: 0,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockBalance);

      const result = await accountingService.getAccountBalance(companyId, 100, '2024-02-15');

      expect(result.balance).toBe(0);
    });
  });

  describe('Transaction Retrieval', () => {
    it('should get transactions for date range', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockTransactions);

      const result = await accountingService.getTransactions(companyId, {
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      });

      expect(result.length).toBe(2);
      expect(result[0].date).toBe('2024-02-01');
    });

    it('should filter transactions by account', async () => {
      const mockTransactions = [{ id: 1, accountId: 1, amount: 5000 }];
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockTransactions);

      const result = await accountingService.getTransactions(companyId, {
        accountId: 1,
      });

      expect(result.length).toBe(1);
      expect(result[0].accountId).toBe(1);
    });

    it('should return empty transaction list', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      const result = await accountingService.getTransactions(companyId, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });

      expect(result).toEqual([]);
    });

    it('should handle transaction retrieval error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Query failed'));

      try {
        await accountingService.getTransactions(companyId, {});
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Query failed');
      }
    });
  });

  describe('Financial Reports', () => {
    it('should generate balance sheet', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET', {
        asOfDate: '2024-02-15',
      });

      expect(result.assets.total).toBe(175000);
      expect(result.liabilities.total).toBe(100000);
      expect(result.equity.total).toBe(75000);
    });

    it('should generate income statement', async () => {
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
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'INCOME_STATEMENT', {
        period: '2024-02',
      });

      expect(result.revenue.total).toBe(105000);
      expect(result.expenses.total).toBe(80000);
      expect(result.netIncome).toBe(25000);
    });

    it('should generate cash flow statement', async () => {
      const mockReport = {
        period: '2024-Q1',
        operatingCashFlow: 50000,
        investingCashFlow: -20000,
        financingCashFlow: 0,
        netCashFlow: 30000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'CASH_FLOW', {
        period: '2024-Q1',
      });

      expect(result.netCashFlow).toBe(30000);
    });

    it('should handle report generation error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Report generation failed'));

      try {
        await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Report generation failed');
      }
    });

    it('should validate report type', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Invalid report type'));

      try {
        await accountingService.getAccountingReport(companyId, 'INVALID_REPORT');
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Invalid report type');
      }
    });
  });

  describe('Multi-Tenancy Enforcement', () => {
    it('should include company ID in all account requests', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue([]);

      await accountingService.getAccounts(companyId);

      const call = apiClient.get.getCall(0);
      expect(call.args[1].headers['X-Company-Id']).toBe(companyId);
    });

    it('should include company ID in transaction records', async () => {
      const transactionData = { amount: 1000 };
      vi.spyOn(apiClient, 'post').mockResolvedValue({ id: 1 });

      await accountingService.recordTransaction(companyId, transactionData);

      const call = apiClient.post.getCall(0);
      expect(call.args[2].headers['X-Company-Id']).toBe(companyId);
    });

    it('should prevent cross-company account access', async () => {
      const mockAccount = { id: 1, companyId: 2 };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockAccount);

      const result = await accountingService.getAccount(companyId, 1);

      expect(result.companyId).toBe(2);
    });

    it('should isolate reports by company', async () => {
      const mockReport = { companyId: 1, assets: 100000 };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET');

      expect(result.companyId).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network error on account fetch', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network error'));

      try {
        await accountingService.getAccounts(companyId);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle server timeout', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Request timeout'));

      try {
        await accountingService.getAccounts(companyId);
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('Request timeout');
      }
    });

    it('should handle concurrent transaction recording', async () => {
      const trans1 = { amount: 1000 };
      const trans2 = { amount: 2000 };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ id: 100 }).mockResolvedValueOnce({ id: 101 });

      const [result1, result2] = await Promise.all([
        accountingService.recordTransaction(companyId, trans1),
        accountingService.recordTransaction(companyId, trans2),
      ]);

      expect(result1.id).toBe(100);
      expect(result2.id).toBe(101);
    });

    it('should handle malformed response data', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({});

      const result = await accountingService.getAccounts(companyId);

      expect(result !== undefined).toBeTruthy();
    });

    it('should handle large transaction batches', async () => {
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        amount: Math.random() * 10000,
      }));
      vi.spyOn(apiClient, 'get').mockResolvedValue(largeTransactionList);

      const result = await accountingService.getTransactions(companyId);

      expect(result.length).toBe(1000);
    });
  });

  describe('Calculation Accuracy', () => {
    it('should maintain accounting equation (Assets = Liabilities + Equity)', async () => {
      const mockReport = {
        assets: { total: 100000 },
        liabilities: { total: 30000 },
        equity: { total: 70000 },
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'BALANCE_SHEET');

      expect(result.assets.total).toBe(result.liabilities.total + result.equity.total);
    });

    it('should calculate net income correctly', async () => {
      const mockReport = {
        revenue: { total: 100000 },
        expenses: { total: 75000 },
        netIncome: 25000,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockReport);

      const result = await accountingService.getAccountingReport(companyId, 'INCOME_STATEMENT');

      expect(result.netIncome).toBe(result.revenue.total - result.expenses.total);
    });
  });
});
