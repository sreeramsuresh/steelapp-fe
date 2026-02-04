import FormError from "./FormError";
import RequiredIndicator from "./RequiredIndicator";

/**
 * Consistent form field wrapper with label, error, and required indicator
 * Fixes bugs #8, #12: Consistent required indicators and validation feedback
 *
 * Usage:
 *   <FormFieldWrapper label="Email" required error={errors.email} id="email">
 *     <input type="email" id="email" name="email" />
 *   </FormFieldWrapper>
 */
const FormFieldWrapper = ({ label, required = false, error, children, helpText, className = "", id }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <RequiredIndicator />}
        </label>
      )}
      {children}
      {error && <FormError message={error} />}
      {helpText && !error && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>}
    </div>
  );
};

export default FormFieldWrapper;
