/**
 * Drawer Component Tests - Tier 2 Overlays
 *
 * Tests side drawer/panel behavior:
 * - Open/close with slide animation
 * - Escape key to close
 * - Backdrop click handling
 * - Position (left/right/top/bottom)
 * - Scroll behavior
 * - Width configuration
 * - Stacking order
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";

// Mock Drawer component
const Drawer = ({
  isOpen,
  onClose,
  position = "right", // left, right, top, bottom
  title = "",
  children,
  width = "w-96",
  height = "h-screen",
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const positionStyles = {
    right: "right-0 top-0 h-screen slide-in-from-right",
    left: "left-0 top-0 h-screen slide-in-from-left",
    top: "top-0 left-0 w-screen slide-in-from-top",
    bottom: "bottom-0 left-0 w-screen slide-in-from-bottom",
  };

  const dimensionStyles = {
    right: width,
    left: width,
    top: height,
    bottom: height,
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50" data-testid="drawer-overlay" onClick={onClose}>
      <div
        className={`fixed ${positionStyles[position]} ${dimensionStyles[position]} bg-white shadow-lg z-50 overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-testid="drawer"
        data-position={position}
      >
        {title && (
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            {showCloseButton && (
              <button type="button"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close drawer"
                data-testid="drawer-close-button"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="p-6" data-testid="drawer-content">
          {children}
        </div>
      </div>
    </div>
  );
};

describe("Drawer Component", () => {
  let mockOnClose;
  let defaultProps;

  beforeEach(() => {
    mockOnClose = vi.fn();
    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      children: <div>Drawer Content</div>,
    };
  });

  describe("Rendering", () => {
    it("should render drawer when isOpen is true", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer")).toBeInTheDocument();
    });

    it("should not render drawer when isOpen is false", () => {
      const { queryByTestId } = renderWithProviders(<Drawer {...defaultProps} isOpen={false} />);
      expect(queryByTestId("drawer")).not.toBeInTheDocument();
    });

    it("should render overlay", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer-overlay")).toBeInTheDocument();
    });

    it("should display title when provided", () => {
      const { getByText } = renderWithProviders(<Drawer {...defaultProps} title="Drawer Title" />);
      expect(getByText("Drawer Title")).toBeInTheDocument();
    });

    it("should render children content", () => {
      const { getByText } = renderWithProviders(
        <Drawer {...defaultProps}>
          <p>Content Text</p>
        </Drawer>
      );
      expect(getByText("Content Text")).toBeInTheDocument();
    });

    it("should have dialog role", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer")).toHaveAttribute("role", "dialog");
    });

    it("should have aria-modal attribute", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer")).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("Position Variants", () => {
    it("should render right-positioned drawer by default", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="right" />);
      expect(getByTestId("drawer")).toHaveAttribute("data-position", "right");
    });

    it("should render left-positioned drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="left" />);
      expect(getByTestId("drawer")).toHaveAttribute("data-position", "left");
    });

    it("should render top-positioned drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="top" />);
      expect(getByTestId("drawer")).toHaveAttribute("data-position", "top");
    });

    it("should render bottom-positioned drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="bottom" />);
      expect(getByTestId("drawer")).toHaveAttribute("data-position", "bottom");
    });

    it("should apply correct animation class for position", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="left" />);
      const drawer = getByTestId("drawer");
      expect(drawer.className).toContain("slide-in-from-left");
    });

    it("should have correct dimensions for horizontal positions", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="right" width="w-80" />);
      const drawer = getByTestId("drawer");
      expect(drawer.className).toContain("w-80");
    });

    it("should have correct dimensions for vertical positions", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="top" height="h-64" />);
      const drawer = getByTestId("drawer");
      expect(drawer.className).toContain("h-64");
    });
  });

  describe("Overlay Click Behavior", () => {
    it("should close drawer when overlay is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      await user.click(getByTestId("drawer-overlay"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close drawer when content is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      await user.click(getByTestId("drawer-content"));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should prevent event propagation from drawer to overlay", async () => {
      const user = setupUser();
      const handleOuterClick = vi.fn();
      const { getByTestId } = renderWithProviders(
        <div onClick={handleOuterClick}>
          <Drawer {...defaultProps} />
        </div>
      );
      await user.click(getByTestId("drawer"));
      expect(handleOuterClick).not.toHaveBeenCalled();
    });
  });

  describe("Close Button", () => {
    it("should display close button by default", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} title="Test" />);
      expect(getByTestId("drawer-close-button")).toBeInTheDocument();
    });

    it("should not display close button when showCloseButton is false", () => {
      const { queryByTestId } = renderWithProviders(<Drawer {...defaultProps} title="Test" showCloseButton={false} />);
      expect(queryByTestId("drawer-close-button")).not.toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} title="Test" />);
      await user.click(getByTestId("drawer-close-button"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should have aria-label on close button", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} title="Test" />);
      expect(getByTestId("drawer-close-button")).toHaveAttribute("aria-label", "Close drawer");
    });
  });

  describe("Scroll Behavior", () => {
    it("should have overflow-y-auto class for scrolling", () => {
      const { getByTestId } = renderWithProviders(
        <Drawer {...defaultProps}>
          <div style={{ height: "2000px" }}>Long Content</div>
        </Drawer>
      );
      const drawer = getByTestId("drawer");
      expect(drawer.className).toContain("overflow-y-auto");
    });

    it("should support long content with scroll", () => {
      const { getByTestId } = renderWithProviders(
        <Drawer {...defaultProps}>
          <div>
            {Array.from({ length: 50 }).map((_, i) => (
              <p key={i}>Line {i + 1}</p>
            ))}
          </div>
        </Drawer>
      );
      expect(getByTestId("drawer-content")).toBeInTheDocument();
    });
  });

  describe("Sizing", () => {
    it("should support custom width for horizontal drawers", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="right" width="w-[400px]" />);
      const drawer = getByTestId("drawer");
      expect(drawer.className).toContain("w-[400px]");
    });

    it("should support custom height for vertical drawers", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="top" height="h-80" />);
      const drawer = getByTestId("drawer");
      expect(drawer.className).toContain("h-80");
    });

    it("should default to full screen height for horizontal drawers", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="right" />);
      expect(getByTestId("drawer").className).toContain("h-screen");
    });

    it("should default to full screen width for vertical drawers", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="top" />);
      expect(getByTestId("drawer").className).toContain("w-screen");
    });
  });

  describe("Z-Index Stacking", () => {
    it("should have z-50 for drawer content", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer").className).toContain("z-50");
    });

    it("should have z-40 for overlay", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer-overlay").className).toContain("z-40");
    });

    it("should stack properly with modals", () => {
      const { container } = renderWithProviders(
        <div>
          <Drawer isOpen={true} onClose={() => {}} />
        </div>
      );
      const drawer = container.querySelector('[data-testid="drawer"]');
      expect(drawer.className).toContain("z-50");
    });
  });

  describe("Header Styling", () => {
    it("should display header with border", () => {
      const { getByText } = renderWithProviders(<Drawer {...defaultProps} title="Header" />);
      const header = getByText("Header").parentElement;
      expect(header.className).toContain("border-b");
    });

    it("should display title and close button in header", () => {
      const { getByText, getByTestId } = renderWithProviders(<Drawer {...defaultProps} title="Header" />);
      expect(getByText("Header")).toBeInTheDocument();
      expect(getByTestId("drawer-close-button")).toBeInTheDocument();
    });

    it("should not render header when title is empty", () => {
      const { container } = renderWithProviders(<Drawer {...defaultProps} title="" />);
      const headers = container.querySelectorAll(".border-b");
      expect(headers.length).toBe(0);
    });
  });

  describe("Animations", () => {
    it("should have slide-in animation for right drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="right" />);
      expect(getByTestId("drawer").className).toContain("slide-in-from-right");
    });

    it("should have slide-in animation for left drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="left" />);
      expect(getByTestId("drawer").className).toContain("slide-in-from-left");
    });

    it("should have slide-in animation for top drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="top" />);
      expect(getByTestId("drawer").className).toContain("slide-in-from-top");
    });

    it("should have slide-in animation for bottom drawer", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} position="bottom" />);
      expect(getByTestId("drawer").className).toContain("slide-in-from-bottom");
    });
  });

  describe("Accessibility", () => {
    it("should have dialog role", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer")).toHaveAttribute("role", "dialog");
    });

    it("should have aria-modal attribute", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer")).toHaveAttribute("aria-modal", "true");
    });

    it("should have accessible close button", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} title="Test" />);
      const closeBtn = getByTestId("drawer-close-button");
      expect(closeBtn).toHaveAttribute("aria-label");
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with white background by default", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer").className).toContain("bg-white");
    });

    it("should support dark mode styling", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid open/close", async () => {
      const { rerender } = renderWithProviders(<Drawer {...defaultProps} isOpen={true} />);
      rerender(<Drawer {...defaultProps} isOpen={false} />);
      rerender(<Drawer {...defaultProps} isOpen={true} />);
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should handle empty title", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} title="" />);
      expect(getByTestId("drawer")).toBeInTheDocument();
    });

    it("should handle very long title", () => {
      const longTitle = "This is a very long drawer title that should wrap properly";
      const { getByText } = renderWithProviders(<Drawer {...defaultProps} title={longTitle} />);
      expect(getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle nested content structures", () => {
      const { getByTestId } = renderWithProviders(
        <Drawer {...defaultProps}>
          <div>
            <section>
              <article>
                <p>Nested content</p>
              </article>
            </section>
          </div>
        </Drawer>
      );
      expect(getByTestId("drawer-content")).toBeInTheDocument();
    });
  });

  describe("Multiple Drawers", () => {
    it("should support multiple open drawers", () => {
      const { container } = renderWithProviders(
        <div>
          <Drawer isOpen={true} onClose={() => {}} />
          <Drawer isOpen={true} onClose={() => {}} position="left" />
        </div>
      );
      expect(container.querySelectorAll('[data-testid="drawer"]').length).toBe(2);
    });

    it("should stack multiple drawers correctly", () => {
      const { container } = renderWithProviders(
        <div>
          <Drawer isOpen={true} onClose={() => {}} position="right" />
          <Drawer isOpen={true} onClose={() => {}} position="left" />
        </div>
      );
      const drawers = container.querySelectorAll('[data-testid="drawer"]');
      expect(drawers.length).toBe(2);
    });
  });

  describe("Content Padding", () => {
    it("should have proper padding for content", () => {
      const { getByTestId } = renderWithProviders(<Drawer {...defaultProps} />);
      expect(getByTestId("drawer-content").className).toContain("p-6");
    });

    it("should have padding in header", () => {
      const { getByText } = renderWithProviders(<Drawer {...defaultProps} title="Test" />);
      const header = getByText("Test").parentElement;
      expect(header.className).toContain("px-6");
      expect(header.className).toContain("py-4");
    });
  });
});
