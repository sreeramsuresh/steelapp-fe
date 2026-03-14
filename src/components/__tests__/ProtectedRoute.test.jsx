/**
 * ProtectedRoute Component Tests
 * Phase 3C: Core auth/routing component
 */

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

// Mock useAuth — ProtectedRoute now reads from AuthContext, not authService
const mockUser = { id: 1, name: "Test", role: "admin", roleNames: ["admin"] };
const mockHasRole = vi.fn();
const mockHasPermission = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

import ProtectedRoute from "../ProtectedRoute";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasRole.mockReturnValue(true);
    mockHasPermission.mockReturnValue(true);
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
      role: "admin",
    });
  });

  describe("Authentication", () => {
    it("should render children when user is authenticated", () => {
      const { container } = renderWithProviders(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Protected Content");
    });

    it("should redirect to /login when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        hasRole: mockHasRole,
        hasPermission: mockHasPermission,
        role: null,
      });

      const { container } = renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const navigate = container.querySelector('[data-testid="navigate"]');
      expect(navigate).toBeInTheDocument();
      expect(navigate.getAttribute("data-to")).toBe("/login");
    });

    it("should redirect to custom fallbackPath when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        hasRole: mockHasRole,
        hasPermission: mockHasPermission,
        role: null,
      });

      const { container } = renderWithProviders(
        <ProtectedRoute fallbackPath="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const navigate = container.querySelector('[data-testid="navigate"]');
      expect(navigate).toBeInTheDocument();
      expect(navigate.getAttribute("data-to")).toBe("/custom-login");
    });

    it("should redirect when user is null (no loading state — App.jsx gates bootstrap)", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        hasRole: mockHasRole,
        hasPermission: mockHasPermission,
        role: null,
      });

      const { container } = renderWithProviders(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const navigate = container.querySelector('[data-testid="navigate"]');
      expect(navigate).toBeInTheDocument();
    });
  });

  describe("Role-Based Access", () => {
    it("should render children when user has required role", () => {
      mockHasRole.mockReturnValue(true);

      const { container } = renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Admin Content");
    });

    it("should show Access Denied when user lacks required role", () => {
      mockHasRole.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Access Denied");
      expect(container.textContent).not.toContain("Admin Content");
    });

    it("should support requiredRoles array", () => {
      mockHasRole.mockImplementation((role) => role === "manager");

      const { container } = renderWithProviders(
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <div>Manager Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Manager Content");
    });

    it("should deny access when user has none of requiredRoles", () => {
      mockHasRole.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute requiredRoles={["admin", "manager"]}>
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Access Denied");
    });

    it("should display required and current role info on access denied", () => {
      mockHasRole.mockReturnValue(false);
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isAuthenticated: true,
        hasRole: mockHasRole,
        hasPermission: mockHasPermission,
        role: "viewer",
      });

      const { container } = renderWithProviders(
        <ProtectedRoute requiredRole="admin">
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
        <ProtectedRoute requiredPermission="invoices.read">
          <div>Invoice Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Invoice Content");
    });

    it("should show Insufficient Permissions when user lacks permission", () => {
      mockHasPermission.mockReturnValue(false);

      const { container } = renderWithProviders(
        <ProtectedRoute requiredPermission="invoices.delete">
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
        <ProtectedRoute requiredRole="admin">
          <div>Content</div>
        </ProtectedRoute>
      );

      expect(container.textContent).toContain("Go Back");
    });
  });
});
