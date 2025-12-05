/**
 * ConversionFunnelWidget.jsx
 *
 * Quote-to-Order Conversion Funnel
 * Visualizes sales pipeline stages from quotes to converted orders
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  Filter,
  FileText,
  Phone,
  CheckCircle,
  ArrowRight,
  Info,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// Mock funnel data
const MOCK_FUNNEL_DATA = {
  period: 'This Month',
  stages: [
    {
      name: 'Quotes Sent',
      count: 85,
      value: 12500000,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Follow-ups',
      count: 62,
      value: 9800000,
      icon: Phone,
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Converted',
      count: 45,
      value: 7200000,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
    },
  ],
  metrics: {
    overallConversionRate: 52.9,
    previousConversionRate: 48.5,
    avgQuoteValue: 147058,
    avgDealSize: 160000,
    avgDaysToConvert: 8.5,
  },
  topReasons: [
    { reason: 'Price too high', count: 18, percent: 45 },
    { reason: 'Went to competitor', count: 12, percent: 30 },
    { reason: 'Project cancelled', count: 6, percent: 15 },
    { reason: 'No response', count: 4, percent: 10 },
  ],
};

const ConversionFunnelWidget = ({
  data: propData,
  onRefresh,
  onViewDetails,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [funnelData, setFunnelData] = useState(propData || MOCK_FUNNEL_DATA);
  const [loading, setLoading] = useState(false);
  const [showReasons, setShowReasons] = useState(false);

  useEffect(() => {
    if (propData) {
      setFunnelData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setFunnelData(freshData || MOCK_FUNNEL_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `AED ${(safeAmount / 1000000).toFixed(2)}M`;
    } else if (safeAmount >= 1000) {
      return `AED ${(safeAmount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const getConversionRate = (currentIndex, stages) => {
    if (currentIndex === 0) return 100;
    const prevCount = stages[currentIndex - 1].count;
    const currentCount = stages[currentIndex].count;
    return prevCount > 0 ? ((currentCount / prevCount) * 100).toFixed(1) : 0;
  };

  if (!funnelData || !funnelData.stages) {
    return (
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-purple-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Conversion Funnel
          </h3>
        </div>
        <div className="text-center py-8">
          <Filter size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No funnel data available
          </p>
        </div>
      </div>
    );
  }

  const { stages, metrics, topReasons } = funnelData;
  const conversionChange = metrics.overallConversionRate - metrics.previousConversionRate;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode
        ? 'bg-[#1E2328] border-[#37474F] hover:border-purple-600'
        : 'bg-white border-[#E0E0E0] hover:border-purple-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Filter size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Conversion Funnel
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Quote to order conversion tracking
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {funnelData.period}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || isLoading}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-[#2E3B4E] text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${(loading || isLoading) ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-3 mb-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const widthPercent = Math.max(30, 100 - (index * 25));
          const stageConversion = getConversionRate(index, stages);

          return (
            <div key={stage.name} className="relative">
              {/* Conversion Arrow */}
              {index > 0 && (
                <div className="flex items-center justify-center -mt-1 -mb-1 relative z-10">
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isDarkMode ? 'bg-[#2E3B4E] text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {stageConversion}%
                  </div>
                </div>
              )}

              {/* Stage Bar */}
              <div
                className={`relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02]`}
                style={{ width: `${widthPercent}%`, margin: '0 auto' }}
              >
                <div className={`p-3 bg-gradient-to-r ${stage.color}`}>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Icon size={18} />
                      <span className="font-medium text-sm">{stage.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{stage.count}</span>
                      <span className="text-xs opacity-80 ml-1">({formatCurrency(stage.value)})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Conversion Rate */}
      <div className={`p-4 rounded-lg mb-4 ${
        isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Overall Conversion Rate
            </p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {metrics.overallConversionRate}%
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
            conversionChange >= 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {conversionChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {conversionChange >= 0 ? '+' : ''}{conversionChange.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Quote</p>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(metrics.avgQuoteValue)}
          </p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Deal</p>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(metrics.avgDealSize)}
          </p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Days to Close</p>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {metrics.avgDaysToConvert}
          </p>
        </div>
      </div>

      {/* Loss Reasons (Collapsible) */}
      <button
        onClick={() => setShowReasons(!showReasons)}
        className={`w-full p-2 rounded-lg text-sm font-medium transition-colors ${
          isDarkMode
            ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
            : 'bg-red-50 text-red-600 hover:bg-red-100'
        }`}
      >
        {showReasons ? 'Hide' : 'Show'} Lost Deal Reasons
      </button>

      {showReasons && topReasons && (
        <div className={`mt-3 p-3 rounded-lg ${
          isDarkMode ? 'bg-red-900/10 border border-red-800/20' : 'bg-red-50 border border-red-100'
        }`}>
          <div className="space-y-2">
            {topReasons.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {item.reason}
                    </span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {item.count} ({item.percent}%)
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(funnelData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          View Pipeline Details
        </button>
      )}
    </div>
  );
};

export default ConversionFunnelWidget;
