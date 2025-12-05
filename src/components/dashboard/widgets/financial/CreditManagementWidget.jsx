import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
  TrendingUp,
  TrendingDown,
  Users,
} from 'lucide-react';

const CreditManagementWidget = ({ data: propData, onRefresh }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(propData || null);

  useEffect(() => {
    if (propData) {
      setData(propData);
    }
  }, [propData]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      if (onRefresh) {
        const freshData = await onRefresh();
        setData(freshData || null);
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

  // Check if we have valid data
  const hasData = data && (data.totalCreditLimit > 0 || data.totalCreditUsed > 0);

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-purple-500" />
            <h3 className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Credit Management
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                  Customer credit utilization and risk monitoring
                </span>
              </span>
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className={`flex flex-col items-center justify-center h-48 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const getUtilizationColor = (percent) => {
    if (percent >= 90) return { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500' };
    if (percent >= 75) return { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500' };
    if (percent >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-500', ring: 'ring-yellow-500' };
    return { bg: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-500' };
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
            <AlertTriangle size={10} />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
            <AlertCircle size={10} />
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <CheckCircle size={10} />
            Low
          </span>
        );
    }
  };

  const utilizationColors = getUtilizationColor(data.utilizationPercent || 0);

  // Calculate gauge angle (180 degrees = 100%)
  const gaugeAngle = ((data.utilizationPercent || 0) / 100) * 180;

  return (
    <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-purple-500" />
          <h3 className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Credit Management
            <span className="relative group">
              <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
              <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                Customer credit utilization and risk monitoring
              </span>
            </span>
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          } ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Credit Gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Background arc */}
          <div
            className={`absolute inset-0 rounded-t-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            style={{ transform: 'rotate(0deg)' }}
          />
          {/* Filled arc */}
          <div
            className={`absolute inset-0 rounded-t-full ${utilizationColors.bg} origin-bottom transition-all duration-1000`}
            style={{
              clipPath: `polygon(50% 100%, 0% 100%, 0% 0%, 50% 0%, 50% 50%)`,
              transform: `rotate(${Math.min(gaugeAngle, 180)}deg)`,
            }}
          />
          {/* Center cover */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-14 rounded-t-full ${
            isDarkMode ? 'bg-[#1E2328]' : 'bg-white'
          }`} />
          {/* Value display */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <p className={`text-2xl font-bold ${utilizationColors.text}`}>
              {data.utilizationPercent || 0}%
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Utilized
            </p>
          </div>
        </div>
      </div>

      {/* Credit Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Limit
          </span>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(data.totalCreditLimit)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Used
          </span>
          <p className={`text-sm font-bold ${utilizationColors.text}`}>
            {formatCurrency(data.totalCreditUsed)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Available
          </span>
          <p className="text-sm font-bold text-green-500">
            {formatCurrency(data.availableCredit)}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Trend
          </span>
          <p className={`text-sm font-bold flex items-center gap-1 ${
            (data.trend || 0) > 0 ? 'text-red-500' : 'text-green-500'
          }`}>
            {(data.trend || 0) > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {(data.trend || 0) > 0 ? '+' : ''}{data.trend || 0}%
          </p>
        </div>
      </div>

      {/* At-Risk Accounts */}
      {data.atRiskAccounts && data.atRiskAccounts.length > 0 && (
        <div className={`border-t pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <AlertTriangle size={14} className="text-red-500" />
              At-Risk Accounts
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              {data.atRiskAccounts.length} accounts
            </span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {data.atRiskAccounts.map((account) => (
              <div
                key={account.id}
                className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium truncate max-w-[150px] ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {account.name}
                  </span>
                  {getRiskBadge(account.riskLevel)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {account.utilization}% utilized
                  </span>
                  <span className="text-red-500 font-medium">
                    {formatCurrency(account.overdue)} overdue
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className={`h-1.5 rounded-full mt-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full rounded-full ${getUtilizationColor(account.utilization).bg}`}
                    style={{ width: `${Math.min(account.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Summary */}
      {data.summary && (
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {data.summary.totalCustomers} customers
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {data.summary.highRisk} high
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {data.summary.mediumRisk} med
                </span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                  {data.summary.lowRisk} low
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditManagementWidget;
