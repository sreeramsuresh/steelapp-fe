import { InboxIcon } from 'lucide-react';

/**
 * EmptyState Component
 * Consistent empty state display across all modules
 * Handles various empty scenarios with appropriate icons and messages
 */

export default function EmptyState({
  icon: Icon = InboxIcon,
  title = 'No Data Available',
  description = 'There is no data to display at the moment.',
  action = null,
  variant = 'default', // default, minimal, info
}) {
  const variants = {
    default: 'bg-gray-50 border-2 border-dashed border-gray-300 p-12',
    minimal: 'p-8',
    info: 'bg-blue-50 border border-blue-200 p-8',
  };

  return (
    <div className={`${variants[variant]} rounded-lg text-center`}>
      <div className="flex justify-center mb-4">
        <Icon
          size={48}
          className={`${
            variant === 'info'
              ? 'text-blue-400'
              : 'text-gray-400 dark:text-gray-600'
          }`}
        />
      </div>

      <h3
        className={`text-lg font-semibold mb-2 ${
          variant === 'info'
            ? 'text-blue-900 dark:text-blue-100'
            : 'text-gray-900 dark:text-white'
        }`}
      >
        {title}
      </h3>

      <p
        className={`text-sm mb-6 ${
          variant === 'info'
            ? 'text-blue-700 dark:text-blue-200'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {description}
      </p>

      {action && (
        <div className="flex justify-center gap-3">
          {Array.isArray(action) ? (
            action.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  btn.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {btn.label}
              </button>
            ))
          ) : (
            <button
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
