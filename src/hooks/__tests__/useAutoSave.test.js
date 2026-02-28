import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useAutoSave, { formatRelativeTime, getAutoSaveStatusDisplay } from "../useAutoSave";

vi.mock("../../utils/invoiceUtils", () => ({
  formatDateDMY: vi.fn((ts) => `formatted-${ts}`),
}));

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useAutoSave({}, null, { enabled: false }));

    expect(result.current.status).toBe("saved");
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasLocalDraft).toBe(false);
    expect(result.current.isDirty).toBe(false);
    expect(typeof result.current.saveNow).toBe("function");
    expect(typeof result.current.clearLocalDraft).toBe("function");
  });

  it("saves to localStorage via saveNow", () => {
    const data = { customer: "Test" };
    const { result } = renderHook(() => useAutoSave(data, "123"));

    act(() => {
      result.current.saveNow();
    });

    expect(result.current.status).toBe("saved");
    expect(result.current.hasLocalDraft).toBe(true);
    const stored = JSON.parse(localStorage.getItem("invoice_draft_123"));
    expect(stored.data).toEqual(data);
    expect(stored.invoiceId).toBe("123");
  });

  it("loads from localStorage", () => {
    const stored = { data: { customer: "Loaded" }, timestamp: Date.now(), invoiceId: "456" };
    localStorage.setItem("invoice_draft_456", JSON.stringify(stored));

    const { result } = renderHook(() => useAutoSave({}, "456"));

    const loaded = result.current.loadFromLocal();
    expect(loaded.data).toEqual({ customer: "Loaded" });
  });

  it("clears local draft", () => {
    localStorage.setItem("invoice_draft_789", JSON.stringify({ data: {}, timestamp: Date.now() }));

    const { result } = renderHook(() => useAutoSave({}, "789"));

    act(() => {
      result.current.clearLocalDraft();
    });

    expect(localStorage.getItem("invoice_draft_789")).toBeNull();
    expect(result.current.hasLocalDraft).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("uses 'new' key when invoiceId is null", () => {
    const { result } = renderHook(() => useAutoSave({ test: true }, null));

    act(() => {
      result.current.saveNow();
    });

    expect(localStorage.getItem("invoice_draft_new")).toBeTruthy();
  });

  it("does not save when disabled", () => {
    const { result } = renderHook(() =>
      useAutoSave({ test: true }, "100", { enabled: false })
    );

    act(() => {
      result.current.saveNow();
    });

    expect(localStorage.getItem("invoice_draft_100")).toBeNull();
  });

  it("checks for recoverable draft", () => {
    localStorage.setItem(
      "invoice_draft_200",
      JSON.stringify({ data: { note: "recovered" }, timestamp: Date.now(), invoiceId: "200" })
    );

    const { result } = renderHook(() => useAutoSave({}, "200"));

    const draft = result.current.checkForRecoverableDraft();
    expect(draft).toBeTruthy();
    expect(draft.data.note).toBe("recovered");
  });
});

describe("formatRelativeTime", () => {
  it("returns empty string for falsy input", () => {
    expect(formatRelativeTime(null)).toBe("");
    expect(formatRelativeTime(0)).toBe("");
  });

  it("returns 'just now' for recent timestamps", () => {
    expect(formatRelativeTime(Date.now() - 5000)).toBe("just now");
  });

  it("returns seconds ago", () => {
    expect(formatRelativeTime(Date.now() - 30000)).toBe("30s ago");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime(Date.now() - 300000)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime(Date.now() - 7200000)).toBe("2h ago");
  });
});

describe("getAutoSaveStatusDisplay", () => {
  it("returns saved status", () => {
    const display = getAutoSaveStatusDisplay("saved", "5m ago");
    expect(display.text).toContain("Draft saved");
    expect(display.color).toContain("green");
  });

  it("returns saving status", () => {
    const display = getAutoSaveStatusDisplay("saving", "");
    expect(display.text).toBe("Saving draft...");
    expect(display.color).toContain("yellow");
  });

  it("returns unsaved status", () => {
    const display = getAutoSaveStatusDisplay("unsaved", "");
    expect(display.text).toBe("Unsaved changes");
    expect(display.color).toContain("orange");
  });

  it("returns recovered status", () => {
    const display = getAutoSaveStatusDisplay("recovered", "");
    expect(display.text).toBe("Draft recovered");
    expect(display.color).toContain("blue");
  });

  it("returns empty for unknown status", () => {
    const display = getAutoSaveStatusDisplay("unknown", "");
    expect(display.text).toBe("");
  });
});
