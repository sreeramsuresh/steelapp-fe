import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useEscapeKey from "../useEscapeKey";

describe("useEscapeKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls callback on Escape key press", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback, true));

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call callback when disabled", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback, false));

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it("does not call callback on other keys", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback, true));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));

    expect(callback).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(callback, true));

    unmount();

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it("defaults to enabled", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback));

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(callback).toHaveBeenCalled();
  });

  it("re-registers when callback changes", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(({ cb }) => useEscapeKey(cb, true), { initialProps: { cb: callback1 } });

    rerender({ cb: callback2 });

    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });
});
