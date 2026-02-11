import { Plus, Trash2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * LineItemTable — Standardized line-item table for ERP forms (invoices, POs, quotations, etc.)
 *
 * Provides:
 * - Column-defined layout with configurable widths
 * - Add/remove item rows
 * - Header row + body rows rendered via column.render(item, index)
 * - Totals row rendered via footer prop
 *
 * @param {Object[]} columns      - Column definitions: { key, label, width, align, render(item, idx) }
 * @param {Object[]} items        - Array of line item objects
 * @param {Function} onAddItem    - Called to add a new line item
 * @param {Function} onRemoveItem - Called with (index) to remove a line item
 * @param {boolean}  [readOnly]   - Disable add/remove
 * @param {ReactNode} [footer]    - Content below the table (subtotals, totals row)
 * @param {string}   [addLabel]   - Label for add button (default "Add Item")
 */
export default function LineItemTable({
  columns = [],
  items = [],
  onAddItem,
  onRemoveItem,
  readOnly,
  footer,
  addLabel = "Add Item",
}) {
  const { isDarkMode } = useTheme();

  const headerBg = isDarkMode ? "bg-gray-900/60" : "bg-gray-50";
  const borderCls = isDarkMode ? "border-gray-700" : "border-gray-200";
  const rowHover = isDarkMode ? "hover:bg-gray-800/40" : "hover:bg-gray-50/60";

  return (
    <div className={`border rounded-xl overflow-hidden ${borderCls}`}>
      {/* Header */}
      <div className={`flex items-center ${headerBg} border-b ${borderCls} px-2 py-2`}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            } ${col.align === "right" ? "text-right" : "text-left"}`}
            style={{ width: col.width }}
          >
            {col.label}
          </div>
        ))}
        {!readOnly && <div style={{ width: "4%" }} />}
      </div>

      {/* Rows */}
      {items.map((item, idx) => (
        <div
          key={item.id || item._key || idx}
          className={`flex items-start px-2 py-2 border-b ${borderCls} ${rowHover} transition-colors`}
        >
          {columns.map((col) => (
            <div
              key={col.key}
              className={`px-1.5 ${col.align === "right" ? "text-right" : ""}`}
              style={{ width: col.width }}
            >
              {col.render(item, idx)}
            </div>
          ))}
          {!readOnly && (
            <div style={{ width: "4%" }} className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={() => onRemoveItem(idx)}
                className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                title="Remove item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add Item */}
      {!readOnly && onAddItem && (
        <div className={`px-2 py-2 border-b ${borderCls}`}>
          <button
            type="button"
            onClick={onAddItem}
            className={`flex items-center gap-1.5 text-xs font-medium ${
              isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
            } transition-colors`}
          >
            <Plus size={14} />
            {addLabel}
          </button>
        </div>
      )}

      {/* Footer / Totals */}
      {footer && <div className={`px-2 py-2 ${headerBg}`}>{footer}</div>}
    </div>
  );
}
