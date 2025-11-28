/**
 * CollectionPerformanceWidget.jsx
 *
 * Sales Agent Collection Performance Tracker
 * Displays collection rate, DSO, overdue amounts, and aging breakdown
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  Receipt,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  DollarSign
} from 'lucide-react';

// Mock collection data for agents
const MOCK_COLLECTION_DATA = {
  agentId: 1,
  agentName: 'Rajesh Kumar',
  period: 'December 2024',
  summary: {
    collectionRate: 87.5,
    previousCollectionRate: 82.3,
    dso: 28,
    previousDso: 32,
    totalOutstanding: 1250000,
    overdueAmount: 312500,
    collectedThisMonth: 3150000,
  },
  agingBuckets: [
    { label: '0-30 Days', amount: 625000, percent: 50, count: 15, status: 'green' },
    { label: '31-60 Days', amount: 312500, percent: 25, count: 8, status: 'yellow' },
    { label: '61-90 Days', amount: 187500, percent: 15, count: 5, status: 'orange' },
    { label: '90+ Days', amount: 125000, percent: 10, count: 3, status: 'red' },
  ],
  topOverdue: [
    { customer: 'Gulf Trading Co', amount: 85000, days: 95 },
    { customer: 'Al Rashid Steel', amount: 65000, days: 72 },
    { customer: 'Emirates Fab LLC', amount: 42000, days: 45 },
  ],
  collectionTrend: [
    { month: 'Sep', rate: 78 },
    { month: 'Oct', rate: 82 },
    { month: 'Nov', rate: 85 },
    { month: 'Dec', rate: 87.5 },
  ],
};

const AGENTS_LIST = [
  { id: 1, name: 'Rajesh Kumar' },
  { id: 2, name: 'Priya Sharma' },
  { id: 3, name: 'Amit Patel' },
  { id: 4, name: 'Deepak Singh' },
  { id: 5, name: 'Neha Gupta' },
];

const CollectionPerformanceWidget = ({
  data: propData,
  onRefresh,
  onViewDetails,
  isLoading = false
}) => {
  const { isDarkMode } = useTheme();
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [collectionData, setCollectionData] = useState(propData || MOCK_COLLECTION_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propData) {
      setCollectionData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh(selectedAgentId);
        setCollectionData(freshData || MOCK_COLLECTION_DATA);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' };
      case 'yellow': return { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-600' };
      case 'orange': return { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' };
      case 'red': return { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' };
      default: return { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const getCollectionRateIndicator = (rate) => {
    if (rate >= 90) return { color: 'text-green-500', bg: 'bg-green-500', label: 'Excellent' };
    if (rate >= 80) return { color: 'text-teal-500', bg: 'bg-teal-500', label: 'Good' };
    if (rate >= 70) return { color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Fair' };
    return { color: 'text-red-500', bg: 'bg-red-500', label: 'Poor' };
  };

  if (!collectionData) {
    return (
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Receipt size={20} className="text-teal-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Collection Performance
          </h3>
        </div>
        <div className="text-center py-8">
          <Receipt size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No collection data available
          </p>
        </div>
      </div>
    );
  }

  const { summary, agingBuckets, topOverdue } = collectionData;
  const rateChange = summary.collectionRate - summary.previousCollectionRate;
  const dsoChange = summary.dso - summary.previousDso;
  const rateIndicator = getCollectionRateIndicator(summary.collectionRate);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode
        ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-600'
        : 'bg-white border-[#E0E0E0] hover:border-teal-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Collection Performance
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Payment collection metrics per agent
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {collectionData.period}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(parseInt(e.target.value))}
            className={`text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? 'bg-[#2E3B4E] border-[#37474F] text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            {AGENTS_LIST.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
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
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Collection Rate */}
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Collection Rate
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded ${rateIndicator.bg} text-white`}>
              {rateIndicator.label}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-2xl font-bold ${rateIndicator.color}`}>
              {summary.collectionRate}%
            </p>
            <div className={`flex items-center gap-1 text-xs ${
              rateChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {rateChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {rateChange >= 0 ? '+' : ''}{rateChange.toFixed(1)}%
            </div>
          </div>
          {/* Mini Progress */}
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div
              className={`h-full ${rateIndicator.bg} rounded-full transition-all duration-500`}
              style={{ width: `${summary.collectionRate}%` }}
            />
          </div>
        </div>

        {/* DSO */}
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              DSO (Days)
            </p>
            <Clock size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-2xl font-bold ${
              summary.dso <= 30 ? 'text-green-500' :
              summary.dso <= 45 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {summary.dso}
            </p>
            <div className={`flex items-center gap-1 text-xs ${
              dsoChange <= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {dsoChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {dsoChange >= 0 ? '+' : ''}{dsoChange} days
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className={`p-3 rounded-lg mb-4 flex justify-between ${
        isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'
      }`}>
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Outstanding
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(summary.totalOutstanding)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Overdue
          </p>
          <p className="text-lg font-bold text-red-500">
            {formatCurrency(summary.overdueAmount)}
          </p>
        </div>
      </div>

      {/* Aging Breakdown */}
      <div className="mb-4">
        <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Aging Breakdown
        </p>
        <div className="space-y-2">
          {agingBuckets.map((bucket, idx) => {
            const statusColor = getStatusColor(bucket.status);
            return (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor.bg}`} />
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      {bucket.label}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {bucket.count}
                    </span>
                  </div>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(bucket.amount)}
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full ${statusColor.bg} rounded-full transition-all duration-500`}
                    style={{ width: `${bucket.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Overdue Alert */}
      {topOverdue && topOverdue.length > 0 && (
        <div className={`p-3 rounded-lg ${
          isDarkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-red-500" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
              Critical Overdue
            </span>
          </div>
          <div className="space-y-1">
            {topOverdue.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {item.customer}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-medium">
                    {item.days}d
                  </span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(collectionData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-teal-600 hover:bg-teal-500 text-white'
              : 'bg-teal-500 hover:bg-teal-600 text-white'
          }`}
        >
          View Collection Details
        </button>
      )}
    </div>
  );
};

export default CollectionPerformanceWidget;
