/**
 * Analytics Service Unit Tests (Node Native Test Runner)
 * Tests analytics and reporting functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../api.js';
import { analyticsService } from '../analyticsService.js';

describe('analyticsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should fetch dashboard metrics', async () => {
      const mockMetrics = {
        totalRevenue: 500000,
        totalOrders: 150,
        activeCustomers: 45,
        avgOrderValue: 3333,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockMetrics);

      const result = await analyticsService.getDashboardData();

      expect(result.totalRevenue).toBe(500000);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/dashboard', {});
    });

    it('should handle empty metrics', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({});

      const result = await analyticsService.getDashboardData();

      expect(result !== undefined).toBeTruthy();
    });
  });

  describe('getSalesAnalytics', () => {
    it('should fetch sales analytics', async () => {
      const mockData = {
        dailySales: [
          { date: '2026-01-01', amount: 10000 },
          { date: '2026-01-02', amount: 12000 },
        ],
        topProducts: [
          { productId: 1, sales: 50000 },
        ],
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockData);

      const result = await analyticsService.getSalesTrends({ period: 'month' });

      expect(Array.isArray(result.dailySales)).toBeTruthy();
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should fetch customer analytics', async () => {
      const mockData = {
        totalCustomers: 150,
        newCustomers: 25,
        churnRate: 5,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockData);

      const result = await analyticsService.getCustomerAnalysis();

      expect(result.totalCustomers).toBe(150);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should fetch revenue analytics', async () => {
      const mockData = {
        monthlyRevenue: 500000,
        yearlyRevenue: 6000000,
        growth: 15,
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockData);

      const result = await analyticsService.getRevenueMetrics();

      expect(result.monthlyRevenue).toBe(500000);
      expect(apiClient.get.mock.calls.length > 0).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('API Error'));

      try {
        await analyticsService.getDashboardData();
        throw new Error('Expected error');
      } catch (error) {
        expect(error.message).toBe('API Error');
      }
    });
  });
});
