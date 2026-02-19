import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook to warn users about unsaved changes before navigation
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @param {string} message - Custom warning message (optional)
 */
export const useUnsavedChanges = (
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?"
) => {
  const _navigate = useNavigate();

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Warn on page unload/refresh
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Function to use before navigation - returns true if user confirms
  const confirmNavigation = (callback) => {
    if (!hasUnsavedChanges) {
      callback();
      return;
    }

    if (window.confirm(message)) {
      callback();
    }
  };

  // Hook for React Router v6 - using custom prompt
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handlePopState = (_event) => {
      if (!window.confirm(message)) {
        // Prevent the navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasUnsavedChanges, message]);

  return { confirmNavigation };
};

export default useUnsavedChanges;
