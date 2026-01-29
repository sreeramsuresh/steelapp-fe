/**
 * Consistent status badge component
 * Fixes bug #21: Status badges now have consistent styling
 *
 * Usage:
 *   <StatusBadge status="DRAFT" variant="draft" />
 *   <StatusBadge status="ACTIVE" variant="active" />
 */
const StatusBadge = ({
  status,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    draft: {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
    },
    active: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-300 dark:border-green-600',
    },
    inactive: {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
    },
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-600',
    },
    success: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-300 dark:border-green-600',
    },
    danger: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-300 dark:border-red-600',
    },
    warning: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-600',
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-600',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const config = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${sizes[size]} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
