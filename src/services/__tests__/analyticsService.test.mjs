/**
 * Analytics Service Unit Tests (Node Native Test Runner)
 * Tests analytics and reporting functionality
 */

import '../../__tests__/init.mjs';

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { apiClient } from '../api.js';
import { analyticsService } from '../analyticsService.js';

describe('analyticsService', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getDashboardMetrics', () => {
    test('should fetch dashboard metrics', async () => {
      const mockMetrics = {
        totalRevenue: 500000,
        totalOrders: 150,
        activeCustomers: 45,
        avgOrderValue: 3333,
      };
      sinon.stub(apiClient, 'get').resolves(mockMetrics);

      const result = await analyticsService.getDashboardMetrics();

      assert.strictEqual(result.totalRevenue, 500000);
      assert.ok(apiClient.get.calledWith('/analytics/dashboard'));
    });

    test('should handle empty metrics', async () => {
      sinon.stub(apiClient, 'get').resolves({});

      const result = await analyticsService.getDashboardMetrics();

      assert.ok(result !== undefined);
    });
  });

  describe('getSalesAnalytics', () => {
    test('should fetch sales analytics', async () => {
      const mockData = {
        dailySales: [
          { date: '2026-01-01', amount: 10000 },
          { date: '2026-01-02', amount: 12000 },
        ],
        topProducts: [
          { productId: 1, sales: 50000 },
        ],
      };
      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await analyticsService.getSalesAnalytics({ period: 'month' });

      assert.ok(Array.isArray(result.dailySales));
      assert.ok(apiClient.get.called);
    });
  });

  describe('getCustomerAnalytics', () => {
    test('should fetch customer analytics', async () => {
      const mockData = {
        totalCustomers: 150,
        newCustomers: 25,
        churnRate: 5,
      };
      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await analyticsService.getCustomerAnalytics();

      assert.strictEqual(result.totalCustomers, 150);
      assert.ok(apiClient.get.called);
    });
  });

  describe('getRevenueAnalytics', () => {
    test('should fetch revenue analytics', async () => {
      const mockData = {
        monthlyRevenue: 500000,
        yearlyRevenue: 6000000,
        growth: 15,
      };
      sinon.stub(apiClient, 'get').resolves(mockData);

      const result = await analyticsService.getRevenueAnalytics();

      assert.strictEqual(result.monthlyRevenue, 500000);
      assert.ok(apiClient.get.called);
    });
  });

  describe('error handling', () => {
    test('should handle API errors', async () => {
      sinon.stub(apiClient, 'get').rejects(new Error('API Error'));

      try {
        await analyticsService.getDashboardMetrics();
        assert.fail('Expected error');
      } catch (error) {
        assert.strictEqual(error.message, 'API Error');
      }
    });
  });
});
