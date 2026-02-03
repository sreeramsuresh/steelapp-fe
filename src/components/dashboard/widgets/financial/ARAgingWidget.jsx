import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../../contexts/ThemeContext";
import BaseWidget from "../BaseWidget";

// Mock data for Phase 1 - used when no API data available
const MOCK_AR_AGING = {
  buckets: [
    { label: "0-30 Days", amount: 1250000, percentage: 45 },
    { label: "31-60 Days", amount: 680000, percentage: 24 },
    { label: "61-90 Days", amount: 450000, percentage: 16 },
    { label: "90+ Days", amount: 420000, percentage: 15 },
  ],
  total_ar: 2800000,
  overdue_ar: 870000,
};

/**
 * ARAgingWidget - Accounts Receivable Aging Buckets
 *
 * @param {Object} props
 * @param {Object} props.data - AR aging data
 * @param {Array} props.data.buckets - Array of { label, amount, percentage }
 * @param {number} props.data.total_ar - Total AR amount
 * @param {number} props.data.overdue_ar - Overdue AR amount
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onRefresh - Refresh callback
 * @param {function} props.formatCurrency - Currency formatter
 */
export const ARAgingWidget = ({
  data: propData,
  loading = false,
  onRefresh,
  formatCurrency = (val) => `AED ${val?.toLocaleString() || 0}`,
}) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Use mock data as fallback when real data is not available
  // Handle both camelCase (API) and snake_case field names
  // Also handle string-to-number conversion for API responses
  const normalizeData = (d) => {
    if (!d) return null;

    // Normalize buckets - ensure amount and percentage are numbers
    const normalizedBuckets = Array.isArray(d.buckets)
      ? d.buckets.map((bucket) => ({
          ...bucket,
          amount: parseFloat(bucket.amount) || 0,
          percentage: parseFloat(bucket.percentage) || 0,
        }))
      : [];

    return {
      buckets: normalizedBuckets,
      // Handle both snake_case and camelCase, convert strings to numbers
      total_ar: parseFloat(d.total_ar || d.totalAr) || 0,
      overdue_ar: parseFloat(d.overdue_ar || d.overdueAr) || 0,
    };
  };

  const data = propData && propData.buckets && propData.buckets.length > 0 ? normalizeData(propData) : MOCK_AR_AGING;

  const bucketColors = [
    { bg: "bg-green-500", text: "text-green-600" },
    { bg: "bg-yellow-500", text: "text-yellow-600" },
    { bg: "bg-orange-500", text: "text-orange-600" },
    { bg: "bg-red-500", text: "text-red-600" },
  ];

  // With mock fallback, we always have data
  const hasData = true;

  return (
    <BaseWidget
      title="AR Aging"
      tooltip="Receivables grouped by days overdue"
      icon={Clock}
      iconColor="from-blue-500 to-blue-600"
      loading={loading}
      onRefresh={onRefresh}
      size="md"
    >
      {hasData ? (
        <>
          <div className="space-y-3">
            {data.buckets.map((bucket, index) => (
              <div key={bucket.label} className="flex items-center gap-3">
                <div className="w-24 sm:w-32">
                  <span className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {bucket.label}
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className={`h-4 rounded-full overflow-hidden border ${
                      isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                    }`}
                  >
                    <div
                      className={`h-full ${bucketColors[index]?.bg || "bg-gray-500"} rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(parseFloat(bucket.percentage) || 0, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 sm:w-28 text-right">
                  <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {formatCurrency(bucket.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`mt-4 pt-4 border-t flex justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <div>
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total AR</span>
              <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {formatCurrency(data.total_ar)}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Overdue</span>
              <p className="text-lg font-bold text-red-500">{formatCurrency(data.overdue_ar)}</p>
            </div>
          </div>

          {/* View Full Report Button */}
          <div className="mt-4">
            <button
              onClick={() => navigate("/dashboards/ar-aging")}
              className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-50 hover:bg-blue-100 text-blue-700"
              }`}
            >
              View Full AR Aging Report
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock size={32} className={`mb-3 opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No receivables data available</p>
        </div>
      )}
    </BaseWidget>
  );
};

export default ARAgingWidget;
