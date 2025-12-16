/**
 * VATCollectionWidget.jsx
 *
 * UAE VAT Collection Summary Widget
 * Displays Output VAT (collected), Input VAT (paid), and Net VAT position
 *
 * UAE VAT Compliance:
 * - Standard rate: 5%
 * - Output VAT: VAT collected from customers on sales
 * - Input VAT: VAT paid to suppliers on purchases
 * - Net VAT: Output VAT - Input VAT (payable if positive, refundable if negative)
 */

import { useState, useEffect } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Info,
  RefreshCw,
} from "lucide-react";

// Mock data for demonstration - replace with actual API calls
const mockVATData = {
  currentQuarter: {
    period: "Q4 2024",
    periodStart: "2024-10-01",
    periodEnd: "2024-12-31",
    outputVAT: 125750.0,
    inputVAT: 89420.5,
    netVAT: 36329.5,
    dueDate: "2025-01-28",
    daysUntilDue: 31,
  },
  previousQuarter: {
    period: "Q3 2024",
    outputVAT: 112500.0,
    inputVAT: 78900.0,
    netVAT: 33600.0,
  },
  yearToDate: {
    outputVAT: 485250.0,
    inputVAT: 342180.5,
    netVAT: 143069.5,
  },
};

const VATCollectionWidget = ({
  data = null,
  onRefresh = null,
  onViewDetails = null,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [vatData, setVatData] = useState(data || mockVATData);

  useEffect(() => {
    if (data) {
      setVatData(data);
    }
  }, [data]);

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(safeAmount);
  };

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentData = vatData.currentQuarter;
  const previousData = vatData.previousQuarter;

  const outputVATChange = calculateChange(
    currentData.outputVAT,
    previousData.outputVAT,
  );
  const inputVATChange = calculateChange(
    currentData.inputVAT,
    previousData.inputVAT,
  );
  const _netVATChange = calculateChange(
    currentData.netVAT,
    previousData.netVAT,
  );

  const isNetPayable = currentData.netVAT >= 0;

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              VAT Collection
              <span className="relative group">
                <Info
                  size={14}
                  className="cursor-help opacity-50 hover:opacity-100"
                />
                <span
                  className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap ${
                    isDarkMode
                      ? "bg-gray-700 text-white"
                      : "bg-yellow-100 text-gray-800 border border-yellow-300"
                  }`}
                >
                  UAE VAT at 5% - Output minus Input VAT
                </span>
              </span>
            </h3>
            <p
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {currentData.period}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className={`text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isDarkMode
                ? "bg-[#2E3B4E] border-[#37474F] text-white"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            <option value="current">Current Quarter</option>
            <option value="previous">Previous Quarter</option>
            <option value="ytd">Year to Date</option>
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-[#2E3B4E] text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              } ${isLoading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* VAT Summary Cards */}
      <div className="space-y-3">
        {/* Output VAT */}
        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Output VAT (Collected)
              </p>
              <p
                className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(currentData.outputVAT)}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                outputVATChange >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {outputVATChange >= 0 ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {Math.abs(outputVATChange).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Input VAT */}
        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Input VAT (Paid)
              </p>
              <p
                className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(currentData.inputVAT)}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                inputVATChange >= 0
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {inputVATChange >= 0 ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {Math.abs(inputVATChange).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Net VAT Position */}
        <div
          className={`p-3 rounded-lg border-2 ${
            isNetPayable
              ? isDarkMode
                ? "bg-red-900/20 border-red-700"
                : "bg-red-50 border-red-200"
              : isDarkMode
                ? "bg-green-900/20 border-green-700"
                : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-xs font-medium ${
                  isNetPayable
                    ? isDarkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : isDarkMode
                      ? "text-green-400"
                      : "text-green-600"
                }`}
              >
                Net VAT {isNetPayable ? "Payable" : "Refundable"}
              </p>
              <p
                className={`text-xl font-bold ${
                  isNetPayable
                    ? isDarkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : isDarkMode
                      ? "text-green-400"
                      : "text-green-600"
                }`}
              >
                {formatCurrency(Math.abs(currentData.netVAT))}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isNetPayable
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {isNetPayable ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Due Date */}
      <div
        className={`mt-4 pt-3 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar
              size={14}
              className={isDarkMode ? "text-gray-400" : "text-gray-500"}
            />
            <span
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Payment Due:{" "}
              {new Date(currentData.dueDate).toLocaleDateString("en-AE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              currentData.daysUntilDue <= 7
                ? "bg-red-100 text-red-700"
                : currentData.daysUntilDue <= 14
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {currentData.daysUntilDue} days left
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className={`mt-2 h-2 rounded-full overflow-hidden ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              currentData.daysUntilDue <= 7
                ? "bg-red-500"
                : currentData.daysUntilDue <= 14
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{
              width: `${Math.max(100 - (currentData.daysUntilDue / 90) * 100, 5)}%`,
            }}
          />
        </div>
      </div>

      {/* Action Button */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            isDarkMode
              ? "bg-teal-600 hover:bg-teal-500 text-white"
              : "bg-teal-500 hover:bg-teal-600 text-white"
          }`}
        >
          View VAT Details
        </button>
      )}
    </div>
  );
};

export default VATCollectionWidget;
