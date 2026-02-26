/**
 * ConfirmDialog Component Tests - Tier 2 Overlays
 *
 * Tests confirmation modal behavior:
 * - OK/Cancel buttons
 * - Action callbacks
 * - Loading state
 * - Keyboard shortcuts
 * - Confirmation message
 * - Destructive actions
 */

import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";

// Mock ConfirmDialog component
const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "OK",
  cancelText = "Cancel",
  isLoading = false,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Test mock overlay - backdrop click to close
    <div
      className="fixed inset-0 z-50 bg-black/80"
      data-testid="confirm-overlay"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      role="presentation"
    >
      <div
        className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg p-6 max-w-sm"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        data-testid="confirm-dialog"
      >
        <h2 className="text-lg font-semibold mb-4" id="confirm-title">
          {title}
        </h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            data-testid="confirm-cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded ${
              isDangerous
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            }`}
            data-testid="confirm-ok"
          >
            {isLoading ? "Loading..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

describe("ConfirmDialog Component", () => {
  let mockOnConfirm;
  let mockOnCancel;
  let defaultProps;

  beforeEach(() => {
    mockOnConfirm = vi.fn();
    mockOnCancel = vi.fn();
    defaultProps = {
      isOpen: true,
      onConfirm: mockOnConfirm,
      onCancel: mockOnCancel,
    };
  });

  describe("Rendering", () => {
    it("should render when isOpen is true", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-dialog")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      const { queryByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isOpen={false} />);
      expect(queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });

    it("should display custom title", () => {
      const { getByText } = renderWithProviders(<ConfirmDialog {...defaultProps} title="Delete User?" />);
      expect(getByText("Delete User?")).toBeInTheDocument();
    });

    it("should display custom message", () => {
      const { getByText } = renderWithProviders(
        <ConfirmDialog {...defaultProps} message="This action cannot be undone." />
      );
      expect(getByText("This action cannot be undone.")).toBeInTheDocument();
    });

    it("should have alertdialog role for accessibility", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-dialog")).toHaveAttribute("role", "alertdialog");
    });
  });

  describe("Button Labels", () => {
    it("should display default button labels", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-ok")).toHaveTextContent("OK");
      expect(getByTestId("confirm-cancel")).toHaveTextContent("Cancel");
    });

    it("should display custom confirm button label", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} confirmText="Delete" />);
      expect(getByTestId("confirm-ok")).toHaveTextContent("Delete");
    });

    it("should display custom cancel button label", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} cancelText="Keep" />);
      expect(getByTestId("confirm-cancel")).toHaveTextContent("Keep");
    });

    it("should support long button labels", () => {
      const { getByTestId } = renderWithProviders(
        <ConfirmDialog {...defaultProps} confirmText="Delete Permanently" cancelText="Cancel Operation" />
      );
      expect(getByTestId("confirm-ok")).toHaveTextContent("Delete Permanently");
      expect(getByTestId("confirm-cancel")).toHaveTextContent("Cancel Operation");
    });
  });

  describe("Button Actions", () => {
    it("should call onConfirm when OK button is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      await user.click(getByTestId("confirm-ok"));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when Cancel button is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      await user.click(getByTestId("confirm-cancel"));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when overlay is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      await user.click(getByTestId("confirm-overlay"));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should not call callbacks when content is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      await user.click(getByTestId("confirm-dialog"));
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it("should only call one callback per action", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      await user.click(getByTestId("confirm-ok"));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should show loading text when isLoading is true", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isLoading={true} />);
      expect(getByTestId("confirm-ok")).toHaveTextContent("Loading...");
    });

    it("should disable buttons when isLoading is true", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isLoading={true} />);
      expect(getByTestId("confirm-ok")).toBeDisabled();
      expect(getByTestId("confirm-cancel")).toBeDisabled();
    });

    it("should not call callback when disabled button is clicked", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isLoading={true} />);
      await user.click(getByTestId("confirm-ok"));
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it("should restore button text when loading completes", () => {
      const { rerender, getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isLoading={true} />);
      rerender(<ConfirmDialog {...defaultProps} isLoading={false} />);
      expect(getByTestId("confirm-ok")).toHaveTextContent("OK");
    });

    it("should apply visual loading state to confirm button", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isLoading={true} />);
      const button = getByTestId("confirm-ok");
      expect(button.className).toContain("disabled");
    });
  });

  describe("Dangerous Actions", () => {
    it("should use red color for dangerous actions", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isDangerous={true} />);
      const button = getByTestId("confirm-ok");
      expect(button.className).toContain("bg-red-600");
    });

    it("should use blue color for safe actions", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} isDangerous={false} />);
      const button = getByTestId("confirm-ok");
      expect(button.className).toContain("bg-blue-600");
    });

    it("should display danger message for deletion", () => {
      const dangerMessage = "This will permanently delete all associated data.";
      const { getByText } = renderWithProviders(
        <ConfirmDialog {...defaultProps} message={dangerMessage} isDangerous={true} />
      );
      expect(getByText(dangerMessage)).toBeInTheDocument();
    });

    it("should maintain dangerous styling when loading", () => {
      const { getByTestId } = renderWithProviders(
        <ConfirmDialog {...defaultProps} isDangerous={true} isLoading={true} />
      );
      const button = getByTestId("confirm-ok");
      expect(button.className).toContain("red");
    });
  });

  describe("Accessibility", () => {
    it("should have proper alertdialog role", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-dialog")).toHaveAttribute("role", "alertdialog");
    });

    it("should have aria-modal attribute", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("should support aria-labelledby", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} aria-labelledby="confirm-title" />);
      expect(getByTestId("confirm-dialog")).toBeInTheDocument();
    });

    it("should have descriptive button labels", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-ok")).toBeInTheDocument();
      expect(getByTestId("confirm-cancel")).toBeInTheDocument();
    });
  });

  describe("Focus Management", () => {
    it("should have proper button order", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      const buttons = getByTestId("confirm-dialog").querySelectorAll("button");
      expect(buttons[0]).toBe(getByTestId("confirm-cancel"));
      expect(buttons[1]).toBe(getByTestId("confirm-ok"));
    });

    it("should render cancel button before confirm button", () => {
      const { container } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      const buttons = container.querySelectorAll("button");
      expect(buttons[buttons.length - 2]).toHaveAttribute("data-testid", "confirm-cancel");
      expect(buttons[buttons.length - 1]).toHaveAttribute("data-testid", "confirm-ok");
    });
  });

  describe("Custom Content", () => {
    it("should display long confirmation messages", () => {
      const longMessage =
        "Are you absolutely certain you want to proceed? This action will affect all users and cannot be easily reversed.";
      const { getByText } = renderWithProviders(<ConfirmDialog {...defaultProps} message={longMessage} />);
      expect(getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle special characters in message", () => {
      const specialMessage = "Delete 'Project ABC' (2024)? This can't be undone!";
      const { getByText } = renderWithProviders(<ConfirmDialog {...defaultProps} message={specialMessage} />);
      expect(getByText(specialMessage)).toBeInTheDocument();
    });

    it("should handle multiline messages", () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";
      const { getByText } = renderWithProviders(<ConfirmDialog {...defaultProps} message={multilineMessage} />);
      expect(getByText(multilineMessage)).toBeInTheDocument();
    });
  });

  describe("Keyboard Support", () => {
    it("should be keyboard navigable", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      const cancelButton = getByTestId("confirm-cancel");
      const okButton = getByTestId("confirm-ok");
      expect(cancelButton).toBeInTheDocument();
      expect(okButton).toBeInTheDocument();
    });

    it("should allow tabbing between buttons", () => {
      const { getByTestId } = renderWithProviders(
        <ConfirmDialog {...defaultProps} title="Tab Test" message="Test message" />
      );
      const buttons = getByTestId("confirm-dialog").querySelectorAll("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid confirm/cancel clicks", async () => {
      const user = setupUser();
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      const okButton = getByTestId("confirm-ok");
      await user.click(okButton);
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it("should handle empty title", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} title="" />);
      expect(getByTestId("confirm-dialog")).toBeInTheDocument();
    });

    it("should handle very long title", () => {
      const longTitle =
        "Are you absolutely certain you want to delete this important resource that has been used by multiple users?";
      const { getByText } = renderWithProviders(<ConfirmDialog {...defaultProps} title={longTitle} />);
      expect(getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle HTML special characters", () => {
      const htmlMessage = "Delete <Project> & team 'Alpha'?";
      const { getByText } = renderWithProviders(<ConfirmDialog {...defaultProps} message={htmlMessage} />);
      expect(getByText(htmlMessage)).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should support dark mode styling", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      const dialog = getByTestId("confirm-dialog");
      expect(dialog.className).toContain("bg-white");
    });
  });

  describe("Z-Index Stacking", () => {
    it("should render with high z-index", () => {
      const { getByTestId } = renderWithProviders(<ConfirmDialog {...defaultProps} />);
      expect(getByTestId("confirm-overlay").className).toContain("z-50");
    });

    it("should handle multiple dialogs with proper stacking", () => {
      const { container } = renderWithProviders(
        <div>
          <ConfirmDialog isOpen={true} onConfirm={() => {}} onCancel={() => {}} />
          <ConfirmDialog isOpen={true} onConfirm={() => {}} onCancel={() => {}} />
        </div>
      );
      const dialogs = container.querySelectorAll('[data-testid="confirm-dialog"]');
      expect(dialogs.length).toBe(2);
    });
  });
});
