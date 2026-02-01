import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Activity, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  safeEntries,
  safeKeys,
  safeNumber,
} from '../../../../utils/safeAccess';

const GaugeChart = ({ value, size = 120, strokeWidth = 10, isDarkMode }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const progress = (value / 100) * circumference;

  const getColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={isDarkMode ? '#374151' : '#E5E7EB'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000"
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          className={`text-2xl font-bold ${isDarkMode ? 'fill-white' : 'fill-gray-900'}`}
        >
          {value}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          className="text-xs"
          fill={getColor(value)}
        >
          {getLabel(value)}
        </text>
      </svg>
    </div>
  );
};

const InventoryHealthWidget = ({ data, onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHealthData(data);
    } else {
      setHealthData(null);
    }
  }, [data]);

  // Check if we have valid data - require actual tracked items or inventory value
  const hasData =
    healthData &&
    (healthData.totalItems > 0 || healthData.totalValue > 0) &&
    (healthData.healthScore !== undefined);

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <h3
                className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Inventory Health
              </h3>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Overall stock status
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
    }).format(amount);
  };

  const _getCategoryHealthColor = (health) => {
    switch (health) {
      case 'good':
        return isDarkMode
          ? 'bg-green-500/20 text-green-400'
          : 'bg-green-100 text-green-700';
      case 'warning':
        return isDarkMode
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-yellow-100 text-yellow-700';
      case 'critical':
        return isDarkMode
          ? 'bg-red-500/20 text-red-400'
          : 'bg-red-100 text-red-700';
      default:
        return isDarkMode
          ? 'bg-gray-500/20 text-gray-400'
          : 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryBarColor = (category) => {
    const colors = {
      sheets: 'bg-blue-500',
      coils: 'bg-emerald-500',
      pipes: 'bg-purple-500',
      tubes: 'bg-amber-500',
      flats: 'bg-rose-500',
    };
    return colors[category] || 'bg-gray-500';
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Inventory Health
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Overall stock status
            </p>
          </div>
        </div>
      </div>

      {/* Health Gauge */}
      <div className="flex justify-center mb-4">
        <GaugeChart value={healthData.healthScore} isDarkMode={isDarkMode} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}
        >
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Total Value
          </p>
          <p
            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {formatCurrency(healthData.totalValue)}
          </p>
        </div>
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}
        >
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Days of Stock
          </p>
          <p
            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {healthData.totalItems > 0 && healthData.daysOfStock !== undefined
              ? `${healthData.daysOfStock} days`
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {safeKeys(healthData.breakdown).length > 0 && (
        <div className="mb-4">
          <p
            className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Stock by Category
          </p>
          <div
            className={`h-4 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-100'}`}
          >
            {safeEntries(healthData.breakdown).map(
              ([category, categoryData]) => (
                <div
                  key={category}
                  className={`h-full ${getCategoryBarColor(category)} transition-all`}
                  style={{
                    width: `${safeNumber(categoryData?.percentage, 0)}%`,
                  }}
                  title={`${category}: ${safeNumber(categoryData?.percentage, 0)}%`}
                />
              ),
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {safeEntries(healthData.breakdown).map(
              ([category, categoryData]) => (
                <div key={category} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${getCategoryBarColor(category)}`}
                  />
                  <span
                    className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)} (
                    {safeNumber(categoryData?.percentage, 0)}%)
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Alerts Summary */}
      {healthData.alerts && (
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#121418]' : 'bg-gray-50'}`}
        >
          <p
            className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Active Alerts
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <AlertTriangle size={14} className="text-red-500" />
              <span
                className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Low Stock:{' '}
                <span className="font-semibold text-red-500">
                  {safeNumber(healthData.alerts?.lowStock, 0)}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Package size={14} className="text-amber-500" />
              <span
                className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Overstock:{' '}
                <span className="font-semibold text-amber-500">
                  {safeNumber(healthData.alerts?.overstock, 0)}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className={`mt-4 pt-3 border-t flex justify-between items-center ${
          isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-500" />
          <span
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {safeNumber(healthData.totalItems, 0)} items tracked
          </span>
        </div>
        <button
          onClick={() => onNavigate?.('/inventory')}
          className={`text-xs font-medium ${
            isDarkMode
              ? 'text-teal-400 hover:text-teal-300'
              : 'text-teal-600 hover:text-teal-700'
          }`}
        >
          View Inventory
        </button>
      </div>
    </div>
  );
};

export default InventoryHealthWidget;
