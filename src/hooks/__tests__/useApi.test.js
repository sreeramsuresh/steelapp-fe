import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApi, useApiData } from "../useApi";

vi.mock("../../contexts/ApiHealthContext", () => ({
  reportApiUnhealthy: vi.fn(),
}));

vi.mock("../../services/notificationService", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../utils/errorHandler", () => ({
  DisplayTypes: { TOAST: "toast", PAGE: "page", BANNER: "banner" },
  ErrorTypes: { VALIDATION: "validation", BUSINESS: "business", AUTH: "auth", SYSTEM: "system" },
  getErrorMessage: vi.fn((err) => ({
    message: err.message || "Unknown error",
    type: err._type || "system",
    displayAs: err._displayAs || "banner",
    fields: err._fields || {},
    isNetworkError: err._isNetworkError || false,
    action: err._action || null,
  })),
}));

describe("useApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state", () => {
    const apiFunction = vi.fn();
    const { result } = renderHook(() => useApi(apiFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.appError).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
    expect(typeof result.current.execute).toBe("function");
    expect(typeof result.current.reset).toBe("function");
    expect(typeof result.current.clearFieldError).toBe("function");
    expect(typeof result.current.clearAppError).toBe("function");
  });

  it("returns custom initial data", () => {
    const apiFunction = vi.fn();
    const { result } = renderHook(() => useApi(apiFunction, [], { initialData: [] }));
    expect(result.current.data).toEqual([]);
  });

  it("executes API call successfully", async () => {
    const mockData = { id: 1, name: "Test" };
    const apiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApi(apiFunction));

    let returnedData;
    await act(async () => {
      returnedData = await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(returnedData).toEqual(mockData);
  });

  it("handles validation errors with field errors", async () => {
    const error = new Error("Validation failed");
    error._type = "validation";
    error._fields = { name: "Name is required" };
    const apiFunction = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe("Validation failed");
    expect(result.current.fieldErrors).toEqual({ name: "Name is required" });
    expect(result.current.loading).toBe(false);
  });

  it("handles business errors with toast", async () => {
    const { default: notificationService } = await import("../../services/notificationService");
    const error = new Error("Not allowed");
    error._type = "business";
    error._displayAs = "toast";
    const apiFunction = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(notificationService.error).toHaveBeenCalledWith("Not allowed");
  });

  it("handles auth errors and sets appError", async () => {
    const error = new Error("Unauthorized");
    error._type = "auth";
    const apiFunction = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(result.current.appError).toBeTruthy();
    expect(result.current.appError.message).toBe("Unauthorized");
  });

  it("resets state correctly", async () => {
    const apiFunction = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.data).toEqual({ id: 1 });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.appError).toBeNull();
    expect(result.current.fieldErrors).toEqual({});
  });

  it("clears a specific field error", async () => {
    const error = new Error("Validation");
    error._type = "validation";
    error._fields = { name: "Required", email: "Invalid" };
    const apiFunction = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(result.current.fieldErrors).toEqual({ name: "Required", email: "Invalid" });

    act(() => {
      result.current.clearFieldError("name");
    });

    expect(result.current.fieldErrors).toEqual({ email: "Invalid" });
  });

  it("clears app error", async () => {
    const error = new Error("System error");
    error._type = "system";
    const apiFunction = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(result.current.appError).toBeTruthy();

    act(() => {
      result.current.clearAppError();
    });

    expect(result.current.appError).toBeNull();
  });

  it("re-throws the original error from execute", async () => {
    const error = new Error("API down");
    error._type = "system";
    const apiFunction = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApi(apiFunction));

    await expect(
      act(async () => {
        await result.current.execute();
      })
    ).rejects.toThrow("API down");
  });
});

describe("useApiData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches data on mount when immediate is true", async () => {
    const mockData = [1, 2, 3];
    const apiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApiData(apiFunction));

    // Wait for the effect to run
    await vi.waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(apiFunction).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it("does not fetch on mount when immediate is false", async () => {
    const apiFunction = vi.fn().mockResolvedValue([]);
    renderHook(() => useApiData(apiFunction, [], { immediate: false }));

    // Small wait to ensure effect doesn't fire
    await new Promise((r) => setTimeout(r, 50));
    expect(apiFunction).not.toHaveBeenCalled();
  });

  it("supports backward-compatible boolean options", async () => {
    const apiFunction = vi.fn().mockResolvedValue("data");
    renderHook(() => useApiData(apiFunction, [], false));

    await new Promise((r) => setTimeout(r, 50));
    expect(apiFunction).not.toHaveBeenCalled();
  });

  it("provides refetch function", async () => {
    const apiFunction = vi.fn().mockResolvedValue("data1");
    const { result } = renderHook(() => useApiData(apiFunction));

    await vi.waitFor(() => {
      expect(result.current.data).toBe("data1");
    });

    apiFunction.mockResolvedValue("data2");
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe("data2");
  });

  it("resets state correctly", async () => {
    const apiFunction = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useApiData(apiFunction));

    await vi.waitFor(() => {
      expect(result.current.data).toBe("data");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("uses initialData and skipInitialLoading", () => {
    const apiFunction = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() =>
      useApiData(apiFunction, [], { initialData: [1], skipInitialLoading: true, immediate: false })
    );

    expect(result.current.data).toEqual([1]);
    expect(result.current.loading).toBe(false);
  });
});
