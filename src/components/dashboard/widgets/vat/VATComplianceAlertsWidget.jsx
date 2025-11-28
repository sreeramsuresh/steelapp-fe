/**
 * VATComplianceAlertsWidget.jsx
 * 
 * UAE VAT Compliance Alerts Widget
 * Displays compliance issues requiring attention
 * 
 * UAE VAT Compliance Requirements:
 * - TRN (Tax Registration Number) must be 15 digits
 * - Valid TRN required on all tax invoices
 * - Correct VAT rate application (5% standard, 0% zero-rated, exempt)
 * - Proper tax invoice format per FTA requirements
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle,
  ChevronRight,
  Bell,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

// Mock compliance alerts data
const mockAlertsData = {
  summary: {
    critical: 3,
    warning: 5,
    info: 2,
    total: 10,
  },
  alerts: [
    {
      id: 1,
      severity: 'critical',
      type: 'missing_trn',
      title: 'Missing TRN on Invoices',
      description: '3 invoices have customers without TRN',
      count: 3,
      actionText: 'Review Invoices',
      invoiceIds: ['INV-2024-0234', 'INV-2024-0241', 'INV-2024-0245'],
    },
    {
      id: 2,
      severity: 'critical',
      type: 'invalid_trn',
      title: 'Invalid TRN Format',
      description: '2 customers have invalid TRN format (not 15 digits)',
      count: 2,
      actionText: 'Fix TRN',
      customerIds: [12, 45],
    },
    {
      id: 3,
      severity: 'critical',
      type: 'vat_rate_mismatch',
      title: 'VAT Rate Mismatch',
      description: '1 invoice has incorrect VAT calculation',
      count: 1,
      actionText: 'Review Invoice',
      invoiceIds: ['INV-2024-0238'],
    },
    {
      id: 4,
      severity: 'warning',
      type: 'missing_tax_invoice',
      title: 'Missing Tax Invoice Fields',
      description: '2 invoices missing required FTA fields',
      count: 2,
      actionText: 'Complete Invoices',
      invoiceIds: ['INV-2024-0229', 'INV-2024-0231'],
    },
    {
      id: 5,
      severity: 'warning',
      type: 'export_docs_pending',
      title: 'Export Documentation Pending',
      description: '3 zero-rated exports missing proof of export',
      count: 3,
      actionText: 'Upload Documents',
      invoiceIds: ['INV-2024-0215', 'INV-2024-0218', 'INV-2024-0222'],
    },
    {
      id: 6,
      severity: 'warning',
      type: 'trn_expiry',
      title: 'TRN Verification Due',
      description: '5 customer TRNs need re-verification',
      count: 5,
      actionText: 'Verify TRN',
      customerIds: [8, 15, 23, 31, 42],
    },
    {
      id: 7,
      severity: 'info',
      type: 'filing_reminder',
      title: 'Q4 VAT Return Reminder',
      description: 'Q4 2024 VAT return due in 31 days',
      count: 1,
      actionText: 'Prepare Return',
    },
    {
      id: 8,
      severity: 'info',
      type: 'rate_update',
      title: 'VAT Rate Configuration',
      description: 'Review VAT rate settings for new products',
      count: 4,
      actionText: 'Review Rates',
    },
  ],
  lastChecked: '2024-12-28T10:30:00Z',
};

const VATComplianceAlertsWidget = ({ 
  data = null, 
  onAlertClick = null,
  onRefresh = null,
  onViewAll = null,
  maxAlerts = 5,
  isLoading = false 
}) => {
  const { isDarkMode } = useTheme();
  const [alertsData, setAlertsData] = useState(data || mockAlertsData);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (data) {
      setAlertsData(data);
    }
  }, [data]);

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: XCircle,
          bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-50',
          textColor: isDarkMode ? 'text-red-400' : 'text-red-600',
          borderColor: isDarkMode ? 'border-red-700' : 'border-red-200',
          badgeColor: 'bg-red-500 text-white',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50',
          textColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
          borderColor: isDarkMode ? 'border-yellow-700' : 'border-yellow-200',
          badgeColor: 'bg-yellow-500 text-white',
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
          textColor: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          borderColor: isDarkMode ? 'border-blue-700' : 'border-blue-200',
          badgeColor: 'bg-blue-500 text-white',
        };
    }
  };

  const filteredAlerts = alertsData.alerts.filter(alert => 
    selectedFilter === 'all' || alert.severity === selectedFilter
  ).slice(0, maxAlerts);

  const formatLastChecked = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString('en-AE', { day: '2-digit', month: 'short' });
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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
            alertsData.summary.critical > 0
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : alertsData.summary.warning > 0
                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            {alertsData.summary.critical > 0 ? (
              <AlertTriangle size={20} className="text-white" />
            ) : alertsData.summary.warning > 0 ? (
              <AlertCircle size={20} className="text-white" />
            ) : (
              <CheckCircle size={20} className="text-white" />
            )}
          </div>
          <div>
            <h3 className={`text-base font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Compliance Alerts
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {alertsData.summary.total} issues found
            </p>
          </div>
        </div>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-[#2E3B4E] text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            } ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* Summary Badges */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-teal-500 text-white'
              : isDarkMode ? 'bg-[#2E3B4E] text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All ({alertsData.summary.total})
        </button>
        {alertsData.summary.critical > 0 && (
          <button
            onClick={() => setSelectedFilter('critical')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedFilter === 'critical'
                ? 'bg-red-500 text-white'
                : isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
            }`}
          >
            Critical ({alertsData.summary.critical})
          </button>
        )}
        {alertsData.summary.warning > 0 && (
          <button
            onClick={() => setSelectedFilter('warning')}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedFilter === 'warning'
                ? 'bg-yellow-500 text-white'
                : isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
            }`}
          >
            Warning ({alertsData.summary.warning})
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const SeverityIcon = severityConfig.icon;
            
            return (
              <div
                key={alert.id}
                onClick={() => onAlertClick && onAlertClick(alert)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                  severityConfig.bgColor
                } ${severityConfig.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <SeverityIcon size={18} className={`${severityConfig.textColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {alert.title}
                      </p>
                      {alert.count > 1 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${severityConfig.badgeColor}`}>
                          {alert.count}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {alert.description}
                    </p>
                    <button className={`text-xs mt-1 font-medium flex items-center gap-0.5 ${severityConfig.textColor}`}>
                      {alert.actionText}
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`p-6 text-center rounded-lg ${isDarkMode ? 'bg-[#2E3B4E]' : 'bg-gray-50'}`}>
            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              All Clear!
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No compliance issues found
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
        isDarkMode ? 'border-[#37474F]' : 'border-gray-200'
      }`}>
        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Last checked: {formatLastChecked(alertsData.lastChecked)}
        </span>
        {onViewAll && alertsData.alerts.length > maxAlerts && (
          <button
            onClick={onViewAll}
            className={`text-xs font-medium flex items-center gap-1 ${
              isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
            }`}
          >
            View All ({alertsData.alerts.length})
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default VATComplianceAlertsWidget;
