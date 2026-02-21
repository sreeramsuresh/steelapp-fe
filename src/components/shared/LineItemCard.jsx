import { Trash2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Two-row card layout wrapper for line items.
 * Each form provides its own field content via row1Content and row2Content render props.
 *
 * @param {Object} props
 * @param {number} props.index - Zero-based index (displayed as index+1)
 * @param {boolean} [props.isActive] - Whether this card is focused/active
 * @param {React.ReactNode} props.row1Content - Content for the first row (product, qty, uom)
 * @param {React.ReactNode} props.row2Content - Content for the second row (rate, channel, vat, etc.)
 * @param {string} [props.amountDisplay] - Formatted amount string (e.g., "AED 14,750.00")
 * @param {string} [props.amountBreakdown] - Breakdown text (e.g., "50 pcs × 295.00/MT")
 * @param {Function} props.onDelete - Called when delete button is clicked
 * @param {boolean} [props.disabled] - If true, delete is disabled
 * @param {boolean} [props.isNew] - If true, applies slide-in animation
 * @param {string} [props.className] - Additional classes
 */
export default function LineItemCard({
  index,
  isActive = false,
  row1Content,
  row2Content,
  row3Content,
  amountDisplay,
  amountBreakdown,
  onDelete,
  disabled = false,
  className = "",
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`
        relative border rounded-[10px] transition-all duration-200 animate-line-item-slide-in
        ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
        ${isActive ? (isDarkMode ? "border-teal-500 shadow-[0_0_0_3px_rgba(13,148,136,0.15)]" : "border-teal-500 shadow-[0_0_0_3px_rgba(13,148,136,0.1)]") : isDarkMode ? "hover:border-gray-600 hover:shadow-sm" : "hover:border-gray-300 hover:shadow-sm"}
        ${className}
      `}
      style={{ padding: "16px 18px 14px" }}
    >
      {/* Row Number Badge */}
      <div
        className="absolute flex items-center justify-center rounded-full bg-teal-600 text-white text-[11px] font-bold font-mono shadow-sm"
        style={{ left: -10, top: 18, width: 22, height: 22 }}
      >
        {index + 1}
      </div>

      {/* Row 1: Product + Quantity + UOM area */}
      <div className="mb-2.5">{row1Content}</div>

      {/* Dashed Divider */}
      <div className={`border-t border-dashed ${isDarkMode ? "border-gray-700" : "border-gray-200"} mb-2.5`} />

      {/* Row 2: Grade, Finish, Dimensions, Origin, Unit Price */}
      <div className="flex items-center gap-3 flex-wrap">
        {row2Content}

        {/* Spacer */}
        <div className="flex-1" />
      </div>

      {/* Row 3: Specifications (optional) */}
      {row3Content && (
        <>
          <div className={`border-t border-dashed ${isDarkMode ? "border-gray-700" : "border-gray-200"} my-2.5`} />
          <div>{row3Content}</div>
        </>
      )}

      {/* Amount + Delete — always last */}
      <div className="flex items-center justify-end gap-3 mt-2.5">
        {/* Amount Display */}
        {amountDisplay && (
          <div className="text-right flex-shrink-0 min-w-[120px]">
            <div
              className={`font-mono text-base font-semibold tracking-tight ${amountDisplay === "0.00" || amountDisplay?.includes("0.00") ? (isDarkMode ? "text-gray-500" : "text-gray-400") : isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {amountDisplay}
            </div>
            {amountBreakdown && (
              <div className={`text-[11px] font-mono mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {amountBreakdown}
              </div>
            )}
          </div>
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
            disabled
              ? isDarkMode
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 cursor-not-allowed"
              : isDarkMode
                ? "text-gray-500 hover:bg-red-900/30 hover:text-red-400"
                : "text-gray-400 hover:bg-red-50 hover:text-red-500"
          }`}
          title="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
