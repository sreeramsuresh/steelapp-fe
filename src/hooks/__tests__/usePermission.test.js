import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePermission } from "../usePermission";

const mockHasPermission = vi.fn();

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: (...args) => mockHasPermission(...args),
  },
}));

describe("usePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a callable function", () => {
    const { result } = renderHook(() => usePermission());
    expect(typeof result.current).toBe("function");
  });

  it("checks permission with resource and action", () => {
    mockHasPermission.mockReturnValue(true);
    const { result } = renderHook(() => usePermission());

    const allowed = result.current("invoices", "create");
    expect(mockHasPermission).toHaveBeenCalledWith("invoices", "create");
    expect(allowed).toBe(true);
  });

  it("returns false when permission denied", () => {
    mockHasPermission.mockReturnValue(false);
    const { result } = renderHook(() => usePermission());

    expect(result.current("admin", "delete")).toBe(false);
  });

  it("provides convenience read method", () => {
    mockHasPermission.mockReturnValue(true);
    const { result } = renderHook(() => usePermission());

    expect(result.current.read("invoices")).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith("invoices", "read");
  });

  it("provides convenience create method", () => {
    mockHasPermission.mockReturnValue(false);
    const { result } = renderHook(() => usePermission());

    expect(result.current.create("products")).toBe(false);
    expect(mockHasPermission).toHaveBeenCalledWith("products", "create");
  });

  it("provides convenience update method", () => {
    mockHasPermission.mockReturnValue(true);
    const { result } = renderHook(() => usePermission());

    expect(result.current.update("customers")).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith("customers", "update");
  });

  it("provides convenience delete method", () => {
    mockHasPermission.mockReturnValue(false);
    const { result } = renderHook(() => usePermission());

    expect(result.current.delete("orders")).toBe(false);
    expect(mockHasPermission).toHaveBeenCalledWith("orders", "delete");
  });
});
