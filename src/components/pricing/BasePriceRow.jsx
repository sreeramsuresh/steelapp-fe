import { Check, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * BasePriceRow - Table row component with inline price editing
 *
 * Shows product details and allows inline editing of selling_price
 */
export default function BasePriceRow({
  item,
  isDarkMode,
  isSelected,
  onToggleSelect,
  isEditing,
  editingPrice,
  onStartEdit,
  onCancelEdit,
  onPriceChange,
  onSavePrice,
}) {
  const { isDarkMode: theme } = useTheme();
  const darkMode = isDarkMode !== undefined ? isDarkMode : theme;
  const product = item.product || {};

  const rowBgColor = isSelected
    ? darkMode
      ? "bg-teal-900/30"
      : "bg-teal-50"
    : darkMode
      ? "hover:bg-gray-700/50"
      : "hover:bg-gray-50";

  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <tr className={`border-b ${borderColor} transition-colors ${rowBgColor}`}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 cursor-pointer"
          aria-label={`Select ${product.name || "product"}`}
        />
      </td>

      {/* Product Name */}
      <td className={`px-4 py-3 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
        <div className="font-medium">{product.name || "Unknown"}</div>
        <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>ID: {item.product_id}</div>
      </td>

      {/* Grade */}
      <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{product.grade || "-"}</td>

      {/* Form */}
      <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {product.form_type || "-"}
      </td>

      {/* Price - Inline Editable */}
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <span className={`absolute right-10 top-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>د.إ</span>
              <input
                type="number"
                value={editingPrice}
                onChange={(e) => onPriceChange(e.target.value === "" ? "" : Number(e.target.value))}
                step="0.01"
                min="0"
                className={`w-24 px-2 py-1 text-right text-sm border rounded transition-colors ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:border-teal-500 focus:ring-teal-500"
                    : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                } focus:outline-none focus:ring-1`}
              />
            </div>
            <button
              type="button"
              onClick={onSavePrice}
              className={`p-1 rounded transition-colors ${
                darkMode
                  ? "bg-green-900/40 hover:bg-green-900/60 text-green-300"
                  : "bg-green-100 hover:bg-green-200 text-green-700"
              }`}
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className={`p-1 rounded transition-colors ${
                darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-400" : "bg-gray-200 hover:bg-gray-300 text-gray-600"
              }`}
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            className={`px-2 py-1 rounded transition-colors font-medium text-right w-full ${
              darkMode ? "text-teal-300 hover:bg-teal-900/20" : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            AED {(item.selling_price || 0).toFixed(2)}
          </button>
        )}
      </td>

      {/* Last Updated */}
      <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        {item.updated_at
          ? new Date(item.updated_at).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-"}
      </td>
    </tr>
  );
}
