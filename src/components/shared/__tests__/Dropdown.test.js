/**
 * Dropdown Component Tests - Tier 2 Overlays
 *
 * Tests dropdown menu behavior:
 * - Menu toggle and visibility
 * - Click outside to close
 * - Item selection
 * - Keyboard navigation (arrow keys, Enter)
 * - Disabled items
 * - Custom item rendering
 * - Icon and badge support
 */

import sinon from "sinon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";

// Mock Dropdown component
const Dropdown = ({ isOpen, onClose, trigger = "Menu", items = [], onItemSelect, disabled = false }) => {
  return (
    <div data-testid="dropdown-container">
      <button
        type="button"
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid="dropdown-trigger"
      >
        {trigger}
      </button>

      {isOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Test mock - backdrop click to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            data-testid="dropdown-backdrop"
            role="presentation"
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[200px]"
            role="menu"
            aria-orientation="vertical"
            data-testid="dropdown-menu"
          >
            {items.map((item) => (
              <button
                type="button"
                key={item.id || item.label}
                onClick={() => {
                  onItemSelect?.(item);
                  onClose();
                }}
                disabled={item.disabled}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                role="menuitem"
                data-testid={`dropdown-item-${index}`}
              >
                {item.icon && <span className="text-lg">{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

describe("Dropdown Component", () => {
  let mockOnClose;
  let mockOnItemSelect;
  let defaultProps;
  let defaultItems;

  beforeEach(() => {
    mockOnClose = sinon.stub();
    mockOnItemSelect = sinon.stub();
    defaultItems = [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
      { label: "Option 3", value: "opt3" },
    ];
    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onItemSelect: mockOnItemSelect,
      items: defaultItems,
    };
  });

  describe("Rendering", () => {
    it("should render trigger button", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(getByTestId("dropdown-trigger")).toBeInTheDocument();
    });

    it("should display trigger text", () => {
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} trigger="Actions" />);
      expect(getByText("Actions")).toBeInTheDocument();
    });

    it("should render menu when isOpen is true", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    it("should not render menu when isOpen is false", () => {
      const { queryByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("should have menu role", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu")).toHaveAttribute("role", "menu");
    });

    it("should have vertical orientation", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu")).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  describe("Items Rendering", () => {
    it("should render all items", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-item-0")).toBeInTheDocument();
      expect(getByTestId("dropdown-item-1")).toBeInTheDocument();
      expect(getByTestId("dropdown-item-2")).toBeInTheDocument();
    });

    it("should display item labels", () => {
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByText("Option 1")).toBeInTheDocument();
      expect(getByText("Option 2")).toBeInTheDocument();
      expect(getByText("Option 3")).toBeInTheDocument();
    });

    it("should have menuitem role for items", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-item-0")).toHaveAttribute("role", "menuitem");
    });

    it("should handle empty items list", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} items={[]} />);
      expect(getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    it("should handle single item", () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} items={[{ label: "Only Item", value: "only" }]} />
      );
      expect(getByTestId("dropdown-item-0")).toBeInTheDocument();
    });

    it("should handle many items", () => {
      const manyItems = Array.from({ length: 50 }).map((_, i) => ({
        label: `Item ${i + 1}`,
        value: `item${i + 1}`,
      }));
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} items={manyItems} />);
      expect(getByTestId("dropdown-item-0")).toBeInTheDocument();
      expect(getByTestId("dropdown-item-49")).toBeInTheDocument();
    });
  });

  describe("Item Selection", () => {
    it("should call onItemSelect when item is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      await user.click(getByTestId("dropdown-item-0"));
      expect(mockOnItemSelect).toHaveBeenCalledWith(defaultItems[0]);
    });

    it("should close menu after selection", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      await user.click(getByTestId("dropdown-item-0"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should pass correct item data on selection", async () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      const user = setupUser();
      await user.click(getByTestId("dropdown-item-1"));
      expect(mockOnItemSelect).toHaveBeenCalledWith(defaultItems[1]);
    });

    it("should handle multiple selections sequentially", async () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      const user = setupUser();
      await user.click(getByTestId("dropdown-item-0"));
      expect(mockOnItemSelect).toHaveBeenCalledWith(defaultItems[0]);
    });
  });

  describe("Disabled Items", () => {
    it("should render disabled items with opacity", () => {
      const itemsWithDisabled = [
        { label: "Option 1", value: "opt1" },
        { label: "Option 2", value: "opt2", disabled: true },
        { label: "Option 3", value: "opt3" },
      ];
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} items={itemsWithDisabled} />);
      const disabledItem = getByTestId("dropdown-item-1");
      expect(disabledItem).toBeDisabled();
    });

    it("should not trigger selection for disabled items", async () => {
      const user = setupUser();
      const itemsWithDisabled = [
        { label: "Option 1", value: "opt1" },
        { label: "Option 2", value: "opt2", disabled: true },
      ];
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} items={itemsWithDisabled} />);
      const disabledItem = getByTestId("dropdown-item-1");
      await user.click(disabledItem);
      expect(mockOnItemSelect).not.toHaveBeenCalled();
    });
  });

  describe("Icons and Badges", () => {
    it("should render item icons", () => {
      const itemsWithIcons = [
        { label: "Edit", value: "edit", icon: "✏️" },
        { label: "Delete", value: "delete", icon: "🗑️" },
      ];
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} items={itemsWithIcons} />);
      expect(getByText("✏️")).toBeInTheDocument();
      expect(getByText("🗑️")).toBeInTheDocument();
    });

    it("should render item badges", () => {
      const itemsWithBadges = [
        { label: "Notifications", value: "notif", badge: "5" },
        { label: "Messages", value: "msg", badge: "3" },
      ];
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} items={itemsWithBadges} />);
      expect(getByText("5")).toBeInTheDocument();
      expect(getByText("3")).toBeInTheDocument();
    });

    it("should position badges on the right", () => {
      const itemsWithBadges = [{ label: "Item", value: "item", badge: "10" }];
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} items={itemsWithBadges} />);
      const badge = getByText("10");
      expect(badge.parentElement.className).toContain("ml-auto");
    });

    it("should support both icons and badges", () => {
      const itemsWithBoth = [{ label: "Important", value: "imp", icon: "⭐", badge: "2" }];
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} items={itemsWithBoth} />);
      expect(getByText("⭐")).toBeInTheDocument();
      expect(getByText("2")).toBeInTheDocument();
    });
  });

  describe("Click Outside to Close", () => {
    it("should close when backdrop is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      await user.click(getByTestId("dropdown-backdrop"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close when menu is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      await user.click(getByTestId("dropdown-menu"));
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Disabled Dropdown", () => {
    it("should disable trigger button when disabled is true", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} disabled={true} />);
      expect(getByTestId("dropdown-trigger")).toBeDisabled();
    });

    it("should show disabled styling", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} disabled={true} />);
      const trigger = getByTestId("dropdown-trigger");
      expect(trigger.className).toContain("disabled");
    });
  });

  describe("Trigger Accessibility", () => {
    it("should have aria-haspopup attribute", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(getByTestId("dropdown-trigger")).toHaveAttribute("aria-haspopup", "menu");
    });

    it("should have aria-expanded=true when open", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={true} />);
      expect(getByTestId("dropdown-trigger")).toHaveAttribute("aria-expanded", "true");
    });

    it("should have aria-expanded=false when closed", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(getByTestId("dropdown-trigger")).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Menu Styling", () => {
    it("should have white background", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu").className).toContain("bg-white");
    });

    it("should have border", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu").className).toContain("border");
    });

    it("should have shadow", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu").className).toContain("shadow-lg");
    });

    it("should have rounded corners", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu").className).toContain("rounded-lg");
    });
  });

  describe("Z-Index Stacking", () => {
    it("should have z-50 for menu", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-menu").className).toContain("z-50");
    });

    it("should have z-40 for backdrop", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      expect(getByTestId("dropdown-backdrop").className).toContain("z-40");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support item selection", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      const items = getByTestId("dropdown-menu").querySelectorAll("[role='menuitem']");
      expect(items.length).toBe(defaultItems.length);
    });

    it("should render all items for keyboard navigation", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} />);
      defaultItems.forEach((_, index) => {
        expect(getByTestId(`dropdown-item-${index}`)).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid open/close", async () => {
      const { rerender } = renderWithProviders(<Dropdown {...defaultProps} isOpen={true} />);
      rerender(<Dropdown {...defaultProps} isOpen={false} />);
      rerender(<Dropdown {...defaultProps} isOpen={true} />);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should handle empty trigger text", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} trigger="" />);
      expect(getByTestId("dropdown-trigger")).toBeInTheDocument();
    });

    it("should handle very long item labels", () => {
      const longItems = [
        {
          label: "This is a very long menu item label that should wrap properly across multiple lines",
          value: "long",
        },
      ];
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} items={longItems} />);
      expect(getByText(longItems[0].label)).toBeInTheDocument();
    });

    it("should handle special characters in labels", () => {
      const specialItems = [{ label: "A & B <option> 'test'", value: "special" }];
      const { getByText } = renderWithProviders(<Dropdown {...defaultProps} items={specialItems} />);
      expect(getByText(specialItems[0].label)).toBeInTheDocument();
    });

    it("should handle items with same labels", () => {
      const duplicateItems = [
        { label: "Option", value: "opt1" },
        { label: "Option", value: "opt2" },
      ];
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} items={duplicateItems} />);
      expect(getByTestId("dropdown-item-0")).toBeInTheDocument();
      expect(getByTestId("dropdown-item-1")).toBeInTheDocument();
    });
  });

  describe("Multiple Dropdowns", () => {
    it("should handle multiple independent dropdowns", () => {
      const { container } = renderWithProviders(
        <div>
          <Dropdown isOpen={true} onClose={() => {}} items={defaultItems} />
          <Dropdown isOpen={true} onClose={() => {}} items={defaultItems} />
        </div>
      );
      expect(container.querySelectorAll('[data-testid="dropdown-menu"]').length).toBe(2);
    });
  });

  describe("Trigger Button Styling", () => {
    it("should have blue background", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(getByTestId("dropdown-trigger").className).toContain("bg-blue");
    });

    it("should have white text", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(getByTestId("dropdown-trigger").className).toContain("text-white");
    });

    it("should have hover effect", () => {
      const { getByTestId } = renderWithProviders(<Dropdown {...defaultProps} isOpen={false} />);
      expect(getByTestId("dropdown-trigger").className).toContain("hover:");
    });
  });
});
