import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Package,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { toUAEDateForInput } from '../../utils/timezone';
import { FormSelect } from '../../components/ui/form-select';
import { SelectItem } from '../../components/ui/select';

/**
 * Stock Reconciliation Report
 * Shows stock movements and variance analysis for a selected period
 */
export default function ReconciliationReport() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [period, setPeriod] = useState('this_month');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      startDate: toUAEDateForInput(startOfMonth),
      endDate: toUAEDateForInput(now),
    };
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [showVariancesOnly, setShowVariancesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [reconciliationData, setReconciliationData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [_summary, setSummary] = useState({
    totalOpeningStock: 0,
    totalReceived: 0,
    totalConsumed: 0,
    totalAdjustments: 0,
    totalExpectedClosing: 0,
    totalSystemStock: 0,
    totalVariance: 0,
  });

  useEffect(() => {
    loadFilterOptions();
    fetchReportData();
  }, []);

  useEffect(() => {
    // Update date range when period changes
    const now = new Date();
    if (period === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateRange({
        startDate: toUAEDateForInput(startOfMonth),
        endDate: toUAEDateForInput(now),
      });
    } else if (period === 'last_month') {
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setDateRange({
        startDate: toUAEDateForInput(startOfLastMonth),
        endDate: toUAEDateForInput(endOfLastMonth),
      });
    }
    // For custom, user sets the dates manually
  }, [period]);

  const loadFilterOptions = async () => {
    try {
      // TODO: Replace with actual API endpoints when backend is ready
      setWarehouses([
        { id: 1, name: 'Main Warehouse - Dubai' },
        { id: 2, name: 'Warehouse 2 - Sharjah' },
        { id: 3, name: 'Warehouse 3 - Abu Dhabi' },
      ]);

      setProducts([
        { id: 1, name: 'SS304 Sheet 1.5mm', sku: 'SS304-SH-1.5' },
        { id: 2, name: 'SS316 Pipe 50mm', sku: 'SS316-PIPE-50' },
        { id: 3, name: 'MS Round Bar 12mm', sku: 'MS-RB-12' },
      ]);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API endpoint when backend is ready
      // For now, using mock data
      const mockData = generateMockData();

      setReconciliationData(mockData.items);
      setSummary(mockData.summary);

      toast.success('Report data loaded successfully');
    } catch (error) {
      console.error('Error fetching reconciliation report:', error);
      toast.error('Failed to load report data');
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
    const headers = [
      'Product',
      'SKU',
      'Warehouse',
      'Opening Stock',
      'IN (Received)',
      'OUT (Consumed)',
      'Adjustments',
      'Expected Closing',
      'System Stock',
      'Variance',
      'Variance %',
    ];

    const rows = filteredData.map((item) => [
      item.productName,
      item.productSku,
      item.warehouseName,
      item.openingStock,
      item.received,
      item.consumed,
      item.adjustments,
      item.expectedClosing,
      item.systemStock,
      item.variance,
      item.variancePercent.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-reconciliation-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);
  };

  const getVarianceColor = (variancePercent) => {
    const absVariance = Math.abs(variancePercent);
    if (absVariance < 0.5) return 'success';
    if (absVariance < 1) return 'warning';
    return 'error';
  };

  const getVarianceIcon = (variancePercent) => {
    const absVariance = Math.abs(variancePercent);
    if (absVariance < 0.5) return <CheckCircle size={16} />;
    if (absVariance < 1) return <AlertTriangle size={16} />;
    return <AlertTriangle size={16} />;
  };

  // Mock data generator (remove when backend is ready)
  const generateMockData = () => {
    const items = [
      {
        productId: 1,
        productName: 'SS304 Sheet 1.5mm',
        productSku: 'SS304-SH-1.5',
        warehouseId: 1,
        warehouseName: 'Main Warehouse - Dubai',
        openingStock: 1000,
        received: 500,
        consumed: 300,
        adjustments: -10,
        expectedClosing: 1190,
        systemStock: 1185,
        variance: -5,
        variancePercent: -0.42,
      },
      {
        productId: 2,
        productName: 'SS316 Pipe 50mm',
        productSku: 'SS316-PIPE-50',
        warehouseId: 1,
        warehouseName: 'Main Warehouse - Dubai',
        openingStock: 800,
        received: 200,
        consumed: 150,
        adjustments: 0,
        expectedClosing: 850,
        systemStock: 835,
        variance: -15,
        variancePercent: -1.76,
      },
      {
        productId: 3,
        productName: 'MS Round Bar 12mm',
        productSku: 'MS-RB-12',
        warehouseId: 2,
        warehouseName: 'Warehouse 2 - Sharjah',
        openingStock: 1500,
        received: 300,
        consumed: 400,
        adjustments: 5,
        expectedClosing: 1405,
        systemStock: 1410,
        variance: 5,
        variancePercent: 0.36,
      },
      {
        productId: 1,
        productName: 'SS304 Sheet 1.5mm',
        productSku: 'SS304-SH-1.5',
        warehouseId: 2,
        warehouseName: 'Warehouse 2 - Sharjah',
        openingStock: 600,
        received: 100,
        consumed: 80,
        adjustments: 0,
        expectedClosing: 620,
        systemStock: 618,
        variance: -2,
        variancePercent: -0.32,
      },
      {
        productId: 2,
        productName: 'SS316 Pipe 50mm',
        productSku: 'SS316-PIPE-50',
        warehouseId: 3,
        warehouseName: 'Warehouse 3 - Abu Dhabi',
        openingStock: 400,
        received: 150,
        consumed: 100,
        adjustments: -5,
        expectedClosing: 445,
        systemStock: 430,
        variance: -15,
        variancePercent: -3.37,
      },
    ];

    const mockSummary = {
      totalOpeningStock: items.reduce(
        (sum, item) => sum + item.openingStock,
        0,
      ),
      totalReceived: items.reduce((sum, item) => sum + item.received, 0),
      totalConsumed: items.reduce((sum, item) => sum + item.consumed, 0),
      totalAdjustments: items.reduce((sum, item) => sum + item.adjustments, 0),
      totalExpectedClosing: items.reduce(
        (sum, item) => sum + item.expectedClosing,
        0,
      ),
      totalSystemStock: items.reduce((sum, item) => sum + item.systemStock, 0),
      totalVariance: items.reduce((sum, item) => sum + item.variance, 0),
    };

    return { items, summary: mockSummary };
  };

  // Filter data based on selected filters
  const filteredData = reconciliationData.filter((item) => {
    if (
      selectedWarehouse !== 'all' &&
      item.warehouseId !== parseInt(selectedWarehouse)
    ) {
      return false;
    }
    if (
      selectedProduct !== 'all' &&
      item.productId !== parseInt(selectedProduct)
    ) {
      return false;
    }
    if (showVariancesOnly && Math.abs(item.variancePercent) < 0.5) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Header */}
      <div
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Stock Reconciliation Report
                </h1>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Compare expected vs actual stock levels with variance analysis
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Filter size={18} />
                <span>Filters</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw
                  size={18}
                  className={refreshing ? 'animate-spin' : ''}
                />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
              >
                <Download size={18} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Period Selector */}
                <div>
                  <FormSelect
                    label="Period"
                    value={period}
                    onValueChange={(value) => setPeriod(value)}
                    showValidation={false}
                  >
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </FormSelect>
                </div>

                {/* Date Range */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    <Calendar size={16} className="inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    disabled={period !== 'custom'}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-purple-500 ${
                      period !== 'custom' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    disabled={period !== 'custom'}
                    className={`w-full px-3 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border focus:ring-2 focus:ring-purple-500 ${
                      period !== 'custom' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Warehouse Filter */}
                <div>
                  <FormSelect
                    label="Warehouse"
                    value={selectedWarehouse}
                    onValueChange={(value) => setSelectedWarehouse(value)}
                    showValidation={false}
                  >
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={String(wh.id)}>
                        {wh.name}
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
                    {products.map((prod) => (
                      <SelectItem key={prod.id} value={String(prod.id)}>
                        {prod.name}
                      </SelectItem>
                    ))}
                  </FormSelect>
                </div>
              </div>

              {/* Show Variances Only Toggle */}
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVariancesOnly}
                    onChange={(e) => setShowVariancesOnly(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span
                    className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    Show items with variance &gt; 0.5% only
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin mr-2" size={24} />
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Loading report data...
            </span>
          </div>
        ) : (
          <>
            {/* Reconciliation Table */}
            <div
              className={`overflow-x-auto rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              } shadow`}
            >
              <table className="min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}">
                <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Product
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Warehouse
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Opening Stock
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      IN (Received)
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      OUT (Consumed)
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Adjustments
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Expected Closing
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      System Stock
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Variance
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      } uppercase tracking-wider`}
                    >
                      Variance %
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isDarkMode
                      ? 'bg-gray-800 divide-gray-700'
                      : 'bg-white divide-gray-200'
                  } divide-y`}
                >
                  {filteredData.map((item, index) => {
                    const varianceColor = getVarianceColor(
                      item.variancePercent,
                    );
                    const varianceIcon = getVarianceIcon(item.variancePercent);

                    return (
                      <tr
                        key={index}
                        className={`${
                          Math.abs(item.variancePercent) > 1
                            ? isDarkMode
                              ? 'bg-red-900/20'
                              : 'bg-red-50'
                            : Math.abs(item.variancePercent) > 0.5
                              ? isDarkMode
                                ? 'bg-yellow-900/20'
                                : 'bg-yellow-50'
                              : ''
                        }`}
                      >
                        <td
                          className={`px-4 py-3 text-sm ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          <div className="font-medium">{item.productName}</div>
                          <div
                            className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                          >
                            {item.productSku}
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {item.warehouseName}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}
                        >
                          {formatNumber(item.openingStock)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatNumber(item.received)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {formatNumber(item.consumed)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right ${
                            item.adjustments >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.adjustments >= 0 ? '+' : ''}
                          {formatNumber(item.adjustments)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {formatNumber(item.expectedClosing)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {formatNumber(item.systemStock)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-medium ${
                            varianceColor === 'error'
                              ? 'text-red-600'
                              : varianceColor === 'warning'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                          }`}
                        >
                          {item.variance >= 0 ? '+' : ''}
                          {formatNumber(item.variance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <span
                              className={`font-medium ${
                                varianceColor === 'error'
                                  ? 'text-red-600'
                                  : varianceColor === 'warning'
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                              }`}
                            >
                              {item.variancePercent >= 0 ? '+' : ''}
                              {item.variancePercent.toFixed(2)}%
                            </span>
                            <span
                              className={
                                varianceColor === 'error'
                                  ? 'text-red-600'
                                  : varianceColor === 'warning'
                                    ? 'text-yellow-600'
                                    : 'text-green-600'
                              }
                            >
                              {varianceIcon}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Row */}
                  <tr
                    className={`${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    } font-bold border-t-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                  >
                    <td
                      colSpan="2"
                      className={`px-4 py-3 text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      TOTAL
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.openingStock,
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.received,
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.consumed,
                          0,
                        ),
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${
                        filteredData.reduce(
                          (sum, item) => sum + item.adjustments,
                          0,
                        ) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {filteredData.reduce(
                        (sum, item) => sum + item.adjustments,
                        0,
                      ) >= 0
                        ? '+'
                        : ''}
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.adjustments,
                          0,
                        ),
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.expectedClosing,
                          0,
                        ),
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.systemStock,
                          0,
                        ),
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right ${
                        Math.abs(
                          filteredData.reduce(
                            (sum, item) => sum + item.variance,
                            0,
                          ),
                        ) > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {filteredData.reduce(
                        (sum, item) => sum + item.variance,
                        0,
                      ) >= 0
                        ? '+'
                        : ''}
                      {formatNumber(
                        filteredData.reduce(
                          (sum, item) => sum + item.variance,
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <TrendingUp size={16} className="inline" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div
                className={`text-center py-8 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No reconciliation data available for the selected filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
