import { analyticsService } from './analyticsService';
import { invoiceService } from './invoiceService';
import { inventoryService } from './inventoryService';
import { customerService } from './customerService';
import { productService } from './productService';
import { apiClient } from './api';

// ============================================================================
// CACHE CONFIGURATION (Stale-While-Revalidate Pattern)
// ============================================================================

const CACHE_KEYS = {
  DASHBOARD_METRICS: 'dashboard_metrics_cache',
  PRODUCT_ANALYTICS: 'dashboard_product_analytics_cache',
  AGENT_PERFORMANCE: 'dashboard_agent_performance_cache',
  INVENTORY_HEALTH: 'dashboard_inventory_health_cache',
  VAT_METRICS: 'dashboard_vat_metrics_cache',
  CUSTOMER_INSIGHTS: 'dashboard_customer_insights_cache',
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data from localStorage
 */
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (error) {
    console.warn('Dashboard cache read error:', error);
    return null;
  }
};

/**
 * Set cached data in localStorage
 */
const setCachedData = (key, data) => {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('Dashboard cache write error:', error);
  }
};

/**
 * Check if cached data is stale
 */
const isCacheStale = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TTL_MS;
};

/**
 * Clear all dashboard caches
 */
const clearAllCaches = () => {
  Object.values(CACHE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Dashboard cache clear error:', error);
    }
  });
};

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock sales agent performance data
 * TODO: Replace with real API endpoint when backend supports it
 */
const generateMockAgentPerformance = () => {
  const agents = [
    { id: 1, name: 'Ahmed Hassan', avatar: null },
    { id: 2, name: 'Sara Mohammed', avatar: null },
    { id: 3, name: 'Khalid Al-Rashid', avatar: null },
    { id: 4, name: 'Fatima Omar', avatar: null },
    { id: 5, name: 'Mohammad Ali', avatar: null },
  ];

  return agents.map((agent, index) => ({
    ...agent,
    rank: index + 1,
    totalSales: Math.floor(Math.random() * 500000) + 100000,
    invoiceCount: Math.floor(Math.random() * 50) + 10,
    avgDealSize: Math.floor(Math.random() * 15000) + 5000,
    conversionRate: Math.floor(Math.random() * 30) + 50,
    commission: {
      earned: Math.floor(Math.random() * 25000) + 5000,
      pending: Math.floor(Math.random() * 10000) + 2000,
    },
    target: {
      amount: 400000,
      achieved: Math.floor(Math.random() * 400000) + 100000,
      percentage: Math.floor(Math.random() * 40) + 60,
    },
    newCustomers: Math.floor(Math.random() * 10) + 2,
    activeDeals: Math.floor(Math.random() * 15) + 5,
  }));
};

/**
 * Generate mock VAT metrics data
 * TODO: Replace with real API endpoint from VAT service
 */
const generateMockVATMetrics = () => {
  const currentDate = new Date();
  const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
  const currentYear = currentDate.getFullYear();

  return {
    currentPeriod: {
      quarter: `Q${currentQuarter}`,
      year: currentYear,
      startDate: new Date(currentYear, (currentQuarter - 1) * 3, 1).toISOString(),
      endDate: new Date(currentYear, currentQuarter * 3, 0).toISOString(),
    },
    collection: {
      outputVAT: Math.floor(Math.random() * 150000) + 50000,
      inputVAT: Math.floor(Math.random() * 100000) + 30000,
      netPayable: 0, // Calculated below
      adjustments: Math.floor(Math.random() * 5000) - 2500,
    },
    returnStatus: {
      status: ['pending', 'submitted', 'approved'][Math.floor(Math.random() * 3)],
      dueDate: new Date(currentYear, currentQuarter * 3 + 1, 28).toISOString(),
      daysRemaining: Math.floor(Math.random() * 30) + 1,
      filedDate: null,
    },
    compliance: {
      invoicesWithVAT: Math.floor(Math.random() * 200) + 50,
      invoicesWithoutVAT: Math.floor(Math.random() * 10),
      zeroRatedSales: Math.floor(Math.random() * 50000) + 10000,
      exemptSales: Math.floor(Math.random() * 20000) + 5000,
    },
    alerts: [
      { type: 'warning', message: 'VAT return due in 15 days', severity: 'medium' },
    ],
    history: Array.from({ length: 4 }, (_, i) => ({
      quarter: `Q${((currentQuarter - i - 1 + 4) % 4) + 1}`,
      year: currentQuarter - i <= 0 ? currentYear - 1 : currentYear,
      outputVAT: Math.floor(Math.random() * 150000) + 50000,
      inputVAT: Math.floor(Math.random() * 100000) + 30000,
      netPaid: Math.floor(Math.random() * 50000) + 10000,
      status: 'paid',
    })),
  };
};

/**
 * Generate mock customer insights data
 * TODO: Enhance with real CLV calculations from backend
 */
const generateMockCustomerInsights = (customers = []) => {
  const topCustomers = customers.slice(0, 10).map((customer) => ({
    id: customer.id,
    name: customer.name || customer.companyName,
    totalRevenue: Math.floor(Math.random() * 500000) + 50000,
    invoiceCount: Math.floor(Math.random() * 50) + 5,
    avgOrderValue: Math.floor(Math.random() * 20000) + 5000,
    clv: Math.floor(Math.random() * 1000000) + 100000,
    lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    riskScore: Math.floor(Math.random() * 100),
    segment: ['Premium', 'Standard', 'New'][Math.floor(Math.random() * 3)],
  }));

  const atRiskCustomers = topCustomers
    .filter((c) => c.riskScore > 70)
    .map((c) => ({
      ...c,
      riskReason: ['No orders in 60 days', 'Payment overdue', 'Declining order value'][
        Math.floor(Math.random() * 3)
      ],
      daysInactive: Math.floor(Math.random() * 60) + 30,
    }));

  const segments = {
    premium: topCustomers.filter((c) => c.segment === 'Premium').length,
    standard: topCustomers.filter((c) => c.segment === 'Standard').length,
    new: topCustomers.filter((c) => c.segment === 'New').length,
  };

  return {
    topCustomers,
    atRiskCustomers,
    segments,
    newCustomersThisMonth: Math.floor(Math.random() * 15) + 5,
    churnRate: Math.floor(Math.random() * 10) + 2,
    avgCLV: topCustomers.reduce((sum, c) => sum + c.clv, 0) / (topCustomers.length || 1),
  };
};

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export const dashboardService = {
  // Cache utilities exposed for external use
  cache: {
    KEYS: CACHE_KEYS,
    get: getCachedData,
    set: setCachedData,
    isStale: isCacheStale,
    clearAll: clearAllCaches,
  },

  /**
   * Get all dashboard metrics in a single call
   * Aggregates data from multiple services with caching
   *
   * @param {Object} options - Options for fetching
   * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Aggregated dashboard metrics
   */
  async getDashboardMetrics(options = {}) {
    const { forceRefresh = false } = options;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEYS.DASHBOARD_METRICS);
      if (cached && !isCacheStale(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      // Fetch all data in parallel
      const [
        dashboardData,
        arAgingData,
        revenueTrendData,
        dashboardKPIs,
      ] = await Promise.all([
        analyticsService.getDashboardData().catch(() => ({})),
        analyticsService.getARAgingBuckets().catch(() => null),
        analyticsService.getRevenueTrend(12).catch(() => null),
        analyticsService.getDashboardKPIs().catch(() => null),
      ]);

      const safeNum = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };

      // Extract metrics
      const totalRevenue = safeNum(dashboardData?.revenueMetrics?.totalRevenue);
      const totalCustomers = parseInt(dashboardData?.customerMetrics?.totalCustomers || 0);
      const totalProducts = parseInt(dashboardData?.productMetrics?.totalProducts || 0);
      const totalInvoices = parseInt(dashboardData?.revenueMetrics?.totalInvoices || 0);

      // Calculate month-over-month changes
      const trends = Array.isArray(dashboardData?.monthlyTrends)
        ? dashboardData.monthlyTrends
        : [];
      const current = trends[0] || {};
      const previous = trends[1] || {};

      const percentChange = (curr, prev) => {
        const c = safeNum(curr);
        const p = safeNum(prev);
        if (p === 0) return 0;
        return ((c - p) / p) * 100;
      };

      const metrics = {
        // Summary stats
        summary: {
          totalRevenue,
          totalCustomers,
          totalProducts,
          totalInvoices,
          revenueChange: percentChange(current?.revenue, previous?.revenue),
          customersChange: percentChange(current?.uniqueCustomers, previous?.uniqueCustomers),
          productsChange: 0,
          invoicesChange: percentChange(current?.invoiceCount, previous?.invoiceCount),
        },

        // KPIs
        kpis: dashboardKPIs ? {
          grossMargin: parseFloat(dashboardKPIs.gross_margin_percent) || 0,
          dso: parseFloat(dashboardKPIs.dso_days) || 0,
          creditUtilization: parseFloat(dashboardKPIs.credit_utilization_percent) || 0,
        } : {
          grossMargin: 0,
          dso: 0,
          creditUtilization: 0,
        },

        // AR Aging
        arAging: arAgingData,

        // Revenue Trend
        revenueTrend: revenueTrendData,

        // Top Products
        topProducts: Array.isArray(dashboardData?.topProducts)
          ? dashboardData.topProducts.slice(0, 5).map((p) => ({
              id: p.id,
              name: p.name,
              displayName: p.displayName || p.name,
              category: p.category,
              sales: safeNum(p.totalSold),
              revenue: safeNum(p.totalRevenue),
            }))
          : [],

        // Timestamp for freshness indicator
        fetchedAt: new Date().toISOString(),
      };

      // Cache the results
      setCachedData(CACHE_KEYS.DASHBOARD_METRICS, metrics);

      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Return cached data if available, even if stale
      const cached = getCachedData(CACHE_KEYS.DASHBOARD_METRICS);
      if (cached) {
        return { ...cached.data, isStale: true };
      }
      throw error;
    }
  },

  /**
   * Get product analytics data
   * Includes top products, margins, category performance
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Product analytics
   */
  async getProductAnalytics(options = {}) {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEYS.PRODUCT_ANALYTICS);
      if (cached && !isCacheStale(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      const [
        productPerformance,
        inventorySummary,
      ] = await Promise.all([
        analyticsService.getProductPerformance().catch(() => ({})),
        inventoryService.getInventorySummary().catch(() => ({})),
      ]);

      const safeNum = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };

      // Process top products
      const topProducts = Array.isArray(productPerformance?.products)
        ? productPerformance.products.slice(0, 10).map((p) => ({
            id: p.id,
            name: p.name,
            displayName: p.displayName || p.name,
            category: p.category,
            grade: p.grade,
            totalSold: safeNum(p.totalSold),
            totalRevenue: safeNum(p.totalRevenue),
            avgPrice: safeNum(p.avgPrice),
            margin: safeNum(p.margin),
          }))
        : [];

      // Category performance
      const categoryPerformance = {};
      topProducts.forEach((p) => {
        const cat = p.category || 'Uncategorized';
        if (!categoryPerformance[cat]) {
          categoryPerformance[cat] = {
            name: cat,
            totalRevenue: 0,
            totalSold: 0,
            productCount: 0,
          };
        }
        categoryPerformance[cat].totalRevenue += p.totalRevenue;
        categoryPerformance[cat].totalSold += p.totalSold;
        categoryPerformance[cat].productCount += 1;
      });

      // Fast/slow moving stock from inventory
      const fastMoving = inventorySummary?.fastMoving || [];
      const slowMoving = inventorySummary?.slowMoving || [];

      const analytics = {
        topProducts,
        categoryPerformance: Object.values(categoryPerformance),
        fastMoving,
        slowMoving,
        summary: {
          totalProductsSold: topProducts.reduce((sum, p) => sum + p.totalSold, 0),
          totalRevenue: topProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
          avgMargin: topProducts.length > 0
            ? topProducts.reduce((sum, p) => sum + p.margin, 0) / topProducts.length
            : 0,
        },
        fetchedAt: new Date().toISOString(),
      };

      setCachedData(CACHE_KEYS.PRODUCT_ANALYTICS, analytics);
      return analytics;
    } catch (error) {
      console.error('Error fetching product analytics:', error);
      const cached = getCachedData(CACHE_KEYS.PRODUCT_ANALYTICS);
      if (cached) {
        return { ...cached.data, isStale: true };
      }
      throw error;
    }
  },

  /**
   * Get sales agent performance metrics
   * Currently uses mock data - TODO: integrate with commission service
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Agent performance data
   */
  async getAgentPerformance(options = {}) {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEYS.AGENT_PERFORMANCE);
      if (cached && !isCacheStale(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      // TODO: Replace with real API call when backend supports it
      // const response = await apiClient.get('/analytics/agent-performance');

      // For now, use mock data
      const agents = generateMockAgentPerformance();

      const performance = {
        agents,
        leaderboard: agents.slice(0, 5),
        summary: {
          totalSalesTeam: agents.length,
          totalTeamRevenue: agents.reduce((sum, a) => sum + a.totalSales, 0),
          avgConversionRate: agents.reduce((sum, a) => sum + a.conversionRate, 0) / agents.length,
          totalCommissionPaid: agents.reduce((sum, a) => sum + a.commission.earned, 0),
          totalCommissionPending: agents.reduce((sum, a) => sum + a.commission.pending, 0),
        },
        isMockData: true, // Flag to indicate mock data
        fetchedAt: new Date().toISOString(),
      };

      setCachedData(CACHE_KEYS.AGENT_PERFORMANCE, performance);
      return performance;
    } catch (error) {
      console.error('Error fetching agent performance:', error);
      const cached = getCachedData(CACHE_KEYS.AGENT_PERFORMANCE);
      if (cached) {
        return { ...cached.data, isStale: true };
      }
      // Return mock data as fallback
      return {
        agents: generateMockAgentPerformance(),
        isMockData: true,
        isStale: true,
      };
    }
  },

  /**
   * Get inventory health metrics
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Inventory health data
   */
  async getInventoryHealth(options = {}) {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEYS.INVENTORY_HEALTH);
      if (cached && !isCacheStale(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      const [
        inventorySummary,
        lowStockItems,
        inventoryInsights,
      ] = await Promise.all([
        inventoryService.getInventorySummary().catch(() => ({})),
        inventoryService.getLowStockItems().catch(() => []),
        analyticsService.getInventoryInsights().catch(() => ({})),
      ]);

      const safeNum = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };

      const health = {
        summary: {
          totalItems: parseInt(inventorySummary?.totalItems || 0),
          totalValue: safeNum(inventorySummary?.totalValue),
          totalQuantity: safeNum(inventorySummary?.totalQuantity),
          lowStockCount: Array.isArray(lowStockItems) ? lowStockItems.length : 0,
          outOfStockCount: parseInt(inventorySummary?.outOfStockCount || 0),
        },
        lowStockItems: Array.isArray(lowStockItems) ? lowStockItems.slice(0, 10) : [],
        turnoverRate: safeNum(inventoryInsights?.turnoverRate),
        avgDaysToSell: safeNum(inventoryInsights?.avgDaysToSell),
        warehouseUtilization: inventoryInsights?.warehouseUtilization || [],
        reorderAlerts: inventorySummary?.reorderAlerts || [],
        fetchedAt: new Date().toISOString(),
      };

      setCachedData(CACHE_KEYS.INVENTORY_HEALTH, health);
      return health;
    } catch (error) {
      console.error('Error fetching inventory health:', error);
      const cached = getCachedData(CACHE_KEYS.INVENTORY_HEALTH);
      if (cached) {
        return { ...cached.data, isStale: true };
      }
      throw error;
    }
  },

  /**
   * Get VAT compliance metrics
   * Currently uses mock data - TODO: integrate with VAT return service
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} VAT metrics
   */
  async getVATMetrics(options = {}) {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEYS.VAT_METRICS);
      if (cached && !isCacheStale(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      // TODO: Replace with real API call when VAT service supports it
      // const response = await apiClient.get('/vat/metrics');

      // For now, use mock data
      const vatData = generateMockVATMetrics();

      // Calculate net payable
      vatData.collection.netPayable =
        vatData.collection.outputVAT -
        vatData.collection.inputVAT +
        vatData.collection.adjustments;

      const metrics = {
        ...vatData,
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };

      setCachedData(CACHE_KEYS.VAT_METRICS, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching VAT metrics:', error);
      const cached = getCachedData(CACHE_KEYS.VAT_METRICS);
      if (cached) {
        return { ...cached.data, isStale: true };
      }
      return {
        ...generateMockVATMetrics(),
        isMockData: true,
        isStale: true,
      };
    }
  },

  /**
   * Get customer insights
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Customer insights
   */
  async getCustomerInsights(options = {}) {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cached = getCachedData(CACHE_KEYS.CUSTOMER_INSIGHTS);
      if (cached && !isCacheStale(cached.timestamp)) {
        return cached.data;
      }
    }

    try {
      const [
        customerAnalysis,
        customerList,
      ] = await Promise.all([
        analyticsService.getCustomerAnalysis().catch(() => ({})),
        customerService.getCustomers({ limit: 100 }).catch(() => ({ customers: [] })),
      ]);

      const customers = customerList?.customers || [];

      // Generate insights (mix of real and mock data)
      const insights = generateMockCustomerInsights(customers);

      // Merge with real analytics if available
      if (customerAnalysis?.topCustomers) {
        insights.topCustomers = customerAnalysis.topCustomers;
      }

      const result = {
        ...insights,
        totalCustomers: customers.length,
        fetchedAt: new Date().toISOString(),
      };

      setCachedData(CACHE_KEYS.CUSTOMER_INSIGHTS, result);
      return result;
    } catch (error) {
      console.error('Error fetching customer insights:', error);
      const cached = getCachedData(CACHE_KEYS.CUSTOMER_INSIGHTS);
      if (cached) {
        return { ...cached.data, isStale: true };
      }
      return {
        ...generateMockCustomerInsights([]),
        isStale: true,
      };
    }
  },

  /**
   * Refresh all dashboard data
   * Force-refreshes all cached data
   */
  async refreshAll() {
    clearAllCaches();
    return Promise.all([
      this.getDashboardMetrics({ forceRefresh: true }),
      this.getProductAnalytics({ forceRefresh: true }),
      this.getAgentPerformance({ forceRefresh: true }),
      this.getInventoryHealth({ forceRefresh: true }),
      this.getVATMetrics({ forceRefresh: true }),
      this.getCustomerInsights({ forceRefresh: true }),
    ]);
  },
};

export default dashboardService;
