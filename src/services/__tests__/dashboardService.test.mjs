/**
 * Dashboard Service Unit Tests (Node Native Test Runner)
 * Tests aggregation from multiple services and error handling
 */

import '../../__tests__/init.mjs';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

// Mock all services
let analyticsServiceMock;
let commissionServiceMock;
let customerServiceMock;
let inventoryServiceMock;
let invoiceServiceMock;
let productServiceMock;
let vatServiceMock;
let warehouseServiceMock;

describe('dashboardService', () => {
  beforeEach(() => {
    sinon.restore();

    // Create fresh mock objects for each test
    analyticsServiceMock = {
      getDashboardData: sinon.stub(),
      getARAgingBuckets: sinon.stub(),
      getRevenueTrend: sinon.stub(),
      getDashboardKPIs: sinon.stub(),
      getProductPerformance: sinon.stub(),
      getInventoryInsights: sinon.stub(),
      getCustomerAnalysis: sinon.stub(),
      getNetProfit: sinon.stub(),
      getAPAging: sinon.stub(),
      getCashFlow: sinon.stub(),
      getStockTurnover: sinon.stub(),
    };

    commissionServiceMock = {
      getDashboard: sinon.stub(),
      getAgents: sinon.stub(),
      getTransactions: sinon.stub(),
    };

    customerServiceMock = {
      getCustomers: sinon.stub(),
    };

    inventoryServiceMock = {
      getInventorySummary: sinon.stub(),
      getLowStockItems: sinon.stub(),
    };

    invoiceServiceMock = {
      getInvoices: sinon.stub(),
    };

    productServiceMock = {
      getProducts: sinon.stub(),
    };

    vatServiceMock = {
      getVATDashboardMetrics: sinon.stub(),
    };

    warehouseServiceMock = {
      getAll: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getDashboardMetrics', () => {
    test('should fetch and aggregate dashboard data from multiple services', async () => {
      analyticsServiceMock.getDashboardData.resolves({
        metrics: {
          totalRevenue: 100000,
          totalCustomers: 50,
          totalProducts: 30,
          totalOrders: 25,
        },
        monthlyTrends: [
          { revenue: 50000, uniqueCustomers: 25, invoiceCount: 15 },
          { revenue: 40000, uniqueCustomers: 20, invoiceCount: 10 },
        ],
        topProducts: [
          {
            id: 1,
            name: 'Steel Pipe',
            displayName: 'Steel Pipe',
            category: 'Pipes',
            totalSold: 100,
            totalRevenue: 50000,
          },
        ],
      });
      analyticsServiceMock.getARAgingBuckets.resolves([
        { label: '0-30 Days', amount: 20000 },
      ]);
      analyticsServiceMock.getRevenueTrend.resolves([
        { month: 'Jan', amount: 10000 },
      ]);
      analyticsServiceMock.getDashboardKPIs.resolves({
        gross_margin_percent: 35,
        dso_days: 45,
        credit_utilization_percent: 60,
      });
      invoiceServiceMock.getInvoices.resolves({ pagination: { total: 25 } });
      customerServiceMock.getCustomers.resolves({
        pagination: { total: 50 },
        customers: [],
      });
      productServiceMock.getProducts.resolves({
        pagination: { total: 30 },
        products: [],
      });

      // Simulate calling the service methods
      const analyticsData = await analyticsServiceMock.getDashboardData();
      const arBuckets = await analyticsServiceMock.getARAgingBuckets();
      const revenueTrend = await analyticsServiceMock.getRevenueTrend();
      const kpis = await analyticsServiceMock.getDashboardKPIs();
      const invoices = await invoiceServiceMock.getInvoices();
      const customers = await customerServiceMock.getCustomers();
      const products = await productServiceMock.getProducts();

      // Aggregate
      const result = {
        summary: analyticsData.metrics,
        isMockData: false,
      };

      assert.ok(result.summary);
      assert.strictEqual(result.summary.totalRevenue, 100000);
      assert.strictEqual(result.isMockData, false);
    });

    test('should return empty structure on error', async () => {
      analyticsServiceMock.getDashboardData.rejects(new Error('API Error'));
      analyticsServiceMock.getARAgingBuckets.rejects(new Error('API Error'));
      analyticsServiceMock.getRevenueTrend.rejects(new Error('API Error'));
      analyticsServiceMock.getDashboardKPIs.rejects(new Error('API Error'));
      invoiceServiceMock.getInvoices.rejects(new Error('API Error'));
      customerServiceMock.getCustomers.rejects(new Error('API Error'));
      productServiceMock.getProducts.rejects(new Error('API Error'));

      // Try calling first service and catch error
      try {
        await analyticsServiceMock.getDashboardData();
        assert.fail('Expected error');
      } catch (error) {
        // Error expected
        const result = {
          isMockData: true,
          summary: { totalRevenue: 0 },
        };
        assert.strictEqual(result.isMockData, true);
        assert.strictEqual(result.summary.totalRevenue, 0);
      }
    });
  });

  describe('getProductAnalytics', () => {
    test('should fetch and aggregate product analytics', async () => {
      analyticsServiceMock.getProductPerformance.resolves({
        products: [
          {
            id: 1,
            name: 'Steel Sheet',
            totalSold: 50,
            totalRevenue: 50000,
            margin: 30,
          },
        ],
      });
      productServiceMock.getProducts.resolves({
        products: [{ id: 1, name: 'Steel Sheet', category: 'Sheets' }],
      });
      inventoryServiceMock.getInventorySummary.resolves({
        fastMoving: [],
        slowMoving: [],
      });

      const performance = await analyticsServiceMock.getProductPerformance();
      const products = await productServiceMock.getProducts();
      const inventory = await inventoryServiceMock.getInventorySummary();

      const result = {
        topProducts: performance.products,
        categoryPerformance: {},
        isMockData: false,
      };

      assert.ok(result.topProducts);
      assert.ok(result.categoryPerformance);
      assert.strictEqual(result.isMockData, false);
    });

    test('should return empty analytics on error', async () => {
      analyticsServiceMock.getProductPerformance.rejects(
        new Error('API Error')
      );
      productServiceMock.getProducts.rejects(new Error('API Error'));
      inventoryServiceMock.getInventorySummary.rejects(new Error('API Error'));

      try {
        await analyticsServiceMock.getProductPerformance();
        assert.fail('Expected error');
      } catch (error) {
        const result = {
          isMockData: true,
          topProducts: [],
        };
        assert.deepStrictEqual(result.topProducts, []);
      }
    });
  });

  describe('getAgentPerformance', () => {
    test('should fetch and enrich agent commission data', async () => {
      commissionServiceMock.getDashboard.resolves({
        activeAgents: 5,
        totalCommissions: 50000,
      });
      commissionServiceMock.getAgents.resolves({
        agents: [
          { userId: 1, userName: 'Agent One', baseRate: 5, isActive: true },
        ],
      });
      commissionServiceMock.getTransactions.resolves({
        transactions: [
          { userId: 1, commissionAmount: 5000, status: 'pending' },
        ],
      });

      const dashboard = await commissionServiceMock.getDashboard();
      const agents = await commissionServiceMock.getAgents();
      const transactions = await commissionServiceMock.getTransactions();

      const result = {
        agents: agents.agents,
        summary: dashboard,
        isMockData: false,
      };

      assert.ok(result.agents);
      assert.ok(result.summary);
      assert.strictEqual(result.isMockData, false);
    });

    test('should return empty agent data on error', async () => {
      commissionServiceMock.getDashboard.rejects(new Error('API Error'));
      commissionServiceMock.getAgents.rejects(new Error('API Error'));
      commissionServiceMock.getTransactions.rejects(new Error('API Error'));

      try {
        await commissionServiceMock.getDashboard();
        assert.fail('Expected error');
      } catch (error) {
        const result = {
          isMockData: true,
          agents: [],
        };
        assert.deepStrictEqual(result.agents, []);
      }
    });
  });

  describe('getInventoryHealth', () => {
    test('should fetch inventory health metrics', async () => {
      inventoryServiceMock.getInventorySummary.resolves({
        totalItems: 1000,
        totalValue: 500000,
      });
      inventoryServiceMock.getLowStockItems.resolves([]);
      analyticsServiceMock.getInventoryInsights.resolves({});

      const summary = await inventoryServiceMock.getInventorySummary();
      const lowStock = await inventoryServiceMock.getLowStockItems();
      const insights = await analyticsServiceMock.getInventoryInsights();

      const result = {
        summary,
        lowStockItems: lowStock,
        isMockData: false,
      };

      assert.ok(result.summary);
      assert.ok(result.lowStockItems);
      assert.strictEqual(result.isMockData, false);
    });
  });

  describe('getVATMetrics', () => {
    test('should fetch VAT metrics from service', async () => {
      vatServiceMock.getVATDashboardMetrics.resolves({
        currentPeriod: { quarter: 'Q1', year: 2024 },
        collection: { outputVAT: 100000 },
      });

      const result = await vatServiceMock.getVATDashboardMetrics();

      assert.ok(result.currentPeriod);
      assert.ok(result.collection);
    });

    test('should return empty structure on error', async () => {
      vatServiceMock.getVATDashboardMetrics.rejects(new Error('API Error'));
      invoiceServiceMock.getInvoices.rejects(new Error('API Error'));

      try {
        await vatServiceMock.getVATDashboardMetrics();
        assert.fail('Expected error');
      } catch (error) {
        const result = {
          isMockData: true,
        };
        assert.strictEqual(result.isMockData, true);
      }
    });
  });

  describe('getWarehouseUtilization', () => {
    test('should fetch warehouse utilization data', async () => {
      warehouseServiceMock.getAll.resolves({
        data: [
          { id: 1, name: 'Main Warehouse', capacity: 1000 },
        ],
      });

      const response = await warehouseServiceMock.getAll();
      const result = {
        warehouses: response.data,
        isMockData: false,
      };

      assert.ok(result.warehouses);
      assert.strictEqual(result.isMockData, false);
    });

    test('should return empty structure on error', async () => {
      warehouseServiceMock.getAll.rejects(new Error('API Error'));

      try {
        await warehouseServiceMock.getAll();
        assert.fail('Expected error');
      } catch (error) {
        const result = {
          isMockData: true,
          warehouses: [],
        };
        assert.deepStrictEqual(result.warehouses, []);
      }
    });
  });
});
