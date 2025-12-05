import PropTypes from 'prop-types';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * LoadingOverlay - Full-screen loading overlay
 *
 * Use for long operations where user should wait (>2 seconds):
 * - Invoice saves with inventory updates
 * - Bulk operations
 * - File uploads
 * - Complex calculations
 *
 * Blocks all user interaction and shows progress message
 */
const LoadingOverlay = ({
  show = false,
  message = 'Processing...',
  detail = null,
  spinnerSize = 'lg',
}) => {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  const spinnerSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center animate-in fade-in duration-200">
      <div
        className={`${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } p-8 rounded-lg shadow-2xl border max-w-md mx-4 animate-in zoom-in-95 duration-200`}
      >
        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <Loader2
            className={`${spinnerSizes[spinnerSize]} text-teal-600 animate-spin`}
          />
        </div>

        {/* Message */}
        <p
          className={`text-center font-semibold text-lg ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {message}
        </p>

        {/* Detail (optional) */}
        {detail && (
          <p
            className={`text-center text-sm mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {detail}
          </p>
        )}

        {/* Subtle animation hint */}
        <div className="mt-4 flex justify-center gap-1">
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  show: PropTypes.bool,
  message: PropTypes.string,
  detail: PropTypes.string,
  spinnerSize: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default LoadingOverlay;
