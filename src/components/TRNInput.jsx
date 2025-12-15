/**
 * TRN Input Component with Real-time Validation
 *
 * UAE Federal Decree-Law No. 8 of 2017, Article 65
 * Format: 15 digits exactly (displayed as XXX-XXXX-XXXX-XXXX)
 *
 * Features:
 * - Accepts only digits (strips non-numeric characters)
 * - Shows immediate validation feedback
 * - Displays formatted TRN when complete
 * - Prevents form submission if invalid
 */

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { trnService } from '../services/trnService';

const TRNInput = ({
  value = '',
  onChange,
  onValidChange,
  name = 'trn',
  label = 'Tax Registration Number (TRN)',
  placeholder = '100-1234-5678-9123',
  required = false,
  disabled = false,
  className = '',
  showFormatHint = true,
}) => {
  const { isDarkMode } = useTheme();
  const [localValue, setLocalValue] = useState(value);
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [isTouched, setIsTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync with external value
  useEffect(() => {
    if (value !== localValue) {
      const result = trnService.handleInput(value);
      setLocalValue(result.value);
      setDisplayValue(result.isComplete ? result.displayValue : result.value);
      setIsValid(result.isValid);
    }
  }, [value]);

  // Handle input change
  const handleChange = useCallback(
    (e) => {
      const input = e.target.value;
      const result = trnService.handleInput(input);

      setLocalValue(result.value);
      setDisplayValue(result.value); // Show raw while typing
      setIsValid(result.isValid);
      setIsTouched(true);

      // Set error message
      if (result.value.length > 0 && result.value.length < 15) {
        setErrorMessage(`TRN must be 15 digits (${result.value.length}/15)`);
      } else if (result.value.length === 0 && required) {
        setErrorMessage('TRN is required');
      } else {
        setErrorMessage('');
      }

      // Call parent onChange with clean value
      onChange?.(result.value);
      onValidChange?.(result.isValid);
    },
    [onChange, onValidChange, required]
  );

  // Handle blur - show formatted value if complete
  const handleBlur = useCallback(() => {
    setIsTouched(true);
    if (localValue.length === 15) {
      setDisplayValue(trnService.formatForDisplay(localValue));
    }

    // Show error if required and empty
    if (required && !localValue) {
      setErrorMessage('TRN is required');
      setIsValid(false);
    }
  }, [localValue, required]);

  // Handle focus - show raw value for editing
  const handleFocus = useCallback(() => {
    setDisplayValue(localValue);
  }, [localValue]);

  // Get border color based on validation state
  const getBorderColor = () => {
    if (!isTouched) return isDarkMode ? 'border-gray-600' : 'border-gray-300';
    if (isValid === true) return 'border-green-500';
    if (isValid === false || (required && !localValue)) return 'border-red-500';
    if (localValue.length > 0 && localValue.length < 15) return 'border-orange-500';
    return isDarkMode ? 'border-gray-600' : 'border-gray-300';
  };

  // Get status icon
  const renderStatusIcon = () => {
    if (!isTouched || !localValue) return null;

    if (isValid === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (localValue.length > 0 && localValue.length < 15) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }

    if (isValid === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return null;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          className={`block text-sm font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          name={name}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={19} // Allow for formatted input with dashes
          className={`w-full px-3 py-2 pr-10 text-sm border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-teal-500
            transition-colors duration-200
            ${isDarkMode
              ? 'bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
            } ${getBorderColor()}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {renderStatusIcon()}
        </div>
      </div>

      {/* Error message */}
      {isTouched && errorMessage && (
        <p className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {errorMessage}
        </p>
      )}

      {/* Format hint */}
      {showFormatHint && !errorMessage && (
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          UAE TRN: 15 digits (e.g., 100-1234-5678-9123)
        </p>
      )}
    </div>
  );
};

export default TRNInput;
