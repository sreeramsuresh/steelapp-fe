import { useTheme } from "../../contexts/ThemeContext";

/**
 * ConfigurableTable — Data table with configurable columns, row click, and empty state.
 *
 * @param {Object[]} columns        - Column definitions: { key, label, align, width, render }
 * @param {Object[]} data           - Array of row objects
 * @param {boolean}  loading        - Show loading state
 * @param {Function} [onRowClick]   - Called with (row) when a row is clicked
 * @param {string}   [rowKey]       - Property name for React key (default "id")
 * @param {ReactNode} [emptyState]  - Custom empty state content
 * @param {ReactNode} [footer]      - Footer content (e.g. pagination)
 */
export default function ConfigurableTable({
  columns = [],
  data = [],
  loading,
  onRowClick,
  rowKey = "id",
  emptyState,
  footer,
}) {
  const { isDarkMode } = useTheme();
  const colCount = columns.length;

  return (
    <div
      className={`rounded-lg border overflow-hidden ${isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-gray-200"}`}
    >
      <div className="overflow-auto">
        <table className="min-w-full divide-y">
          <thead>
            <tr className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-xs uppercase ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.width || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className={`px-4 py-12 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {emptyState || (
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-medium">No records found</p>
                      <p className="text-sm">Try adjusting your filters.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[rowKey]}
                  className={`${isDarkMode ? "hover:bg-[#2E3B4E]" : "hover:bg-gray-50"} ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.cellClassName || ""}`}
                      onClick={col.stopPropagation ? (e) => e.stopPropagation() : undefined}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
