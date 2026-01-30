import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Layers, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const CategoryPerformanceWidget = ({
  data,
  onNavigate: _onNavigate,
  onCategoryClick,
}) => {
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState([]);
  const [period, setPeriod] = useState('This Month');
  const [hoveredCategory, setHoveredCategory] = useState(null);

  useEffect(() => {
    if (data?.categories && data.categories.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(data.categories);
    } else {
      setCategories([]);
    }
  }, [data]);

  // Check if we have valid data
  const hasData = data && data.categories && data.categories.length > 0;

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Layers size={16} className="text-white" />
            </div>
            <div>
              <h3
                className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Category Performance
              </h3>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Revenue & margin by product type
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
    if (amount >= 1000000) {
      return `AED ${(amount / 1000000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalRevenue = categories.reduce((sum, cat) => sum + cat.revenue, 0);
  const maxRevenue = Math.max(...categories.map((c) => c.revenue));

  const getCategoryColor = (name, opacity = 1) => {
    const colors = {
      Sheets: `rgba(59, 130, 246, ${opacity})`,
      Coils: `rgba(16, 185, 129, ${opacity})`,
      Pipes: `rgba(139, 92, 246, ${opacity})`,
      Tubes: `rgba(245, 158, 11, ${opacity})`,
      Flats: `rgba(244, 63, 94, ${opacity})`,
    };
    return colors[name] || `rgba(107, 114, 128, ${opacity})`;
  };

  const getCategoryBgClass = (name) => {
    const classes = {
      Sheets: 'from-blue-500 to-blue-600',
      Coils: 'from-emerald-500 to-emerald-600',
      Pipes: 'from-purple-500 to-purple-600',
      Tubes: 'from-amber-500 to-amber-600',
      Flats: 'from-rose-500 to-rose-600',
    };
    return classes[name] || 'from-gray-500 to-gray-600';
  };

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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Category Performance
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Revenue & margin by product type
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`appearance-none text-xs font-medium px-3 py-1.5 pr-7 rounded-lg border cursor-pointer ${
              isDarkMode
                ? 'bg-[#121418] border-[#37474F] text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            {['This Month', 'Last Month', 'This Quarter', 'This Year'].map(
              (p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ),
            )}
          </select>
          <Calendar
            size={12}
            className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="mb-4">
        <div
          className={`h-8 rounded-lg overflow-hidden flex ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}
        >
          {categories.map((cat, _index) => {
            const width = (cat.revenue / totalRevenue) * 100;
            return (
              <div
                key={cat.name}
                className={`h-full transition-all duration-300 cursor-pointer relative ${
                  hoveredCategory === cat.name
                    ? 'opacity-100'
                    : hoveredCategory
                      ? 'opacity-50'
                      : 'opacity-100'
                }`}
                style={{
                  width: `${width}%`,
                  backgroundColor: getCategoryColor(cat.name),
                }}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => onCategoryClick?.(cat)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCategoryClick?.(cat);
                  }
                }}
              >
                {width > 10 && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {width.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Details */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.name}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              hoveredCategory === category.name
                ? isDarkMode
                  ? 'bg-[#2E3B4E]'
                  : 'bg-gray-100'
                : isDarkMode
                  ? 'hover:bg-[#2E3B4E]'
                  : 'hover:bg-gray-50'
            }`}
            onMouseEnter={() => setHoveredCategory(category.name)}
            onMouseLeave={() => setHoveredCategory(null)}
            onClick={() => onCategoryClick?.(category)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCategoryClick?.(category);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCategoryBgClass(category.name)} flex items-center justify-center`}
                >
                  <span className="text-xs font-bold text-white">
                    {category.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {category.name}
                  </p>
                  <p
                    className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {category.orders} orders | {category.volume.toFixed(1)} MT
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {formatCurrency(category.revenue)}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      isDarkMode
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {category.margin.toFixed(1)}% margin
                  </span>
                  <span
                    className={`text-xs flex items-center gap-0.5 ${
                      category.growth >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {category.growth >= 0 ? (
                      <TrendingUp size={10} />
                    ) : (
                      <TrendingDown size={10} />
                    )}
                    {Math.abs(category.growth).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Bar */}
            <div
              className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getCategoryBgClass(category.name)} transition-all duration-500`}
                style={{ width: `${(category.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div
        className={`mt-4 pt-3 border-t grid grid-cols-3 gap-4 ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}
      >
        <div className="text-center">
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Total Revenue
          </p>
          <p
            className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="text-center">
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Avg Margin
          </p>
          <p
            className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {(
              categories.reduce((sum, c) => sum + c.margin, 0) /
              categories.length
            ).toFixed(1)}
            %
          </p>
        </div>
        <div className="text-center">
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Total Volume
          </p>
          <p
            className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {categories.reduce((sum, c) => sum + c.volume, 0).toFixed(1)} MT
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryPerformanceWidget;
