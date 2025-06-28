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
  RefreshCw
} from 'lucide-react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, subQuarters } from 'date-fns';
import { analyticsService } from '../services/analyticsService';
import { useApiData } from '../hooks/useApi';

// Styled Components
const AnalyticsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
}));

const AnalyticsPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  overflow: 'hidden',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const ChartCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  height: '100%',
}));

const RevenueBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  minHeight: 200,
  position: 'relative',
  '& .bar-fill': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    width: 20,
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
    minHeight: 4,
  },
  '& .bar-value': {
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: theme.spacing(0.5),
    textAlign: 'center',
  },
  '& .bar-label': {
    fontSize: '0.65rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    textAlign: 'center',
  },
}));

const CategoryProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[300],
  '& .MuiLinearProgress-bar': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: 4,
  },
}));

const SalesAnalytics = () => {
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
    if (growth > 0) return <ArrowUp size={16} className="growth-positive" />;
    if (growth < 0) return <ArrowDown size={16} className="growth-negative" />;
    return <Minus size={16} className="growth-neutral" />;
  };

  const renderOverview = () => (
    <Box>
      {/* Period Selector */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Period"
            >
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="quarter">Quarterly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            type="month"
            value={format(selectedPeriod, 'yyyy-MM')}
            onChange={(e) => setSelectedPeriod(new Date(e.target.value))}
            sx={{ minWidth: 150 }}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download size={16} />}
          sx={{ borderRadius: 2 }}
        >
          Export Report
        </Button>
      </Box>

      {/* Metrics Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <DollarSign size={24} color="#10b981" />
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {formatCurrency(analytics.currentRevenue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {getGrowthIcon(analytics.revenueGrowth)}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: analytics.revenueGrowth > 0 ? 'success.main' : 
                           analytics.revenueGrowth < 0 ? 'error.main' : 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {formatGrowth(analytics.revenueGrowth)} vs last {dateRange}
                </Typography>
              </Box>
            </CardContent>
          </MetricCard>
        </Box>

        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Package size={24} color="#3b82f6" />
                <Typography variant="body2" color="text.secondary">Total Orders</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {analytics.currentOrders}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {getGrowthIcon(analytics.ordersGrowth)}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: analytics.ordersGrowth > 0 ? 'success.main' : 
                           analytics.ordersGrowth < 0 ? 'error.main' : 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {formatGrowth(analytics.ordersGrowth)} vs last {dateRange}
                </Typography>
              </Box>
            </CardContent>
          </MetricCard>
        </Box>

        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Users size={24} color="#8b5cf6" />
                <Typography variant="body2" color="text.secondary">Active Customers</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {analytics.uniqueCustomers}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {getGrowthIcon(analytics.customersGrowth)}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: analytics.customersGrowth > 0 ? 'success.main' : 
                           analytics.customersGrowth < 0 ? 'error.main' : 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {formatGrowth(analytics.customersGrowth)} vs last {dateRange}
                </Typography>
              </Box>
            </CardContent>
          </MetricCard>
        </Box>

        <Box>
          <MetricCard>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Target size={24} color="#f59e0b" />
                <Typography variant="body2" color="text.secondary">Avg Order Value</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {formatCurrency(analytics.avgOrderValue)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {getGrowthIcon(analytics.avgOrderGrowth)}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: analytics.avgOrderGrowth > 0 ? 'success.main' : 
                           analytics.avgOrderGrowth < 0 ? 'error.main' : 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {formatGrowth(analytics.avgOrderGrowth)} vs last {dateRange}
                </Typography>
              </Box>
            </CardContent>
          </MetricCard>
        </Box>
      </Box>

      {/* Charts Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <ChartCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Revenue Trend (Last 6 Months)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', height: 200, px: 2 }}>
                {analytics.monthlyTrend.map((month, index) => (
                  <RevenueBar key={index}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'end', height: 150, mb: 1 }}>
                        <Box 
                          className="bar-fill"
                          sx={{ 
                            height: `${analytics.monthlyTrend.length > 0 ? (month.revenue / Math.max(...analytics.monthlyTrend.map(m => m.revenue || 0))) * 140 : 4}px` 
                          }}
                        />
                      </Box>
                      <Typography variant="caption" className="bar-value" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {formatCurrency(month.revenue || 0).replace('₹', '₹')}
                      </Typography>
                      <Typography variant="caption" className="bar-label" color="text.secondary">
                        {month.month || ''}
                      </Typography>
                    </Box>
                  </RevenueBar>
                ))}
              </Box>
            </CardContent>
          </ChartCard>
        </Box>

        <Box>
          <ChartCard>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Category Performance
              </Typography>
              <Stack spacing={2}>
                {Object.entries(analytics.categoryPerformance)
                  .sort(([,a], [,b]) => b.revenue - a.revenue)
                  .map(([category, data]) => (
                    <Box key={category}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(data.revenue)}
                        </Typography>
                      </Box>
                      <CategoryProgress 
                        variant="determinate" 
                        value={Object.values(analytics.categoryPerformance).length > 0 ? (data.revenue / Math.max(...Object.values(analytics.categoryPerformance).map(c => c.revenue || 0))) * 100 : 0}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {data.orders} orders
                      </Typography>
                    </Box>
                  ))}
              </Stack>
            </CardContent>
          </ChartCard>
        </Box>
      </Box>
    </Box>
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
                    <Typography variant="body2">High Value (₹5L+)</Typography>
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
                    <Typography variant="body2">Medium Value (₹1L-5L)</Typography>
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
                    <Typography variant="body2">Regular (₹1L)</Typography>
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
    <AnalyticsContainer>
      <AnalyticsPaper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <BarChart3 size={28} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              📊 Sales Analytics
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Comprehensive sales performance analysis and reporting
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              value="overview" 
              label="Revenue Overview" 
              icon={<BarChart3 size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="customers" 
              label="Customer Analysis" 
              icon={<Users size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="products" 
              label="Product Performance" 
              icon={<Package size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="reports" 
              label="Reports" 
              icon={<Calendar size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'customers' && renderCustomerAnalysis()}
          {activeTab === 'products' && renderProductPerformance()}
          {activeTab === 'reports' && renderReports()}
        </Box>
      </AnalyticsPaper>
    </AnalyticsContainer>
  );
};

export default SalesAnalytics;