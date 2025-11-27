import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { authService } from '../services/axiosAuthService';
import { useTheme } from '../contexts/ThemeContext';

const ProtectedRoute = ({
  children,
  user,
  requiredRole,
  requiredRoles,
  requiredPermission,
  fallbackPath = '/login',
}) => {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  // Check if user is authenticated - use auth service as primary source of truth
  const isAuthenticated = authService.isAuthenticated();
  
  console.log('🔒 ProtectedRoute check:', {
    isAuthenticated,
    hasUserProp: !!user,
    userEmail: user?.email,
    path: location.pathname,
  });

  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // If authenticated but no user object, show loading state instead of redirect
  if (!user) {
    console.log('🔒 ProtectedRoute SHOWING SPINNER - user is null/undefined, path:', location.pathname);
    return (
      <div className={`flex items-center justify-center min-h-[60vh] ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className={`ml-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Loading...</span>
      </div>
    );
  }

  console.log('🔒 ProtectedRoute RENDERING CHILDREN - user exists:', user?.email, 'path:', location.pathname);

  // DEVELOPMENT MODE: Skip role check
  // Check role-based access (supports single role or array of roles)
  // eslint-disable-next-line no-constant-condition
  const hasRequiredRole = requiredRoles
    ? requiredRoles.some(role => authService.hasRole(role))
    : requiredRole
      ? authService.hasRole(requiredRole)
      : true;

  if (false && (requiredRole || requiredRoles) && !hasRequiredRole) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
        <Lock size={64} className="text-red-500 mb-4" />
        <h1 className={`text-3xl font-bold mb-2 text-red-500`}>
          Access Denied
        </h1>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          You don&apos;t have the required role ({requiredRoles ? requiredRoles.join(' or ') : requiredRole}) to access this page.
        </p>
        <div className={`mb-6 max-w-md p-4 rounded-lg border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <p className="mb-2">
            <strong>Current role:</strong> {authService.getUserRole()}
          </p>
          <p>
            <strong>Required role:</strong> {requiredRoles ? requiredRoles.join(' or ') : requiredRole}
          </p>
        </div>
        <button
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>
    );
  }

  // DEVELOPMENT MODE: Skip permission check
  // Check permission-based access
  // eslint-disable-next-line no-constant-condition
  if (false && requiredPermission) {
    const [resource, action] = requiredPermission.split('.');

    if (!authService.hasPermission(resource, action)) {
      return (
        <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}>
          <Lock size={64} className="text-orange-500 mb-4" />
          <h1 className={`text-3xl font-bold mb-2 text-orange-500`}>
            Insufficient Permissions
          </h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You don&apos;t have permission to {action} {resource}.
          </p>
          <div className={`mb-6 max-w-md p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <p className="mb-2">
              <strong>Required permission:</strong> {requiredPermission}
            </p>
            <p>
              Contact your administrator to request access.
            </p>
          </div>
          <button
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      );
    }
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;
