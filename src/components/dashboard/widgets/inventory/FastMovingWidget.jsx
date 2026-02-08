import { Package, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getProductDisplayName } from "../../../../utils/fieldAccessors";

const MiniTrendLine = ({ data, width = 50, height = 20 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg aria-label="icon" width={width} height={height}>
      <title>Icon</title>
      <polyline
        points={points}
        fill="none"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const FastMovingWidget = ({ data, onNavigate, onProductClick }) => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (data?.products && data.products.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(data.products);
    } else {
      setProducts([]);
    }
    if (data?.summary) {
      setSummary(data.summary);
    } else {
      setSummary(null);
    }
  }, [data]);

  // Check if we have valid data
  const hasData = data?.products && data.products.length > 0;

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div
        className={`rounded-xl border p-4 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Fast Moving Items
              </h3>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Turnover ratio &gt; 4x/quarter
              </p>
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <span className="text-sm">No data available</span>
          <span className="text-xs mt-1 opacity-70">
            Fast-moving items will appear as sales transactions are recorded
          </span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "optimal":
        return {
          bg: isDarkMode ? "bg-green-500/20" : "bg-green-100",
          text: isDarkMode ? "text-green-400" : "text-green-700",
          label: "Optimal",
        };
      case "watch":
        return {
          bg: isDarkMode ? "bg-yellow-500/20" : "bg-yellow-100",
          text: isDarkMode ? "text-yellow-400" : "text-yellow-700",
          label: "Watch",
        };
      default:
        return {
          bg: isDarkMode ? "bg-gray-500/20" : "bg-gray-100",
          text: isDarkMode ? "text-gray-400" : "text-gray-600",
          label: "Normal",
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`rounded-xl border p-4 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Fast Moving Items
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Turnover ratio &gt; 4x/quarter
            </p>
          </div>
        </div>

        {summary && (
          <div className={`px-2 py-1 rounded-lg ${isDarkMode ? "bg-green-500/10" : "bg-green-50"}`}>
            <span className={`text-xs font-medium ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
              {summary.totalFastMoving} items
            </span>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {products.slice(0, 6).map((product, index) => {
          const status = getStatusBadge(product.status);
          const stockPercent = (product.currentStock / (product.reorderPoint * 3)) * 100;

          return (
            <button
              type="button"
              key={product.id}
              className={`p-3 rounded-lg cursor-pointer transition-all w-full text-left ${
                isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"
              }`}
              onClick={() => onProductClick?.(product)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium w-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {index + 1}
                    </span>
                    <p className={`text-sm font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {getProductDisplayName(product) || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${status.bg} ${status.text}`}>{status.label}</span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="text-right ml-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-green-500" />
                    <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {product.turnoverRatio}x
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {product.daysToSell}d avg
                  </p>
                </div>
              </div>

              {/* Stock Level & Trend */}
              <div className="flex items-center justify-between ml-6">
                <div className="flex items-center gap-2">
                  <Package size={12} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                  <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {product.currentStock.toFixed(1)} MT
                  </span>
                  <div
                    className={`w-16 h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-[#121418]" : "bg-gray-100"}`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        stockPercent > 60 ? "bg-green-500" : stockPercent > 30 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(stockPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MiniTrendLine data={product.trend} isDarkMode={isDarkMode} />
                  <span className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {formatDate(product.lastSaleDate)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary Footer */}
      {summary && (
        <div
          className={`mt-4 pt-3 border-t grid grid-cols-2 gap-4 ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
        >
          <div>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Avg Turnover</p>
            <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {summary.avgTurnover}x / quarter
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Value</p>
            <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              AED {(summary.totalValue / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      )}

      {/* View All Link */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => onNavigate?.("/inventory?filter=fast-moving")}
          className={`text-xs font-medium ${
            isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
          }`}
        >
          View All Fast Moving
        </button>
      </div>
    </div>
  );
};

export default FastMovingWidget;
