import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  BarChart3,
  PieChart,
  RefreshCw,
  Info,
} from 'lucide-react';

const RevenueAnalyticsWidget = ({ data: propData, onRefresh }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState('category'); // 'category', 'segment', 'period'
  const [chartType, setChartType] = useState('bar'); // 'bar', 'pie'
  const [data, setData] = useState(propData || null);

  useEffect(() => {
    if (propData) {
      setData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setData(freshData || null);
      }
    } finally {
      setLoading(false);
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

  const formatCompactCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}M`;
    } else if (safeAmount >= 1000) {
      return `${(safeAmount / 1000).toFixed(0)}K`;
    }
    return safeAmount.toFixed(0);
  };

  // Check if we have valid data
  const hasData = data && (
    (data.byCategory && data.byCategory.length > 0) ||
    (data.bySegment && data.bySegment.length > 0) ||
    (data.byPeriod && data.byPeriod.length > 0)
  );

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" />
            <h3 className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Revenue Analytics
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                  Revenue breakdown by different dimensions
                </span>
              </span>
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className={`flex flex-col items-center justify-center h-48 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const getCurrentData = () => {
    switch (viewType) {
      case 'segment':
        return data.bySegment || [];
      case 'period':
        return data.byPeriod || [];
      default:
        return data.byCategory || [];
    }
  };

  const currentData = getCurrentData();
  const maxValue = currentData.length > 0 ? Math.max(...currentData.map(item => item.value)) : 0;

  // Render Bar Chart
  const renderBarChart = () => (
    <div className="space-y-2">
      {currentData.map((item, index) => {
        const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

        return (
          <div key={item.name} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(item.value)}
              </span>
            </div>
            <div className={`h-6 rounded overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className="h-full rounded transition-all duration-500 group-hover:opacity-80 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(widthPercent, 5)}%`,
                  backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`,
                }}
              >
                {item.percentage && widthPercent > 15 && (
                  <span className="text-xs text-white font-medium">
                    {item.percentage}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render Pie Chart (CSS-based)
  const renderPieChart = () => {
    // Calculate cumulative percentages for pie chart
    let cumulativePercent = 0;
    const segments = currentData.map((item, index) => {
      const startPercent = cumulativePercent;
      cumulativePercent += item.percentage || (item.value / data.total) * 100;
      return {
        ...item,
        startPercent,
        endPercent: cumulativePercent,
        color: item.color || `hsl(${index * 60}, 70%, 50%)`,
      };
    });

    // Create conic gradient
    const gradientStops = segments.map(seg =>
      `${seg.color} ${seg.startPercent}% ${seg.endPercent}%`,
    ).join(', ');

    return (
      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full relative"
          style={{
            background: `conic-gradient(${gradientStops})`,
            boxShadow: isDarkMode
              ? 'inset 0 0 0 3px rgba(30, 35, 40, 1)'
              : 'inset 0 0 0 3px rgba(255, 255, 255, 1)',
          }}
        >
          {/* Center hole for donut effect */}
          <div className={`absolute inset-6 sm:inset-8 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
          }`}>
            <div className="text-center">
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCompactCurrency(data.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-h-40 overflow-y-auto">
          {currentData.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {item.percentage || Math.round((item.value / data.total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-500" />
          <h3 className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Revenue Analytics
            <span className="relative group">
              <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
              <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                Revenue breakdown by different dimensions
              </span>
            </span>
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* View Type Selector */}
        <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
          {[
            { key: 'category', label: 'Category' },
            { key: 'segment', label: 'Segment' },
            { key: 'period', label: 'Period' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setViewType(option.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewType === option.key
                  ? 'bg-indigo-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Chart Type Toggle */}
        {viewType !== 'period' && (
          <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 transition-colors ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Bar Chart"
            >
              <BarChart3 size={16} />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 transition-colors ${
                chartType === 'pie'
                  ? 'bg-indigo-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Pie Chart"
            >
              <PieChart size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="min-h-[200px]">
        {viewType === 'period' ? (
          // Always show bar chart for period view
          renderBarChart()
        ) : (
          chartType === 'bar' ? renderBarChart() : renderPieChart()
        )}
      </div>

      {/* Footer Summary */}
      <div className={`mt-4 pt-4 border-t flex justify-between items-center ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Revenue
          </span>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(data.total)}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Categories
          </span>
          <p className={`text-lg font-bold text-indigo-500`}>
            {currentData.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalyticsWidget;
