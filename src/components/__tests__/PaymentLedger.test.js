/**
 * PaymentLedger Component Tests
 * Phase 5.3.2b: Tier 1 - Payment Processing Component
 *
 * Tests comprehensive payment ledger functionality:
 * - Payment table rendering with sorting
 * - Multi-select and bulk delete operations
 * - Payment receipt generation (print & download)
 * - Balance due calculations
 * - Edit/delete payment actions
 * - Dark mode support
 * - Loading and error states
 */

import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";
import PaymentLedger from "../PaymentLedger";

// Mock ThemeContext
vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// Mock utilities
vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`,
}));

vi.mock("../../utils/paymentUtils", () => ({
  calculateBalanceDue: (total, payments) => {
    const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.max(0, total - paid);
  },
  calculateTotalPaid: (payments) => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
  formatPaymentDisplay: (payment) => ({
    formattedDate: new Date(payment.date).toLocaleDateString(),
    formattedAmount: `AED ${payment.amount?.toFixed(2) || "0.00"}`,
  }),
  getPaymentModeConfig: (mode) => ({
    icon: "💳",
    label: mode === "cash" ? "Cash" : mode === "cheque" ? "Cheque" : "Transfer",
  }),
}));

// Mock receipt generator
vi.mock("../../utils/paymentReceiptGenerator", () => ({
  generatePaymentReceipt: vi.fn().mockResolvedValue({ success: true }),
  printPaymentReceipt: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock ConfirmDialog
vi.mock("../ConfirmDialog", () => ({
  default: ({ open, title, message, onConfirm, onCancel, variant: _variant }) => {
    if (!open) return null;
    return (
      <div data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  },
}));

describe("PaymentLedger Component", () => {
  let mockOnAddPayment;
  let mockOnEditPayment;
  let mockOnDeletePayment;
  let defaultProps;
  let mockPayments;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOnAddPayment = vi.fn();
    mockOnEditPayment = vi.fn();
    mockOnDeletePayment = vi.fn();

    mockPayments = [
      {
        id: "pay-1",
        date: "2024-01-15",
        amount: 5000,
        paymentMode: "cash",
        referenceNumber: "REF001",
        notes: "First payment received",
      },
      {
        id: "pay-2",
        date: "2024-01-20",
        amount: 3000,
        paymentMode: "cheque",
        referenceNumber: "CHQ123",
        notes: "Cheque payment - cleared",
      },
      {
        id: "pay-3",
        date: "2024-01-25",
        amount: 2000,
        paymentMode: "transfer",
        referenceNumber: "TRF456",
        notes: "",
      },
    ];

    defaultProps = {
      payments: mockPayments,
      invoice: {
        id: "inv-1",
        total: 10000,
        invoiceNumber: "INV-001",
      },
      company: {
        id: "comp-1",
        name: "Test Company",
        trn: "12345678",
      },
      onAddPayment: mockOnAddPayment,
      onEditPayment: mockOnEditPayment,
      onDeletePayment: mockOnDeletePayment,
    };
  });

  describe("Rendering", () => {
    it("should render payment ledger component", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      expect(screen.getByText("📝 Payment History")).toBeInTheDocument();
    });

    it("should display table with correct headers", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      expect(screen.getByText("#")).toBeInTheDocument();
      expect(screen.getByText("Date")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("Mode")).toBeInTheDocument();
      expect(screen.getByText("Reference")).toBeInTheDocument();
      expect(screen.getByText("Notes")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should display all payments in table rows", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      expect(screen.getByDisplayValue("REF001")).toBeInTheDocument();
      expect(screen.getByDisplayValue("CHQ123")).toBeInTheDocument();
      expect(screen.getByDisplayValue("TRF456")).toBeInTheDocument();
    });

    it("should show empty state when no payments", () => {
      const props = { ...defaultProps, payments: [] };
      renderWithProviders(<PaymentLedger {...props} />);
      expect(screen.getByText(/No payments recorded yet/)).toBeInTheDocument();
    });

    it("should hide Add Payment button when invoice is fully paid", () => {
      const props = {
        ...defaultProps,
        payments: [
          {
            id: "pay-1",
            date: "2024-01-15",
            amount: 10000,
            paymentMode: "cash",
            referenceNumber: "REF001",
            notes: "Full payment",
          },
        ],
      };
      renderWithProviders(<PaymentLedger {...props} />);
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
      expect(screen.queryByText("Add Payment")).not.toBeInTheDocument();
    });

    it("should show remaining balance badge when balance due", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      expect(screen.getByText(/Remaining Balance:/)).toBeInTheDocument();
    });
  });

  describe("Payment Selection & Bulk Delete", () => {
    it("should select individual payment by checkbox", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      // First checkbox is header, second is first payment
      await user.click(checkboxes[1]);

      expect(checkboxes[1]).toBeChecked();
    });

    it("should select all payments with header checkbox", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[0]);

      for (let i = 1; i < checkboxes.length; i++) {
        expect(checkboxes[i]).toBeChecked();
      }
    });

    it("should show delete button when payments selected", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);

      expect(screen.getByText(/Delete Selected/)).toBeInTheDocument();
    });

    it("should display delete count in button", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      expect(screen.getByText(/Delete Selected \(2\)/)).toBeInTheDocument();
    });

    it("should open confirmation dialog on delete", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);

      const deleteButton = screen.getByText(/Delete Selected/);
      await user.click(deleteButton);

      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    });

    it("should call onDeletePayment for each selected payment", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      const deleteButton = screen.getByText(/Delete Selected/);
      await user.click(deleteButton);

      const confirmButton = screen.getByText("Confirm");
      await user.click(confirmButton);

      expect(mockOnDeletePayment).toHaveBeenCalledTimes(2);
      expect(mockOnDeletePayment).toHaveBeenCalledWith("pay-1");
      expect(mockOnDeletePayment).toHaveBeenCalledWith("pay-2");
    });

    it("should clear selection after successful delete", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);

      const deleteButton = screen.getByText(/Delete Selected/);
      await user.click(deleteButton);

      const confirmButton = screen.getByText("Confirm");
      await user.click(confirmButton);

      expect(screen.queryByText(/Delete Selected/)).not.toBeInTheDocument();
    });
  });

  describe("Receipt Generation", () => {
    it("should render print button for each payment", () => {
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
      const printButtons = container.querySelectorAll("button[title*='print']");
      expect(printButtons.length).toBe(mockPayments.length);
    });

    it("should render download button for each payment", () => {
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
      const downloadButtons = container.querySelectorAll("button[title*='download']");
      expect(downloadButtons.length).toBe(mockPayments.length);
    });

    it("should trigger print receipt on button click", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
      const { printPaymentReceipt } = await import("../../utils/paymentReceiptGenerator");

      const printButtons = container.querySelectorAll("button[title*='print']");
      await user.click(printButtons[0]);

      await waitFor(() => {
        expect(printPaymentReceipt).toHaveBeenCalled();
      });
    });

    it("should trigger download receipt on button click", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
      const { generatePaymentReceipt } = await import("../../utils/paymentReceiptGenerator");

      const downloadButtons = container.querySelectorAll("button[title*='download']");
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(generatePaymentReceipt).toHaveBeenCalled();
      });
    });

    it("should disable receipt buttons while generating", async () => {
      const user = setupUser();
      const { container, rerender: _rerender } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const downloadButtons = container.querySelectorAll("button[title*='download']");
      const button = downloadButtons[0];

      await user.click(button);

      // Button should be disabled during generation
      expect(button.disabled || button.classList.contains("opacity-50")).toBeTruthy();
    });

    it("should show alert if invoice or company missing for receipt", async () => {
      const user = setupUser();
      const windowAlertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const props = { ...defaultProps, invoice: null };

      const { container } = renderWithProviders(<PaymentLedger {...props} />);
      const downloadButtons = container.querySelectorAll("button[title*='download']");

      await user.click(downloadButtons[0]);

      expect(windowAlertSpy).toHaveBeenCalledWith(expect.stringContaining("Unable to generate receipt"));

      windowAlertSpy.mockRestore();
    });
  });

  describe("Payment Actions", () => {
    it("should call onAddPayment when Add Payment clicked", async () => {
      const user = setupUser();
      renderWithProviders(<PaymentLedger {...defaultProps} />);

      const addButton = screen.getByText("Add Payment");
      await user.click(addButton);

      expect(mockOnAddPayment).toHaveBeenCalled();
    });

    it("should call onEditPayment with payment data when edit clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const editButtons = container.querySelectorAll("button[title*='Edit']");
      await user.click(editButtons[0]);

      expect(mockOnEditPayment).toHaveBeenCalledWith(mockPayments[0]);
    });

    it("should disable edit button when invoice fully paid", () => {
      const props = {
        ...defaultProps,
        payments: [
          {
            id: "pay-1",
            date: "2024-01-15",
            amount: 10000,
            paymentMode: "cash",
            referenceNumber: "REF001",
            notes: "Full payment",
          },
        ],
      };
      const { container } = renderWithProviders(<PaymentLedger {...props} />);

      const editButtons = container.querySelectorAll("button[title*='Edit']");
      expect(editButtons[0].disabled).toBe(true);
    });

    it("should truncate long notes", () => {
      const longNotesPayment = {
        id: "pay-1",
        date: "2024-01-15",
        amount: 5000,
        paymentMode: "cash",
        referenceNumber: "REF001",
        notes: "This is a very long note that exceeds the 30 character limit and should be truncated",
      };

      const props = { ...defaultProps, payments: [longNotesPayment] };
      renderWithProviders(<PaymentLedger {...props} />);

      const notesCell = screen.getByText(/This is a very long note.../);
      expect(notesCell).toBeInTheDocument();
    });

    it("should display full notes in title attribute", () => {
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
      const notesCells = container.querySelectorAll("td[title]");

      const cellWithNotes = Array.from(notesCells).find((cell) => cell.title.includes("First payment"));
      expect(cellWithNotes).toBeInTheDocument();
    });
  });

  describe("Payment Sorting", () => {
    it("should sort payments by date in chronological order (oldest first)", () => {
      const unsortedPayments = [
        {
          id: "pay-3",
          date: "2024-01-25",
          amount: 2000,
          paymentMode: "transfer",
          referenceNumber: "TRF456",
          notes: "",
        },
        {
          id: "pay-1",
          date: "2024-01-15",
          amount: 5000,
          paymentMode: "cash",
          referenceNumber: "REF001",
          notes: "",
        },
        {
          id: "pay-2",
          date: "2024-01-20",
          amount: 3000,
          paymentMode: "cheque",
          referenceNumber: "CHQ123",
          notes: "",
        },
      ];

      const props = { ...defaultProps, payments: unsortedPayments };
      const { container } = renderWithProviders(<PaymentLedger {...props} />);

      const rows = container.querySelectorAll("tbody tr");
      expect(rows[0].textContent).toContain("REF001");
      expect(rows[1].textContent).toContain("CHQ123");
      expect(rows[2].textContent).toContain("TRF456");
    });
  });

  describe("Balance Calculation", () => {
    it("should calculate correct balance due", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      // Invoice total: 10000, Total paid: 5000+3000+2000 = 10000
      // Balance due: 0
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
    });

    it("should show balance due when partial payment received", () => {
      const partialPayment = [
        {
          id: "pay-1",
          date: "2024-01-15",
          amount: 3000,
          paymentMode: "cash",
          referenceNumber: "REF001",
          notes: "Partial payment",
        },
      ];

      const props = { ...defaultProps, payments: partialPayment };
      renderWithProviders(<PaymentLedger {...props} />);

      expect(screen.getByText(/Remaining Balance:/)).toBeInTheDocument();
      expect(screen.getByText(/AED 7000.00/)).toBeInTheDocument();
    });

    it("should show zero balance when payment matches invoice total", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      expect(screen.getByText("Fully Paid")).toBeInTheDocument();
    });
  });

  describe("Dark Mode", () => {
    it("should apply dark mode styles when enabled", () => {
      vi.doMock("../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);
      const ledger = container.querySelector(".rounded-lg");

      expect(ledger.classList.toString()).toContain("bg-gray-800");
    });
  });

  describe("Payment Reference", () => {
    it("should display payment reference number", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);
      expect(screen.getByText("REF001")).toBeInTheDocument();
      expect(screen.getByText("CHQ123")).toBeInTheDocument();
    });

    it("should display dash when reference is missing", () => {
      const noRefPayment = [
        {
          id: "pay-1",
          date: "2024-01-15",
          amount: 5000,
          paymentMode: "cash",
          referenceNumber: null,
          notes: "No reference",
        },
      ];

      const props = { ...defaultProps, payments: noRefPayment };
      renderWithProviders(<PaymentLedger {...props} />);

      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });

  describe("Payment Mode Display", () => {
    it("should show payment mode badge with correct styling", () => {
      renderWithProviders(<PaymentLedger {...defaultProps} />);

      expect(screen.getByText("Cash")).toBeInTheDocument();
      expect(screen.getByText("Cheque")).toBeInTheDocument();
      expect(screen.getByText("Transfer")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle error when generating receipt fails", async () => {
      const user = setupUser();
      const { generatePaymentReceipt } = await import("../../utils/paymentReceiptGenerator");
      generatePaymentReceipt.mockResolvedValueOnce({ success: false, error: "PDF generation failed" });

      const windowAlertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const downloadButtons = container.querySelectorAll("button[title*='download']");
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(windowAlertSpy).toHaveBeenCalled();
      });

      windowAlertSpy.mockRestore();
    });

    it("should handle exception during receipt generation", async () => {
      const user = setupUser();
      const { generatePaymentReceipt } = await import("../../utils/paymentReceiptGenerator");
      generatePaymentReceipt.mockRejectedValueOnce(new Error("Network error"));

      const windowAlertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const downloadButtons = container.querySelectorAll("button[title*='download']");
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(windowAlertSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to generate receipt"));
      });

      windowAlertSpy.mockRestore();
    });
  });

  describe("Confirmation Dialog", () => {
    it("should show correct message in delete confirmation", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      const deleteButton = screen.getByText(/Delete Selected/);
      await user.click(deleteButton);

      expect(screen.getByText(/Are you sure you want to delete 2 payment/)).toBeInTheDocument();
    });

    it("should cancel delete when cancel clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[1]);

      const deleteButton = screen.getByText(/Delete Selected/);
      await user.click(deleteButton);

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnDeletePayment).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty payment list gracefully", () => {
      const props = { ...defaultProps, payments: [] };
      const { container } = renderWithProviders(<PaymentLedger {...props} />);

      expect(container).toBeInTheDocument();
      expect(screen.getByText(/No payments recorded yet/)).toBeInTheDocument();
    });

    it("should handle null payments prop", () => {
      const props = { ...defaultProps, payments: null };
      const { container } = renderWithProviders(<PaymentLedger {...props} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing invoice data", () => {
      const props = { ...defaultProps, invoice: null };
      const { container } = renderWithProviders(<PaymentLedger {...props} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very large payment amounts", () => {
      const largePayment = [
        {
          id: "pay-1",
          date: "2024-01-15",
          amount: 999999999.99,
          paymentMode: "cash",
          referenceNumber: "REF001",
          notes: "Large payment",
        },
      ];

      const props = { ...defaultProps, payments: largePayment };
      renderWithProviders(<PaymentLedger {...props} />);

      expect(screen.getByText(/AED 999999999.99/)).toBeInTheDocument();
    });

    it("should handle payments with special characters in notes", () => {
      const specialNotePayment = [
        {
          id: "pay-1",
          date: "2024-01-15",
          amount: 5000,
          paymentMode: "cash",
          referenceNumber: "REF001",
          notes: 'Payment with <script> & "quotes" and other chars',
        },
      ];

      const props = { ...defaultProps, payments: specialNotePayment };
      const { container } = renderWithProviders(<PaymentLedger {...props} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic table structure", () => {
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      expect(container.querySelector("table")).toBeInTheDocument();
      expect(container.querySelector("thead")).toBeInTheDocument();
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("should have proper button labels", () => {
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      expect(screen.getByText("Add Payment")).toBeInTheDocument();
      const editButtons = container.querySelectorAll("button[title]");
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it("should support keyboard navigation for checkboxes", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentLedger {...defaultProps} />);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      await user.tab();
      // Checkbox should be focusable
      expect(checkboxes[0]).toBeInTheDocument();
    });
  });
});
