import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Users,
  Package,
  Target,
  Calendar,
  Filter,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, subQuarters } from 'date-fns';
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

  const { data: dashboardData, loading: loadingDashboard, refetch: refetchDashboard } = useApiData(
    () => analyticsService.getDashboardData(dateParams),
    [dateParams]
  );

  const { data: salesTrends, loading: loadingSales } = useApiData(
    () => analyticsService.getSalesTrends(dateParams),
    [dateParams]
  );

  const { data: productPerformance, loading: loadingProducts } = useApiData(
    () => analyticsService.getProductPerformance(dateParams),
    [dateParams]
  );

  const { data: customerAnalysis, loading: loadingCustomers } = useApiData(
    () => analyticsService.getCustomerAnalysis(dateParams),
    [dateParams]
  );

  const { data: inventoryInsights, loading: loadingInventory } = useApiData(
    analyticsService.getInventoryInsights,
    []
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
        monthlyTrend: []
      };
    }

    return {
      currentRevenue: dashboardData.totalRevenue || 0,
      revenueGrowth: dashboardData.revenueGrowth || 0,
      currentOrders: dashboardData.totalOrders || 0,
      ordersGrowth: dashboardData.ordersGrowth || 0,
      uniqueCustomers: dashboardData.totalCustomers || 0,
      customersGrowth: dashboardData.customersGrowth || 0,
      avgOrderValue: dashboardData.avgOrderValue || 0,
      avgOrderGrowth: dashboardData.avgOrderGrowth || 0,
      topProducts: productPerformance?.topProducts || [],
      topCustomers: customerAnalysis?.topCustomers || [],
      categoryPerformance: productPerformance?.categoryPerformance || [],
      monthlyTrend: salesTrends?.monthlyData || []
    };
  }, [dashboardData, productPerformance, customerAnalysis, salesTrends]);


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Period
            </label>
            <select
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
              <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Select Period
            </label>
            <input
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
          <div className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <DollarSign size={24} color="#10b981" />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</span>
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(analytics.currentRevenue)}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.revenueGrowth)}
                <span className={`text-sm font-medium ${
                  analytics.revenueGrowth > 0 
                    ? 'text-green-600' 
                    : analytics.revenueGrowth < 0 
                    ? 'text-red-600' 
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`}>
                  {formatGrowth(analytics.revenueGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Package size={24} color="#3b82f6" />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</span>
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {analytics.currentOrders}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.ordersGrowth)}
                <span className={`text-sm font-medium ${
                  analytics.ordersGrowth > 0 
                    ? 'text-green-600' 
                    : analytics.ordersGrowth < 0 
                    ? 'text-red-600' 
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`}>
                  {formatGrowth(analytics.ordersGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users size={24} color="#8b5cf6" />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Customers</span>
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {analytics.uniqueCustomers}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.customersGrowth)}
                <span className={`text-sm font-medium ${
                  analytics.customersGrowth > 0 
                    ? 'text-green-600' 
                    : analytics.customersGrowth < 0 
                    ? 'text-red-600' 
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`}>
                  {formatGrowth(analytics.customersGrowth)} vs last {dateRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={`border rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Target size={24} color="#f59e0b" />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Order Value</span>
              </div>
              <h3 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(analytics.avgOrderValue)}
              </h3>
              <div className="flex items-center justify-center gap-1">
                {getGrowthIcon(analytics.avgOrderGrowth)}
                <span className={`text-sm font-medium ${
                  analytics.avgOrderGrowth > 0 
                    ? 'text-green-600' 
                    : analytics.avgOrderGrowth < 0 
                    ? 'text-red-600' 
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`}>
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
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Revenue Trend (Last 6 Months)
              </h3>
              <div className="flex items-end justify-around h-48 px-4">
                {analytics.monthlyTrend.map((month, index) => {
                  const maxRevenue = Math.max(...analytics.monthlyTrend.map(m => m.revenue || 0));
                  const height = analytics.monthlyTrend.length > 0 ? (month.revenue / maxRevenue) * 140 : 4;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 min-h-48 relative">
                      <div className="flex items-end h-36 mb-2">
                        <div 
                          className="w-5 bg-gradient-to-br from-teal-600 to-teal-700 rounded-t transition-all duration-300"
                          style={{ height: `${height}px`, minHeight: '4px' }}
                        />
                      </div>
                      <span className={`text-xs font-semibold mb-1 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(month.revenue || 0).replace('د.إ', 'د.إ')}
                      </span>
                      <span className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Category Performance
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.categoryPerformance)
                  .sort(([,a], [,b]) => b.revenue - a.revenue)
                  .map(([category, data]) => {
                    const maxRevenue = Math.max(...Object.values(analytics.categoryPerformance).map(c => c.revenue || 0));
                    const percentage = Object.values(analytics.categoryPerformance).length > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(data.revenue)}
                          </span>
                        </div>
                        <div className={`h-2 rounded-full mb-1 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                        }`}>
                          <div 
                            className="h-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customer Sales Analysis</h3>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
          isDarkMode ? 'border-teal-600 bg-teal-900/20 text-teal-300' : 'border-teal-300 bg-teal-50 text-teal-700'
        }`}>
          {format(selectedPeriod, dateRange === 'month' ? 'MMMM yyyy' : 'QQQ yyyy')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Distribution */}
        <div className="md:col-span-1">
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-purple-600" />
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Customer Distribution</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>High Value (د.إ5L+)</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {analytics.topCustomers.filter(c => c.revenue >= 500000).length}
                    </span>
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatCurrency(analytics.topCustomers.filter(c => c.revenue >= 500000).reduce((sum, c) => sum + c.revenue, 0))}
                  </span>
                </div>
                <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Medium Value (د.إ1L-5L)</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {analytics.topCustomers.filter(c => c.revenue >= 100000 && c.revenue < 500000).length}
                    </span>
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatCurrency(analytics.topCustomers.filter(c => c.revenue >= 100000 && c.revenue < 500000).reduce((sum, c) => sum + c.revenue, 0))}
                  </span>
                </div>
                <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />
                <div>
                  <div className="flex justify-between mb-1">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Regular (د.إ1L)</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {analytics.topCustomers.filter(c => c.revenue < 100000).length}
                    </span>
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatCurrency(analytics.topCustomers.filter(c => c.revenue < 100000).reduce((sum, c) => sum + c.revenue, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="md:col-span-2">
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Customers by Revenue</h3>
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={customer.customer || index} className={`border rounded-lg p-4 ${
                    isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        index === 0 ? 'bg-yellow-400 text-gray-900' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-600 text-white' : 
                        (isDarkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-100 text-teal-700')
                      }`}>
                        {index < 3 ? (
                          <Award size={20} />
                        ) : (
                          <span className="text-sm">#{index + 1}</span>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {customer.customer || 'Unknown Customer'}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} className="text-green-600" />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatCurrency(customer.revenue || 0)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package size={14} className="text-blue-600" />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.orders || 0} orders</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target size={14} className="text-orange-600" />
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatCurrency((customer.revenue || 0) / (customer.orders || 1))} avg</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="w-24">
                        <div className={`h-2 rounded-full overflow-hidden ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div 
                            className="h-full bg-gradient-to-r from-teal-600 to-teal-700 rounded-full transition-all duration-300"
                            style={{ width: `${(customer.revenue / (analytics.topCustomers[0]?.revenue || 1)) * 100}%` }}
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
          <div className={`border rounded-xl ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-teal-600" />
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Key Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle size={16} className="text-green-600 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Top 3 customers generate {((analytics.topCustomers.slice(0, 3).reduce((sum, c) => sum + c.revenue, 0) / analytics.currentRevenue) * 100).toFixed(1)}% of total revenue
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <AlertTriangle size={16} className="text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Customer concentration risk: Consider diversifying customer base
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Target size={16} className="text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Average customer lifetime value: {formatCurrency(analytics.currentRevenue / analytics.uniqueCustomers)}
                  </p>
                </div>
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
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Performance Metrics</h3>
        <div className="relative">
          <select className={`w-48 px-4 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none ${
            isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          defaultValue="revenue"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="orders">Sort by Orders</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {analytics.topProducts.map((product, index) => (
          <div key={product.product || index}>
            <div className={`border rounded-xl h-full ${
              isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
            }`}>
              <div className="p-6">
                {/* Product Header */}
                <div className="flex items-center gap-2 mb-4">
                  {index < 3 ? (
                    <Star 
                      size={20} 
                      className={index === 0 ? 'text-yellow-400 fill-yellow-400' : index === 1 ? 'text-gray-400 fill-gray-400' : 'text-orange-600 fill-orange-600'}
                    />
                  ) : (
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isDarkMode ? 'bg-teal-900/50 text-teal-300' : 'bg-teal-100 text-teal-700'
                    }`}>#{index + 1}</span>
                  )}
                  <h4 className={`font-semibold flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {product.product || 'Unknown Product'}
                  </h4>
                </div>
                
                {/* Product Metrics */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(product.revenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity Sold</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(product.quantity || 0).toLocaleString()} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Orders</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.orders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Order Size</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {Math.round((product.quantity || 0) / (product.orders || 1))} units
                    </span>
                  </div>
                </div>

                {/* Market Share */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Market Share</span>
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {((product.revenue / analytics.currentRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-teal-600 to-teal-700 rounded-full transition-all duration-300"
                      style={{ width: `${(product.revenue / (analytics.topProducts[0]?.revenue || 1)) * 100}%` }}
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
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Best Performing Category</h4>
              {Object.entries(analytics.categoryPerformance)
                .sort(([,a], [,b]) => b.revenue - a.revenue)[0] && (
                <>
                  <p className="text-xl font-bold mb-1 text-teal-600">
                    {Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)[0][0]
                      .charAt(0).toUpperCase() + 
                     Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)[0][0].slice(1)}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatCurrency(Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)[0][1].revenue)} revenue
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Most Popular Product</h4>
              <p className="text-xl font-bold mb-1 text-teal-600">
                {analytics.topProducts[0]?.product}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {analytics.topProducts[0]?.orders} orders
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6 text-center">
              <h4 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Revenue Leader</h4>
              <p className="text-xl font-bold mb-1 text-teal-600">
                {analytics.topProducts[0]?.product}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly & Quarterly Reports</h3>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            isDarkMode ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
          }`}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <Download size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-blue-600" />
                <h4 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Report Period</h4>
              </div>
              <p className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {format(selectedPeriod, dateRange === 'month' ? 'MMMM yyyy' : 'QQQ yyyy')}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {dateRange === 'month' ? 'Monthly' : 'Quarterly'} Report
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <div className={`border rounded-xl h-full ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-teal-600" />
                <h4 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Performance vs Target</h4>
              </div>
              <p className={`text-2xl font-bold mb-2 ${
                analytics.revenueGrowth > 0 ? 'text-green-600' : 
                analytics.revenueGrowth < 0 ? 'text-red-600' : 
                (isDarkMode ? 'text-white' : 'text-gray-900')
              }`}>
                {analytics.revenueGrowth > 0 ? 'Above' : analytics.revenueGrowth < 0 ? 'Below' : 'On'} Target
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatGrowth(analytics.revenueGrowth)} growth
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="space-y-6">
        <div>
          <div className={`border rounded-xl overflow-hidden ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <h4 className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Revenue Breakdown by Product Category
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Orders</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Order Value</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Market Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)
                      .map(([category, data]) => (
                        <tr key={category} className={`border-b transition-colors ${
                          isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'
                        }`}>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(data.revenue)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{data.orders}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {formatCurrency(data.revenue / data.orders)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              isDarkMode ? 'border-teal-600 bg-teal-900/20 text-teal-300' : 'border-teal-300 bg-teal-50 text-teal-700'
                            }`}>
                              {((data.revenue / analytics.currentRevenue) * 100).toFixed(1)}%
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
          <div className={`border rounded-xl overflow-hidden ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
          }`}>
            <div className="p-6">
              <h4 className={`text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Monthly Trend Analysis
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Month</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Revenue</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Orders</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customers</th>
                      <th className={`text-left py-3 px-4 font-semibold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Growth %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.monthlyTrend.map((month, index) => {
                      const previousMonth = analytics.monthlyTrend[index - 1];
                      const growth = previousMonth ? 
                        ((month.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : 0;
                      
                      return (
                        <tr key={month.month} className={`border-b transition-colors ${
                          isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'
                        }`}>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {month.month}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(month.revenue)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{month.orders}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{month.customers}</span>
                          </td>
                          <td className="py-3 px-4">
                            {index > 0 ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                growth > 0 ? 'border-green-300 bg-green-50 text-green-700' : 
                                growth < 0 ? 'border-red-300 bg-red-50 text-red-700' : 
                                (isDarkMode ? 'border-gray-600 bg-gray-800 text-gray-300' : 'border-gray-300 bg-gray-50 text-gray-700')
                              }`}>
                                {formatGrowth(growth)}
                              </span>
                            ) : (
                              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
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
    <div className={`p-4 min-h-[calc(100vh-64px)] overflow-auto ${
      isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'
    }`}>
      <div className={`border rounded-xl overflow-hidden shadow-lg ${
        isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-200 bg-white'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <BarChart3 size={28} className="text-teal-600" />
              <h1 className={`text-3xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                    ? (isDarkMode
                        ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                        : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                    : (isDarkMode
                        ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                        : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
                }`}
              >
                <BarChart3 size={18} />
                Revenue Overview
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'customers'
                    ? (isDarkMode
                        ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                        : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                    : (isDarkMode
                        ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                        : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
                }`}
              >
                <Users size={18} />
                Customer Analysis
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'products'
                    ? (isDarkMode
                        ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                        : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                    : (isDarkMode
                        ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                        : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
                }`}
              >
                <Package size={18} />
                Product Performance
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  activeTab === 'reports'
                    ? (isDarkMode
                        ? 'bg-teal-900/20 text-teal-300 border-teal-600 hover:text-teal-200'
                        : 'bg-teal-50 text-teal-700 border-teal-300 hover:text-teal-800')
                    : (isDarkMode
                        ? 'bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700/40 hover:text-white'
                        : 'bg-transparent text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900')
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
