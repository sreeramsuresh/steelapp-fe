import { Calendar, DollarSign, Megaphone, Search, Snail, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

const SlowMovingWidget = ({ data, onNavigate, onProductClick, onAction }) => {
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Snail size={16} className="text-white" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Slow Moving Items
              </h3>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Turnover ratio &lt; 1x/quarter
              </p>
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const getRecommendation = (type) => {
    const recommendations = {
      discount: {
        icon: Tag,
        label: "Discount",
        color: isDarkMode ? "text-orange-400" : "text-orange-600",
        bg: isDarkMode ? "bg-orange-500/10" : "bg-orange-50",
        border: isDarkMode ? "border-orange-500/30" : "border-orange-200",
      },
      promote: {
        icon: Megaphone,
        label: "Promote",
        color: isDarkMode ? "text-blue-400" : "text-blue-600",
        bg: isDarkMode ? "bg-blue-500/10" : "bg-blue-50",
        border: isDarkMode ? "border-blue-500/30" : "border-blue-200",
      },
      review: {
        icon: Search,
        label: "Review",
        color: isDarkMode ? "text-purple-400" : "text-purple-600",
        bg: isDarkMode ? "bg-purple-500/10" : "bg-purple-50",
        border: isDarkMode ? "border-purple-500/30" : "border-purple-200",
      },
      discontinue: {
        icon: Trash2,
        label: "Discontinue",
        color: isDarkMode ? "text-red-400" : "text-red-600",
        bg: isDarkMode ? "bg-red-500/10" : "bg-red-50",
        border: isDarkMode ? "border-red-500/30" : "border-red-200",
      },
    };
    return recommendations[type] || recommendations.review;
  };

  const getDaysColor = (days) => {
    if (days > 180) return "text-red-500";
    if (days > 90) return "text-orange-500";
    return "text-yellow-500";
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000) {
      return `AED ${(amount / 1000).toFixed(0)}K`;
    }
    return `AED ${amount}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AE", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  return (
    <div
      className={`rounded-xl border p-4 ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Snail size={16} className="text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Slow Moving Items
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Turnover ratio &lt; 1x/quarter
            </p>
          </div>
        </div>

        {summary && (
          <div className={`px-2 py-1 rounded-lg ${isDarkMode ? "bg-orange-500/10" : "bg-orange-50"}`}>
            <span className={`text-xs font-medium ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
              {summary.totalSlowMoving} items
            </span>
          </div>
        )}
      </div>

      {/* Value Locked Alert */}
      {summary && (
        <div
          className={`p-3 rounded-lg mb-4 ${isDarkMode ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-100"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-red-500" />
              <span className={`text-sm font-medium ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                Value Locked
              </span>
            </div>
            <span className={`text-lg font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
              AED {(summary.totalValueLocked / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {products.slice(0, 5).map((product) => {
          const rec = getRecommendation(product.recommendation);
          const RecIcon = rec.icon;

          return (
            <div
              key={product.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"
              }`}
              onClick={() => onProductClick?.(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onProductClick?.(product);
                }
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {product.displayName || product.display_name || "N/A"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {product.category}
                    </span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>|</span>
                    <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {product.currentStock.toFixed(1)} MT
                    </span>
                  </div>
                </div>

                <div className={`text-right`}>
                  <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(product.value)}
                  </p>
                  <p className={`text-xs ${getDaysColor(product.daysInStock)}`}>{product.daysInStock}d in stock</p>
                </div>
              </div>

              {/* Last Sale & Recommendation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Calendar size={12} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Last sale: {formatDate(product.lastSaleDate)}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(product, product.recommendation);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-all ${rec.bg} ${rec.border} ${rec.color} hover:opacity-80`}
                >
                  <RecIcon size={12} />
                  {rec.label}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {summary && (
        <div
          className={`mt-4 pt-3 border-t flex items-center justify-between ${
            isDarkMode ? "border-[#37474F]" : "border-gray-200"
          }`}
        >
          <div>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Avg Days in Stock</p>
            <p className={`text-sm font-semibold ${getDaysColor(summary.avgDaysInStock)}`}>
              {summary.avgDaysInStock} days
            </p>
          </div>
          <button
            onClick={() => onNavigate?.("/inventory?filter=slow-moving")}
            className={`text-xs font-medium ${
              isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
            }`}
          >
            View All Slow Moving
          </button>
        </div>
      )}
    </div>
  );
};

export default SlowMovingWidget;
