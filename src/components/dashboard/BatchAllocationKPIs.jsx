import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  AlertTriangle,
  DollarSign,
  Clock,
  TrendingDown,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/api';

/**
 * BatchAllocationKPIs Component
 *
 * Displays 4 KPI cards for batch allocation metrics in the Stock Dashboard:
 * 1. Batch Issues - Count of negative stock + mismatches (RED if > 0, GREEN if 0)
 * 2. Allocated Value - Total AED value of allocated batches
 * 3. Pending Allocations - Count of unallocated invoice lines (YELLOW if > 10)
 * 4. Cost Variance - Sum of reallocation cost impact (RED if negative, GREEN if positive/zero)
 *
 * Each card is clickable and navigates to /batch-analytics with the appropriate tab pre-selected.
 */
const BatchAllocationKPIs = ({ refreshTrigger = 0 }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    batchIssues: 0,
    allocatedValue: 0,
    pendingAllocations: 0,
    costVariance: 0,
  });

  // Fetch metrics from API
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both endpoints in parallel
      const [metricsResponse, healthResponse] = await Promise.all([
        apiClient.get('/analytics/allocation-metrics'),
        apiClient.get('/analytics/allocation-health'),
      ]);

      // Process allocation metrics
      const metricsData = metricsResponse || {};
      const healthData = healthResponse || {};

      setMetrics({
        batchIssues: (healthData.negativeStockCount || 0) + (healthData.mismatchCount || 0),
        allocatedValue: metricsData.totalAllocatedValue || 0,
        pendingAllocations: metricsData.unallocatedLinesCount || 0,
        costVariance: metricsData.totalCostVariance || 0,
      });
    } catch (err) {
      console.error('Failed to fetch batch allocation metrics:', err);
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch metrics on mount and when refreshTrigger changes
  useEffect(() => {
    fetchMetrics();
  }, [refreshTrigger]);

  // Handle retry
  const handleRetry = () => {
    fetchMetrics();
  };

  // Handle card click - navigate to batch-analytics page with specific tab
  const handleCardClick = (tab) => {
    navigate(`/batch-analytics?tab=${tab}`);
  };

  // KPI card configuration
  const cards = [
    {
      id: 'batch-issues',
      title: 'Batch Issues',
      value: metrics.batchIssues,
      icon: AlertTriangle,
      format: 'number',
      tab: 'issues',
      getColor: (value) => {
        if (value > 0) return 'red';
        return 'green';
      },
      tooltip: 'Negative stock and batch mismatches',
    },
    {
      id: 'allocated-value',
      title: 'Allocated Value',
      value: metrics.allocatedValue,
      icon: DollarSign,
      format: 'currency',
      tab: 'allocations',
      getColor: () => 'blue',
      tooltip: 'Total AED value of allocated batches',
    },
    {
      id: 'pending-allocations',
      title: 'Pending Allocations',
      value: metrics.pendingAllocations,
      icon: Clock,
      format: 'number',
      tab: 'pending',
      getColor: (value) => {
        if (value > 10) return 'yellow';
        return 'gray';
      },
      tooltip: 'Unallocated invoice lines',
    },
    {
      id: 'cost-variance',
      title: 'Cost Variance',
      value: metrics.costVariance,
      icon: TrendingDown,
      format: 'currency',
      tab: 'variance',
      getColor: (value) => {
        if (value < 0) return 'red';
        return 'green';
      },
      tooltip: 'Sum of reallocation cost impact',
    },
  ];

  // Color classes helper
  const getColorClasses = (color) => {
    const colors = {
      red: {
        bg: isDarkMode ? 'bg-red-900/30' : 'bg-red-100',
        icon: isDarkMode ? 'text-red-400' : 'text-red-600',
        value: isDarkMode ? 'text-red-400' : 'text-red-600',
      },
      green: {
        bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
        icon: isDarkMode ? 'text-green-400' : 'text-green-600',
        value: isDarkMode ? 'text-green-400' : 'text-green-600',
      },
      blue: {
        bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
        icon: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        value: isDarkMode ? 'text-blue-400' : 'text-blue-600',
      },
      yellow: {
        bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
        icon: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
        value: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
      },
      gray: {
        bg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
        icon: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        value: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      },
    };
    return colors[color] || colors.gray;
  };

  // Format value helper
  const formatValue = (value, format) => {
    if (loading) return '—';

    if (format === 'currency') {
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0);
    }

    return (value || 0).toLocaleString();
  };

  // Error state
  if (error && !loading) {
    return (
      <div className={`rounded-lg border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Failed to Load Metrics
            </h3>
          </div>
          <button
            onClick={handleRetry}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Batch Allocation Metrics
        </h3>
        <button
          onClick={handleRetry}
          disabled={loading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            loading
              ? 'opacity-50 cursor-not-allowed'
              : isDarkMode
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const color = card.getColor(card.value);
          const colors = getColorClasses(color);

          return (
            <div
              key={card.id}
              onClick={() => !loading && handleCardClick(card.tab)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleCardClick(card.tab)}
              role="button"
              tabIndex={loading ? -1 : 0}
              className={`rounded-lg border p-4 transition-all duration-200 ${
                loading ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
              } ${
                isDarkMode
                  ? 'bg-[#1E2328] border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              title={card.tooltip}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-xs font-medium uppercase tracking-wide ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {card.title}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${colors.value}`}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </span>
                    ) : (
                      formatValue(card.value, card.format)
                    )}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

BatchAllocationKPIs.propTypes = {
  refreshTrigger: PropTypes.number,
};

export default BatchAllocationKPIs;
