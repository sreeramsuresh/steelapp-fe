import { AlertCircle } from 'lucide-react';

/**
 * Form field error message with icon
 * Fixes bug #12: Inline validation feedback
 *
 * Usage:
 *   <FormError message="This field is required" />
 */
const FormError = ({ message, className = '' }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-2 mt-1 text-red-600 dark:text-red-400 text-sm ${className}`}
    >
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};

export default FormError;
