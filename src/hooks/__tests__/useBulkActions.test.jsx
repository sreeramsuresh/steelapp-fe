import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useBulkActions from "../useBulkActions";

describe("useBulkActions", () => {
  const items = [
    { id: "1", name: "Item 1" },
    { id: "2", name: "Item 2" },
    { id: "3", name: "Item 3" },
  ];
  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state with no selection", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isSomeSelected).toBe(false);
    expect(result.current.hasSelection).toBe(false);
  });

  it("toggles single item selection", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[0]);
    });

    expect(result.current.isSelected(items[0])).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.hasSelection).toBe(true);

    act(() => {
      result.current.toggleSelect(items[0]);
    });

    expect(result.current.isSelected(items[0])).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("selects and deselects by ID directly", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.select("2");
    });
    expect(result.current.isSelected("2")).toBe(true);

    act(() => {
      result.current.deselect("2");
    });
    expect(result.current.isSelected("2")).toBe(false);
  });

  it("selects all items", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.selectedCount).toBe(3);
  });

  it("clears selection", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.selectAll();
    });
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it("toggles select all", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelectAll();
    });
    expect(result.current.isAllSelected).toBe(true);

    act(() => {
      result.current.toggleSelectAll();
    });
    expect(result.current.isAllSelected).toBe(false);
  });

  it("isSomeSelected is true when partial selection", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[0]);
    });

    expect(result.current.isSomeSelected).toBe(true);
    expect(result.current.isAllSelected).toBe(false);
  });

  it("deletes selected items via onUpdate", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[1]);
    });
    act(() => {
      result.current.deleteSelected();
    });

    expect(onUpdate).toHaveBeenCalledWith([items[0], items[2]]);
    expect(result.current.selectedCount).toBe(0);
  });

  it("deletes selected items via custom onDelete", () => {
    const onDelete = vi.fn();
    const { result } = renderHook(() => useBulkActions({ items, onUpdate, onDelete }));

    act(() => {
      result.current.toggleSelect(items[0]);
      result.current.toggleSelect(items[2]);
    });
    act(() => {
      result.current.deleteSelected();
    });

    expect(onDelete).toHaveBeenCalledWith(["1", "3"]);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("does nothing on delete with no selection", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.deleteSelected();
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("duplicates selected items", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[0]);
    });
    act(() => {
      result.current.duplicateSelected();
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const newItems = onUpdate.mock.calls[0][0];
    expect(newItems.length).toBe(4);
    expect(newItems[3].name).toBe("Item 1");
    expect(newItems[3].id).not.toBe("1");
  });

  it("duplicates using custom createItem", () => {
    const createItem = vi.fn((item) => ({ ...item, id: `copy-${item.id}`, name: `Copy of ${item.name}` }));
    const { result } = renderHook(() => useBulkActions({ items, onUpdate, createItem }));

    act(() => {
      result.current.toggleSelect(items[0]);
    });
    act(() => {
      result.current.duplicateSelected();
    });

    const newItems = onUpdate.mock.calls[0][0];
    expect(newItems[3].id).toBe("copy-1");
    expect(newItems[3].name).toBe("Copy of Item 1");
  });

  it("getSelectedItems returns selected items", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[0]);
      result.current.toggleSelect(items[2]);
    });

    const selected = result.current.getSelectedItems();
    expect(selected).toHaveLength(2);
    expect(selected[0].id).toBe("1");
    expect(selected[1].id).toBe("3");
  });

  it("updateSelected applies updates to selected items", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[0]);
      result.current.toggleSelect(items[1]);
    });
    act(() => {
      result.current.updateSelected({ name: "Updated" });
    });

    const newItems = onUpdate.mock.calls[0][0];
    expect(newItems[0].name).toBe("Updated");
    expect(newItems[1].name).toBe("Updated");
    expect(newItems[2].name).toBe("Item 3");
  });

  it("updateSelected accepts a function", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    act(() => {
      result.current.toggleSelect(items[0]);
    });
    act(() => {
      result.current.updateSelected((item) => ({ ...item, name: `${item.name} (edited)` }));
    });

    const newItems = onUpdate.mock.calls[0][0];
    expect(newItems[0].name).toBe("Item 1 (edited)");
  });

  it("getCheckboxProps returns correct checked state", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    const props = result.current.getCheckboxProps(items[0]);
    expect(props.checked).toBe(false);
    expect(typeof props.onChange).toBe("function");

    act(() => {
      result.current.toggleSelect(items[0]);
    });

    const propsAfter = result.current.getCheckboxProps(items[0]);
    expect(propsAfter.checked).toBe(true);
  });

  it("getSelectAllProps returns correct state", () => {
    const { result } = renderHook(() => useBulkActions({ items, onUpdate }));

    let props = result.current.getSelectAllProps();
    expect(props.checked).toBe(false);
    expect(props.indeterminate).toBe(false);

    act(() => {
      result.current.toggleSelect(items[0]);
    });

    props = result.current.getSelectAllProps();
    expect(props.checked).toBe(false);
    expect(props.indeterminate).toBe(true);
  });

  it("works with custom getId", () => {
    const customItems = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ];
    const { result } = renderHook(() => useBulkActions({ items: customItems, onUpdate, getId: (item) => item.key }));

    act(() => {
      result.current.toggleSelect(customItems[0]);
    });

    expect(result.current.isSelected(customItems[0])).toBe(true);
    expect(result.current.selectedCount).toBe(1);
  });

  it("handles empty items", () => {
    const { result } = renderHook(() => useBulkActions({ items: [], onUpdate }));

    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isSomeSelected).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });
});
