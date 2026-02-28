/**
 * AppRouter Component Tests
 * Phase 3C: Core routing component
 *
 * Note: AppRouter uses react-router-dom Routes/Route extensively with lazy loading.
 * We test that it renders without crash and contains expected route structure.
 */

import React, { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app", search: "" }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element, children }) => (
    <div data-testid="route">
      {element}
      {children}
    </div>
  ),
}));

// Mock layout components
vi.mock("../../layouts", () => ({
  CoreERPLayout: ({ children }) => <div data-testid="core-erp-layout">{children}</div>,
}));

vi.mock("../../layouts/AnalyticsLayout", () => ({
  default: ({ children }) => <div data-testid="analytics-layout">{children}</div>,
}));

// Mock ErrorBoundary
vi.mock("../ErrorBoundary", () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock LegacyRedirect
vi.mock("../LegacyRedirect", () => ({
  default: () => <div data-testid="legacy-redirect" />,
}));

// Mock loading fallbacks
vi.mock("../LoadingFallback", () => ({
  InvoiceFormLoadingFallback: () => <div>Loading invoice...</div>,
}));

vi.mock("../AnalyticsLoadingScreen", () => ({
  default: () => <div>Loading analytics...</div>,
}));

// Mock auth service
vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    isAuthenticated: vi.fn().mockReturnValue(true),
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
    getUserRole: vi.fn().mockReturnValue("admin"),
  },
}));

import AppRouter from "../AppRouter";

describe("AppRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without crash", () => {
    const { container } = renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <AppRouter user={{ id: 1, name: "Test" }} onLogout={vi.fn()} />
      </Suspense>
    );

    expect(container).toBeTruthy();
  });

  it("should contain Routes component", () => {
    const { container } = renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <AppRouter user={{ id: 1, name: "Test" }} onLogout={vi.fn()} />
      </Suspense>
    );

    const routes = container.querySelector('[data-testid="routes"]');
    expect(routes).toBeInTheDocument();
  });

  it("should contain Route components", () => {
    const { container } = renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <AppRouter user={{ id: 1, name: "Test" }} onLogout={vi.fn()} />
      </Suspense>
    );

    const routeElements = container.querySelectorAll('[data-testid="route"]');
    expect(routeElements.length).toBeGreaterThan(0);
  });

  it("should accept user and onLogout props", () => {
    const mockUser = { id: 1, name: "Test User", role: "admin" };
    const mockOnLogout = vi.fn();

    const { container } = renderWithProviders(
      <Suspense fallback={<div>Loading...</div>}>
        <AppRouter user={mockUser} onLogout={mockOnLogout} />
      </Suspense>
    );

    expect(container).toBeTruthy();
  });
});
