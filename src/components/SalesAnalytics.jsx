import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Target,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  subMonths,
  subQuarters,
} from 'date-fns';
import { analyticsService } from '../services/analyticsService';
import { useApiData } from '../hooks/useApi';

const SalesAnalytics = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date());

  const dateParams = useMemo(() => {
    const date = new Date(selectedPeriod);
    let startDate, endDate;

    if (dateRange === 'month') {
      startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      endDate = format(endOfMonth(date), 'yyyy-MM-dd');
    } else if (dateRange === 'quarter') {
      startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
      endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  }, [selectedPeriod, dateRange]);

  // Compute previous period params for growth comparisons
  const prevDateParams = useMemo(() => {
    const date = new Date(selectedPeriod);
    let prevStart, prevEnd;
    if (dateRange === 'month') {
      const prev = subMonths(date, 1);
      prevStart = format(startOfMonth(prev), 'yyyy-MM-dd');
      prevEnd = format(endOfMonth(prev), 'yyyy-MM-dd');
    } else if (dateRange === 'quarter') {
      const prev = subQuarters(date, 1);
      prevStart = format(startOfQuarter(prev), 'yyyy-MM-dd');
      prevEnd = format(endOfQuarter(prev), 'yyyy-MM-dd');
    }
    return { startDate: prevStart, endDate: prevEnd };
  }, [selectedPeriod, dateRange]);

  const { data: dashboardData } = useApiData(
    () => analyticsService.getDashboardData(dateParams),
    [dateParams],
  );

  const { data: salesTrends } = useApiData(
    () => analyticsService.getSalesTrends(dateParams),
    [dateParams],
  );

  const { data: productPerformance } = useApiData(
    () => analyticsService.getProductPerformance(dateParams),
    [dateParams],
  );

  // Previous period datasets for growth comparisons
  const { data: dashboardPrev } = useApiData(
    () => analyticsService.getDashboardData(prevDateParams),
    [prevDateParams],
  );
  const { data: productPerformancePrev } = useApiData(
    () => analyticsService.getProductPerformance(prevDateParams),
    [prevDateParams],
  );

  const { data: customerAnalysis } = useApiData(
    () => analyticsService.getCustomerAnalysis(dateParams),
    [dateParams],
  );

  // Use API data for analytics
  const analytics = useMemo(() => {
    if (!dashboardData) {
      return {
        currentRevenue: 0,
        revenueGrowth: 0,
        currentOrders: 0,
        ordersGrowth: 0,
        uniqueCustomers: 0,
        customersGrowth: 0,
        avgOrderValue: 0,
        avgOrderGrowth: 0,
        topProducts: [],
        topCustomers: [],
        categoryPerformance: [],
        monthlyTrend: [],
      };
    }

    const safeNum = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    // Monthly trend from salesTrends (handle both array and { data: [...] } format)
    const salesTrendsArray = Array.isArray(salesTrends)
      ? salesTrends
      : salesTrends?.data || [];

    const monthlyTrend = Array.isArray(salesTrendsArray)
      ? salesTrendsArray
        .slice()
        .sort((a, b) => new Date(a.period) - new Date(b.period))
        .map((row) => ({
          month: format(new Date(row.period), 'MMM yyyy'),
          revenue: safeNum(row.revenue),
          orders: parseInt(row.invoiceCount || 0),
          customers: parseInt(row.uniqueCustomers || 0),
        }))
      : [];

    // Compute growth vs previous point from trends
    const curr = monthlyTrend[monthlyTrend.length - 1] || {};
    const prev = monthlyTrend[monthlyTrend.length - 2] || {};
    const pct = (c, p) => (p && p !== 0 ? ((c - p) / p) * 100 : 0);

    // Build previous period map by product id for growth
    const prevMap = new Map(
      (Array.isArray(productPerformancePrev) ? productPerformancePrev : []).map(
        (p) => [p.id, p],
      ),
    );

    // Top products mapping from productPerformance array with growth vs previous period
    const topProductsArr = Array.isArray(productPerformance)
      ? productPerformance
        .slice()
        .sort((a, b) => safeNum(b.totalRevenue) - safeNum(a.totalRevenue))
        .map((p) => {
          const prevProduct = prevMap.get(p.id) || {};
          const revGrowth = (function () {
            const c = safeNum(p.totalRevenue);
            const pr = safeNum(prevProduct.totalRevenue);
            return pr !== 0 ? ((c - pr) / pr) * 100 : 0;
          })();
          const qtyGrowth = (function () {
            const c = safeNum(p.totalSold);
            const pr = safeNum(prevProduct.totalSold);
            return pr !== 0 ? ((c - pr) / pr) * 100 : 0;
          })();
          const ordGrowth = (function () {
            const c = parseInt(p.timesSold || 0);
            const pr = parseInt(prevProduct.timesSold || 0);
            return pr !== 0 ? ((c - pr) / pr) * 100 : 0;
          })();
          return {
            id: p.id,
            product: p.name,
            revenue: safeNum(p.totalRevenue),
            orders: parseInt(p.timesSold || 0),
            quantity: safeNum(p.totalSold),
            category: p.category,
            revenueGrowth: revGrowth,
            quantityGrowth: qtyGrowth,
            ordersGrowth: ordGrowth,
            prevRevenue: safeNum(prev.totalRevenue),
            prevQuantity: safeNum(prev.totalSold),
            prevOrders: parseInt(prev.timesSold || 0),
          };
        })
      : [];

    // Category performance aggregated from productPerformance
    const categoryPerf = {};
    if (Array.isArray(productPerformance)) {
      for (const p of productPerformance) {
        const key = p.category || 'Uncategorized';
        if (!categoryPerf[key]) {
          categoryPerf[key] = { revenue: 0, orders: 0, avgOrderValue: 0 };
        }
        categoryPerf[key].revenue += safeNum(p.totalRevenue);
        categoryPerf[key].orders += parseInt(p.timesSold || 0);
      }
      for (const k of Object.keys(categoryPerf)) {
        const c = categoryPerf[k];
        c.avgOrderValue = c.orders > 0 ? c.revenue / c.orders : 0;
      }
    }

    // Top customers mapping from customerAnalysis array
    const topCustomersArr = Array.isArray(customerAnalysis)
      ? customerAnalysis
        .slice()
        .sort((a, b) => safeNum(b.totalRevenue) - safeNum(a.totalRevenue))
        .map((c) => ({
          customer: c.name || c.company || 'Unknown',
          revenue: safeNum(c.totalRevenue),
          orders: parseInt(c.totalInvoices || 0),
        }))
      : [];

    const revMetrics = dashboardData.revenueMetrics || {};
    const revPrev = (dashboardPrev && dashboardPrev.revenueMetrics) || {};
    const custMetrics = dashboardData.customerMetrics || {};

    return {
      currentRevenue: safeNum(revMetrics.totalRevenue),
      revenueGrowth: pct(safeNum(curr.revenue), safeNum(prev.revenue)),
      currentOrders: parseInt(revMetrics.totalInvoices || 0),
      ordersGrowth: pct(parseInt(curr.orders || 0), parseInt(prev.orders || 0)),
      uniqueCustomers: parseInt(
        custMetrics.totalCustomers || curr.customers || 0,
      ),
      customersGrowth: pct(
        parseInt(curr.customers || 0),
        parseInt(prev.customers || 0),
      ),
      avgOrderValue: safeNum(revMetrics.averageInvoiceValue),
      avgOrderGrowth: (function () {
        const c = safeNum(revMetrics.averageInvoiceValue);
        const p = safeNum(revPrev.averageInvoiceValue);
        return p !== 0 ? ((c - p) / p) * 100 : 0;
      })(),
      prevTotalRevenue: safeNum(revPrev.totalRevenue),
      prevTotalInvoices: parseInt(revPrev.totalInvoices || 0),
      prevAvgOrderValue: safeNum(revPrev.averageInvoiceValue),
      topProducts: topProductsArr,
      topCustomers: topCustomersArr,
      categoryPerformance: categoryPerf,
      monthlyTrend,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dashboardData,
    dashboardPrev,
    productPerformance,
    productPerformancePrev,
    customerAnalysis,
    salesTrends,
    selectedPeriod,
    dateRange,
    isDarkMode,
  ]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGrowth = (growth) => {
    if (growth > 0) return `+${growth.toFixed(1)}%`;
    if (growth < 0) return `${growth.toFixed(1)}%`;
    return '0%';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <ArrowUp size={16} className="text-green-600" />;
    if (growth < 0) return <ArrowDown size={16} className="text-red-600" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const renderOverview = () => (
    <div>
      {/* Period Selector */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <label
              htmlFor="period-select"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Period
            </label>
            <select
              id="period-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`w-32 px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="month">Monthly</option>
              <option value="quarter">Quarterly</option>
            </select>
            <div className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center pointer-events-none">
              <ChevronDown
                size={20}
                className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="period-input"
              className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Select Period
            </label>
            <input
              id="period-input"
              type="month"
              value={format(selectedPeriod, 'yyyy-MM')}
              onChange={(e) => setSelectedPeriod(new Date(e.target.value))}
              className={`w-40 px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
        <button
          onClick={() => console.log('Export report')}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            isDarkMode
              ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
              : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div>
          <div
            className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <DollarSign size={24} color="#10b981" />
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total Revenue
                </span>
              </div>
              <h3
                className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {formatCurrency(analytics.currentRevenue)}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.revenueGrowth)}
                <span
                  title={`Prev: ${formatCurrency(analytics.prevTotalRevenue || 0)} • Current: ${formatCurrency(analytics.currentRevenue || 0)}`}
                  className={`text-sm font-medium ${
                    analytics.revenueGrowth > 0
                      ? 'text-green-600'
                      : analytics.revenueGrowth < 0
                        ? 'text-red-600'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-600'
                  }`}
                >
                  {formatGrowth(analytics.revenueGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Package size={24} color="#3b82f6" />
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Total Orders
                </span>
              </div>
              <h3
                className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {analytics.currentOrders}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.ordersGrowth)}
                <span
                  title={`Prev: ${(analytics.prevTotalInvoices || 0).toLocaleString()} • Current: ${(analytics.currentOrders || 0).toLocaleString()}`}
                  className={`text-sm font-medium ${
                    analytics.ordersGrowth > 0
                      ? 'text-green-600'
                      : analytics.ordersGrowth < 0
                        ? 'text-red-600'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-600'
                  }`}
                >
                  {formatGrowth(analytics.ordersGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users size={24} color="#8b5cf6" />
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Active Customers
                </span>
              </div>
              <h3
                className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {analytics.uniqueCustomers}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.customersGrowth)}
                <span
                  className={`text-sm font-medium ${
                    analytics.customersGrowth > 0
                      ? 'text-green-600'
                      : analytics.customersGrowth < 0
                        ? 'text-red-600'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-600'
                  }`}
                >
                  {formatGrowth(analytics.customersGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Target size={24} color="#f59e0b" />
                <span
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Avg Order Value
                </span>
              </div>
              <h3
                className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {formatCurrency(analytics.avgOrderValue)}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.avgOrderGrowth)}
                <span
                  title={`Prev: ${formatCurrency(analytics.prevAvgOrderValue || 0)} • Current: ${formatCurrency(analytics.avgOrderValue || 0)}`}
                  className={`text-sm font-medium ${
                    analytics.avgOrderGrowth > 0
                      ? 'text-green-600'
                      : analytics.avgOrderGrowth < 0
                        ? 'text-red-600'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-600'
                  }`}
                >
                  {formatGrowth(analytics.avgOrderGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Revenue Trend (Last 6 Months)
              </h3>
              <div className="flex items-end justify-around h-48 px-4">
                {analytics.monthlyTrend.map((month, index) => {
                  const maxRevenue = Math.max(
                    ...analytics.monthlyTrend.map((m) => m.revenue || 0),
                  );
                  const height =
                    analytics.monthlyTrend.length > 0
                      ? (month.revenue / maxRevenue) * 140
                      : 4;

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1 min-h-48 relative"
                    >
                      <div className="flex items-end h-36 mb-2">
                        <div
                          className="w-5 bg-gradient-to-br from-teal-600 to-teal-700 rounded-t transition-all duration-300"
                          style={{ height: `${height}px`, minHeight: '4px' }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold mb-1 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {formatCurrency(month.revenue || 0).replace(
                          'د.إ',
                          'د.إ',
                        )}
                      </span>
                      <span
                        className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {month.month || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Category Performance
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.categoryPerformance)
                  .sort(([, a], [, b]) => b.revenue - a.revenue)
                  .map(([category, data]) => {
                    const maxRevenue = Math.max(
                      ...Object.values(analytics.categoryPerformance).map(
                        (c) => c.revenue || 0,
                      ),
                    );
                    const percentage =
                      Object.values(analytics.categoryPerformance).length > 0
                        ? (data.revenue / maxRevenue) * 100
                        : 0;

                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </span>
                          <span
                            className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {formatCurrency(data.revenue)}
                          </span>
                        </div>
                        <div
                          className={`h-2 rounded-full mb-1 ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className="h-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {data.orders} orders
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerAnalysis = () => (
    <div>
      {/* Analysis Header */}
      <div className="flex justify-between items-center mb-6">
        <h3
          className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Customer Sales Analysis
        </h3>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
            isDarkMode
              ? 'border-teal-600 bg-teal-900/20 text-teal-300'
              : 'border-teal-300 bg-teal-50 text-teal-700'
          }`}
        >
          {format(
            selectedPeriod,
            dateRange === 'month' ? 'MMMM yyyy' : 'QQQ yyyy',
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Distribution */}
        <div className="md:col-span-1">
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-purple-600" />
                <h3
                  className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Customer Distribution
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      High Value (AED 0.5M+)
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {
                        analytics.topCustomers.filter(
                          (c) => c.revenue >= 500000,
                        ).length
                      }
                    </span>
                  </div>
                  <span
                    className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {formatCurrency(
                      analytics.topCustomers
                        .filter((c) => c.revenue >= 500000)
                        .reduce((sum, c) => sum + c.revenue, 0),
                    )}
                  </span>
                </div>
                <hr
                  className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                />
                <div>
                  <div className="flex justify-between mb-1">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Medium Value (AED 0.1M - 0.5M)
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {
                        analytics.topCustomers.filter(
                          (c) => c.revenue >= 100000 && c.revenue < 500000,
                        ).length
                      }
                    </span>
                  </div>
                  <span
                    className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {formatCurrency(
                      analytics.topCustomers
                        .filter(
                          (c) => c.revenue >= 100000 && c.revenue < 500000,
                        )
                        .reduce((sum, c) => sum + c.revenue, 0),
                    )}
                  </span>
                </div>
                <hr
                  className={isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                />
                <div>
                  <div className="flex justify-between mb-1">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Regular (AED Under 0.1M)
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {
                        analytics.topCustomers.filter((c) => c.revenue < 100000)
                          .length
                      }
                    </span>
                  </div>
                  <span
                    className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {formatCurrency(
                      analytics.topCustomers
                        .filter((c) => c.revenue < 100000)
                        .reduce((sum, c) => sum + c.revenue, 0),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="md:col-span-2">
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <h3
                className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Top Customers by Revenue
              </h3>
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, index) => (
                  <div
                    key={customer.customer || index}
                    className={`border rounded-lg p-4 ${
                      isDarkMode
                        ? 'border-gray-700 bg-gray-800/50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          index === 0
                            ? 'bg-yellow-400 text-gray-900'
                            : index === 1
                              ? 'bg-gray-400 text-white'
                              : index === 2
                                ? 'bg-orange-600 text-white'
                                : isDarkMode
                                  ? 'bg-teal-900/50 text-teal-300'
                                  : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        {index < 3 ? (
                          <Award size={20} />
                        ) : (
                          <span className="text-sm">#{index + 1}</span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1">
                        <h4
                          className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                          {customer.customer || 'Unknown Customer'}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} className="text-green-600" />
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            >
                              {formatCurrency(customer.revenue || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package size={14} className="text-blue-600" />
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            >
                              {customer.orders || 0} orders
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target size={14} className="text-orange-600" />
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            >
                              {formatCurrency(
                                (customer.revenue || 0) /
                                  (customer.orders || 1),
                              )}{' '}
                              avg
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="w-24">
                        <div
                          className={`h-2 rounded-full overflow-hidden ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-teal-600 to-teal-700 rounded-full transition-all duration-300"
                            style={{
                              width: `${(customer.revenue / (analytics.topCustomers[0]?.revenue || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="md:col-span-3">
          <div
            className={`border rounded-xl ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-teal-600" />
                <h3
                  className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Key Insights
                </h3>
              </div>
              <div className="space-y-3">
                {(() => {
                  const topThreeRevenue =
                    (analytics.topCustomers || [])
                      .slice(0, 3)
                      .reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;
                  const currentRev = analytics.currentRevenue || 0;
                  const percentage =
                    currentRev > 0
                      ? ((topThreeRevenue / currentRev) * 100).toFixed(1)
                      : 0;
                  return (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle
                        size={16}
                        className="text-green-600 mt-0.5"
                      />
                      <p className="text-sm text-green-800">
                        Top 3 customers generate {percentage}% of total revenue
                      </p>
                    </div>
                  );
                })()}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Customer concentration risk: Consider diversifying customer
                    base
                  </p>
                </div>
                {(() => {
                  const custCount = analytics.uniqueCustomers || 0;
                  const totalRev = analytics.currentRevenue || 0;
                  const avgValue = custCount > 0 ? totalRev / custCount : 0;
                  return (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Target size={16} className="text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        Average customer lifetime value:{' '}
                        {formatCurrency(avgValue)}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductPerformance = () => (
    <div>
      {/* Performance Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3
          className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Product Performance Metrics
        </h3>
        <div className="relative">
          <select
            className={`w-48 px-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            defaultValue="revenue"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="orders">Sort by Orders</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown
              size={20}
              className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {analytics.topProducts.map((product, index) => (
          <div key={product.product || index}>
            <div
              className={`border rounded-xl h-full ${
                isDarkMode
                  ? 'border-[#37474F] bg-[#1E2328]'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="p-6">
                {/* Product Header */}
                <div className="flex items-center gap-2 mb-4">
                  {index < 3 ? (
                    <Star
                      size={20}
                      className={
                        index === 0
                          ? 'text-yellow-400 fill-yellow-400'
                          : index === 1
                            ? 'text-gray-400 fill-gray-400'
                            : 'text-orange-600 fill-orange-600'
                      }
                    />
                  ) : (
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isDarkMode
                          ? 'bg-teal-900/50 text-teal-300'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      #{index + 1}
                    </span>
                  )}
                  <h4
                    className={`font-semibold flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {product.product || 'Unknown Product'}
                  </h4>
                </div>

                {/* Product Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Revenue
                    </span>
                    <div className="flex items-center gap-2">
                      {product.revenueGrowth !== undefined && (
                        <span
                          title={`Prev: ${formatCurrency(product.prevRevenue || 0)} • Current: ${formatCurrency(product.revenue || 0)}`}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                            product.revenueGrowth > 0
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : product.revenueGrowth < 0
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-gray-300'
                                  : 'border-gray-300 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {getGrowthIcon(product.revenueGrowth)}
                          {formatGrowth(product.revenueGrowth)}
                        </span>
                      )}
                      <span
                        className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {formatCurrency(product.revenue || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Quantity Sold
                    </span>
                    <div className="flex items-center gap-2">
                      {product.quantityGrowth !== undefined && (
                        <span
                          title={`Prev: ${(product.prevQuantity || 0).toLocaleString()} • Current: ${(product.quantity || 0).toLocaleString()}`}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                            product.quantityGrowth > 0
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : product.quantityGrowth < 0
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-gray-300'
                                  : 'border-gray-300 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {getGrowthIcon(product.quantityGrowth)}
                          {formatGrowth(product.quantityGrowth)}
                        </span>
                      )}
                      <span
                        className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {(product.quantity || 0).toLocaleString()} units
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Orders
                    </span>
                    <div className="flex items-center gap-2">
                      {product.ordersGrowth !== undefined && (
                        <span
                          title={`Prev: ${product.prevOrders || 0} • Current: ${product.orders || 0}`}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                            product.ordersGrowth > 0
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : product.ordersGrowth < 0
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : isDarkMode
                                  ? 'border-gray-600 bg-gray-800 text-gray-300'
                                  : 'border-gray-300 bg-gray-50 text-gray-700'
                          }`}
                        >
                          {getGrowthIcon(product.ordersGrowth)}
                          {formatGrowth(product.ordersGrowth)}
                        </span>
                      )}
                      <span
                        className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {product.orders || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Avg Order Size
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {Math.round(
                        (product.quantity || 0) / (product.orders || 1),
                      )}{' '}
                      units
                    </span>
                  </div>
                </div>

                {/* Market Share */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span
                      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      Market Share
                    </span>
                    <span
                      className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {(
                        (product.revenue / analytics.currentRevenue) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-teal-600 to-teal-700 rounded-full transition-all duration-300"
                      style={{
                        width: `${(product.revenue / (analytics.topProducts[0]?.revenue || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <h4
                className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Best Performing Category
              </h4>
              {Object.entries(analytics.categoryPerformance).sort(
                ([, a], [, b]) => b.revenue - a.revenue,
              )[0] && (
                <>
                  <p className="text-xl font-bold mb-1 text-teal-600">
                    {Object.entries(analytics.categoryPerformance)
                      .sort(([, a], [, b]) => b.revenue - a.revenue)[0][0]
                      .charAt(0)
                      .toUpperCase() +
                      Object.entries(analytics.categoryPerformance)
                        .sort(([, a], [, b]) => b.revenue - a.revenue)[0][0]
                        .slice(1)}
                  </p>
                  <p
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {formatCurrency(
                      Object.entries(analytics.categoryPerformance).sort(
                        ([, a], [, b]) => b.revenue - a.revenue,
                      )[0][1].revenue,
                    )}{' '}
                    revenue
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <h4
                className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Most Popular Product
              </h4>
              <p className="text-xl font-bold mb-1 text-teal-600">
                {analytics.topProducts[0]?.product}
              </p>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {analytics.topProducts[0]?.orders} orders
              </p>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6 text-center">
              <h4
                className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Revenue Leader
              </h4>
              <p className="text-xl font-bold mb-1 text-teal-600">
                {analytics.topProducts[0]?.product}
              </p>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {formatCurrency(analytics.topProducts[0]?.revenue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div>
      {/* Reports Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3
          className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Monthly & Quarterly Reports
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => console.log('Refresh data')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button onClick={() => console.log('Generate report')} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <Download size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-blue-600" />
                <h4
                  className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Report Period
                </h4>
              </div>
              <p
                className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                {format(
                  selectedPeriod,
                  dateRange === 'month' ? 'MMMM yyyy' : 'QQQ yyyy',
                )}
              </p>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {dateRange === 'month' ? 'Monthly' : 'Quarterly'} Report
              </p>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl h-full ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-teal-600" />
                <h4
                  className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Performance vs Target
                </h4>
              </div>
              <p
                className={`text-2xl font-bold mb-2 ${
                  analytics.revenueGrowth > 0
                    ? 'text-green-600'
                    : analytics.revenueGrowth < 0
                      ? 'text-red-600'
                      : isDarkMode
                        ? 'text-white'
                        : 'text-gray-900'
                }`}
              >
                {analytics.revenueGrowth > 0
                  ? 'Above'
                  : analytics.revenueGrowth < 0
                    ? 'Below'
                    : 'On'}{' '}
                Target
              </p>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                {formatGrowth(analytics.revenueGrowth)} growth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="space-y-6">
        <div>
          <div
            className={`border rounded-xl overflow-hidden ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <h4
                className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Revenue Breakdown by Product Category
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={
                        isDarkMode
                          ? 'border-b border-gray-700'
                          : 'border-b border-gray-200'
                      }
                    >
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Category
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Revenue
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Orders
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Avg Order Value
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Market Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analytics.categoryPerformance)
                      .sort(([, a], [, b]) => b.revenue - a.revenue)
                      .map(([category, data]) => (
                        <tr
                          key={category}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? 'border-gray-700 hover:bg-gray-800/50'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {category.charAt(0).toUpperCase() +
                                category.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {formatCurrency(data.revenue)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {data.orders}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {formatCurrency(data.revenue / data.orders)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                isDarkMode
                                  ? 'border-teal-600 bg-teal-900/20 text-teal-300'
                                  : 'border-teal-300 bg-teal-50 text-teal-700'
                              }`}
                            >
                              {(
                                (data.revenue / analytics.currentRevenue) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            className={`border rounded-xl overflow-hidden ${
              isDarkMode
                ? 'border-[#37474F] bg-[#1E2328]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="p-6">
              <h4
                className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Monthly Trend Analysis
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={
                        isDarkMode
                          ? 'border-b border-gray-700'
                          : 'border-b border-gray-200'
                      }
                    >
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Month
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Revenue
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Orders
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Customers
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Growth %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.monthlyTrend.map((month, index) => {
                      const previousMonth = analytics.monthlyTrend[index - 1];
                      const growth = previousMonth
                        ? ((month.revenue - previousMonth.revenue) /
                            previousMonth.revenue) *
                          100
                        : 0;

                      return (
                        <tr
                          key={month.month}
                          className={`border-b transition-colors ${
                            isDarkMode
                              ? 'border-gray-700 hover:bg-gray-800/50'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {month.month}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                              {formatCurrency(month.revenue)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {month.orders}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                              {month.customers}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {index > 0 ? (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                  growth > 0
                                    ? 'border-green-300 bg-green-50 text-green-700'
                                    : growth < 0
                                      ? 'border-red-300 bg-red-50 text-red-700'
                                      : isDarkMode
                                        ? 'border-gray-600 bg-gray-800 text-gray-300'
                                        : 'border-gray-300 bg-gray-50 text-gray-700'
                                }`}
                              >
                                {formatGrowth(growth)}
                              </span>
                            ) : (
                              <span
                                className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                              >
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`p-4 min-h-[calc(100vh-64px)] overflow-auto ${
        isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'
      }`}
    >
      <div
        className={`border rounded-xl overflow-hidden shadow-lg ${
          isDarkMode
            ? 'border-[#37474F] bg-[#1E2328]'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <BarChart3 size={28} className="text-teal-600" />
              <h1
                className={`text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                📊 Sales Analytics
              </h1>
            </div>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Comprehensive sales performance analysis and reporting
            </p>
          </div>

          {/* Tabs - Pill style */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? isDarkMode
                      ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                      : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800'
                    : isDarkMode
                      ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                      : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={18} />
                Revenue Overview
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'customers'
                    ? isDarkMode
                      ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                      : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800'
                    : isDarkMode
                      ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                      : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users size={18} />
                Customer Analysis
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'products'
                    ? isDarkMode
                      ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                      : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800'
                    : isDarkMode
                      ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                      : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Package size={18} />
                Product Performance
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'reports'
                    ? isDarkMode
                      ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                      : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800'
                    : isDarkMode
                      ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                      : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Calendar size={18} />
                Reports
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'customers' && renderCustomerAnalysis()}
            {activeTab === 'products' && renderProductPerformance()}
            {activeTab === 'reports' && renderReports()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
