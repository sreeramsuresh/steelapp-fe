import { useState } from 'react';
import FormError from './FormError';
import RequiredIndicator from './RequiredIndicator';

/**
 * Currency input with AED formatting and validation
 * Fixes bugs #8, #12, #13: Consistent currency format, required indicators, and validation
 *
 * Usage:
 *   <CurrencyInput
 *     label="Amount"
 *     value={amount}
 *     onChange={(value) => setAmount(value)}
 *     error={errors.amount}
 *     required
 *   />
 */
const CurrencyInput = ({
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
  placeholder = '0.00',
  currency = 'AED',
  ...props
}) => {
  const inputId = id || name;
  const [displayValue, setDisplayValue] = useState(value || '');

  const handleChange = (e) => {
    const inputValue = e.target.value.replace(/[^\d.]/g, ''); // Remove non-numeric characters except decimal point
    if (inputValue === '' || /^\d*\.?\d{0,2}$/.test(inputValue)) {
      setDisplayValue(inputValue);
      onChange(inputValue ? parseFloat(inputValue) : '');
    }
  };

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
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 font-medium">
          {currency}
        </span>
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors ${
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
      </div>
      {error && <FormError message={error} />}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default CurrencyInput;
