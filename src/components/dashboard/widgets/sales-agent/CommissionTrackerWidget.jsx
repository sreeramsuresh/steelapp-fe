/**
 * CommissionTrackerWidget.jsx
 *
 * Commission Breakdown and Tracker
 * Displays base commission, tier bonuses, and progress toward earning tiers
 * Updated: Connected to real API - removed mock data
 */

import { AlertCircle, CheckCircle, Circle, Gift, Info, RefreshCw, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";
import { commissionService } from "../../../../services/commissionService";

// Default empty state when no data is available
const EMPTY_COMMISSION_DATA = {
  agentId: null,
  period: new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }),
  summary: {
    baseCommission: 0,
    tier1Bonus: 0,
    tier2Bonus: 0,
    specialBonus: 0,
    totalEarned: 0,
    projectedTotal: 0,
    paidAmount: 0,
    pendingAmount: 0,
  },
  tiers: [],
  specialBonuses: [],
};

const CommissionTrackerWidget = ({
  data: propData,
  salesPersonId: propSalesPersonId,
  onRefresh,
  onViewDetails,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(propSalesPersonId || null);
  const [commissionData, setCommissionData] = useState(propData || EMPTY_COMMISSION_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_showHistory, _setShowHistory] = useState(false);

  // Fetch agents list on mount
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await commissionService.getAgents(1, 50, true);
        const agentsList = response?.agents || [];
        setAgents(
          agentsList.map((a) => ({
            id: a.user_id || a.userId,
            name: a.user_name || a.userName || "Unknown",
          }))
        );
        // Set first agent as selected if none provided
        if (!propSalesPersonId && agentsList.length > 0) {
          setSelectedAgentId(agentsList[0].user_id || agentsList[0].userId);
        }
      } catch (err) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents");
      }
    };
    fetchAgents();
  }, [propSalesPersonId]);

  // Fetch commission data when agent changes
  const fetchCommissionData = useCallback(async (agentId) => {
    if (!agentId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await commissionService.getCommissionTrackerData(agentId);
      setCommissionData(data);
    } catch (err) {
      console.error("Error fetching commission data:", err);
      setError("Failed to load commission data");
      setCommissionData(EMPTY_COMMISSION_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propData) {
      setCommissionData(propData);
    } else if (selectedAgentId) {
      fetchCommissionData(selectedAgentId);
    }
  }, [propData, selectedAgentId, fetchCommissionData]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(true);
      try {
        const freshData = await onRefresh(selectedAgentId);
        setCommissionData(freshData || EMPTY_COMMISSION_DATA);
      } finally {
        setLoading(false);
      }
    } else {
      fetchCommissionData(selectedAgentId);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = Number.isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const _formatCompact = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = Number.isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}M`;
    }
    if (safeAmount >= 1000) {
      return `${(safeAmount / 1000).toFixed(0)}K`;
    }
    return safeAmount.toString();
  };

  const getProgressColor = (percent, achieved) => {
    if (achieved) return "bg-green-500";
    if (percent >= 80) return "bg-teal-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-gray-400";
  };

  // Loading state
  if (loading && !commissionData?.summary?.totalEarned) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-green-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Commission Tracker</h3>
        </div>
        <div className="text-center py-8">
          <RefreshCw
            size={32}
            className={`mx-auto mb-4 animate-spin ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Loading commission data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-green-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Commission Tracker</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500 opacity-50" />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{error}</p>
          <button type="button" onClick={handleRefresh}
            className={`mt-4 px-4 py-2 rounded-lg text-sm ${
              isDarkMode ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!commissionData || !commissionData.summary) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-green-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Commission Tracker</h3>
        </div>
        <div className="text-center py-8">
          <Wallet size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No commission data available</p>
        </div>
      </div>
    );
  }

  const { summary, tiers, specialBonuses } = commissionData;

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? "bg-[#1E2328] border-[#37474F] hover:border-green-600"
          : "bg-white border-[#E0E0E0] hover:border-green-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Commission Tracker
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  Track commission earnings and bonuses
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{commissionData.period}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agents.length > 0 && (
            <select
              value={selectedAgentId || ""}
              onChange={(e) => setSelectedAgentId(parseInt(e.target.value, 10))}
              className={`text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                isDarkMode ? "bg-[#2E3B4E] border-[#37474F] text-white" : "bg-gray-50 border-gray-200 text-gray-700"
              }`}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={handleRefresh}
            disabled={loading || isLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-[#2E3B4E] text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            } ${loading || isLoading ? "animate-spin" : ""}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className={`p-3 rounded-lg border-2 ${
            isDarkMode ? "bg-green-900/20 border-green-700" : "bg-green-50 border-green-200"
          }`}
        >
          <p className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>Total Earned</p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
            {formatCurrency(summary.totalEarned)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Projected</p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatCurrency(summary.projectedTotal)}
          </p>
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="space-y-3 mb-4">
        {tiers.map((tier, index) => (
          <div
            key={tier.id || tier.name || `tier-${index}`}
            className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {tier.achieved ? (
                  <CheckCircle size={16} className="text-green-500" />
                ) : (
                  <Circle size={16} className={isDarkMode ? "text-gray-500" : "text-gray-400"} />
                )}
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{tier.name}</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{tier.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    tier.achieved ? "text-green-500" : isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {formatCurrency(tier.earned)}
                </p>
                {tier.target && (
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{tier.percent}%</p>
                )}
              </div>
            </div>
            {tier.target && (
              <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
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
        <div
          className={`p-3 rounded-lg mb-4 ${
            isDarkMode ? "bg-purple-900/20 border border-purple-700/30" : "bg-purple-50 border border-purple-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Gift size={14} className="text-purple-500" />
            <span className={`text-sm font-medium ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>
              Special Bonuses
            </span>
          </div>
          <div className="space-y-1">
            {specialBonuses.map((bonus, idx) => (
              <div key={bonus.id || bonus.name || `bonus-${idx}`} className="flex justify-between text-xs">
                <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  {bonus.name} ({bonus.count} x {formatCurrency(bonus.rate)})
                </span>
                <span
                  className={`font-medium ${bonus.total > 0 ? "text-purple-500" : isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  {formatCurrency(bonus.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Status */}
      <div className={`pt-3 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
        <div className="flex justify-between items-center">
          <div>
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Paid</span>
            <p className={`text-sm font-semibold text-green-500`}>{formatCurrency(summary.paidAmount)}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</span>
            <p className={`text-sm font-semibold ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
              {formatCurrency(summary.pendingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button type="button" onClick={() => onViewDetails(commissionData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          View Full Breakdown
        </button>
      )}
    </div>
  );
};

export default CommissionTrackerWidget;
