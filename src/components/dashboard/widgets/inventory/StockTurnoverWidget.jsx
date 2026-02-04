import { RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

// Fallback mock data for stock turnover heatmap (used only when no API data is available)
const generateFallbackData = () => {
  // Generate last 6 months dynamically
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("default", { month: "short" }));
  }

  return {
    products: [
      { id: 1, name: "SS 304 2B Sheet", data: [4.2, 3.8, 4.5, 5.2, 4.8, 5.5] },
      { id: 2, name: "SS 316 Coil", data: [3.5, 3.2, 3.8, 4.0, 3.6, 4.2] },
      { id: 3, name: "SS 430 Sheet", data: [2.8, 3.0, 2.5, 2.8, 3.2, 2.9] },
      { id: 4, name: "SS 304 Pipe", data: [2.2, 2.0, 2.4, 2.1, 2.3, 2.5] },
      { id: 5, name: "SS 202 Sheet", data: [1.8, 2.2, 1.9, 2.0, 1.7, 2.1] },
      { id: 6, name: "SS 316L Tube", data: [1.5, 1.2, 1.4, 1.6, 1.3, 1.5] },
      { id: 7, name: "SS 304 Flat", data: [0.8, 1.0, 0.9, 0.7, 1.1, 0.9] },
      { id: 8, name: "SS 410 Coil", data: [0.5, 0.6, 0.4, 0.5, 0.7, 0.5] },
    ],
    months,
    overallEfficiency: 72,
    avgTurnover: 2.4,
    bestPerformer: "SS 304 2B Sheet",
    worstPerformer: "SS 410 Coil",
    isMockData: true,
  };
};

const StockTurnoverWidget = ({ data, onNavigate, onProductClick, onRefresh, loading: externalLoading }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [turnoverData, setTurnoverData] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    // Use API data if available and has products, otherwise use fallback
    if (data?.products && data.products.length > 0) {
      // Verify data has expected structure
      const hasValidData = data.products.some((p) => p.data && Array.isArray(p.data) && p.data.length > 0);
      if (hasValidData) {
        setTurnoverData(data);
      } else {
        // API returned products but no data, use fallback
        setTurnoverData(generateFallbackData());
      }
    } else {
      // No API data, use fallback
      setTurnoverData(generateFallbackData());
    }
  }, [data]);

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

  if (!turnoverData) return null;

  const getTurnoverColor = (value) => {
    // Excellent: > 4, Good: 2-4, Fair: 1-2, Poor: < 1
    if (value >= 4) return isDarkMode ? "bg-green-500" : "bg-green-500";
    if (value >= 2) return isDarkMode ? "bg-teal-500" : "bg-teal-500";
    if (value >= 1) return isDarkMode ? "bg-yellow-500" : "bg-yellow-500";
    return isDarkMode ? "bg-red-500" : "bg-red-500";
  };

  const getTurnoverOpacity = (value) => {
    const maxValue = 6;
    const minOpacity = 0.3;
    const opacity = minOpacity + (value / maxValue) * (1 - minOpacity);
    return Math.min(opacity, 1);
  };

  const getTurnoverLabel = (value) => {
    if (value >= 4) return "Excellent";
    if (value >= 2) return "Good";
    if (value >= 1) return "Fair";
    return "Poor";
  };

  const getEfficiencyColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-teal-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div
      className={`rounded-xl border p-4 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Stock Turnover Heatmap
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Monthly turnover ratio by product
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Efficiency Score */}
          <div className="text-right">
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Efficiency</p>
            <p className={`text-lg font-bold ${getEfficiencyColor(turnoverData.overallEfficiency)}`}>
              {turnoverData.overallEfficiency}%
            </p>
          </div>
          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
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
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          {/* Month Headers */}
          <div className="flex mb-1">
            <div className="w-24 flex-shrink-0" />
            {turnoverData.months.map((month) => (
              <div
                key={month}
                className={`flex-1 text-center text-[10px] font-medium ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Heatmap Rows */}
          {turnoverData.products.map((product) => (
            <div key={product.id} className="flex items-center mb-1 group">
              <button
                type="button"
                className={`w-24 flex-shrink-0 text-xs truncate pr-2 cursor-pointer text-left ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                } group-hover:text-teal-500`}
                onClick={() => onProductClick?.(product)}
                title={product.displayName || product.display_name || "N/A"}
              >
                {product.displayName || product.display_name || "N/A"}
              </button>
              <div className="flex-1 flex gap-0.5">
                {product.data.map((value, monthIndex) => (
                  <div
                    key={value}
                    tabIndex={0}
                    className={`flex-1 h-6 rounded cursor-pointer transition-all ${getTurnoverColor(value)} hover:ring-2 hover:ring-white/50`}
                    style={{ opacity: getTurnoverOpacity(value) }}
                    onMouseEnter={() =>
                      setHoveredCell({
                        product: product.displayName || product.display_name || "N/A",
                        month: turnoverData.months[monthIndex],
                        value,
                      })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    title={`${product.displayName || product.display_name || "N/A"} - ${turnoverData.months[monthIndex]}: ${value}x`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className={`mt-2 p-2 rounded-lg text-xs ${isDarkMode ? "bg-[#121418]" : "bg-gray-100"}`}>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
            <strong>{hoveredCell.product}</strong> - {hoveredCell.month}:
            <span
              className={`ml-1 font-semibold ${
                hoveredCell.value >= 4
                  ? "text-green-500"
                  : hoveredCell.value >= 2
                    ? "text-teal-500"
                    : hoveredCell.value >= 1
                      ? "text-yellow-500"
                      : "text-red-500"
              }`}
            >
              {hoveredCell.value}x ({getTurnoverLabel(hoveredCell.value)})
            </span>
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Excellent (&gt;4x)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-teal-500" />
            <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Good (2-4x)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Fair (1-2x)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Poor (&lt;1x)</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        className={`mt-4 pt-3 border-t grid grid-cols-3 gap-2 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
      >
        <div>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Avg Turnover</p>
          <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {turnoverData.avgTurnover}x
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Best</p>
          <p className={`text-xs font-medium text-green-500 truncate`} title={turnoverData.bestPerformer}>
            {turnoverData.bestPerformer}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Needs Attention</p>
          <p className={`text-xs font-medium text-red-500 truncate`} title={turnoverData.worstPerformer}>
            {turnoverData.worstPerformer}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => onNavigate?.("/analytics/inventory")}
          className={`text-xs font-medium ${
            isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
          }`}
        >
          View Full Analysis
        </button>
      </div>
    </div>
  );
};

export default StockTurnoverWidget;
