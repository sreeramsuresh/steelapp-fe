import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useDragReorder from "../useDragReorder";

describe("useDragReorder", () => {
  const items = ["A", "B", "C", "D"];
  const onReorder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    expect(result.current.isDragging).toBe(false);
    expect(result.current.dragIndex).toBeNull();
    expect(result.current.dragOverIndex).toBeNull();
    expect(typeof result.current.getDragItemProps).toBe("function");
    expect(typeof result.current.getDragHandleProps).toBe("function");
    expect(typeof result.current.moveItemUp).toBe("function");
    expect(typeof result.current.moveItemDown).toBe("function");
  });

  it("getDragItemProps returns draggable props", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    const props = result.current.getDragItemProps(0);
    expect(props.draggable).toBe(true);
    expect(typeof props.onDragStart).toBe("function");
    expect(typeof props.onDragEnd).toBe("function");
    expect(typeof props.onDragOver).toBe("function");
    expect(typeof props.onDrop).toBe("function");
  });

  it("returns empty props when disabled", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder, enabled: false }));

    const props = result.current.getDragItemProps(0);
    expect(props).toEqual({});
  });

  it("getDragHandleProps returns handle props", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    const props = result.current.getDragHandleProps(0);
    expect(props.draggable).toBe(true);
    expect(props.style.cursor).toBe("grab");
    expect(props.title).toBe("Drag to reorder");
  });

  it("moveItemUp swaps with previous item", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    act(() => {
      result.current.moveItemUp(2);
    });

    expect(onReorder).toHaveBeenCalledWith(["A", "C", "B", "D"]);
  });

  it("moveItemUp does nothing at index 0", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    act(() => {
      result.current.moveItemUp(0);
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("moveItemDown swaps with next item", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    act(() => {
      result.current.moveItemDown(1);
    });

    expect(onReorder).toHaveBeenCalledWith(["A", "C", "B", "D"]);
  });

  it("moveItemDown does nothing at last index", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    act(() => {
      result.current.moveItemDown(3);
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("moveItemUp does nothing when disabled", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder, enabled: false }));

    act(() => {
      result.current.moveItemUp(1);
    });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("isDropTarget returns correct value", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    // Before any drag, nothing is a drop target
    expect(result.current.isDropTarget(0)).toBe(false);
  });

  it("isDragSource returns correct value", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    expect(result.current.isDragSource(0)).toBe(false);
  });

  it("exposes raw handlers", () => {
    const { result } = renderHook(() => useDragReorder({ items, onReorder }));

    expect(typeof result.current.handlers.handleDragStart).toBe("function");
    expect(typeof result.current.handlers.handleDragEnd).toBe("function");
    expect(typeof result.current.handlers.handleDragOver).toBe("function");
    expect(typeof result.current.handlers.handleDrop).toBe("function");
  });
});
