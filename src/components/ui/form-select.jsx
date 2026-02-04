import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * FormSelect - Reusable wrapper around Radix UI Select that mimics the custom Select API
 * used in InvoiceForm and other forms.
 *
 * Features:
 * - Validation state styling (valid/invalid/untouched) - matches Input component exactly
 * - Required field indicator (red asterisk)
 * - Dark mode support matching existing Input component colors
 * - Consistent label and spacing
 */
export function FormSelect({
  label,
  value,
  onValueChange,
  required = false,
  validationState = null,
  showValidation = true,
  disabled = false,
  placeholder = "Select...",
  children,
  className = "",
  id,
  "data-testid": dataTestId,
  ...props
}) {
  const { isDarkMode } = useTheme();
  const selectId =
    id ||
    `select-${String(label || "")
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  // Determine border and background color based on validation state
  // EXACTLY matching Input component logic from InvoiceForm.jsx lines 830-857
  const getValidationClasses = () => {
    // If validation highlighting is disabled, show default styles
    if (!showValidation) {
      return isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white";
    }

    if (validationState === "invalid") {
      return isDarkMode ? "border-red-500 bg-red-900/10" : "border-red-500 bg-red-50";
    }
    if (validationState === "valid") {
      return isDarkMode ? "border-green-500 bg-green-900/10" : "border-green-500 bg-green-50";
    }
    if (required && validationState === null) {
      // Untouched required field - show subtle indication
      return isDarkMode ? "border-yellow-600/50 bg-yellow-900/5" : "border-yellow-400/50 bg-yellow-50/30";
    }
    return isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white";
  };

  return (
    <div className={`space-y-0.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ""}`}
        >
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled} {...props}>
        <SelectTrigger
          id={selectId}
          data-testid={dataTestId}
          className={`${getValidationClasses()} h-[38px] text-sm ${
            isDarkMode
              ? "text-white disabled:bg-gray-700 disabled:text-gray-500"
              : "text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
