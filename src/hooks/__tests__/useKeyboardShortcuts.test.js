import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useKeyboardShortcuts, {
  getShortcutDisplayString,
  INVOICE_SHORTCUTS,
} from "../useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls callback on matching shortcut", () => {
    const handleSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": handleSave }));

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it("does not call when disabled", () => {
    const handleSave = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handleSave }, { enabled: false })
    );

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true })
    );

    expect(handleSave).not.toHaveBeenCalled();
  });

  it("handles escape shortcut", () => {
    const handleClose = vi.fn();
    renderHook(() => useKeyboardShortcuts({ escape: handleClose }));

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts in input elements by default", () => {
    const handleSave = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": handleSave }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input });
    document.dispatchEvent(event);

    expect(handleSave).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("allows escape in input elements by default", () => {
    const handleClose = vi.fn();
    renderHook(() => useKeyboardShortcuts({ escape: handleClose }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input });
    document.dispatchEvent(event);

    expect(handleClose).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it("allows all shortcuts in inputs when enableInInputs is true", () => {
    const handleSave = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handleSave }, { enableInInputs: true })
    );

    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, "target", { value: input });
    document.dispatchEvent(event);

    expect(handleSave).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it("handles modifier combinations", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+shift+p": handler }));

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "p",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not match wrong modifier combination", () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": handler }));

    // Pressing ctrl+shift+s should not match ctrl+s
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ "ctrl+s": handler })
    );

    unmount();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true })
    );

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("getShortcutDisplayString", () => {
  it("formats ctrl+s", () => {
    // Non-Mac platform
    const display = getShortcutDisplayString("ctrl+s");
    expect(display).toMatch(/Ctrl\+S|⌘S/);
  });

  it("formats escape", () => {
    const display = getShortcutDisplayString("escape");
    expect(display).toBe("Esc");
  });

  it("formats ctrl+shift+p", () => {
    const display = getShortcutDisplayString("ctrl+shift+p");
    expect(display).toMatch(/Ctrl\+Shift\+P|⌘⇧P/);
  });
});

describe("INVOICE_SHORTCUTS", () => {
  it("exports expected shortcuts", () => {
    expect(INVOICE_SHORTCUTS.SAVE).toBe("ctrl+s");
    expect(INVOICE_SHORTCUTS.PREVIEW).toBe("ctrl+p");
    expect(INVOICE_SHORTCUTS.CLOSE).toBe("escape");
    expect(INVOICE_SHORTCUTS.NEW_ITEM).toBe("ctrl+n");
    expect(INVOICE_SHORTCUTS.DUPLICATE_ITEM).toBe("ctrl+d");
    expect(INVOICE_SHORTCUTS.HELP).toBe("ctrl+/");
  });
});
