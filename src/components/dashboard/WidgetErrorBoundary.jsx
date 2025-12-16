import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * WidgetErrorBoundary - Catches errors in dashboard widgets to prevent full dashboard crashes
 *
 * Usage:
 *   <WidgetErrorBoundary widgetName="Revenue Widget">
 *     <RevenueWidget />
 *   </WidgetErrorBoundary>
 *
 * Note: This is a class component because Error Boundaries require componentDidCatch
 * which is not available in function components as of React 18.
 */
class WidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging (visible in browser console)
    console.error(
      `[Widget Error] ${this.props.widgetName || 'Unknown Widget'} crashed:`,
      error,
      errorInfo,
    );

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    // Reset the error state to try rendering the widget again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError } = this.state;
    const { children, widgetName, isDarkMode } = this.props;

    if (hasError) {
      // Render user-friendly error UI
      return (
        <div
          className={`rounded-xl border p-4 min-h-64 flex flex-col items-center justify-center ${
            isDarkMode
              ? 'bg-[#1E2328] border-[#37474F]'
              : 'bg-white border-[#E0E0E0]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
            }`}
          >
            <AlertTriangle
              size={24}
              className={isDarkMode ? 'text-red-400' : 'text-red-500'}
            />
          </div>

          <h4
            className={`text-base font-semibold mb-2 text-center ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {widgetName || 'Widget'} could not load
          </h4>

          <p
            className={`text-sm text-center mb-4 max-w-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Something went wrong while displaying this widget. The rest of your
            dashboard is still working.
          </p>

          <button
            onClick={this.handleRetry}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <p
            className={`text-xs mt-4 text-center ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            If this keeps happening, please refresh the page or contact support.
          </p>
        </div>
      );
    }

    // No error, render children normally
    return children;
  }
}

/**
 * WidgetErrorBoundaryWrapper - Wrapper that provides theme context to the class component
 *
 * This is needed because class components cannot use hooks directly (like useTheme).
 * The wrapper reads the theme and passes it as a prop.
 */
import { useTheme } from '../../contexts/ThemeContext';

export const WidgetErrorBoundaryWithTheme = ({ children, widgetName }) => {
  const { isDarkMode } = useTheme();

  return (
    <WidgetErrorBoundary widgetName={widgetName} isDarkMode={isDarkMode}>
      {children}
    </WidgetErrorBoundary>
  );
};

export default WidgetErrorBoundaryWithTheme;
