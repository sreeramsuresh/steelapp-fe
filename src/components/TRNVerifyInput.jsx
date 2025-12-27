/**
 * TRN Verify Input Component
 *
 * A reusable input component for Tax Registration Number (TRN) with:
 * - Real-time format validation
 * - FTA API verification button
 * - Graceful fallback when API not configured
 * - Dark mode support
 * - Verified business name display
 *
 * Usage:
 * <TRNVerifyInput
 *   value={trn}
 *   onChange={(value) => setTrn(value)}
 *   onVerified={(result) => console.log(result)}
 *   countryCode="AE"
 *   required
 *   label="Customer TRN"
 * />
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { trnService } from '../services/trnService';

const TRNVerifyInput = ({
  value = '',
  onChange,
  onVerified,
  countryCode = 'AE',
  label = 'TRN',
  placeholder,
  required = false,
  disabled = false,
  error: externalError,
  helperText,
  className = '',
  showVerifyButton = true,
  autoValidate = true,
}) => {
  const { isDarkMode } = useTheme();

  // Local state
  const [localValue, setLocalValue] = useState(value);
  const [formatValid, setFormatValid] = useState(null);
  const [formatError, setFormatError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-validate format on change
  useEffect(() => {
    if (!autoValidate || !localValue) {
      setFormatValid(null);
      setFormatError(null);
      return;
    }

    const result = trnService.validateFormat(localValue, countryCode);
    setFormatValid(result.valid);
    setFormatError(result.valid ? null : result.error);

    // Clear verification result when value changes
    if (verificationResult) {
      setVerificationResult(null);
    }
  }, [localValue, countryCode, autoValidate, verificationResult]);

  // Handle input change
  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  // Handle verification
  const handleVerify = useCallback(async () => {
    if (!localValue || verifying) return;

    // First validate format
    const formatResult = trnService.validateFormat(localValue, countryCode);
    if (!formatResult.valid) {
      setFormatValid(false);
      setFormatError(formatResult.error);
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const result = await trnService.verify(localValue, countryCode);
      setVerificationResult(result);
      onVerified?.(result);
    } catch (error) {
      setVerificationResult({
        success: false,
        verified: null,
        error: error.message || 'Verification failed',
        manualVerificationUrl: trnService.manualVerificationUrl,
      });
    } finally {
      setVerifying(false);
    }
  }, [localValue, countryCode, verifying, onVerified]);

  // Copy TRN to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(localValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [localValue]);

  // Get format hint
  const formatInfo = trnService.getFormatForCountry(countryCode);

  // Determine input border color based on state
  const getBorderColor = () => {
    if (externalError) return 'border-red-500';
    if (verificationResult?.verified === true) return 'border-green-500';
    if (verificationResult?.verified === false) return 'border-red-500';
    if (formatValid === true) return 'border-teal-500';
    if (formatValid === false) return 'border-orange-500';
    return isDarkMode ? 'border-gray-600' : 'border-gray-300';
  };

  // Render verification status icon
  const renderStatusIcon = () => {
    if (verifying) {
      return <Loader2 className="h-4 w-4 animate-spin text-teal-500" />;
    }

    if (verificationResult?.verified === true) {
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    }

    if (verificationResult?.verified === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (
      verificationResult?.verified === null &&
      verificationResult?.formatValid
    ) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }

    if (formatValid === true && localValue) {
      return <CheckCircle className="h-4 w-4 text-teal-500" />;
    }

    if (formatValid === false && localValue) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }

    return null;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Label */}
      {label && (
        <label
          className={`block text-xs font-medium ${
            isDarkMode ? 'text-gray-400' : 'text-gray-700'
          } ${required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}`}
        >
          {label}
        </label>
      )}

      {/* Input with verify button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={localValue}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder || formatInfo?.example || 'Enter TRN'}
            className={`w-full pl-3 pr-10 py-1.5 text-sm border rounded-md shadow-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-800 text-white placeholder-gray-500 disabled:bg-gray-700 disabled:text-gray-500'
                : 'bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:text-gray-400'
            } ${getBorderColor()}`}
          />
          {/* Status icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {localValue && (
              <button
                type="button"
                onClick={handleCopy}
                className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
                title="Copy TRN"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
            {renderStatusIcon()}
          </div>
        </div>

        {/* Verify button */}
        {showVerifyButton && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={disabled || verifying || !localValue || !formatValid}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
              disabled || verifying || !localValue || !formatValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800'
            }`}
          >
            {verifying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verify</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Verification result */}
      {verificationResult && (
        <div
          className={`mt-2 p-3 rounded-lg text-sm ${
            verificationResult.verified === true
              ? isDarkMode
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-green-50 border border-green-200'
              : verificationResult.verified === false
                ? isDarkMode
                  ? 'bg-red-900/30 border border-red-700'
                  : 'bg-red-50 border border-red-200'
                : isDarkMode
                  ? 'bg-yellow-900/30 border border-yellow-700'
                  : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          {verificationResult.verified === true && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified with FTA</span>
              </div>
              {verificationResult.businessName && (
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  <span className="font-medium">Business:</span>{' '}
                  {verificationResult.businessName}
                </p>
              )}
              {verificationResult.status && (
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      verificationResult.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    {verificationResult.status}
                  </span>
                </p>
              )}
              {verificationResult.registrationDate && (
                <p
                  className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  Registered since:{' '}
                  {new Date(
                    verificationResult.registrationDate,
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {verificationResult.verified === false && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                <span>TRN Not Found</span>
              </div>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                This TRN was not found in the FTA database. The entity may not
                be VAT registered.
              </p>
            </div>
          )}

          {verificationResult.verified === null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-medium text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {verificationResult.apiConfigured === false
                    ? 'FTA API Not Configured'
                    : 'Verification Unavailable'}
                </span>
              </div>
              <p
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {verificationResult.message || verificationResult.error}
              </p>
              {verificationResult.manualVerificationUrl && (
                <a
                  href={verificationResult.manualVerificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Verify manually on FTA portal
                </a>
              )}
              {verificationResult.instructions && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <p className="font-medium mb-1">Manual Verification Steps:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {verificationResult.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Format error */}
      {formatError && !verificationResult && (
        <p
          className={`text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
        >
          {formatError}
        </p>
      )}

      {/* External error */}
      {externalError && (
        <p
          className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
        >
          {externalError}
        </p>
      )}

      {/* Helper text with format info */}
      {!externalError && !formatError && (
        <div className="flex items-start gap-1">
          {formatInfo && (
            <p
              className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              {helperText || `Format: ${formatInfo.description}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TRNVerifyInput;
