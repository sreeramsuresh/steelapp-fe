import { useTheme } from "../../contexts/ThemeContext";

const PRICE_VALIDITY_OPTIONS = [
  { value: "stock_availability", label: "Subject to stock availability" },
  { value: "lme_rates", label: "Subject to LME rates at time of order" },
  { value: "valid_7_days", label: "Valid for 7 days" },
  { value: "valid_14_days", label: "Valid for 14 days" },
  { value: "valid_30_days", label: "Valid for 30 days" },
  { value: "custom", label: "Custom" },
];

export default function PriceValiditySelector({ value, onChange }) {
  const { isDarkMode } = useTheme();

  return (
    <div className="space-y-2">
      <label
        htmlFor="price-validity"
        className={`block text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
      >
        Price Validity Condition
      </label>
      <select
        id="price-validity"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border ${
          isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
        } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
      >
        <option value="">No specific condition</option>
        {PRICE_VALIDITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {value === "custom" && (
        <input
          type="text"
          placeholder="Enter custom condition"
          value={value.startsWith("custom:") ? value.substring(7) : ""}
          onChange={(e) => onChange(`custom:${e.target.value}`)}
          className={`w-full px-3 py-2 mt-2 rounded-lg border ${
            isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
          } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
        />
      )}
      {value && (
        <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          This condition will appear on the quotation PDF.
        </p>
      )}
    </div>
  );
}
