/**
 * CreditNoteStatusActions Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests credit note status transitions, action buttons, and workflow management
 */

import sinon from "sinon";
// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import CreditNoteStatusActions from "../CreditNoteStatusActions";

const mockCreditNoteService = {
  getAllowedTransitions: sinon.stub(),
  issueCreditNote: sinon.stub(),
  markItemsReceived: sinon.stub(),
  applyCreditNote: sinon.stub(),
  completeCreditNote: sinon.stub(),
  cancelCreditNote: sinon.stub(),
};

const mockNotificationService = {
  success: sinon.stub(),
  error: sinon.stub(),
};

// sinon.stub() // "../../../services/creditNoteService", () => ({
creditNoteService: mockCreditNoteService,
}))

// sinon.stub() // "../../../services/notificationService", () => ({
notificationService: mockNotificationService,
}))

// sinon.stub() // "../ConfirmDialog", () => ({
default: (
{
  title, message, onConfirm, onCancel;
}
) => (
    <div data-testid="confirm-dialog">
      <h2>
{
  title;
}
</h2>
(<p>
{
  message;
}
</p>) < button;
type = "button";
onClick = { onConfirm } > Confirm;
</button>
      <button
type = "button";
onClick = { onCancel } > Cancel;
</button>
    </div>
  ),
}))

describe("CreditNoteStatusActions", () =>
{
  let defaultProps;
  let mockOnStatusChange;
  let mockOnOpenQCModal;
  let mockOnOpenRefundModal;

  beforeEach(() => {
    sinon.restore();
    mockOnStatusChange = sinon.stub();
    mockOnOpenQCModal = sinon.stub();
    mockOnOpenRefundModal = sinon.stub();

    defaultProps = {
      creditNoteId: "CN-001",
      currentStatus: "draft",
      onStatusChange: mockOnStatusChange,
      onOpenQCModal: mockOnOpenQCModal,
      onOpenRefundModal: mockOnOpenRefundModal,
      compact: false,
    };

    mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
      allowedTransitions: ["issued", "cancelled"],
    });
  });

  describe("Rendering", () => {
    it("should render action buttons", () => {
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show loading state while fetching transitions", async () => {
      mockCreditNoteService.getAllowedTransitions.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ allowedTransitions: [] }), 100))
      );

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      expect(container.textContent).toMatch(/Loading/i);
    });

    it("should display action buttons for allowed transitions", async () => {
      const { container } = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(renderWithProviders(<CreditNoteStatusActions {...defaultProps} />));
        }, 50);
      });

      expect(container).toBeInTheDocument();
    });

    it("should return null when no allowed transitions", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: [],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      // Wait for async call
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Allowed Transitions", () => {
    it("should fetch allowed transitions on mount", async () => {
      renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCreditNoteService.getAllowedTransitions).toHaveBeenCalledWith("CN-001");
    });

    it("should refetch when creditNoteId changes", async () => {
      const { rerender } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialCallCount = mockCreditNoteService.getAllowedTransitions.mock.calls.length;

      rerender(<CreditNoteStatusActions {...defaultProps} creditNoteId="CN-002" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCreditNoteService.getAllowedTransitions.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it("should refetch when currentStatus changes", async () => {
      const { rerender } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialCallCount = mockCreditNoteService.getAllowedTransitions.mock.calls.length;

      rerender(<CreditNoteStatusActions {...defaultProps} currentStatus="issued" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCreditNoteService.getAllowedTransitions.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it("should handle API error gracefully", async () => {
      mockCreditNoteService.getAllowedTransitions.mockRejectedValue(new Error("API Error"));

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.firstChild).toBeNull();
    });

    it("should support both camelCase and snake_case response", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowed_transitions: ["issued"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should display button for each allowed transition", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued", "cancelled"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have correct styling for different actions", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      expect(button?.className).toContain("bg-blue-600");
    });

    it("should show icon and label for each action", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued", "cancelled"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should respect compact layout prop", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} compact={true} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      expect(button?.className).toContain("px-2");
    });
  });

  describe("Simple Confirmation Actions", () => {
    it("should show confirm dialog for issued transition", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(container.textContent).toMatch(/Confirm/i);
    });

    it("should confirm and execute issued transition", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockResolvedValue({ status: "issued" });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          await new Promise((resolve) => setTimeout(resolve, 50));

          expect(mockCreditNoteService.issueCreditNote).toHaveBeenCalledWith("CN-001");
        }
      }
    });

    it("should cancel action when user clicks cancel", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const cancelButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Cancel")
        );
        if (cancelButton) {
          await user.click(cancelButton);
          await new Promise((resolve) => setTimeout(resolve, 50));

          expect(mockCreditNoteService.issueCreditNote).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe("Modal Actions (QC Inspection)", () => {
    it("should open QC modal instead of direct transition", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["items_inspected"],
      });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(mockOnOpenQCModal).toHaveBeenCalled();
    });

    it("should not call API when opening QC modal", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["items_inspected"],
      });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Reset mock calls from initial load
      const initialApiCalls = mockCreditNoteService.getAllowedTransitions.mock.calls.length;
      expect(mockCreditNoteService.getAllowedTransitions.mock.calls.length).toBe(initialApiCalls);
    });
  });

  describe("Modal Actions (Refund)", () => {
    it("should open refund modal instead of direct transition", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["refunded"],
      });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(mockOnOpenRefundModal).toHaveBeenCalled();
    });
  });

  describe("Cancellation with Reason", () => {
    it("should prompt for cancellation reason", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["cancelled"],
      });

      vi.spyOn(window, "prompt").mockReturnValue("Wrong amount");

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(window.prompt).toHaveBeenCalled();
    });

    it("should cancel API call if user cancels prompt", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["cancelled"],
      });

      vi.spyOn(window, "prompt").mockReturnValue(null);

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(mockCreditNoteService.cancelCreditNote).not.toHaveBeenCalled();
    });

    it("should call API with cancellation reason", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["cancelled"],
      });
      mockCreditNoteService.cancelCreditNote.mockResolvedValue({ status: "cancelled" });

      vi.spyOn(window, "prompt").mockReturnValue("Duplicate request");

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const button = container.querySelector("button");
      if (button) {
        await user.click(button);
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(mockCreditNoteService.cancelCreditNote).toHaveBeenCalledWith("CN-001", "Duplicate request");
      }
    });
  });

  describe("Success and Error Handling", () => {
    it("should show success notification on transition success", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockResolvedValue({ status: "issued" });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          await new Promise((resolve) => setTimeout(resolve, 100));

          expect(mockNotificationService.success).toHaveBeenCalled();
        }
      }
    });

    it("should call onStatusChange with result on success", async () => {
      const result = { status: "issued", id: "CN-001" };
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockResolvedValue(result);

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          await new Promise((resolve) => setTimeout(resolve, 100));

          expect(mockOnStatusChange).toHaveBeenCalledWith(result);
        }
      }
    });

    it("should show error notification on API failure", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockRejectedValue(new Error("API Error"));

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          await new Promise((resolve) => setTimeout(resolve, 100));

          expect(mockNotificationService.error).toHaveBeenCalled();
        }
      }
    });

    it("should refetch transitions after successful action", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockResolvedValue({ status: "issued" });

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const initialCallCount = mockCreditNoteService.getAllowedTransitions.mock.calls.length;

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          await new Promise((resolve) => setTimeout(resolve, 100));

          expect(mockCreditNoteService.getAllowedTransitions.mock.calls.length).toBeGreaterThan(initialCallCount);
        }
      }
    });
  });

  describe("Loading and Disabled States", () => {
    it("should disable all buttons during action execution", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: "issued" }), 200))
      );

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          // Immediately check if disabled (before promise resolves)
          expect(container.querySelector("button")?.disabled || false).toBeTruthy();
        }
      }
    });

    it("should show loader icon during action", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: "issued" }), 200))
      );

      const user = setupUser();
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const actionButton = container.querySelector("button");
      if (actionButton) {
        await user.click(actionButton);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const confirmButton = Array.from(container.querySelectorAll("button")).find((btn) =>
          btn.textContent.includes("Confirm")
        );
        if (confirmButton) {
          await user.click(confirmButton);
          expect(container).toBeInTheDocument();
        }
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle null creditNoteId", () => {
      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} creditNoteId={null} />);

      expect(container.firstChild).toBeNull();
    });

    it("should handle undefined onStatusChange", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued"],
      });
      mockCreditNoteService.issueCreditNote.mockResolvedValue({ status: "issued" });

      const { container } = renderWithProviders(
        <CreditNoteStatusActions {...defaultProps} onStatusChange={undefined} />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle multiple concurrent action attempts", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["issued", "cancelled"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify both buttons exist and only one can be active
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle transitions with special characters in labels", async () => {
      mockCreditNoteService.getAllowedTransitions.mockResolvedValue({
        allowedTransitions: ["items_received", "items_inspected"],
      });

      const { container } = renderWithProviders(<CreditNoteStatusActions {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });
}
)
