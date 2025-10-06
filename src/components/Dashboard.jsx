import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { apiClient } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

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

const Dashboard = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalInvoices: 0,
    revenueChange: 0,
    customersChange: 0,
    productsChange: 0,
    invoicesChange: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const customersResponse = await apiClient.get("/customers");
      const customers = customersResponse.data || [];

      // Fetch products
      const productsResponse = await apiClient.get("/products");
      const products = productsResponse.data || [];

      // Fetch invoices
      const invoicesResponse = await apiClient.get("/invoices");
      const invoices = invoicesResponse.data || [];

      // Calculate stats
      const totalRevenue = invoices.reduce((sum, invoice) => {
        const amount = parseFloat(invoice.total);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
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
        invoicesChange: 15.3,
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
        revenue: Math.floor(Math.random() * 50000) + 10000,
      }));
      setTopProducts(topProductsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    // Handle NaN, null, undefined, or non-numeric values
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AE", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
        <div>
          <h1 className={`text-3xl md:text-4xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Dashboard
          </h1>
          <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue Card */}
        <StatsCard variant="default">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Revenue
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
              {Math.abs(stats.revenueChange)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>

        {/* Total Customers Card */}
        <StatsCard variant="success">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Customers
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
              {Math.abs(stats.customersChange)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>

        {/* Total Products Card */}
        <StatsCard variant="warning">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Products
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
              {Math.abs(stats.productsChange)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>

        {/* Total Invoices Card */}
        <StatsCard variant="error">
          <div className="p-4 sm:p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-medium uppercase tracking-wide mb-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Invoices
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
              {Math.abs(stats.invoicesChange)}% from last month
            </ChangeIndicator>
          </div>
        </StatsCard>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Analytics Chart */}
        <div className="lg:col-span-2">
          <div className={`h-auto md:h-96 min-h-80 rounded-xl border overflow-hidden flex flex-col ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Revenue Analytics
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Track your revenue trends and performance
                  </p>
                </div>
                <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    startIcon={<Calendar size={16} />}
                    className="w-full sm:w-auto"
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    startIcon={<BarChart3 size={16} />}
                    className="w-full sm:w-auto"
                  >
                    View Report
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <div className={`p-8 text-center rounded-xl border-2 border-dashed min-h-60 flex flex-col items-center justify-center relative ${
                  isDarkMode 
                    ? 'border-[#37474F] bg-gradient-to-br from-[#121418] to-[#1E2328] text-gray-400' 
                    : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white text-gray-500'
                }`}>
                  <Activity
                    size={48}
                    className="mb-4 opacity-60"
                  />
                  <h4 className="text-lg font-semibold mb-1">Chart Coming Soon</h4>
                  <p className="text-sm mb-1">Revenue chart will be implemented with Chart.js</p>
                  <p className="text-xs opacity-75">
                    Showing revenue trends, monthly comparisons, and growth patterns
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-1">
          <div className={`h-auto md:h-96 min-h-64 rounded-xl border flex flex-col ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
          }`}>
            <div className="p-4 sm:p-6 h-full flex flex-col">
              <div className="flex justify-between items-start flex-col sm:flex-row gap-2 mb-6">
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Top Products
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Best performing products
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  View All
                </Button>
              </div>
              <div className="flex-1 max-h-48 md:max-h-64 overflow-y-auto pr-0 sm:pr-2">
                {topProducts.length > 0 ? (
                  topProducts.map((product, index) => {
                    const getGradient = (index) => {
                      const gradients = [
                        'from-indigo-500 to-purple-600',
                        'from-emerald-500 to-green-600', 
                        'from-amber-500 to-orange-600',
                        'from-red-500 to-red-600'
                      ];
                      return gradients[index % 4];
                    };

                    return (
                      <div key={product.id} className={`flex items-center justify-between p-3 border-b rounded-lg transition-all duration-200 hover:translate-x-1 ${
                        isDarkMode ? 'border-[#37474F] hover:bg-[#2E3B4E]' : 'border-gray-200 hover:bg-gray-50'
                      } last:border-b-0 flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0`}>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${getGradient(index)} flex items-center justify-center shadow-lg`}>
                            <Package size={18} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold mb-1 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {product.name}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right ml-0 sm:ml-3 self-start sm:self-center">
                          <p className={`text-sm font-semibold mb-1 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {formatCurrency(product.revenue)}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {product.sales} sales
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <Package
                      size={48}
                      className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      No products found
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Add products to see them here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="mb-6">
        <div className={`rounded-xl border ${
          isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
        }`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className={`text-lg sm:text-xl font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Recent Invoices
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Latest invoice activity and status updates
                </p>
              </div>
              <Button
                variant="primary"
                startIcon={<FileText size={16} />}
                className="w-full sm:w-auto"
              >
                Create Invoice
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead className={isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Invoice No.</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Customer</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Date</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Amount</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Status</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-[#37474F]' : 'divide-gray-200'}`}>
                  {recentInvoices.length > 0 ? (
                    recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className={`transition-colors ${isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {invoice.invoice_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {invoice.customer_details?.name || "Unknown Customer"}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {invoice.customer_details?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatDate(invoice.invoice_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(invoice.total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                            invoice.status === "paid"
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : invoice.status === "pending"
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : invoice.status === "overdue"
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : `${isDarkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-200'}`
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2 flex-col sm:flex-row">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              View
                            </Button>
                            <Button variant="primary" size="sm" className="w-full sm:w-auto">
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="p-8 text-center">
                          <FileText
                            size={32}
                            className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          />
                          <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            No invoices found
                          </h4>
                          <Button variant="primary">
                            Create Your First Invoice
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
