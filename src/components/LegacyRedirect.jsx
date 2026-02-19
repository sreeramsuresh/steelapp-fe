/**
 * LegacyRedirect.jsx
 * Handles redirects from old routes to new prefixed routes
 * Preserves query strings and hash fragments
 */
import { Navigate, useLocation } from "react-router-dom";
import { getRedirectPath } from "../config/redirects";

const LegacyRedirect = () => {
  const location = useLocation();

  // Get the new path based on the current path
  const newPath = getRedirectPath(location.pathname);

  if (newPath) {
    // Preserve query string and hash
    const fullNewPath = newPath + location.search + location.hash;
    return <Navigate to={fullNewPath} replace />;
  }

  // Fallback to /app if no specific redirect found
  return <Navigate to="/app" replace />;
};

export default LegacyRedirect;
