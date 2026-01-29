import FormError from './FormError';
import RequiredIndicator from './RequiredIndicator';

/**
 * Accessible text input with label, error handling, and required indicator
 * Fixes bugs #8, #12: Consistent required indicators and validation feedback
 *
 * Usage:
 *   <TextInput
 *     label="Email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     error={errors.email}
 *     required
 *   />
 */
const TextInput = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  type = 'text',
  className = '',
  helpText,
  name,
  id,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <RequiredIndicator />}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
          error
            ? 'border-red-500 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        } ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800'
        } text-gray-900 dark:text-white ${className}`}
        {...props}
      />
      {error && <FormError message={error} />}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default TextInput;
