import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDashboardPermissions } from "../useDashboardPermissions";

const mockGetUser = vi.fn();
const mockGetToken = vi.fn();

vi.mock("../../services/authService", () => ({
  authService: {
    getUser: () => mockGetUser(),
    getToken: () => mockGetToken(),
  },
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
    mockGetUser.mockReturnValue({ id: 1, role: "admin" });
    mockGetToken.mockReturnValue("token123");
  });

  it("loads user on mount", async () => {
    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual({ id: 1, role: "admin" });
    expect(result.current.role).toBe("ADMIN");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("maps admin role correctly", async () => {
    mockGetUser.mockReturnValue({ id: 1, role: "Administrator" });

    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("ADMIN");
  });

  it("maps CEO role correctly", async () => {
    mockGetUser.mockReturnValue({ id: 1, role: "CEO" });

    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("CEO");
  });

  it("maps sales agent role correctly", async () => {
    mockGetUser.mockReturnValue({ id: 1, role: "salesperson" });

    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("SALES_AGENT");
  });

  it("defaults to SALES_AGENT for unknown role", async () => {
    mockGetUser.mockReturnValue({ id: 1, role: "unknown_role" });

    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("SALES_AGENT");
  });

  it("defaults to SALES_AGENT when no user", async () => {
    mockGetUser.mockReturnValue(null);

    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe("SALES_AGENT");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("canViewWidget delegates to config", async () => {
    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const canView = result.current.canViewWidget("widget1");
    expect(typeof canView).toBe("boolean");
  });

  it("provides visible widgets", async () => {
    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.visibleWidgets).toBeTruthy();
    expect(Array.isArray(result.current.visibleWidgets)).toBe(true);
  });

  it("provides default layout", async () => {
    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.defaultLayout).toBeTruthy();
    expect(Array.isArray(result.current.defaultLayout)).toBe(true);
  });

  it("handles getUser error gracefully", async () => {
    mockGetUser.mockImplementation(() => {
      throw new Error("No user");
    });

    const { result } = renderHook(() => useDashboardPermissions());

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.role).toBe("SALES_AGENT");
  });
});
