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
    <Box>
      {/* Analysis Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Customer Sales Analysis</Typography>
        <Chip 
          label={format(selectedPeriod, dateRange === 'month' ? 'MMMM yyyy' : 'QQQ yyyy')}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Customer Distribution */}
        <Box>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Users size={20} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Customer Distribution</Typography>
              </Box>
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">High Value (د.إ5L+)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analytics.topCustomers.filter(c => c.revenue >= 500000).length}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(analytics.topCustomers.filter(c => c.revenue >= 500000).reduce((sum, c) => sum + c.revenue, 0))}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Medium Value (د.إ1L-5L)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analytics.topCustomers.filter(c => c.revenue >= 100000 && c.revenue < 500000).length}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(analytics.topCustomers.filter(c => c.revenue >= 100000 && c.revenue < 500000).reduce((sum, c) => sum + c.revenue, 0))}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Regular (د.إ1L)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analytics.topCustomers.filter(c => c.revenue < 100000).length}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(analytics.topCustomers.filter(c => c.revenue < 100000).reduce((sum, c) => sum + c.revenue, 0))}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MetricCard>
        </Box>

        {/* Top Customers */}
        <Box>
          <ChartCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Top Customers by Revenue</Typography>
              <Stack spacing={2}>
                {analytics.topCustomers.map((customer, index) => (
                  <Card key={customer.customer || index} variant="outlined">
                    <CardContent sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Rank */}
                        <Avatar sx={{ 
                          bgcolor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7c2f' : 'primary.main',
                          width: 40, height: 40 
                        }}>
                          {index === 0 && <Award size={20} />}
                          {index === 1 && <Award size={20} />}
                          {index === 2 && <Award size={20} />}
                          {index > 2 && <Typography variant="body2" sx={{ fontWeight: 600 }}>#{index + 1}</Typography>}
                        </Avatar>

                        {/* Customer Info */}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {customer.customer || 'Unknown Customer'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <DollarSign size={14} />
                              <Typography variant="body2">{formatCurrency(customer.revenue || 0)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Package size={14} />
                              <Typography variant="body2">{customer.orders || 0} orders</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Target size={14} />
                              <Typography variant="body2">{formatCurrency((customer.revenue || 0) / (customer.orders || 1))} avg</Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Progress */}
                        <Box sx={{ width: 100 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={(customer.revenue / (analytics.topCustomers[0]?.revenue || 1)) * 100}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </ChartCard>
        </Box>

        {/* Insights */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUp size={20} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Key Insights</Typography>
              </Box>
              <Stack spacing={2}>
                <Alert severity="success" icon={<CheckCircle size={16} />}>
                  Top 3 customers generate {((analytics.topCustomers.slice(0, 3).reduce((sum, c) => sum + c.revenue, 0) / analytics.currentRevenue) * 100).toFixed(1)}% of total revenue
                </Alert>
                <Alert severity="warning" icon={<AlertTriangle size={16} />}>
                  Customer concentration risk: Consider diversifying customer base
                </Alert>
                <Alert severity="info" icon={<Target size={16} />}>
                  Average customer lifetime value: {formatCurrency(analytics.currentRevenue / analytics.uniqueCustomers)}
                </Alert>
              </Stack>
            </CardContent>
          </MetricCard>
        </Box>
      </Box>
    </Box>
  );

  const renderProductPerformance = () => (
    <Box>
      {/* Performance Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Product Performance Metrics</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            defaultValue="revenue"
            label="Sort By"
          >
            <MenuItem value="revenue">Sort by Revenue</MenuItem>
            <MenuItem value="quantity">Sort by Quantity</MenuItem>
            <MenuItem value="orders">Sort by Orders</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Product Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {analytics.topProducts.map((product, index) => (
          <Box key={product.product || index}>
            <MetricCard>
              <CardContent>
                {/* Product Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {index < 3 ? (
                    <Star 
                      size={20} 
                      color={index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7c2f'} 
                      fill={index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7c2f'}
                    />
                  ) : (
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>#{index + 1}</Avatar>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    {product.product || 'Unknown Product'}
                  </Typography>
                </Box>
                
                {/* Product Metrics */}
                <Stack spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(product.revenue || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Quantity Sold</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(product.quantity || 0).toLocaleString()} units
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Orders</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.orders || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Avg Order Size</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.round((product.quantity || 0) / (product.orders || 1))} units
                    </Typography>
                  </Box>
                </Stack>

                {/* Market Share */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Market Share</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {((product.revenue / analytics.currentRevenue) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(product.revenue / (analytics.topProducts[0]?.revenue || 1)) * 100}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </CardContent>
            </MetricCard>
          </Box>
        ))}
      </Box>

      {/* Product Insights */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Best Performing Category</Typography>
              {Object.entries(analytics.categoryPerformance)
                .sort(([,a], [,b]) => b.revenue - a.revenue)[0] && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                    {Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)[0][0]
                      .charAt(0).toUpperCase() + 
                     Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)[0][0].slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)[0][1].revenue)} revenue
                  </Typography>
                </>
              )}
            </CardContent>
          </MetricCard>
        </Box>
        
        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Most Popular Product</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                {analytics.topProducts[0]?.product}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {analytics.topProducts[0]?.orders} orders
              </Typography>
            </CardContent>
          </MetricCard>
        </Box>
        
        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Revenue Leader</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                {analytics.topProducts[0]?.product}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(analytics.topProducts[0]?.revenue)}
              </Typography>
            </CardContent>
          </MetricCard>
        </Box>
      </Box>
    </Box>
  );

  const renderReports = () => (
    <Box>
      {/* Reports Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Monthly & Quarterly Reports</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            sx={{ borderRadius: 2 }}
          >
            Refresh Data
          </Button>
          <Button
            variant="contained"
            startIcon={<Download size={16} />}
            sx={{ borderRadius: 2 }}
          >
            Generate Report
          </Button>
        </Stack>
      </Box>

      {/* Report Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        <Box>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Calendar size={20} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Report Period</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {format(selectedPeriod, dateRange === 'month' ? 'MMMM yyyy' : 'QQQ yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dateRange === 'month' ? 'Monthly' : 'Quarterly'} Report
              </Typography>
            </CardContent>
          </MetricCard>
        </Box>
        
        <Box>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BarChart3 size={20} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Performance vs Target</Typography>
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: analytics.revenueGrowth > 0 ? 'success.main' : 
                         analytics.revenueGrowth < 0 ? 'error.main' : 'text.primary'
                }}
              >
                {analytics.revenueGrowth > 0 ? 'Above' : analytics.revenueGrowth < 0 ? 'Below' : 'On'} Target
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatGrowth(analytics.revenueGrowth)} growth
              </Typography>
            </CardContent>
          </MetricCard>
        </Box>
      </Box>

      {/* Detailed Tables */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
        <Box>
          <ChartCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Revenue Breakdown by Product Category
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Revenue</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Orders</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Avg Order Value</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Market Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(analytics.categoryPerformance)
                      .sort(([,a], [,b]) => b.revenue - a.revenue)
                      .map(([category, data]) => (
                        <TableRow key={category} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(data.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{data.orders}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(data.revenue / data.orders)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${((data.revenue / analytics.currentRevenue) * 100).toFixed(1)}%`}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </ChartCard>
        </Box>

        <Box>
          <ChartCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Monthly Trend Analysis
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Revenue</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Orders</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customers</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Growth %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.monthlyTrend.map((month, index) => {
                      const previousMonth = analytics.monthlyTrend[index - 1];
                      const growth = previousMonth ? 
                        ((month.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : 0;
                      
                      return (
                        <TableRow key={month.month} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {month.month}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {formatCurrency(month.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{month.orders}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{month.customers}</Typography>
                          </TableCell>
                          <TableCell>
                            {index > 0 ? (
                              <Chip 
                                label={formatGrowth(growth)}
                                color={growth > 0 ? 'success' : growth < 0 ? 'error' : 'default'}
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </ChartCard>
        </Box>
      </Box>
    </Box>
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
