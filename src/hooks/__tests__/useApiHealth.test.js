import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApiHealth } from "../useApiHealth";

describe("useApiHealth", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial state assuming healthy", () => {
    const { result } = renderHook(() => useApiHealth({ enabled: false }));

    expect(result.current.isHealthy).toBe(true);
    expect(result.current.isChecking).toBe(false);
    expect(result.current.lastChecked).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.checkNow).toBe("function");
  });

  it("does not check when disabled", () => {
    renderHook(() => useApiHealth({ enabled: false }));

    vi.advanceTimersByTime(5000);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("checks health after initial delay when enabled", async () => {
    global.fetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApiHealth({ enabled: true, pollingInterval: 30000 }));

    // Initial check fires after 1s delay
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.isHealthy).toBe(true);
    expect(result.current.lastChecked).toBeTruthy();
  });

  it("sets unhealthy on non-ok response", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503 });

    const { result } = renderHook(() => useApiHealth({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isHealthy).toBe(false);
    expect(result.current.error).toBe("Server returned status 503");
  });

  it("sets unhealthy on fetch failure", async () => {
    global.fetch.mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => useApiHealth({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isHealthy).toBe(false);
    expect(result.current.error).toBe("Cannot connect to server");
  });

  it("sets timeout error on AbortError", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    global.fetch.mockRejectedValue(abortError);

    const { result } = renderHook(() => useApiHealth({ enabled: true }));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isHealthy).toBe(false);
    expect(result.current.error).toBe("Server is not responding (timeout)");
  });

  it("allows manual health check via checkNow", async () => {
    global.fetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApiHealth({ enabled: true }));

    await act(async () => {
      await result.current.checkNow();
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(result.current.isHealthy).toBe(true);
  });

  it("polls at configured interval", async () => {
    global.fetch.mockResolvedValue({ ok: true });

    renderHook(() => useApiHealth({ enabled: true, pollingInterval: 5000 }));

    // Initial check
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // First poll
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Second poll
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // 1 initial + 2 polls = 3
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("cleans up intervals on unmount", async () => {
    global.fetch.mockResolvedValue({ ok: true });

    const { unmount } = renderHook(() => useApiHealth({ enabled: true, pollingInterval: 5000 }));

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    unmount();

    // After unmount, no more fetches should happen
    const callCount = global.fetch.mock.calls.length;
    vi.advanceTimersByTime(20000);
    expect(global.fetch).toHaveBeenCalledTimes(callCount);
  });
});
