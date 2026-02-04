/**
 * TRNValidationWidget.jsx
 *
 * UAE TRN (Tax Registration Number) Validation Status Widget
 * Tracks TRN validation status for customers and suppliers
 *
 * UAE VAT Compliance - TRN Requirements:
 * - TRN format: 15 digits (100XXXXXXXXXXXX)
 * - TRN must be displayed on all tax invoices
 * - TRN validation via FTA TRN Verification service
 * - Mandatory registration threshold: AED 375,000
 * - Voluntary registration threshold: AED 187,500
 */

import {
  AlertTriangle,
  Building,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  RefreshCw,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

// Mock TRN validation data
const mockTRNData = {
  summary: {
    totalEntities: 156,
    validated: 142,
    invalid: 5,
    pendingVerification: 9,
    validationRate: 91.0,
    lastBatchValidation: "2024-12-26T09:00:00Z",
  },
  byType: {
    customers: {
      total: 98,
      validated: 92,
      invalid: 2,
      pending: 4,
    },
    suppliers: {
      total: 58,
      validated: 50,
      invalid: 3,
      pending: 5,
    },
  },
  recentValidations: [
    {
      id: 1,
      entityType: "customer",
      name: "Al Futtaim Steel Trading LLC",
      trn: "100345678901234",
      status: "valid",
      validatedAt: "2024-12-27T10:30:00Z",
      expiryDate: null,
    },
    {
      id: 2,
      entityType: "supplier",
      name: "Emirates Iron & Steel Co",
      trn: "100987654321098",
      status: "valid",
      validatedAt: "2024-12-27T10:25:00Z",
      expiryDate: null,
    },
    {
      id: 3,
      entityType: "customer",
      name: "Dubai Metal Industries",
      trn: "100111222333444",
      status: "pending",
      validatedAt: null,
      expiryDate: null,
    },
    {
      id: 4,
      entityType: "customer",
      name: "Gulf Construction Materials",
      trn: "10012345678901",
      status: "invalid",
      validatedAt: "2024-12-26T14:20:00Z",
      errorReason: "TRN format invalid (14 digits instead of 15)",
    },
    {
      id: 5,
      entityType: "supplier",
      name: "International Steel Corp",
      trn: "100555666777888",
      status: "expired",
      validatedAt: "2024-06-15T09:00:00Z",
      expiryDate: "2024-12-01",
      errorReason: "Verification expired - needs re-validation",
    },
  ],
  invalidTRNs: [
    {
      id: 1,
      name: "Gulf Construction Materials",
      trn: "10012345678901",
      reason: "Invalid format (14 digits)",
      entityType: "customer",
    },
    {
      id: 2,
      name: "ABC Trading Est",
      trn: "100ABCDEFGHIJ12",
      reason: "Contains non-numeric characters",
      entityType: "customer",
    },
    {
      id: 3,
      name: "XYZ Metals LLC",
      trn: "200123456789012",
      reason: "Invalid prefix (should start with 100)",
      entityType: "supplier",
    },
  ],
};

const TRNValidationWidget = ({
  data = null,
  onValidateTRN: _onValidateTRN = null,
  onBatchValidate = null,
  onViewEntity = null,
  onViewAll = null,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [trnData, setTRNData] = useState(data || mockTRNData);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [_filterType, _setFilterType] = useState("all");

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTRNData(data);
    }
  }, [data]);

  const getStatusConfig = (status) => {
    switch (status) {
      case "valid":
        return {
          label: "Valid",
          icon: CheckCircle,
          bgColor: isDarkMode ? "bg-green-900/30" : "bg-green-50",
          textColor: "text-green-500",
          borderColor: isDarkMode ? "border-green-700" : "border-green-200",
        };
      case "invalid":
        return {
          label: "Invalid",
          icon: XCircle,
          bgColor: isDarkMode ? "bg-red-900/30" : "bg-red-50",
          textColor: "text-red-500",
          borderColor: isDarkMode ? "border-red-700" : "border-red-200",
        };
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          bgColor: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50",
          textColor: "text-yellow-500",
          borderColor: isDarkMode ? "border-yellow-700" : "border-yellow-200",
        };
      case "expired":
        return {
          label: "Expired",
          icon: AlertTriangle,
          bgColor: isDarkMode ? "bg-orange-900/30" : "bg-orange-50",
          textColor: "text-orange-500",
          borderColor: isDarkMode ? "border-orange-700" : "border-orange-200",
        };
      default:
        return {
          label: "Unknown",
          icon: Info,
          bgColor: isDarkMode ? "bg-gray-700" : "bg-gray-100",
          textColor: isDarkMode ? "text-gray-400" : "text-gray-500",
          borderColor: isDarkMode ? "border-gray-600" : "border-gray-200",
        };
    }
  };

  const formatTRN = (trn) => {
    if (!trn || trn.length !== 15) return trn;
    return `${trn.slice(0, 3)}-${trn.slice(3, 7)}-${trn.slice(7, 11)}-${trn.slice(11)}`;
  };

  const filteredValidations = trnData.recentValidations.filter(
    (v) => _filterType === "all" || v.entityType === _filterType
  );

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? "bg-[#1E2328] border-[#37474F] hover:border-teal-600"
          : "bg-white border-[#E0E0E0] hover:border-teal-500"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              trnData.summary.invalid > 0
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : "bg-gradient-to-br from-cyan-500 to-cyan-600"
            }`}
          >
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              TRN Validation
              <span className="relative group">
                <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  15-digit UAE Tax Registration Number
                </span>
              </span>
            </h3>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {trnData.summary.validationRate.toFixed(0)}% validated
            </p>
          </div>
        </div>

        {onBatchValidate && (
          <button
            type="button"
            onClick={onBatchValidate}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-[#2E3B4E] text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            } ${isLoading ? "animate-spin" : ""}`}
            title="Batch Validate All"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-lg font-bold text-green-500`}>{trnData.summary.validated}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Valid</p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-lg font-bold text-red-500`}>{trnData.summary.invalid}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Invalid</p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-lg font-bold text-yellow-500`}>{trnData.summary.pendingVerification}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</p>
        </div>
        <div className={`p-2 rounded-lg text-center ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {trnData.summary.totalEntities}
          </p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total</p>
        </div>
      </div>

      {/* Customer/Supplier Breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-blue-500" />
            <span className={`text-xs font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Customers</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-500">{trnData.byType.customers.validated} valid</span>
            <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>/{trnData.byType.customers.total}</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Building size={14} className="text-purple-500" />
            <span className={`text-xs font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>Suppliers</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-500">{trnData.byType.suppliers.validated} valid</span>
            <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>/{trnData.byType.suppliers.total}</span>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className={`flex rounded-lg p-0.5 mb-3 ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-100"}`}>
        <button
          type="button"
          onClick={() => setSelectedTab("overview")}
          className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
            selectedTab === "overview" ? "bg-teal-500 text-white" : isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Recent
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab("invalid")}
          className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1 ${
            selectedTab === "invalid" ? "bg-teal-500 text-white" : isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Invalid
          {trnData.invalidTRNs.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedTab === "invalid" ? "bg-white text-teal-600" : "bg-red-500 text-white"
              }`}
            >
              {trnData.invalidTRNs.length}
            </span>
          )}
        </button>
      </div>

      {/* Recent Validations Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredValidations.slice(0, 4).map((validation) => {
            const statusConfig = getStatusConfig(validation.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={validation.id}
                onClick={() => onViewEntity?.(validation)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onViewEntity?.(validation);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  statusConfig.bgColor
                } ${statusConfig.borderColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {validation.entityType === "customer" ? (
                      <Users size={14} className="text-blue-500 flex-shrink-0" />
                    ) : (
                      <Building size={14} className="text-purple-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {validation.name}
                      </p>
                      <p className={`text-xs font-mono ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatTRN(validation.trn)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <StatusIcon size={14} className={statusConfig.textColor} />
                    <span className={`text-xs font-medium ${statusConfig.textColor}`}>{statusConfig.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invalid TRNs Tab */}
      {selectedTab === "invalid" && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {trnData.invalidTRNs.length > 0 ? (
            trnData.invalidTRNs.map((invalid) => (
              <div
                key={invalid.id}
                onClick={() => onViewEntity?.(invalid)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onViewEntity?.(invalid);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                  isDarkMode
                    ? "bg-red-900/20 border-red-700 hover:border-red-500"
                    : "bg-red-50 border-red-200 hover:border-red-400"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {invalid.name}
                    </p>
                    <p className={`text-xs font-mono ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {invalid.trn}
                    </p>
                    <p className={`text-xs mt-1 text-red-500`}>{invalid.reason}</p>
                  </div>
                  <XCircle size={16} className="text-red-500 flex-shrink-0 ml-2" />
                </div>
              </div>
            ))
          ) : (
            <div className={`p-6 text-center rounded-lg ${isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}`}>
              <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
              <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>All TRNs Valid</p>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                No invalid TRN records found
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`mt-4 pt-3 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.open("https://tax.gov.ae/en/tax.registration.validation.aspx", "_blank")}
            className={`text-xs flex items-center gap-1 ${
              isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ExternalLink size={12} />
            FTA TRN Lookup
          </button>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className={`text-xs font-medium flex items-center gap-1 ${
                isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
              }`}
            >
              View All
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TRNValidationWidget;
