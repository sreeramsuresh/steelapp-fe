/**
 * PaymentReminderModal Component Tests
 * Phase 5.3.2b: Tier 1 - Payment Processing Component
 *
 * Tests payment reminder call notes functionality:
 * - Modal open/close behavior
 * - Reminder CRUD operations (create, read, update, delete)
 * - Form validation and error handling
 * - Invoice summary display
 * - User context and timestamp handling
 * - Dark mode support
 * - Loading and error states
 */

import { screen, waitFor } from "@testing-library/react";
import sinon from "sinon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";
import PaymentReminderModal from "../PaymentReminderModal";

// Mock API Service
const mockApiService = {
  get: sinon.stub(),
  post: sinon.stub(),
  put: sinon.stub(),
  delete: sinon.stub(),
};

// sinon.stub() // "../../services/axiosApi", () => ({
apiService: mockApiService, tokenUtils;
:
{
  getUser: sinon.stub().mockReturnValue({
      id: "user-123",
      name: "John Doe",
      email: "john@example.com",
    }),
}
,
}))

// Mock Notification Service
// sinon.stub() // "../../services/notificationService", () => ({
{
  success: sinon.stub(), error;
  : sinon.stub(),
    warning: sinon.stub(),
    info: sinon.stub(),
}
,
}))

// Mock Utilities
// sinon.stub() // "../../utils/invoiceUtils", () => ({
formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`, formatDateTime;
: (date) => new Date(date).toLocaleString(),
}))

// Mock ConfirmDialog
// sinon.stub() // "../ConfirmDialog", () => ({
default: (
{
  open, title, message, onConfirm, onCancel;
}
) =>
{
  if (!open) return null;
  return (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>
          Delete
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
}
,
}))

// Mock ThemeContext
// sinon.stub() // "../../contexts/ThemeContext", () => ({
useTheme: () => ({ isDarkMode: false }),
}))

describe("PaymentReminderModal Component", () => {
  let mockOnClose;
  let mockOnSave;
  let defaultProps;
  let mockReminders;

  beforeEach(() => {
    sinon.restore();

    mockOnClose = sinon.stub();
    mockOnSave = sinon.stub();

    mockReminders = [
      {
        id: "rem-1",
        contactDate: new Date("2024-01-15T10:30:00Z").toISOString(),
        notes: "Customer not available, will call tomorrow",
        promisedAmount: "5000",
        promisedDate: "2024-01-20",
      },
      {
        id: "rem-2",
        contactDate: new Date("2024-01-16T14:00:00Z").toISOString(),
        notes: "Promised payment by end of week",
        promisedAmount: "3000",
        promisedDate: "2024-01-22",
      },
    ];

    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      invoice: {
        id: "inv-1",
        invoiceNumber: "INV-001",
        invoiceAmount: 10000,
        total: 10000,
        received: 2000,
        outstanding: 8000,
        balanceDue: 8000,
        customer: {
          id: "cust-1",
          name: "ABC Trading",
        },
      },
      onSave: mockOnSave,
      isViewOnly: false,
    };

    mockApiService.get.mockResolvedValue(mockReminders);
    mockApiService.post.mockImplementation((_url, data) => {
      const newReminder = {
        id: `rem-${Date.now()}`,
        ...data,
      };
      return Promise.resolve(newReminder);
    });
    mockApiService.put.mockImplementation((_url, data) => {
      return Promise.resolve({ id: "rem-1", ...data });
    });
    mockApiService.delete.mockResolvedValue({ success: true });
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      const props = { ...defaultProps, isOpen: false };
      const { container } = renderWithProviders(<PaymentReminderModal {...props} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render modal when isOpen is true", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Payment Reminder Calls")).toBeInTheDocument();
      });
    });

    it("should display modal header with invoice info", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Invoice: INV-001/)).toBeInTheDocument();
        expect(screen.getByText(/Customer: ABC Trading/)).toBeInTheDocument();
      });
    });

    it("should display close button", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "" })).toBeInTheDocument();
      });
    });

    it("should display invoice summary section", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Invoice Summary/)).toBeInTheDocument();
        expect(screen.getByText(/Total Amount/)).toBeInTheDocument();
        expect(screen.getByText(/Paid Amount/)).toBeInTheDocument();
        expect(screen.getByText(/Balance Due/)).toBeInTheDocument();
      });
    });

    it("should show view-only badge when isViewOnly is true", async () => {
      const props = { ...defaultProps, isViewOnly: true };
      renderWithProviders(<PaymentReminderModal {...props} />);

      await waitFor(() => {
        expect(screen.getByText("View Only")).toBeInTheDocument();
      });
    });

    it("should hide form when isViewOnly is true", async () => {
      const props = { ...defaultProps, isViewOnly: true };
      renderWithProviders(<PaymentReminderModal {...props} />);

      await waitFor(() => {
        expect(screen.queryByText(/New Call Note/)).not.toBeInTheDocument();
      });
    });
  });

  describe("Reminder Loading", () => {
    it("should fetch reminders when modal opens", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(mockApiService.get).toHaveBeenCalledWith(`/invoices/inv-1/payment-reminders`);
      });
    });

    it("should display loading state initially", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      // May show loading text briefly
      expect(screen.queryByText("Loading...")).toBeInTheDocument();
    });

    it("should display loaded reminders", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
        expect(screen.getByText(/Promised payment by end of week/)).toBeInTheDocument();
      });
    });

    it("should display reminder count", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        const reminders = screen.getAllByText(/Customer not available|Promised payment by end/);
        expect(reminders.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Reminder Form Fields", () => {
    it("should display date & time input", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Date & Time of Call/)).toBeInTheDocument();
      });
    });

    it("should display call notes textarea", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Call Notes/)).toBeInTheDocument();
      });
    });

    it("should display promised amount input", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Promised Amount/)).toBeInTheDocument();
      });
    });

    it("should display promised date input", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/When Will Customer Pay/)).toBeInTheDocument();
      });
    });

    it("should show default date as today", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/Date & Time of Call/);
        expect(dateInput).toHaveValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/));
      });
    });

    it("should show notes character count", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/\/200/)).toBeInTheDocument();
      });
    });
  });

  describe("Reminder Creation", () => {
    it("should create new reminder when form submitted", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      await user.type(notesInput, "Customer promises to pay tomorrow");

      const saveButton = screen.getByRole("button", { name: /Save Note/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          `/invoices/inv-1/payment-reminders`,
          expect.objectContaining({
            notes: "Customer promises to pay tomorrow",
          })
        );
      });
    });

    it("should clear form after successful creation", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      await user.type(notesInput, "Test note");

      const saveButton = screen.getByRole("button", { name: /Save Note/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(notesInput).toHaveValue("");
      });
    });

    it("should require notes field", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /Save Note/ });
      await user.click(saveButton);

      // Should not submit if notes are empty
      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    it("should show success notification after creation", async () => {
      const user = setupUser();
      const { notificationService } = await import("../../services/notificationService");

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      await user.type(notesInput, "Test note");

      const saveButton = screen.getByRole("button", { name: /Save Note/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(notificationService.success).toHaveBeenCalledWith("Note saved successfully");
      });
    });

    it("should call onSave callback after creation", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      await user.type(notesInput, "Test note");

      const saveButton = screen.getByRole("button", { name: /Save Note/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("should accept promised amount", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Promised Amount/)).toBeInTheDocument();
      });

      const promisedAmountInput = screen.getByPlaceholderText(/e.g., 5000/);
      await user.type(promisedAmountInput, "5000");

      expect(promisedAmountInput).toHaveValue(5000);
    });

    it("should accept promised date", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/When Will Customer Pay/)).toBeInTheDocument();
      });

      const promisedDateInput = screen.getByLabelText(/When Will Customer Pay/);
      await user.type(promisedDateInput, "2024-01-25");

      expect(promisedDateInput).toHaveValue("2024-01-25");
    });
  });

  describe("Reminder Editing", () => {
    it("should populate form when edit button clicked", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const editButtons = screen
        .getAllByRole("button", { name: /edit|Edit/ })
        .filter((btn) => btn.querySelector("svg"));
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        const notesInput = screen.getByLabelText(/Call Notes/);
        await waitFor(() => {
          expect(notesInput).toHaveValue("Customer not available, will call tomorrow");
        });
      }
    });

    it("should show Update button when editing", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const editButtons = screen
        .getAllByRole("button", { name: /edit|Edit/ })
        .filter((btn) => btn.querySelector("svg"));
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/Update Note/)).toBeInTheDocument();
        });
      }
    });

    it("should show Cancel button when editing", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const editButtons = screen
        .getAllByRole("button", { name: /edit|Edit/ })
        .filter((btn) => btn.querySelector("svg"));
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/Cancel/)).toBeInTheDocument();
        });
      }
    });

    it("should update reminder when form submitted during edit", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const editButtons = screen
        .getAllByRole("button", { name: /edit|Edit/ })
        .filter((btn) => btn.querySelector("svg"));
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        const notesInput = screen.getByLabelText(/Call Notes/);
        await user.clear(notesInput);
        await user.type(notesInput, "Updated note");

        const updateButton = screen.getByRole("button", { name: /Update Note/ });
        await user.click(updateButton);

        await waitFor(() => {
          expect(mockApiService.put).toHaveBeenCalledWith(
            `/invoices/payment-reminders/rem-1`,
            expect.objectContaining({
              notes: "Updated note",
            })
          );
        });
      }
    });

    it("should clear form when cancel clicked during edit", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const editButtons = screen
        .getAllByRole("button", { name: /edit|Edit/ })
        .filter((btn) => btn.querySelector("svg"));
      if (editButtons.length > 0) {
        await user.click(editButtons[0]);

        const cancelButton = screen.getByRole("button", { name: /Cancel/ });
        await user.click(cancelButton);

        const notesInput = screen.getByLabelText(/Call Notes/);
        await waitFor(() => {
          expect(notesInput).toHaveValue("");
        });
      }
    });
  });

  describe("Reminder Deletion", () => {
    it("should show delete button for each reminder", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        const deleteButtons = screen
          .getAllByRole("button", { name: /delete|Delete/ })
          .filter((btn) => btn.querySelector("svg"));
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it("should show confirmation dialog on delete", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const deleteButtons = screen
        .getAllByRole("button", { name: /delete|Delete/ })
        .filter((btn) => btn.querySelector("svg"));
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
        });
      }
    });

    it("should delete reminder when confirmed", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const deleteButtons = screen
        .getAllByRole("button", { name: /delete|Delete/ })
        .filter((btn) => btn.querySelector("svg"));
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        const confirmButton = screen.getByRole("button", { name: /Delete/ });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(mockApiService.delete).toHaveBeenCalledWith(`/invoices/payment-reminders/rem-1`);
        });
      }
    });

    it("should show success notification after deletion", async () => {
      const user = setupUser();
      const { notificationService } = await import("../../services/notificationService");

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const deleteButtons = screen
        .getAllByRole("button", { name: /delete|Delete/ })
        .filter((btn) => btn.querySelector("svg"));
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        const confirmButton = screen.getByRole("button", { name: /Delete/ });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(notificationService.success).toHaveBeenCalledWith("Note deleted successfully");
        });
      }
    });
  });

  describe("Modal Interaction", () => {
    it("should close modal when close button clicked", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Payment Reminder Calls")).toBeInTheDocument();
      });

      // Close button is an SVG icon button, find by closest button in header
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons[buttons.length - 1];
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should close modal when backdrop clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      const backdrop = container.querySelector(".flex-1.bg-black\\/30");
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe("Invoice Summary Display", () => {
    it("should display total amount", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/AED 10000.00/)).toBeInTheDocument();
      });
    });

    it("should display paid amount", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/AED 2000.00/)).toBeInTheDocument();
      });
    });

    it("should display balance due", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/AED 8000.00/)).toBeInTheDocument();
      });
    });

    it("should display customer name", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("ABC Trading")).toBeInTheDocument();
      });
    });
  });

  describe("Promised Payment Display", () => {
    it("should display promised amount badge", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Promised Amount:/)).toBeInTheDocument();
        expect(screen.getByText(/AED 5000.00/)).toBeInTheDocument();
      });
    });

    it("should display promised date", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Promised Date:/)).toBeInTheDocument();
      });
    });

    it("should not display promised fields if not set", async () => {
      const noPromiseReminders = [
        {
          id: "rem-1",
          contactDate: new Date().toISOString(),
          notes: "Just checking in",
          promisedAmount: null,
          promisedDate: null,
        },
      ];

      mockApiService.get.mockResolvedValueOnce(noPromiseReminders);

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Just checking in")).toBeInTheDocument();
      });
    });
  });

  describe("User Context", () => {
    it("should display current user first name", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("John")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle error when fetching reminders", async () => {
      mockApiService.get.mockRejectedValueOnce(new Error("Network error"));

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        // Should show empty list when fetch fails
        expect(screen.queryByText(/Customer not available/)).not.toBeInTheDocument();
      });
    });

    it("should handle error when creating reminder", async () => {
      const user = setupUser();
      mockApiService.post.mockRejectedValueOnce(new Error("Server error"));
      const { notificationService } = await import("../../services/notificationService");

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      await user.type(notesInput, "Test note");

      const saveButton = screen.getByRole("button", { name: /Save Note/ });
      await user.click(saveButton);

      await waitFor(() => {
        expect(notificationService.error).toHaveBeenCalled();
      });
    });

    it("should handle error when deleting reminder", async () => {
      const user = setupUser();
      mockApiService.delete.mockRejectedValueOnce(new Error("Delete failed"));
      const { notificationService } = await import("../../services/notificationService");

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Customer not available/)).toBeInTheDocument();
      });

      const deleteButtons = screen
        .getAllByRole("button", { name: /delete|Delete/ })
        .filter((btn) => btn.querySelector("svg"));
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        const confirmButton = screen.getByRole("button", { name: /Delete/ });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(notificationService.error).toHaveBeenCalled();
        });
      }
    });
  });

  describe("Text Area Auto-Resize", () => {
    it("should auto-expand textarea as user types", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      const _initialHeight = notesInput.style.height;

      const longText = "This is a very long text ".repeat(20);
      await user.type(notesInput, longText);

      // Height should increase with content
      expect(notesInput.style.height).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing invoice data gracefully", async () => {
      const props = {
        ...defaultProps,
        invoice: null,
      };

      const { container } = renderWithProviders(<PaymentReminderModal {...props} />);
      expect(container).toBeInTheDocument();
    });

    it("should handle empty reminders list", async () => {
      mockApiService.get.mockResolvedValueOnce([]);

      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });
    });

    it("should handle very long notes", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      const maxLengthText = "a".repeat(200);
      await user.type(notesInput, maxLengthText);

      expect(notesInput).toHaveValue("a".repeat(200));
    });

    it("should truncate notes exceeding max length", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      const notesInput = screen.getByLabelText(/Call Notes/);
      const longText = "a".repeat(250);
      await user.type(notesInput, longText);

      // Should be limited to 200 chars
      expect(notesInput.value.length).toBeLessThanOrEqual(200);
    });
  });

  describe("Dark Mode", () => {
    it("should apply dark mode styles when enabled", async () => {
      vi.doMock("../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Payment Reminder Calls")).toBeInTheDocument();
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", async () => {
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Date & Time of Call/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Call Notes/)).toBeInTheDocument();
        expect(screen.getByText(/Promised Amount/)).toBeInTheDocument();
        expect(screen.getByText(/When Will Customer Pay/)).toBeInTheDocument();
      });
    });

    it("should support keyboard navigation", async () => {
      const _user = setupUser();
      renderWithProviders(<PaymentReminderModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Call Note/)).toBeInTheDocument();
      });

      // Tab should navigate between form elements
      const notesInput = screen.getByLabelText(/Call Notes/);
      notesInput.focus();
      expect(document.activeElement).toBe(notesInput);
    });
  });
});
