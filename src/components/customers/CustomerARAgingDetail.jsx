import { AlertTriangle, Clock, CreditCard, RefreshCw, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { apiClient } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/invoiceUtils";

/**
 * Customer AR Aging Detail Component
 *
 * Deep-dive view showing AR aging buckets and credit information
 * for a specific customer. Designed to be used in a tab on the
 * customer detail page.
 *
 * @param {Object} props
 * @param {number} props.customerId - Customer ID to fetch AR data for
 */
export default function CustomerARAgingDetail({ customerId }) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch customer AR aging data
  const fetchCustomerARAging = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/reports/ar-aging/${customerId}`);
      setData(response);
    } catch (err) {
      console.error("Failed to fetch customer AR aging:", err);
      setError(err.message || "Failed to load AR aging data");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerARAging();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, fetchCustomerARAging]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-6 rounded-lg ${isDarkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"} border`}
      >
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={20} className="text-red-500" />
          <p className={`font-medium ${isDarkMode ? "text-red-400" : "text-red-700"}`}>Error Loading Data</p>
        </div>
        <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>{error}</p>
        <button
          type="button"
          onClick={fetchCustomerARAging}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-6 text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        No AR aging data available for this customer
      </div>
    );
  }

  // Calculate credit available
  const creditAvailable = (data.creditLimit || 0) - (data.creditUsed || 0);
  const creditUtilizationPct = data.creditLimit > 0 ? (data.creditUsed / data.creditLimit) * 100 : 0;

  // Determine risk level based on 90+ days and credit utilization
  const isHighRisk = (data.aging90Plus || 0) > 0 || creditUtilizationPct > 90;
  const isMediumRisk = (data.aging61To90 || 0) > 0 || creditUtilizationPct > 75;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600`}>
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>AR Aging Analysis</h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {data.customerName} ({data.customerCode})
            </p>
          </div>
        </div>

        {/* Risk Badge */}
        {isHighRisk ? (
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">
            High Risk
          </span>
        ) : isMediumRisk ? (
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
            Medium Risk
          </span>
        ) : (
          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
            Low Risk
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-500" />
            <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Total AR</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatCurrency(data.totalAr)}
          </p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
            Overdue: {formatCurrency(data.totalOverdue)}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-purple-500" />
            <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>DSO (Days)</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{data.dsoDays}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
            Payment Terms: {data.paymentTermsDays ? `${data.paymentTermsDays} days` : "N/A"}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-green-500" />
            <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Credit Grade</p>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {data.creditGrade || "N/A"}
          </p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
            Score: {data.creditScore?.toFixed(0) || "N/A"}
          </p>
        </div>
      </div>

      {/* AR Aging Buckets */}
      <div
        className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          AR Aging Buckets
        </h3>

        <div className="space-y-4">
          {/* Current */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Current (Not Overdue)
              </span>
              <span className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(data.agingCurrent)}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: data.totalAr > 0 ? `${((data.agingCurrent || 0) / data.totalAr) * 100}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* 1-30 Days */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                1-30 Days Overdue
              </span>
              <span
                className={`text-sm font-bold ${data.aging1To30 > 0 ? "text-yellow-600" : isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(data.aging1To30)}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                style={{
                  width: data.totalAr > 0 ? `${((data.aging1To30 || 0) / data.totalAr) * 100}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* 31-60 Days */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                31-60 Days Overdue
              </span>
              <span
                className={`text-sm font-bold ${data.aging31To60 > 0 ? "text-orange-600" : isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(data.aging31To60)}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{
                  width: data.totalAr > 0 ? `${((data.aging31To60 || 0) / data.totalAr) * 100}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* 61-90 Days */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                61-90 Days Overdue
              </span>
              <span
                className={`text-sm font-bold ${data.aging61To90 > 0 ? "text-red-500" : isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(data.aging61To90)}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-500"
                style={{
                  width: data.totalAr > 0 ? `${((data.aging61To90 || 0) / data.totalAr) * 100}%` : "0%",
                }}
              />
            </div>
          </div>

          {/* 90+ Days */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                90+ Days Overdue
              </span>
              <span
                className={`text-sm font-bold ${data.aging90Plus > 0 ? "text-red-700" : isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatCurrency(data.aging90Plus)}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-500"
                style={{
                  width: data.totalAr > 0 ? `${((data.aging90Plus || 0) / data.totalAr) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Credit Information */}
      <div
        className={`p-6 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-white"} border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Credit Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Credit Limit</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(data.creditLimit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Credit Used</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatCurrency(data.creditUsed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Available Credit</span>
                <span className={`text-sm font-bold ${creditAvailable > 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(creditAvailable)}
                </span>
              </div>
            </div>

            {/* Credit Utilization Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Credit Utilization</span>
                <span
                  className={`text-xs font-medium ${creditUtilizationPct > 90 ? "text-red-600" : creditUtilizationPct > 75 ? "text-yellow-600" : "text-green-600"}`}
                >
                  {creditUtilizationPct.toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    creditUtilizationPct > 90
                      ? "bg-red-600"
                      : creditUtilizationPct > 75
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(creditUtilizationPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Last Payment Date</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {data.lastPaymentDate ? formatDate(data.lastPaymentDate) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Payment History Score
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {data.paymentHistoryScore?.toFixed(0) || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Credit Utilization %
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {data.creditUtilizationPercentage?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
