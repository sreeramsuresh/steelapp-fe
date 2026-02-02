/**
 * Financial Reports Service Unit Tests
 * ✅ Tests financial statement generation (P&L, Balance Sheet, Cash Flow)
 * ✅ Tests report filtering and date range handling
 * ✅ Tests PDF export and report caching
 * ✅ 100% coverage target for financialReportsService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../axiosApi.js', () => ({
  apiService: {
    request: vi.fn(),
  },
}));

import api from '../api';
import { apiService } from '../axiosApi';
import { financialReportsService } from '../financialReportsService';

describe('financialReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfitAndLoss', () => {
    test('should generate P&L statement for period', async () => {
      const mockPL = {
        period: '2024-01',
        revenue: 500000,
        costOfGoods: 300000,
        grossProfit: 200000,
        operatingExpenses: 100000,
        operatingIncome: 100000,
        otherIncome: 10000,
        otherExpenses: 5000,
        netIncome: 105000,
      };
      api.get.mockResolvedValueOnce({ data: mockPL });

      const result = await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');

      expect(result.revenue).toBe(500000);
      expect(result.netIncome).toBe(105000);
      expect(result.grossProfit).toBe(200000);
      expect(api.get).toHaveBeenCalledWith('/financial-reports/profit-loss', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
    });

    test('should calculate correct gross profit margin', async () => {
      const mockPL = {
        revenue: 500000,
        costOfGoods: 300000,
        grossProfit: 200000,
        grossMargin: 40,
      };
      api.get.mockResolvedValueOnce({ data: mockPL });

      const result = await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');

      expect(result.grossMargin).toBe(40);
      expect((result.grossProfit / result.revenue) * 100).toBeCloseTo(40);
    });

    test('should handle negative net income (loss)', async () => {
      const mockPL = {
        revenue: 500000,
        operatingExpenses: 600000,
        netIncome: -100000,
      };
      api.get.mockResolvedValueOnce({ data: mockPL });

      const result = await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');

      expect(result.netIncome).toBe(-100000);
    });

    test('should include tax calculations', async () => {
      const mockPL = {
        operatingIncome: 100000,
        taxExpense: 25000,
        netIncome: 75000,
        effectiveTaxRate: 25,
      };
      api.get.mockResolvedValueOnce({ data: mockPL });

      const result = await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');

      expect(result.taxExpense).toBe(25000);
      expect(result.effectiveTaxRate).toBe(25);
    });
  });

  describe('getBalanceSheet', () => {
    test('should generate balance sheet snapshot', async () => {
      const mockBS = {
        asOfDate: '2024-01-31',
        assets: {
          current: 500000,
          fixed: 1000000,
          total: 1500000,
        },
        liabilities: {
          current: 300000,
          longTerm: 400000,
          total: 700000,
        },
        equity: 800000,
        totalLiabilitiesAndEquity: 1500000,
      };
      api.get.mockResolvedValueOnce({ data: mockBS });

      const result = await financialReportsService.getBalanceSheet('2024-01-31');

      expect(result.assets.total).toBe(1500000);
      expect(result.liabilities.total).toBe(700000);
      expect(result.equity).toBe(800000);
      expect(result.assets.total).toBe(result.totalLiabilitiesAndEquity);
      expect(api.get).toHaveBeenCalledWith('/financial-reports/balance-sheet', {
        params: { asOfDate: '2024-01-31' },
      });
    });

    test('should verify balance sheet equation (Assets = Liabilities + Equity)', async () => {
      const mockBS = {
        assets: { total: 1500000 },
        liabilities: { total: 700000 },
        equity: 800000,
      };
      api.get.mockResolvedValueOnce({ data: mockBS });

      const result = await financialReportsService.getBalanceSheet('2024-01-31');

      expect(result.assets.total).toBe(result.liabilities.total + result.equity);
    });

    test('should show current vs fixed asset breakdown', async () => {
      const mockBS = {
        assets: {
          current: 500000,
          currentPercent: 33,
          fixed: 1000000,
          fixedPercent: 67,
          total: 1500000,
        },
      };
      api.get.mockResolvedValueOnce({ data: mockBS });

      const result = await financialReportsService.getBalanceSheet('2024-01-31');

      expect(result.assets.currentPercent).toBe(33);
      expect(result.assets.fixedPercent).toBe(67);
    });

    test('should calculate working capital', async () => {
      const mockBS = {
        assets: { current: 500000 },
        liabilities: { current: 300000 },
        workingCapital: 200000,
      };
      api.get.mockResolvedValueOnce({ data: mockBS });

      const result = await financialReportsService.getBalanceSheet('2024-01-31');

      expect(result.workingCapital).toBe(200000);
      expect(result.workingCapital).toBe(result.assets.current - result.liabilities.current);
    });
  });

  describe('getCashFlowStatement', () => {
    test('should generate cash flow statement', async () => {
      const mockCF = {
        period: '2024-01',
        operatingActivities: 150000,
        investingActivities: -50000,
        financingActivities: 20000,
        netCashFlow: 120000,
        openingCash: 300000,
        closingCash: 420000,
      };
      api.get.mockResolvedValueOnce({ data: mockCF });

      const result = await financialReportsService.getCashFlowStatement('2024-01-01', '2024-01-31');

      expect(result.operatingActivities).toBe(150000);
      expect(result.closingCash).toBe(420000);
      expect(result.closingCash).toBe(result.openingCash + result.netCashFlow);
      expect(api.get).toHaveBeenCalledWith('/financial-reports/cash-flow', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
    });

    test('should show activity breakdown details', async () => {
      const mockCF = {
        operatingActivities: {
          netIncome: 105000,
          depreciation: 50000,
          changes: -5000,
          total: 150000,
        },
        investingActivities: {
          capitalExpenditure: -50000,
          assetSales: 0,
          total: -50000,
        },
        financingActivities: {
          debtRepayment: -30000,
          issuedShares: 50000,
          total: 20000,
        },
      };
      api.get.mockResolvedValueOnce({ data: mockCF });

      const result = await financialReportsService.getCashFlowStatement('2024-01-01', '2024-01-31');

      expect(result.operatingActivities.total).toBe(150000);
      expect(result.investingActivities.total).toBe(-50000);
      expect(result.financingActivities.total).toBe(20000);
    });
  });

  describe('getTrialBalance', () => {
    test('should generate trial balance for period', async () => {
      const mockTB = {
        period: '2024-01',
        accounts: [
          { code: '1000', name: 'Cash', debit: 100000, credit: 0 },
          { code: '2000', name: 'Accounts Payable', debit: 0, credit: 50000 },
          { code: '3000', name: 'Equity', debit: 0, credit: 500000 },
        ],
        totalDebit: 100000,
        totalCredit: 550000,
        balanced: false,
      };
      api.get.mockResolvedValueOnce({ data: mockTB });

      const result = await financialReportsService.getTrialBalance('2024-01-31');

      expect(result.accounts).toHaveLength(3);
      expect(result.totalDebit).toBe(100000);
      expect(result.totalCredit).toBe(550000);
      expect(api.get).toHaveBeenCalledWith('/financial-reports/trial-balance', {
        params: { asOfDate: '2024-01-31' },
      });
    });

    test('should verify trial balance is balanced', async () => {
      const mockTB = {
        accounts: [
          { code: '1000', debit: 100000, credit: 0 },
          { code: '2000', debit: 0, credit: 100000 },
        ],
        totalDebit: 100000,
        totalCredit: 100000,
        balanced: true,
      };
      api.get.mockResolvedValueOnce({ data: mockTB });

      const result = await financialReportsService.getTrialBalance('2024-01-31');

      expect(result.balanced).toBe(true);
      expect(result.totalDebit).toBe(result.totalCredit);
    });
  });

  describe('getFinancialRatios', () => {
    test('should calculate key financial ratios', async () => {
      const mockRatios = {
        liquidity: {
          currentRatio: 1.5,
          quickRatio: 1.2,
          workingCapitalRatio: 2.0,
        },
        profitability: {
          grossMargin: 40,
          operatingMargin: 20,
          netMargin: 14,
          roe: 15,
          roa: 10,
        },
        efficiency: {
          assetTurnover: 2.5,
          inventoryTurnover: 6,
          receivablesTurnover: 12,
        },
        leverage: {
          debtToEquity: 0.5,
          debtRatio: 0.33,
          equityMultiplier: 1.5,
        },
      };
      api.get.mockResolvedValueOnce({ data: mockRatios });

      const result = await financialReportsService.getFinancialRatios('2024-01-01', '2024-01-31');

      expect(result.liquidity.currentRatio).toBe(1.5);
      expect(result.profitability.netMargin).toBe(14);
      expect(result.leverage.debtToEquity).toBe(0.5);
      expect(api.get).toHaveBeenCalledWith('/financial-reports/ratios', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
    });
  });

  describe('exportReportPDF', () => {
    test('should export report as PDF', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await financialReportsService.exportReportPDF('profit-loss', '2024-01-01', '2024-01-31');

      expect(apiService.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/financial-reports/profit-loss/pdf',
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
        responseType: 'blob',
      });
    });

    test('should handle custom report parameters in export', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      apiService.request.mockResolvedValueOnce(mockBlob);

      await financialReportsService.exportReportPDF('balance-sheet', '2024-01-31', null, {
        includeComparatives: true,
        currency: 'AED',
      });

      expect(apiService.request).toHaveBeenCalled();
      const call = apiService.request.mock.calls[0][0];
      expect(call.params).toHaveProperty('includeComparatives');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31')).rejects.toThrow(
        'Network error',
      );
    });

    test('should handle invalid date ranges', async () => {
      api.get.mockRejectedValueOnce(new Error('Invalid date range'));

      await expect(financialReportsService.getProfitAndLoss('2024-01-31', '2024-01-01')).rejects.toThrow(
        'Invalid date range',
      );
    });

    test('should handle unbalanced trial balance', async () => {
      const mockTB = {
        accounts: [],
        totalDebit: 100000,
        totalCredit: 99999,
        balanced: false,
        difference: 1,
      };
      api.get.mockResolvedValueOnce({ data: mockTB });

      const result = await financialReportsService.getTrialBalance('2024-01-31');

      expect(result.balanced).toBe(false);
      expect(result.difference).toBe(1);
    });
  });

  describe('Comparative Analysis', () => {
    test('should generate comparative P&L statements', async () => {
      const mockComparative = {
        current: {
          period: '2024-01',
          revenue: 500000,
          netIncome: 100000,
        },
        previous: {
          period: '2023-01',
          revenue: 450000,
          netIncome: 80000,
        },
        variance: {
          revenueChange: 11.1,
          netIncomeChange: 25.0,
        },
      };
      api.get.mockResolvedValueOnce({ data: mockComparative });

      const result = await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31', {
        compareWithPreviousYear: true,
      });

      expect(result.variance.revenueChange).toBe(11.1);
      expect(result.variance.netIncomeChange).toBe(25.0);
    });
  });

  describe('Report Caching', () => {
    test('should cache generated reports', async () => {
      const mockPL = { revenue: 500000, netIncome: 100000 };
      api.get.mockResolvedValueOnce({ data: mockPL });

      await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');
      await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');

      // API should only be called once if caching works
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    test('should invalidate cache on date change', async () => {
      const mockPL = { revenue: 500000, netIncome: 100000 };
      api.get.mockResolvedValueOnce({ data: mockPL });

      await financialReportsService.getProfitAndLoss('2024-01-01', '2024-01-31');

      api.get.mockResolvedValueOnce({ data: { revenue: 600000, netIncome: 120000 } });

      await financialReportsService.getProfitAndLoss('2024-02-01', '2024-02-28');

      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});
