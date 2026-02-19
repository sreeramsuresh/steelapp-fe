import { useTheme } from "../../contexts/ThemeContext";

/**
 * BulkActionBar — Floating bar shown when items are selected, providing bulk actions.
 *
 * @param {number}     selectedCount  - Number of items selected
 * @param {Function}   onClearAll     - Clear selection
 * @param {ReactNode}  children       - Action buttons to render inside the bar
 */
export default function BulkActionBar({ selectedCount, onClearAll, children }) {
  const { isDarkMode } = useTheme();

  if (!selectedCount) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg border ${
        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
      {children}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Clear
      </button>
    </div>
  );
}
