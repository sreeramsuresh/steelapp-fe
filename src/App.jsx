import { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./components/AppRouter";
import ApiStatusBanner from "./components/common/ApiStatusBanner";
import NotificationProvider from "./components/NotificationProvider";
import { ApiHealthProvider } from "./contexts/ApiHealthContext";
import { AuditHubProvider } from "./contexts/AuditHubContext";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationCenterProvider } from "./contexts/NotificationCenterContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { authService } from "./services/axiosAuthService";
import { loginUrlWithReason, onAuthSessionExpired, resetSessionExpiredGuard } from "./services/axiosApi";

// Initialize auth service on app load
authService.initialize();
authService.initFocusRefresh();

/**
 * AppContent - Simplified wrapper for the router
 * Layouts (CoreERPLayout, AnalyticsLayout) now handle sidebar/topnavbar
 */
const AppContent = ({ user, handleSaveInvoice, onLoginSuccess }) => {
  return <AppRouter user={user} handleSaveInvoice={handleSaveInvoice} onLoginSuccess={onLoginSuccess} />;
};

// Themed App wrapper that uses the theme context
const ThemedApp = ({ isLoading, user, handleSaveInvoice, onLoginSuccess }) => {
  const { isDarkMode } = useTheme();

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen gap-4 ${isDarkMode ? "bg-gray-900" : "bg-[#FAFAFA]"}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className={isDarkMode ? "text-white" : "text-gray-900"}>Loading ULTIMATE STEELS...</span>
      </div>
    );
  }

  return <AppContent user={user} handleSaveInvoice={handleSaveInvoice} onLoginSuccess={onLoginSuccess} />;
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
          // User exists in sessionStorage — validate session with server
          try {
            const freshUser = await authService.getCurrentUser();
            if (freshUser && mounted) {
              setUser(freshUser);
            } else if (mounted) {
              setUser(null);
            }
          } catch (_err) {
            // Session invalid (401) or server unreachable — clear stale data
            if (mounted) {
              authService.clearSession();
              setUser(null);
            }
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        if (mounted) console.error("Failed to initialize app:", error);
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
    resetSessionExpiredGuard();
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Listen for auth session expiry from axios interceptors (401 refresh failure,
  // account deactivation/lockout). These fire from outside React, so we bridge
  // them into React state here. The interceptor handles redirect — we only clear state.
  useEffect(() => {
    const onSessionExpired = () => setUser(null);
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, []);

  // Cross-tab logout: detect when another tab clears sessionStorage.
  // The 'storage' event fires in OTHER tabs when localStorage changes.
  useEffect(() => {
    const onStorageChange = (e) => {
      if (e.key === "auth:logout" && e.newValue) {
        authService.clearSession();
        setUser(null);
        // Clean up sentinel so it doesn't fire again on reload
        try {
          localStorage.removeItem("auth:logout");
        } catch {
          /* noop */
        }
        window.location.replace(loginUrlWithReason("session_expired"));
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  // Periodic session validation: when tab becomes visible after being backgrounded,
  // re-validate with /auth/me. If session died server-side, clear state immediately
  // rather than waiting for the next API call to 401.
  useEffect(() => {
    let lastCheck = Date.now();
    const REVALIDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const onVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !user) return;
      const now = Date.now();
      if (now - lastCheck < REVALIDATE_INTERVAL) return;
      lastCheck = now;
      try {
        const freshUser = await authService.getCurrentUser();
        if (!freshUser) {
          authService.clearSession();
          onAuthSessionExpired("session_invalid");
          window.location.replace(loginUrlWithReason("session_expired"));
        }
      } catch {
        // 401 → interceptor handles refresh/redirect. Network error → ignore (offline).
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [user]);

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
        <AuthProvider user={user} onLogout={handleLogout}>
          <AuditHubProvider>
            <ApiHealthProvider>
              <Router>
                <NotificationCenterProvider>
                  <NotificationProvider>
                    <ApiStatusBanner />
                    <ThemedApp user={user} handleSaveInvoice={handleSaveInvoice} onLoginSuccess={handleLoginSuccess} />
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
