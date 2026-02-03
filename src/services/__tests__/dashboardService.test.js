import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dashboardService } from '../dashboardService';
import { analyticsService } from '../analyticsService';
import { commissionService } from '../commissionService';
import { customerService } from '../customerService';
import { inventoryService } from '../inventoryService';
import { invoiceService } from '../invoiceService';
import { productService } from '../productService';
import { vatService } from '../vatService';
import { warehouseService } from '../warehouseService';

vi.mock("../analyticsService);
vi.mock("../commissionService);
vi.mock("../customerService);
vi.mock("../inventoryService);
vi.mock("../invoiceService);
vi.mock("../productService);
vi.mock("../vatService);
vi.mock("../warehouseService);

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should fetch and aggregate dashboard data from multiple services', async () => {
      analyticsService.getDashboardData.mockResolvedValue({
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
          { id: 1, name: 'Steel Pipe', displayName: 'Steel Pipe', category: 'Pipes', totalSold: 100, totalRevenue: 50000 },
        ],
      });
      analyticsService.getARAgingBuckets.mockResolvedValue([
        { label: '0-30 Days', amount: 20000 },
      ]);
      analyticsService.getRevenueTrend.mockResolvedValue([
        { month: 'Jan', amount: 10000 },
      ]);
      analyticsService.getDashboardKPIs.mockResolvedValue({
        gross_margin_percent: 35,
        dso_days: 45,
        credit_utilization_percent: 60,
      });
      invoiceService.getInvoices.mockResolvedValue({ pagination: { total: 25 } });
      customerService.getCustomers.mockResolvedValue({
        pagination: { total: 50 },
        customers: [],
      });
      productService.getProducts.mockResolvedValue({
        pagination: { total: 30 },
        products: [],
      });

      const result = await dashboardService.getDashboardMetrics();

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('isMockData', false);
    });

    it('should return empty structure on error', async () => {
      analyticsService.getDashboardData.mockRejectedValue(new Error('API Error'));
      analyticsService.getARAgingBuckets.mockRejectedValue(new Error('API Error'));
      analyticsService.getRevenueTrend.mockRejectedValue(new Error('API Error'));
      analyticsService.getDashboardKPIs.mockRejectedValue(new Error('API Error'));
      invoiceService.getInvoices.mockRejectedValue(new Error('API Error'));
      customerService.getCustomers.mockRejectedValue(new Error('API Error'));
      productService.getProducts.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getDashboardMetrics();

      expect(result.isMockData).toBe(true);
      expect(result.summary.totalRevenue).toBe(0);
    });
  });

  describe('getProductAnalytics', () => {
    it('should fetch and aggregate product analytics', async () => {
      analyticsService.getProductPerformance.mockResolvedValue({
        products: [
          { id: 1, name: 'Steel Sheet', totalSold: 50, totalRevenue: 50000, margin: 30 },
        ],
      });
      productService.getProducts.mockResolvedValue({
        products: [{ id: 1, name: 'Steel Sheet', category: 'Sheets' }],
      });
      inventoryService.getInventorySummary.mockResolvedValue({
        fastMoving: [],
        slowMoving: [],
      });

      const result = await dashboardService.getProductAnalytics();

      expect(result).toHaveProperty('topProducts');
      expect(result).toHaveProperty('categoryPerformance');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty analytics on error', async () => {
      analyticsService.getProductPerformance.mockRejectedValue(new Error('API Error'));
      productService.getProducts.mockRejectedValue(new Error('API Error'));
      inventoryService.getInventorySummary.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getProductAnalytics();

      expect(result.isMockData).toBe(true);
      expect(result.topProducts).toEqual([]);
    });
  });

  describe('getAgentPerformance', () => {
    it('should fetch and enrich agent commission data', async () => {
      commissionService.getDashboard.mockResolvedValue({
        activeAgents: 5,
        totalCommissions: 50000,
      });
      commissionService.getAgents.mockResolvedValue({
        agents: [
          { userId: 1, userName: 'Agent One', baseRate: 5, isActive: true },
        ],
      });
      commissionService.getTransactions.mockResolvedValue({
        transactions: [
          { userId: 1, commissionAmount: 5000, status: 'pending' },
        ],
      });

      const result = await dashboardService.getAgentPerformance();

      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('summary');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty agent data on error', async () => {
      commissionService.getDashboard.mockRejectedValue(new Error('API Error'));
      commissionService.getAgents.mockRejectedValue(new Error('API Error'));
      commissionService.getTransactions.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getAgentPerformance();

      expect(result.isMockData).toBe(true);
      expect(result.agents).toEqual([]);
    });
  });

  describe('getInventoryHealth', () => {
    it('should fetch inventory health metrics', async () => {
      inventoryService.getInventorySummary.mockResolvedValue({
        totalItems: 1000,
        totalValue: 500000,
      });
      inventoryService.getLowStockItems.mockResolvedValue([]);
      analyticsService.getInventoryInsights.mockResolvedValue({});

      const result = await dashboardService.getInventoryHealth();

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('lowStockItems');
      expect(result.isMockData).toBe(false);
    });

    it('should throw error on failure', async () => {
      inventoryService.getInventorySummary.mockRejectedValue(new Error('API Error'));
      inventoryService.getLowStockItems.mockRejectedValue(new Error('API Error'));
      analyticsService.getInventoryInsights.mockRejectedValue(new Error('API Error'));

      await expect(dashboardService.getInventoryHealth()).rejects.toThrow();
    });
  });

  describe('getVATMetrics', () => {
    it('should fetch VAT metrics from service', async () => {
      vatService.getVATDashboardMetrics.mockResolvedValue({
        currentPeriod: { quarter: 'Q1', year: 2024 },
        collection: { outputVAT: 100000 },
      });

      const result = await dashboardService.getVATMetrics();

      expect(result).toHaveProperty('currentPeriod');
      expect(result).toHaveProperty('collection');
    });

    it('should return empty structure on error', async () => {
      vatService.getVATDashboardMetrics.mockRejectedValue(new Error('API Error'));
      invoiceService.getInvoices.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getVATMetrics();

      expect(result.isMockData).toBe(true);
    });
  });

  describe('getCustomerInsights', () => {
    it('should fetch and enrich customer data', async () => {
      analyticsService.getCustomerAnalysis.mockResolvedValue({});
      customerService.getCustomers.mockResolvedValue({
        customers: [{ id: 1, name: 'Customer One', email: 'test@example.com' }],
      });
      invoiceService.getInvoices.mockResolvedValue({
        invoices: [{ customerId: 1, total: 50000 }],
      });

      const result = await dashboardService.getCustomerInsights();

      expect(result).toHaveProperty('topCustomers');
      expect(result).toHaveProperty('segments');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty structure on error', async () => {
      analyticsService.getCustomerAnalysis.mockRejectedValue(new Error('API Error'));
      customerService.getCustomers.mockRejectedValue(new Error('API Error'));
      invoiceService.getInvoices.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getCustomerInsights();

      expect(result.isMockData).toBe(true);
      expect(result.topCustomers).toEqual([]);
    });
  });

  describe('getNetProfit', () => {
    it('should fetch net profit data', async () => {
      analyticsService.getNetProfit.mockResolvedValue({
        revenue: 500000,
        net_profit: 100000,
      });

      const result = await dashboardService.getNetProfit();

      expect(result).toHaveProperty('revenue', 500000);
      expect(result.isMockData).toBe(false);
    });

    it('should return empty structure on error', async () => {
      analyticsService.getNetProfit.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getNetProfit();

      expect(result.isMockData).toBe(true);
    });
  });

  describe('getAPAging', () => {
    it('should fetch AP aging buckets', async () => {
      analyticsService.getAPAging.mockResolvedValue({
        buckets: [{ label: '0-30 Days', amount: 100000 }],
        total_ap: 200000,
      });

      const result = await dashboardService.getAPAging();

      expect(result).toHaveProperty('buckets');
      expect(result).toHaveProperty('totalAP');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty structure on error', async () => {
      analyticsService.getAPAging.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getAPAging();

      expect(result.isMockData).toBe(true);
      expect(result.buckets).toEqual([]);
    });
  });

  describe('getCashFlow', () => {
    it('should fetch cash flow data', async () => {
      analyticsService.getCashFlow.mockResolvedValue({
        mtd: { inflow: 100000, outflow: 80000 },
      });

      const result = await dashboardService.getCashFlow();

      expect(result).toHaveProperty('mtd');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty structure on error', async () => {
      analyticsService.getCashFlow.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getCashFlow();

      expect(result.isMockData).toBe(true);
    });
  });

  describe('getStockTurnover', () => {
    it('should fetch stock turnover data', async () => {
      analyticsService.getStockTurnover.mockResolvedValue({
        by_category: [{ name: 'Pipes', turnover_ratio: 3.5 }],
        overall_efficiency: 85,
      });

      const result = await dashboardService.getStockTurnover();

      expect(result).toHaveProperty('products');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty structure on error', async () => {
      analyticsService.getStockTurnover.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getStockTurnover();

      expect(result.isMockData).toBe(true);
    });
  });

  describe('getWarehouseUtilization', () => {
    it('should fetch warehouse utilization data', async () => {
      warehouseService.getAll.mockResolvedValue({
        data: [{ id: 1, name: 'Main Warehouse', capacity: 1000 }],
      });

      const result = await dashboardService.getWarehouseUtilization();

      expect(result).toHaveProperty('warehouses');
      expect(result.isMockData).toBe(false);
    });

    it('should return empty structure on error', async () => {
      warehouseService.getAll.mockRejectedValue(new Error('API Error'));

      const result = await dashboardService.getWarehouseUtilization();

      expect(result.isMockData).toBe(true);
      expect(result.warehouses).toEqual([]);
    });
  });

  describe('refreshAll', () => {
    it('should call all dashboard data fetchers in parallel', async () => {
      analyticsService.getDashboardData.mockResolvedValue({});
      analyticsService.getARAgingBuckets.mockResolvedValue([]);
      analyticsService.getRevenueTrend.mockResolvedValue([]);
      analyticsService.getDashboardKPIs.mockResolvedValue({});
      analyticsService.getProductPerformance.mockResolvedValue({});
      analyticsService.getCustomerAnalysis.mockResolvedValue({});
      analyticsService.getInventoryInsights.mockResolvedValue({});
      analyticsService.getNetProfit.mockResolvedValue({});
      analyticsService.getAPAging.mockResolvedValue({});
      analyticsService.getCashFlow.mockResolvedValue({});
      analyticsService.getStockTurnover.mockResolvedValue({});
      invoiceService.getInvoices.mockResolvedValue({});
      customerService.getCustomers.mockResolvedValue({});
      productService.getProducts.mockResolvedValue({});
      commissionService.getDashboard.mockResolvedValue({});
      commissionService.getAgents.mockResolvedValue({});
      commissionService.getTransactions.mockResolvedValue({});
      inventoryService.getInventorySummary.mockResolvedValue({});
      inventoryService.getLowStockItems.mockResolvedValue([]);
      vatService.getVATDashboardMetrics.mockResolvedValue({});
      warehouseService.getAll.mockResolvedValue({});

      const result = await dashboardService.refreshAll();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTabData', () => {
    it('should route to overview fetcher', async () => {
      analyticsService.getDashboardData.mockResolvedValue({});
      analyticsService.getARAgingBuckets.mockResolvedValue([]);
      analyticsService.getRevenueTrend.mockResolvedValue([]);
      analyticsService.getDashboardKPIs.mockResolvedValue({});
      invoiceService.getInvoices.mockResolvedValue({});
      customerService.getCustomers.mockResolvedValue({});
      productService.getProducts.mockResolvedValue({});

      const result = await dashboardService.getTabData('overview');

      expect(result).toHaveProperty('summary');
    });

    it('should throw error for unknown tab', async () => {
      await expect(dashboardService.getTabData('unknown')).rejects.toThrow('Unknown tab');
    });
  });
});
