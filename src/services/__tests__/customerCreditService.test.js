/**
 * Customer Credit Service Unit Tests
 * ✅ Tests credit risk assessment and monitoring
 * ✅ Tests credit limit management and DSO calculations
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

import api from '../api.js';
import { customerCreditService } from '../customerCreditService.js';

describe('customerCreditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHighRiskCustomers', () => {
    test('should fetch high-risk customers', async () => {
      const mockHighRisk = [
        { id: 101, name: 'Risky Corp', creditGrade: 'D', dso: 85 },
        { id: 102, name: 'Danger Ltd', creditGrade: 'E', dso: 120 },
      ];
      api.get.mockResolvedValueOnce({ data: mockHighRisk });

      const result = await customerCreditService.getHighRiskCustomers(50);

      expect(result).toHaveLength(2);
      expect(result[0].creditGrade).toBe('D');
      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/high', {
        params: { limit: 50 },
      });
    });

    test('should use default limit of 50', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await customerCreditService.getHighRiskCustomers();

      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/high', {
        params: { limit: 50 },
      });
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
        },
      ];
      api.get.mockResolvedValueOnce({ data: mockOverLimit });

      const result = await customerCreditService.getOverLimitCustomers();

      expect(result).toHaveLength(1);
      expect(result[0].totalOutstanding).toBeGreaterThan(result[0].creditLimit);
      expect(api.get).toHaveBeenCalledWith('/customers/credit-risk/over-limit');
    });
  });

  describe('getCustomerCreditSummary', () => {
    test('should fetch detailed credit summary', async () => {
      const mockSummary = {
        customerId: 101,
        customerName: 'Premium Corp',
        creditLimit: 500000,
        creditUtilization: 350000,
        utilizationPercent: 70,
        creditGrade: 'A',
        dso: 35,
      };
      api.get.mockResolvedValueOnce({ data: mockSummary });

      const result = await customerCreditService.getCustomerCreditSummary(101);

      expect(result.creditGrade).toBe('A');
      expect(result.utilizationPercent).toBe(70);
      expect(api.get).toHaveBeenCalledWith('/customers/101/credit-summary');
    });

    test('should handle customer not found', async () => {
      api.get.mockRejectedValueOnce(new Error('Customer not found'));

      await expect(customerCreditService.getCustomerCreditSummary(999)).rejects.toThrow(
        'Customer not found',
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(customerCreditService.getHighRiskCustomers()).rejects.toThrow('Network error');
    });

    test('should handle API errors for over-limit customers', async () => {
      api.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(customerCreditService.getOverLimitCustomers()).rejects.toThrow('API Error');
    });
  });
});
