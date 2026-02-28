/**
 * ProtectedRoute Component Tests
 * Phase 3C: Core auth/routing component
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/dashboard", search: "" }),
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
}));

// Mock auth service
const mockIsAuthenticated = vi.fn();
const mockHasRole = vi.fn();
const mockHasPermission = vi.fn();
const mockGetUserRole = vi.fn();

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    isAuthenticated: (...args) => mockIsAuthenticated(...args),
    hasRole: (...args) => mockHasRole(...args),
    hasPermission: (...args) => mockHasPermission(...args),
    getUserRole: (...args) => mockGetUserRole(...args),
  },
}));

import ProtectedRoute from "../ProtectedRoute";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
    mockHasRole.mockReturnValue(true);
    mockHasPermission.mockReturnValue(true);
    mockGetUserRole.mockReturnValue("admin");
  });

  describe("Authentication", () => {
    it("should render children when user is authenticated", () => {
      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }}>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Protected Content");
    });

    it("should redirect to /login when not authenticated", () => {
      mockIsAuthenticated.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute user={null}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const navigate = container.querySelector('[data-testid="navigate"]');
      expect(navigate).toBeInTheDocument();
      expect(navigate.getAttribute("data-to")).toBe("/login");
    });

    it("should redirect to custom fallbackPath when not authenticated", () => {
      mockIsAuthenticated.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute user={null} fallbackPath="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const navigate = container.querySelector('[data-testid="navigate"]');
      expect(navigate).toBeInTheDocument();
      expect(navigate.getAttribute("data-to")).toBe("/custom-login");
    });

    it("should show loading state when authenticated but no user object", () => {
      const { container } = renderWithProviders(
        <ProtectedRoute user={null}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Loading...");
    });
  });

  describe("Role-Based Access", () => {
    it("should render children when user has required role", () => {
      mockHasRole.mockReturnValue(true);

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Admin Content");
    });

    it("should show Access Denied when user lacks required role", () => {
      mockHasRole.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Access Denied");
      expect(container.textContent).not.toContain("Admin Content");
    });

    it("should support requiredRoles array", () => {
      mockHasRole.mockImplementation((role) => role === "manager");

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredRoles={["admin", "manager"]}>
          <div>Manager Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Manager Content");
    });

    it("should deny access when user has none of requiredRoles", () => {
      mockHasRole.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredRoles={["admin", "manager"]}>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Access Denied");
    });

    it("should display required and current role info on access denied", () => {
      mockHasRole.mockReturnValue(false);
      mockGetUserRole.mockReturnValue("viewer");

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredRole="admin">
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("viewer");
      expect(container.textContent).toContain("admin");
    });
  });

  describe("Permission-Based Access", () => {
    it("should render children when user has required permission", () => {
      mockHasPermission.mockReturnValue(true);

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredPermission="invoices.read">
          <div>Invoice Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Invoice Content");
    });

    it("should show Insufficient Permissions when user lacks permission", () => {
      mockHasPermission.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredPermission="invoices.delete">
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Insufficient Permissions");
    });
  });

  describe("Go Back Button", () => {
    it("should render go back button on access denied", () => {
      mockHasRole.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute user={{ id: 1, name: "Test" }} requiredRole="admin">
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Go Back");
    });
  });
});
