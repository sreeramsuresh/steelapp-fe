/**
 * LeaderboardWidget.jsx
 *
 * Gamified Sales Team Leaderboard
 * Displays ranked agents with medals, scores, badges, and performance trends
 */

import {
  Award,
  ChevronRight,
  Crown,
  Info,
  Minus,
  RefreshCw,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  {
    id: 1,
    name: "Rajesh Kumar",
    avatar: "RK",
    score: 945,
    revenue: 3825000,
    targetPercent: 85,
    trend: "up",
    trendValue: 12,
    badges: ["Top Performer", "Collection Star"],
    streak: 5,
    previousRank: 2,
  },
  {
    id: 2,
    name: "Priya Sharma",
    avatar: "PS",
    score: 892,
    revenue: 3680000,
    targetPercent: 92,
    trend: "up",
    trendValue: 5,
    badges: ["Rising Star"],
    streak: 3,
    previousRank: 1,
  },
  {
    id: 3,
    name: "Amit Patel",
    avatar: "AP",
    score: 756,
    revenue: 2975000,
    targetPercent: 85,
    trend: "stable",
    trendValue: 0,
    badges: ["Consistent"],
    streak: 0,
    previousRank: 3,
  },
  {
    id: 4,
    name: "Deepak Singh",
    avatar: "DS",
    score: 698,
    revenue: 2625000,
    targetPercent: 75,
    trend: "down",
    trendValue: -8,
    badges: [],
    streak: 0,
    previousRank: 4,
  },
  {
    id: 5,
    name: "Neha Gupta",
    avatar: "NG",
    score: 654,
    revenue: 2400000,
    targetPercent: 80,
    trend: "up",
    trendValue: 15,
    badges: ["Rising Star", "New Customer Hunter"],
    streak: 2,
    previousRank: 5,
  },
];

const BADGE_CONFIG = {
  "Top Performer": { color: "bg-yellow-500", icon: Crown },
  "Rising Star": { color: "bg-purple-500", icon: Star },
  "Collection Star": { color: "bg-green-500", icon: Target },
  Consistent: { color: "bg-blue-500", icon: Award },
  "New Customer Hunter": { color: "bg-teal-500", icon: Zap },
};

const LeaderboardWidget = ({ data: propData, onRefresh, onViewAgent, isLoading = false, compact = false }) => {
  const { isDarkMode } = useTheme();
  const [leaderboard, setLeaderboard] = useState(propData || MOCK_LEADERBOARD);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propData) {
      setLeaderboard(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setLeaderboard(freshData || MOCK_LEADERBOARD);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = Number.isNaN(numericAmount) ? 0 : numericAmount;
    if (safeAmount >= 1000000) {
      return `AED ${(safeAmount / 1000000).toFixed(2)}M`;
    } else if (safeAmount >= 1000) {
      return `AED ${(safeAmount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const getMedalIcon = (rank) => {
    if (rank === 1)
      return {
        icon: "1st",
        color: "from-yellow-400 to-yellow-600",
        shadow: "shadow-yellow-500/30",
      };
    if (rank === 2)
      return {
        icon: "2nd",
        color: "from-gray-300 to-gray-500",
        shadow: "shadow-gray-400/30",
      };
    if (rank === 3)
      return {
        icon: "3rd",
        color: "from-amber-500 to-amber-700",
        shadow: "shadow-amber-500/30",
      };
    return null;
  };

  const getTrendIcon = (trend, _value) => {
    if (trend === "up") return { Icon: TrendingUp, color: "text-green-500", bg: "bg-green-100" };
    if (trend === "down") return { Icon: TrendingDown, color: "text-red-500", bg: "bg-red-100" };
    return { Icon: Minus, color: "text-gray-500", bg: "bg-gray-100" };
  };

  const getRankChange = (currentRank, previousRank) => {
    const change = previousRank - currentRank;
    if (change > 0) return { value: `+${change}`, color: "text-green-500" };
    if (change < 0) return { value: change.toString(), color: "text-red-500" };
    return { value: "-", color: "text-gray-400" };
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-yellow-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Sales Leaderboard</h3>
        </div>
        <div className="text-center py-8">
          <Trophy size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No leaderboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? "bg-[#1E2328] border-[#37474F] hover:border-yellow-600"
          : "bg-white border-[#E0E0E0] hover:border-yellow-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <Trophy size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Sales Leaderboard
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  Team ranking by composite score
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>This Month</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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

      {/* Leaderboard Table */}
      <div className="space-y-2">
        {leaderboard.slice(0, compact ? 3 : 5).map((agent, index) => {
          const rank = index + 1;
          const medal = getMedalIcon(rank);
          const trendInfo = getTrendIcon(agent.trend, agent.trendValue);
          const rankChange = getRankChange(rank, agent.previousRank);

          return (
            <div
              key={agent.id}
              onClick={() => onViewAgent?.(agent)}
              className={`group p-3 rounded-lg transition-all duration-200 ${onViewAgent ? "cursor-pointer" : ""} ${
                rank === 1
                  ? isDarkMode
                    ? "bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-700/30"
                    : "bg-gradient-to-r from-yellow-50 to-transparent border border-yellow-200"
                  : isDarkMode
                    ? "bg-[#2E3B4E] hover:bg-[#374151]"
                    : "bg-gray-50 hover:bg-gray-100"
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={
                onViewAgent
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onViewAgent(agent);
                      }
                    }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-8 flex-shrink-0">
                  {medal ? (
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${medal.color} ${medal.shadow} shadow-lg flex items-center justify-center`}
                    >
                      <span className="text-xs font-bold text-white">{rank}</span>
                    </div>
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <span className={`text-sm font-bold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {rank}
                      </span>
                    </div>
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      rank === 1
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                        : rank === 2
                          ? "bg-gradient-to-br from-gray-400 to-gray-500"
                          : rank === 3
                            ? "bg-gradient-to-br from-amber-500 to-amber-700"
                            : "bg-gradient-to-br from-teal-500 to-teal-600"
                    }`}
                  >
                    {agent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {agent.name}
                    </p>
                    {/* Badges */}
                    {agent.badges && agent.badges.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {agent.badges.slice(0, 2).map((badge, idx) => {
                          const BadgeIcon = BADGE_CONFIG[badge]?.icon || Star;
                          return (
                            <span
                              key={badge.id || badge.name || `badge-${idx}`}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${
                                BADGE_CONFIG[badge]?.color || "bg-gray-500"
                              }`}
                              title={badge}
                            >
                              <BadgeIcon size={10} />
                              {!compact && badge.split(" ")[0]}
                            </span>
                          );
                        })}
                        {agent.badges.length > 2 && (
                          <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            +{agent.badges.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score & Stats */}
                <div className="flex items-center gap-3">
                  {!compact && (
                    <>
                      {/* Revenue */}
                      <div className="text-right hidden sm:block">
                        <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {formatCurrency(agent.revenue)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {agent.targetPercent}% target
                        </p>
                      </div>

                      {/* Trend */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded ${trendInfo.bg}`}>
                        <trendInfo.Icon size={14} className={trendInfo.color} />
                        {agent.trendValue !== 0 && (
                          <span className={`text-xs font-medium ${trendInfo.color}`}>
                            {agent.trendValue > 0 ? "+" : ""}
                            {agent.trendValue}%
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Score */}
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        rank === 1
                          ? "text-yellow-500"
                          : rank === 2
                            ? "text-gray-400"
                            : rank === 3
                              ? "text-amber-500"
                              : isDarkMode
                                ? "text-white"
                                : "text-gray-900"
                      }`}
                    >
                      {agent.score}
                    </p>
                    <p className={`text-[10px] ${rankChange.color}`}>{rankChange.value}</p>
                  </div>

                  {/* Arrow */}
                  {onViewAgent && (
                    <ChevronRight
                      size={16}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Streak indicator for top performer */}
              {rank === 1 && agent.streak > 0 && (
                <div className={`mt-2 pt-2 border-t ${isDarkMode ? "border-yellow-700/30" : "border-yellow-200"}`}>
                  <div className="flex items-center gap-1">
                    <Zap size={12} className="text-yellow-500" />
                    <span className={`text-xs ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                      {agent.streak} month winning streak!
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {!compact && leaderboard.length > 5 && (
        <button
          type="button"
          onClick={() => onViewAgent?.(null)}
          className={`mt-3 w-full py-2 text-sm font-medium rounded-lg transition-colors ${
            isDarkMode ? "text-teal-400 hover:bg-[#2E3B4E]" : "text-teal-600 hover:bg-gray-50"
          }`}
        >
          View Full Leaderboard
        </button>
      )}
    </div>
  );
};

export default LeaderboardWidget;
