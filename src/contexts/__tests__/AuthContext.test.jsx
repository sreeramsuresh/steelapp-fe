import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="isAuthenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="userId">{String(auth.userId ?? "")}</span>
      <span data-testid="companyId">{String(auth.companyId ?? "")}</span>
      <span data-testid="companyName">{String(auth.companyName ?? "")}</span>
      <span data-testid="role">{String(auth.role ?? "")}</span>
      <span data-testid="user">{JSON.stringify(auth.user ?? null)}</span>
    </div>
  );
}

describe("AuthContext", () => {
  it("provides unauthenticated state when user is null", () => {
    render(
      <AuthProvider user={null}>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("userId")).toHaveTextContent("");
    expect(screen.getByTestId("companyId")).toHaveTextContent("");
    expect(screen.getByTestId("role")).toHaveTextContent("");
  });

  it("provides unauthenticated state when user is undefined", () => {
    render(
      <AuthProvider user={undefined}>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
  });

  it("provides authenticated state when user is provided", () => {
    const mockUser = {
      id: 42,
      companyId: 10,
      companyName: "Steel Corp",
      role: "admin",
      email: "admin@steel.com",
    };

    render(
      <AuthProvider user={mockUser}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("userId")).toHaveTextContent("42");
    expect(screen.getByTestId("companyId")).toHaveTextContent("10");
    expect(screen.getByTestId("companyName")).toHaveTextContent("Steel Corp");
    expect(screen.getByTestId("role")).toHaveTextContent("admin");
  });

  it("exposes full user object", () => {
    const mockUser = {
      id: 1,
      companyId: 5,
      companyName: "Test Co",
      role: "viewer",
      name: "John",
    };

    render(
      <AuthProvider user={mockUser}>
        <TestConsumer />
      </AuthProvider>
    );

    const userJson = JSON.parse(screen.getByTestId("user").textContent);
    expect(userJson).toEqual(mockUser);
  });

  it("throws error when useAuth is used outside AuthProvider", () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow("useAuth must be used within AuthProvider");

    spy.mockRestore();
  });

  it("updates values when user prop changes", () => {
    const user1 = { id: 1, companyId: 10, companyName: "Co A", role: "admin" };
    const user2 = { id: 2, companyId: 20, companyName: "Co B", role: "viewer" };

    const { rerender } = render(
      <AuthProvider user={user1}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("userId")).toHaveTextContent("1");
    expect(screen.getByTestId("companyName")).toHaveTextContent("Co A");

    rerender(
      <AuthProvider user={user2}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("userId")).toHaveTextContent("2");
    expect(screen.getByTestId("companyName")).toHaveTextContent("Co B");
  });

  it("transitions from authenticated to unauthenticated (logout)", () => {
    const mockUser = { id: 1, companyId: 10, companyName: "Co", role: "admin" };

    const { rerender } = render(
      <AuthProvider user={mockUser}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("true");

    rerender(
      <AuthProvider user={null}>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("isAuthenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("userId")).toHaveTextContent("");
  });
});
