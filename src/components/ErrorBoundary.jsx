import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Component } from "react";
import { useTheme } from "../contexts/ThemeContext";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent
          error={this.state.error}
          onReset={this.handleReset}
          onGoBack={this.handleGoBack}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Functional component to display error with theme support
 */
function ErrorBoundaryContent({ error, onReset, onGoBack, onReload }) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`flex items-center justify-center min-h-[60vh] p-6 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
    >
      <div
        className={`w-full max-w-2xl rounded-lg border p-6 ${isDarkMode ? "bg-[#1a1f26] border-red-900/30" : "bg-white border-red-200"}`}
      >
        {/* Error Icon */}
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle size={48} className="text-red-500" />
        </div>

        {/* Error Title */}
        <h1 className={`text-2xl font-bold text-center mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Oops! Something went wrong
        </h1>

        {/* Error Message */}
        <p className={`text-center mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          We encountered an unexpected error. Please try one of the options below.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === "development" && error && (
          <div
            className={`mb-6 p-4 rounded-lg border ${isDarkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}
          >
            <p className="font-mono text-sm break-words whitespace-pre-wrap">{error.toString()}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onReset}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isDarkMode ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-teal-500 hover:bg-teal-600 text-white"
            }`}
          >
            <RefreshCw size={18} />
            Try Again
          </button>

          <button
            type="button"
            onClick={onGoBack}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            type="button"
            onClick={onReload}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            <RefreshCw size={18} />
            Reload Page
          </button>
        </div>

        {/* Help Text */}
        <p className={`text-center text-sm mt-6 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
          If the problem persists, please contact support or refresh your browser.
        </p>
      </div>
    </div>
  );
}

export default ErrorBoundary;
