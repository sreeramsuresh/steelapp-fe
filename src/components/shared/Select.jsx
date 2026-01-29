import FormError from './FormError';
import RequiredIndicator from './RequiredIndicator';

/**
 * Accessible select dropdown with label, error handling, and required indicator
 * Fixes bugs #8, #9, #12: Consistent selects with visual hierarchy, required indicators, and validation
 *
 * Usage:
 *   <Select
 *     label="Grade"
 *     value={grade}
 *     onChange={(e) => setGrade(e.target.value)}
 *     error={errors.grade}
 *     required
 *     options={[
 *       { value: '', label: 'Select grade...' },
 *       { value: '304', label: '304' },
 *       { value: '316L', label: '316L' },
 *     ]}
 *   />
 */
const Select = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  helpText,
  name,
  id,
  options = [],
  placeholder = 'Select an option...',
  ...props
}) => {
  const selectId = id || name;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <RequiredIndicator />}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors appearance-none ${
          error
            ? 'border-red-500 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600'
        } ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-white dark:bg-gray-800'
        } text-gray-900 dark:text-white ${className}`}
        {...props}
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <FormError message={error} />}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Select;
