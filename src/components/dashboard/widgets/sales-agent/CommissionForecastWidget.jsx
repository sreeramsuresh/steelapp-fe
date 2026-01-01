/**
 * CommissionForecastWidget.jsx
 *
 * Commission Forecasting and Pipeline Analytics Widget
 * Shows historical trends, projected commissions, and pending pipeline
 * For analytics dashboard (not core ERP)
 */

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { commissionService } from '../../../../services/commissionService';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Calendar,
} from 'lucide-react';

const CommissionForecastWidget = ({
  monthsBack = 6,
  onRefresh,
  onViewDetails,
}) => {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await commissionService.getCommissionForecast(monthsBack);
      setData(result);
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  }, [monthsBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(true);
      try {
        const result = await onRefresh();
        setData(result);
      } finally {
        setLoading(false);
      }
    } else {
      fetchData();
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatCompact = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}M`;
    }
    if (safeAmount >= 1000) {
      return `${(safeAmount / 1000).toFixed(1)}K`;
    }
    return safeAmount.toFixed(0);
  };

  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  };

  // Loading state
  if (loading && !data) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-indigo-500" />
          <h3
            className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Commission Forecast
          </h3>
        </div>
        <div className="text-center py-8">
          <RefreshCw
            size={32}
            className={`mx-auto mb-4 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          />
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Loading forecast data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-indigo-500" />
          <h3
            className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Commission Forecast
          </h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle
            size={48}
            className="mx-auto mb-4 text-red-500 opacity-50"
          />
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            {error}
          </p>
          <button
            onClick={handleRefresh}
            className={`mt-4 px-4 py-2 rounded-lg text-sm ${
              isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { history, forecast, pipeline, summary } = data;
  const isGrowthPositive = summary.growthRate >= 0;

  // Combine history and forecast for the chart
  const chartData = [
    ...history.slice(-6).map((h) => ({ ...h, type: 'actual' })),
    ...forecast.map((f) => ({
      month: f.month,
      earned: f.projected,
      type: 'forecast',
    })),
  ];

  // Calculate max for chart scaling
  const maxValue = Math.max(...chartData.map((d) => d.earned || 0), 1);

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? 'bg-[#1E2328] border-[#37474F] hover:border-indigo-600'
          : 'bg-white border-[#E0E0E0] hover:border-indigo-500'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Commission Forecast
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Trend analysis & projections
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-[#2E3B4E] text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className={`p-3 rounded-lg border ${isDarkMode ? 'bg-[#2E3B4E] border-[#37474F]' : 'bg-gray-100 border-gray-200'}`}
        >
          <p
            className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Avg Monthly
          </p>
          <p
            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {formatCompact(summary.avgMonthlyEarned)}
          </p>
        </div>
        <div
          className={`p-3 rounded-lg ${
            isGrowthPositive
              ? isDarkMode
                ? 'bg-green-900/20'
                : 'bg-green-50'
              : isDarkMode
                ? 'bg-red-900/20'
                : 'bg-red-50'
          }`}
        >
          <p
            className={`text-xs ${
              isGrowthPositive
                ? isDarkMode
                  ? 'text-green-400'
                  : 'text-green-600'
                : isDarkMode
                  ? 'text-red-400'
                  : 'text-red-600'
            }`}
          >
            Growth Rate
          </p>
          <div className="flex items-center gap-1">
            {isGrowthPositive ? (
              <TrendingUp size={16} className="text-green-500" />
            ) : (
              <TrendingDown size={16} className="text-red-500" />
            )}
            <p
              className={`text-lg font-bold ${
                isGrowthPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isGrowthPositive ? '+' : ''}
              {summary.growthRate.toFixed(1)}%
            </p>
          </div>
        </div>
        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
          }`}
        >
          <p
            className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
          >
            Pipeline
          </p>
          <p
            className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
          >
            {formatCompact(pipeline.total)}
          </p>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Monthly Trend
          </span>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Actual
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, #818cf8, #818cf8 2px, transparent 2px, transparent 4px)',
                  border: '1px dashed #818cf8',
                }}
              />
              Forecast
            </span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-24">
          {chartData.map((d, idx) => {
            const height = maxValue > 0 ? (d.earned / maxValue) * 100 : 0;
            const isForecast = d.type === 'forecast';
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isForecast
                      ? 'bg-indigo-400/40 border border-dashed border-indigo-400'
                      : 'bg-indigo-500'
                  }`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${formatMonth(d.month)}: ${formatCurrency(d.earned)}`}
                />
                <span
                  className={`text-[10px] mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {formatMonth(d.month).split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Section */}
      <div
        className={`p-3 rounded-lg ${
          isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock
              size={14}
              className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}
            />
            <span
              className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Pending Pipeline
            </span>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isDarkMode
                ? 'bg-yellow-900/30 text-yellow-400'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {pipeline.count} pending
          </span>
        </div>
        <div className="space-y-2">
          {pipeline.items && pipeline.items.length > 0 ? (
            pipeline.items.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs py-1 ${
                  isDarkMode
                    ? 'border-b border-[#37474F]'
                    : 'border-b border-gray-200'
                } last:border-0`}
              >
                <span
                  className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                >
                  {item.invoiceNumber ||
                    item.invoice_number ||
                    `Invoice #${item.invoiceId || item.invoice_id}`}
                </span>
                <span
                  className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(
                    item.commissionAmount || item.commission_amount,
                  )}
                </span>
              </div>
            ))
          ) : (
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              No pending commissions
            </p>
          )}
          {pipeline.count > 3 && (
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              +{pipeline.count - 3} more pending
            </p>
          )}
        </div>
      </div>

      {/* Forecast Summary */}
      {forecast.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-1 mb-2">
            <Calendar
              size={14}
              className={isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}
            />
            <span
              className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              3-Month Forecast
            </span>
          </div>
          <div className="flex items-center justify-between">
            {forecast.map((f, idx) => (
              <div key={idx} className="text-center flex-1">
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {formatMonth(f.month)}
                </p>
                <p
                  className={`text-sm font-semibold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
                >
                  {formatCompact(f.projected)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(data)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isDarkMode
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          }`}
        >
          View Detailed Analytics
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default CommissionForecastWidget;
