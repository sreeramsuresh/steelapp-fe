import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';

/**
 * LoadingButton - Reusable button with loading state
 *
 * Features:
 * - Shows spinner icon when loading
 * - Disables button automatically when loading
 * - Changes text when loading
 * - Prevents double-clicks
 * - Consistent styling across app
 */
const LoadingButton = ({
  loading = false,
  disabled = false,
  onClick,
  icon: Icon,
  loadingText = 'Loading...',
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = loading || disabled;

  // Variant styles
  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2';
  const disabledStyles = isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

LoadingButton.propTypes = {
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  icon: PropTypes.elementType,
  loadingText: PropTypes.string,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default LoadingButton;
