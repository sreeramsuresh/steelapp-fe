import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/userPreferencesService", () => ({
  userPreferencesService: {
    getHomeSectionOrder: vi.fn(),
    setHomeSectionOrder: vi.fn(),
    getCurrentUser: vi.fn(),
    updatePermissions: vi.fn(),
  },
}));

import { userPreferencesService as mockService } from "../../services/userPreferencesService";
import useHomeSectionOrder from "../useHomeSectionOrder";

const DEFAULT_ORDER = ["quickAccess", "createNew", "recentItems", "integritySummary"];

describe("useHomeSectionOrder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockService.getHomeSectionOrder.mockReturnValue(null);
    mockService.getCurrentUser.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default order initially", () => {
    const { result } = renderHook(() => useHomeSectionOrder());

    expect(result.current.sectionOrder).toEqual(DEFAULT_ORDER);
    expect(result.current.isSaving).toBe(false);
    expect(typeof result.current.reorderSections).toBe("function");
  });

  it("loads saved order from preferences on mount", () => {
    mockService.getHomeSectionOrder.mockReturnValue(["recentItems", "quickAccess", "createNew", "integritySummary"]);

    const { result } = renderHook(() => useHomeSectionOrder());

    expect(result.current.sectionOrder).toEqual(["recentItems", "quickAccess", "createNew", "integritySummary"]);
  });

  it("validates and fills missing sections", () => {
    mockService.getHomeSectionOrder.mockReturnValue(["quickAccess"]);

    const { result } = renderHook(() => useHomeSectionOrder());

    expect(result.current.sectionOrder).toEqual(["quickAccess", "createNew", "recentItems", "integritySummary"]);
  });

  it("filters invalid sections", () => {
    mockService.getHomeSectionOrder.mockReturnValue(["quickAccess", "invalidSection", "createNew"]);

    const { result } = renderHook(() => useHomeSectionOrder());

    expect(result.current.sectionOrder).toContain("quickAccess");
    expect(result.current.sectionOrder).toContain("createNew");
    expect(result.current.sectionOrder).not.toContain("invalidSection");
    expect(result.current.sectionOrder).toHaveLength(4); // all valid sections
  });

  it("reorders sections and saves to localStorage", () => {
    const { result } = renderHook(() => useHomeSectionOrder());

    const newOrder = ["integritySummary", "createNew", "recentItems", "quickAccess"];

    act(() => {
      result.current.reorderSections(newOrder);
    });

    expect(result.current.sectionOrder).toEqual(newOrder);
    expect(mockService.setHomeSectionOrder).toHaveBeenCalledWith(newOrder);
  });

  it("syncs to backend after debounce", async () => {
    mockService.getCurrentUser.mockReturnValue({ id: 1, permissions: {} });
    mockService.updatePermissions.mockResolvedValue({});

    const { result } = renderHook(() => useHomeSectionOrder());

    act(() => {
      result.current.reorderSections(["createNew", "quickAccess", "recentItems", "integritySummary"]);
    });

    // Before debounce
    expect(mockService.updatePermissions).not.toHaveBeenCalled();

    // After 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockService.updatePermissions).toHaveBeenCalledTimes(1);
  });

  it("does not sync to backend when not logged in", async () => {
    mockService.getCurrentUser.mockReturnValue(null);

    const { result } = renderHook(() => useHomeSectionOrder());

    act(() => {
      result.current.reorderSections(DEFAULT_ORDER);
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockService.updatePermissions).not.toHaveBeenCalled();
  });

  it("handles backend sync error gracefully", async () => {
    mockService.getCurrentUser.mockReturnValue({ id: 1, permissions: {} });
    mockService.updatePermissions.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useHomeSectionOrder());

    act(() => {
      result.current.reorderSections(DEFAULT_ORDER);
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Should not throw - saves locally as fallback
    expect(result.current.isSaving).toBe(false);
  });

  it("cleans up debounce timer on unmount", () => {
    const { result, unmount } = renderHook(() => useHomeSectionOrder());

    act(() => {
      result.current.reorderSections(DEFAULT_ORDER);
    });

    unmount();

    // No error should occur
    vi.advanceTimersByTime(1000);
  });
});
