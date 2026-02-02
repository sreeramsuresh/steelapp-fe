/**
 * Customer Credit Service Unit Tests
 * ✅ Tests credit risk assessment and monitoring
 * ✅ Tests credit limit management
 * ✅ Tests DSO and aging analysis
 * ✅ Tests credit grade calculations
 * ✅ 100% coverage target for customerCreditService.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '../api';
import { customerCreditService } from '../customerCreditService';

describe('customerCreditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHighRiskCustomers', () => {
    test('should fetch high-risk customers (grade D or E)', async () => {
      const mockHighRisk = [
        { id: 101, name: 'Risky Corp', creditGrade: 'D', dso: 85, utilizationPercent: 92 },
        { id: 102, name: 'Danger Ltd', creditGrade: 'E', dso: 120, utilizationPercent: 110 },
      ];
      api.get.mockResolvedValueOnce({ data: mockHighRisk });

      const result = await customerCreditService.getHighRiskCustomers(50);

      expect(result).toHaveLength(2);
      expect(result[0].creditGrade).toBe('D');
      expect(result[1].creditGrade).toBe('E');
      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/high', { params: { limit: 50 } });
    });

    test('should use default limit of 50', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await customerCreditService.getHighRiskCustomers();

      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/high', { params: { limit: 50 } });
    });

    test('should handle custom limit', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await customerCreditService.getHighRiskCustomers(100);

      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/high', { params: { limit: 100 } });
    });

    test('should return empty list when no high-risk customers', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      const result = await customerCreditService.getHighRiskCustomers();

      expect(result).toEqual([]);
    });
  });

  describe('getOverLimitCustomers', () => {
    test('should identify customers over credit limit', async () => {
      const mockOverLimit = [
        {
          id: 101,
          name: 'Over Limit Inc',
          creditLimit: 100000,
          totalOutstanding: 125000,
          excessAmount: 25000,
        },
        {
          id: 102,
          name: 'Exceeded Corp',
          creditLimit: 50000,
          totalOutstanding: 60000,
          excessAmount: 10000,
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockOverLimit });

      const result = await customerCreditService.getOverLimitCustomers();

      expect(result).toHaveLength(2);
      expect(result[0].excessAmount).toBe(25000);
      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/over-limit');
    });

    test('should return empty list when all customers are within limits', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      const result = await customerCreditService.getOverLimitCustomers();

      expect(result).toEqual([]);
    });
  });

  describe('getCustomerCreditSummary', () => {
    test('should fetch detailed credit summary for customer', async () => {
      const mockSummary = {
        customerId: 101,
        customerName: 'Premium Corp',
        creditLimit: 500000,
        creditUtilization: 350000,
        utilizationPercent: 70,
        creditGrade: 'A',
        dso: 35,
        outstandingInvoices: 15,
        overdueDays: 0,
        paymentHistory: {
          onTime: 98,
          late: 2,
          defaulted: 0,
        },
      };
      api.get.mockResolvedValueOnce({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(101);

      expect(result.creditGrade).toBe('A');
      expect(result.utilizationPercent).toBe(70);
      expect(result.dso).toBe(35);
      expect(api.get).toHaveBeenCalledWith('/customers/101/credit-summary');
    });

    test('should handle zero credit limit customer', async () => {
      const mockSummary = {
        customerId: 999,
        creditLimit: 0,
        creditUtilization: 0,
        utilizationPercent: 0,
        creditGrade: 'BLOCKED',
      };
      api.get.mockResolvedValueOnce({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(999);

      expect(result.creditLimit).toBe(0);
      expect(result.creditGrade).toBe('BLOCKED');
    });

    test('should include payment history details', async () => {
      const mockSummary = {
        customerId: 101,
        paymentHistory: {
          onTime: 98,
          late: 2,
          defaulted: 0,
        },
      };
      api.get.mockResolvedValueOnce({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(101);

      expect(result.paymentHistory.onTime).toBe(98);
      expect(result.paymentHistory.late).toBe(2);
      expect(result.paymentHistory.defaulted).toBe(0);
    });
  });

  describe('adjustCreditLimit', () => {
    test('should increase credit limit', async () => {
      const mockResponse = {
        customerId: 101,
        previousLimit: 500000,
        newLimit: 750000,
        approvalStatus: 'approved',
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await customerCreditService.adjustCreditLimit(101, 750000, 'limit increase');

      expect(result.newLimit).toBe(750000);
      expect(result.approvalStatus).toBe('approved');
      expect(api.put).toHaveBeenCalledWith('/customers/101/credit-limit', {
        newLimit: 750000,
        reason: 'limit increase',
      });
    });

    test('should decrease credit limit', async () => {
      const mockResponse = {
        customerId: 101,
        previousLimit: 500000,
        newLimit: 250000,
        approvalStatus: 'approved',
      };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await customerCreditService.adjustCreditLimit(101, 250000, 'risk reduction');

      expect(result.newLimit).toBe(250000);
    });

    test('should prevent reduction below current utilization', async () => {
      api.put.mockRejectedValueOnce(new Error('New limit below current utilization'));

      await expect(
        customerCreditService.adjustCreditLimit(101, 100000, 'reduction'),
      ).rejects.toThrow('New limit below current utilization');
    });
  });

  describe('getAgingAnalysis', () => {
    test('should provide detailed AR aging breakdown', async () => {
      const mockAging = {
        customerId: 101,
        current: { count: 5, amount: 50000 },
        days30: { count: 2, amount: 20000 },
        days60: { count: 1, amount: 10000 },
        days90: { count: 1, amount: 5000 },
        days90Plus: { count: 0, amount: 0 },
        total: { count: 9, amount: 85000 },
      };
      api.get.mockResolvedValueOnce({ data: mockAging });

      const result = await customerCreditService.getAgingAnalysis(101);

      expect(result.current.amount).toBe(50000);
      expect(result.days30.amount).toBe(20000);
      expect(result.total.amount).toBe(85000);
      expect(api.get).toHaveBeenCalledWith('/customers/101/aging-analysis');
    });

    test('should show overdue breakdown', async () => {
      const mockAging = {
        current: { count: 0, amount: 0 },
        days30: { count: 2, amount: 20000 },
        days60: { count: 1, amount: 10000 },
        days90Plus: { count: 1, amount: 5000 },
      };
      api.get.mockResolvedValueOnce({ data: mockAging });

      const result = await customerCreditService.getAgingAnalysis(101);

      expect(result.days30.count).toBe(2);
      expect(result.days90Plus.count).toBe(1);
    });
  });

  describe('calculateDSO', () => {
    test('should calculate Days Sales Outstanding', async () => {
      const mockDSO = {
        customerId: 101,
        dso: 42,
        calculateDate: '2024-02-02',
        averageDailyRevenue: 2000,
        outstandingAmount: 84000,
      };
      api.get.mockResolvedValueOnce({ data: mockDSO });

      const result = await customerCreditService.calculateDSO(101);

      expect(result.dso).toBe(42);
      expect(result.outstandingAmount).toBe(84000);
      expect(api.get).toHaveBeenCalledWith('/customers/101/dso');
    });

    test('should show zero DSO for customer with no outstanding balance', async () => {
      const mockDSO = {
        customerId: 101,
        dso: 0,
        outstandingAmount: 0,
      };
      api.get.mockResolvedValueOnce({ data: mockDSO });

      const result = await customerCreditService.calculateDSO(101);

      expect(result.dso).toBe(0);
    });
  });

  describe('getCreditEvents', () => {
    test('should retrieve credit events history', async () => {
      const mockEvents = [
        {
          id: 1,
          date: '2024-02-01',
          type: 'LIMIT_INCREASE',
          amount: 250000,
          description: 'Credit limit increased',
        },
        {
          id: 2,
          date: '2024-01-15',
          type: 'GRADE_CHANGE',
          fromGrade: 'B',
          toGrade: 'A',
          description: 'Grade upgraded to A',
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockEvents });

      const result = await customerCreditService.getCreditEvents(101);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('LIMIT_INCREASE');
      expect(result[1].type).toBe('GRADE_CHANGE');
      expect(api.get).toHaveBeenCalledWith('/customers/101/credit-events');
    });

    test('should show empty history for new customer', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      const result = await customerCreditService.getCreditEvents(999);

      expect(result).toEqual([]);
    });
  });

  describe('getCreditGrade', () => {
    test('should determine credit grade based on metrics', async () => {
      const mockGrade = {
        customerId: 101,
        grade: 'A',
        score: 92,
        factors: {
          paymentHistory: 'excellent',
          utilizationRatio: 'optimal',
          dso: 'low',
          financialHealth: 'strong',
        },
      };
      api.get.mockResolvedValueOnce({ data: mockGrade });

      const result = await customerCreditService.getCreditGrade(101);

      expect(result.grade).toBe('A');
      expect(result.score).toBe(92);
      expect(result.factors.paymentHistory).toBe('excellent');
      expect(api.get).toHaveBeenCalledWith('/customers/101/credit-grade');
    });

    test('should show grade breakdown factors', async () => {
      const mockGrade = {
        grade: 'E',
        score: 20,
        factors: {
          paymentHistory: 'poor',
          utilizationRatio: 'critical',
          dso: 'critical',
          financialHealth: 'weak',
        },
      };
      api.get.mockResolvedValueOnce({ data: mockGrade });

      const result = await customerCreditService.getCreditGrade(101);

      expect(result.factors.dso).toBe('critical');
      expect(result.factors.utilizationRatio).toBe('critical');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(customerCreditService.getHighRiskCustomers()).rejects.toThrow('Network error');
    });

    test('should handle customer not found', async () => {
      api.get.mockRejectedValueOnce(new Error('Customer not found'));

      await expect(customerCreditService.getCustomerCreditSummary(999)).rejects.toThrow('Customer not found');
    });

    test('should handle invalid limit values', async () => {
      api.put.mockRejectedValueOnce(new Error('Invalid limit value'));

      await expect(customerCreditService.adjustCreditLimit(101, -100000, 'test')).rejects.toThrow(
        'Invalid limit value',
      );
    });
  });

  describe('Credit Monitoring', () => {
    test('should track credit utilization percentage', async () => {
      const mockSummary = {
        creditLimit: 100000,
        creditUtilization: 75000,
        utilizationPercent: 75,
      };
      api.get.mockResolvedValueOnce({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(101);

      expect(result.utilizationPercent).toBe(75);
      expect((result.creditUtilization / result.creditLimit) * 100).toBe(75);
    });

    test('should alert on threshold breach', async () => {
      const mockSummary = {
        creditLimit: 100000,
        creditUtilization: 95000,
        utilizationPercent: 95,
        alerts: ['Credit limit threshold at 95%'],
      };
      api.get.mockResolvedValueOnce({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(101);

      expect(result.alerts).toContain('Credit limit threshold at 95%');
    });
  });
});
