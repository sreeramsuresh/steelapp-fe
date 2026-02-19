import FormError from "./FormError";
import RequiredIndicator from "./RequiredIndicator";

/**
 * Accessible date input with consistent format and validation
 * Fixes bugs #8, #11, #12: Consistent date format, required indicators, and validation feedback
 *
 * Usage:
 *   <DateInput
 *     label="Invoice Date"
 *     value={date}
 *     onChange={(e) => setDate(e.target.value)}
 *     error={errors.date}
 *     required
 *   />
 */
const DateInput = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText,
  name,
  id,
  min,
  max,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <RequiredIndicator />}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        min={min}
        max={max}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
          error ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
        } ${
          disabled ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-800"
        } text-gray-900 dark:text-white ${className}`}
        {...props}
      />
      {error && <FormError message={error} />}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: DD/MM/YYYY - {helpText}</p>
      )}
    </div>
  );
};

export default DateInput;
