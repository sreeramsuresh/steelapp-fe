import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import {
  WifiOff,
  ServerOff,
  AlertTriangle,
  ShieldOff,
  FileQuestion,
  LogOut,
  RefreshCw,
  Home,
} from 'lucide-react';

/**
 * ErrorState - Full-page error display for system/critical errors
 *
 * Used for:
 * - Network errors (server unreachable)
 * - Server errors (5xx)
 * - Not found pages (404)
 * - Authorization errors (403)
 *
 * Usage:
 *   <ErrorState
 *     title="Server Error"
 *     message="Something went wrong on our end."
 *     icon="ServerOff"
 *     canRetry
 *     onRetry={() => refetch()}
 *   />
 */

const iconMap = {
  WifiOff,
  ServerOff,
  AlertTriangle,
  ShieldOff,
  FileQuestion,
  LogOut,
};

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  icon = 'AlertTriangle',
  canRetry = true,
  onRetry,
  onGoHome,
  action,
  status,
  className = '',
}) => {
  const { isDarkMode } = useTheme();
  const IconComponent = iconMap[icon] || AlertTriangle;

  // Determine color scheme based on error type
  const getColorScheme = () => {
    if (status >= 500 || !status) {
      return {
        bg: isDarkMode ? 'bg-red-900/20' : 'bg-red-50',
        iconBg: isDarkMode ? 'bg-red-900/50' : 'bg-red-100',
        iconColor: isDarkMode ? 'text-red-400' : 'text-red-500',
        titleColor: isDarkMode ? 'text-red-300' : 'text-red-700',
        textColor: isDarkMode ? 'text-red-200' : 'text-red-600',
        buttonBg: isDarkMode
          ? 'bg-red-600 hover:bg-red-500'
          : 'bg-red-600 hover:bg-red-700',
      };
    }
    if (status === 403 || status === 401) {
      return {
        bg: isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50',
        iconBg: isDarkMode ? 'bg-amber-900/50' : 'bg-amber-100',
        iconColor: isDarkMode ? 'text-amber-400' : 'text-amber-500',
        titleColor: isDarkMode ? 'text-amber-300' : 'text-amber-700',
        textColor: isDarkMode ? 'text-amber-200' : 'text-amber-600',
        buttonBg: isDarkMode
          ? 'bg-amber-600 hover:bg-amber-500'
          : 'bg-amber-600 hover:bg-amber-700',
      };
    }
    if (status === 404) {
      return {
        bg: isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50',
        iconBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
        iconColor: isDarkMode ? 'text-gray-400' : 'text-gray-500',
        titleColor: isDarkMode ? 'text-gray-300' : 'text-gray-700',
        textColor: isDarkMode ? 'text-gray-400' : 'text-gray-600',
        buttonBg: isDarkMode
          ? 'bg-gray-600 hover:bg-gray-500'
          : 'bg-gray-600 hover:bg-gray-700',
      };
    }
    // Default fallback
    return {
      bg: isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50',
      iconBg: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
      iconColor: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      titleColor: isDarkMode ? 'text-gray-300' : 'text-gray-700',
      textColor: isDarkMode ? 'text-gray-400' : 'text-gray-600',
      buttonBg: isDarkMode
        ? 'bg-gray-600 hover:bg-gray-500'
        : 'bg-gray-600 hover:bg-gray-700',
    };
  };

  const colors = getColorScheme();

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[400px] p-8 ${colors.bg} rounded-lg ${className}`}
    >
      {/* Icon */}
      <div className={`p-4 rounded-full ${colors.iconBg} mb-6`}>
        <IconComponent size={48} className={colors.iconColor} />
      </div>

      {/* Title */}
      <h2 className={`text-xl font-semibold mb-2 ${colors.titleColor}`}>
        {title}
      </h2>

      {/* Message */}
      <p className={`text-center max-w-md mb-6 ${colors.textColor}`}>
        {message}
      </p>

      {/* Status code (if available) */}
      {status && (
        <p
          className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
        >
          Error Code: {status}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${colors.buttonBg}`}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        )}

        {action === 'LOGIN' && (
          <button
            onClick={() => (window.location.href = '/login')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${colors.buttonBg}`}
          >
            <LogOut size={16} />
            Log In Again
          </button>
        )}

        {onGoHome && (
          <button
            onClick={onGoHome}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Home size={16} />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  icon: PropTypes.oneOf([
    'WifiOff',
    'ServerOff',
    'AlertTriangle',
    'ShieldOff',
    'FileQuestion',
    'LogOut',
  ]),
  canRetry: PropTypes.bool,
  onRetry: PropTypes.func,
  onGoHome: PropTypes.func,
  action: PropTypes.string,
  status: PropTypes.number,
  className: PropTypes.string,
};

export default ErrorState;
