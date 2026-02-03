/**
 * DashboardV2 - Enhanced Dashboard with Widget Integration
 * Features: Role-based widgets, lazy loading, collapsible sections
 */

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  Package,
  Receipt,
  RefreshCw,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useDashboardPermissions } from "../hooks/useDashboardPermissions";
import { analyticsService } from "../services/analyticsService";
import { dashboardService } from "../services/dashboardService";
import { createHoverPreload, preloadByRole } from "./dashboard/preloadWidgets";
import WidgetErrorBoundary from "./dashboard/WidgetErrorBoundary";
import WidgetSkeleton from "./dashboard/WidgetSkeleton";

// Lazy load widgets
const LazyRevenueKPIWidget = lazy(() => import("./dashboard/widgets/financial/RevenueKPIWidget"));
const LazyARAgingWidget = lazy(() => import("./dashboard/widgets/financial/ARAgingWidget"));
const LazyGrossMarginWidget = lazy(() => import("./dashboard/widgets/financial/GrossMarginWidget"));
const LazyCashFlowWidget = lazy(() => import("./dashboard/widgets/financial/CashFlowWidget"));
const LazyDSOWidget = lazy(() => import("./dashboard/widgets/financial/DSOWidget"));
const LazyCreditUtilizationWidget = lazy(() => import("./dashboard/widgets/financial/CreditUtilizationWidget"));
const LazyProfitSummaryWidget = lazy(() => import("./dashboard/widgets/financial/ProfitSummaryWidget"));
const LazyAPAgingWidget = lazy(() => import("./dashboard/widgets/financial/APAgingWidget"));
const LazyInventoryHealthWidget = lazy(() => import("./dashboard/widgets/inventory/InventoryHealthWidget"));
const LazyFastMovingWidget = lazy(() => import("./dashboard/widgets/inventory/FastMovingWidget"));
const LazySlowMovingWidget = lazy(() => import("./dashboard/widgets/inventory/SlowMovingWidget"));
const LazyReorderAlertsWidget = lazy(() => import("./dashboard/widgets/inventory/ReorderAlertsWidget"));
const LazyStockTurnoverWidget = lazy(() => import("./dashboard/widgets/inventory/StockTurnoverWidget"));
const LazyWarehouseUtilizationWidget = lazy(() => import("./dashboard/widgets/inventory/WarehouseUtilizationWidget"));
const LazyTopProductsWidget = lazy(() => import("./dashboard/widgets/product/TopProductsWidget"));
const LazyCategoryPerformanceWidget = lazy(() => import("./dashboard/widgets/product/CategoryPerformanceWidget"));
const LazyGradeAnalysisWidget = lazy(() => import("./dashboard/widgets/product/GradeAnalysisWidget"));
const LazyVATCollectionWidget = lazy(() => import("./dashboard/widgets/vat/VATCollectionWidget"));
const LazyVATReturnStatusWidget = lazy(() => import("./dashboard/widgets/vat/VATReturnStatusWidget"));
const LazyLeaderboardWidget = lazy(() => import("./dashboard/widgets/sales-agent/LeaderboardWidget"));
const LazyAgentScorecardWidget = lazy(() => import("./dashboard/widgets/sales-agent/AgentScorecardWidget"));
const LazyConversionFunnelWidget = lazy(() => import("./dashboard/widgets/sales-agent/ConversionFunnelWidget"));
const LazyCustomerPortfolioWidget = lazy(() => import("./dashboard/widgets/sales-agent/CustomerPortfolioWidget"));
const LazyCollectionPerformanceWidget = lazy(
  () => import("./dashboard/widgets/sales-agent/CollectionPerformanceWidget")
);
const LazyCustomerSegmentsWidget = lazy(() => import("./dashboard/widgets/customer/CustomerSegmentsWidget"));
const LazyNewCustomerWidget = lazy(() => import("./dashboard/widgets/customer/NewCustomerWidget"));

// Reusable Components
const StatsCard = ({ variant = "default", children, className = "" }) => {
  const { isDarkMode } = useTheme();
  const borderColors = {
    default: "border-l-teal-500",
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    error: "border-l-red-500",
    info: "border-l-blue-500",
    purple: "border-l-purple-500",
  };

  return (
    <div
      className={`rounded-xl border-l-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-28 flex flex-col ${
        isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
      } ${borderColors[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

const ChangeIndicator = ({ positive, children }) => (
  <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${positive ? "text-green-500" : "text-red-500"}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, icon: Icon, description, isExpanded, onToggle, widgetCount }) => {
  const { isDarkMode } = useTheme();
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className={`flex items-center justify-between p-4 rounded-t-xl cursor-pointer transition-colors ${
        isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-white"}`}>
            <Icon size={20} className="text-teal-500" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
            >
              {widgetCount} widgets
            </span>
          </div>
          {description && <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{description}</p>}
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`p-1 rounded ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
        aria-label={isExpanded ? "Collapse section" : "Expand section"}
      >
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
  );
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "products", label: "Products & Inventory", icon: Package },
  { id: "sales", label: "Sales & Customers", icon: Users },
  { id: "vat", label: "VAT Compliance", icon: Receipt },
];

const DashboardV2 = () => {
  const { isDarkMode } = useTheme();
  const { role, canViewWidget } = useDashboardPermissions();

  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState({
    financial: true,
    inventory: true,
    sales: true,
    vat: true,
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Widget data states
  const [widgetData, setWidgetData] = useState({
    arAging: null,
    grossMargin: 0,
    cashFlow: null,
    inventoryHealth: null,
    vatMetrics: null,
    // KPIs
    dso: 0,
    creditUtilization: 0,
    // Inventory
    fastMoving: null,
    slowMoving: null,
    reorderAlerts: null,
    // Product
    categoryPerformance: null,
    gradeAnalysis: null,
    // Customer
    customerInsights: null,
    newCustomers: null,
    customerSegments: null,
    // Sales Agent
    agentPerformance: null,
    // Phase 2 widgets
    netProfit: null,
    apAging: null,
    stockTurnover: null,
    warehouseUtilization: null,
  });
  const [widgetLoading, setWidgetLoading] = useState({
    arAging: false,
    grossMargin: false,
    cashFlow: false,
    inventoryHealth: false,
    vatMetrics: false,
    dso: false,
    creditUtilization: false,
    fastMoving: false,
    slowMoving: false,
    reorderAlerts: false,
    categoryPerformance: false,
    gradeAnalysis: false,
    customerInsights: false,
    agentPerformance: false,
    // Phase 2 loading states
    netProfit: false,
    apAging: false,
    stockTurnover: false,
    warehouseUtilization: false,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchWidgetData();
    preloadByRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const dashboard = await analyticsService.getDashboardData().catch(() => ({}));

      // API returns: { metrics: { totalRevenue, totalCustomers, totalOrders, ... } }
      // Also support legacy structure: { revenueMetrics, customerMetrics, productMetrics }
      const newStats = {
        totalRevenue: parseFloat(dashboard?.metrics?.totalRevenue || dashboard?.revenueMetrics?.totalRevenue) || 0,
        totalCustomers: parseInt(dashboard?.metrics?.totalCustomers || dashboard?.customerMetrics?.totalCustomers) || 0,
        totalProducts: parseInt(dashboard?.metrics?.totalProducts || dashboard?.productMetrics?.totalProducts) || 0,
        totalInvoices: parseInt(dashboard?.metrics?.totalOrders || dashboard?.revenueMetrics?.totalInvoices) || 0,
        revenueChange: 0,
        customersChange: 0,
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch widget-specific data from dashboardService
  const fetchWidgetData = useCallback(async () => {
    try {
      // Fetch all dashboard metrics which includes AR aging, KPIs, etc.
      const metrics = await dashboardService.getDashboardMetrics();

      // Update stats with more accurate data from dashboardService
      if (metrics?.summary) {
        setStats((prev) => ({
          ...prev,
          totalRevenue: metrics.summary.totalRevenue || prev.totalRevenue,
          totalCustomers: metrics.summary.totalCustomers || prev.totalCustomers,
          totalProducts: metrics.summary.totalProducts || prev.totalProducts,
          totalInvoices: metrics.summary.totalInvoices || prev.totalInvoices,
          revenueChange: metrics.summary.revenueChange || 0,
          customersChange: metrics.summary.customersChange || 0,
        }));
      }

      // Update widget data with KPIs (DSO, Credit Utilization, Gross Margin)
      setWidgetData((prev) => ({
        ...prev,
        arAging: metrics?.arAging || null,
        grossMargin: metrics?.kpis?.grossMargin || 0,
        dso: metrics?.kpis?.dso || 0,
        creditUtilization: metrics?.kpis?.creditUtilization || 0,
      }));

      // Fetch inventory health data (includes fast/slow moving and low stock items)
      const inventoryHealth = await dashboardService.getInventoryHealth().catch(() => null);
      if (inventoryHealth) {
        setWidgetData((prev) => ({
          ...prev,
          inventoryHealth: {
            healthScore: inventoryHealth.turnoverRate
              ? Math.min(100, Math.round(inventoryHealth.turnoverRate * 10))
              : 78,
            totalValue: inventoryHealth.summary?.totalValue || 0,
            totalItems: inventoryHealth.summary?.totalItems || 0,
            daysOfStock: Math.round(inventoryHealth.avgDaysToSell) || 45,
            breakdown: inventoryHealth.warehouseUtilization?.length > 0 ? inventoryHealth.warehouseUtilization : null,
            alerts: {
              lowStock: inventoryHealth.summary?.lowStockCount || 0,
              overstock: inventoryHealth.summary?.outOfStockCount || 0,
              expiring: 0,
            },
          },
          // Wire fast moving items from inventory health (top_moving array)
          fastMoving:
            inventoryHealth.topMoving?.length > 0
              ? {
                  products: inventoryHealth.topMoving.map((item, idx) => ({
                    id: item.id || item.product_id || idx,
                    name: item.name || item.product_name || item.displayName,
                    category: item.category || "Steel",
                    turnoverRatio: parseFloat(item.turnover_ratio || item.turnoverRatio) || 5.0,
                    daysToSell: parseInt(item.days_to_sell || item.daysToSell) || 15,
                    currentStock: parseFloat(item.current_stock || item.currentStock || item.quantity) || 0,
                    reorderPoint: parseFloat(item.reorder_point || item.reorderPoint) || 10,
                    lastSaleDate: item.last_sale_date || item.lastSaleDate || new Date().toISOString(),
                    trend: item.trend || [50, 45, 40, 38, 35],
                    status: parseFloat(item.turnover_ratio || item.turnoverRatio) > 6 ? "optimal" : "watch",
                  })),
                  summary: {
                    totalFastMoving: inventoryHealth.topMoving.length,
                    avgTurnover:
                      inventoryHealth.topMoving.reduce(
                        (sum, i) => sum + (parseFloat(i.turnover_ratio || i.turnoverRatio) || 0),
                        0
                      ) / inventoryHealth.topMoving.length || 5.0,
                    totalValue: inventoryHealth.topMoving.reduce(
                      (sum, i) => sum + (parseFloat(i.value || i.total_value) || 0),
                      0
                    ),
                  },
                }
              : null,
          // Wire slow moving items from inventory health (slow_moving array)
          slowMoving:
            inventoryHealth.slowMoving?.length > 0
              ? {
                  products: inventoryHealth.slowMoving.map((item, idx) => ({
                    id: item.id || item.product_id || idx,
                    name: item.name || item.product_name || item.displayName,
                    category: item.category || "Steel",
                    turnoverRatio: parseFloat(item.turnover_ratio || item.turnoverRatio) || 0.5,
                    daysInStock: parseInt(item.days_in_stock || item.daysInStock) || 150,
                    currentStock: parseFloat(item.current_stock || item.currentStock || item.quantity) || 0,
                    value: parseFloat(item.value || item.total_value) || 0,
                    lastSaleDate: item.last_sale_date || item.lastSaleDate || "2024-01-01",
                    recommendation:
                      item.recommendation ||
                      (parseInt(item.days_in_stock || item.daysInStock) > 180 ? "discount" : "promote"),
                  })),
                  summary: {
                    totalSlowMoving: inventoryHealth.slowMoving.length,
                    totalValueLocked: inventoryHealth.slowMoving.reduce(
                      (sum, i) => sum + (parseFloat(i.value || i.total_value) || 0),
                      0
                    ),
                    avgDaysInStock:
                      inventoryHealth.slowMoving.reduce(
                        (sum, i) => sum + (parseInt(i.days_in_stock || i.daysInStock) || 0),
                        0
                      ) / inventoryHealth.slowMoving.length || 150,
                  },
                }
              : null,
          // Wire reorder alerts from low stock items
          reorderAlerts:
            inventoryHealth.lowStockItems?.length > 0
              ? {
                  products: inventoryHealth.lowStockItems.map((item, idx) => ({
                    id: item.id || item.product_id || idx,
                    name: item.name || item.product_name || item.displayName,
                    category: item.category || "Steel",
                    currentStock: parseFloat(item.current_stock || item.currentStock || item.quantity) || 0,
                    reorderPoint: parseFloat(item.reorder_point || item.reorderPoint || item.minStock) || 10,
                    maxStock: parseFloat(item.max_stock || item.maxStock) || 100,
                    daysOfCover: parseInt(item.days_of_cover || item.daysOfCover) || 5,
                    avgDailySales: parseFloat(item.avg_daily_sales || item.avgDailySales) || 1.5,
                    lastOrderDate: item.last_order_date || item.lastOrderDate || "2024-01-01",
                    suggestedQty: parseFloat(item.suggested_qty || item.suggestedQty) || 30,
                    priority:
                      item.priority ||
                      (parseFloat(item.current_stock || item.currentStock || item.quantity) <
                      parseFloat(item.reorder_point || item.reorderPoint || item.minStock) * 0.5
                        ? "critical"
                        : "warning"),
                  })),
                  summary: {
                    critical: inventoryHealth.lowStockItems.filter(
                      (i) =>
                        parseFloat(i.current_stock || i.currentStock || i.quantity) <
                        parseFloat(i.reorder_point || i.reorderPoint || i.minStock) * 0.5
                    ).length,
                    warning: inventoryHealth.lowStockItems.filter(
                      (i) =>
                        parseFloat(i.current_stock || i.currentStock || i.quantity) >=
                        parseFloat(i.reorder_point || i.reorderPoint || i.minStock) * 0.5
                    ).length,
                    approaching: 0,
                    totalValue: inventoryHealth.lowStockItems.reduce(
                      (sum, i) => sum + (parseFloat(i.value || i.total_value) || 0),
                      0
                    ),
                  },
                }
              : null,
        }));
      }

      // Fetch VAT metrics
      const vatMetrics = await dashboardService.getVATMetrics().catch(() => null);
      if (vatMetrics) {
        setWidgetData((prev) => ({
          ...prev,
          vatMetrics: {
            currentQuarter: {
              period: `${vatMetrics.currentPeriod?.quarter} ${vatMetrics.currentPeriod?.year}`,
              periodStart: vatMetrics.currentPeriod?.startDate,
              periodEnd: vatMetrics.currentPeriod?.endDate,
              outputVAT: parseFloat(vatMetrics.collection?.outputVAT || vatMetrics.collection?.output_vat || 0),
              inputVAT: parseFloat(vatMetrics.collection?.inputVAT || vatMetrics.collection?.input_vat || 0),
              netVAT: parseFloat(vatMetrics.collection?.netPayable || vatMetrics.collection?.net_payable || 0),
              dueDate: vatMetrics.returnStatus?.dueDate,
              daysUntilDue: vatMetrics.returnStatus?.daysRemaining || 30,
            },
            previousQuarter: {
              period: "Previous",
              outputVAT: 0,
              inputVAT: 0,
              netVAT: 0,
            },
            yearToDate: {
              outputVAT: parseFloat(vatMetrics.collection?.outputVAT || vatMetrics.collection?.output_vat || 0),
              inputVAT: parseFloat(vatMetrics.collection?.inputVAT || vatMetrics.collection?.input_vat || 0),
              netVAT: parseFloat(vatMetrics.collection?.netPayable || vatMetrics.collection?.net_payable || 0),
            },
            // VAT Return Status data
            returnStatus: {
              currentYear: new Date().getFullYear(),
              quarters:
                vatMetrics.history?.map((h) => ({
                  quarter: h.quarter || h.period,
                  period: h.periodLabel || h.period,
                  periodStart: h.startDate,
                  periodEnd: h.endDate,
                  dueDate: h.dueDate,
                  status: h.status || "draft",
                  ftaReference: h.ftaReference || null,
                  submittedDate: h.submittedDate || null,
                  totalVAT: h.netPayable || h.totalVAT || 0,
                })) || [],
              nextFiling: {
                quarter: `${vatMetrics.currentPeriod?.quarter} ${vatMetrics.currentPeriod?.year}`,
                dueDate: vatMetrics.returnStatus?.dueDate,
                daysRemaining: vatMetrics.returnStatus?.daysRemaining || 30,
              },
            },
          },
        }));
      }

      // Fetch product analytics for category performance and grade analysis
      const productAnalytics = await dashboardService.getProductAnalytics().catch(() => null);
      if (productAnalytics) {
        setWidgetData((prev) => ({
          ...prev,
          // Category Performance - aggregated by product category
          categoryPerformance:
            productAnalytics.categoryPerformance?.length > 0
              ? {
                  categories: productAnalytics.categoryPerformance.map((cat) => ({
                    name: cat.name,
                    revenue: cat.totalRevenue || 0,
                    volume: cat.totalSold || 0,
                    margin: cat.avgMargin || 15,
                    growth: cat.growth || 0,
                    orders: cat.orderCount || cat.productCount || 0,
                    avgOrderValue: cat.totalRevenue && cat.orderCount ? cat.totalRevenue / cat.orderCount : 0,
                  })),
                }
              : null,
          // Grade Analysis - aggregated by steel grade
          gradeAnalysis:
            productAnalytics.gradeAnalysis?.length > 0
              ? {
                  grades: productAnalytics.gradeAnalysis.map((grade, _idx) => ({
                    grade: grade.grade,
                    fullName: `Stainless Steel ${grade.grade?.replace("SS ", "")}`,
                    revenue: grade.totalRevenue || 0,
                    volume: grade.totalSold || 0,
                    margin: grade.avgMargin || 15,
                    avgPrice: grade.avgPrice || 250,
                    priceChange: grade.priceChange || 0,
                    demand: grade.totalSold > 100 ? "high" : grade.totalSold > 50 ? "medium" : "low",
                    trend: grade.trend || [250, 252, 255, 253, 257, 255],
                  })),
                }
              : null,
        }));
      }

      // Fetch customer insights for segments and new customers
      const customerInsights = await dashboardService.getCustomerInsights().catch(() => null);
      if (customerInsights) {
        setWidgetData((prev) => ({
          ...prev,
          customerInsights,
          // Customer Segments data
          customerSegments: {
            byIndustry: customerInsights.analyticsCustomers?.byIndustry || [],
            bySize: customerInsights.analyticsCustomers?.bySize || [],
            byGeography: customerInsights.analyticsCustomers?.byGeography || [],
            totalCustomers: customerInsights.totalCustomers || 0,
            totalRevenue: customerInsights.topCustomers?.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) || 0,
          },
          // New Customer Widget data
          newCustomers: {
            period: new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            }),
            summary: {
              newCustomersCount: customerInsights.newCustomersThisMonth || 0,
              previousPeriodCount: Math.max(0, (customerInsights.newCustomersThisMonth || 0) - 2),
              target: Math.max(15, (customerInsights.newCustomersThisMonth || 0) + 5),
              totalFirstOrderValue:
                customerInsights.topCustomers
                  ?.slice(0, customerInsights.newCustomersThisMonth || 0)
                  .reduce((sum, c) => sum + (c.avgOrderValue || 0), 0) || 0,
              avgFirstOrderValue: customerInsights.avgCLV ? customerInsights.avgCLV / 12 : 0,
              conversionRate: 68,
              retentionRate: 100 - (customerInsights.churnRate || 0),
              previousRetentionRate: 100 - (customerInsights.churnRate || 0) - 3,
            },
            acquisitionSources: [
              {
                source: "Referral",
                count: Math.ceil((customerInsights.newCustomersThisMonth || 0) * 0.4),
                value: 0,
                percent: 40,
              },
              {
                source: "Cold Outreach",
                count: Math.ceil((customerInsights.newCustomersThisMonth || 0) * 0.3),
                value: 0,
                percent: 30,
              },
              {
                source: "Exhibition",
                count: Math.ceil((customerInsights.newCustomersThisMonth || 0) * 0.2),
                value: 0,
                percent: 20,
              },
              {
                source: "Website",
                count: Math.ceil((customerInsights.newCustomersThisMonth || 0) * 0.1),
                value: 0,
                percent: 10,
              },
            ],
            recentCustomers:
              customerInsights.topCustomers?.slice(0, 4).map((c, idx) => ({
                id: c.id,
                name: c.name,
                joinDate: new Date(Date.now() - idx * 3 * 24 * 60 * 60 * 1000).toISOString(),
                firstOrderValue: c.avgOrderValue || 0,
                source: ["Referral", "Cold Outreach", "Exhibition", "Website"][idx % 4],
                assignedAgent: "Sales Team",
                status: "active",
              })) || [],
          },
        }));
      }

      // Fetch agent performance for sales widgets
      const agentPerformance = await dashboardService.getAgentPerformance().catch(() => null);
      if (agentPerformance) {
        setWidgetData((prev) => ({
          ...prev,
          agentPerformance,
        }));
      }

      // ============================================================
      // PHASE 2: Fetch Net Profit, AP Aging, Cash Flow, Stock Turnover, Warehouse Utilization
      // ============================================================

      // Fetch Net Profit data for ProfitSummaryWidget
      const netProfit = await dashboardService.getNetProfit().catch(() => null);
      if (netProfit) {
        setWidgetData((prev) => ({
          ...prev,
          netProfit,
        }));
      }

      // Fetch AP Aging data for APAgingWidget (accounts payable)
      const apAging = await dashboardService.getAPAging().catch(() => null);
      if (apAging) {
        setWidgetData((prev) => ({
          ...prev,
          apAging,
        }));
      }

      // Fetch Cash Flow data for CashFlowWidget
      const cashFlow = await dashboardService.getCashFlow().catch(() => null);
      if (cashFlow) {
        setWidgetData((prev) => ({
          ...prev,
          cashFlow,
        }));
      }

      // Fetch Stock Turnover data for StockTurnoverWidget
      const stockTurnover = await dashboardService.getStockTurnover().catch(() => null);
      if (stockTurnover) {
        setWidgetData((prev) => ({
          ...prev,
          stockTurnover,
        }));
      }

      // Fetch Warehouse Utilization data for WarehouseUtilizationWidget
      const warehouseUtilization = await dashboardService.getWarehouseUtilization().catch(() => null);
      if (warehouseUtilization) {
        setWidgetData((prev) => ({
          ...prev,
          warehouseUtilization,
        }));
      }
    } catch (error) {
      console.error("Error fetching widget data:", error);
    }
  }, []);

  // Refresh handler for individual widgets
  const handleWidgetRefresh = useCallback(
    async (widgetType) => {
      setWidgetLoading((prev) => ({ ...prev, [widgetType]: true }));
      try {
        await fetchWidgetData();
      } finally {
        setWidgetLoading((prev) => ({ ...prev, [widgetType]: false }));
      }
    },
    [fetchWidgetData]
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  const toggleSection = (section) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div className="flex items-center justify-center min-h-96 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 lg:p-8 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      {/* Header */}
      <div className={`mb-6 pb-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Dashboard</h1>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Welcome back! Here&apos;s your business overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRefreshing && <div className="animate-spin h-4 w-4 border-b border-teal-500 rounded-full" />}
            <button
              onClick={fetchDashboardData}
              className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <RefreshCw size={18} className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-teal-600 text-white"
                : isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab - Main Stats */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard variant="default">
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Total Revenue
                    </p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {formatCurrency(stats.totalRevenue)}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                    <DollarSign size={18} className="text-white" />
                  </div>
                </div>
                <ChangeIndicator positive={stats.revenueChange >= 0}>
                  {stats.revenueChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(stats.revenueChange || 0).toFixed(1)}% from last month
                </ChangeIndicator>
              </div>
            </StatsCard>

            <StatsCard variant="success">
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Total Customers
                    </p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {stats.totalCustomers}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Users size={18} className="text-white" />
                  </div>
                </div>
              </div>
            </StatsCard>

            <StatsCard variant="warning">
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Total Products
                    </p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {stats.totalProducts}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <Package size={18} className="text-white" />
                  </div>
                </div>
              </div>
            </StatsCard>

            <StatsCard variant="info">
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Total Invoices
                    </p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {stats.totalInvoices}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <FileText size={18} className="text-white" />
                  </div>
                </div>
              </div>
            </StatsCard>
          </div>

          {/* Quick Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {canViewWidget("revenue-kpi") && (
              <WidgetErrorBoundary widgetName="Revenue KPI">
                <Suspense fallback={<WidgetSkeleton variant="card" />}>
                  <LazyRevenueKPIWidget
                    totalRevenue={stats.totalRevenue}
                    revenueChange={stats.revenueChange}
                    loading={isRefreshing}
                    onRefresh={() => handleWidgetRefresh("revenue")}
                    formatCurrency={formatCurrency}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            )}
            {canViewWidget("inventory-health") && (
              <WidgetErrorBoundary widgetName="Inventory Health">
                <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                  <LazyInventoryHealthWidget data={widgetData.inventoryHealth} />
                </Suspense>
              </WidgetErrorBoundary>
            )}
            {canViewWidget("vat-collection") && (
              <WidgetErrorBoundary widgetName="VAT Collection">
                <Suspense fallback={<WidgetSkeleton variant="card" />}>
                  <LazyVATCollectionWidget
                    data={widgetData.vatMetrics}
                    onRefresh={() => handleWidgetRefresh("vatMetrics")}
                    isLoading={widgetLoading.vatMetrics}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            )}
          </div>
        </>
      )}

      {/* Financial Tab */}
      {activeTab === "financial" && (
        <div {...createHoverPreload("financial")}>
          <SectionHeader
            title="Financial Overview"
            icon={TrendingUp}
            description="Revenue, cash flow, receivables, and payables"
            isExpanded={expandedSections.financial}
            onToggle={() => toggleSection("financial")}
            widgetCount={8}
          />
          {expandedSections.financial && (
            <div
              className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="Revenue KPI">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyRevenueKPIWidget
                      totalRevenue={stats.totalRevenue}
                      revenueChange={stats.revenueChange}
                      loading={widgetLoading.revenue}
                      onRefresh={() => handleWidgetRefresh("revenue")}
                      formatCurrency={formatCurrency}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Net Profit">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyProfitSummaryWidget
                      data={widgetData.netProfit}
                      loading={widgetLoading.netProfit}
                      onRefresh={() => handleWidgetRefresh("netProfit")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="AR Aging">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyARAgingWidget
                      data={widgetData.arAging}
                      loading={widgetLoading.arAging}
                      onRefresh={() => handleWidgetRefresh("arAging")}
                      formatCurrency={formatCurrency}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="AP Aging">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyAPAgingWidget
                      data={widgetData.apAging}
                      loading={widgetLoading.apAging}
                      onRefresh={() => handleWidgetRefresh("apAging")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Gross Margin">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyGrossMarginWidget
                      grossMargin={widgetData.grossMargin}
                      loading={widgetLoading.grossMargin}
                      onRefresh={() => handleWidgetRefresh("grossMargin")}
                      isDarkMode={isDarkMode}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Cash Flow">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCashFlowWidget
                      data={widgetData.cashFlow}
                      loading={widgetLoading.cashFlow}
                      onRefresh={() => handleWidgetRefresh("cashFlow")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="DSO">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyDSOWidget
                      dso={widgetData.dso}
                      loading={widgetLoading.dso}
                      onRefresh={() => handleWidgetRefresh("dso")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Credit Utilization">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyCreditUtilizationWidget
                      creditUtilization={widgetData.creditUtilization}
                      loading={widgetLoading.creditUtilization}
                      onRefresh={() => handleWidgetRefresh("creditUtilization")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products & Inventory Tab */}
      {activeTab === "products" && (
        <div {...createHoverPreload("inventory")}>
          <SectionHeader
            title="Products & Inventory"
            icon={Warehouse}
            description="Stock levels, turnover, and warehouse utilization"
            isExpanded={expandedSections.inventory}
            onToggle={() => toggleSection("inventory")}
            widgetCount={9}
          />
          {expandedSections.inventory && (
            <div
              className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="Inventory Health">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyInventoryHealthWidget data={widgetData.inventoryHealth} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Stock Turnover">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyStockTurnoverWidget
                      data={widgetData.stockTurnover}
                      loading={widgetLoading.stockTurnover}
                      onRefresh={() => handleWidgetRefresh("stockTurnover")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Warehouse Utilization">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyWarehouseUtilizationWidget
                      data={widgetData.warehouseUtilization}
                      loading={widgetLoading.warehouseUtilization}
                      onRefresh={() => handleWidgetRefresh("warehouseUtilization")}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Top Products">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazyTopProductsWidget />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Fast Moving Items">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazyFastMovingWidget data={widgetData.fastMoving} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Slow Moving Items">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazySlowMovingWidget data={widgetData.slowMoving} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Reorder Alerts">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazyReorderAlertsWidget data={widgetData.reorderAlerts} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Category Performance">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCategoryPerformanceWidget data={widgetData.categoryPerformance} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Grade Analysis">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyGradeAnalysisWidget data={widgetData.gradeAnalysis} />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales & Customers Tab */}
      {activeTab === "sales" && (
        <div {...createHoverPreload("sales")}>
          <SectionHeader
            title="Sales & Customers"
            icon={Users}
            description="Agent performance, customer insights"
            isExpanded={expandedSections.sales}
            onToggle={() => toggleSection("sales")}
            widgetCount={8}
          />
          {expandedSections.sales && (
            <div
              className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="Sales Leaderboard">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazyLeaderboardWidget data={widgetData.agentPerformance?.leaderboard} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Agent Scorecard">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyAgentScorecardWidget
                      data={widgetData.agentPerformance?.agents}
                      onRefresh={() => handleWidgetRefresh("agentPerformance")}
                      isLoading={widgetLoading.agentPerformance}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Conversion Funnel">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyConversionFunnelWidget />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Customer Portfolio">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCustomerPortfolioWidget
                      data={
                        widgetData.customerInsights
                          ? {
                              summary: {
                                totalCustomers: widgetData.customerInsights.totalCustomers,
                                activeCustomers:
                                  widgetData.customerInsights.totalCustomers -
                                  Math.floor(
                                    widgetData.customerInsights.totalCustomers *
                                      (widgetData.customerInsights.churnRate / 100)
                                  ),
                                inactiveCustomers: Math.floor(
                                  widgetData.customerInsights.totalCustomers *
                                    (widgetData.customerInsights.churnRate / 100)
                                ),
                                top3Concentration: 42,
                                diversificationScore: 68,
                                riskLevel: "Medium",
                              },
                              topCustomers:
                                widgetData.customerInsights.topCustomers?.slice(0, 3).map((c, _idx) => ({
                                  id: c.id,
                                  name: c.name,
                                  revenue: c.totalRevenue,
                                  percent: Math.round(
                                    (c.totalRevenue /
                                      (widgetData.customerInsights.topCustomers?.reduce(
                                        (sum, tc) => sum + (tc.totalRevenue || 0),
                                        0
                                      ) || 1)) *
                                      100
                                  ),
                                })) || [],
                              segments: widgetData.customerSegments?.byIndustry || [],
                              trendData: {
                                newThisMonth: widgetData.customerInsights.newCustomersThisMonth || 0,
                                churnedThisMonth: Math.floor(
                                  widgetData.customerInsights.totalCustomers *
                                    (widgetData.customerInsights.churnRate / 100 / 12)
                                ),
                                reactivated: 0,
                              },
                            }
                          : null
                      }
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Collection Performance">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCollectionPerformanceWidget />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Customer Segments">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCustomerSegmentsWidget data={widgetData.customerSegments} />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="New Customers">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyNewCustomerWidget
                      data={widgetData.newCustomers}
                      onRefresh={() => handleWidgetRefresh("customerInsights")}
                      isLoading={widgetLoading.customerInsights}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VAT Compliance Tab */}
      {activeTab === "vat" && (
        <div {...createHoverPreload("vat")}>
          <SectionHeader
            title="VAT Compliance"
            icon={Receipt}
            description="UAE VAT tracking and compliance"
            isExpanded={expandedSections.vat}
            onToggle={() => toggleSection("vat")}
            widgetCount={2}
          />
          {expandedSections.vat && (
            <div
              className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="VAT Collection">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyVATCollectionWidget
                      data={widgetData.vatMetrics}
                      onRefresh={() => handleWidgetRefresh("vatMetrics")}
                      isLoading={widgetLoading.vatMetrics}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="VAT Return Status">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyVATReturnStatusWidget
                      data={widgetData.vatMetrics?.returnStatus}
                      isLoading={widgetLoading.vatMetrics}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardV2;
