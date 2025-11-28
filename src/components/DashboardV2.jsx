/**
 * DashboardV2 - Enhanced Dashboard with Widget Integration
 * Features: Role-based widgets, lazy loading, collapsible sections
 */

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import {
  BarChart3, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight,
  RefreshCw, ChevronDown, ChevronUp, TrendingUp, Warehouse, FileText, Receipt,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { analyticsService } from '../services/analyticsService';
import { dashboardService } from '../services/dashboardService';
import { useDashboardPermissions } from '../hooks/useDashboardPermissions';
import WidgetSkeleton from './dashboard/WidgetSkeleton';
import WidgetErrorBoundary from './dashboard/WidgetErrorBoundary';
import { preloadByRole, createHoverPreload } from './dashboard/preloadWidgets';

// Lazy load widgets
const LazyRevenueKPIWidget = lazy(() => import('./dashboard/widgets/financial/RevenueKPIWidget'));
const LazyARAgingWidget = lazy(() => import('./dashboard/widgets/financial/ARAgingWidget'));
const LazyGrossMarginWidget = lazy(() => import('./dashboard/widgets/financial/GrossMarginWidget'));
const LazyCashFlowWidget = lazy(() => import('./dashboard/widgets/financial/CashFlowWidget'));
const LazyInventoryHealthWidget = lazy(() => import('./dashboard/widgets/inventory/InventoryHealthWidget'));
const LazyTopProductsWidget = lazy(() => import('./dashboard/widgets/product/TopProductsWidget'));
const LazyVATCollectionWidget = lazy(() => import('./dashboard/widgets/vat/VATCollectionWidget'));
const LazyLeaderboardWidget = lazy(() => import('./dashboard/widgets/sales-agent/LeaderboardWidget'));
const LazyCustomerSegmentsWidget = lazy(() => import('./dashboard/widgets/customer/CustomerSegmentsWidget'));

// Cache utilities
const CACHE_KEYS = {
  STATS: 'dashboard_stats_cache',
  TAB: 'dashboard_active_tab',
};

const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) { /* ignore storage errors */ }
};

// Reusable Components
const StatsCard = ({ variant = 'default', children, className = '' }) => {
  const { isDarkMode } = useTheme();
  const borderColors = {
    default: 'border-l-teal-500', success: 'border-l-green-500',
    warning: 'border-l-yellow-500', error: 'border-l-red-500',
    info: 'border-l-blue-500', purple: 'border-l-purple-500',
  };

  return (
    <div className={`rounded-xl border-l-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-28 flex flex-col ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    } ${borderColors[variant]} ${className}`}>
      {children}
    </div>
  );
};

const ChangeIndicator = ({ positive, children }) => (
  <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${positive ? 'text-green-500' : 'text-red-500'}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, icon: Icon, description, isExpanded, onToggle, widgetCount }) => {
  const { isDarkMode } = useTheme();
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
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
        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}><Icon size={20} className="text-teal-500" /></div>}
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              {widgetCount} widgets
            </span>
          </div>
          {description && <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>}
        </div>
      </div>
      <button className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
    </div>
  );
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'products', label: 'Products & Inventory', icon: Package },
  { id: 'sales', label: 'Sales & Customers', icon: Users },
  { id: 'vat', label: 'VAT Compliance', icon: Receipt },
];

const DashboardV2 = () => {
  const { isDarkMode } = useTheme();
  const { role, canViewWidget } = useDashboardPermissions();

  const [activeTab, setActiveTab] = useState(getCachedData(CACHE_KEYS.TAB)?.data || 'overview');
  const [expandedSections, setExpandedSections] = useState({ financial: true, inventory: true, sales: true, vat: true });
  const [stats, setStats] = useState(getCachedData(CACHE_KEYS.STATS)?.data || { totalRevenue: 0, totalCustomers: 0, totalProducts: 0, totalInvoices: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Widget data states
  const [widgetData, setWidgetData] = useState({
    arAging: null,
    grossMargin: 0,
    cashFlow: null,
    inventoryHealth: null,
    vatMetrics: null,
  });
  const [widgetLoading, setWidgetLoading] = useState({
    arAging: false,
    grossMargin: false,
    cashFlow: false,
    inventoryHealth: false,
    vatMetrics: false,
  });

  useEffect(() => {
    fetchDashboardData();
    fetchWidgetData();
    preloadByRole(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    setCachedData(CACHE_KEYS.TAB, activeTab);
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const dashboard = await analyticsService.getDashboardData().catch(() => ({}));

      // API returns: { metrics: { totalRevenue, totalCustomers, totalOrders, ... } }
      // Also support legacy structure: { revenueMetrics, customerMetrics, productMetrics }
      const newStats = {
        totalRevenue: parseFloat(
          dashboard?.metrics?.totalRevenue ||
          dashboard?.revenueMetrics?.totalRevenue
        ) || 0,
        totalCustomers: parseInt(
          dashboard?.metrics?.totalCustomers ||
          dashboard?.customerMetrics?.totalCustomers
        ) || 0,
        totalProducts: parseInt(
          dashboard?.metrics?.totalProducts ||
          dashboard?.productMetrics?.totalProducts
        ) || 0,
        totalInvoices: parseInt(
          dashboard?.metrics?.totalOrders ||
          dashboard?.revenueMetrics?.totalInvoices
        ) || 0,
        revenueChange: 0,
        customersChange: 0,
      };

      setStats(newStats);
      setCachedData(CACHE_KEYS.STATS, newStats);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
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
        setStats(prev => ({
          ...prev,
          totalRevenue: metrics.summary.totalRevenue || prev.totalRevenue,
          totalCustomers: metrics.summary.totalCustomers || prev.totalCustomers,
          totalProducts: metrics.summary.totalProducts || prev.totalProducts,
          totalInvoices: metrics.summary.totalInvoices || prev.totalInvoices,
          revenueChange: metrics.summary.revenueChange || 0,
          customersChange: metrics.summary.customersChange || 0,
        }));
      }

      // Update widget data
      setWidgetData(prev => ({
        ...prev,
        arAging: metrics?.arAging || null,
        grossMargin: metrics?.kpis?.grossMargin || 0,
      }));

      // Fetch inventory health data
      const inventoryHealth = await dashboardService.getInventoryHealth().catch(() => null);
      if (inventoryHealth) {
        setWidgetData(prev => ({
          ...prev,
          inventoryHealth: {
            healthScore: inventoryHealth.turnoverRate ? Math.min(100, Math.round(inventoryHealth.turnoverRate * 10)) : 78,
            totalValue: inventoryHealth.summary?.totalValue || 0,
            totalItems: inventoryHealth.summary?.totalItems || 0,
            daysOfStock: Math.round(inventoryHealth.avgDaysToSell) || 45,
            breakdown: inventoryHealth.warehouseUtilization?.length > 0
              ? inventoryHealth.warehouseUtilization
              : null,
            alerts: {
              lowStock: inventoryHealth.summary?.lowStockCount || 0,
              overstock: inventoryHealth.summary?.outOfStockCount || 0,
              expiring: 0,
            },
          },
        }));
      }

      // Fetch VAT metrics
      const vatMetrics = await dashboardService.getVATMetrics().catch(() => null);
      if (vatMetrics) {
        setWidgetData(prev => ({
          ...prev,
          vatMetrics: {
            currentQuarter: {
              period: vatMetrics.currentPeriod?.quarter + ' ' + vatMetrics.currentPeriod?.year,
              periodStart: vatMetrics.currentPeriod?.startDate,
              periodEnd: vatMetrics.currentPeriod?.endDate,
              outputVAT: vatMetrics.collection?.outputVAT || 0,
              inputVAT: vatMetrics.collection?.inputVAT || 0,
              netVAT: vatMetrics.collection?.netPayable || 0,
              dueDate: vatMetrics.returnStatus?.dueDate,
              daysUntilDue: vatMetrics.returnStatus?.daysRemaining || 30,
            },
            previousQuarter: {
              period: 'Previous',
              outputVAT: 0,
              inputVAT: 0,
              netVAT: 0,
            },
            yearToDate: {
              outputVAT: vatMetrics.collection?.outputVAT || 0,
              inputVAT: vatMetrics.collection?.inputVAT || 0,
              netVAT: vatMetrics.collection?.netPayable || 0,
            },
          },
        }));
      }

    } catch (error) {
      console.error('Error fetching widget data:', error);
    }
  }, []);

  // Refresh handler for individual widgets
  const handleWidgetRefresh = useCallback(async (widgetType) => {
    setWidgetLoading(prev => ({ ...prev, [widgetType]: true }));
    try {
      await fetchWidgetData();
    } finally {
      setWidgetLoading(prev => ({ ...prev, [widgetType]: false }));
    }
  }, [fetchWidgetData]);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 0 }).format(amount || 0);
  const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  if (loading) {
    return (
      <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex items-center justify-center min-h-96 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 lg:p-8 min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      {/* Header */}
      <div className={`mb-6 pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Welcome back! Here&apos;s your business overview.</p>
          </div>
          <div className="flex items-center gap-2">
            {isRefreshing && <div className="animate-spin h-4 w-4 border-b border-teal-500 rounded-full" />}
            <button onClick={fetchDashboardData} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <RefreshCw size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white'
                : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab - Main Stats */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard variant="default">
              <div className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.totalRevenue)}</h3>
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
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Customers</p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalCustomers}</h3>
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
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Products</p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalProducts}</h3>
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
                    <p className={`text-sm uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Invoices</p>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalInvoices}</h3>
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
            {canViewWidget('revenue-kpi') && (
              <WidgetErrorBoundary widgetName="Revenue KPI">
                <Suspense fallback={<WidgetSkeleton variant="card" />}>
                  <LazyRevenueKPIWidget
                    totalRevenue={stats.totalRevenue}
                    revenueChange={stats.revenueChange}
                    loading={isRefreshing}
                    onRefresh={() => handleWidgetRefresh('revenue')}
                    formatCurrency={formatCurrency}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            )}
            {canViewWidget('inventory-health') && (
              <WidgetErrorBoundary widgetName="Inventory Health">
                <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                  <LazyInventoryHealthWidget
                    data={widgetData.inventoryHealth}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            )}
            {canViewWidget('vat-collection') && (
              <WidgetErrorBoundary widgetName="VAT Collection">
                <Suspense fallback={<WidgetSkeleton variant="card" />}>
                  <LazyVATCollectionWidget
                    data={widgetData.vatMetrics}
                    onRefresh={() => handleWidgetRefresh('vatMetrics')}
                    isLoading={widgetLoading.vatMetrics}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            )}
          </div>
        </>
      )}

      {/* Financial Tab */}
      {activeTab === 'financial' && (
        <div {...createHoverPreload('financial')}>
          <SectionHeader
            title="Financial Overview"
            icon={TrendingUp}
            description="Revenue, cash flow, and receivables"
            isExpanded={expandedSections.financial}
            onToggle={() => toggleSection('financial')}
            widgetCount={4}
          />
          {expandedSections.financial && (
            <div className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="Revenue KPI">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyRevenueKPIWidget
                      totalRevenue={stats.totalRevenue}
                      revenueChange={stats.revenueChange}
                      loading={widgetLoading.revenue}
                      onRefresh={() => handleWidgetRefresh('revenue')}
                      formatCurrency={formatCurrency}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="AR Aging">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyARAgingWidget
                      data={widgetData.arAging}
                      loading={widgetLoading.arAging}
                      onRefresh={() => handleWidgetRefresh('arAging')}
                      formatCurrency={formatCurrency}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Gross Margin">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyGrossMarginWidget
                      grossMargin={widgetData.grossMargin}
                      loading={widgetLoading.grossMargin}
                      onRefresh={() => handleWidgetRefresh('grossMargin')}
                      isDarkMode={isDarkMode}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Cash Flow">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCashFlowWidget
                      data={widgetData.cashFlow}
                      onRefresh={() => handleWidgetRefresh('cashFlow')}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products & Inventory Tab */}
      {activeTab === 'products' && (
        <div {...createHoverPreload('inventory')}>
          <SectionHeader
            title="Products & Inventory"
            icon={Warehouse}
            description="Stock levels, product performance"
            isExpanded={expandedSections.inventory}
            onToggle={() => toggleSection('inventory')}
            widgetCount={3}
          />
          {expandedSections.inventory && (
            <div className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="Inventory Health">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyInventoryHealthWidget
                      data={widgetData.inventoryHealth}
                    />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Top Products">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazyTopProductsWidget />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sales & Customers Tab */}
      {activeTab === 'sales' && (
        <div {...createHoverPreload('sales')}>
          <SectionHeader
            title="Sales & Customers"
            icon={Users}
            description="Agent performance, customer insights"
            isExpanded={expandedSections.sales}
            onToggle={() => toggleSection('sales')}
            widgetCount={3}
          />
          {expandedSections.sales && (
            <div className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="Sales Leaderboard">
                  <Suspense fallback={<WidgetSkeleton variant="list" />}>
                    <LazyLeaderboardWidget />
                  </Suspense>
                </WidgetErrorBoundary>
                <WidgetErrorBoundary widgetName="Customer Segments">
                  <Suspense fallback={<WidgetSkeleton variant="chart" />}>
                    <LazyCustomerSegmentsWidget />
                  </Suspense>
                </WidgetErrorBoundary>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VAT Compliance Tab */}
      {activeTab === 'vat' && (
        <div {...createHoverPreload('vat')}>
          <SectionHeader
            title="VAT Compliance"
            icon={Receipt}
            description="UAE VAT tracking and compliance"
            isExpanded={expandedSections.vat}
            onToggle={() => toggleSection('vat')}
            widgetCount={2}
          />
          {expandedSections.vat && (
            <div className={`p-4 rounded-b-xl border border-t-0 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WidgetErrorBoundary widgetName="VAT Collection">
                  <Suspense fallback={<WidgetSkeleton variant="card" />}>
                    <LazyVATCollectionWidget
                      data={widgetData.vatMetrics}
                      onRefresh={() => handleWidgetRefresh('vatMetrics')}
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
