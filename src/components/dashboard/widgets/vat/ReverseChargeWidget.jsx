/**
 * ReverseChargeWidget.jsx
 * 
 * UAE Reverse Charge Mechanism Widget
 * Tracks transactions where reverse charge applies
 * 
 * UAE VAT Compliance - Reverse Charge Mechanism:
 * - Applies to imports of services from outside UAE
 * - Applies to supplies from non-resident suppliers
 * - Recipient must self-account for VAT
 * - Both Output and Input VAT recorded (net zero effect if fully recoverable)
 * - Must be reported in VAT Return Form 201 Box 9
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { 
  RotateCcw, 
  Globe2, 
  Building,
  ArrowRight,
  Info,
  ChevronRight,
  Calculator,
  AlertCircle,
} from 'lucide-react';

// Mock data for reverse charge transactions
const mockReverseChargeData = {
  summary: {
    totalTransactions: 18,
    totalValue: 425000.00,
    totalVAT: 21250.00, // 5% of total value
    outputVAT: 21250.00, // Self-accounted output VAT
    inputVAT: 21250.00, // Recoverable input VAT (if eligible)
    netEffect: 0.00, // Net zero if fully recoverable
    nonRecoverableVAT: 850.00, // Blocked input VAT
    currentQuarter: 'Q4 2024',
  },
  categories: [
    {
      type: 'imported_services',
      label: 'Imported Services',
      description: 'Services received from outside UAE',
      transactions: 12,
      value: 285000.00,
      vat: 14250.00,
    },
    {
      type: 'non_resident_supplies',
      label: 'Non-Resident Supplies',
      description: 'Goods/services from non-resident suppliers',
      transactions: 6,
      value: 140000.00,
      vat: 7000.00,
    },
  ],
  recentTransactions: [
    {
      id: 1,
      reference: 'RC-2024-0045',
      supplier: 'Global Steel Consulting Ltd',
      country: 'United Kingdom',
      countryCode: 'GB',
      type: 'imported_services',
      description: 'Technical consulting services',
      amount: 45000.00,
      vatAmount: 2250.00,
      date: '2024-12-24',
      isRecoverable: true,
    },
    {
      id: 2,
      reference: 'RC-2024-0044',
      supplier: 'Asian Metal Trading Co',
      country: 'China',
      countryCode: 'CN',
      type: 'non_resident_supplies',
      description: 'Steel processing machinery parts',
      amount: 85000.00,
      vatAmount: 4250.00,
      date: '2024-12-22',
      isRecoverable: true,
    },
    {
      id: 3,
      reference: 'RC-2024-0043',
      supplier: 'European Steel Analysis GmbH',
      country: 'Germany',
      countryCode: 'DE',
      type: 'imported_services',
      description: 'Quality testing services',
      amount: 28000.00,
      vatAmount: 1400.00,
      date: '2024-12-20',
      isRecoverable: true,
    },
    {
      id: 4,
      reference: 'RC-2024-0042',
      supplier: 'Tokyo Metal Research Inc',
      country: 'Japan',
      countryCode: 'JP',
      type: 'imported_services',
      description: 'R&D consultancy - entertainment',
      amount: 17000.00,
      vatAmount: 850.00,
      date: '2024-12-18',
      isRecoverable: false, // Entertainment expenses
    },
  ],
  form201Mapping: {
    box9: 21250.00, // Supplies subject to reverse charge (input)
    box7Contribution: 21250.00, // Contributes to total output VAT
  },
};

const ReverseChargeWidget = ({ 
  data = null, 
  onViewTransaction = null,
  onViewAll = null,
  onAddReverseCharge = null,
  isLoading = false, 
}) => {
  const { isDarkMode } = useTheme();
  const [reverseChargeData, setReverseChargeData] = useState(data || mockReverseChargeData);
  const [selectedView, setSelectedView] = useState('summary');

  useEffect(() => {
    if (data) {
      setReverseChargeData(data);
    }
  }, [data]);

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(safeAmount);
  };

  const getCountryFlag = (code) => {
    // Simple emoji flag from country code
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
      isDarkMode 
        ? 'bg-[#1E2328] border-[#37474F] hover:border-teal-600' 
        : 'bg-white border-[#E0E0E0] hover:border-teal-500'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <RotateCcw size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Reverse Charge
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Self-accounting for imports & non-resident supplies
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {reverseChargeData.summary.currentQuarter}
            </p>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className={`flex rounded-lg p-0.5 ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-100'}`}>
          <button
            onClick={() => setSelectedView('summary')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              selectedView === 'summary'
                ? 'bg-teal-500 text-white'
                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setSelectedView('transactions')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              selectedView === 'transactions'
                ? 'bg-teal-500 text-white'
                : isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Summary View */}
      {selectedView === 'summary' && (
        <>
          {/* VAT Flow Visualization */}
          <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              VAT Self-Accounting Flow
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 text-center">
                <p className={`text-lg font-bold text-orange-500`}>
                  {formatCurrency(reverseChargeData.summary.outputVAT)}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Output VAT
                </p>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight size={20} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  offset
                </span>
              </div>
              <div className="flex-1 text-center">
                <p className={`text-lg font-bold text-teal-500`}>
                  {formatCurrency(reverseChargeData.summary.inputVAT)}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Input VAT
                </p>
              </div>
              <div className="flex flex-col items-center">
                <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  =
                </span>
              </div>
              <div className="flex-1 text-center">
                <p className={`text-lg font-bold ${
                  reverseChargeData.summary.nonRecoverableVAT > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {formatCurrency(reverseChargeData.summary.nonRecoverableVAT)}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Non-Recoverable
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2 mb-4">
            {reverseChargeData.categories.map((category) => (
              <div
                key={category.type}
                className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-[#2E3B4E] border-[#37474F]' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {category.type === 'imported_services' ? (
                      <Globe2 size={14} className="text-orange-500" />
                    ) : (
                      <Building size={14} className="text-orange-500" />
                    )}
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category.label}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(category.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {category.transactions} transactions
                  </span>
                  <span className={`text-xs text-orange-500`}>
                    VAT: {formatCurrency(category.vat)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Form 201 Mapping */}
          <div className={`p-3 rounded-lg border-2 border-dashed ${
            isDarkMode ? 'border-[#37474F] bg-[#1E2328]' : 'border-gray-300 bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Calculator size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Form 201 Mapping
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Box 9: Reverse Charge
              </span>
              <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(reverseChargeData.form201Mapping.box9)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Transactions View */}
      {selectedView === 'transactions' && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {reverseChargeData.recentTransactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onViewTransaction && onViewTransaction(tx)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                isDarkMode 
                  ? 'bg-[#2E3B4E] border-[#37474F] hover:border-orange-600' 
                  : 'bg-white border-gray-200 hover:border-orange-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tx.reference}
                    </span>
                    <span className="text-base">{getCountryFlag(tx.countryCode)}</span>
                  </div>
                  <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {tx.supplier}
                  </p>
                  <p className={`text-xs truncate mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {tx.description}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className={`text-xs ${tx.isRecoverable ? 'text-teal-500' : 'text-red-500'}`}>
                    VAT: {formatCurrency(tx.vatAmount)}
                  </p>
                  {!tx.isRecoverable && (
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <AlertCircle size={10} className="text-red-500" />
                      <span className="text-xs text-red-500">Blocked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Reverse Charge Value
            </span>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(reverseChargeData.summary.totalValue)}
            </p>
          </div>
          <div className="text-right">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total VAT
            </span>
            <p className={`text-lg font-bold text-orange-500`}>
              {formatCurrency(reverseChargeData.summary.totalVAT)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        {onAddReverseCharge && (
          <button
            onClick={onAddReverseCharge}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              isDarkMode
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <RotateCcw size={14} />
            Add Transaction
          </button>
        )}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              isDarkMode
                ? 'bg-[#2E3B4E] hover:bg-[#3E4B5E] text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            View All
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ReverseChargeWidget;
