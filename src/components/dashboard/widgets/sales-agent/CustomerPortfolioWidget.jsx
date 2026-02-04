/**
 * CustomerPortfolioWidget.jsx
 *
 * Agent's Customer Portfolio Distribution
 * Shows customer concentration, diversification score, and segment breakdown
 */

import { AlertTriangle, CheckCircle, Info, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

// Mock portfolio data
const MOCK_PORTFOLIO_DATA = {
  agentId: 1,
  agentName: "Rajesh Kumar",
  summary: {
    totalCustomers: 48,
    activeCustomers: 35,
    inactiveCustomers: 13,
    top3Concentration: 42,
    diversificationScore: 68,
    riskLevel: "Medium",
  },
  topCustomers: [
    { id: 1, name: "Al Rashid Steel Works", revenue: 1250000, percent: 18 },
    { id: 2, name: "Emirates Fabrication LLC", revenue: 950000, percent: 14 },
    { id: 3, name: "Gulf Trading Co", revenue: 680000, percent: 10 },
  ],
  segments: [
    {
      name: "Fabricators",
      count: 18,
      revenue: 2800000,
      percent: 40,
      color: "#14B8A6",
    },
    {
      name: "Traders",
      count: 12,
      revenue: 1750000,
      percent: 25,
      color: "#3B82F6",
    },
    { name: "OEMs", count: 8, revenue: 1400000, percent: 20, color: "#F59E0B" },
    {
      name: "Projects",
      count: 10,
      revenue: 1050000,
      percent: 15,
      color: "#8B5CF6",
    },
  ],
  trendData: {
    newThisMonth: 3,
    churnedThisMonth: 1,
    reactivated: 2,
  },
};

const AGENTS_LIST = [
  { id: 1, name: "Rajesh Kumar" },
  { id: 2, name: "Priya Sharma" },
  { id: 3, name: "Amit Patel" },
  { id: 4, name: "Deepak Singh" },
  { id: 5, name: "Neha Gupta" },
];

const CustomerPortfolioWidget = ({ data: propData, onRefresh, onViewDetails, isLoading = false }) => {
  const { isDarkMode } = useTheme();
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [portfolioData, setPortfolioData] = useState(propData || MOCK_PORTFOLIO_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propData) {
      setPortfolioData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh(selectedAgentId);
        setPortfolioData(freshData || MOCK_PORTFOLIO_DATA);
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

  const getRiskColor = (level) => {
    switch (level.toLowerCase()) {
      case "low":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-200",
        };
      case "medium":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-200",
        };
      case "high":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const getDiversificationColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  if (!portfolioData) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-blue-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Customer Portfolio</h3>
        </div>
        <div className="text-center py-8">
          <Users size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No portfolio data available</p>
        </div>
      </div>
    );
  }

  const { summary, topCustomers, segments, trendData } = portfolioData;
  const riskStyle = getRiskColor(summary.riskLevel);

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? "bg-[#1E2328] border-[#37474F] hover:border-blue-600"
          : "bg-white border-[#E0E0E0] hover:border-blue-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Customer Portfolio
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  Customer distribution and risk analysis
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Portfolio Overview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(parseInt(e.target.value, 10))}
            className={`text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode ? "bg-[#2E3B4E] border-[#37474F] text-white" : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            {AGENTS_LIST.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total</p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{summary.totalCustomers}</p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-green-900/20" : "bg-green-50"}`}>
          <p className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>Active</p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
            {summary.activeCustomers}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Inactive</p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {summary.inactiveCustomers}
          </p>
        </div>
      </div>

      {/* Risk & Diversification */}
      <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Top 3 Concentration</p>
            <p
              className={`text-lg font-bold ${
                summary.top3Concentration > 50
                  ? "text-red-500"
                  : summary.top3Concentration > 30
                    ? "text-yellow-500"
                    : "text-green-500"
              }`}
            >
              {summary.top3Concentration}%
            </p>
          </div>
          <div className="text-center">
            <p className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Diversification</p>
            <p className={`text-lg font-bold ${getDiversificationColor(summary.diversificationScore)}`}>
              {summary.diversificationScore}/100
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Risk Level</p>
            <span className={`px-2 py-1 rounded text-xs font-medium ${riskStyle.bg} ${riskStyle.text}`}>
              {summary.riskLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="mb-4">
        <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Top Customers</p>
        <div className="space-y-2">
          {topCustomers.slice(0, 3).map((customer, idx) => (
            <div key={customer.id} className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                  idx === 0
                    ? "bg-yellow-500 text-white"
                    : idx === 1
                      ? "bg-gray-400 text-white"
                      : "bg-amber-600 text-white"
                }`}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>{customer.name}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(customer.revenue)}
                </p>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{customer.percent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Segment Breakdown */}
      <div className="mb-4">
        <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Customer Segments
        </p>
        {/* Mini Pie Visualization */}
        <div className="flex items-center gap-3 mb-2">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              {
                segments.reduce(
                  (acc, segment, idx) => {
                    const startAngle = acc.angle;
                    const sweepAngle = (segment.percent / 100) * 360;
                    const endAngle = startAngle + sweepAngle;

                    const largeArc = sweepAngle > 180 ? 1 : 0;
                    const startX = 32 + 24 * Math.cos((startAngle * Math.PI) / 180);
                    const startY = 32 + 24 * Math.sin((startAngle * Math.PI) / 180);
                    const endX = 32 + 24 * Math.cos((endAngle * Math.PI) / 180);
                    const endY = 32 + 24 * Math.sin((endAngle * Math.PI) / 180);

                    acc.paths.push(
                      <path
                        key={idx}
                        d={`M 32 32 L ${startX} ${startY} A 24 24 0 ${largeArc} 1 ${endX} ${endY} Z`}
                        fill={segment.color}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                    acc.angle = endAngle;
                    return acc;
                  },
                  { paths: [], angle: 0 }
                ).paths
              }
            </svg>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-1">
            {segments.map((segment, idx) => (
              <div key={segment.id || segment.name || `segment-${idx}`} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {segment.name} ({segment.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className={`pt-3 border-t flex justify-between ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-green-500" />
          <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            +{trendData.newThisMonth} new
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle size={14} className="text-blue-500" />
          <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {trendData.reactivated} reactivated
          </span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle size={14} className="text-red-500" />
          <span className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {trendData.churnedThisMonth} churned
          </span>
        </div>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          type="button"
          onClick={() => onViewDetails(portfolioData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          View All Customers
        </button>
      )}
    </div>
  );
};

export default CustomerPortfolioWidget;
