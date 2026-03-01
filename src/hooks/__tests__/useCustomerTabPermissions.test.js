import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCustomerTabPermissions } from "../useCustomerTabPermissions";

const mockHasPermission = vi.fn();
const mockHasRole = vi.fn();

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, role: "admin" },
  }),
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: (...args) => mockHasPermission(...args),
    hasRole: (...args) => mockHasRole(...args),
  },
}));

describe("useCustomerTabPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
    mockHasRole.mockReturnValue(true);
  });

  it("returns tab permissions for admin with all access", () => {
    const { result } = renderHook(() => useCustomerTabPermissions());

    expect(result.current.tabPermissions.overview).toBe(true);
    expect(result.current.tabPermissions.invoices).toBe(true);
    expect(result.current.tabPermissions.payments).toBe(true);
    expect(result.current.tabPermissions["credit-notes"]).toBe(true);
    expect(result.current.tabPermissions.activity).toBe(true);
    expect(result.current.tabPermissions["ar-aging"]).toBe(true);
  });

  it("hasAnyTabAccess is true when at least one tab allowed", () => {
    const { result } = renderHook(() => useCustomerTabPermissions());
    expect(result.current.hasAnyTabAccess).toBe(true);
  });

  it("getFirstAllowedTab returns first tab", () => {
    const { result } = renderHook(() => useCustomerTabPermissions());
    const firstTab = result.current.getFirstAllowedTab();
    expect(firstTab).toBe("overview");
  });

  it("restricts tabs based on permissions", () => {
    mockHasPermission.mockImplementation((resource, action) => {
      if (resource === "customers" && action === "read") return true;
      if (resource === "invoices" && action === "read") return false;
      if (resource === "payments" && action === "read") return false;
      if (resource === "credit_notes" && action === "read") return false;
      if (resource === "finance" && action === "view") return false;
      return false;
    });
    mockHasRole.mockReturnValue(false);

    const { result } = renderHook(() => useCustomerTabPermissions());

    expect(result.current.tabPermissions.overview).toBe(true);
    expect(result.current.tabPermissions.invoices).toBe(false);
    expect(result.current.tabPermissions.payments).toBe(false);
    expect(result.current.tabPermissions["credit-notes"]).toBe(false);
    expect(result.current.tabPermissions.activity).toBe(true);
  });

  it("getFirstAllowedTab returns null when no access", () => {
    mockHasPermission.mockReturnValue(false);
    mockHasRole.mockReturnValue(false);

    const { result } = renderHook(() => useCustomerTabPermissions());
    expect(result.current.getFirstAllowedTab()).toBeNull();
    expect(result.current.hasAnyTabAccess).toBe(false);
  });
});
