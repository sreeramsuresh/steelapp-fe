/**
 * ZeroRatedExportsWidget.jsx
 * 
 * UAE Zero-Rated Export Transactions Widget
 * Tracks export transactions (zero-rated supplies) with documentation status
 * 
 * UAE VAT Compliance - Zero-Rated Exports (Article 45):
 * - Export of goods outside GCC is zero-rated
 * - Must have proof of export documentation
 * - Required documents: Bill of Lading, Customs Declaration, Export Certificate
 * - Time limit for obtaining documentation: 90 days
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { 
  Globe, 
  Ship, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  Info,
  ChevronRight,
  ExternalLink,
  Package
} from 'lucide-react';

// Mock data for export transactions
const mockExportData = {
  summary: {
    totalExports: 42,
    totalValue: 2850000.00,
    compliantExports: 35,
    pendingDocumentation: 7,
    compliancePercentage: 83.3,
    documentsOverdue: 2,
  },
  documentTypes: [
    { name: 'Bill of Lading', required: true, complete: 38, pending: 4 },
    { name: 'Customs Declaration', required: true, complete: 40, pending: 2 },
    { name: 'Export Certificate', required: true, complete: 36, pending: 6 },
    { name: 'Commercial Invoice', required: true, complete: 42, pending: 0 },
    { name: 'Packing List', required: false, complete: 40, pending: 2 },
  ],
  recentExports: [
    {
      id: 1,
      invoiceNumber: 'EXP-2024-0089',
      customer: 'Al Rajhi Steel Trading - KSA',
      country: 'Saudi Arabia',
      countryCode: 'SA',
      amount: 185000.00,
      date: '2024-12-25',
      status: 'complete',
      documents: {
        billOfLading: true,
        customsDeclaration: true,
        exportCertificate: true,
        commercialInvoice: true,
      },
      daysRemaining: null,
    },
    {
      id: 2,
      invoiceNumber: 'EXP-2024-0087',
      customer: 'Qatar Steel Industries',
      country: 'Qatar',
      countryCode: 'QA',
      amount: 125000.00,
      date: '2024-12-22',
      status: 'pending',
      documents: {
        billOfLading: true,
        customsDeclaration: true,
        exportCertificate: false,
        commercialInvoice: true,
      },
      daysRemaining: 68,
    },
    {
      id: 3,
      invoiceNumber: 'EXP-2024-0085',
      customer: 'Oman Iron Works LLC',
      country: 'Oman',
      countryCode: 'OM',
      amount: 95500.00,
      date: '2024-12-20',
      status: 'pending',
      documents: {
        billOfLading: false,
        customsDeclaration: true,
        exportCertificate: false,
        commercialInvoice: true,
      },
      daysRemaining: 62,
    },
    {
      id: 4,
      invoiceNumber: 'EXP-2024-0082',
      customer: 'Kuwait Metal Trading Co',
      country: 'Kuwait',
      countryCode: 'KW',
      amount: 210000.00,
      date: '2024-12-15',
      status: 'overdue',
      documents: {
        billOfLading: true,
        customsDeclaration: false,
        exportCertificate: false,
        commercialInvoice: true,
      },
      daysRemaining: -5,
    },
  ],
  topDestinations: [
    { country: 'Saudi Arabia', code: 'SA', value: 850000.00, count: 12 },
    { country: 'Qatar', code: 'QA', value: 620000.00, count: 8 },
    { country: 'Oman', code: 'OM', value: 480000.00, count: 10 },
    { country: 'Kuwait', code: 'KW', value: 420000.00, count: 6 },
    { country: 'Bahrain', code: 'BH', value: 280000.00, count: 4 },
  ],
};

const ZeroRatedExportsWidget = ({ 
  data = null, 
  onViewExport = null,
  onUploadDocument = null,
  onViewAll = null,
  isLoading = false 
}) => {
  const { isDarkMode } = useTheme();
  const [exportData, setExportData] = useState(data || mockExportData);
  const [selectedTab, setSelectedTab] = useState('exports');

  useEffect(() => {
    if (data) {
      setExportData(data);
    }
  }, [data]);

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(safeAmount);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'complete':
        return {
          label: 'Complete',
          icon: CheckCircle,
          bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
          textColor: 'text-green-500',
        };
      case 'pending':
        return {
          label: 'Pending',
          icon: Clock,
          bgColor: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50',
          textColor: 'text-yellow-500',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          icon: AlertTriangle,
          bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-50',
          textColor: 'text-red-500',
        };
      default:
        return {
          label: 'Unknown',
          icon: FileText,
          bgColor: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
          textColor: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        };
    }
  };

  const getDocumentCount = (documents) => {
    const total = Object.keys(documents).length;
    const complete = Object.values(documents).filter(Boolean).length;
    return { complete, total };
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h3 className={`text-base font-semibold flex items-center gap-1.5 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Zero-Rated Exports
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                  isDarkMode ? 'bg-gray-700 text-white' : 'bg-yellow-100 text-gray-800 border border-yellow-300'
                }`}>
                  Export sales outside UAE - 0% VAT
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Documentation Status
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`p-2.5 rounded-lg text-center ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {exportData.summary.totalExports}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Exports
          </p>
        </div>
        <div className={`p-2.5 rounded-lg text-center ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-lg font-bold ${
            exportData.summary.compliancePercentage >= 90 ? 'text-green-500' :
            exportData.summary.compliancePercentage >= 70 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {exportData.summary.compliancePercentage.toFixed(0)}%
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Compliant
          </p>
        </div>
        <div className={`p-2.5 rounded-lg text-center ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
          <p className={`text-lg font-bold ${
            exportData.summary.pendingDocumentation > 0 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {exportData.summary.pendingDocumentation}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Pending Docs
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className={`flex rounded-lg p-0.5 mb-4 ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-100'}`}>
        <button
          onClick={() => setSelectedTab('exports')}
          className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
            selectedTab === 'exports'
              ? 'bg-teal-500 text-white'
              : isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Recent Exports
        </button>
        <button
          onClick={() => setSelectedTab('documents')}
          className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
            selectedTab === 'documents'
              ? 'bg-teal-500 text-white'
              : isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Documents
        </button>
      </div>

      {/* Recent Exports Tab */}
      {selectedTab === 'exports' && (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {exportData.recentExports.map((exp) => {
            const statusConfig = getStatusConfig(exp.status);
            const StatusIcon = statusConfig.icon;
            const docCount = getDocumentCount(exp.documents);
            
            return (
              <div
                key={exp.id}
                onClick={() => onViewExport && onViewExport(exp)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  isDarkMode 
                    ? 'bg-[#2E3B4E] border-[#37474F] hover:border-teal-600' 
                    : 'bg-white border-gray-200 hover:border-teal-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {exp.invoiceNumber}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {exp.country}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {exp.customer}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(exp.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <StatusIcon size={12} className={statusConfig.textColor} />
                      <span className={`text-xs ${statusConfig.textColor}`}>
                        {docCount.complete}/{docCount.total} docs
                      </span>
                    </div>
                  </div>
                </div>
                {exp.status !== 'complete' && exp.daysRemaining !== null && (
                  <div className={`mt-2 text-xs ${
                    exp.daysRemaining < 0 ? 'text-red-500' :
                    exp.daysRemaining < 30 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {exp.daysRemaining < 0 
                      ? `${Math.abs(exp.daysRemaining)} days overdue`
                      : `${exp.daysRemaining} days remaining`
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Documents Tab */}
      {selectedTab === 'documents' && (
        <div className="space-y-2">
          {exportData.documentTypes.filter(d => d.required).map((doc, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {doc.name}
                  </span>
                </div>
                <span className={`text-xs font-medium ${
                  doc.pending === 0 ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {doc.complete}/{doc.complete + doc.pending}
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    doc.pending === 0 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${(doc.complete / (doc.complete + doc.pending)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Export Value */}
      <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Export Value (Zero-Rated)
          </span>
          <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(exportData.summary.totalValue)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        {onUploadDocument && (
          <button
            onClick={onUploadDocument}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
              isDarkMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            <Upload size={14} />
            Upload Documents
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

export default ZeroRatedExportsWidget;
