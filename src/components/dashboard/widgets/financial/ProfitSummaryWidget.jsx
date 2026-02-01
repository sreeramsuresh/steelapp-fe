import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  ArrowRight,
} from 'lucide-react';

const ProfitSummaryWidget = ({
  data: propData,
  onRefresh,
  loading: externalLoading,
}) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(propData || null);

  useEffect(() => {
    if (propData) {
      setData(propData);
    }
  }, [propData]);

  const isLoading = loading || externalLoading;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        await onRefresh();
        // Data will be updated via props after refresh
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

  // Check if we have valid data (support both camelCase and snake_case field names)
  const revenue = parseFloat(data?.revenue || 0);
  const netProfit = parseFloat(data?.netProfit || data?.net_profit || 0);
  const hasData = data && (revenue > 0 || netProfit > 0);

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div
        className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-green-500" />
            <h3
              className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Profit Summary
              <span className="relative group">
                <Info
                  size={14}
                  className="cursor-help opacity-50 hover:opacity-100"
                />
                <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                  Revenue breakdown showing profitability
                </span>
              </span>
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div
          className={`flex flex-col items-center justify-center h-48 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Normalize field names (support both camelCase and snake_case)
  const cogs = parseFloat(data?.cogs || data?.cost_of_goods_sold || 0);
  const grossProfit = parseFloat(data?.grossProfit || data?.gross_profit || 0);
  const operatingExpenses = parseFloat(data?.operatingExpenses || data?.operating_expenses || 0);
  const grossMarginPercent = parseFloat(data?.grossMarginPercent || data?.gross_margin_percent || 0);
  const netMarginPercent = parseFloat(data?.netMarginPercent || data?.net_margin_percent || 0);
  const prevPeriod = data?.previousPeriod || data?.previous_period || {};
  const prevRevenue = parseFloat(prevPeriod?.revenue || 0);
  const prevNetProfit = parseFloat(prevPeriod?.netProfit || prevPeriod?.net_profit || 0);

  const revenueChange = calculateChange(revenue, prevRevenue);
  const netProfitChange = calculateChange(netProfit, prevNetProfit);

  // Waterfall chart data
  const waterfallItems = [
    {
      label: 'Revenue',
      value: revenue,
      type: 'positive',
      color: 'bg-blue-500',
    },
    {
      label: 'COGS',
      value: -cogs,
      type: 'negative',
      color: 'bg-red-500',
    },
    {
      label: 'Gross Profit',
      value: grossProfit,
      type: 'subtotal',
      color: 'bg-teal-500',
    },
    {
      label: 'Op. Expenses',
      value: -operatingExpenses,
      type: 'negative',
      color: 'bg-orange-500',
    },
    {
      label: 'Net Profit',
      value: netProfit,
      type: 'total',
      color: 'bg-green-500',
    },
  ];

  const maxAbsValue = Math.max(
    ...waterfallItems.map((item) => Math.abs(item.value)),
  );

  return (
    <div
      className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? 'bg-[#1E2328] border-[#37474F]'
          : 'bg-white border-[#E0E0E0]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign size={20} className="text-green-500" />
          <h3
            className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Profit Summary
            <span className="relative group">
              <Info
                size={14}
                className="cursor-help opacity-50 hover:opacity-100"
              />
              <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                Revenue breakdown showing profitability
              </span>
            </span>
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Gross Margin */}
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
        >
          <span
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Gross Margin
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {grossMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Net Margin */}
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
        >
          <span
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Net Margin
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {netMarginPercent.toFixed(1)}%
            </span>
            {netProfitChange !== 0 && (
              <span
                className={`text-xs flex items-center ${
                  netProfitChange > 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {netProfitChange > 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(netProfitChange).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div className="space-y-2">
        {waterfallItems.map((item, index) => {
          const widthPercent =
            maxAbsValue > 0 ? (Math.abs(item.value) / maxAbsValue) * 100 : 0;
          const isSubtotalOrTotal =
            item.type === 'subtotal' || item.type === 'total';

          return (
            <div key={item.label} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs sm:text-sm ${
                      isSubtotalOrTotal
                        ? isDarkMode
                          ? 'text-white font-medium'
                          : 'text-gray-900 font-medium'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.type === 'negative' && (
                    <span className="text-xs text-red-500">-</span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    item.type === 'negative'
                      ? 'text-red-500'
                      : item.type === 'total'
                        ? 'text-green-600'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-gray-900'
                  }`}
                >
                  {item.type === 'negative' ? '-' : ''}
                  {formatCurrency(Math.abs(item.value))}
                </span>
              </div>

              {/* Bar */}
              <div
                className={`h-6 rounded overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <div
                  className={`h-full ${item.color} rounded transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                >
                  {widthPercent > 20 && data.revenue > 0 && (
                    <span className="text-xs text-white font-medium">
                      {item.type === 'negative' ? '-' : ''}
                      {((Math.abs(item.value) / data.revenue) * 100).toFixed(0)}
                      %
                    </span>
                  )}
                </div>
              </div>

              {/* Flow Arrow (between items) */}
              {index < waterfallItems.length - 1 && index !== 1 && (
                <div className="flex justify-center py-1">
                  <ArrowRight
                    size={14}
                    className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div
        className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <span
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Total Revenue
            </span>
            <p
              className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {formatCurrency(data.revenue)}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Net Profit
            </span>
            <p className="text-lg font-bold text-green-500">
              {formatCurrency(data.netProfit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitSummaryWidget;
