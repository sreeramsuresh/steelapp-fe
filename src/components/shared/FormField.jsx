import RequiredLabel from './RequiredLabel';

/**
 * FormField Component
 * Provides consistent form field layout with label, input, helper text, and error messages
 * Supports better clarity (bug #13), placeholder guidance (bug #16), and tooltips (bug #21)
 */
const FormField = ({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  tooltip,
  children,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <RequiredLabel htmlFor={htmlFor} required={required}>
          {label}
        </RequiredLabel>
        {tooltip && (
          <div
            className="text-gray-400 dark:text-gray-600 cursor-help"
            title={tooltip}
          >
            ℹ️
          </div>
        )}
      </div>
      {children}
      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormField;
