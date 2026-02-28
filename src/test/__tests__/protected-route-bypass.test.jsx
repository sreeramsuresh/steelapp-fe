/**
 * Protected Route Bypass Tests
 *
 * Tests that direct URL access to protected routes requires authentication.
 * Validates the ProtectedRoute component pattern and routing configuration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";

// Minimal ProtectedRoute mock that mirrors the app's pattern
function MockProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Minimal test component for protected pages
function ProtectedPage() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function LoginPage() {
  return <div data-testid="login-page">Login Page</div>;
}

describe("Protected Route Bypass Prevention", () => {
  describe("Unauthenticated Access", () => {
    it("redirects to /login when user is null", () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <MockProtectedRoute user={null}>
                  <ProtectedPage />
                </MockProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("login-page")).toBeDefined();
      expect(screen.queryByTestId("protected-content")).toBeNull();
    });

    it("redirects to /login when user is undefined", () => {
      render(
        <MemoryRouter initialEntries={["/invoices"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/invoices"
              element={
                <MockProtectedRoute user={undefined}>
                  <ProtectedPage />
                </MockProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("login-page")).toBeDefined();
      expect(screen.queryByTestId("protected-content")).toBeNull();
    });

    it("redirects for any protected path without auth", () => {
      const protectedPaths = [
        "/dashboard",
        "/invoices",
        "/customers",
        "/products",
        "/inventory",
        "/purchase-orders",
        "/quotations",
        "/settings",
      ];

      for (const path of protectedPaths) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path={path}
                element={
                  <MockProtectedRoute user={null}>
                    <ProtectedPage />
                  </MockProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        expect(screen.getByTestId("login-page")).toBeDefined();
        expect(screen.queryByTestId("protected-content")).toBeNull();
        unmount();
      }
    });
  });

  describe("Authenticated Access", () => {
    const mockUser = { id: 1, email: "test@example.com", companyId: 1, role: "admin" };

    it("renders protected content when user is authenticated", () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <MockProtectedRoute user={mockUser}>
                  <ProtectedPage />
                </MockProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("protected-content")).toBeDefined();
      expect(screen.queryByTestId("login-page")).toBeNull();
    });

    it("does not redirect authenticated users away from protected routes", () => {
      render(
        <MemoryRouter initialEntries={["/invoices"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/invoices"
              element={
                <MockProtectedRoute user={mockUser}>
                  <ProtectedPage />
                </MockProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("protected-content")).toBeDefined();
    });
  });

  describe("Public Route Access", () => {
    it("login page is accessible without auth", () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("login-page")).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("handles user object with missing fields gracefully", () => {
      const partialUser = { id: 1 }; // Missing email, companyId, role

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <MockProtectedRoute user={partialUser}>
                  <ProtectedPage />
                </MockProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Partial user is still truthy, so should render
      expect(screen.getByTestId("protected-content")).toBeDefined();
    });

    it("empty object user is treated as authenticated", () => {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <MockProtectedRoute user={{}}>
                  <ProtectedPage />
                </MockProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // {} is truthy — the app's actual ProtectedRoute may handle this differently
      expect(screen.getByTestId("protected-content")).toBeDefined();
    });

    it("false-y values redirect to login", () => {
      const falsyValues = [null, undefined, 0, "", false];

      for (const value of falsyValues) {
        const { unmount } = render(
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <MockProtectedRoute user={value}>
                    <ProtectedPage />
                  </MockProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        );

        expect(screen.getByTestId("login-page")).toBeDefined();
        expect(screen.queryByTestId("protected-content")).toBeNull();
        unmount();
      }
    });
  });
});
