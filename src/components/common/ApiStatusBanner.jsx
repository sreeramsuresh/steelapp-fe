import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useApiHealthContext } from '../../contexts/ApiHealthContext';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ApiStatusBanner - Shows a warning banner when the API Gateway is unavailable
 *
 * Features:
 * - Polls the health endpoint every 30 seconds
 * - Instantly appears when any API call fails with network error
 * - Displays a dismissible warning when the API is down
 * - Automatically reappears if the API remains unhealthy
 *
 * Usage:
 *   Wrap app with <ApiHealthProvider>, then place:
 *   <ApiStatusBanner />
 */
const ApiStatusBanner = () => {
  const { isDarkMode } = useTheme();
  const { isHealthy, isChecking, error, isDismissed, checkNow, dismiss } =
    useApiHealthContext();

  // Don't show anything if API is healthy or banner is dismissed
  if (isHealthy || isDismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] px-4 py-3 shadow-lg transition-all duration-300 ${
        isDarkMode
          ? 'bg-amber-900/90 border-b border-amber-700'
          : 'bg-amber-50 border-b border-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Warning Icon and Message */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`flex-shrink-0 p-1.5 rounded-full ${
              isDarkMode ? 'bg-amber-800' : 'bg-amber-100'
            }`}
          >
            <AlertTriangle
              size={20}
              className={isDarkMode ? 'text-amber-300' : 'text-amber-600'}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                isDarkMode ? 'text-amber-100' : 'text-amber-800'
              }`}
            >
              Backend server is unavailable
            </p>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-amber-300' : 'text-amber-600'
              }`}
            >
              Some features may not work. Please ensure the API Gateway is
              running on port 3000.
              {error && ` (${error})`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Retry Button */}
          <button
            onClick={checkNow}
            disabled={isChecking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDarkMode
                ? 'bg-amber-800 hover:bg-amber-700 text-amber-100'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
            } ${isChecking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
            {isChecking ? 'Checking...' : 'Retry'}
          </button>

          {/* Dismiss Button */}
          <button
            onClick={dismiss}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-amber-800 text-amber-300'
                : 'hover:bg-amber-100 text-amber-600'
            }`}
            aria-label="Dismiss warning"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiStatusBanner;
