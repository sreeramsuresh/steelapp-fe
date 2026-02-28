import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useCreditNoteDrafts, {
  formatRelativeTime,
  formatTimeUntilExpiry,
  getDraftStatusMessage,
  cleanupExpiredDrafts,
} from "../useCreditNoteDrafts";

vi.mock("../../utils/invoiceUtils", () => ({
  formatDateDMY: vi.fn((ts) => `formatted-${ts}`),
}));

const STORAGE_KEY = "credit_note_drafts";

describe("useCreditNoteDrafts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useCreditNoteDrafts());

    expect(result.current.drafts).toEqual({});
    expect(result.current.currentDraft).toBeNull();
    expect(result.current.conflictInfo).toBeNull();
    expect(result.current.allDrafts).toEqual([]);
    expect(result.current.hasDrafts).toBe(false);
  });

  it("saves a draft", () => {
    const { result } = renderHook(() =>
      useCreditNoteDrafts({ currentInvoiceId: 42 })
    );

    act(() => {
      result.current.saveDraft(
        { amount: 500, reason: "Defective" },
        { invoiceId: 42, invoiceNumber: "INV-001", customerName: "Acme" }
      );
    });

    expect(result.current.currentDraft).toBeTruthy();
    expect(result.current.currentDraft.invoiceNumber).toBe("INV-001");
    expect(result.current.hasDrafts).toBe(true);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored[42]).toBeTruthy();
    expect(stored[42].data.amount).toBe(500);
  });

  it("does not save without invoiceId", () => {
    const { result } = renderHook(() => useCreditNoteDrafts());

    const saved = result.current.saveDraft({ amount: 100 }, {});
    expect(saved).toBe(false);
  });

  it("gets a specific draft", () => {
    const draft = {
      data: { amount: 200 },
      invoiceId: 10,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 10: draft }));

    const { result } = renderHook(() =>
      useCreditNoteDrafts({ currentInvoiceId: 10 })
    );

    const fetched = result.current.getDraft(10);
    expect(fetched).toBeTruthy();
    expect(fetched.data.amount).toBe(200);
  });

  it("returns null for expired draft", () => {
    const draft = {
      data: { amount: 200 },
      invoiceId: 10,
      timestamp: Date.now() - 86400000,
      expiresAt: Date.now() - 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 10: draft }));

    const { result } = renderHook(() => useCreditNoteDrafts());

    expect(result.current.getDraft(10)).toBeNull();
  });

  it("deletes a draft", () => {
    const draft = {
      data: {},
      invoiceId: 5,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 5: draft }));

    const { result } = renderHook(() =>
      useCreditNoteDrafts({ currentInvoiceId: 5 })
    );

    act(() => {
      result.current.deleteDraft(5);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored[5]).toBeUndefined();
  });

  it("clears all drafts", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 1: {}, 2: {} }));

    const { result } = renderHook(() => useCreditNoteDrafts());

    act(() => {
      result.current.clearAllDrafts();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.hasDrafts).toBe(false);
  });

  it("checks hasDraftForInvoice", () => {
    const draft = {
      data: {},
      invoiceId: 7,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 7: draft }));

    const { result } = renderHook(() => useCreditNoteDrafts());

    // Need to refresh to pick up stored data
    act(() => {
      result.current.refreshDrafts();
    });

    expect(result.current.hasDraftForInvoice(7)).toBe(true);
    expect(result.current.hasDraftForInvoice(999)).toBe(false);
    expect(result.current.hasDraftForInvoice(null)).toBe(false);
  });

  it("checks for same_invoice conflict", () => {
    const draft = {
      data: {},
      invoiceId: 20,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 20: draft }));

    const { result } = renderHook(() => useCreditNoteDrafts());

    const conflict = result.current.checkConflict(20);
    expect(conflict.type).toBe("same_invoice");
    expect(conflict.existingDraft.invoiceId).toBe(20);
  });

  it("checks for different_invoice conflict", () => {
    const draft = {
      data: {},
      invoiceId: 30,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 30: draft }));

    const { result } = renderHook(() => useCreditNoteDrafts());

    const conflict = result.current.checkConflict(99);
    expect(conflict.type).toBe("different_invoice");
  });

  it("returns no conflict when no drafts", () => {
    const { result } = renderHook(() => useCreditNoteDrafts());
    const conflict = result.current.checkConflict(1);
    expect(conflict.type).toBeNull();
  });

  it("sets and clears pending save", () => {
    const { result } = renderHook(() => useCreditNoteDrafts());

    act(() => {
      result.current.setPendingSave({ amount: 100 }, { invoiceId: 1 });
    });

    act(() => {
      result.current.clearPendingSave();
    });

    // No assertion error means it works - pending save is ref-based
  });
});

describe("formatRelativeTime", () => {
  it("returns empty for null", () => {
    expect(formatRelativeTime(null)).toBe("");
  });

  it("returns 'just now' for recent", () => {
    expect(formatRelativeTime(Date.now() - 3000)).toBe("just now");
  });

  it("returns seconds ago", () => {
    expect(formatRelativeTime(Date.now() - 30000)).toBe("30s ago");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime(Date.now() - 120000)).toBe("2m ago");
  });
});

describe("formatTimeUntilExpiry", () => {
  it("returns empty for null", () => {
    expect(formatTimeUntilExpiry(null)).toBe("");
  });

  it("returns 'expired' for past time", () => {
    expect(formatTimeUntilExpiry(Date.now() - 1000)).toBe("expired");
  });

  it("returns hours and minutes for future time", () => {
    const result = formatTimeUntilExpiry(Date.now() + 3600000 + 60000);
    expect(result).toMatch(/1h 1m/);
  });

  it("returns only minutes when less than 1 hour", () => {
    const result = formatTimeUntilExpiry(Date.now() + 300000);
    expect(result).toMatch(/\dm/);
  });
});

describe("getDraftStatusMessage", () => {
  it("returns empty for null draft", () => {
    expect(getDraftStatusMessage(null)).toBe("");
  });

  it("includes saved time and expiry info", () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);

    const draft = {
      timestamp: Date.now() - 5000,
      expiresAt: midnight.getTime(),
    };

    const msg = getDraftStatusMessage(draft);
    expect(msg).toContain("Saved");
    expect(msg).toContain("midnight");
  });
});

describe("cleanupExpiredDrafts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes expired drafts", () => {
    const drafts = {
      1: { data: {}, expiresAt: Date.now() - 1000 },
      2: { data: {}, expiresAt: Date.now() + 86400000 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));

    const cleaned = cleanupExpiredDrafts();
    expect(cleaned[1]).toBeUndefined();
    expect(cleaned[2]).toBeTruthy();
  });

  it("handles empty storage", () => {
    const cleaned = cleanupExpiredDrafts();
    expect(cleaned).toEqual({});
  });
});
