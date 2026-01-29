/**
 * Required field indicator (asterisk)
 * Fixes bug #8: Required field indicators now consistent across forms
 *
 * Usage:
 *   <label>Product Name <RequiredIndicator /></label>
 */
const RequiredIndicator = () => {
  return (
    <span className="text-red-600 dark:text-red-400 ml-1" aria-label="required">
      *
    </span>
  );
};

export default RequiredIndicator;
