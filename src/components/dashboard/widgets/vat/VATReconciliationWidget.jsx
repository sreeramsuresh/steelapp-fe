/**
 * VATReconciliationWidget.jsx
 * 
 * UAE VAT Reconciliation Summary Widget
 * Displays reconciliation between sales/purchase registers and VAT amounts
 * 
 * UAE VAT Compliance - Reconciliation:
 * - Sales register must match Output VAT collected
 * - Purchase register must match Input VAT paid
 * - Discrepancies must be investigated and resolved
 * - Regular reconciliation required for FTA audit readiness
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { 
  Scale, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Info,
  RefreshCw,
  FileSearch,
  Calendar,
} from 'lucide-react';


const VATReconciliationWidget = ({
  data = null,
  onRunReconciliation = null,
  onViewDiscrepancy = null,
  onViewDetails = null,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [reconciliationData, setReconciliationData] = useState(data || null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (data) {
      setReconciliationData(data);
    }
  }, [data]);

  // Check if we have valid data
  const hasData = reconciliationData && reconciliationData.salesReconciliation && reconciliationData.purchaseReconciliation;

  // Show "No Data" state when no valid data is available
  if (!hasData) {
    return (
      <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-600'
          : 'bg-white border-[#E0E0E0] hover:border-teal-500'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Scale size={20} className="text-white" />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                VAT Reconciliation
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Register Matching
              </p>
            </div>
          </div>
        </div>
        <div className={`flex flex-col items-center justify-center h-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLastReconciled = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'matched':
        return {
          label: 'Matched',
          icon: CheckCircle,
          bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
          textColor: 'text-green-500',
          borderColor: isDarkMode ? 'border-green-700' : 'border-green-200',
        };
      case 'discrepancy':
        return {
          label: 'Discrepancy',
          icon: AlertTriangle,
          bgColor: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50',
          textColor: 'text-yellow-500',
          borderColor: isDarkMode ? 'border-yellow-700' : 'border-yellow-200',
        };
      case 'error':
        return {
          label: 'Error',
          icon: XCircle,
          bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-50',
          textColor: 'text-red-500',
          borderColor: isDarkMode ? 'border-red-700' : 'border-red-200',
        };
      default:
        return {
          label: 'Pending',
          icon: Info,
          bgColor: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
          textColor: isDarkMode ? 'text-gray-400' : 'text-gray-500',
          borderColor: isDarkMode ? 'border-gray-600' : 'border-gray-200',
        };
    }
  };

  const salesStatus = getStatusConfig(reconciliationData.salesReconciliation.status);
  const purchaseStatus = getStatusConfig(reconciliationData.purchaseReconciliation.status);
  const SalesIcon = salesStatus.icon;
  const PurchaseIcon = purchaseStatus.icon;

  const pendingDiscrepancies = reconciliationData.discrepancies.filter(d => d.status === 'pending');

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode 
        ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-600' 
        : 'bg-white border-[#E0E0E0] hover:border-teal-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            pendingDiscrepancies.length > 0
              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
              : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
          }`}>
            <Scale size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              VAT Reconciliation
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Match registers with VAT amounts
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {reconciliationData.period.label}
            </p>
          </div>
        </div>
        
        {onRunReconciliation && (
          <button
            onClick={onRunReconciliation}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-[#2E3B4E] text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } ${isLoading ? 'animate-spin' : ''}`}
            title="Run Reconciliation"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {/* Tab Selector */}
      <div className={`flex rounded-lg p-0.5 mb-4 ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-100'}`}>
        <button
          onClick={() => setSelectedTab('overview')}
          className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
            selectedTab === 'overview'
              ? 'bg-teal-500 text-white'
              : isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('discrepancies')}
          className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
            selectedTab === 'discrepancies'
              ? 'bg-teal-500 text-white'
              : isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Issues
          {pendingDiscrepancies.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              selectedTab === 'discrepancies' ? 'bg-white text-teal-600' : 'bg-yellow-500 text-white'
            }`}>
              {pendingDiscrepancies.length}
            </span>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Sales Reconciliation */}
          <div className={`p-3 rounded-lg border mb-3 ${
            salesStatus.bgColor
          } ${salesStatus.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className={salesStatus.textColor} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Sales Register
                </span>
              </div>
              <div className="flex items-center gap-1">
                <SalesIcon size={14} className={salesStatus.textColor} />
                <span className={`text-xs font-medium ${salesStatus.textColor}`}>
                  {salesStatus.label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total Sales</span>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(reconciliationData.salesReconciliation.salesRegisterTotal)}
                </p>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>VAT Collected</span>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(reconciliationData.salesReconciliation.vatCollected)}
                </p>
              </div>
            </div>
            <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {reconciliationData.salesReconciliation.matchedInvoices}/{reconciliationData.salesReconciliation.invoiceCount} invoices matched
            </div>
          </div>

          {/* Purchase Reconciliation */}
          <div className={`p-3 rounded-lg border mb-3 ${
            purchaseStatus.bgColor
          } ${purchaseStatus.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className={purchaseStatus.textColor} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Purchase Register
                </span>
              </div>
              <div className="flex items-center gap-1">
                <PurchaseIcon size={14} className={purchaseStatus.textColor} />
                <span className={`text-xs font-medium ${purchaseStatus.textColor}`}>
                  {purchaseStatus.label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total Purchases</span>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(reconciliationData.purchaseReconciliation.purchaseRegisterTotal)}
                </p>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>VAT Paid</span>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(reconciliationData.purchaseReconciliation.vatPaid)}
                </p>
              </div>
            </div>
            <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {reconciliationData.purchaseReconciliation.matchedBills}/{reconciliationData.purchaseReconciliation.billCount} bills matched
            </div>
          </div>

          {/* Net VAT Position */}
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Net VAT (Payable)
              </span>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(reconciliationData.vatReturnReconciliation.netVATPayable)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Discrepancies Tab */}
      {selectedTab === 'discrepancies' && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {pendingDiscrepancies.length > 0 ? (
            pendingDiscrepancies.map((disc) => (
              <div
                key={disc.id}
                onClick={() => onViewDiscrepancy && onViewDiscrepancy(disc)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  isDarkMode 
                    ? 'bg-yellow-900/20 border-yellow-700 hover:border-yellow-500' 
                    : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {disc.reference}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {disc.type === 'sales' ? 'Sales' : 'Purchase'}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {disc.supplier || disc.customer}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {disc.reason}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className={`text-sm font-bold ${
                      disc.variance > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {disc.variance > 0 ? '+' : ''}{formatCurrency(disc.variance)}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      variance
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`p-6 text-center rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
              <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No Discrepancies
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                All records are reconciled
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Calendar size={12} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Last reconciled: {formatLastReconciled(reconciliationData.lastReconciled)}
            </span>
          </div>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className={`text-xs font-medium flex items-center gap-1 ${
                isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
              }`}
            >
              <FileSearch size={12} />
              Full Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VATReconciliationWidget;
