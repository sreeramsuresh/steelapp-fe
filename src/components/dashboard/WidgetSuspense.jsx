/**
 * WidgetSuspense - Suspense boundary with error handling for lazy widgets
 */

import { Suspense, Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import WidgetSkeleton from './WidgetSkeleton';

class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;
    
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        this.setState({ hasError: false, error: null, retryCount: retryCount + 1 });
      }, delay);
    }
  };

  render() {
    const { hasError, retryCount } = this.state;
    const { children, maxRetries = 3, widgetName = 'Widget', isDarkMode } = this.props;

    if (hasError) {
      const canRetry = retryCount < maxRetries;

      return (
        <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle size={32} className="text-red-500 mb-3" />
            <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Failed to load {widgetName}
            </h4>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {canRetry ? `Retrying... (${retryCount}/${maxRetries})` : 'Max retries reached'}
            </p>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <RefreshCw size={16} />
                Retry Now
              </button>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

const WidgetSuspense = ({ children, variant = 'card', size = 'md', widgetName = 'Widget', maxRetries = 3 }) => {
  const { isDarkMode } = useTheme();

  return (
    <WidgetErrorBoundary maxRetries={maxRetries} widgetName={widgetName} isDarkMode={isDarkMode}>
      <Suspense fallback={<WidgetSkeleton variant={variant} size={size} />}>
        {children}
      </Suspense>
    </WidgetErrorBoundary>
  );
};

export const withWidgetSuspense = (WrappedComponent, options = {}) => {
  const { variant = 'card', size = 'md', widgetName, maxRetries = 3 } = options;
  const displayName = widgetName || WrappedComponent.displayName || WrappedComponent.name || 'Widget';

  const WithSuspense = (props) => (
    <WidgetSuspense variant={variant} size={size} widgetName={displayName} maxRetries={maxRetries}>
      <WrappedComponent {...props} />
    </WidgetSuspense>
  );

  WithSuspense.displayName = `WithSuspense(${displayName})`;
  return WithSuspense;
};

export default WidgetSuspense;
