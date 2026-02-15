import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getValidationClasses } from "../forms/ValidatedInput";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * FormSelect - Reusable wrapper around Radix UI Select with validation coloring.
 * Uses shared getValidationClasses() from ValidatedInput.
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

  const validationCls = getValidationClasses({
    isDarkMode,
    showValidation,
    validationState,
    required,
    error: false,
  });

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
          className={`${validationCls} h-[38px] text-sm ${
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
