/**
 * VATReturnStatusWidget.jsx
 *
 * UAE VAT Return Form 201 Status Tracker
 * Displays quarterly VAT return submission status and filing deadlines
 *
 * UAE VAT Compliance:
 * - VAT returns due 28 days after quarter end
 * - Quarterly filing periods: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
 * - Status: Draft, Pending, Submitted, Overdue
 * - FTA submission via EmaraTax portal
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  ExternalLink,
  Info,
} from 'lucide-react';

const VATReturnStatusWidget = ({
  data = null,
  onGenerateReturn = null,
  onViewReturn = null,
  onDownloadReturn: _onDownloadReturn = null,
  isLoading: _isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [returnData, setReturnData] = useState(data || null);

  useEffect(() => {
    if (data) {
      setReturnData(data);
    }
  }, [data]);

  // Check if we have valid data
  const hasData =
    returnData && returnData.quarters && returnData.quarters.length > 0;

  // Show "No Data" state when no valid data is available
  if (!hasData) {
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h3
                className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                VAT Return Status
              </h3>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                Quarterly Filing Status
              </p>
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
        >
          <span className="text-sm">No data available</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-AE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'submitted':
        return {
          label: 'Submitted',
          icon: CheckCircle,
          bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
          textColor: isDarkMode ? 'text-green-400' : 'text-green-700',
          borderColor: isDarkMode ? 'border-green-700' : 'border-green-300',
        };
      case 'pending':
        return {
          label: 'Pending',
          icon: Clock,
          bgColor: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
          textColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-700',
          borderColor: isDarkMode ? 'border-yellow-700' : 'border-yellow-300',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          icon: XCircle,
          bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-100',
          textColor: isDarkMode ? 'text-red-400' : 'text-red-700',
          borderColor: isDarkMode ? 'border-red-700' : 'border-red-300',
        };
      case 'draft':
      default:
        return {
          label: 'Draft',
          icon: FileText,
          bgColor: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100',
          textColor: isDarkMode ? 'text-gray-400' : 'text-gray-600',
          borderColor: isDarkMode ? 'border-gray-600' : 'border-gray-300',
        };
    }
  };

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              VAT Return Status
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
                  UAE VAT Form 201 quarterly filing status
                </span>
              </span>
            </h3>
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              {returnData.currentYear} Filing Status
            </p>
          </div>
        </div>
      </div>

      {/* Next Filing Alert */}
      {returnData.nextFiling && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            returnData.nextFiling.daysRemaining <= 7
              ? isDarkMode
                ? 'bg-red-900/20 border-red-700'
                : 'bg-red-50 border-red-200'
              : returnData.nextFiling.daysRemaining <= 14
                ? isDarkMode
                  ? 'bg-yellow-900/20 border-yellow-700'
                  : 'bg-yellow-50 border-yellow-200'
                : isDarkMode
                  ? 'bg-blue-900/20 border-blue-700'
                  : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar
                size={16}
                className={
                  returnData.nextFiling.daysRemaining <= 7
                    ? 'text-red-500'
                    : returnData.nextFiling.daysRemaining <= 14
                      ? 'text-yellow-500'
                      : 'text-blue-500'
                }
              />
              <div>
                <p
                  className={`text-xs font-medium ${
                    returnData.nextFiling.daysRemaining <= 7
                      ? isDarkMode
                        ? 'text-red-400'
                        : 'text-red-700'
                      : returnData.nextFiling.daysRemaining <= 14
                        ? isDarkMode
                          ? 'text-yellow-400'
                          : 'text-yellow-700'
                        : isDarkMode
                          ? 'text-blue-400'
                          : 'text-blue-700'
                  }`}
                >
                  Next Filing: {returnData.nextFiling.quarter}
                </p>
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Due: {formatDate(returnData.nextFiling.dueDate)}
                </p>
              </div>
            </div>
            <span
              className={`text-sm font-bold ${
                returnData.nextFiling.daysRemaining <= 7
                  ? 'text-red-500'
                  : returnData.nextFiling.daysRemaining <= 14
                    ? 'text-yellow-500'
                    : 'text-blue-500'
              }`}
            >
              {returnData.nextFiling.daysRemaining} days
            </span>
          </div>
        </div>
      )}

      {/* Quarterly Status Grid */}
      <div className="grid grid-cols-2 gap-2">
        {returnData.quarters.map((quarter) => {
          const statusConfig = getStatusConfig(quarter.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={quarter.quarter}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                statusConfig.bgColor
              } ${statusConfig.borderColor}`}
              onClick={() => onViewReturn && onViewReturn(quarter)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {quarter.quarter}
                </span>
                <StatusIcon size={16} className={statusConfig.textColor} />
              </div>
              <p
                className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {quarter.period}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    statusConfig.bgColor
                  } ${statusConfig.textColor}`}
                >
                  {statusConfig.label}
                </span>
                {quarter.status === 'submitted' && (
                  <span
                    className={`text-xs font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(quarter.totalVAT)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div
        className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                {
                  returnData.quarters.filter((q) => q.status === 'submitted')
                    .length
                }{' '}
                Submitted
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                {returnData.quarters.filter((q) => q.status === 'draft').length}{' '}
                Draft
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        {onGenerateReturn && (
          <button
            onClick={onGenerateReturn}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              isDarkMode
                ? 'bg-teal-600 hover:bg-teal-500 text-white'
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            <FileText size={14} />
            Generate Return
          </button>
        )}
        <button
          onClick={() => window.open('https://tax.gov.ae', '_blank')}
          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
            isDarkMode
              ? 'bg-[#2E3B4E] hover:bg-[#3E4B5E] text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ExternalLink size={14} />
          FTA Portal
        </button>
      </div>
    </div>
  );
};

export default VATReturnStatusWidget;
