import { Loader } from 'lucide-react';

/**
 * LoadingSpinner Component
 * Flexible loading indicator for async operations
 * Supports various sizes and inline/block modes
 */

export default function LoadingSpinner({
  size = 'md',
  inline = false,
  text = 'Loading...',
  fullScreen = false,
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const spinner = (
    <Loader className={`${sizes[size]} animate-spin text-blue-600`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
          {spinner}
          {text && (
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <span className="flex items-center gap-2">
        {spinner}
        {text && (
          <span className="text-gray-600 dark:text-gray-400">{text}</span>
        )}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {spinner}
      {text && (
        <p className="text-gray-600 dark:text-gray-400 font-medium">{text}</p>
      )}
    </div>
  );
}
