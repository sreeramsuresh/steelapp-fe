import { ArrowDownRight, ArrowUpRight, Info, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

const CashFlowWidget = ({ data: propData, onRefresh, loading: externalLoading }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("mtd");
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
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
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

  const periodLabels = {
    mtd: "Month to Date",
    qtd: "Quarter to Date",
    ytd: "Year to Date",
  };

  // Check if we have valid data (support both camelCase and snake_case)
  const mtd = data?.mtd || data?.m_t_d || null;
  const qtd = data?.qtd || data?.q_t_d || null;
  const ytd = data?.ytd || data?.y_t_d || null;
  const hasData = data && (mtd || qtd || ytd);

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div
        className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            <h3
              className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Cash Flow
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                  Cash inflows vs outflows over time
                </span>
              </span>
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            } ${isLoading ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div
          className={`flex flex-col items-center justify-center h-48 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  // Get current period data with fallback to normalized variables
  const currentData = (period === "mtd" ? mtd : period === "qtd" ? qtd : ytd) || data[period] || mtd || {};

  const maxValue =
    currentData?.trend?.length > 0
      ? Math.max(...currentData.trend.map((d) => Math.max(d.inflow || d.inflows || 0, d.outflow || d.outflows || 0)))
      : 0;

  return (
    <div
      className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
        isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-500" />
          <h3
            className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Cash Flow
            <span className="relative group">
              <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
              <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                Cash inflows vs outflows over time
              </span>
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div
            className={`flex rounded-lg overflow-hidden border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
          >
            {Object.keys(periodLabels).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-teal-600 text-white"
                    : isDarkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            } ${isLoading ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Inflows */}
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-green-900/20" : "bg-green-50"}`}>
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight size={14} className="text-green-500" />
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Inflows</span>
          </div>
          <p className={`text-sm sm:text-base font-bold text-green-600`}>{formatCurrency(currentData?.inflows || 0)}</p>
        </div>

        {/* Outflows */}
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-red-900/20" : "bg-red-50"}`}>
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownRight size={14} className="text-red-500" />
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Outflows</span>
          </div>
          <p className={`text-sm sm:text-base font-bold text-red-600`}>{formatCurrency(currentData?.outflows || 0)}</p>
        </div>

        {/* Net Cash Flow */}
        <div
          className={`p-3 rounded-lg ${
            (currentData?.netCashFlow || 0) >= 0
              ? isDarkMode
                ? "bg-blue-900/20"
                : "bg-blue-50"
              : isDarkMode
                ? "bg-orange-900/20"
                : "bg-orange-50"
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            {(currentData?.netCashFlow || 0) >= 0 ? (
              <TrendingUp size={14} className="text-blue-500" />
            ) : (
              <TrendingDown size={14} className="text-orange-500" />
            )}
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Net</span>
          </div>
          <p
            className={`text-sm sm:text-base font-bold ${
              (currentData?.netCashFlow || 0) >= 0 ? "text-blue-600" : "text-orange-600"
            }`}
          >
            {formatCurrency(currentData?.netCashFlow || 0)}
          </p>
        </div>
      </div>

      {/* Area Chart Visualization */}
      {currentData?.trend && currentData.trend.length > 0 ? (
        <>
          <div className="relative h-32 mt-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-right pr-2">
              <span className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {formatCompactCurrency(maxValue)}
              </span>
              <span className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {formatCompactCurrency(maxValue / 2)}
              </span>
              <span className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>0</span>
            </div>

            {/* Chart Area */}
            <div className="ml-12 h-full flex items-end gap-2">
              {currentData.trend.map((item, index) => {
                const inflowHeight = maxValue > 0 ? ((item.inflow || 0) / maxValue) * 100 : 0;
                const outflowHeight = maxValue > 0 ? ((item.outflow || 0) / maxValue) * 100 : 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div
                      className={`hidden group-hover:block absolute -top-20 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg text-xs z-10 shadow-lg ${
                        isDarkMode ? "bg-gray-700 text-white" : "bg-gray-900 text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>In: {formatCurrency(item.inflow || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>Out: {formatCurrency(item.outflow || 0)}</span>
                      </div>
                    </div>

                    {/* Bars Container */}
                    <div className="h-24 flex items-end gap-0.5 w-full">
                      {/* Inflow Bar */}
                      <div
                        className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{ height: `${Math.max(inflowHeight, 2)}%` }}
                      />
                      {/* Outflow Bar */}
                      <div
                        className="flex-1 bg-gradient-to-t from-red-600 to-red-400 rounded-t transition-all duration-300 hover:opacity-80"
                        style={{ height: `${Math.max(outflowHeight, 2)}%` }}
                      />
                    </div>

                    {/* X-axis label */}
                    <span className={`text-[10px] mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div
            className={`flex justify-center gap-4 mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-green-600 to-green-400"></span>
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Inflows</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-red-600 to-red-400"></span>
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Outflows</span>
            </div>
          </div>
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <span className="text-sm">No trend data available</span>
        </div>
      )}
    </div>
  );
};

export default CashFlowWidget;
