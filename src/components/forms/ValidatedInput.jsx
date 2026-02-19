import { useId, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Get CSS classes for validation state coloring.
 * Shared by ValidatedInput, FormSelect, and any future validated form controls.
 *
 * @param {{ isDarkMode: boolean, showValidation: boolean, validationState: 'valid'|'invalid'|null, required: boolean, error: boolean }} opts
 * @returns {string} Tailwind classes for border + background
 */
export function getValidationClasses({ isDarkMode, showValidation, validationState, required, error }) {
  if (!showValidation) {
    return isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white";
  }
  if (error || validationState === "invalid") {
    return isDarkMode ? "border-red-500 bg-red-900/10" : "border-red-500 bg-red-50";
  }
  if (validationState === "valid") {
    return isDarkMode ? "border-green-500 bg-green-900/10" : "border-green-500 bg-green-50";
  }
  if (required && validationState === null) {
    return isDarkMode ? "border-yellow-600/50 bg-yellow-900/5" : "border-yellow-400/50 bg-yellow-50/30";
  }
  return isDarkMode ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white";
}

/**
 * ValidatedInput — reusable text/date/number input with validation coloring.
 *
 * Props:
 * - label, required, error (string), validationState ('valid'|'invalid'|null)
 * - showValidation (boolean, default true)
 * - All standard <input> props via spread
 */
const ValidatedInput = ({
  label,
  error,
  className = "",
  required = false,
  validationState = null,
  showValidation = true,
  id,
  "data-testid": dataTestId,
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const generatedId = useId();
  const inputId = useMemo(() => id || generatedId, [id, generatedId]);

  const validationClasses = getValidationClasses({
    isDarkMode,
    showValidation,
    validationState,
    required,
    error: !!error,
  });

  return (
    <div className="space-y-0.5">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs font-medium ${
            isDarkMode ? "text-gray-400" : "text-gray-700"
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ""}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        data-testid={dataTestId}
        className={`w-full px-2 py-2 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 h-[38px] ${
          isDarkMode
            ? "text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
            : "text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400"
        } ${validationClasses} ${className}`}
        {...props}
      />
      {error && <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>}
    </div>
  );
};

export default ValidatedInput;
