import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { TrendingUp, ChevronRight, BarChart3 } from 'lucide-react';

const TopProductsWidget = ({ data, onNavigate, onProductClick }) => {
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState('revenue'); // 'revenue', 'margin', 'volume'
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts([]);
      return;
    }

    switch (viewMode) {
      case 'margin':
        setProducts(data.byMargin || []);
        break;
      case 'volume':
        setProducts(data.byVolume || []);
        break;
      default:
        setProducts(data.byRevenue || []);
    }
  }, [data, viewMode]);

  // Check if we have valid data
  const hasData =
    data &&
    ((data.byRevenue && data.byRevenue.length > 0) ||
      (data.byMargin && data.byMargin.length > 0) ||
      (data.byVolume && data.byVolume.length > 0));

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div
        className={`rounded-xl border p-4 ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h3
                className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Top Products
              </h3>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Performance ranking
              </p>
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatVolume = (volume) => {
    return `${volume.toFixed(1)} MT`;
  };

  const getMaxValue = () => {
    if (products.length === 0) return 1;
    switch (viewMode) {
      case 'margin':
        return Math.max(...products.map((p) => p.margin));
      case 'volume':
        return Math.max(...products.map((p) => p.volume));
      default:
        return Math.max(...products.map((p) => p.revenue));
    }
  };

  const getValue = (product) => {
    switch (viewMode) {
      case 'margin':
        return product.margin;
      case 'volume':
        return product.volume;
      default:
        return product.revenue;
    }
  };

  const getDisplayValue = (product) => {
    switch (viewMode) {
      case 'margin':
        return `${product.margin.toFixed(1)}%`;
      case 'volume':
        return formatVolume(product.volume);
      default:
        return formatCurrency(product.revenue);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Sheets: 'bg-blue-500',
      Coils: 'bg-emerald-500',
      Pipes: 'bg-purple-500',
      Tubes: 'bg-amber-500',
      Flats: 'bg-rose-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const maxValue = getMaxValue();

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDarkMode
          ? 'bg-[#1E2328] border-[#37474F]'
          : 'bg-white border-[#E0E0E0]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Top Products
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              By{' '}
              {viewMode === 'revenue'
                ? 'Revenue'
                : viewMode === 'margin'
                  ? 'Margin'
                  : 'Volume'}
            </p>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div
          className={`flex rounded-lg p-0.5 ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}
        >
          {['revenue', 'margin', 'volume'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-teal-500 text-white shadow-sm'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3">
        {products.slice(0, 10).map((product, index) => (
          <div
            key={product.id}
            className={`group cursor-pointer rounded-lg p-2 transition-all ${
              isDarkMode ? 'hover:bg-[#2E3B4E]' : 'hover:bg-gray-50'
            }`}
            onClick={() => onProductClick?.(product)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onProductClick?.(product);
              }
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span
                  className={`text-xs font-medium w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {index + 1}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${getCategoryColor(product.category)}`}
                />
                <span
                  className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {product.displayName || product.display_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {getDisplayValue(product)}
                </span>
                <ChevronRight
                  size={14}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    viewMode === 'margin'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : viewMode === 'volume'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                        : 'bg-gradient-to-r from-teal-500 to-teal-400'
                  }`}
                  style={{ width: `${(getValue(product) / maxValue) * 100}%` }}
                />
              </div>
              <span
                className={`text-xs w-12 text-right ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
              >
                {product.percentOfTotal.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className={`mt-4 pt-3 border-t flex justify-between items-center ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {['Sheets', 'Coils', 'Pipes'].map((category) => (
            <div key={category} className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`}
              />
              <span
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {category}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate?.('/products')}
          className={`text-xs font-medium flex items-center gap-1 transition-colors ${
            isDarkMode
              ? 'text-teal-400 hover:text-teal-300'
              : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View All
          <BarChart3 size={12} />
        </button>
      </div>
    </div>
  );
};

export default TopProductsWidget;
