import { Plus, Search } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Empty state for line items section.
 *
 * @param {Object} props
 * @param {string} [props.title] - Title text
 * @param {string} [props.description] - Description text
 * @param {string} [props.buttonText] - CTA button text
 * @param {Function} props.onAdd - Called when CTA button is clicked
 */
export default function LineItemEmptyState({
  title = "No line items yet",
  description = "Search for products or click the button below to start adding items.",
  buttonText = "Add First Item",
  onAdd,
}) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`text-center py-12 border-2 border-dashed rounded-[10px] ${
        isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
          isDarkMode ? "bg-teal-900/40 text-teal-400" : "bg-teal-50 text-teal-500"
        }`}
      >
        <Search size={24} />
      </div>
      <div className={`text-[15px] font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</div>
      <div className={`text-[13px] mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{description}</div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-md text-[13px] font-semibold hover:bg-teal-700 transition-colors shadow-sm hover:shadow-md hover:-translate-y-px"
      >
        <Plus size={15} />
        {buttonText}
      </button>
    </div>
  );
}
