import { useId, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { getValidationClasses } from "../forms/ValidatedInput";

const Input = ({
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

  const validationCls = getValidationClasses({
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
        } ${validationCls} ${className}`}
        {...props}
      />
      {error && <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>}
    </div>
  );
};

export default Input;
