import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  Percent,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

// Mock data for Financial KPIs
const MOCK_KPI_DATA = {
  grossMargin: { value: 28.5, target: 30, trend: 2.3, unit: '%' },
  netMargin: { value: 18.2, target: 20, trend: -1.1, unit: '%' },
  dso: { value: 45, target: 30, trend: -5, unit: ' days' },
  dpo: { value: 38, target: 45, trend: 3, unit: ' days' },
  currentRatio: { value: 1.85, target: 2.0, trend: 0.15, unit: '' },
  quickRatio: { value: 1.25, target: 1.5, trend: -0.08, unit: '' },
};

const KPICard = ({ title, value, target, trend, unit, icon: Icon, colorScheme, isDarkMode, tooltip }) => {
  const isOnTarget = colorScheme === 'success' || (target && value >= target);
  const isNearTarget = colorScheme === 'warning' || (target && value >= target * 0.8 && value < target);
  const isBelowTarget = colorScheme === 'error' || (target && value < target * 0.8);

  const getStatusColor = () => {
    if (colorScheme) {
      switch (colorScheme) {
        case 'success': return 'text-green-500';
        case 'warning': return 'text-yellow-500';
        case 'error': return 'text-red-500';
        default: return 'text-blue-500';
      }
    }
    if (isOnTarget) return 'text-green-500';
    if (isNearTarget) return 'text-yellow-500';
    if (isBelowTarget) return 'text-red-500';
    return 'text-blue-500';
  };

  const getStatusIcon = () => {
    if (isOnTarget) return <CheckCircle size={14} className="text-green-500" />;
    if (isNearTarget) return <AlertTriangle size={14} className="text-yellow-500" />;
    if (isBelowTarget) return <AlertTriangle size={14} className="text-red-500" />;
    return null;
  };

  const getBgColor = () => {
    if (colorScheme) {
      switch (colorScheme) {
        case 'success': return isDarkMode ? 'bg-green-900/20' : 'bg-green-50';
        case 'warning': return isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
        case 'error': return isDarkMode ? 'bg-red-900/20' : 'bg-red-50';
        default: return isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
      }
    }
    if (isOnTarget) return isDarkMode ? 'bg-green-900/20' : 'bg-green-50';
    if (isNearTarget) return isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
    if (isBelowTarget) return isDarkMode ? 'bg-red-900/20' : 'bg-red-50';
    return isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
  };

  return (
    <div className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getBgColor()}`}>
            <Icon size={16} className={getStatusColor()} />
          </div>
          <span className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {title}
            {tooltip && (
              <span className="relative group">
                <Info size={12} className="cursor-help opacity-50 hover:opacity-100" />
                <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                  {tooltip}
                </span>
              </span>
            )}
          </span>
        </div>
        {getStatusIcon()}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {typeof value === 'number' ? value.toFixed(unit === '%' || unit === '' ? 1 : 0) : value}
          <span className={`text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {unit}
          </span>
        </span>
      </div>

      {/* Trend and Target */}
      <div className="flex items-center justify-between">
        {/* Trend */}
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs ${
            trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : null}
            <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}</span>
          </div>
        )}

        {/* Target */}
        {target !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <Target size={12} />
            <span>Target: {target}{unit}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const FinancialKPICards = ({ data: propData, onRefresh }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(propData || MOCK_KPI_DATA);

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
        setData(freshData || MOCK_KPI_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine color schemes based on values
  const getGrossMarginColor = () => {
    if (data.grossMargin.value >= data.grossMargin.target) return 'success';
    if (data.grossMargin.value >= data.grossMargin.target * 0.9) return 'warning';
    return 'error';
  };

  const getNetMarginColor = () => {
    if (data.netMargin.value >= data.netMargin.target) return 'success';
    if (data.netMargin.value >= data.netMargin.target * 0.9) return 'warning';
    return 'error';
  };

  const getDSOColor = () => {
    // Lower is better for DSO
    if (data.dso.value <= data.dso.target) return 'success';
    if (data.dso.value <= data.dso.target * 1.2) return 'warning';
    return 'error';
  };

  const getDPOColor = () => {
    // Higher is better for DPO (more time to pay)
    if (data.dpo.value >= data.dpo.target) return 'success';
    if (data.dpo.value >= data.dpo.target * 0.8) return 'warning';
    return 'error';
  };

  const getCurrentRatioColor = () => {
    if (data.currentRatio.value >= data.currentRatio.target) return 'success';
    if (data.currentRatio.value >= 1.5) return 'warning';
    return 'error';
  };

  const getQuickRatioColor = () => {
    if (data.quickRatio.value >= data.quickRatio.target) return 'success';
    if (data.quickRatio.value >= 1.0) return 'warning';
    return 'error';
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-purple-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Financial KPIs
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard
          title="Gross Margin"
          value={data.grossMargin.value}
          target={data.grossMargin.target}
          trend={data.grossMargin.trend}
          unit="%"
          icon={Percent}
          colorScheme={getGrossMarginColor()}
          isDarkMode={isDarkMode}
          tooltip="Revenue minus COGS divided by revenue"
        />

        <KPICard
          title="Net Margin"
          value={data.netMargin.value}
          target={data.netMargin.target}
          trend={data.netMargin.trend}
          unit="%"
          icon={Percent}
          colorScheme={getNetMarginColor()}
          isDarkMode={isDarkMode}
          tooltip="Net profit divided by revenue"
        />

        <KPICard
          title="DSO"
          value={data.dso.value}
          target={data.dso.target}
          trend={data.dso.trend}
          unit=" days"
          icon={Clock}
          colorScheme={getDSOColor()}
          isDarkMode={isDarkMode}
          tooltip="Days Sales Outstanding - avg collection period"
        />

        <KPICard
          title="DPO"
          value={data.dpo.value}
          target={data.dpo.target}
          trend={data.dpo.trend}
          unit=" days"
          icon={Clock}
          colorScheme={getDPOColor()}
          isDarkMode={isDarkMode}
          tooltip="Days Payable Outstanding - avg payment period"
        />

        <KPICard
          title="Current Ratio"
          value={data.currentRatio.value}
          target={data.currentRatio.target}
          trend={data.currentRatio.trend}
          unit=""
          icon={TrendingUp}
          colorScheme={getCurrentRatioColor()}
          isDarkMode={isDarkMode}
          tooltip="Current assets / Current liabilities"
        />

        <KPICard
          title="Quick Ratio"
          value={data.quickRatio.value}
          target={data.quickRatio.target}
          trend={data.quickRatio.trend}
          unit=""
          icon={TrendingUp}
          colorScheme={getQuickRatioColor()}
          isDarkMode={isDarkMode}
          tooltip="(Cash + AR) / Current liabilities"
        />
      </div>

      {/* Summary Footer */}
      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-green-500" />
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>On Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Near Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-500" />
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Below Target</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialKPICards;
