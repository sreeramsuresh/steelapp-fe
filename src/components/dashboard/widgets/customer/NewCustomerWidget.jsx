/**
 * NewCustomerWidget.jsx
 *
 * New Customer Acquisition Metrics Widget
 * Displays acquisition count, sources, first order value, and retention
 */

import {
  Award,
  Building2,
  Handshake,
  Info,
  Megaphone,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

// Mock new customer data
const MOCK_NEW_CUSTOMER_DATA = {
  period: "December 2024",
  summary: {
    newCustomersCount: 12,
    previousPeriodCount: 9,
    target: 15,
    totalFirstOrderValue: 2850000,
    avgFirstOrderValue: 237500,
    conversionRate: 68,
    retentionRate: 85,
    previousRetentionRate: 82,
  },
  acquisitionSources: [
    {
      source: "Referral",
      count: 5,
      value: 1250000,
      percent: 42,
      icon: Handshake,
      color: "#22C55E",
    },
    {
      source: "Cold Outreach",
      count: 4,
      value: 980000,
      percent: 33,
      icon: Megaphone,
      color: "#3B82F6",
    },
    {
      source: "Exhibition",
      count: 2,
      value: 450000,
      percent: 17,
      icon: Building2,
      color: "#F59E0B",
    },
    {
      source: "Website",
      count: 1,
      value: 170000,
      percent: 8,
      icon: Target,
      color: "#8B5CF6",
    },
  ],
  recentCustomers: [
    {
      id: 1,
      name: "Metro Steel Industries",
      joinDate: "2024-12-15",
      firstOrderValue: 385000,
      source: "Referral",
      assignedAgent: "Rajesh Kumar",
      status: "active",
    },
    {
      id: 2,
      name: "Coastal Metal Works",
      joinDate: "2024-12-12",
      firstOrderValue: 295000,
      source: "Cold Outreach",
      assignedAgent: "Priya Sharma",
      status: "active",
    },
    {
      id: 3,
      name: "Industrial Steel LLC",
      joinDate: "2024-12-08",
      firstOrderValue: 425000,
      source: "Exhibition",
      assignedAgent: "Amit Patel",
      status: "active",
    },
    {
      id: 4,
      name: "Premier Fabrication",
      joinDate: "2024-12-05",
      firstOrderValue: 180000,
      source: "Referral",
      assignedAgent: "Rajesh Kumar",
      status: "pending",
    },
  ],
  monthlyTrend: [
    { month: "Sep", count: 8, value: 1850000 },
    { month: "Oct", count: 10, value: 2200000 },
    { month: "Nov", count: 9, value: 2100000 },
    { month: "Dec", count: 12, value: 2850000 },
  ],
};

const NewCustomerWidget = ({ data: propData, onRefresh, onViewCustomer, onViewDetails, isLoading = false }) => {
  const { isDarkMode } = useTheme();
  const [customerData, setCustomerData] = useState(propData || MOCK_NEW_CUSTOMER_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propData) {
      setCustomerData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setCustomerData(freshData || MOCK_NEW_CUSTOMER_DATA);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AE", {
      day: "numeric",
      month: "short",
    });
  };

  // Map source names to icons and colors (handles both mock data with icon/color references and real data without)
  const SOURCE_CONFIG_MAP = {
    Referral: { icon: Handshake, color: "#22C55E" },
    "Cold Outreach": { icon: Megaphone, color: "#3B82F6" },
    Exhibition: { icon: Building2, color: "#F59E0B" },
    Website: { icon: Target, color: "#8B5CF6" },
  };

  const getSourceIcon = (source) => {
    const sourceConfig = customerData.acquisitionSources.find((s) => s.source === source);
    // First check if icon is provided in data, otherwise use mapping, fallback to Target
    return sourceConfig?.icon || SOURCE_CONFIG_MAP[source]?.icon || Target;
  };

  const getSourceColor = (source) => {
    const sourceConfig = customerData.acquisitionSources.find((s) => s.source === source);
    // First check if color is provided in data, otherwise use mapping, fallback to gray
    return sourceConfig?.color || SOURCE_CONFIG_MAP[source]?.color || "#6B7280";
  };

  if (!customerData) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-green-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>New Customers</h3>
        </div>
        <div className="text-center py-8">
          <UserPlus size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No acquisition data available</p>
        </div>
      </div>
    );
  }

  const { summary, acquisitionSources, recentCustomers } = customerData;
  const growthPercent = (
    ((summary.newCustomersCount - summary.previousPeriodCount) / summary.previousPeriodCount) *
    100
  ).toFixed(1);
  const targetPercent = ((summary.newCustomersCount / summary.target) * 100).toFixed(0);
  const retentionChange = summary.retentionRate - summary.previousRetentionRate;

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
            <UserPlus size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              New Customers
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  New customer acquisition metrics
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{customerData.period}</p>
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

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* New Customers Count */}
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>New This Month</p>
            <div
              className={`flex items-center gap-1 text-xs ${
                parseFloat(growthPercent) >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {parseFloat(growthPercent) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {parseFloat(growthPercent) >= 0 ? "+" : ""}
              {growthPercent}%
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {summary.newCustomersCount}
            </p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Target: {summary.target}</p>
          </div>
          {/* Target Progress */}
          <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                parseInt(targetPercent, 10) >= 100
                  ? "bg-green-500"
                  : parseInt(targetPercent, 10) >= 70
                    ? "bg-teal-500"
                    : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(parseInt(targetPercent, 10), 100)}%` }}
            />
          </div>
          <p className={`text-xs mt-1 text-right ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {targetPercent}% of target
          </p>
        </div>

        {/* First Order Value */}
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-xs mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>First Order Value</p>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatCurrency(summary.totalFirstOrderValue)}
          </p>
          <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Avg: {formatCurrency(summary.avgFirstOrderValue)}
          </p>
        </div>
      </div>

      {/* Retention Rate */}
      <div
        className={`p-3 rounded-lg mb-4 ${
          isDarkMode ? "bg-green-900/20 border border-green-800/30" : "bg-green-50 border border-green-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-green-500" />
            <span className={`text-sm font-medium ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
              Retention Rate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
              {summary.retentionRate}%
            </span>
            <div
              className={`flex items-center gap-1 text-xs ${retentionChange >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {retentionChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {retentionChange >= 0 ? "+" : ""}
              {retentionChange}%
            </div>
          </div>
        </div>
      </div>

      {/* Acquisition Sources */}
      <div className="mb-4">
        <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Acquisition Sources
        </p>
        <div className="grid grid-cols-2 gap-2">
          {acquisitionSources.map((source, idx) => {
            // Use provided icon, or map by source name, or fallback to Target
            const Icon = source.icon || SOURCE_CONFIG_MAP[source.source]?.icon || Target;
            // Use provided color, or map by source name, or fallback to gray
            const iconColor = source.color || SOURCE_CONFIG_MAP[source.source]?.color || "#6B7280";
            return (
              <div
                key={source.id || source.name || `source-${idx}`}
                className={`p-2 rounded-lg flex items-center gap-2 ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${iconColor}20` }}
                >
                  <Icon size={14} style={{ color: iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>{source.source}</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {source.count} ({source.percent}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Customers */}
      <div>
        <p className={`text-xs font-medium mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Recent Acquisitions
        </p>
        <div className="space-y-2">
          {recentCustomers.slice(0, 3).map((customer) => {
            const SourceIcon = getSourceIcon(customer.source);
            const sourceColor = getSourceColor(customer.source);

            return (
              <div
                key={customer.id}
                onClick={() => onViewCustomer?.(customer)}
                role="button"
                tabIndex={0}
                onKeyDown={
                  onViewCustomer
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onViewCustomer(customer);
                        }
                      }
                    : undefined
                }
                className={`p-2 rounded-lg flex items-center gap-2 transition-all ${
                  onViewCustomer ? "cursor-pointer" : ""
                } ${isDarkMode ? "bg-[#2E3B4E] hover:bg-[#374151]" : "bg-gray-50 hover:bg-gray-100"}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${sourceColor}20` }}
                >
                  <SourceIcon size={14} style={{ color: sourceColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {customer.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      {formatDate(customer.joinDate)}
                    </span>
                    <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>|</span>
                    <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>{customer.assignedAgent}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(customer.firstOrderValue)}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      customer.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {customer.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          type="button"
          onClick={() => onViewDetails(customerData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          View All New Customers
        </button>
      )}
    </div>
  );
};

export default NewCustomerWidget;
