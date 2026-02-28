import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfirm } from "../useConfirm";

describe("useConfirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state with dialog closed", () => {
    const { result } = renderHook(() => useConfirm());

    expect(result.current.dialogState.open).toBe(false);
    expect(typeof result.current.confirm).toBe("function");
    expect(typeof result.current.handleConfirm).toBe("function");
    expect(typeof result.current.handleCancel).toBe("function");
  });

  it("opens dialog with string message", async () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm("Delete this?");
    });

    expect(result.current.dialogState.open).toBe(true);
    expect(result.current.dialogState.message).toBe("Delete this?");
    expect(result.current.dialogState.title).toBe("Confirm Action");
    expect(result.current.dialogState.confirmText).toBe("OK");
    expect(result.current.dialogState.cancelText).toBe("Cancel");
    expect(result.current.dialogState.variant).toBe("warning");
  });

  it("opens dialog with options object", async () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: "Delete Customer?",
        message: "Cannot be undone.",
        confirmText: "Delete",
        variant: "danger",
      });
    });

    expect(result.current.dialogState.open).toBe(true);
    expect(result.current.dialogState.title).toBe("Delete Customer?");
    expect(result.current.dialogState.message).toBe("Cannot be undone.");
    expect(result.current.dialogState.confirmText).toBe("Delete");
    expect(result.current.dialogState.variant).toBe("danger");
  });

  it("resolves true on confirm", async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmResult;
    act(() => {
      confirmResult = result.current.confirm("Are you sure?");
    });

    act(() => {
      result.current.handleConfirm();
    });

    expect(await confirmResult).toBe(true);
    expect(result.current.dialogState.open).toBe(false);
  });

  it("resolves false on cancel", async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmResult;
    act(() => {
      confirmResult = result.current.confirm("Are you sure?");
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(await confirmResult).toBe(false);
    expect(result.current.dialogState.open).toBe(false);
  });

  it("uses description as fallback for message", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({ description: "Alt description" });
    });

    expect(result.current.dialogState.message).toBe("Alt description");
  });

  it("uses okText as fallback for confirmText", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({ okText: "Yes" });
    });

    expect(result.current.dialogState.confirmText).toBe("Yes");
  });

  it("uses type as fallback for variant", () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({ type: "danger" });
    });

    expect(result.current.dialogState.variant).toBe("danger");
  });
});
