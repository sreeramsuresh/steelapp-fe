import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { Clock, TrendingDown, AlertTriangle, RefreshCw, Info } from 'lucide-react';

// Mock data for AP Aging (will be replaced with actual service call)
const MOCK_AP_AGING = {
  buckets: [
    { label: '0-30 Days', amount: 125000, percentage: 45, count: 12 },
    { label: '31-60 Days', amount: 85000, percentage: 30, count: 8 },
    { label: '61-90 Days', amount: 45000, percentage: 16, count: 5 },
    { label: '90+ Days', amount: 25000, percentage: 9, count: 3 },
  ],
  totalAP: 280000,
  overdueAP: 70000,
  criticalSuppliers: [
    { name: 'Steel Corp Ltd', amount: 35000, daysOverdue: 95 },
    { name: 'Metal Works Inc', amount: 18000, daysOverdue: 72 },
  ],
};

const APAgingWidget = ({ data: propData, onRefresh }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(propData || MOCK_AP_AGING);

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
        setData(freshData || MOCK_AP_AGING);
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

  const bucketColors = [
    { bg: 'bg-green-500', text: 'text-green-600', bgLight: 'bg-green-100' },
    { bg: 'bg-yellow-500', text: 'text-yellow-600', bgLight: 'bg-yellow-100' },
    { bg: 'bg-orange-500', text: 'text-orange-600', bgLight: 'bg-orange-100' },
    { bg: 'bg-red-500', text: 'text-red-600', bgLight: 'bg-red-100' },
  ];

  if (!data || !data.buckets) {
    return (
      <div className={`rounded-xl border p-6 ${
        isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={20} className="text-orange-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AP Aging
          </h3>
        </div>
        <div className="text-center py-8">
          <Clock size={48} className={`mx-auto mb-4 opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No payables data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 sm:p-6 transition-all duration-300 hover:shadow-lg ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown size={20} className="text-orange-500" />
          <h3 className={`text-lg font-semibold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AP Aging
            <span className="relative group">
              <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
              <span className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-gray-800 bg-yellow-100 border border-yellow-300 rounded shadow-md whitespace-nowrap normal-case">
                Payables grouped by days outstanding
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

      {/* Aging Buckets */}
      <div className="space-y-3 mb-4">
        {data.buckets.map((bucket, index) => (
          <div key={bucket.label} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {bucket.label}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {bucket.count} bills
                </span>
              </div>
              <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(bucket.amount)}
              </span>
            </div>
            <div className={`h-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
              <div
                className={`h-full ${bucketColors[index].bg} rounded-full transition-all duration-500 group-hover:opacity-80`}
                style={{ width: `${Math.min(parseFloat(bucket.percentage) || 0, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total AP</span>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(data.totalAP)}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overdue</span>
            <p className="text-lg font-bold text-red-500">
              {formatCurrency(data.overdueAP)}
            </p>
          </div>
        </div>

        {/* Critical Suppliers Alert */}
        {data.criticalSuppliers && data.criticalSuppliers.length > 0 && (
          <div className={`mt-3 p-3 rounded-lg ${
            isDarkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                Critical Suppliers
              </span>
            </div>
            <div className="space-y-1">
              {data.criticalSuppliers.slice(0, 2).map((supplier, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {supplier.name}
                  </span>
                  <span className="text-red-500 font-medium">
                    {supplier.daysOverdue}d overdue
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APAgingWidget;
