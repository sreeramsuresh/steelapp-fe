/**
 * CustomerCLVWidget.jsx
 *
 * Customer Lifetime Value (CLV) Analysis Widget
 * Displays top customers by CLV, segments, and trends
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  TrendingUp,
  TrendingDown,
  Crown,
  Users,
  DollarSign,
  Info,
  RefreshCw,
  ChevronRight,
  Star,
} from 'lucide-react';

// Mock CLV data
const MOCK_CLV_DATA = {
  summary: {
    averageCLV: 2850000,
    previousAverageCLV: 2650000,
    totalCustomers: 156,
    highValueCount: 28,
    mediumValueCount: 65,
    lowValueCount: 63,
  },
  topCustomers: [
    {
      id: 1,
      name: 'Al Rashid Steel Works',
      clv: 12500000,
      lifetimeMonths: 36,
      avgOrderValue: 285000,
      ordersCount: 48,
      trend: 'up',
    },
    {
      id: 2,
      name: 'Emirates Fabrication LLC',
      clv: 9800000,
      lifetimeMonths: 28,
      avgOrderValue: 245000,
      ordersCount: 42,
      trend: 'up',
    },
    {
      id: 3,
      name: 'Gulf Trading Company',
      clv: 8500000,
      lifetimeMonths: 42,
      avgOrderValue: 195000,
      ordersCount: 52,
      trend: 'stable',
    },
    {
      id: 4,
      name: 'Dubai Steel Industries',
      clv: 7200000,
      lifetimeMonths: 24,
      avgOrderValue: 320000,
      ordersCount: 28,
      trend: 'up',
    },
    {
      id: 5,
      name: 'Sharjah Metal Works',
      clv: 6100000,
      lifetimeMonths: 30,
      avgOrderValue: 175000,
      ordersCount: 38,
      trend: 'down',
    },
  ],
  segments: [
    { name: 'High Value', count: 28, totalCLV: 185000000, avgCLV: 6607142, percent: 18, color: '#22C55E' },
    { name: 'Medium Value', count: 65, totalCLV: 142000000, avgCLV: 2184615, percent: 42, color: '#F59E0B' },
    { name: 'Low Value', count: 63, totalCLV: 58000000, avgCLV: 920634, percent: 40, color: '#EF4444' },
  ],
  trendData: [
    { month: 'Sep', avgCLV: 2450000 },
    { month: 'Oct', avgCLV: 2550000 },
    { month: 'Nov', avgCLV: 2650000 },
    { month: 'Dec', avgCLV: 2850000 },
  ],
};

const CustomerCLVWidget = ({
  data: propData,
  onRefresh,
  onViewCustomer,
  onViewDetails,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [clvData, setClvData] = useState(propData || MOCK_CLV_DATA);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('top'); // 'top' or 'segments'

  useEffect(() => {
    if (propData) {
      setClvData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setClvData(freshData || MOCK_CLV_DATA);
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

  const getTrendIcon = (trend) => {
    if (trend === 'up') return { Icon: TrendingUp, color: 'text-green-500' };
    if (trend === 'down') return { Icon: TrendingDown, color: 'text-red-500' };
    return { Icon: null, color: 'text-gray-500' };
  };

  const getCLVTier = (clv) => {
    if (clv >= 5000000) return { tier: 'Platinum', color: 'from-purple-400 to-purple-600' };
    if (clv >= 2000000) return { tier: 'Gold', color: 'from-yellow-400 to-yellow-600' };
    if (clv >= 500000) return { tier: 'Silver', color: 'from-gray-300 to-gray-500' };
    return { tier: 'Bronze', color: 'from-amber-600 to-amber-800' };
  };

  if (!clvData) {
    return (
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Crown size={20} className="text-yellow-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Customer CLV
          </h3>
        </div>
        <div className="text-center py-8">
          <Crown size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No CLV data available
          </p>
        </div>
      </div>
    );
  }

  const { summary, topCustomers, segments } = clvData;
  const clvChange = ((summary.averageCLV - summary.previousAverageCLV) / summary.previousAverageCLV * 100).toFixed(1);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode
        ? 'bg-[#1E2328] border-[#37474F] hover:border-yellow-600'
        : 'bg-white border-[#E0E0E0] hover:border-yellow-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <Crown size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Customer CLV
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Customer Lifetime Value analysis
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Lifetime Value Analysis
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

      {/* Average CLV Summary */}
      <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Average Customer CLV
            </p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(summary.averageCLV)}
            </p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
            parseFloat(clvChange) >= 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {parseFloat(clvChange) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {parseFloat(clvChange) >= 0 ? '+' : ''}{clvChange}%
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('top')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'top'
              ? 'bg-yellow-500 text-white'
              : isDarkMode
                ? 'bg-[#2E3B4E] text-gray-300 hover:bg-[#374151]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Top Customers
        </button>
        <button
          onClick={() => setViewMode('segments')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'segments'
              ? 'bg-yellow-500 text-white'
              : isDarkMode
                ? 'bg-[#2E3B4E] text-gray-300 hover:bg-[#374151]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Segments
        </button>
      </div>

      {/* Top Customers View */}
      {viewMode === 'top' && (
        <div className="space-y-2">
          {topCustomers.slice(0, 5).map((customer, index) => {
            const trendInfo = getTrendIcon(customer.trend);
            const tierInfo = getCLVTier(customer.clv);

            return (
              <div
                key={customer.id}
                onClick={() => onViewCustomer && onViewCustomer(customer)}
                className={`group p-3 rounded-lg transition-all duration-200 ${
                  onViewCustomer ? 'cursor-pointer' : ''
                } ${
                  index === 0
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-700/30'
                      : 'bg-gradient-to-r from-yellow-50 to-transparent border border-yellow-200'
                    : isDarkMode
                      ? 'bg-[#2E3B4E] hover:bg-[#374151]'
                      : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tierInfo.color} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {customer.name}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {customer.lifetimeMonths} months | {customer.ordersCount} orders
                    </p>
                  </div>

                  {/* CLV & Trend */}
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(customer.clv)}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Avg: {formatCurrency(customer.avgOrderValue)}
                      </p>
                    </div>
                    {trendInfo.Icon && (
                      <trendInfo.Icon size={16} className={trendInfo.color} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Segments View */}
      {viewMode === 'segments' && (
        <div className="space-y-3">
          {segments.map((segment, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {segment.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {segment.count} customers
                  </span>
                </div>
                <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(segment.totalCLV)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Avg CLV: {formatCurrency(segment.avgCLV)}
                </span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {segment.percent}% of customers
                </span>
              </div>
              <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(clvData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
          }`}
        >
          View Full CLV Report
        </button>
      )}
    </div>
  );
};

export default CustomerCLVWidget;
