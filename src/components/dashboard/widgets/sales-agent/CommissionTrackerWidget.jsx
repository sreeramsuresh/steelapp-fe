/**
 * CommissionTrackerWidget.jsx
 *
 * Commission Breakdown and Tracker
 * Displays base commission, tier bonuses, and progress toward earning tiers
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  Wallet,
  TrendingUp,
  Gift,
  Target,
  Award,
  Info,
  RefreshCw,
  ChevronRight,
  Zap,
  CheckCircle,
  Circle
} from 'lucide-react';

// Mock commission data for agents
const MOCK_COMMISSION_DATA = {
  agentId: 1,
  agentName: 'Rajesh Kumar',
  period: 'December 2024',
  summary: {
    baseCommission: 38250,
    tier1Bonus: 15000,
    tier2Bonus: 0,
    specialBonus: 8000,
    totalEarned: 61250,
    projectedTotal: 75000,
    paidAmount: 45000,
    pendingAmount: 16250,
  },
  tiers: [
    {
      name: 'Base Commission',
      description: '1% of total sales',
      current: 3825000,
      target: null,
      earned: 38250,
      percent: 100,
      achieved: true,
    },
    {
      name: 'Tier 1 Bonus',
      description: 'Achieve 80% of target',
      current: 3825000,
      target: 3600000,
      earned: 15000,
      percent: 106,
      achieved: true,
    },
    {
      name: 'Tier 2 Bonus',
      description: 'Achieve 100% of target',
      current: 3825000,
      target: 4500000,
      earned: 0,
      percent: 85,
      achieved: false,
    },
    {
      name: 'Tier 3 Bonus',
      description: 'Achieve 110% of target',
      current: 3825000,
      target: 4950000,
      earned: 0,
      percent: 77,
      achieved: false,
    },
  ],
  specialBonuses: [
    { name: 'New Customer Acquisition', count: 8, rate: 1000, total: 8000 },
    { name: 'Large Deal Bonus (>50L)', count: 0, rate: 5000, total: 0 },
  ],
  history: [
    { month: 'Nov 2024', earned: 52000, paid: true },
    { month: 'Oct 2024', earned: 48500, paid: true },
    { month: 'Sep 2024', earned: 55200, paid: true },
  ],
};

const AGENTS_LIST = [
  { id: 1, name: 'Rajesh Kumar' },
  { id: 2, name: 'Priya Sharma' },
  { id: 3, name: 'Amit Patel' },
  { id: 4, name: 'Deepak Singh' },
  { id: 5, name: 'Neha Gupta' },
];

const CommissionTrackerWidget = ({
  data: propData,
  onRefresh,
  onViewDetails,
  isLoading = false
}) => {
  const { isDarkMode } = useTheme();
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [commissionData, setCommissionData] = useState(propData || MOCK_COMMISSION_DATA);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (propData) {
      setCommissionData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh(selectedAgentId);
        setCommissionData(freshData || MOCK_COMMISSION_DATA);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const formatCompact = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}M`;
    }
    if (safeAmount >= 1000) {
      return `${(safeAmount / 1000).toFixed(0)}K`;
    }
    return safeAmount.toString();
  };

  const getProgressColor = (percent, achieved) => {
    if (achieved) return 'bg-green-500';
    if (percent >= 80) return 'bg-teal-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (!commissionData) {
    return (
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-green-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Commission Tracker
          </h3>
        </div>
        <div className="text-center py-8">
          <Wallet size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No commission data available
          </p>
        </div>
      </div>
    );
  }

  const { summary, tiers, specialBonuses } = commissionData;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode
        ? 'bg-[#1E2328] border-[#37474F] hover:border-green-600'
        : 'bg-white border-[#E0E0E0] hover:border-green-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Commission Tracker
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Track commission earnings and bonuses
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {commissionData.period}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(parseInt(e.target.value))}
            className={`text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg border-2 ${
          isDarkMode
            ? 'bg-green-900/20 border-green-700'
            : 'bg-green-50 border-green-200'
        }`}>
          <p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            Total Earned
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {formatCurrency(summary.totalEarned)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Projected
          </p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(summary.projectedTotal)}
          </p>
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="space-y-3 mb-4">
        {tiers.map((tier, index) => (
          <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {tier.achieved ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <Circle size={16} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                )}
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {tier.name}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {tier.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${
                  tier.achieved ? 'text-green-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatCurrency(tier.earned)}
                </p>
                {tier.target && (
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {tier.percent}%
                  </p>
                )}
              </div>
            </div>
            {tier.target && (
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full ${getProgressColor(tier.percent, tier.achieved)} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(tier.percent, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Special Bonuses */}
      {specialBonuses && specialBonuses.length > 0 && (
        <div className={`p-3 rounded-lg mb-4 ${
          isDarkMode ? 'bg-purple-900/20 border border-purple-700/30' : 'bg-purple-50 border border-purple-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-purple-500" />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>
              Special Bonuses
            </span>
          </div>
          <div className="space-y-1">
            {specialBonuses.map((bonus, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {bonus.name} ({bonus.count} x {formatCurrency(bonus.rate)})
                </span>
                <span className={`font-medium ${bonus.total > 0 ? 'text-purple-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {formatCurrency(bonus.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Status */}
      <div className={`pt-3 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Paid</span>
            <p className={`text-sm font-semibold text-green-500`}>
              {formatCurrency(summary.paidAmount)}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pending</span>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {formatCurrency(summary.pendingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(commissionData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          View Full Breakdown
        </button>
      )}
    </div>
  );
};

export default CommissionTrackerWidget;
