import { Download, Filter, RefreshCw } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * PrimaryFilters — Single-row filter bar with search, status, date range, and action buttons.
 *
 * @param {Object}   props
 * @param {ReactNode} props.children           - Additional filter controls injected into the row
 * @param {Object}   [props.search]            - { value, onChange, placeholder, ariaLabel, id }
 * @param {Object}   [props.dateRange]         - { start, end, onStartChange, onEndChange }
 * @param {Function} props.onApply             - Called when Apply button clicked
 * @param {boolean}  [props.showAdvanced]      - Whether advanced panel is showing
 * @param {Function} [props.onToggleAdvanced]  - Toggle advanced filters
 * @param {Function} [props.onExport]          - Export handler (shows Export button if provided)
 * @param {boolean}  [props.loading]           - Disables Apply when true
 * @param {ReactNode} [props.advancedContent]  - Content rendered in collapsible advanced panel
 */
export default function PrimaryFilters({
  children,
  search,
  dateRange,
  onApply,
  showAdvanced,
  onToggleAdvanced,
  onExport,
  loading,
  advancedContent,
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`p-3 rounded-lg border ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
    >
      <div className="flex flex-wrap gap-2 items-center">
        {search && (
          <input
            id={search.id}
            name={search.name}
            placeholder={search.placeholder || "Search..."}
            value={search.value}
            onChange={search.onChange}
            className="px-3 py-2 rounded border min-w-[200px] flex-1 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            aria-label={search.ariaLabel || search.placeholder}
          />
        )}

        {children}

        {dateRange && (
          <>
            <input
              id={dateRange.startId}
              name="startDate"
              type="date"
              value={dateRange.start}
              onChange={dateRange.onStartChange}
              className="px-2 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              aria-label="Start date"
            />
            <span className="opacity-70 shrink-0">to</span>
            <input
              id={dateRange.endId}
              name="endDate"
              type="date"
              value={dateRange.end}
              onChange={dateRange.onEndChange}
              className="px-2 py-2 rounded border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              aria-label="End date"
            />
          </>
        )}

        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="px-3 py-2 rounded bg-teal-600 text-white flex items-center gap-1.5 text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} />
          Apply
        </button>

        {onToggleAdvanced && (
          <button
            type="button"
            onClick={onToggleAdvanced}
            className={`px-3 py-2 rounded border flex items-center gap-1.5 text-sm transition-colors ${
              showAdvanced
                ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-300"
                : "dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <Filter size={14} />
            More
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="px-3 py-2 rounded border flex items-center gap-1.5 text-sm dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>

      {/* Advanced Filters (collapsible) */}
      {showAdvanced && advancedContent && (
        <div
          className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}
        >
          {advancedContent}
        </div>
      )}
    </div>
  );
}

/**
 * AdvancedFilterField — A labeled field for use inside the advanced filters panel.
 */
export function AdvancedFilterField({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium mb-1 opacity-70">
        {label}
      </label>
      {children}
    </div>
  );
}
