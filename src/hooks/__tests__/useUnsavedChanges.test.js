import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUnsavedChanges } from "../useUnsavedChanges";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("useUnsavedChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns confirmNavigation function", () => {
    const { result } = renderHook(() => useUnsavedChanges(false));
    expect(typeof result.current.confirmNavigation).toBe("function");
  });

  it("calls callback directly when no unsaved changes", () => {
    const { result } = renderHook(() => useUnsavedChanges(false));

    const callback = vi.fn();
    result.current.confirmNavigation(callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("shows confirm dialog when has unsaved changes", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { result } = renderHook(() => useUnsavedChanges(true));

    const callback = vi.fn();
    result.current.confirmNavigation(callback);

    expect(confirmSpy).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it("does not call callback when user cancels confirm", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => useUnsavedChanges(true));

    const callback = vi.fn();
    result.current.confirmNavigation(callback);

    expect(confirmSpy).toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("uses custom message in confirm dialog", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const customMessage = "Are you sure you want to leave?";
    const { result } = renderHook(() => useUnsavedChanges(true, customMessage));

    result.current.confirmNavigation(vi.fn());

    expect(confirmSpy).toHaveBeenCalledWith(customMessage);
    confirmSpy.mockRestore();
  });

  it("registers beforeunload handler when has unsaved changes", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChanges(true));

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    addSpy.mockRestore();
  });

  it("does not register beforeunload when no changes", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChanges(false));

    const beforeunloadCalls = addSpy.mock.calls.filter(
      (call) => call[0] === "beforeunload"
    );
    expect(beforeunloadCalls).toHaveLength(0);
    addSpy.mockRestore();
  });

  it("registers popstate handler for back button", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useUnsavedChanges(true));

    const popstateCalls = addSpy.mock.calls.filter(
      (call) => call[0] === "popstate"
    );
    expect(popstateCalls).toHaveLength(1);
    addSpy.mockRestore();
  });

  it("cleans up event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useUnsavedChanges(true));

    unmount();

    const beforeunloadCalls = removeSpy.mock.calls.filter(
      (call) => call[0] === "beforeunload"
    );
    const popstateCalls = removeSpy.mock.calls.filter(
      (call) => call[0] === "popstate"
    );
    expect(beforeunloadCalls.length).toBeGreaterThanOrEqual(1);
    expect(popstateCalls.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });
});
