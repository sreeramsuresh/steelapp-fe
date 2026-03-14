import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardPermissions } from "../useDashboardPermissions";

// Mock useAuth to provide user context
const mockUseAuth = vi.fn();
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../components/dashboard/config/DashboardConfig", () => ({
  DASHBOARD_ROLES: {
    ADMIN: "ADMIN",
    CEO: "CEO",
    CFO: "CFO",
    SALES_MANAGER: "SALES_MANAGER",
    OPERATIONS_MANAGER: "OPERATIONS_MANAGER",
    WAREHOUSE_MANAGER: "WAREHOUSE_MANAGER",
    SALES_AGENT: "SALES_AGENT",
    ACCOUNTANT: "ACCOUNTANT",
  },
  canViewWidget: vi.fn((_widgetId, role) => role === "ADMIN"),
  getDefaultLayout: vi.fn((role) => [{ id: "default", role }]),
  getVisibleWidgets: vi.fn((role) => [{ id: "widget1", role }]),
  getWidgetsByCategory: vi.fn((category, role) => [{ category, role }]),
}));

describe("useDashboardPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: "admin" },
      isAuthenticated: true,
    });
  });

  it("loads user from context", () => {
    const { result } = renderHook(() => useDashboardPermissions());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual({ id: 1, role: "admin" });
    expect(result.current.role).toBe("ADMIN");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("maps admin role correctly", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: "Administrator" },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.role).toBe("ADMIN");
  });

  it("maps CEO role correctly", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: "CEO" },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.role).toBe("CEO");
  });

  it("maps sales agent role correctly", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: "salesperson" },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.role).toBe("SALES_AGENT");
  });

  it("defaults to SALES_AGENT for unknown role", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, role: "unknown_role" },
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.role).toBe("SALES_AGENT");
  });

  it("defaults to SALES_AGENT when no user", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.role).toBe("SALES_AGENT");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("canViewWidget delegates to config", () => {
    const { result } = renderHook(() => useDashboardPermissions());
    const canView = result.current.canViewWidget("widget1");
    expect(typeof canView).toBe("boolean");
  });

  it("provides visible widgets", () => {
    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.visibleWidgets).toBeTruthy();
    expect(Array.isArray(result.current.visibleWidgets)).toBe(true);
  });

  it("provides default layout", () => {
    const { result } = renderHook(() => useDashboardPermissions());
    expect(result.current.defaultLayout).toBeTruthy();
    expect(Array.isArray(result.current.defaultLayout)).toBe(true);
  });
});
