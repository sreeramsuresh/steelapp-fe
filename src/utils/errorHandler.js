/**
 * Centralized Error Handler
 *
 * Categorizes errors into:
 * - SYSTEM: Network errors, server down, 5xx errors → display as banner/page
 * - BUSINESS: Business logic errors (4xx except validation) → display as toast
 * - VALIDATION: Field validation errors (400 with fields) → display inline
 */

/**
 * Determines if an HTTP status code represents a system-level error
 * @param {number|undefined} status - HTTP status code
 * @returns {boolean}
 */
export const isSystemError = (status) => {
  return !status || status >= 500 || status === 503;
};

/**
 * Determines if an error is a network/connection error (no response received)
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return (
    !error.response &&
    (error.code === "ECONNREFUSED" ||
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ERR_NETWORK" ||
      error.message?.includes("Network Error") ||
      error.message?.includes("timeout") ||
      error.message?.includes("Failed to fetch"))
  );
};

/**
 * Error type constants
 */
export const ErrorTypes = {
  SYSTEM: "SYSTEM",
  BUSINESS: "BUSINESS",
  VALIDATION: "VALIDATION",
  AUTH: "AUTH",
};

/**
 * Display type constants
 */
export const DisplayTypes = {
  PAGE: "page", // Full page error state
  BANNER: "banner", // Persistent top banner
  TOAST: "toast", // Transient notification
  INLINE: "inline", // Field-level errors
};

/**
 * Get user-friendly message for system errors
 * @param {Error} error - Axios error object
 * @returns {string}
 */
const getSystemErrorMessage = (error) => {
  // Network/connection errors
  if (isNetworkError(error)) {
    if (error.code === "ECONNREFUSED") {
      return "Cannot connect to server. Please ensure the backend is running.";
    }
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.includes("timeout")
    ) {
      return "Request timed out. Please try again.";
    }
    return "Network error. Please check your internet connection.";
  }

  // Server errors with response
  const status = error.response?.status;

  switch (status) {
    case 500:
      return "Internal server error. Our team has been notified.";
    case 502:
      return "Bad gateway. Please try again in a moment.";
    case 503:
      return "Service temporarily unavailable. Please try again shortly.";
    case 504:
      return "Gateway timeout. The server is taking too long to respond.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

/**
 * Get icon name for error type (Lucide React icons)
 * @param {string} errorType - Error type constant
 * @param {number|undefined} status - HTTP status code
 * @returns {string}
 */
const getErrorIcon = (errorType, status) => {
  if (errorType === ErrorTypes.SYSTEM) {
    if (!status) return "WifiOff";
    return "ServerOff";
  }
  if (errorType === ErrorTypes.AUTH) return "LogOut";
  if (errorType === ErrorTypes.VALIDATION) return "AlertCircle";
  return "AlertTriangle";
};

/**
 * Main error handler - categorizes and formats errors for display
 *
 * @param {Error} error - Axios error object or generic error
 * @returns {Object} Formatted error object with:
 *   - type: ErrorTypes constant
 *   - title: Short title for the error
 *   - message: User-friendly message
 *   - code: Error code (if available)
 *   - fields: Field-level errors (for VALIDATION type)
 *   - displayAs: DisplayTypes constant
 *   - icon: Lucide icon name
 *   - canRetry: Whether retry button should be shown
 *   - status: HTTP status code (if available)
 */
export const getErrorMessage = (error) => {
  // Handle non-axios errors
  if (!error || typeof error === "string") {
    return {
      type: ErrorTypes.SYSTEM,
      title: "Error",
      message: error || "An unknown error occurred",
      displayAs: DisplayTypes.TOAST,
      icon: "AlertTriangle",
      canRetry: true,
    };
  }

  // 1. Check for network/timeout errors FIRST (no response)
  if (isNetworkError(error)) {
    return {
      type: ErrorTypes.SYSTEM,
      title: "Connection Error",
      message: getSystemErrorMessage(error),
      displayAs: DisplayTypes.BANNER,
      icon: "WifiOff",
      canRetry: true,
      isNetworkError: true,
    };
  }

  // 2. No response but not network error (shouldn't happen often)
  if (!error.response) {
    return {
      type: ErrorTypes.SYSTEM,
      title: "Request Failed",
      message: error.message || "Failed to complete request",
      displayAs: DisplayTypes.PAGE,
      icon: "AlertTriangle",
      canRetry: true,
    };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  // 3. Check for system errors (5xx)
  if (isSystemError(status)) {
    return {
      type: ErrorTypes.SYSTEM,
      title: "Server Error",
      message: getSystemErrorMessage(error),
      displayAs: DisplayTypes.PAGE,
      icon: getErrorIcon(ErrorTypes.SYSTEM, status),
      canRetry: true,
      status,
    };
  }

  // 4. Authentication errors (401)
  if (status === 401) {
    return {
      type: ErrorTypes.AUTH,
      title: "Session Expired",
      message: "Your session has expired. Please log in again.",
      displayAs: DisplayTypes.PAGE,
      icon: "LogOut",
      canRetry: false,
      action: "LOGIN",
      status,
    };
  }

  // 5. Authorization errors (403)
  if (status === 403) {
    return {
      type: ErrorTypes.BUSINESS,
      title: "Access Denied",
      message:
        data?.error || "You don't have permission to perform this action.",
      displayAs: DisplayTypes.PAGE,
      icon: "ShieldOff",
      canRetry: false,
      status,
    };
  }

  // 6. Validation errors with field-level details
  if (status === 400 && data?.fields && Object.keys(data.fields).length > 0) {
    return {
      type: ErrorTypes.VALIDATION,
      title: "Validation Error",
      message: data?.error || "Please correct the errors below.",
      code: data?.code,
      fields: data.fields, // { email: "Invalid email", amount: "Required" }
      displayAs: DisplayTypes.INLINE,
      icon: "AlertCircle",
      canRetry: false,
      status,
    };
  }

  // 7. Not found (404)
  if (status === 404) {
    return {
      type: ErrorTypes.BUSINESS,
      title: "Not Found",
      message: data?.error || "The requested resource was not found.",
      displayAs: DisplayTypes.PAGE,
      icon: "FileQuestion",
      canRetry: false,
      status,
    };
  }

  // 8. Conflict (409) - often used for duplicate entries
  if (status === 409) {
    return {
      type: ErrorTypes.BUSINESS,
      title: "Conflict",
      message: data?.error || "This operation conflicts with existing data.",
      code: data?.code,
      displayAs: DisplayTypes.TOAST,
      icon: "AlertTriangle",
      canRetry: false,
      status,
    };
  }

  // 9. Unprocessable Entity (422) - validation at business level
  if (status === 422) {
    // Check if it has field errors
    if (data?.fields && Object.keys(data.fields).length > 0) {
      return {
        type: ErrorTypes.VALIDATION,
        title: "Validation Error",
        message: data?.error || "Please correct the errors below.",
        code: data?.code,
        fields: data.fields,
        displayAs: DisplayTypes.INLINE,
        icon: "AlertCircle",
        canRetry: false,
        status,
      };
    }
    return {
      type: ErrorTypes.BUSINESS,
      title: "Invalid Request",
      message: data?.error || "The request could not be processed.",
      code: data?.code,
      displayAs: DisplayTypes.TOAST,
      icon: "AlertTriangle",
      canRetry: false,
      status,
    };
  }

  // 10. Other 4xx - Business logic errors
  if (status >= 400 && status < 500) {
    return {
      type: ErrorTypes.BUSINESS,
      title: "Request Failed",
      message:
        data?.error || data?.message || `Request failed with status ${status}`,
      code: data?.code,
      displayAs: DisplayTypes.TOAST,
      icon: "AlertTriangle",
      canRetry: false,
      status,
    };
  }

  // 11. Fallback for any other errors
  return {
    type: ErrorTypes.SYSTEM,
    title: "Error",
    message: data?.error || error.message || "An unexpected error occurred",
    displayAs: DisplayTypes.TOAST,
    icon: "AlertTriangle",
    canRetry: true,
    status,
  };
};

/**
 * Extract raw error message from axios error (for backward compatibility)
 * @param {Error} error - Axios error object
 * @returns {string}
 */
export const getRawErrorMessage = (error) => {
  if (typeof error === "string") return error;
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    "An error occurred"
  );
};

export default {
  getErrorMessage,
  getRawErrorMessage,
  isSystemError,
  isNetworkError,
  ErrorTypes,
  DisplayTypes,
};
