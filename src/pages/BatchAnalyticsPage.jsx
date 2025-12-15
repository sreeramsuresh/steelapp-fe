import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart3,
  Calendar,
  AlertCircle,
  DollarSign,
  FileText,
  Package,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';
import { Spinner } from '../components/ui/LoadingStates';
import { formatCurrency } from '../utils/invoiceUtils';

const CHART_COLORS = {
  primary: '#14B8A6',
  secondary: '#3B82F6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
};

/**
 * Empty State Component
 */
const EmptyState = ({ icon: Icon, title, description, isDarkMode }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon
      className={`h-16 w-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
    />
    <h3
      className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
    >
      {title}
    </h3>
    <p
      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}
    >
      {description}
    </p>
  </div>
);

EmptyState.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

/**
 * Error State Component
 */
const ErrorState = ({ message, onRetry, isDarkMode }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="h-16 w-16 mb-4 text-red-500" />
    <h3
      className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
    >
      Failed to Load Data
    </h3>
    <p
      className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md mb-4`}
    >
      {message ||
        'An error occurred while loading analytics data. Please try again.'}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    )}
  </div>
);

ErrorState.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  isDarkMode: PropTypes.bool.isRequired,
};

/**
 * Health Tab - Allocation health status
 */
const HealthTab = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/analytics/allocation-health');
      setHealthData(response);
    } catch (err) {
      console.error('Error loading health data:', err);
      setError(err.message || 'Failed to load allocation health data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="teal" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadHealthData}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (
    !healthData ||
    (!healthData.negativeStock?.length &&
      !healthData.mismatches?.length &&
      !healthData.pending?.length)
  ) {
    return (
      <EmptyState
        icon={Package}
        title="All Systems Healthy"
        description="No allocation issues detected. All stock levels are accurate and allocations are properly tracked."
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Negative Stock
                </p>
                <p
                  className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {healthData.negativeStock?.length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Mismatches
                </p>
                <p
                  className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {healthData.mismatches?.length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Pending Allocations
                </p>
                <p
                  className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {healthData.pending?.length || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      {(healthData.negativeStock?.length > 0 ||
        healthData.mismatches?.length > 0) && (
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Allocation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Batch/Product</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthData.negativeStock?.map((item, index) => (
                  <TableRow key={`neg-${index}`}>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Negative Stock
                      </span>
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {item.productName || item.batchNumber}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      Stock: {item.currentStock}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {item.warehouse || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {healthData.mismatches?.map((item, index) => (
                  <TableRow key={`mis-${index}`}>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Mismatch
                      </span>
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {item.productName || item.batchNumber}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      Expected: {item.expected}, Actual: {item.actual}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      Diff: {item.difference}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

HealthTab.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
};

/**
 * Cost Variance Tab - Cost impact of reallocations
 */
const CostVarianceTab = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [varianceData, setVarianceData] = useState(null);

  const loadVarianceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        '/analytics/reports/cost-variance',
      );
      setVarianceData(response);
    } catch (err) {
      console.error('Error loading variance data:', err);
      setError(err.message || 'Failed to load cost variance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVarianceData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="teal" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadVarianceData}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (
    !varianceData ||
    (!varianceData.chartData?.length && !varianceData.tableData?.length)
  ) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No Cost Variance Data"
        description="No cost variance information is available. This may indicate that no reallocations have occurred."
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      {varianceData.chartData && varianceData.chartData.length > 0 && (
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Cost Variance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={varianceData.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? '#374151' : '#E5E7EB'}
                />
                <XAxis
                  dataKey="date"
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: isDarkMode ? '#F3F4F6' : '#111827' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="variance"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.primary, r: 4 }}
                  name="Cost Variance"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {varianceData.tableData && varianceData.tableData.length > 0 && (
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Cost Variance Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Old Cost</TableHead>
                  <TableHead>New Cost</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varianceData.tableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {row.date || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {row.invoiceNumber || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {row.productName || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {formatCurrency(row.oldCost || 0)}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {formatCurrency(row.newCost || 0)}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {formatCurrency(row.variance || 0)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          (row.variance || 0) > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : (row.variance || 0) < 0
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {(row.variance || 0) > 0
                          ? 'Increase'
                          : (row.variance || 0) < 0
                            ? 'Decrease'
                            : 'No Change'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

CostVarianceTab.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
};

/**
 * Modification Log Tab - Audit trail
 */
const ModificationLogTab = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logData, setLogData] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
    invoice: '',
    reason: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadLogData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.user) params.user = filters.user;
      if (filters.invoice) params.invoice = filters.invoice;
      if (filters.reason) params.reason = filters.reason;

      const response = await apiClient.get(
        '/analytics/reports/batch-modification',
        { params },
      );
      setLogData(response.modifications || []);
    } catch (err) {
      console.error('Error loading modification log:', err);
      setError(err.message || 'Failed to load modification log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    loadLogData();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      user: '',
      invoice: '',
      reason: '',
    });
  };

  // Export to Excel (CSV format for universal compatibility)
  const exportToExcel = () => {
    if (logData.length === 0) return;

    // Define headers
    const headers = [
      'Date & Time',
      'User',
      'Invoice',
      'Product',
      'Old Batch',
      'New Batch',
      'Reason',
    ];

    // Build CSV content
    const csvRows = [
      headers.join(','),
      ...logData.map((log) =>
        [
          `"${(log.timestamp || 'N/A').replace(/"/g, '""')}"`,
          `"${(log.userName || log.user || 'System').replace(/"/g, '""')}"`,
          `"${(log.invoiceNumber || 'N/A').replace(/"/g, '""')}"`,
          `"${(log.productName || 'N/A').replace(/"/g, '""')}"`,
          `"${(log.oldBatch || 'N/A').replace(/"/g, '""')}"`,
          `"${(log.newBatch || 'N/A').replace(/"/g, '""')}"`,
          `"${(log.reason || 'Not specified').replace(/"/g, '""')}"`,
        ].join(','),
      ),
    ];

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([`\ufeff${  csvContent}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `batch-modification-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="teal" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadLogData}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Filters
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label
                  htmlFor="log-start-date"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Start Date
                </label>
                <input
                  id="log-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="log-end-date"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  End Date
                </label>
                <input
                  id="log-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="log-invoice-number"
                  className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Invoice Number
                </label>
                <input
                  id="log-invoice-number"
                  type="text"
                  value={filters.invoice}
                  onChange={(e) =>
                    setFilters({ ...filters, invoice: e.target.value })
                  }
                  placeholder="Enter invoice number"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
          )}

          {showFilters && (
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Clear
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Table */}
      {logData.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Modifications Found"
          description="No batch modifications have been recorded. Try adjusting your filter criteria."
          isDarkMode={isDarkMode}
        />
      ) : (
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Modification History ({logData.length})
            </CardTitle>
            <button
              onClick={exportToExcel}
              disabled={logData.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                logData.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
              title="Export to Excel (CSV)"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Old Batch</TableHead>
                  <TableHead>New Batch</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logData.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {log.timestamp || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {log.userName || log.user || 'System'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {log.invoiceNumber || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {log.productName || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {log.oldBatch || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {log.newBatch || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {log.reason || 'Not specified'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

ModificationLogTab.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
};

/**
 * Batch Aging Tab - Slow-moving inventory
 */
const BatchAgingTab = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agingData, setAgingData] = useState(null);

  const loadAgingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(
        '/analytics/reports/batch-aging',
      );
      setAgingData(response);
    } catch (err) {
      console.error('Error loading aging data:', err);
      setError(err.message || 'Failed to load batch aging data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="teal" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadAgingData}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (
    !agingData ||
    (!agingData.chartData?.length && !agingData.batches?.length)
  ) {
    return (
      <EmptyState
        icon={Calendar}
        title="No Aging Data Available"
        description="No batch aging information is available at this time."
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Aging Chart */}
      {agingData.chartData && agingData.chartData.length > 0 && (
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Inventory Aging Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? '#374151' : '#E5E7EB'}
                />
                <XAxis
                  dataKey="ageBucket"
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: isDarkMode ? '#F3F4F6' : '#111827' }}
                />
                <Legend />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS.primary}
                  name="Number of Batches"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Aging Batches Table */}
      {agingData.batches && agingData.batches.length > 0 && (
        <Card className={isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : ''}>
          <CardHeader>
            <CardTitle className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              Aging Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Age (Days)</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agingData.batches.map((batch, index) => (
                  <TableRow key={index}>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {batch.batchNumber || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {batch.productName || 'N/A'}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-white' : 'text-gray-900'}
                    >
                      {batch.ageDays || 0}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {batch.quantity || 0}
                    </TableCell>
                    <TableCell
                      className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}
                    >
                      {formatCurrency(batch.value || 0)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          batch.ageDays > 180
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : batch.ageDays > 90
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {batch.ageDays > 180
                          ? 'Critical'
                          : batch.ageDays > 90
                            ? 'Warning'
                            : 'Normal'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

BatchAgingTab.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
};

/**
 * Main Batch Analytics Page Component
 */
const BatchAnalyticsPage = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('health');

  const tabs = [
    {
      id: 'health',
      label: 'Allocation Health',
      icon: AlertTriangle,
      component: HealthTab,
    },
    {
      id: 'cost-variance',
      label: 'Cost Variance',
      icon: DollarSign,
      component: CostVarianceTab,
    },
    {
      id: 'modification-log',
      label: 'Modification Log',
      icon: FileText,
      component: ModificationLogTab,
    },
    {
      id: 'batch-aging',
      label: 'Batch Aging',
      icon: Calendar,
      component: BatchAgingTab,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div
      className={`min-h-screen ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
    >
      {/* Header */}
      <div
        className={`${isDarkMode ? 'bg-[#1E2328]' : 'bg-white'} border-b ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        } p-6`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-teal-900/30' : 'bg-teal-50'
            }`}
          >
            <BarChart3 className="text-teal-600" size={24} />
          </div>
          <div>
            <h1
              className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Batch Analytics
            </h1>
            <p
              className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Track allocation health, cost impact, modifications, and inventory
              aging
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {ActiveComponent && <ActiveComponent isDarkMode={isDarkMode} />}
      </div>
    </div>
  );
};

export default BatchAnalyticsPage;
