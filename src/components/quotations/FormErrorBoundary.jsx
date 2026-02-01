import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * FormErrorBoundary - Catches errors in form components to prevent full app crashes
 * Bug #59 fix: Provides error boundary for QuotationForm
 *
 * Usage:
 *   <FormErrorBoundary formName="Quotation Form">
 *     <QuotationForm />
 *   </FormErrorBoundary>
 *
 * Note: This is a class component because Error Boundaries require componentDidCatch
 * which is not available in function components as of React 18.
 */
class FormErrorBoundary extends Component {
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
    // Log error details for debugging
    console.error(
      `[Form Error] ${this.props.formName || 'Unknown Form'} crashed:`,
      error,
      errorInfo,
    );

    // Log to analytics or error tracking service if available
    if (window.__SENTRY__) {
      window.__SENTRY__.captureException(error, {
        contexts: {
          form: {
            name: this.props.formName || 'Unknown',
          },
        },
      });
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    // Reset the error state to try rendering the form again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Navigate to home
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, formName, isDarkMode } = this.props;

    if (hasError) {
      // Render user-friendly error UI
      return (
        <div
          className={`min-h-screen flex items-center justify-center p-4 ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 ${
              isDarkMode
                ? 'bg-[#1E2328] border-[#37474F]'
                : 'bg-white border-[#E0E0E0]'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${
                isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
              }`}
            >
              <AlertTriangle
                size={24}
                className={isDarkMode ? 'text-red-400' : 'text-red-500'}
              />
            </div>

            <h3
              className={`text-lg font-semibold mb-2 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {formName || 'Form'} Error
            </h3>

            <p
              className={`text-sm text-center mb-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              An unexpected error occurred while loading this form. We apologize
              for the inconvenience.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <div
                className={`mb-4 p-3 rounded border text-xs font-mono overflow-auto max-h-32 ${
                  isDarkMode
                    ? 'bg-red-900/20 border-red-700 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {error.toString()}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-teal-900/30 hover:bg-teal-900/50 text-teal-300'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-600'
                }`}
              >
                <Home size={16} />
                Go Home
              </button>
            </div>

            <p
              className={`text-xs mt-4 text-center ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              If this issue persists, please contact support or refresh the
              page.
            </p>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return children;
  }
}

/**
 * FormErrorBoundaryWrapper - Wrapper that provides theme context to the class component
 *
 * This is needed because class components cannot use hooks directly (like useTheme).
 * The wrapper reads the theme and passes it as a prop.
 */
import { useTheme } from '../../contexts/ThemeContext';

export const FormErrorBoundaryWithTheme = ({ children, formName }) => {
  const { isDarkMode } = useTheme();

  return (
    <FormErrorBoundary formName={formName} isDarkMode={isDarkMode}>
      {children}
    </FormErrorBoundary>
  );
};

export default FormErrorBoundaryWithTheme;
