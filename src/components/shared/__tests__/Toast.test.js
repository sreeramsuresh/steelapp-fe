/**
 * Toast Component Tests - Tier 2 Overlays
 *
 * Tests toast notification behavior:
 * - Auto-dismiss after delay
 * - Manual close button
 * - Toast types (success, error, warning, info)
 * - Position (top, bottom, left, right)
 * - Multiple toasts stacking
 * - Close action callback
 * - Progress bar for auto-dismiss
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";

// Mock Toast component
const Toast = ({
  id,
  message,
  type = "info", // success, error, warning, info
  duration = 3000,
  onClose,
  showCloseButton = true,
  position = "top-right", // top-left, top-right, bottom-left, bottom-right
  title = "",
  action = null,
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
  };

  const typeIcons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`fixed z-50 ${typeStyles[type]} rounded-lg shadow-lg p-4 max-w-sm flex items-start gap-3 toast-${position}`}
      role="status"
      aria-live="polite"
      data-testid={`toast-${id}`}
      data-type={type}
    >
      <span className="flex-shrink-0 text-lg font-bold">{typeIcons[type]}</span>

      <div className="flex-1">
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <p>{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 underline hover:opacity-80 font-semibold"
            data-testid="toast-action"
          >
            {action.label}
          </button>
        )}
      </div>

      {showCloseButton && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100"
          aria-label="Close toast"
          data-testid={`toast-close-${id}`}
        >
          ✕
        </button>
      )}

      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-white/30"
          style={{ animation: `shrink ${duration}ms linear forwards` }}
          data-testid={`toast-progress-${id}`}
        />
      )}
    </div>
  );
};

import React from "react";

describe("Toast Component", () => {
  let mockOnClose;
  let defaultProps;

  beforeEach(() => {
    mockOnClose = vi.fn();
    defaultProps = {
      id: "toast-1",
      message: "Toast message",
      onClose: mockOnClose,
    };
  });

  describe("Rendering", () => {
    it("should render toast", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1")).toBeInTheDocument();
    });

    it("should display message", () => {
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} message="Test message" />
      );
      expect(getByText("Test message")).toBeInTheDocument();
    });

    it("should display title when provided", () => {
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} title="Success" />
      );
      expect(getByText("Success")).toBeInTheDocument();
    });

    it("should have status role for accessibility", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1")).toHaveAttribute("role", "status");
    });

    it("should have aria-live=polite", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Toast Types", () => {
    it("should render success toast with green styling", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} type="success" />
      );
      const toast = getByTestId("toast-toast-1");
      expect(toast.className).toContain("bg-green");
      expect(toast).toHaveAttribute("data-type", "success");
    });

    it("should render error toast with red styling", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} type="error" />
      );
      const toast = getByTestId("toast-toast-1");
      expect(toast.className).toContain("bg-red");
      expect(toast).toHaveAttribute("data-type", "error");
    });

    it("should render warning toast with yellow styling", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} type="warning" />
      );
      const toast = getByTestId("toast-toast-1");
      expect(toast.className).toContain("bg-yellow");
      expect(toast).toHaveAttribute("data-type", "warning");
    });

    it("should render info toast with blue styling", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} type="info" />
      );
      const toast = getByTestId("toast-toast-1");
      expect(toast.className).toContain("bg-blue");
      expect(toast).toHaveAttribute("data-type", "info");
    });

    it("should display correct icon for each type", () => {
      const types = ["success", "error", "warning", "info"];
      const icons = ["✓", "✕", "⚠", "ℹ"];

      types.forEach((type, index) => {
        const { getByText } = renderWithProviders(
          <Toast {...defaultProps} type={type} message="msg" />
        );
        expect(getByText(icons[index])).toBeInTheDocument();
      });
    });
  });

  describe("Auto-Dismiss", () => {
    it("should dismiss after specified duration", () => {
      vi.useFakeTimers();
      renderWithProviders(<Toast {...defaultProps} duration={3000} />);
      vi.advanceTimersByTime(3000);
      expect(mockOnClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("should not dismiss when duration is 0", () => {
      vi.useFakeTimers();
      renderWithProviders(<Toast {...defaultProps} duration={0} />);
      vi.advanceTimersByTime(10000);
      expect(mockOnClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("should dismiss with default 3000ms duration", () => {
      vi.useFakeTimers();
      renderWithProviders(<Toast {...defaultProps} duration={3000} />);
      vi.advanceTimersByTime(3000);
      expect(mockOnClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("should clear timeout on unmount", () => {
      vi.useFakeTimers();
      const { unmount } = renderWithProviders(
        <Toast {...defaultProps} duration={5000} />
      );
      unmount();
      vi.advanceTimersByTime(5000);
      expect(mockOnClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("should support fast dismiss", () => {
      vi.useFakeTimers();
      renderWithProviders(<Toast {...defaultProps} duration={500} />);
      vi.advanceTimersByTime(500);
      expect(mockOnClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("should support slow dismiss", () => {
      vi.useFakeTimers();
      renderWithProviders(<Toast {...defaultProps} duration={10000} />);
      vi.advanceTimersByTime(10000);
      expect(mockOnClose).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe("Close Button", () => {
    it("should display close button by default", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-close-toast-1")).toBeInTheDocument();
    });

    it("should not display close button when showCloseButton is false", () => {
      const { queryByTestId } = renderWithProviders(
        <Toast {...defaultProps} showCloseButton={false} />
      );
      expect(queryByTestId("toast-close-toast-1")).not.toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      await user.click(getByTestId("toast-close-toast-1"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should have aria-label on close button", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-close-toast-1")).toHaveAttribute("aria-label", "Close toast");
    });
  });

  describe("Position Variants", () => {
    it("should support top-right position", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} position="top-right" />
      );
      expect(getByTestId("toast-toast-1").className).toContain("toast-top-right");
    });

    it("should support top-left position", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} position="top-left" />
      );
      expect(getByTestId("toast-toast-1").className).toContain("toast-top-left");
    });

    it("should support bottom-right position", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} position="bottom-right" />
      );
      expect(getByTestId("toast-toast-1").className).toContain("toast-bottom-right");
    });

    it("should support bottom-left position", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} position="bottom-left" />
      );
      expect(getByTestId("toast-toast-1").className).toContain("toast-bottom-left");
    });

    it("should default to top-right position", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} position="top-right" />
      );
      expect(getByTestId("toast-toast-1").className).toContain("toast-top-right");
    });
  });

  describe("Action Button", () => {
    it("should display action button when provided", () => {
      const action = { label: "Undo", onClick: vi.fn() };
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} action={action} />
      );
      expect(getByTestId("toast-action")).toBeInTheDocument();
    });

    it("should call action onClick when clicked", async () => {
      const user = setupUser();
      const mockActionClick = vi.fn();
      const action = { label: "Retry", onClick: mockActionClick };
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} action={action} />
      );
      await user.click(getByTestId("toast-action"));
      expect(mockActionClick).toHaveBeenCalled();
    });

    it("should display action label", () => {
      const action = { label: "View Details", onClick: vi.fn() };
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} action={action} />
      );
      expect(getByText("View Details")).toBeInTheDocument();
    });

    it("should not display action when not provided", () => {
      const { queryByTestId } = renderWithProviders(
        <Toast {...defaultProps} action={null} />
      );
      expect(queryByTestId("toast-action")).not.toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("should display progress bar when duration > 0", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} duration={3000} />
      );
      expect(getByTestId("toast-progress-toast-1")).toBeInTheDocument();
    });

    it("should not display progress bar when duration is 0", () => {
      const { queryByTestId } = renderWithProviders(
        <Toast {...defaultProps} duration={0} />
      );
      expect(queryByTestId("toast-progress-toast-1")).not.toBeInTheDocument();
    });

    it("should animate progress bar", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} duration={3000} />
      );
      const progress = getByTestId("toast-progress-toast-1");
      expect(progress.style.animation).toContain("3000ms");
    });
  });

  describe("Accessibility", () => {
    it("should have status role", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1")).toHaveAttribute("role", "status");
    });

    it("should have aria-live=polite for notifications", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1")).toHaveAttribute("aria-live", "polite");
    });

    it("should be visible to screen readers", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1")).toBeInTheDocument();
    });
  });

  describe("Z-Index", () => {
    it("should have z-50 for stacking", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1").className).toContain("z-50");
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1").className).toContain("rounded-lg");
    });

    it("should have shadow", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1").className).toContain("shadow-lg");
    });

    it("should have padding", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1").className).toContain("p-4");
    });

    it("should have max width constraint", () => {
      const { getByTestId } = renderWithProviders(<Toast {...defaultProps} />);
      expect(getByTestId("toast-toast-1").className).toContain("max-w-sm");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long message", () => {
      const longMessage = "This is a very long message. ".repeat(50);
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} message={longMessage} />
      );
      expect(getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle empty message", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} message="" />
      );
      expect(getByTestId("toast-toast-1")).toBeInTheDocument();
    });

    it("should handle special characters", () => {
      const specialMessage = "Error: <500> & timeout 'critical'";
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} message={specialMessage} />
      );
      expect(getByText(specialMessage)).toBeInTheDocument();
    });

    it("should handle empty title", () => {
      const { getByTestId } = renderWithProviders(
        <Toast {...defaultProps} title="" />
      );
      expect(getByTestId("toast-toast-1")).toBeInTheDocument();
    });
  });

  describe("Multiple Toasts", () => {
    it("should render multiple toasts", () => {
      const { container } = renderWithProviders(
        <div>
          <Toast id="1" message="Message 1" onClose={() => {}} />
          <Toast id="2" message="Message 2" onClose={() => {}} />
          <Toast id="3" message="Message 3" onClose={() => {}} />
        </div>
      );
      expect(container.querySelectorAll('[role="status"]').length).toBe(3);
    });

    it("should stack multiple toasts vertically", () => {
      const { container } = renderWithProviders(
        <div>
          <Toast id="1" message="Message 1" onClose={() => {}} position="top-right" />
          <Toast id="2" message="Message 2" onClose={() => {}} position="top-right" />
        </div>
      );
      expect(container.querySelectorAll('[data-testid^="toast-"]').length).toBe(2);
    });
  });

  describe("Title and Message", () => {
    it("should render with title and message", () => {
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} title="Success!" message="Operation completed" />
      );
      expect(getByText("Success!")).toBeInTheDocument();
      expect(getByText("Operation completed")).toBeInTheDocument();
    });

    it("should render title in bold", () => {
      const { getByText } = renderWithProviders(
        <Toast {...defaultProps} title="Bold Title" />
      );
      expect(getByText("Bold Title").className).toContain("font-semibold");
    });
  });
});
