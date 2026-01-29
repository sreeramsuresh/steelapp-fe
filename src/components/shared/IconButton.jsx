import { useState } from 'react';

/**
 * Accessible icon button with automatic tooltip and focus management
 * Fixes bug #22: Icon-only buttons now have visible labels/tooltips
 * Fixes bug #26: Visible focus indicators
 *
 * Usage:
 *   <IconButton icon={<Trash2 />} title="Delete" onClick={handleDelete} variant="danger" />
 */
const IconButton = ({
  icon,
  title,
  onClick,
  className = '',
  variant = 'default', // 'default', 'danger', 'success', 'info'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  ariaLabel,
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const variantClasses = {
    default:
      'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700',
    danger:
      'text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30',
    success:
      'text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30',
    info: 'text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30',
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  const baseClasses =
    'relative inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="relative inline-block">
      <button
        title={title}
        aria-label={ariaLabel || title}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {icon}
      </button>

      {/* Tooltip */}
      {showTooltip && title && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none z-50 dark:bg-gray-700">
          {title}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-gray-900 border-r-transparent border-b-transparent border-l-transparent dark:border-gray-700 dark:border-r-transparent dark:border-b-transparent dark:border-l-transparent" />
        </div>
      )}
    </div>
  );
};

export default IconButton;
