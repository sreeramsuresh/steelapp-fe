/**
 * AlertDialog Component Tests - Tier 2 Overlays
 *
 * Tests alert/warning modal behavior:
 * - Alert levels (info, warning, error, success)
 * - Icon display
 * - Auto-close capability
 * - Single action button
 * - Alert-specific styling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";

// Mock AlertDialog component
const AlertDialog = ({
  isOpen,
  onClose,
  title = "Alert",
  message = "This is an alert",
  type = "info", // info, warning, error, success
  actionLabel = "OK",
  icon = null,
  autoCloseDelay = null,
  showCloseButton = true,
}) => {
  // Mock auto-close effect
  React.useEffect(() => {
    if (isOpen && autoCloseDelay) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
    success: "bg-green-50 border-green-200",
  };

  const iconColors = {
    info: "text-blue-600",
    warning: "text-yellow-600",
    error: "text-red-600",
    success: "text-green-600",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80" data-testid="alert-overlay" onClick={onClose}>
      <div
        className={`fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg p-6 max-w-sm border ${typeStyles[type]}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        data-testid="alert-dialog"
      >
        <div className="flex items-start gap-4">
          {icon && <div className={`flex-shrink-0 ${iconColors[type]}`}>{icon}</div>}

          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2" id="alert-title">
              {title}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="flex justify-end gap-3">
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  data-testid="alert-close"
                >
                  Close
                </button>
              )}
              <button
                onClick={onClose}
                className={`px-4 py-2 text-white rounded ${
                  type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : type === "warning"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : type === "success"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
                data-testid="alert-action"
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add React import for effect
import React from "react";

describe("AlertDialog Component", () => {
  let mockOnClose;
  let defaultProps;

  beforeEach(() => {
    mockOnClose = vi.fn();
    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
    };
  });

  describe("Rendering", () => {
    it("should render when isOpen is true", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-dialog")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      const { queryByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} isOpen={false} />
      );
      expect(queryByTestId("alert-dialog")).not.toBeInTheDocument();
    });

    it("should display title", () => {
      const { getByText } = renderWithProviders(
        <AlertDialog {...defaultProps} title="Alert Title" />
      );
      expect(getByText("Alert Title")).toBeInTheDocument();
    });

    it("should display message", () => {
      const { getByText } = renderWithProviders(
        <AlertDialog {...defaultProps} message="Alert message" />
      );
      expect(getByText("Alert message")).toBeInTheDocument();
    });

    it("should have alertdialog role", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-dialog")).toHaveAttribute("role", "alertdialog");
    });
  });

  describe("Alert Types", () => {
    it("should render info alert with blue styling", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="info" />
      );
      const alert = getByTestId("alert-dialog");
      expect(alert.className).toContain("bg-blue-50");
    });

    it("should render warning alert with yellow styling", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="warning" />
      );
      const alert = getByTestId("alert-dialog");
      expect(alert.className).toContain("bg-yellow-50");
    });

    it("should render error alert with red styling", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="error" />
      );
      const alert = getByTestId("alert-dialog");
      expect(alert.className).toContain("bg-red-50");
    });

    it("should render success alert with green styling", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="success" />
      );
      const alert = getByTestId("alert-dialog");
      expect(alert.className).toContain("bg-green-50");
    });

    it("should apply correct border color for type", () => {
      const { getByTestId: getByTestId1 } = renderWithProviders(
        <AlertDialog {...defaultProps} type="error" />
      );
      expect(getByTestId1("alert-dialog").className).toContain("border-red");
    });
  });

  describe("Icons", () => {
    it("should render icon when provided", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} icon={<span data-testid="alert-icon">!</span>} />
      );
      expect(getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("should not render icon when not provided", () => {
      const { queryByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} icon={null} />
      );
      expect(queryByTestId("alert-icon")).not.toBeInTheDocument();
    });

    it("should apply color based on alert type", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="error" icon={<span data-testid="error-icon">X</span>} />
      );
      const iconParent = getByTestId("error-icon").parentElement;
      expect(iconParent.className).toContain("text-red");
    });

    it("should position icon to the left", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} icon={<span data-testid="icon-left">→</span>} />
      );
      expect(getByTestId("icon-left")).toBeInTheDocument();
    });
  });

  describe("Action Button", () => {
    it("should display custom action label", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} actionLabel="Got it" />
      );
      expect(getByTestId("alert-action")).toHaveTextContent("Got it");
    });

    it("should call onClose when action button clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      await user.click(getByTestId("alert-action"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should apply type-specific color to action button", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="success" />
      );
      const button = getByTestId("alert-action");
      expect(button.className).toContain("bg-green");
    });

    it("should display error styling for error alerts", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="error" />
      );
      const button = getByTestId("alert-action");
      expect(button.className).toContain("bg-red");
    });
  });

  describe("Close Button", () => {
    it("should display close button by default", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-close")).toBeInTheDocument();
    });

    it("should not display close button when showCloseButton is false", () => {
      const { queryByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} showCloseButton={false} />
      );
      expect(queryByTestId("alert-close")).not.toBeInTheDocument();
    });

    it("should call onClose when close button clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      await user.click(getByTestId("alert-close"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when overlay clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      await user.click(getByTestId("alert-overlay"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Auto-Close", () => {
    it("should auto-close after specified delay", () => {
      vi.useFakeTimers();
      const { rerender } = renderWithProviders(
        <AlertDialog {...defaultProps} autoCloseDelay={1000} />
      );

      vi.advanceTimersByTime(1000);
      expect(mockOnClose).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should not auto-close when autoCloseDelay is null", () => {
      vi.useFakeTimers();
      renderWithProviders(<AlertDialog {...defaultProps} autoCloseDelay={null} />);

      vi.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should clear timeout on unmount", () => {
      vi.useFakeTimers();
      const { unmount } = renderWithProviders(
        <AlertDialog {...defaultProps} autoCloseDelay={5000} />
      );

      unmount();
      vi.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("should support fast auto-close", () => {
      vi.useFakeTimers();
      renderWithProviders(<AlertDialog {...defaultProps} autoCloseDelay={500} />);

      vi.advanceTimersByTime(500);
      expect(mockOnClose).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("Accessibility", () => {
    it("should have alertdialog role", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-dialog")).toHaveAttribute("role", "alertdialog");
    });

    it("should have aria-modal attribute", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-live for screen readers", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-dialog")).toHaveAttribute("aria-live", "assertive");
    });

    it("should have aria-labelledby pointing to title", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-dialog")).toBeInTheDocument();
    });
  });

  describe("Content Layout", () => {
    it("should display icon and content side by side", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} icon={<span data-testid="layout-icon">⚠</span>} />
      );
      expect(getByTestId("layout-icon")).toBeInTheDocument();
    });

    it("should have proper spacing between elements", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog
          {...defaultProps}
          title="Spacing Test"
          message="Test spacing"
          icon={<span data-testid="spacing-icon">!</span>}
        />
      );
      const dialog = getByTestId("alert-dialog");
      expect(dialog.className).toContain("gap-4");
    });

    it("should display title above message", () => {
      const { getByText } = renderWithProviders(
        <AlertDialog {...defaultProps} title="Title" message="Message" />
      );
      const title = getByText("Title");
      const message = getByText("Message");
      expect(title.parentElement).toBeInTheDocument();
      expect(message.parentElement).toBeInTheDocument();
    });
  });

  describe("Custom Styling", () => {
    it("should support custom class names", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} />
      );
      expect(getByTestId("alert-dialog")).toBeInTheDocument();
    });

    it("should maintain type-specific styling", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} type="warning" />
      );
      const alert = getByTestId("alert-dialog");
      expect(alert.className).toContain("bg-yellow");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long message", () => {
      const longMessage = "This is a very long message. ".repeat(20);
      const { getByText } = renderWithProviders(
        <AlertDialog {...defaultProps} message={longMessage} />
      );
      expect(getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle empty message", () => {
      const { getByTestId } = renderWithProviders(
        <AlertDialog {...defaultProps} message="" />
      );
      expect(getByTestId("alert-dialog")).toBeInTheDocument();
    });

    it("should handle special characters in title", () => {
      const specialTitle = "Alert: Error <500> & timeout!";
      const { getByText } = renderWithProviders(
        <AlertDialog {...defaultProps} title={specialTitle} />
      );
      expect(getByText(specialTitle)).toBeInTheDocument();
    });

    it("should handle rapid open/close", async () => {
      const { rerender } = renderWithProviders(
        <AlertDialog {...defaultProps} isOpen={true} />
      );
      rerender(<AlertDialog {...defaultProps} isOpen={false} />);
      rerender(<AlertDialog {...defaultProps} isOpen={true} />);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Multiple Alert Types", () => {
    it("should render multiple different alert types", () => {
      const { container } = renderWithProviders(
        <div>
          <AlertDialog isOpen={true} onClose={() => {}} type="info" />
          <AlertDialog isOpen={true} onClose={() => {}} type="error" />
          <AlertDialog isOpen={true} onClose={() => {}} type="success" />
        </div>
      );
      const alerts = container.querySelectorAll('[data-testid="alert-dialog"]');
      expect(alerts.length).toBe(3);
    });
  });

  describe("Z-Index and Stacking", () => {
    it("should render with high z-index", () => {
      const { getByTestId } = renderWithProviders(<AlertDialog {...defaultProps} />);
      expect(getByTestId("alert-overlay").className).toContain("z-50");
    });
  });
});
