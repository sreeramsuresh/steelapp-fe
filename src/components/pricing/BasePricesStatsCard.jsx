/**
 * BasePricesStatsCard - Reusable stat card for dashboard
 *
 * Displays a single statistic with icon, label, and value
 */
export default function BasePricesStatsCard({
  icon: Icon,
  label,
  value,
  isDarkMode,
}) {
  return (
    <div
      className={`p-6 rounded-lg border transition-colors ${
        isDarkMode
          ? "bg-gray-800 border-gray-700 hover:bg-gray-700/50"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {typeof value === "number" && value > 100 ? (
              <>
                {value.toFixed(0)}
              </>
            ) : (
              value
            )}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${isDarkMode ? "text-teal-400" : "text-blue-500"}`} />
      </div>
    </div>
  );
}
