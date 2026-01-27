import { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppRouter from './components/AppRouter';
import NotificationProvider from './components/NotificationProvider';
import { NotificationCenterProvider } from './contexts/NotificationCenterContext';
import { ApiHealthProvider } from './contexts/ApiHealthContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuditHubProvider } from './contexts/AuditHubContext';
import { authService } from './services/axiosAuthService';
import ApiStatusBanner from './components/common/ApiStatusBanner';

// Initialize auth service on app load
authService.initialize();

/**
 * AppContent - Simplified wrapper for the router
 * Layouts (CoreERPLayout, AnalyticsLayout) now handle sidebar/topnavbar
 */
const AppContent = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  return (
    <AppRouter
      user={user}
      handleSaveInvoice={handleSaveInvoice}
      onLoginSuccess={onLoginSuccess}
    />
  );
};

// Themed App wrapper that uses the theme context
const ThemedApp = ({ isLoading, user, handleSaveInvoice, onLoginSuccess }) => {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen gap-4 ${isDarkMode ? 'bg-[#121418]' : 'bg-[#FAFAFA]'}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Loading ULTIMATE STEELS...
        </span>
      </div>
    );
  }

  return (
    <AppContent
      user={user}
      handleSaveInvoice={handleSaveInvoice}
      onLoginSuccess={onLoginSuccess}
    />
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize user from auth service on app load
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getUser();
          if (storedUser && mounted) {
            setUser(storedUser);
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        if (mounted) console.error('Failed to initialize app:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveInvoice = () => {
    // Invoice state is now managed by individual components
  };

  const handleLoginSuccess = async (userData) => {
    setUser(userData);
  };

  // Set global app ready flag for E2E tests (resilient to DOM restructuring)
  useEffect(() => {
    if (!loading) {
      window.__APP_READY__ = true;
    }
    return () => {
      window.__APP_READY__ = false;
    };
  }, [loading]);

  if (loading) {
    return (
      <ThemeProvider>
        <ThemedApp isLoading={true} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div data-testid="app-ready">
        <AuthProvider user={user}>
          <AuditHubProvider>
            <ApiHealthProvider>
              <Router>
                <NotificationCenterProvider>
                  <NotificationProvider>
                    <ApiStatusBanner />
                    <ThemedApp
                      user={user}
                      handleSaveInvoice={handleSaveInvoice}
                      onLoginSuccess={handleLoginSuccess}
                    />
                  </NotificationProvider>
                </NotificationCenterProvider>
              </Router>
            </ApiHealthProvider>
          </AuditHubProvider>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
