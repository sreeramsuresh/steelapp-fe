import { Calendar, DollarSign, Download, Filter, Package, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FormSelect } from "../../components/ui/form-select";
import { SelectItem } from "../../components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../services/api";
import { toUAEDateForInput } from "../../utils/timezone";

/**
 * COGS Analysis Dashboard
 * Provides comprehensive cost of goods sold analysis including:
 * - COGS by Batch
 * - Cost Components breakdown
 * - Batch Profitability
 * - Procurement Comparison (Local vs Imported)
 */
export default function COGSAnalysisReport() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: toUAEDateForInput(startOfMonth),
      endDate: toUAEDateForInput(now),
    };
  });
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [summary, setSummary] = useState({
    totalCOGS: 0,
    averageMargin: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [cogsByBatch, setCogsByBatch] = useState([]);
  const [costComponents, setCostComponents] = useState([]);
  const [batchProfitability, setBatchProfitability] = useState([]);
  const [procurementComparison, setProcurementComparison] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadFilterOptions();
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReportData, loadFilterOptions]); // Only run once on mount - fetchReportData doesn't depend on external values

  const loadFilterOptions = async () => {
    try {
      // Load customers
      const customersRes = await api.get("/api/customers");
      setCustomers(customersRes.data || []);

      // Load products
      const productsRes = await api.get("/api/products");
      setProducts(productsRes.data || []);
    } catch (error) {
      // Error loading filter options - fail silently

      console.error("Error loading filter options:", error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API endpoint when backend is ready
      // For now, using mock data
      const mockData = generateMockData();

      setSummary(mockData.summary);
      setCogsByBatch(mockData.cogsByBatch);
      setCostComponents(mockData.costComponents);
      setBatchProfitability(mockData.batchProfitability);
      setProcurementComparison(mockData.procurementComparison);

      toast.success("Report data loaded successfully");
    } catch (error) {
      console.error("Error fetching COGS report:", error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  // Mock data generator (remove when backend is ready)
  const generateMockData = () => {
    return {
      summary: {
        totalCOGS: 2500000,
        averageMargin: 18.5,
        totalRevenue: 3050000,
        totalProfit: 550000,
      },
      cogsByBatch: [
        { batch: "BTH-2024-001", cogs: 450000, revenue: 520000 },
        { batch: "BTH-2024-002", cogs: 380000, revenue: 440000 },
        { batch: "BTH-2024-003", cogs: 520000, revenue: 610000 },
        { batch: "BTH-2024-004", cogs: 420000, revenue: 490000 },
        { batch: "BTH-2024-005", cogs: 730000, revenue: 990000 },
      ],
      costComponents: [
        { name: "FOB Cost", value: 1500000, percent: 60 },
        { name: "Freight", value: 500000, percent: 20 },
        { name: "Customs Duty", value: 375000, percent: 15 },
        { name: "Handling", value: 125000, percent: 5 },
      ],
      batchProfitability: [
        {
          batch: "BTH-2024-001",
          cogs: 450000,
          revenue: 520000,
          profit: 70000,
          margin: 13.46,
        },
        {
          batch: "BTH-2024-002",
          cogs: 380000,
          revenue: 440000,
          profit: 60000,
          margin: 13.64,
        },
        {
          batch: "BTH-2024-003",
          cogs: 520000,
          revenue: 610000,
          profit: 90000,
          margin: 14.75,
        },
        {
          batch: "BTH-2024-004",
          cogs: 420000,
          revenue: 490000,
          profit: 70000,
          margin: 14.29,
        },
        {
          batch: "BTH-2024-005",
          cogs: 730000,
          revenue: 990000,
          profit: 260000,
          margin: 26.26,
        },
      ],
      procurementComparison: [
        { month: "Jan", local: 120000, imported: 580000 },
        { month: "Feb", local: 95000, imported: 620000 },
        { month: "Mar", local: 110000, imported: 690000 },
        { month: "Apr", local: 130000, imported: 750000 },
        { month: "May", local: 85000, imported: 820000 },
        { month: "Jun", local: 105000, imported: 890000 },
      ],
    };
  };

  const CHART_COLORS = ["#14B8A6", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} border-b ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  COGS Analysis Dashboard
                </h1>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Cost of Goods Sold breakdown and profitability analysis
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button type="button" onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>
              <button type="button" onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } ${refreshing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
              <button type="button" onClick={handleExport}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div>
                  <label
                    htmlFor="cogs-start-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <Calendar size={16} className="inline mr-1" />
                    Start Date
                  </label>
                  <input
                    id="cogs-start-date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } border focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cogs-end-date"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <Calendar size={16} className="inline mr-1" />
                    End Date
                  </label>
                  <input
                    id="cogs-end-date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                    } border focus:ring-2 focus:ring-teal-500`}
                  />
                </div>

                {/* Customer Filter */}
                <div>
                  <FormSelect
                    label="Customer"
                    value={selectedCustomer}
                    onValueChange={(value) => setSelectedCustomer(value)}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>

                {/* Product Filter */}
                <div>
                  <FormSelect
                    label="Product"
                    value={selectedProduct}
                    onValueChange={(value) => setSelectedProduct(value)}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>

                <div className="flex items-end">
                  <button type="button" onClick={fetchReportData}
                    className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total COGS"
            value={formatCurrency(summary.totalCOGS)}
            icon={Package}
            color="from-red-600 to-red-700"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="from-green-600 to-green-700"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Total Profit"
            value={formatCurrency(summary.totalProfit)}
            icon={TrendingUp}
            color="from-blue-600 to-blue-700"
            isDarkMode={isDarkMode}
          />
          <SummaryCard
            title="Average Margin %"
            value={formatPercent(summary.averageMargin)}
            icon={TrendingUp}
            color="from-teal-600 to-teal-700"
            isDarkMode={isDarkMode}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw
                className={`mx-auto h-12 w-12 animate-spin ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              />
              <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading report data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COGS by Batch - Bar Chart */}
            <ChartCard title="COGS by Batch" isDarkMode={isDarkMode}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cogsByBatch}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#37474F" : "#E0E0E0"} />
                  <XAxis
                    dataKey="batch"
                    stroke={isDarkMode ? "#78909C" : "#9E9E9E"}
                    tick={{ fill: isDarkMode ? "#B0BEC5" : "#757575" }}
                  />
                  <YAxis
                    stroke={isDarkMode ? "#78909C" : "#9E9E9E"}
                    tick={{ fill: isDarkMode ? "#B0BEC5" : "#757575" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#2E3B4E" : "#FFFFFF",
                      border: `1px solid ${isDarkMode ? "#37474F" : "#E0E0E0"}`,
                      borderRadius: "8px",
                      color: isDarkMode ? "#FFFFFF" : "#212121",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="cogs" fill="#EF4444" name="COGS" />
                  <Bar dataKey="revenue" fill="#22C55E" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Cost Components - Pie Chart */}
            <ChartCard title="Cost Components Breakdown" isDarkMode={isDarkMode}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costComponents}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costComponents.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#2E3B4E" : "#FFFFFF",
                      border: `1px solid ${isDarkMode ? "#37474F" : "#E0E0E0"}`,
                      borderRadius: "8px",
                      color: isDarkMode ? "#FFFFFF" : "#212121",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Procurement Comparison - Line Chart */}
            <ChartCard title="Procurement Comparison: Local vs Imported" isDarkMode={isDarkMode}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={procurementComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#37474F" : "#E0E0E0"} />
                  <XAxis
                    dataKey="month"
                    stroke={isDarkMode ? "#78909C" : "#9E9E9E"}
                    tick={{ fill: isDarkMode ? "#B0BEC5" : "#757575" }}
                  />
                  <YAxis
                    stroke={isDarkMode ? "#78909C" : "#9E9E9E"}
                    tick={{ fill: isDarkMode ? "#B0BEC5" : "#757575" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? "#2E3B4E" : "#FFFFFF",
                      border: `1px solid ${isDarkMode ? "#37474F" : "#E0E0E0"}`,
                      borderRadius: "8px",
                      color: isDarkMode ? "#FFFFFF" : "#212121",
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="local" stroke="#3B82F6" strokeWidth={2} name="Local" />
                  <Line type="monotone" dataKey="imported" stroke="#14B8A6" strokeWidth={2} name="Imported" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Batch Profitability Table */}
            <ChartCard title="Batch Profitability Analysis" isDarkMode={isDarkMode}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`${
                        isDarkMode ? "bg-gray-800" : "bg-gray-100"
                      } border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <th
                        className={`px-4 py-2 text-left text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Batch
                      </th>
                      <th
                        className={`px-4 py-2 text-right text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        COGS
                      </th>
                      <th
                        className={`px-4 py-2 text-right text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Revenue
                      </th>
                      <th
                        className={`px-4 py-2 text-right text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Profit
                      </th>
                      <th
                        className={`px-4 py-2 text-right text-sm font-medium ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Margin %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchProfitability.map((batch, index) => (
                      <tr
                        key={batch.batch}
                        className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${
                          index % 2 === 0 ? (isDarkMode ? "bg-gray-800/50" : "bg-gray-50") : ""
                        }`}
                      >
                        <td className={`px-4 py-2 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {batch.batch}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {formatCurrency(batch.cogs)}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {formatCurrency(batch.revenue)}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right font-medium ${
                            batch.profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(batch.profit)}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm text-right font-medium ${
                            batch.margin >= 15
                              ? "text-green-600"
                              : batch.margin >= 10
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {formatPercent(batch.margin)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon: Icon, color, isDarkMode }) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Chart Card Component
function ChartCard({ title, children, isDarkMode }) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } hover:shadow-lg transition-all duration-300`}
    >
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h3>
      {children}
    </div>
  );
}
