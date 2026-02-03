import { AlertCircle, Info, RefreshCw } from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";

// ============================================================================
// BASE WIDGET COMPONENT
// Provides consistent styling and structure for all dashboard widgets
// ============================================================================

/**
 * BaseWidget - Foundation component for dashboard widgets
 *
 * @param {Object} props
 * @param {string} props.title - Widget title
 * @param {string} props.description - Widget description/subtitle
 * @param {string} props.tooltip - Tooltip text for info icon
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.iconColor - Gradient class for icon background
 * @param {React.ReactNode} props.children - Widget content
 * @param {React.ReactNode} props.headerAction - Action button in header
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.error - Show error state
 * @param {string} props.errorMessage - Error message to display
 * @param {function} props.onRefresh - Callback for refresh action
 * @param {string} props.size - Widget size: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.noPadding - Remove content padding
 * @param {boolean} props.isStale - Indicate data is stale
 * @param {boolean} props.isMockData - Indicate mock data is being shown
 */
const BaseWidget = ({
  title,
  description,
  tooltip,
  icon: Icon,
  iconColor = "from-teal-600 to-teal-700",
  children,
  headerAction,
  loading = false,
  error = false, // Can be boolean or string message
  errorMessage, // Optional separate error message (deprecated, use error string instead)
  onRefresh,
  size = "md",
  className = "",
  noPadding = false,
  isStale = false,
  isMockData = false,
}) => {
  const { isDarkMode } = useTheme();

  // Size-based min heights
  const sizeClasses = {
    sm: "min-h-32",
    md: "min-h-64",
    lg: "min-h-80",
    xl: "min-h-96",
  };

  return (
    <div
      data-testid="base-widget"
      className={`rounded-xl border transition-all duration-300 hover:shadow-lg ${
        isDarkMode
          ? "bg-[#1E2328] border-[#37474F] hover:border-teal-500/50"
          : "bg-white border-[#E0E0E0] hover:border-teal-500/50"
      } ${sizeClasses[size]} ${className}`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between ${noPadding ? "p-4" : "p-4 pb-0"}`}>
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg flex-shrink-0`}
            >
              <Icon size={20} className="text-white" />
            </div>
          )}
          <div>
            <h3
              className={`text-base font-semibold flex items-center gap-1.5 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
              {tooltip && (
                <span className="relative group">
                  <Info size={14} className="cursor-help opacity-50 hover:opacity-100" />
                  <span
                    className={`hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap normal-case ${
                      isDarkMode
                        ? "bg-gray-700 text-white border border-gray-600"
                        : "bg-yellow-100 text-gray-800 border border-yellow-300"
                    }`}
                  >
                    {tooltip}
                  </span>
                </span>
              )}
              {isStale && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isDarkMode ? "bg-yellow-900/50 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  Stale
                </span>
              )}
              {isMockData && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    isDarkMode ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Demo
                </span>
              )}
            </h3>
            {description && (
              <p className={`text-sm mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              } ${loading ? "animate-spin" : ""}`}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {headerAction}
        </div>
      </div>

      {/* Content */}
      <div className={noPadding ? "" : "p-4"}>
        {loading ? (
          <WidgetLoadingState size={size} isDarkMode={isDarkMode} />
        ) : error ? (
          <WidgetErrorState
            message={typeof error === "string" ? error : errorMessage || "Failed to load data"}
            onRetry={onRefresh}
            isDarkMode={isDarkMode}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

// ============================================================================
// LOADING STATE
// ============================================================================

const WidgetLoadingState = ({ size, isDarkMode }) => {
  const heightClasses = {
    sm: "h-16",
    md: "h-32",
    lg: "h-48",
    xl: "h-64",
  };

  return (
    <div data-testid="loading" role="status" className={`flex items-center justify-center ${heightClasses[size]}`}>
      <div className="flex items-center gap-3">
        <div
          className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
            isDarkMode ? "border-teal-400" : "border-teal-600"
          }`}
        />
        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading...</span>
      </div>
    </div>
  );
};

// ============================================================================
// ERROR STATE
// ============================================================================

const WidgetErrorState = ({ message, onRetry, isDarkMode }) => {
  return (
    <div data-testid="error" className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <AlertCircle size={32} className={`mb-3 ${isDarkMode ? "text-red-400" : "text-red-500"}`} />
      <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          aria-label="Retry"
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
            isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

export const WidgetEmptyState = ({
  icon: Icon,
  title,
  message, // Alias for title (for backward compatibility)
  description,
  action,
  onAction, // Alias for action (for backward compatibility)
  actionLabel,
}) => {
  const { isDarkMode } = useTheme();
  const displayTitle = title || message;
  const handleAction = action || onAction;

  return (
    <div data-testid="empty" className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {Icon && <Icon size={48} className={`mb-4 opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />}
      {displayTitle && (
        <h4 className={`text-base font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {displayTitle}
        </h4>
      )}
      {description && <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{description}</p>}
      {handleAction && actionLabel && (
        <button
          onClick={handleAction}
          className="text-sm px-4 py-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// METRIC DISPLAY COMPONENTS
// ============================================================================

export const MetricValue = ({ value, label, change, changeLabel, size = "md" }) => {
  const { isDarkMode } = useTheme();

  const sizeClasses = {
    sm: { value: "text-lg", label: "text-xs" },
    md: { value: "text-2xl", label: "text-sm" },
    lg: { value: "text-3xl", label: "text-base" },
  };

  const isPositive = change >= 0;

  return (
    <div>
      <p className={`${sizeClasses[size].value} font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
      {label && (
        <p className={`${sizeClasses[size].label} ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      )}
      {change !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 text-sm font-medium ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          <span>
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {changeLabel && <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LIST ITEM COMPONENT
// ============================================================================

export const WidgetListItem = ({
  icon: Icon,
  iconColor = "from-teal-600 to-teal-700",
  title,
  subtitle,
  value,
  subValue,
  onClick,
  rank,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
        onClick ? "cursor-pointer hover:translate-x-1" : ""
      } ${
        isDarkMode
          ? "hover:bg-[#2E3B4E] border-b border-[#37474F] last:border-b-0"
          : "hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
      }`}
    >
      <div className="flex items-center gap-3">
        {rank && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"
            }`}
          >
            #{rank}
          </span>
        )}
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg`}
          >
            <Icon size={16} className="text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</p>
          {subtitle && (
            <p className={`text-xs truncate ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>
          )}
        </div>
      </div>
      {(value || subValue) && (
        <div className="text-right ml-3">
          {value && <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</p>}
          {subValue && <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{subValue}</p>}
        </div>
      )}
    </div>
  );
};

export default BaseWidget;
