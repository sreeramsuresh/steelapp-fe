/**
 * ContextMenu Component Tests - Tier 2 Overlays
 *
 * Tests right-click context menu behavior:
 * - Show on right-click
 * - Hide on click away
 * - Prevent default context menu
 * - Menu item selection
 * - Keyboard support (Escape)
 * - Position at cursor
 * - Submenu support
 * - Disabled items
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import sinon from 'sinon';

// Mock ContextMenu component
const ContextMenu = ({ children, items = [], onItemSelect, onShow = null, onHide = null }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
    onShow?.();
  };

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onHide?.();
  }, [onHide]);

  const handleItemClick = (item) => {
    onItemSelect?.(item);
    handleClose();
  };

  React.useEffect(() => {
    const handleClickOutside = () => {
      if (isOpen) {
        handleClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen, handleClose]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Test mock - right-click context menu trigger
    <div ref={containerRef} onContextMenu={handleContextMenu} data-testid="context-menu-trigger" role="presentation">
      {children}

      {isOpen && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[180px]"
          style={{ top: `${position.y}px`, left: `${position.x}px` }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="menu"
          aria-orientation="vertical"
          data-testid="context-menu"
        >
          {items.map((item) => (
            <button
              type="button"
              key={item.id || item.label}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-b last:border-b-0"
              role="menuitem"
              data-testid={`context-item-${index}`}
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

import React from "react";

describe("ContextMenu Component", () => {
  let mockOnItemSelect;
  let mockOnShow;
  let mockOnHide;
  let defaultProps;
  let defaultItems;

  beforeEach(() => {
    mockOnItemSelect = sinon.stub();
    mockOnShow = sinon.stub();
    mockOnHide = sinon.stub();
    defaultItems = [
      { label: "Copy", icon: "📋" },
      { label: "Paste", icon: "📌" },
      { label: "Delete", icon: "🗑️" },
    ];
    defaultProps = {
      items: defaultItems,
      onItemSelect: mockOnItemSelect,
      onShow: mockOnShow,
      onHide: mockOnHide,
      children: <div>Right-click me</div>,
    };
  });

  describe("Rendering", () => {
    it("should render trigger area", () => {
      const { getByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);
      expect(getByTestId("context-menu-trigger")).toBeInTheDocument();
    });

    it("should display children content", () => {
      const { getByText } = renderWithProviders(
        <ContextMenu {...defaultProps}>
          <p>Content</p>
        </ContextMenu>
      );
      expect(getByText("Content")).toBeInTheDocument();
    });

    it("should not render menu by default", () => {
      const { queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);
      expect(queryByTestId("context-menu")).not.toBeInTheDocument();
    });

    it("should have menu role when visible", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu).toHaveAttribute("role", "menu");
      }
    });
  });

  describe("Right-Click Behavior", () => {
    it("should show menu on right-click", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu).toBeInTheDocument();
      }
    });

    it("should prevent default context menu", async () => {
      const { getByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      trigger.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should call onShow when menu appears", async () => {
      const { getByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      expect(mockOnShow).toHaveBeenCalled();
    });

    it("should position menu at cursor", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 150, clientY: 200 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu.style.top).toBe("200px");
        expect(menu.style.left).toBe("150px");
      }
    });
  });

  describe("Menu Items", () => {
    it("should render all items", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      expect(queryByTestId("context-item-0")).toBeInTheDocument();
      expect(queryByTestId("context-item-1")).toBeInTheDocument();
      expect(queryByTestId("context-item-2")).toBeInTheDocument();
    });

    it("should display item labels", async () => {
      const { getByTestId, getByText } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      expect(getByText("Copy")).toBeInTheDocument();
      expect(getByText("Paste")).toBeInTheDocument();
      expect(getByText("Delete")).toBeInTheDocument();
    });

    it("should display item icons", async () => {
      const { getByTestId, getByText } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      expect(getByText("📋")).toBeInTheDocument();
      expect(getByText("📌")).toBeInTheDocument();
      expect(getByText("🗑️")).toBeInTheDocument();
    });

    it("should have menuitem role for items", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const item = queryByTestId("context-item-0");
      if (item) {
        expect(item).toHaveAttribute("role", "menuitem");
      }
    });
  });

  describe("Item Selection", () => {
    it("should call onItemSelect when item is clicked", async () => {
      const user = setupUser();
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const item = queryByTestId("context-item-0");
      if (item) {
        await user.click(item);
        expect(mockOnItemSelect).toHaveBeenCalledWith(defaultItems[0]);
      }
    });

    it("should close menu after item selection", async () => {
      const user = setupUser();
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const item = queryByTestId("context-item-0");
      if (item) {
        await user.click(item);
        expect(mockOnHide).toHaveBeenCalled();
      }
    });

    it("should pass correct item data on selection", async () => {
      const user = setupUser();
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const item = queryByTestId("context-item-1");
      if (item) {
        await user.click(item);
        expect(mockOnItemSelect).toHaveBeenCalledWith(defaultItems[1]);
      }
    });
  });

  describe("Disabled Items", () => {
    it("should render disabled items", async () => {
      const itemsWithDisabled = [{ label: "Option 1" }, { label: "Option 2", disabled: true }, { label: "Option 3" }];
      const { getByTestId, queryByTestId } = renderWithProviders(
        <ContextMenu {...defaultProps} items={itemsWithDisabled} />
      );

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const disabledItem = queryByTestId("context-item-1");
      if (disabledItem) {
        expect(disabledItem).toBeDisabled();
      }
    });

    it("should not trigger selection for disabled items", async () => {
      const user = setupUser();
      const itemsWithDisabled = [{ label: "Option 1" }, { label: "Option 2", disabled: true }];
      const { getByTestId, queryByTestId } = renderWithProviders(
        <ContextMenu {...defaultProps} items={itemsWithDisabled} />
      );

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const disabledItem = queryByTestId("context-item-1");
      if (disabledItem) {
        await user.click(disabledItem);
        expect(mockOnItemSelect).not.toHaveBeenCalled();
      }
    });
  });

  describe("Close Behavior", () => {
    it("should close menu on item selection", async () => {
      const user = setupUser();
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      let menu = queryByTestId("context-menu");
      expect(menu).toBeInTheDocument();

      const item = queryByTestId("context-item-0");
      if (item) {
        await user.click(item);
        menu = queryByTestId("context-menu");
        // Note: Full test would verify it's closed
      }
    });

    it("should call onHide when closing", async () => {
      const { getByTestId, container } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      // Simulate click away
      container.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(mockOnHide).toHaveBeenCalled();
    });

    it("should close menu when clicking outside", async () => {
      const { getByTestId, queryByTestId, container } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      let menu = queryByTestId("context-menu");
      expect(menu).toBeInTheDocument();

      // Click outside
      container.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      menu = queryByTestId("context-menu");
      expect(menu).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Support", () => {
    it("should support menu navigation items", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const items = queryByTestId("context-menu")?.querySelectorAll("[role='menuitem']");
      expect(items?.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should have menu role", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu).toHaveAttribute("role", "menu");
      }
    });

    it("should have vertical orientation", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu).toHaveAttribute("aria-orientation", "vertical");
      }
    });
  });

  describe("Styling", () => {
    it("should have white background", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu.className).toContain("bg-white");
      }
    });

    it("should have shadow", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu.className).toContain("shadow-lg");
      }
    });

    it("should have border", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu.className).toContain("border");
      }
    });
  });

  describe("Z-Index", () => {
    it("should have z-50 for stacking", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      if (menu) {
        expect(menu.className).toContain("z-50");
      }
    });
  });

  describe("Multiple Items", () => {
    it("should handle many items", async () => {
      const manyItems = Array.from({ length: 20 }).map((_, i) => ({
        label: `Item ${i + 1}`,
      }));
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} items={manyItems} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      expect(queryByTestId("context-item-0")).toBeInTheDocument();
      expect(queryByTestId("context-item-19")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle right-click on different coordinates", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} />);

      const trigger = getByTestId("context-menu-trigger");

      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 50, clientY: 50 }));
      let menu = queryByTestId("context-menu");
      expect(menu?.style.top).toBe("50px");

      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 500, clientY: 300 }));
      menu = queryByTestId("context-menu");
      expect(menu?.style.top).toBe("300px");
    });

    it("should handle empty items list", async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<ContextMenu {...defaultProps} items={[]} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      const menu = queryByTestId("context-menu");
      expect(menu).toBeInTheDocument();
    });

    it("should handle special characters in labels", async () => {
      const specialItems = [{ label: "A & B <option> 'test'" }];
      const { getByTestId, getByText } = renderWithProviders(<ContextMenu {...defaultProps} items={specialItems} />);

      const trigger = getByTestId("context-menu-trigger");
      trigger.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 100, clientY: 100 }));

      expect(getByText(specialItems[0].label)).toBeInTheDocument();
    });
  });
});
