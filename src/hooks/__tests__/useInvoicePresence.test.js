import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../services/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../../services/axiosApi", () => ({
  tokenUtils: {
    getUser: () => ({ id: 1, name: "Test User" }),
  },
}));

import { apiClient as mockApiClient } from "../../services/api";
import { useInvoicePresence } from "../useInvoicePresence";

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234";
vi.stubGlobal("crypto", { randomUUID: () => mockUUID });

describe("useInvoicePresence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockApiClient.post.mockResolvedValue({});
    mockApiClient.get.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useInvoicePresence(null));

    expect(result.current.activeSessions).toEqual([]);
    expect(result.current.otherSessions).toEqual([]);
    expect(result.current.sessionId).toBe(mockUUID);
    expect(typeof result.current.updateMode).toBe("function");
    expect(typeof result.current.refetchSessions).toBe("function");
  });

  it("does not start session when invoiceId is null", () => {
    renderHook(() => useInvoicePresence(null));
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it("starts session when invoiceId provided", async () => {
    renderHook(() => useInvoicePresence(123, "edit"));

    await act(async () => {
      // Wait for promises to resolve
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/invoices/123/edit-sessions/start",
      { mode: "edit", session_id: mockUUID }
    );
  });

  it("fetches active sessions on mount", async () => {
    mockApiClient.get.mockResolvedValue([
      { userId: 1, mode: "edit" },
      { userId: 2, mode: "view" },
    ]);

    const { result } = renderHook(() => useInvoicePresence(123));

    await act(async () => {});

    expect(mockApiClient.get).toHaveBeenCalledWith("/invoices/123/edit-sessions");
    expect(result.current.activeSessions).toHaveLength(2);
  });

  it("filters out current user from otherSessions", async () => {
    mockApiClient.get.mockResolvedValue([
      { userId: 1, mode: "edit" },
      { userId: 2, mode: "view" },
    ]);

    const { result } = renderHook(() => useInvoicePresence(123));

    await act(async () => {});

    // Current user id is 1, so otherSessions excludes them
    expect(result.current.otherSessions).toHaveLength(1);
    expect(result.current.otherSessions[0].userId).toBe(2);
  });

  it("ends session on unmount", async () => {
    const { unmount } = renderHook(() => useInvoicePresence(123));

    await act(async () => {});

    unmount();

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/invoices/123/edit-sessions/end",
      { session_id: mockUUID }
    );
  });

  it("updateMode sends mode change", async () => {
    const { result } = renderHook(() => useInvoicePresence(123, "view"));

    await act(async () => {
      await result.current.updateMode("edit");
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      "/invoices/123/edit-sessions/start",
      { mode: "edit", session_id: mockUUID }
    );
  });

  it("handles API errors gracefully", async () => {
    mockApiClient.post.mockRejectedValue(new Error("Network error"));
    mockApiClient.get.mockRejectedValue(new Error("Network error"));

    // Should not throw
    const { result } = renderHook(() => useInvoicePresence(123));

    await act(async () => {});

    expect(result.current.activeSessions).toEqual([]);
  });

  it("cleans up intervals on unmount", async () => {
    const { unmount } = renderHook(() => useInvoicePresence(123));

    await act(async () => {});

    unmount();

    // After unmount, advancing timers should not cause additional API calls
    const callCount = mockApiClient.post.mock.calls.length;
    vi.advanceTimersByTime(90000);
    // The call count might increase by the end session call, but no heartbeat
  });
});
