/**
 * Dashboard Service - Unified Dashboard Data Aggregation
 *
 * This service aggregates data from multiple backend APIs to provide
 * a unified interface for dashboard components. Uses stale-while-revalidate
 * caching pattern for optimal UX.
 *
 * API Integration Status:
 * - Analytics: WIRED (via analyticsService)
 * - Commissions: WIRED (via commissionService)
 * - VAT: WIRED (via vatService)
 * - Inventory: WIRED (via inventoryService)
 * - Invoices: WIRED (via invoiceService)
 * - Customers: WIRED (via customerService)
 * - Products: WIRED (via productService)
 */

import { analyticsService } from "./analyticsService";
import { commissionService } from "./commissionService";
import { customerService } from "./customerService";
import { inventoryService } from "./inventoryService";
import { invoiceService } from "./invoiceService";
import { productService } from "./productService";
import { vatService } from "./vatService";
import { warehouseService } from "./warehouseService";

const PREFETCH_DELAY_MS = 1000; // 1 second delay before prefetching adjacent tabs

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely parse a number, returns 0 for invalid values
 */
const safeNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Calculate percentage change between two values
 */
const percentChange = (curr, prev) => {
  const c = safeNum(curr);
  const p = safeNum(prev);
  if (p === 0) return c > 0 ? 100 : 0;
  return ((c - p) / p) * 100;
};

// ============================================================================
// DATA PREFETCHING - Warm up cache for adjacent tabs
// ============================================================================

let prefetchTimeout = null;

/**
 * Prefetch data for adjacent dashboard tabs
 * Call this when user lands on a tab to warm up adjacent tab data
 *
 * @param {string} currentTab - The tab the user is currently viewing
 */
const prefetchAdjacentTabs = (currentTab) => {
  // Clear any pending prefetch
  if (prefetchTimeout) {
    clearTimeout(prefetchTimeout);
  }

  // Delay prefetch to not compete with current tab's data loading
  prefetchTimeout = setTimeout(() => {
    const tabOrder = ["overview", "products", "agents", "inventory", "vat", "customers"];
    const currentIndex = tabOrder.indexOf(currentTab);

    if (currentIndex === -1) return;

    // Prefetch adjacent tabs (previous and next)
    const adjacentIndices = [currentIndex - 1, currentIndex + 1].filter((i) => i >= 0 && i < tabOrder.length);

    adjacentIndices.forEach((index) => {
      const tab = tabOrder[index];
      switch (tab) {
        case "overview":
          dashboardService.getDashboardMetrics().catch(() => {});
          break;
        case "products":
          dashboardService.getProductAnalytics().catch(() => {});
          break;
        case "agents":
          dashboardService.getAgentPerformance().catch(() => {});
          break;
        case "inventory":
          dashboardService.getInventoryHealth().catch(() => {});
          break;
        case "vat":
          dashboardService.getVATMetrics().catch(() => {});
          break;
        case "customers":
          dashboardService.getCustomerInsights().catch(() => {});
          break;
      }
    });
  }, PREFETCH_DELAY_MS);
};

// ============================================================================
// WIDGET DATA PATTERNS - Standardized data shapes for dashboard widgets
// ============================================================================

/**
 * Standard widget data structure
 * All widget data should follow this pattern for consistency
 */
const _createWidgetData = (data, options = {}) => ({
  // The actual data payload
  data,
  // Metadata
  meta: {
    // Whether this is mock/fallback data
    isMockData: options.isMockData || false,
    // Whether cache was stale
    isStale: options.isStale || false,
    // When data was fetched
    fetchedAt: options.fetchedAt || new Date().toISOString(),
    // Data source (api, cache, mock)
    source: options.source || "api",
  },
});

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export const dashboardService = {
  // Prefetching
  prefetchAdjacentTabs,

  /**
   * Get all dashboard metrics in a single call
   * Aggregates data from multiple services with caching
   *
   * @param {Object} options - Options for fetching
   * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
   * @returns {Promise<Object>} Aggregated dashboard metrics
   */
  async getDashboardMetrics(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      // Fetch all data in parallel from real APIs
      const [dashboardData, arAgingData, revenueTrendData, dashboardKPIs, invoiceStats, customerStats, productStats] =
        await Promise.all([
          analyticsService.getDashboardData().catch((err) => {
            console.warn("[dashboardService] getDashboardData failed:", err.message);
            return {};
          }),
          analyticsService.getARAgingBuckets().catch((err) => {
            console.warn("[dashboardService] getARAgingBuckets failed:", err.message);
            return null;
          }),
          analyticsService.getRevenueTrend(12).catch((err) => {
            console.warn("[dashboardService] getRevenueTrend failed:", err.message);
            return null;
          }),
          analyticsService.getDashboardKPIs().catch((err) => {
            console.warn("[dashboardService] getDashboardKPIs failed:", err.message);
            return null;
          }),
          invoiceService.getInvoices({ limit: 1 }).catch((err) => {
            console.warn("[dashboardService] getInvoices failed:", err.message);
            return { pagination: { total: 0 } };
          }),
          customerService.getCustomers({ limit: 1 }).catch((err) => {
            console.warn("[dashboardService] getCustomers failed:", err.message);
            return { pagination: { total: 0 }, customers: [] };
          }),
          productService.getProducts({ limit: 1 }).catch((err) => {
            console.warn("[dashboardService] getProducts failed:", err.message);
            return { pagination: { total: 0 }, products: [] };
          }),
        ]);

      // Extract metrics from API responses
      // API returns: { metrics: { totalRevenue, totalCustomers, totalOrders, ... } }
      const totalRevenue = safeNum(dashboardData?.metrics?.totalRevenue || dashboardData?.revenueMetrics?.totalRevenue);
      const totalCustomers = parseInt(
        dashboardData?.metrics?.totalCustomers ||
          dashboardData?.customerMetrics?.totalCustomers ||
          customerStats?.pageInfo?.totalItems ||
          customerStats?.pagination?.total ||
          (Array.isArray(customerStats?.customers) ? customerStats.customers.length : 0) ||
          0,
        10
      );
      const totalProducts = parseInt(
        dashboardData?.metrics?.totalProducts ||
          dashboardData?.productMetrics?.totalProducts ||
          productStats?.pageInfo?.totalItems ||
          productStats?.pagination?.total ||
          (Array.isArray(productStats?.products) ? productStats.products.length : 0) ||
          0,
        10
      );
      const totalInvoices = parseInt(
        dashboardData?.metrics?.totalOrders ||
          dashboardData?.revenueMetrics?.totalInvoices ||
          invoiceStats?.pageInfo?.totalItems ||
          invoiceStats?.pagination?.total ||
          0,
        10
      );

      // Calculate month-over-month changes from trends
      const trends = Array.isArray(dashboardData?.monthlyTrends) ? dashboardData.monthlyTrends : [];
      const current = trends[0] || {};
      const previous = trends[1] || {};

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

        // KPIs from dedicated endpoint
        kpis: dashboardKPIs
          ? {
              grossMargin: parseFloat(dashboardKPIs.gross_margin_percent || dashboardKPIs.grossMarginPercent) || 0,
              dso: parseFloat(dashboardKPIs.dso_days || dashboardKPIs.dsoDays) || 0,
              creditUtilization:
                parseFloat(dashboardKPIs.credit_utilization_percent || dashboardKPIs.creditUtilizationPercent) || 0,
            }
          : {
              grossMargin: 0,
              dso: 0,
              creditUtilization: 0,
            },

        // AR Aging buckets
        arAging: arAgingData,

        // Revenue Trend for chart
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

        // Indicate real data was used
        isMockData: false,

        // Timestamp for freshness indicator
        fetchedAt: new Date().toISOString(),
      };

      return metrics;
    } catch (error) {
      console.error("[dashboardService] Error fetching dashboard metrics:", error);

      // Fall back to empty data structure
      return {
        summary: {
          totalRevenue: 0,
          totalCustomers: 0,
          totalProducts: 0,
          totalInvoices: 0,
          revenueChange: 0,
          customersChange: 0,
          productsChange: 0,
          invoicesChange: 0,
        },
        kpis: { grossMargin: 0, dso: 0, creditUtilization: 0 },
        arAging: null,
        revenueTrend: null,
        topProducts: [],
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get product analytics data
   * Includes top products, margins, category performance, and grade analysis
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Product analytics
   */
  async getProductAnalytics(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const [productPerformance, productList, inventorySummary] = await Promise.all([
        analyticsService.getProductPerformance().catch((err) => {
          console.warn("[dashboardService] getProductPerformance failed:", err.message);
          return {};
        }),
        productService.getProducts({ limit: 100 }).catch((err) => {
          console.warn("[dashboardService] getProducts failed:", err.message);
          return { products: [] };
        }),
        inventoryService.getInventorySummary().catch((err) => {
          console.warn("[dashboardService] getInventorySummary failed:", err.message);
          return {};
        }),
      ]);

      // Process products from API or direct list
      const products = Array.isArray(productList?.products)
        ? productList.products
        : Array.isArray(productList)
          ? productList
          : [];

      // Process top products from analytics or build from product list
      const topProducts = Array.isArray(productPerformance?.products)
        ? productPerformance.products.slice(0, 10).map((p) => ({
            id: p.id || p.productId || p.product_id,
            name: p.name || p.productName || p.product_name,
            displayName: p.displayName || p.name || p.productName,
            category: p.category,
            grade: p.grade,
            totalSold: safeNum(p.totalSold || p.quantitySold || p.quantity_sold),
            totalRevenue: safeNum(p.totalRevenue || p.revenue),
            avgPrice: safeNum(p.avgPrice || p.averagePrice),
            margin: safeNum(p.margin || p.marginPercent || p.margin_percent),
          }))
        : products.slice(0, 10).map((p) => ({
            id: p.id,
            name: p.name || p.displayName,
            displayName: p.displayName || p.name,
            category: p.category || p.productType,
            grade: p.grade,
            totalSold: 0,
            totalRevenue: 0,
            avgPrice: safeNum(p.sellingPrice || p.price),
            margin: 0,
          }));

      // Category performance aggregation
      const categoryPerformance = {};
      topProducts.forEach((p) => {
        const cat = p.category || "Uncategorized";
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

      // Grade analysis for steel products (SS 304, SS 316, SS 430)
      const gradeMap = {};
      const allProducts = Array.isArray(productPerformance?.products) ? productPerformance.products : products;

      allProducts.forEach((p) => {
        const grade = p.grade || "Unknown";
        if (!gradeMap[grade]) {
          gradeMap[grade] = {
            grade,
            totalSold: 0,
            totalRevenue: 0,
            avgMargin: 0,
            marginSum: 0,
            productCount: 0,
          };
        }
        gradeMap[grade].totalSold += safeNum(p.totalSold || p.quantitySold);
        gradeMap[grade].totalRevenue += safeNum(p.totalRevenue || p.revenue);
        gradeMap[grade].marginSum += safeNum(p.margin);
        gradeMap[grade].productCount += 1;
      });

      // Calculate average margins for each grade
      const gradeAnalysis = Object.values(gradeMap).map((g) => ({
        grade: g.grade,
        totalSold: g.totalSold,
        totalRevenue: g.totalRevenue,
        avgMargin: g.productCount > 0 ? g.marginSum / g.productCount : 0,
        productCount: g.productCount,
      }));

      // Fast/slow moving stock from inventory
      const fastMoving = inventorySummary?.fastMoving || [];
      const slowMoving = inventorySummary?.slowMoving || [];

      const analytics = {
        topProducts,
        categoryPerformance: Object.values(categoryPerformance),
        gradeAnalysis,
        fastMoving,
        slowMoving,
        summary: {
          totalProductsSold: topProducts.reduce((sum, p) => sum + p.totalSold, 0),
          totalRevenue: topProducts.reduce((sum, p) => sum + p.totalRevenue, 0),
          avgMargin:
            topProducts.length > 0 ? topProducts.reduce((sum, p) => sum + p.margin, 0) / topProducts.length : 0,
        },
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };
      return analytics;
    } catch (error) {
      console.error("[dashboardService] Error fetching product analytics:", error);

      // Return empty structure
      return {
        topProducts: [],
        categoryPerformance: [],
        gradeAnalysis: [],
        fastMoving: [],
        slowMoving: [],
        summary: { totalProductsSold: 0, totalRevenue: 0, avgMargin: 0 },
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get sales agent performance metrics
   * Now uses real commission API instead of mock data
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Agent performance data
   */
  async getAgentPerformance(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      // Fetch commission data from real APIs
      const [commissionDashboard, commissionAgents, commissionTransactions] = await Promise.all([
        commissionService.getDashboard().catch((err) => {
          console.warn("[dashboardService] getCommissionDashboard failed:", err.message);
          return {};
        }),
        commissionService.getAgents().catch((err) => {
          console.warn("[dashboardService] getCommissionAgents failed:", err.message);
          return { agents: [] };
        }),
        commissionService.getTransactions({ status: "pending" }).catch((err) => {
          console.warn("[dashboardService] getCommissionTransactions failed:", err.message);
          return { transactions: [], summary: {} };
        }),
      ]);

      // Process agents data (handle both array directly and object with agents key)
      const agentsList = Array.isArray(commissionAgents) ? commissionAgents : commissionAgents?.agents || [];

      // Build agent summaries by aggregating transaction data (handle both array and object)
      const agentTransactionMap = {};
      const txArray = Array.isArray(commissionTransactions)
        ? commissionTransactions
        : commissionTransactions?.transactions || [];
      txArray.forEach((tx) => {
        const agentId = tx.userId || tx.user_id;
        if (!agentTransactionMap[agentId]) {
          agentTransactionMap[agentId] = {
            totalCommission: 0,
            pendingCommission: 0,
            dealCount: 0,
          };
        }
        const amount = safeNum(tx.commissionAmount || tx.commission_amount);
        agentTransactionMap[agentId].totalCommission += amount;
        if (tx.status === "pending") {
          agentTransactionMap[agentId].pendingCommission += amount;
        }
        agentTransactionMap[agentId].dealCount += 1;
      });

      // Enrich agents with transaction data
      const enrichedAgents = agentsList.map((agent, index) => {
        const agentId = agent.userId || agent.user_id;
        const txData = agentTransactionMap[agentId] || {
          totalCommission: 0,
          pendingCommission: 0,
          dealCount: 0,
        };

        return {
          id: agentId,
          name: agent.userName || agent.user_name || "Unknown Agent",
          email: agent.userEmail || agent.user_email || "",
          avatar: null,
          rank: index + 1,
          planName: agent.planName || agent.plan_name || "No Plan",
          commissionRate: safeNum(agent.baseRate || agent.base_rate),
          isActive: agent.isActive !== false && agent.is_active !== false,
          // Commission metrics
          commission: {
            earned: txData.totalCommission,
            pending: txData.pendingCommission,
          },
          // Deal metrics
          invoiceCount: txData.dealCount,
          totalSales: 0, // Would need invoice data to calculate
          avgDealSize: 0,
          // Targets (if available from plan)
          target: {
            amount: 0,
            achieved: 0,
            percentage: 0,
          },
        };
      });

      // Sort by commission earned (descending)
      enrichedAgents.sort((a, b) => b.commission.earned - a.commission.earned);

      // Update ranks after sorting
      enrichedAgents.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      // Use dashboard metrics
      const dashboardMetrics = commissionDashboard || {};

      const performance = {
        agents: enrichedAgents,
        leaderboard: enrichedAgents.slice(0, 5),
        summary: {
          totalSalesTeam: enrichedAgents.length,
          activeAgents:
            parseInt(dashboardMetrics.activeAgents || dashboardMetrics.active_agents, 10) ||
            enrichedAgents.filter((a) => a.isActive).length,
          totalTeamRevenue: safeNum(dashboardMetrics.totalCommissions || dashboardMetrics.total_commissions),
          totalCommissionPaid: safeNum(dashboardMetrics.paidThisPeriod || dashboardMetrics.paid_this_period),
          totalCommissionPending: safeNum(dashboardMetrics.pendingPayout || dashboardMetrics.pending_payout),
          avgConversionRate: 0, // Would need more data
        },
        topAgents: (dashboardMetrics.topAgents || dashboardMetrics.top_agents || []).map((ta) => ({
          id: ta.userId || ta.user_id,
          name: ta.userName || ta.user_name,
          totalEarned: safeNum(ta.totalEarned || ta.total_earned),
          dealsClosed: parseInt(ta.dealsClosed || ta.deals_closed, 10) || 0,
        })),
        trendData: (dashboardMetrics.trendData || dashboardMetrics.trend_data || []).map((td) => ({
          period: td.period,
          amount: safeNum(td.amount),
        })),
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };
      return performance;
    } catch (error) {
      console.error("[dashboardService] Error fetching agent performance:", error);

      // Return empty structure
      return {
        agents: [],
        leaderboard: [],
        summary: {
          totalSalesTeam: 0,
          activeAgents: 0,
          totalTeamRevenue: 0,
          totalCommissionPaid: 0,
          totalCommissionPending: 0,
          avgConversionRate: 0,
        },
        topAgents: [],
        trendData: [],
        isMockData: true,
        fetchedAt: new Date().toISOString(),
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
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const [inventorySummary, lowStockItems, inventoryInsights] = await Promise.all([
        inventoryService.getInventorySummary().catch((err) => {
          console.warn("[dashboardService] getInventorySummary failed:", err.message);
          return {};
        }),
        inventoryService.getLowStockItems().catch((err) => {
          console.warn("[dashboardService] getLowStockItems failed:", err.message);
          return [];
        }),
        analyticsService.getInventoryInsights().catch((err) => {
          console.warn("[dashboardService] getInventoryInsights failed:", err.message);
          return {};
        }),
      ]);

      const health = {
        summary: {
          totalItems: parseInt(inventorySummary?.totalItems || inventoryInsights?.overview?.total_products, 10) || 0,
          totalValue: safeNum(inventorySummary?.totalValue || inventoryInsights?.overview?.total_value),
          totalQuantity: safeNum(inventorySummary?.totalQuantity),
          lowStockCount: Array.isArray(lowStockItems)
            ? lowStockItems.length
            : parseInt(inventoryInsights?.overview?.low_stock_count, 10) || 0,
          outOfStockCount:
            parseInt(inventorySummary?.outOfStockCount || inventoryInsights?.overview?.out_of_stock_count, 10) || 0,
        },
        lowStockItems: Array.isArray(lowStockItems)
          ? lowStockItems.slice(0, 10)
          : (inventoryInsights?.low_stock_items || []).slice(0, 10),
        turnoverRate: safeNum(inventoryInsights?.overview?.turnover_rate || inventorySummary?.turnoverRate),
        avgDaysToSell: safeNum(inventorySummary?.avgDaysToSell),
        warehouseUtilization: inventorySummary?.byWarehouse || inventorySummary?.warehouseUtilization || [],
        reorderAlerts: inventorySummary?.reorderAlerts || [],
        slowMoving: inventoryInsights?.slow_moving || [],
        topMoving: inventoryInsights?.top_moving || [],
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };
      return health;
    } catch (error) {
      console.error("[dashboardService] Error fetching inventory health:", error);
      throw error;
    }
  },

  /**
   * Get VAT compliance metrics
   * Now uses real VAT service instead of calculating from invoices
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} VAT metrics
   */
  async getVATMetrics(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      // Try to get VAT dashboard metrics from the VAT service
      const vatMetrics = await vatService.getVATDashboardMetrics().catch((err) => {
        console.warn("[dashboardService] getVATDashboardMetrics failed:", err.message);
        return null;
      });

      if (vatMetrics) {
        return vatMetrics;
      }

      // Fallback: Calculate from invoices if VAT service fails

      const currentDate = new Date();
      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
      const currentYear = currentDate.getFullYear();
      const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
      const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);

      // Fetch invoices for current quarter
      const invoiceResponse = await invoiceService
        .getInvoices({
          start_date: quarterStart.toISOString().split("T")[0],
          end_date: quarterEnd.toISOString().split("T")[0],
          limit: 500,
        })
        .catch((err) => {
          console.warn("[dashboardService] getInvoices for VAT failed:", err.message);
          return { invoices: [] };
        });

      const invoices = invoiceResponse?.invoices || [];

      // Calculate VAT from invoices
      let totalSales = 0;
      let totalVatCollected = 0;
      let invoicesWithVAT = 0;
      let invoicesWithoutVAT = 0;
      let zeroRatedSales = 0;

      invoices.forEach((inv) => {
        const total = safeNum(inv.total);
        const vatAmount = safeNum(inv.vatAmount || inv.vat_amount);

        totalSales += total;
        totalVatCollected += vatAmount;

        if (vatAmount > 0) {
          invoicesWithVAT++;
        } else if (total > 0) {
          invoicesWithoutVAT++;
          zeroRatedSales += total;
        }
      });

      // Estimate input VAT (purchases - using 60% of output as rough estimate)
      const estimatedInputVAT = Math.round(totalVatCollected * 0.6);

      const vatData = {
        currentPeriod: {
          quarter: `Q${currentQuarter}`,
          year: currentYear,
          startDate: quarterStart.toISOString(),
          endDate: quarterEnd.toISOString(),
        },
        collection: {
          outputVAT: Math.round(totalVatCollected),
          inputVAT: estimatedInputVAT,
          netPayable: Math.round(totalVatCollected - estimatedInputVAT),
          adjustments: 0,
        },
        returnStatus: {
          status: "pending",
          dueDate: new Date(currentYear, currentQuarter * 3 + 1, 28).toISOString(),
          daysRemaining: Math.max(
            0,
            Math.ceil((new Date(currentYear, currentQuarter * 3 + 1, 28) - currentDate) / (1000 * 60 * 60 * 24))
          ),
          filedDate: null,
        },
        compliance: {
          invoicesWithVAT,
          invoicesWithoutVAT,
          zeroRatedSales: Math.round(zeroRatedSales),
          exemptSales: 0,
          totalSales: Math.round(totalSales),
          effectiveVATRate: totalSales > 0 ? ((totalVatCollected / totalSales) * 100).toFixed(2) : 0,
        },
        alerts: [],
        history: [],
        isMockData: invoices.length === 0,
        fetchedAt: new Date().toISOString(),
      };

      // Add alerts based on data
      const daysUntilDue = vatData.returnStatus.daysRemaining;
      if (daysUntilDue <= 15 && daysUntilDue > 0) {
        vatData.alerts.push({
          type: "warning",
          message: `VAT return due in ${daysUntilDue} days`,
          severity: daysUntilDue <= 7 ? "high" : "medium",
        });
      }

      if (invoicesWithoutVAT > 0) {
        vatData.alerts.push({
          type: "info",
          message: `${invoicesWithoutVAT} invoice(s) without VAT this quarter`,
          severity: "low",
        });
      }
      return vatData;
    } catch (error) {
      console.error("[dashboardService] Error fetching VAT metrics:", error);

      // Return empty structure
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
          outputVAT: 0,
          inputVAT: 0,
          netPayable: 0,
          adjustments: 0,
        },
        returnStatus: {
          status: "unknown",
          dueDate: null,
          daysRemaining: 0,
          filedDate: null,
        },
        compliance: {
          invoicesWithVAT: 0,
          invoicesWithoutVAT: 0,
          zeroRatedSales: 0,
          exemptSales: 0,
        },
        alerts: [],
        history: [],
        isMockData: true,
        isStale: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get customer insights
   * Uses real customer and invoice data to calculate CLV and identify at-risk customers
   *
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Customer insights
   */
  async getCustomerInsights(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const [customerAnalysis, customerList, recentInvoices] = await Promise.all([
        analyticsService.getCustomerAnalysis().catch((err) => {
          console.warn("[dashboardService] getCustomerAnalysis failed:", err.message);
          return {};
        }),
        customerService.getCustomers({ limit: 100, status: "active" }).catch((err) => {
          console.warn("[dashboardService] getCustomers failed:", err.message);
          return { customers: [] };
        }),
        invoiceService.getInvoices({ limit: 200 }).catch((err) => {
          console.warn("[dashboardService] getInvoices for customers failed:", err.message);
          return { invoices: [] };
        }),
      ]);

      const customers = customerList?.customers || [];
      const invoices = recentInvoices?.invoices || [];

      if (customers.length === 0) {
        // No customers, return empty structure
        return {
          topCustomers: [],
          atRiskCustomers: [],
          segments: { premium: 0, standard: 0, new: 0 },
          totalCustomers: 0,
          newCustomersThisMonth: 0,
          churnRate: 0,
          avgCLV: 0,
          totalOutstanding: 0,
          isMockData: true,
          fetchedAt: new Date().toISOString(),
        };
      }

      // Build customer invoice history for CLV calculation
      const customerInvoiceMap = {};
      invoices.forEach((inv) => {
        const customerId = inv.customerId || inv.customer_id || inv.customer?.id;
        if (customerId) {
          if (!customerInvoiceMap[customerId]) {
            customerInvoiceMap[customerId] = {
              invoices: [],
              totalRevenue: 0,
              lastOrderDate: null,
              totalPaid: 0,
              totalOutstanding: 0,
            };
          }
          const invTotal = safeNum(inv.total);
          const invReceived = safeNum(inv.received);
          const invOutstanding = safeNum(inv.outstanding);

          customerInvoiceMap[customerId].invoices.push(inv);
          customerInvoiceMap[customerId].totalRevenue += invTotal;
          customerInvoiceMap[customerId].totalPaid += invReceived;
          customerInvoiceMap[customerId].totalOutstanding += invOutstanding;

          const invDate = new Date(inv.invoiceDate || inv.invoice_date || inv.date || inv.createdAt);
          if (!customerInvoiceMap[customerId].lastOrderDate || invDate > customerInvoiceMap[customerId].lastOrderDate) {
            customerInvoiceMap[customerId].lastOrderDate = invDate;
          }
        }
      });

      // Calculate insights for each customer
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const enrichedCustomers = customers.map((customer) => {
        const history = customerInvoiceMap[customer.id] || {
          invoices: [],
          totalRevenue: 0,
          lastOrderDate: null,
          totalPaid: 0,
          totalOutstanding: 0,
        };

        const invoiceCount = history.invoices.length;
        const avgOrderValue = invoiceCount > 0 ? history.totalRevenue / invoiceCount : 0;

        // Simple CLV calculation: avg order value * estimated annual orders * 3 years
        const estimatedAnnualOrders = Math.max(invoiceCount * (12 / 6), 4);
        const clv = avgOrderValue * estimatedAnnualOrders * 3;

        // Calculate days since last order
        let daysInactive = 0;
        if (history.lastOrderDate) {
          daysInactive = Math.floor((now - history.lastOrderDate) / (1000 * 60 * 60 * 24));
        } else {
          daysInactive = 90;
        }

        // Risk score based on inactivity and outstanding payments
        let riskScore = 0;
        if (daysInactive > 60) riskScore += 40;
        else if (daysInactive > 30) riskScore += 20;

        if (history.totalOutstanding > 0) {
          const outstandingRatio = history.totalOutstanding / (history.totalRevenue || 1);
          riskScore += Math.min(40, Math.floor(outstandingRatio * 100));
        }

        if (invoiceCount === 0) riskScore += 20;

        // Segment based on revenue and activity
        let segment = "Standard";
        if (history.totalRevenue > 500000 && daysInactive < 30) {
          segment = "Premium";
        } else if (invoiceCount <= 2 || daysInactive < 60) {
          segment = "New";
        }

        return {
          id: customer.id,
          name: customer.name || customer.companyName || customer.company_name || "Unknown",
          email: customer.email,
          phone: customer.phone,
          totalRevenue: Math.round(history.totalRevenue),
          invoiceCount,
          avgOrderValue: Math.round(avgOrderValue),
          clv: Math.round(clv),
          lastOrderDate: history.lastOrderDate?.toISOString() || null,
          daysInactive,
          riskScore: Math.min(100, riskScore),
          segment,
          outstanding: Math.round(history.totalOutstanding),
          creditLimit: safeNum(customer.creditLimit || customer.credit_limit),
          creditUsed: safeNum(customer.currentCredit || customer.current_credit),
        };
      });

      // Sort by total revenue and get top customers
      const topCustomers = enrichedCustomers.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);

      // Identify at-risk customers
      const atRiskCustomers = enrichedCustomers
        .filter((c) => c.riskScore > 50)
        .map((c) => {
          let riskReason = "Multiple risk factors";
          if (c.daysInactive > 60) {
            riskReason = `No orders in ${c.daysInactive} days`;
          } else if (c.outstanding > 0 && c.outstanding > c.avgOrderValue) {
            riskReason = "Significant payment overdue";
          } else if (c.invoiceCount <= 1) {
            riskReason = "New customer - needs engagement";
          }
          return { ...c, riskReason };
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      // Segment counts
      const segments = {
        premium: enrichedCustomers.filter((c) => c.segment === "Premium").length,
        standard: enrichedCustomers.filter((c) => c.segment === "Standard").length,
        new: enrichedCustomers.filter((c) => c.segment === "New").length,
      };

      // New customers this month
      const newCustomersThisMonth = customers.filter((c) => {
        const createdAt = new Date(c.createdAt || c.created_at);
        return createdAt >= thirtyDaysAgo;
      }).length;

      // Churn rate estimate (customers inactive > 60 days / total)
      const inactiveCount = enrichedCustomers.filter((c) => c.daysInactive > 60).length;
      const churnRate =
        enrichedCustomers.length > 0 ? ((inactiveCount / enrichedCustomers.length) * 100).toFixed(1) : 0;

      const result = {
        topCustomers,
        atRiskCustomers,
        segments,
        totalCustomers: customers.length,
        newCustomersThisMonth,
        churnRate: parseFloat(churnRate),
        avgCLV: Math.round(enrichedCustomers.reduce((sum, c) => sum + c.clv, 0) / (enrichedCustomers.length || 1)),
        totalOutstanding: Math.round(enrichedCustomers.reduce((sum, c) => sum + c.outstanding, 0)),
        // Include analytics data if available
        analyticsCustomers: customerAnalysis?.customers || [],
        analyticsSummary: customerAnalysis?.summary || null,
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };
      return result;
    } catch (error) {
      console.error("[dashboardService] Error fetching customer insights:", error);

      // Return empty structure
      return {
        topCustomers: [],
        atRiskCustomers: [],
        segments: { premium: 0, standard: 0, new: 0 },
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        churnRate: 0,
        avgCLV: 0,
        totalOutstanding: 0,
        isMockData: true,
        isStale: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  // ============================================================================
  // PHASE 2 DATA FETCHERS - Net Profit, AP Aging, Cash Flow, Stock Turnover
  // ============================================================================

  /**
   * Get Net Profit data for ProfitSummaryWidget
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Net profit data
   */
  async getNetProfit(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const response = await analyticsService.getNetProfit(options.params || {});

      // Transform API response to widget-expected format
      const netProfitData = {
        revenue: safeNum(response?.revenue),
        cogs: safeNum(response?.cost || response?.cogs),
        grossProfit: safeNum(response?.gross_profit || response?.grossProfit),
        operatingExpenses: safeNum(response?.operating_expenses || response?.operatingExpenses || 0),
        netProfit: safeNum(response?.net_profit || response?.netProfit),
        grossMarginPercent: safeNum(response?.gross_margin_percent || response?.grossMarginPercent),
        netMarginPercent: safeNum(
          response?.margin_percentage || response?.marginPercentage || response?.net_margin_percent
        ),
        trend: response?.trend || [],
        previousPeriod: response?.previous_period ||
          response?.previousPeriod || {
            revenue: 0,
            grossProfit: 0,
            netProfit: 0,
          },
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };

      // Calculate derived values if not provided
      if (!netProfitData.grossProfit && netProfitData.revenue && netProfitData.cogs) {
        netProfitData.grossProfit = netProfitData.revenue - netProfitData.cogs;
      }
      if (!netProfitData.grossMarginPercent && netProfitData.revenue > 0) {
        netProfitData.grossMarginPercent = (netProfitData.grossProfit / netProfitData.revenue) * 100;
      }
      if (!netProfitData.netMarginPercent && netProfitData.revenue > 0) {
        netProfitData.netMarginPercent = (netProfitData.netProfit / netProfitData.revenue) * 100;
      }
      return netProfitData;
    } catch (error) {
      console.error("[dashboardService] Error fetching net profit:", error);

      // Return empty structure
      return {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        netProfit: 0,
        grossMarginPercent: 0,
        netMarginPercent: 0,
        trend: [],
        previousPeriod: { revenue: 0, grossProfit: 0, netProfit: 0 },
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get AP (Accounts Payable) Aging data for APAgingWidget
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} AP aging buckets data
   */
  async getAPAging(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const response = await analyticsService.getAPAging();

      // Transform API response to widget-expected format
      const apAgingData = {
        buckets: (response?.buckets || []).map((bucket) => ({
          label: bucket.label || bucket.range || `${bucket.min_days || 0}-${bucket.max_days || 30} Days`,
          amount: safeNum(bucket.amount || bucket.total),
          percentage: safeNum(bucket.percentage || bucket.percent),
          count: parseInt(bucket.count || bucket.bill_count, 10) || 0,
        })),
        totalAP: safeNum(response?.total_ap || response?.totalAP),
        overdueAP: safeNum(response?.overdue_ap || response?.overdueAP),
        criticalSuppliers: (response?.critical_suppliers || response?.criticalSuppliers || []).map((supplier) => ({
          name: supplier.name || supplier.supplier_name,
          amount: safeNum(supplier.amount || supplier.total_overdue),
          daysOverdue: parseInt(supplier.days_overdue || supplier.daysOverdue, 10) || 0,
        })),
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };
      return apAgingData;
    } catch (error) {
      console.error("[dashboardService] Error fetching AP aging:", error);

      // Return empty structure
      return {
        buckets: [],
        totalAP: 0,
        overdueAP: 0,
        criticalSuppliers: [],
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get Cash Flow data for CashFlowWidget
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Cash flow data with MTD, QTD, YTD breakdowns
   */
  async getCashFlow(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const response = await analyticsService.getCashFlow(options.params || {});

      // Transform API response to widget-expected format
      // API can return either flat structure or nested MTD/QTD/YTD
      const transformPeriodData = (data) => ({
        inflows: safeNum(data?.inflow || data?.inflows || data?.total_inflow),
        outflows: safeNum(data?.outflow || data?.outflows || data?.total_outflow),
        netCashFlow: safeNum(data?.net_cash_flow || data?.netCashFlow || data?.net),
        trend: (data?.trend || []).map((t) => ({
          day: t.period || t.day || t.label,
          inflow: safeNum(t.inflow || t.in),
          outflow: safeNum(t.outflow || t.out),
        })),
      });

      let cashFlowData;

      // Check if response has nested period data or flat structure
      if (response?.mtd || response?.qtd || response?.ytd) {
        cashFlowData = {
          mtd: transformPeriodData(response.mtd || {}),
          qtd: transformPeriodData(response.qtd || {}),
          ytd: transformPeriodData(response.ytd || {}),
        };
      } else {
        // Flat structure - use for all periods
        const periodData = transformPeriodData(response);
        cashFlowData = {
          mtd: periodData,
          qtd: periodData,
          ytd: periodData,
        };
      }

      cashFlowData.isMockData = false;
      cashFlowData.fetchedAt = new Date().toISOString();
      return cashFlowData;
    } catch (error) {
      console.error("[dashboardService] Error fetching cash flow:", error);

      // Return empty structure
      const emptyPeriod = {
        inflows: 0,
        outflows: 0,
        netCashFlow: 0,
        trend: [],
      };
      return {
        mtd: emptyPeriod,
        qtd: emptyPeriod,
        ytd: emptyPeriod,
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get Stock Turnover data for StockTurnoverWidget
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Stock turnover heatmap data
   */
  async getStockTurnover(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const response = await analyticsService.getStockTurnover(options.params || {});

      // Get last 6 months for labels
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString("default", { month: "short" }));
      }

      // Transform API response to widget-expected format
      const stockTurnoverData = {
        products: (response?.by_category || response?.byCategory || response?.products || []).map((item, idx) => ({
          id: item.id || item.product_id || idx + 1,
          name: item.name || item.product_name || item.category || `Product ${idx + 1}`,
          // If monthly data exists, use it; otherwise generate from turnover_ratio
          data:
            item.monthly_data ||
            item.monthlyData ||
            Array(6).fill(safeNum(item.turnover_ratio || item.turnoverRatio || 1)),
        })),
        months,
        overallEfficiency:
          safeNum(response?.overall_efficiency || response?.overallEfficiency) ||
          Math.min(100, Math.round(safeNum(response?.turnover_ratio || response?.turnoverRatio || 2) * 25)),
        avgTurnover: safeNum(response?.turnover_ratio || response?.turnoverRatio || response?.avg_turnover),
        daysOfInventory: parseInt(response?.days_of_inventory || response?.daysOfInventory, 10) || 0,
        cogs: safeNum(response?.cogs),
        bestPerformer: response?.best_performer || response?.bestPerformer || "",
        worstPerformer: response?.worst_performer || response?.worstPerformer || "",
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };

      // Identify best/worst performers if not provided
      if (!stockTurnoverData.bestPerformer && stockTurnoverData.products.length > 0) {
        const sorted = [...stockTurnoverData.products].sort((a, b) => {
          const avgA = a.data.reduce((s, v) => s + v, 0) / a.data.length;
          const avgB = b.data.reduce((s, v) => s + v, 0) / b.data.length;
          return avgB - avgA;
        });
        stockTurnoverData.bestPerformer = sorted[0]?.name || "";
        stockTurnoverData.worstPerformer = sorted[sorted.length - 1]?.name || "";
      }
      return stockTurnoverData;
    } catch (error) {
      console.error("[dashboardService] Error fetching stock turnover:", error);

      // Return empty structure
      return {
        products: [],
        months: [],
        overallEfficiency: 0,
        avgTurnover: 0,
        daysOfInventory: 0,
        cogs: 0,
        bestPerformer: "",
        worstPerformer: "",
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Get Warehouse Utilization data for WarehouseUtilizationWidget
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Warehouse utilization data
   */
  async getWarehouseUtilization(options = {}) {
    const { forceRefresh: _forceRefresh = false } = options;

    try {
      const response = await warehouseService.getAll({ limit: 50 });
      const warehouses = response?.data || [];

      // Transform warehouses to widget format
      const warehouseData = {
        warehouses: warehouses.map((w) => ({
          id: w.id,
          name: w.name,
          code: w.code,
          city: w.city || "Unknown",
          capacity: safeNum(w.capacity),
          used: safeNum(w.inventoryCount || 0),
          utilization: safeNum(w.utilizationPercent || 0),
          value: 0, // Would need inventory value data
          items: parseInt(w.inventoryCount, 10) || 0,
          status:
            w.utilizationPercent >= 90
              ? "critical"
              : w.utilizationPercent >= 75
                ? "high"
                : w.utilizationPercent >= 50
                  ? "optimal"
                  : "low",
        })),
        transfers: [], // Would need transfer data
        summary: {
          totalCapacity: warehouses.reduce((sum, w) => sum + safeNum(w.capacity), 0),
          totalUsed: warehouses.reduce((sum, w) => sum + safeNum(w.inventoryCount || 0), 0),
          avgUtilization:
            warehouses.length > 0
              ? warehouses.reduce((sum, w) => sum + safeNum(w.utilizationPercent || 0), 0) / warehouses.length
              : 0,
          totalValue: 0, // Would need inventory value data
        },
        isMockData: false,
        fetchedAt: new Date().toISOString(),
      };
      return warehouseData;
    } catch (error) {
      console.error("[dashboardService] Error fetching warehouse utilization:", error);

      // Return empty structure
      return {
        warehouses: [],
        transfers: [],
        summary: {
          totalCapacity: 0,
          totalUsed: 0,
          avgUtilization: 0,
          totalValue: 0,
        },
        isMockData: true,
        fetchedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Refresh all dashboard data
   * Force-refreshes all cached data
   */
  async refreshAll() {
    return Promise.all([
      this.getDashboardMetrics({ forceRefresh: true }),
      this.getProductAnalytics({ forceRefresh: true }),
      this.getAgentPerformance({ forceRefresh: true }),
      this.getInventoryHealth({ forceRefresh: true }),
      this.getVATMetrics({ forceRefresh: true }),
      this.getCustomerInsights({ forceRefresh: true }),
      // Phase 2 data
      this.getNetProfit({ forceRefresh: true }),
      this.getAPAging({ forceRefresh: true }),
      this.getCashFlow({ forceRefresh: true }),
      this.getStockTurnover({ forceRefresh: true }),
      this.getWarehouseUtilization({ forceRefresh: true }),
    ]);
  },

  /**
   * Get data for a specific dashboard tab
   * Returns the appropriate data based on tab name
   *
   * @param {string} tabName - Name of the tab
   * @param {Object} options - Fetch options
   */
  async getTabData(tabName, options = {}) {
    switch (tabName) {
      case "overview":
        return this.getDashboardMetrics(options);
      case "products":
        return this.getProductAnalytics(options);
      case "agents":
        return this.getAgentPerformance(options);
      case "inventory":
        return this.getInventoryHealth(options);
      case "vat":
        return this.getVATMetrics(options);
      case "customers":
        return this.getCustomerInsights(options);
      default:
        throw new Error(`Unknown tab: ${tabName}`);
    }
  },
};

export default dashboardService;
