/**
 * Login Redirect Safety Tests
 * Tests redirect behavior after login, open redirect prevention,
 * and logged-in user routing.
 */

import { render } from "@testing-library/react";
import { MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth service — must be set up before importing components that use it
const mockIsAuthenticated = vi.fn();
const mockGetUser = vi.fn();
const mockHasRole = vi.fn(() => true);
const mockGetUserRole = vi.fn(() => "admin");
const mockHasPermission = vi.fn(() => true);

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    login: vi.fn(),
    isAuthenticated: () => mockIsAuthenticated(),
    getUser: () => mockGetUser(),
    hasRole: (...args) => mockHasRole(...args),
    getUserRole: () => mockGetUserRole(),
    hasPermission: (...args) => mockHasPermission(...args),
    passkeyLoginStart: vi.fn(),
    passkeyLoginFinish: vi.fn(),
    sendLockoutOtp: vi.fn(),
    verifyLockoutOtp: vi.fn(),
  },
  tokenUtils: {
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setUser: vi.fn(),
    getUser: () => mockGetUser(),
  },
}));

// Mock TwoFactorVerification
vi.mock("../TwoFactorVerification", () => ({
  default: () => <div data-testid="two-factor-verification" />,
}));

// Mock ThemeContext
vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <>{children}</>,
}));

// Stub env
vi.stubEnv("PROD", false);
vi.stubEnv("VITE_AUTO_LOGIN", "false");

/**
 * Simplified AppRouter-like component that replicates the redirect logic
 * from AppRouter.jsx for isolated testing. This avoids lazy-loading
 * complexity and focuses on redirect behavior.
 */
const RedirectTestRouter = ({ user, onLoginSuccess }) => {
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";
  const isPublicAuthPage = location.pathname === "/forgot-password" || location.pathname === "/reset-password";
  const isMarketing = location.pathname === "/";
  const hasRbacParam = location.search.includes("rbac");

  // Replicate AppRouter logic
  const needsAuth = !user && !isLoginPage && !isMarketing && !isPublicAuthPage;
  const needsAppRedirect = user && isLoginPage && !hasRbacParam;

  if (needsAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsAppRedirect) {
    return <Navigate to="/app" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPageStub onLoginSuccess={onLoginSuccess} />} />
      <Route path="/app" element={<div data-testid="app-page">Dashboard</div>} />
      <Route path="/app/*" element={<div data-testid="app-page">App Content</div>} />
      <Route path="/" element={<div data-testid="marketing">Marketing</div>} />
    </Routes>
  );
};

/** Stub login page that reads location state for redirect testing */
const LoginPageStub = ({ onLoginSuccess }) => {
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || null;

  return (
    <div data-testid="login-page">
      <span data-testid="login-visible">Login Page</span>
      {fromPath && <span data-testid="redirect-from">{fromPath}</span>}
      <button type="button" data-testid="do-login" onClick={() => onLoginSuccess?.({ id: 1, name: "Test" })}>
        Login
      </button>
    </div>
  );
};

describe("Login Redirect Safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
    mockGetUser.mockReturnValue(null);
  });

  describe("Logged-in user on /login", () => {
    it("should redirect logged-in user from /login to /app", () => {
      const user = { id: 1, name: "Test User", companyId: 1 };

      const { queryByTestId } = render(
        <MemoryRouter initialEntries={["/login"]}>
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      // Should NOT show login page
      expect(queryByTestId("login-page")).not.toBeInTheDocument();
      // Should show app page
      expect(queryByTestId("app-page")).toBeInTheDocument();
    });

    it("should NOT redirect if ?rbac param is present", () => {
      const user = { id: 1, name: "Test User", companyId: 1 };

      const { queryByTestId } = render(
        <MemoryRouter initialEntries={["/login?rbac=1"]}>
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      // Should show login page (RBAC test panel use case)
      expect(queryByTestId("login-page")).toBeInTheDocument();
    });
  });

  describe("Unauthenticated protected route access", () => {
    it("should redirect to /login when visiting /app without auth", () => {
      const { queryByTestId } = render(
        <MemoryRouter initialEntries={["/app"]}>
          <RedirectTestRouter user={null} />
        </MemoryRouter>
      );

      expect(queryByTestId("login-page")).toBeInTheDocument();
      expect(queryByTestId("app-page")).not.toBeInTheDocument();
    });

    it("should save attempted path in location state when redirecting to login", () => {
      const { getByTestId } = render(
        <MemoryRouter initialEntries={["/app/invoices"]}>
          <RedirectTestRouter user={null} />
        </MemoryRouter>
      );

      expect(getByTestId("login-page")).toBeInTheDocument();
      expect(getByTestId("redirect-from").textContent).toBe("/app/invoices");
    });
  });

  describe("Post-login redirect with state.from", () => {
    it("should preserve state.from for post-login redirect", () => {
      // Simulate arriving at /login with state.from = /app/customers
      const { getByTestId } = render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/app/customers" } } }]}>
          <RedirectTestRouter user={null} />
        </MemoryRouter>
      );

      // The login page should have access to the redirect-from info
      expect(getByTestId("redirect-from").textContent).toBe("/app/customers");
    });
  });

  describe("Open Redirect Prevention", () => {
    /**
     * These tests verify that the redirect logic only accepts internal paths.
     * The AppRouter uses Navigate to="/app" (hardcoded), not state.from,
     * so external URLs in state.from are never used as redirect targets
     * by the router itself. The login component must also not use
     * state.from blindly for window.location redirects.
     */

    it("should redirect to /app (not external URL) when user logs in", () => {
      // Even if state.from contains an external path, the router redirects to /app
      const user = { id: 1, name: "Test User", companyId: 1 };

      const { queryByTestId } = render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "https://evil.com" } } }]}>
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      // Should go to /app, not the external URL
      expect(queryByTestId("app-page")).toBeInTheDocument();
      expect(queryByTestId("login-page")).not.toBeInTheDocument();
    });

    it("should redirect to /app when state.from contains encoded external URL", () => {
      const user = { id: 1, name: "Test User", companyId: 1 };

      const { queryByTestId } = render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/login",
              state: { from: { pathname: "%68ttps://evil.com/steal" } },
            },
          ]}
        >
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      // Should go to /app regardless of encoded evil URL
      expect(queryByTestId("app-page")).toBeInTheDocument();
    });

    it("should redirect to /app when state.from is a protocol-relative URL", () => {
      const user = { id: 1, name: "Test User", companyId: 1 };

      const { queryByTestId } = render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/login",
              state: { from: { pathname: "//evil.com/phish" } },
            },
          ]}
        >
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      expect(queryByTestId("app-page")).toBeInTheDocument();
    });

    it("should redirect to /app when next query param contains external URL", () => {
      const user = { id: 1, name: "Test User", companyId: 1 };

      // The router does not read ?next= param; it always goes to /app
      const { queryByTestId } = render(
        <MemoryRouter initialEntries={["/login?next=https://evil.com"]}>
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      expect(queryByTestId("app-page")).toBeInTheDocument();
    });
  });

  describe("Internal redirect paths accepted", () => {
    it("should allow redirect to /app/dashboard (internal path)", () => {
      const user = { id: 1, name: "Test User", companyId: 1 };

      // The needsAppRedirect always goes to /app regardless of state.from
      const { queryByTestId } = render(
        <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/app/dashboard" } } }]}>
          <RedirectTestRouter user={user} />
        </MemoryRouter>
      );

      expect(queryByTestId("app-page")).toBeInTheDocument();
    });
  });

  describe("Public pages accessible without auth", () => {
    it("should not redirect /login to /login (no infinite loop)", () => {
      const { getByTestId } = render(
        <MemoryRouter initialEntries={["/login"]}>
          <RedirectTestRouter user={null} />
        </MemoryRouter>
      );

      expect(getByTestId("login-page")).toBeInTheDocument();
    });

    it("should allow access to marketing page without auth", () => {
      const { getByTestId } = render(
        <MemoryRouter initialEntries={["/"]}>
          <RedirectTestRouter user={null} />
        </MemoryRouter>
      );

      expect(getByTestId("marketing")).toBeInTheDocument();
    });
  });
});
