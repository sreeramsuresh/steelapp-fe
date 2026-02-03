/**
 * RequiredLabel Component
 * Renders a form label with a visual indicator for required fields
 * Shows an asterisk (*) in red to clearly indicate required fields
 */
const RequiredLabel = ({ htmlFor, children, required = false }) => {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default RequiredLabel;
