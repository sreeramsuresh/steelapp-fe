/**
 * AtRiskCustomersWidget.jsx
 *
 * Customers At Risk of Churn Widget
 * Identifies customers with declining activity, payment delays, or complaints
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  MessageSquare,
  CalendarX,
  Phone,
  Mail,
  Info,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

// Mock at-risk customer data
const MOCK_AT_RISK_DATA = {
  summary: {
    totalAtRisk: 12,
    highRisk: 4,
    mediumRisk: 5,
    lowRisk: 3,
    potentialRevenueLoss: 4850000,
  },
  customers: [
    {
      id: 1,
      name: 'Sharjah Metal Works',
      riskScore: 9,
      riskLevel: 'high',
      lastOrderDate: '2024-09-15',
      daysSinceOrder: 75,
      indicators: ['Declining Orders', 'Payment Delays'],
      revenueAtRisk: 1250000,
      avgMonthlyRevenue: 185000,
      declinePercent: 45,
      recommendedAction: 'Schedule urgent call',
      contactPerson: 'Ahmed Hassan',
      contactPhone: '+971 50 123 4567',
    },
    {
      id: 2,
      name: 'Al Ain Steel Traders',
      riskScore: 8,
      riskLevel: 'high',
      lastOrderDate: '2024-10-05',
      daysSinceOrder: 55,
      indicators: ['Payment Delays', 'Complaint Filed'],
      revenueAtRisk: 980000,
      avgMonthlyRevenue: 145000,
      declinePercent: 38,
      recommendedAction: 'Resolve complaint first',
      contactPerson: 'Fatima Ali',
      contactPhone: '+971 55 987 6543',
    },
    {
      id: 3,
      name: 'RAK Industrial Supply',
      riskScore: 7,
      riskLevel: 'high',
      lastOrderDate: '2024-10-20',
      daysSinceOrder: 40,
      indicators: ['Declining Orders'],
      revenueAtRisk: 850000,
      avgMonthlyRevenue: 125000,
      declinePercent: 32,
      recommendedAction: 'Send special offer',
      contactPerson: 'Mohammed Khalid',
      contactPhone: '+971 56 456 7890',
    },
    {
      id: 4,
      name: 'Fujairah Steel Co',
      riskScore: 6,
      riskLevel: 'medium',
      lastOrderDate: '2024-10-28',
      daysSinceOrder: 32,
      indicators: ['Declining Orders'],
      revenueAtRisk: 720000,
      avgMonthlyRevenue: 110000,
      declinePercent: 28,
      recommendedAction: 'Follow up call',
      contactPerson: 'Sara Khan',
      contactPhone: '+971 52 321 0987',
    },
    {
      id: 5,
      name: 'Northern Emirates Fab',
      riskScore: 5,
      riskLevel: 'medium',
      lastOrderDate: '2024-11-02',
      daysSinceOrder: 28,
      indicators: ['Payment Delays'],
      revenueAtRisk: 550000,
      avgMonthlyRevenue: 95000,
      declinePercent: 20,
      recommendedAction: 'Payment plan discussion',
      contactPerson: 'Omar Rashid',
      contactPhone: '+971 50 654 3210',
    },
  ],
  riskFactors: [
    { factor: 'Declining Orders', count: 8, icon: TrendingDown },
    { factor: 'Payment Delays', count: 5, icon: Clock },
    { factor: 'Complaints Filed', count: 2, icon: MessageSquare },
    { factor: 'No Recent Contact', count: 4, icon: CalendarX },
  ],
};

const AtRiskCustomersWidget = ({
  data: propData,
  onRefresh,
  onViewCustomer,
  onContactCustomer,
  onViewDetails,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [riskData, setRiskData] = useState(propData || MOCK_AT_RISK_DATA);
  const [loading, setLoading] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  useEffect(() => {
    if (propData) {
      setRiskData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setRiskData(freshData || MOCK_AT_RISK_DATA);
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

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return {
        bg: isDarkMode ? 'bg-red-900/30' : 'bg-red-50',
        border: isDarkMode ? 'border-red-700/50' : 'border-red-200',
        text: isDarkMode ? 'text-red-400' : 'text-red-600',
        badge: 'bg-red-500',
      };
      case 'medium': return {
        bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50',
        border: isDarkMode ? 'border-yellow-700/50' : 'border-yellow-200',
        text: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
        badge: 'bg-yellow-500',
      };
      case 'low': return {
        bg: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50',
        border: isDarkMode ? 'border-orange-700/50' : 'border-orange-200',
        text: isDarkMode ? 'text-orange-400' : 'text-orange-600',
        badge: 'bg-orange-500',
      };
      default: return {
        bg: isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
        border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
        text: isDarkMode ? 'text-gray-400' : 'text-gray-600',
        badge: 'bg-gray-500',
      };
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (!riskData) {
    return (
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={20} className="text-red-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            At-Risk Customers
          </h3>
        </div>
        <div className="text-center py-8">
          <ShieldAlert size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No at-risk data available
          </p>
        </div>
      </div>
    );
  }

  const { summary, customers, riskFactors } = riskData;

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode
        ? 'bg-[#1E2328] border-[#37474F] hover:border-red-600'
        : 'bg-white border-[#E0E0E0] hover:border-red-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              At-Risk Customers
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Customers showing churn risk indicators
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Churn Prevention
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

      {/* Summary Alert */}
      <div className={`p-3 rounded-lg mb-4 border ${
        isDarkMode
          ? 'bg-red-900/20 border-red-800/30'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                {summary.totalAtRisk} Customers at Risk
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-red-400/70' : 'text-red-600'}`}>
                {summary.highRisk} high | {summary.mediumRisk} medium | {summary.lowRisk} low
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {formatCurrency(summary.potentialRevenueLoss)}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-red-400/70' : 'text-red-600'}`}>
              revenue at risk
            </p>
          </div>
        </div>
      </div>

      {/* Risk Factors Summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        {riskFactors.map((factor, idx) => {
          const Icon = factor.icon;
          return (
            <div
              key={idx}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isDarkMode ? 'bg-[#2E3B4E] text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Icon size={12} />
              <span>{factor.factor}</span>
              <span className={`ml-1 px-1.5 rounded-full ${
                isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
              }`}>
                {factor.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* At-Risk Customer List */}
      <div className="space-y-2">
        {customers.slice(0, 4).map((customer) => {
          const riskStyle = getRiskColor(customer.riskLevel);
          const isExpanded = expandedCustomer === customer.id;

          return (
            <div
              key={customer.id}
              className={`rounded-lg border transition-all duration-200 ${riskStyle.bg} ${riskStyle.border}`}
            >
              <div
                onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                className="p-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {/* Risk Score */}
                  <div className={`w-10 h-10 rounded-full ${getRiskScoreColor(customer.riskScore)} flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">{customer.riskScore}</span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {customer.name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.indicators.map((ind, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${riskStyle.badge} text-white`}
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className={`text-sm font-bold ${riskStyle.text}`}>
                      {customer.daysSinceOrder}d
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      since order
                    </p>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={`px-3 pb-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Revenue at Risk:
                        </span>
                        <span className={`ml-1 font-medium ${riskStyle.text}`}>
                          {formatCurrency(customer.revenueAtRisk)}
                        </span>
                      </div>
                      <div>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          Decline:
                        </span>
                        <span className={`ml-1 font-medium ${riskStyle.text}`}>
                          {customer.declinePercent}%
                        </span>
                      </div>
                    </div>

                    <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Recommended Action:
                      </p>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {customer.recommendedAction}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {onContactCustomer && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onContactCustomer(customer, 'call');
                            }}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${
                              isDarkMode
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            <Phone size={12} />
                            Call
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onContactCustomer(customer, 'email');
                            }}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${
                              isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <Mail size={12} />
                            Email
                          </button>
                        </>
                      )}
                      {onViewCustomer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCustomer(customer);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ${
                            isDarkMode
                              ? 'bg-gray-600 hover:bg-gray-500 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          }`}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(riskData)}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          View All At-Risk Customers
        </button>
      )}
    </div>
  );
};

export default AtRiskCustomersWidget;
