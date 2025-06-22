import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  CircularProgress, 
  Avatar, 
  LinearProgress,
  Divider,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  FileText, 
  DollarSign,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// Styled Components
const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  width: '100%',
  overflow: 'auto',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
  },
}));

const StatsCard = styled(Card)(({ theme, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          borderLeft: `4px solid ${theme.palette.success.main}`,
          '& .stats-icon': {
            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
            color: theme.palette.success.contrastText,
          },
        };
      case 'warning':
        return {
          borderLeft: `4px solid ${theme.palette.warning.main}`,
          '& .stats-icon': {
            background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
            color: theme.palette.warning.contrastText,
          },
        };
      case 'error':
        return {
          borderLeft: `4px solid ${theme.palette.error.main}`,
          '& .stats-icon': {
            background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
            color: theme.palette.error.contrastText,
          },
        };
      default:
        return {
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          '& .stats-icon': {
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: theme.palette.primary.contrastText,
          },
        };
    }
  };

  return {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[1],
    transition: 'all 0.3s ease-in-out',
    height: { xs: 'auto', sm: '120px' },
    minHeight: { xs: '100px', sm: '120px' },
    display: 'flex',
    flexDirection: 'column',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.main,
    },
    ...getVariantStyles(),
  };
});

const StatsIcon = styled(Box)(({ theme }) => ({
  width: { xs: 36, sm: 44 },
  height: { xs: 36, sm: 44 },
  borderRadius: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 'auto',
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease',
  '& svg': {
    width: { xs: 16, sm: 18 },
    height: { xs: 16, sm: 18 },
  }
}));

const ChangeIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'positive',
})(({ theme, positive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontSize: '0.875rem',
  fontWeight: 500,
  color: positive ? theme.palette.success.main : theme.palette.error.main,
  marginTop: theme.spacing(0.5),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(0, 0, 2, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ChartPlaceholder = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  background: `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.background.paper})`,
  borderRadius: theme.spacing(2),
  border: `2px dashed ${theme.palette.divider}`,
  minHeight: '250px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, transparent 49%, ${theme.palette.divider} 50%, transparent 51%)`,
    opacity: 0.1,
    borderRadius: theme.spacing(2),
  },
}));

const ProductListItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s ease',
  flexDirection: 'row',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 1),
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
  },
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateX(4px)',
    [theme.breakpoints.down('sm')]: {
      transform: 'none',
    },
  },
}));

const EmptyState = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  gap: theme.spacing(2),
}));

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
    revenueChange: 0,
    customersChange: 0,
    productsChange: 0,
    invoicesChange: 0
  });
  
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch customers
      const customersResponse = await apiClient.get('/customers');
      const customers = customersResponse.data || [];
      
      // Fetch products
      const productsResponse = await apiClient.get('/products');
      const products = productsResponse.data || [];
      
      // Fetch invoices
      const invoicesResponse = await apiClient.get('/invoices');
      const invoices = invoicesResponse.data || [];
      
      // Calculate stats
      const totalRevenue = invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.total) || 0), 0);
      const totalCustomers = customers.length;
      const totalProducts = products.length;
      const totalInvoices = invoices.length;
      
      setStats({
        totalRevenue,
        totalCustomers,
        totalProducts,
        totalInvoices,
        revenueChange: 12.5, // Mock data for demo
        customersChange: 8.2,
        productsChange: 4.1,
        invoicesChange: 15.3
      });
      
      // Set recent invoices (last 5)
      const sortedInvoices = invoices
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentInvoices(sortedInvoices);
      
      // Set top products (mock data for demo)
      const topProductsData = products.slice(0, 5).map((product, index) => ({
        ...product,
        sales: Math.floor(Math.random() * 100) + 10,
        revenue: Math.floor(Math.random() * 50000) + 10000
      }));
      setTopProducts(topProductsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingContainer>
          <CircularProgress size={32} />
          <Typography color="text.secondary">Loading dashboard...</Typography>
        </LoadingContainer>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <SectionHeader>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem' }
              }}
            >
              📊 Dashboard
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Welcome back! Here's what's happening with your business.
            </Typography>
          </Box>
          <IconButton 
            onClick={toggleTheme}
            sx={{ 
              border: 1,
              borderColor: 'divider',
              '&:hover': { 
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              }
            }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Box>
      </SectionHeader>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="default">
            <CardContent sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              p: { xs: 1.5, sm: 2.5 }, 
              '&:last-child': { pb: { xs: 1.5, sm: 2.5 } } 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5, 
                    fontWeight: 500, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5, 
                    fontSize: { xs: '0.625rem', sm: '0.75rem' }
                  }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <StatsIcon className="stats-icon">
                  <DollarSign size={18} />
                </StatsIcon>
              </Box>
              <ChangeIndicator positive={stats.revenueChange >= 0}>
                {stats.revenueChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(stats.revenueChange)}% from last month
              </ChangeIndicator>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="success">
            <CardContent sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              p: { xs: 1.5, sm: 2.5 }, 
              '&:last-child': { pb: { xs: 1.5, sm: 2.5 } } 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5, 
                    fontWeight: 500, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5, 
                    fontSize: { xs: '0.625rem', sm: '0.75rem' }
                  }}>
                    Total Customers
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {stats.totalCustomers}
                  </Typography>
                </Box>
                <StatsIcon className="stats-icon">
                  <Users size={18} />
                </StatsIcon>
              </Box>
              <ChangeIndicator positive={stats.customersChange >= 0}>
                {stats.customersChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(stats.customersChange)}% from last month
              </ChangeIndicator>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="warning">
            <CardContent sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              p: { xs: 1.5, sm: 2.5 }, 
              '&:last-child': { pb: { xs: 1.5, sm: 2.5 } } 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5, 
                    fontWeight: 500, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5, 
                    fontSize: { xs: '0.625rem', sm: '0.75rem' }
                  }}>
                    Total Products
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {stats.totalProducts}
                  </Typography>
                </Box>
                <StatsIcon className="stats-icon">
                  <Package size={18} />
                </StatsIcon>
              </Box>
              <ChangeIndicator positive={stats.productsChange >= 0}>
                {stats.productsChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(stats.productsChange)}% from last month
              </ChangeIndicator>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="error">
            <CardContent sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              p: { xs: 1.5, sm: 2.5 }, 
              '&:last-child': { pb: { xs: 1.5, sm: 2.5 } } 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 0.5, 
                    fontWeight: 500, 
                    textTransform: 'uppercase', 
                    letterSpacing: 0.5, 
                    fontSize: { xs: '0.625rem', sm: '0.75rem' }
                  }}>
                    Total Invoices
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}>
                    {stats.totalInvoices}
                  </Typography>
                </Box>
                <StatsIcon className="stats-icon">
                  <FileText size={18} />
                </StatsIcon>
              </Box>
              <ChangeIndicator positive={stats.invoicesChange >= 0}>
                {stats.invoicesChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(stats.invoicesChange)}% from last month
              </ChangeIndicator>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Charts and Tables Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            height: { xs: 'auto', md: '350px' }, 
            minHeight: { xs: '300px', md: '350px' },
            borderRadius: 2, 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            border: `1px solid`, 
            borderColor: 'divider' 
          }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Revenue Analytics
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Track your revenue trends and performance
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  flexDirection: { xs: 'column', sm: 'row' },
                  '& > *': { minWidth: { xs: '100%', sm: 'auto' } }
                }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Calendar size={16} />}
                    sx={{ borderRadius: 2 }}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<BarChart3 size={16} />}
                    sx={{ borderRadius: 2 }}
                  >
                    View Report
                  </Button>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <ChartPlaceholder>
                  <Activity size={48} style={{ marginBottom: '16px', opacity: 0.6 }} />
                  <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600, fontSize: '1rem' }}>
                    Chart Coming Soon
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                    Revenue chart will be implemented with Chart.js
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                    Showing revenue trends, monthly comparisons, and growth patterns
                  </Typography>
                </ChartPlaceholder>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: { xs: 'auto', md: '350px' }, 
            minHeight: { xs: '250px', md: '350px' },
            borderRadius: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            border: `1px solid`, 
            borderColor: 'divider' 
          }}>
            <CardContent sx={{ 
              p: { xs: 2, sm: 3 }, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
                mb: 2.5 
              }}>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Top Products
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Best performing products
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    borderRadius: 2,
                    minWidth: { xs: '100%', sm: 'auto' }
                  }}
                >
                  View All
                </Button>
              </Box>
              <Box sx={{ 
                flex: 1, 
                maxHeight: { xs: '180px', md: '260px' }, 
                overflowY: 'auto', 
                pr: { xs: 0, sm: 1 }
              }}>
                {topProducts.length > 0 ? topProducts.map((product, index) => (
                  <ProductListItem key={product.id}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      width: { xs: '100%', sm: 'auto' }
                    }}>
                      <Avatar
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          background: index % 4 === 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                                     index % 4 === 1 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                     index % 4 === 2 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                     'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          boxShadow: 2,
                        }}
                      >
                        <Package size={18} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          mb: 0.5,
                          fontSize: { xs: '0.875rem', sm: '0.875rem' }
                        }}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{
                          fontSize: { xs: '0.75rem', sm: '0.75rem' }
                        }}>
                          {product.category}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ 
                      textAlign: { xs: 'left', sm: 'right' }, 
                      ml: { xs: 0, sm: 2 },
                      alignSelf: { xs: 'flex-start', sm: 'center' }
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        mb: 0.5,
                        fontSize: { xs: '0.875rem', sm: '0.875rem' }
                      }}>
                        {formatCurrency(product.revenue)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{
                        fontSize: { xs: '0.75rem', sm: '0.75rem' }
                      }}>
                        {product.sales} sales
                      </Typography>
                    </Box>
                  </ProductListItem>
                )) : (
                  <EmptyState>
                    <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                      No products found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add products to see them here
                    </Typography>
                  </EmptyState>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity Row */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2, border: `1px solid`, borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Recent Invoices
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Latest invoice activity and status updates
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<FileText size={16} />}
                  sx={{ 
                    borderRadius: 2,
                    minWidth: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Create Invoice
                </Button>
              </Box>
              <TableContainer sx={{ 
                overflowX: 'auto', 
                '& .MuiTable-root': { 
                  minWidth: { xs: 650, sm: 'auto' }
                }
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice No.</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.length > 0 ? recentInvoices.map((invoice) => (
                      <TableRow key={invoice.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {invoice.invoice_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {invoice.customer_details?.name || 'Unknown Customer'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.customer_details?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(invoice.invoice_date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(invoice.total)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.status}
                            size="small"
                            color={
                              invoice.status === 'paid' ? 'success' : 
                              invoice.status === 'pending' ? 'warning' : 
                              invoice.status === 'overdue' ? 'error' : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1,
                            flexDirection: { xs: 'column', sm: 'row' },
                            '& > *': { minWidth: { xs: '100%', sm: 'auto' } }
                          }}>
                            <Button variant="outlined" size="small">
                              View
                            </Button>
                            <Button variant="contained" size="small">
                              Edit
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <EmptyState>
                            <FileText size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              No invoices found
                            </Typography>
                            <Button variant="contained">
                              Create Your First Invoice
                            </Button>
                          </EmptyState>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;