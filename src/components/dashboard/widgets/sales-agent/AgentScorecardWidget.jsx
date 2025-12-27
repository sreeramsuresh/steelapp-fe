/**
 * AgentScorecardWidget.jsx
 *
 * Individual Sales Agent Performance Scorecard
 * Displays revenue vs target, achievement percentage, growth, and team rank
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  RefreshCw,
  User,
} from 'lucide-react';

// Mock data for sales agents
const MOCK_AGENTS = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    avatar: 'RK',
    target: 4500000,
    achieved: 3825000,
    lastPeriodAchieved: 3200000,
    rank: 1,
    totalAgents: 5,
    deals: 45,
    newCustomers: 8,
  },
  {
    id: 2,
    name: 'Priya Sharma',
    avatar: 'PS',
    target: 4000000,
    achieved: 3680000,
    lastPeriodAchieved: 3500000,
    rank: 2,
    totalAgents: 5,
    deals: 38,
    newCustomers: 5,
  },
  {
    id: 3,
    name: 'Amit Patel',
    avatar: 'AP',
    target: 3500000,
    achieved: 2975000,
    lastPeriodAchieved: 2800000,
    rank: 3,
    totalAgents: 5,
    deals: 32,
    newCustomers: 4,
  },
  {
    id: 4,
    name: 'Deepak Singh',
    avatar: 'DS',
    target: 3500000,
    achieved: 2625000,
    lastPeriodAchieved: 2900000,
    rank: 4,
    totalAgents: 5,
    deals: 28,
    newCustomers: 3,
  },
  {
    id: 5,
    name: 'Neha Gupta',
    avatar: 'NG',
    target: 3000000,
    achieved: 2400000,
    lastPeriodAchieved: 2100000,
    rank: 5,
    totalAgents: 5,
    deals: 25,
    newCustomers: 6,
  },
];

const PERIODS = [
  { value: 'mtd', label: 'Month to Date' },
  { value: 'qtd', label: 'Quarter to Date' },
  { value: 'ytd', label: 'Year to Date' },
];

const AgentScorecardWidget = ({
  data: propData,
  onRefresh,
  onViewDetails,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState('mtd');
  const [agents, setAgents] = useState(propData || MOCK_AGENTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propData) {
      setAgents(propData);
    }
  }, [propData]);

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) || agents[0];

  const achievementPercent = selectedAgent
    ? ((selectedAgent.achieved / selectedAgent.target) * 100).toFixed(1)
    : 0;

  const growthPercent =
    selectedAgent && selectedAgent.lastPeriodAchieved
      ? (
        ((selectedAgent.achieved - selectedAgent.lastPeriodAchieved) /
            selectedAgent.lastPeriodAchieved) *
          100
      ).toFixed(1)
      : 0;

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setAgents(freshData || MOCK_AGENTS);
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

  const getRankBadge = (rank) => {
    if (rank === 1)
      return {
        icon: '1st',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-500',
      };
    if (rank === 2)
      return { icon: '2nd', color: 'bg-gray-400', textColor: 'text-gray-400' };
    if (rank === 3)
      return {
        icon: '3rd',
        color: 'bg-amber-600',
        textColor: 'text-amber-600',
      };
    return {
      icon: `${rank}th`,
      color: 'bg-gray-500',
      textColor: 'text-gray-500',
    };
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 80) return 'bg-teal-500';
    if (percent >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!selectedAgent) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode
            ? 'bg-[#1E2328] border-[#37474F]'
            : 'bg-white border-[#E0E0E0]'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} className="text-teal-500" />
          <h3
            className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            Agent Scorecard
          </h3>
        </div>
        <div className="text-center py-8">
          <User
            size={48}
            className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          />
          <p
            className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            No agent data available
          </p>
        </div>
      </div>
    );
  }

  const rankBadge = getRankBadge(selectedAgent.rank);

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-600'
          : 'bg-white border-[#E0E0E0] hover:border-teal-500'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Agent Scorecard
              <span className="relative group">
                <Info
                  size={14}
                  className="cursor-help opacity-50 hover:opacity-100"
                />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                  }`}
                >
                  Individual sales performance metrics
                </span>
              </span>
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Performance Overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || isLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-[#2E3B4E] text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } ${loading || isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedAgentId}
          onChange={(e) => setSelectedAgentId(parseInt(e.target.value))}
          className={`flex-1 text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            isDarkMode
              ? 'bg-[#2E3B4E] border-[#37474F] text-white'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className={`text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            isDarkMode
              ? 'bg-[#2E3B4E] border-[#37474F] text-white'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          {PERIODS.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>

      {/* Agent Card */}
      <div
        className={`p-4 rounded-lg mb-4 ${
          isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              selectedAgent.rank === 1
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                : selectedAgent.rank === 2
                  ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                  : selectedAgent.rank === 3
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                    : 'bg-gradient-to-br from-teal-500 to-teal-600'
            }`}
          >
            {selectedAgent.avatar}
          </div>
          <div className="flex-1">
            <p
              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {selectedAgent.name}
            </p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${rankBadge.color} text-white`}
              >
                Rank #{selectedAgent.rank}
              </span>
              <span
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                of {selectedAgent.totalAgents}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-2xl font-bold ${
                parseFloat(achievementPercent) >= 100
                  ? 'text-green-500'
                  : parseFloat(achievementPercent) >= 80
                    ? 'text-teal-500'
                    : parseFloat(achievementPercent) >= 60
                      ? 'text-yellow-500'
                      : 'text-red-500'
              }`}
            >
              {achievementPercent}%
            </p>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              of target
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              {formatCurrency(selectedAgent.achieved)}
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Target: {formatCurrency(selectedAgent.target)}
            </span>
          </div>
          <div
            className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
          >
            <div
              className={`h-full ${getProgressColor(parseFloat(achievementPercent))} rounded-full transition-all duration-500`}
              style={{
                width: `${Math.min(parseFloat(achievementPercent), 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Growth Indicator */}
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            vs Last Period
          </span>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              parseFloat(growthPercent) >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {parseFloat(growthPercent) >= 0 ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {Math.abs(parseFloat(growthPercent))}%
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}
        >
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Deals Closed
          </p>
          <p
            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {selectedAgent.deals}
          </p>
        </div>
        <div
          className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}
        >
          <p
            className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            New Customers
          </p>
          <p
            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {selectedAgent.newCustomers}
          </p>
        </div>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(selectedAgent)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-teal-600 hover:bg-teal-500 text-white'
              : 'bg-teal-500 hover:bg-teal-600 text-white'
          }`}
        >
          View Full Performance
        </button>
      )}
    </div>
  );
};

export default AgentScorecardWidget;
