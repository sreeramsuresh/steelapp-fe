import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Package,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Percent,
  Info,
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// ============================================================================
// CACHE UTILITIES (Stale-While-Revalidate Pattern)
// ============================================================================

const CACHE_KEYS = {
  STATS: 'dashboard_stats_cache',
  AR_AGING: 'dashboard_ar_aging_cache',
  REVENUE_TREND: 'dashboard_revenue_trend_cache',
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data from localStorage
 * @returns {Object|null} - { data, timestamp } or null if not found
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
 * Check if cached data is stale (older than TTL)
 */
const isCacheStale = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TTL_MS;
};

// Custom components for consistent theming
const Button = ({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '', startIcon, ...props }) => {
  const { isDarkMode } = useTheme();

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const getVariantClasses = () => {
    if (variant === 'primary') {
      return `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'} disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    } else { // outline
      return `border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:ring-teal-500 disabled:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} focus:ring-offset-${isDarkMode ? 'gray-800' : 'white'}`;
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
      {children}
    </button>
  );
};

const StatsCard = ({ variant = 'default', children, className = '' }) => {
  const { isDarkMode } = useTheme();

  const getBorderColor = () => {
    switch (variant) {
      case 'success': return 'border-l-green-500';
      case 'warning': return 'border-l-yellow-500';
      case 'error': return 'border-l-red-500';
      case 'info': return 'border-l-blue-500';
      case 'purple': return 'border-l-purple-500';
      default: return 'border-l-teal-500';
    }
  };

  return (
    <div className={`rounded-xl border-l-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-500 min-h-28 flex flex-col ${
      isDarkMode
        ? 'bg-[#1E2328] border-[#37474F]'
        : 'bg-white border-[#E0E0E0]'
    } ${getBorderColor()} ${className}`}>
      {children}
    </div>
  );
};

const ChangeIndicator = ({ positive, children }) => {
  return (
    <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${
      positive ? 'text-green-500' : 'text-red-500'
    }`}>
      {children}
    </div>
  );
};

// AR Aging Widget Component
const ARAgingWidget = ({ data, isDarkMode, formatCurrency }) => {
  if (!data || !data.buckets) return null;

  const bucketColors = [
    { bg: 'bg-green-500', text: 'text-green-600' },
    { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    { bg: 'bg-orange-500', text: 'text-orange-600' },
    { bg: 'bg-red-500', text: 'text-red-600' },
  ];

  return (
    <div className={`rounded-xl border p-4 sm:p-6 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-blue-500" />
        <h3 className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          AR Aging
          <span className="relative group">
            <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
            <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
              Receivables grouped by days overdue
            </span>
          </span>
        </h3>
      </div>

      <div className="space-y-3">
        {data.buckets.map((bucket, index) => (
          <div key={bucket.label} className="flex items-center gap-3">
            <div className="w-24 sm:w-32">
              <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {bucket.label}
              </span>
            </div>
            <div className="flex-1">
              <div className={`h-4 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                <div
                  className={`h-full ${bucketColors[index].bg} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(parseFloat(bucket.percentage) || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="w-20 sm:w-28 text-right">
              <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(bucket.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-4 pt-4 border-t flex justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total AR</span>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(data.total_ar)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overdue</span>
          <p className="text-lg font-bold text-red-500">
            {formatCurrency(data.overdue_ar)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Revenue Trend Chart Component (Simple Bar Chart)
const RevenueTrendChart = ({ data, isDarkMode, formatCurrency }) => {
  if (!data || !data.trend_data || data.trend_data.length === 0) {
    return (
      <div className={`p-8 text-center rounded-xl border-2 border-dashed min-h-60 flex flex-col items-center justify-center ${
        isDarkMode
          ? 'border-[#37474F] bg-gradient-to-br from-[#121418] to-[#1E2328] text-gray-400'
          : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white text-gray-500'
      }`}>
        <Activity size={48} className="mb-4 opacity-60" />
        <h4 className="text-lg font-semibold mb-1">No Revenue Data</h4>
        <p className="text-sm">Create invoices to see revenue trends</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.trend_data.map(d => parseFloat(d.revenue) || 0));

  return (
    <div className="h-full flex flex-col">
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</span>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(data.summary?.total_revenue || 0)}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
          parseFloat(data.summary?.growth_rate || 0) >= 0
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {parseFloat(data.summary?.growth_rate || 0) >= 0
            ? <ArrowUpRight size={14} />
            : <ArrowDownRight size={14} />
          }
          <span className="text-xs font-medium">{Math.abs(parseFloat(data.summary?.growth_rate || 0)).toFixed(1)}%</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end gap-1 sm:gap-2 min-h-40">
        {data.trend_data.slice(-12).map((item, index) => {
          const revenue = parseFloat(item.revenue) || 0;
          const heightPercent = maxRevenue > 0 ? (revenue / maxRevenue * 100) : 0;

          return (
            <div key={item.period} className="flex-1 flex flex-col items-center group">
              {/* Tooltip */}
              <div className={`hidden group-hover:block absolute -mt-16 px-2 py-1 rounded text-xs z-10 ${
                isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white'
              }`}>
                {formatCurrency(revenue)}
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  index === data.trend_data.length - 1
                    ? 'bg-teal-500 hover:bg-teal-400'
                    : isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              />

              {/* Label */}
              <span className={`text-[9px] sm:text-[10px] mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.label?.split(' ')[0]?.substring(0, 3) || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Initialize with cached data for instant display (stale-while-revalidate)
  const cachedStats = getCachedData(CACHE_KEYS.STATS);
  const cachedArAging = getCachedData(CACHE_KEYS.AR_AGING);
  const cachedRevenueTrend = getCachedData(CACHE_KEYS.REVENUE_TREND);

  // Determine if we have any cached data to show immediately
  const hasCachedData = !!(cachedStats?.data || cachedArAging?.data || cachedRevenueTrend?.data);

  const [stats, setStats] = useState(cachedStats?.data || {
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
    revenueChange: 0,
    customersChange: 0,
    productsChange: 0,
    invoicesChange: 0,
    kpis: {
      grossMargin: 0,
      dso: 0,
      creditUtilization: 0,
    },
  });

  const [topProducts, setTopProducts] = useState([]);
  // If we have cached data, don't show loading spinner - show stale data immediately
  const [loading, setLoading] = useState(!hasCachedData);
  // Track if background refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New KPI states - initialize from cache
  const [arAging, setArAging] = useState(cachedArAging?.data || null);
  const [revenueTrend, setRevenueTrend] = useState(cachedRevenueTrend?.data || null);
  const [kpis, setKpis] = useState(cachedStats?.data?.kpis || {
    grossMargin: 0,
    dso: 0,
    creditUtilization: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Only show loading spinner if no cached data
      if (!hasCachedData) {
        setLoading(true);
      } else {
        // Mark as background refresh
        setIsRefreshing(true);
      }

      // Fetch all data in parallel
      const [
        dashboard,
        arAgingData,
        revenueTrendData,
        dashboardKPIs,
      ] = await Promise.all([
        analyticsService.getDashboardData().catch(() => ({})),
        analyticsService.getARAgingBuckets().catch(() => null),
        analyticsService.getRevenueTrend(12).catch(() => null),
        analyticsService.getDashboardKPIs().catch(() => null),
      ]);

      // Trends for month-over-month change
      const trends = Array.isArray(dashboard?.monthlyTrends)
        ? dashboard.monthlyTrends
        : [];
      const current = trends[0] || {};
      const previous = trends[1] || {};
      const safeNum = (v) => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };
      const percentChange = (curr, prev) => {
        const c = safeNum(curr);
        const p = safeNum(prev);
        if (p === 0) return 0;
        return ((c - p) / p) * 100;
      };

      const totalRevenue = safeNum(dashboard?.revenueMetrics?.totalRevenue);
      const totalCustomers = parseInt(dashboard?.customerMetrics?.totalCustomers || 0);
      const totalProducts = parseInt(dashboard?.productMetrics?.totalProducts || 0);
      const totalInvoices = parseInt(dashboard?.revenueMetrics?.totalInvoices || 0);

      const revenueChange = percentChange(current?.revenue, previous?.revenue);
      const invoicesChange = percentChange(current?.invoiceCount, previous?.invoiceCount);
      const customersChange = percentChange(
        current?.uniqueCustomers,
        previous?.uniqueCustomers,
      );

      // Parse KPIs
      const parsedKpis = dashboardKPIs ? {
        grossMargin: parseFloat(dashboardKPIs.gross_margin_percent) || 0,
        dso: parseFloat(dashboardKPIs.dso_days) || 0,
        creditUtilization: parseFloat(dashboardKPIs.credit_utilization_percent) || 0,
      } : { grossMargin: 0, dso: 0, creditUtilization: 0 };

      // Build stats object for caching
      const statsData = {
        totalRevenue,
        totalCustomers,
        totalProducts,
        totalInvoices,
        revenueChange,
        customersChange,
        productsChange: 0,
        invoicesChange,
        kpis: parsedKpis,
      };

      // Update state
      setStats(statsData);
      setKpis(parsedKpis);

      // Top products from analytics
      const tops = Array.isArray(dashboard?.topProducts)
        ? dashboard.topProducts.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          sales: safeNum(p.totalSold),
          revenue: safeNum(p.totalRevenue),
        }))
        : [];
      setTopProducts(tops);

      // Set new KPIs
      setArAging(arAgingData);
      setRevenueTrend(revenueTrendData);

      // ====================================================================
      // CACHE FRESH DATA (Stale-While-Revalidate)
      // ====================================================================
      setCachedData(CACHE_KEYS.STATS, statsData);

      if (arAgingData) {
        setCachedData(CACHE_KEYS.AR_AGING, arAgingData);
      }

      if (revenueTrendData) {
        setCachedData(CACHE_KEYS.REVENUE_TREND, revenueTrendData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    // Handle NaN, null, undefined, or non-numeric values
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;

    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`p-6 md:p-8 min-h-screen w-full ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="flex items-center justify-center min-h-96 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 lg:p-8 min-h-screen w-full overflow-auto ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
      {/* Header Section */}
      <div className={`mb-6 pb-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-3xl md:text-4xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Dashboard
            </h1>
            <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back! Here&apos;s what&apos;s happening with your business.
            </p>
          </div>
          {/* Subtle refresh indicator */}
          {isRefreshing && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
              isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {/* Total Revenue Card */}
        <StatsCard variant="default">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Revenue
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 top-1/2 left-full -translate-y-1/2 ml-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Sum of all invoice amounts, excluding cancelled and draft invoices
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatCurrency(stats.totalRevenue)}
                </h3>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg ml-auto">
                <DollarSign size={18} className="text-white" />
              </div>
            </div>
            <ChangeIndicator positive={stats.revenueChange >= 0}>
              {stats.revenueChange >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(stats.revenueChange).toFixed(1)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>

        {/* Total Customers Card */}
        <StatsCard variant="success">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Customers
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Number of unique customers with at least one invoice
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.totalCustomers}
                </h3>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ml-auto">
                <Users size={18} className="text-white" />
              </div>
            </div>
            <ChangeIndicator positive={stats.customersChange >= 0}>
              {stats.customersChange >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(stats.customersChange).toFixed(1)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>

        {/* Total Products Card */}
        <StatsCard variant="warning">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Products
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Number of active products in your catalog
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.totalProducts}
                </h3>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg ml-auto">
                <Package size={18} className="text-white" />
              </div>
            </div>
            <ChangeIndicator positive={stats.productsChange >= 0}>
              {stats.productsChange >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(stats.productsChange).toFixed(1)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>

        {/* Total Invoices Card */}
        <StatsCard variant="error">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Invoices
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Count of all invoices, excluding drafts and cancelled
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {stats.totalInvoices}
                </h3>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg ml-auto">
                <FileText size={18} className="text-white" />
              </div>
            </div>
            <ChangeIndicator positive={stats.invoicesChange >= 0}>
              {stats.invoicesChange >= 0 ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(stats.invoicesChange).toFixed(1)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Gross Margin KPI */}
        <StatsCard variant="info">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Gross Margin
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 top-1/2 left-full -translate-y-1/2 ml-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Percentage of revenue remaining after deducting cost of goods sold
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {kpis.grossMargin.toFixed(1)}%
                </h3>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ml-auto">
                <Percent size={18} className="text-white" />
              </div>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Weighted average across all sales
            </p>
          </div>
        </StatsCard>

        {/* DSO KPI */}
        <StatsCard variant="purple">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  DSO
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Days Sales Outstanding - average days to collect payment
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {kpis.dso.toFixed(0)} days
                </h3>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg ml-auto">
                <Clock size={18} className="text-white" />
              </div>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Average time to collect payment
            </p>
          </div>
        </StatsCard>

        {/* Credit Utilization KPI */}
        <StatsCard variant={kpis.creditUtilization > 80 ? 'error' : kpis.creditUtilization > 60 ? 'warning' : 'success'}>
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Credit Utilization
                  <span className="relative group">
                    <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                    <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                      Percentage of customer credit limits currently being used
                    </span>
                  </span>
                </p>
                <h3 className={`text-lg sm:text-xl font-bold leading-tight ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {kpis.creditUtilization.toFixed(1)}%
                </h3>
              </div>
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg ml-auto ${
                kpis.creditUtilization > 80
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : kpis.creditUtilization > 60
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                <CreditCard size={18} className="text-white" />
              </div>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Outstanding vs credit limits
            </p>
          </div>
        </StatsCard>
      </div>

      {/* Charts and Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2">
          <div className={`h-auto md:h-96 min-h-80 rounded-xl border overflow-hidden flex flex-col ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-4">
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1 flex items-center gap-1.5 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Revenue Trend
                    <span className="relative group">
                      <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                      <span className="hidden group-hover:block absolute z-50 top-1/2 left-full -translate-y-1/2 ml-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                        Monthly revenue over the last 12 months
                      </span>
                    </span>
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Monthly revenue for the last 12 months
                  </p>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    startIcon={<BarChart3 size={16} />}
                    className="w-full sm:w-auto"
                    onClick={() => navigate('/trends')}
                  >
                    View Report
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <RevenueTrendChart
                  data={revenueTrend}
                  isDarkMode={isDarkMode}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AR Aging Widget */}
        <div className="lg:col-span-1">
          <ARAgingWidget
            data={arAging}
            isDarkMode={isDarkMode}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      {/* Top Products Widget - Full Width */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className={`rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start flex-col sm:flex-row gap-2 mb-4">
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Top Products
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Best performing products by revenue
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => navigate('/products')}
              >
                View All Products
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => {
                  const getGradient = () => {
                    const gradients = [
                      'from-indigo-500 to-purple-600',
                      'from-emerald-500 to-green-600',
                      'from-amber-500 to-orange-600',
                      'from-red-500 to-red-600',
                      'from-blue-500 to-cyan-600',
                    ];
                    return gradients[index % 5];
                  };

                  return (
                    <div key={product.id} className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      isDarkMode ? 'border-[#37474F] bg-[#2E3B4E]/50 hover:bg-[#2E3B4E]' : 'border-gray-200 bg-gray-50 hover:bg-white'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient()} flex items-center justify-center shadow-lg`}>
                          <Package size={20} className="text-white" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold mb-1 truncate ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`} title={product.displayName || product.name}>
                          {product.displayName || product.name}
                        </p>
                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.category}
                        </p>
                        <p className={`text-lg font-bold ${
                          isDarkMode ? 'text-teal-400' : 'text-teal-600'
                        }`}>
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {product.sales} sales
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-8 text-center">
                  <Package
                    size={48}
                    className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  />
                  <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    No products found
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Add products and create invoices to see top performers
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
