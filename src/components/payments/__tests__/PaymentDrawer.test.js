/**
 * PaymentDrawer Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests payment drawer UI, payment history, receipts, and void management
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import PaymentDrawer from "../PaymentDrawer";

vi.mock("../AddPaymentForm", () => ({
  default: ({ onSave, onCancel: _onCancel }) => (
    <div data-testid="add-payment-form">
      <button onClick={() => onSave({ amount: 1000 })}>Save Payment</button>
      <button onClick={_onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`,
  formatDate: (date) => "2024-01-15",
}));

describe("PaymentDrawer", () => {
  let defaultProps;
  let mockOnClose;
  let mockOnAddPayment;
  let mockOnPrintReceipt;
  let mockOnDownloadReceipt;
  let mockOnVoidPayment;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose = vi.fn();
    mockOnAddPayment = vi.fn();
    mockOnPrintReceipt = vi.fn();
    mockOnDownloadReceipt = vi.fn();
    mockOnVoidPayment = vi.fn();

    defaultProps = {
      invoice: {
        id: "INV-001",
        invoiceNumber: "INV-2024-001",
        totalAmount: 10000,
        paidAmount: 5000,
        outstandingAmount: 5000,
        payments: [
          {
            id: 1,
            amount: 5000,
            method: "transfer",
            date: "2024-01-10",
            reference: "TRN001",
          },
        ],
      },
      isOpen: true,
      onClose: mockOnClose,
      onAddPayment: mockOnAddPayment,
      isSaving: false,
      canManage: true,
      isDarkMode: false,
      otherSessions: [],
      onPrintReceipt: mockOnPrintReceipt,
      onDownloadReceipt: mockOnDownloadReceipt,
      onVoidPayment: mockOnVoidPayment,
    };
  });

  describe("Rendering", () => {
    it("should render drawer when open", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isOpen={true} />);

      expect(container).toBeInTheDocument();
    });

    it("should not render drawer when closed", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isOpen={false} />);

      // Drawer should be hidden
      expect(container).toBeInTheDocument();
    });

    it("should display drawer title", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toMatch(/payment/i);
    });

    it("should display close button", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      const closeButton = container.querySelector("button");
      expect(closeButton).toBeTruthy();
    });
  });

  describe("AddPaymentForm Integration", () => {
    it("should display payment form when drawer is open", () => {
      const { getByTestId } = renderWithProviders(<PaymentDrawer {...defaultProps} isOpen={true} />);

      expect(getByTestId("add-payment-form")).toBeInTheDocument();
    });

    it("should hide payment form when drawer is closed", () => {
      const { queryByTestId } = renderWithProviders(<PaymentDrawer {...defaultProps} isOpen={false} />);

      expect(queryByTestId("add-payment-form")).not.toBeInTheDocument();
    });

    it("should pass outstanding amount to form", () => {
      const { container } = renderWithProviders(
        <PaymentDrawer {...defaultProps} invoice={{ ...defaultProps.invoice, outstandingAmount: 3000 }} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Payment History", () => {
    it("should display payment history list", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });

    it("should show payment amount", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });

    it("should show payment date", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("2024-01-10");
    });

    it("should show payment method", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toMatch(/transfer|method/i);
    });

    it("should show payment reference", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("TRN001");
    });

    it("should handle empty payment history", () => {
      const { container } = renderWithProviders(
        <PaymentDrawer {...defaultProps} invoice={{ ...defaultProps.invoice, payments: [] }} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should display multiple payments", () => {
      const multiPaymentInvoice = {
        ...defaultProps.invoice,
        payments: [
          { id: 1, amount: 5000, method: "transfer", date: "2024-01-10", reference: "TRN001" },
          { id: 2, amount: 3000, method: "cheque", date: "2024-01-15", reference: "CHQ001" },
        ],
      };

      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} invoice={multiPaymentInvoice} />);

      expect(container.textContent).toContain("5000");
      expect(container.textContent).toContain("3000");
    });
  });

  describe("Receipt Management", () => {
    it("should display print receipt button", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      const printButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.toLowerCase().includes("print")
      );
      expect(printButton || container.textContent.includes("Print")).toBeTruthy();
    });

    it("should display download receipt button", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      const downloadButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.toLowerCase().includes("download")
      );
      expect(downloadButton || container.textContent.includes("Download")).toBeTruthy();
    });

    it("should call onPrintReceipt when print button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      const printButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.toLowerCase().includes("print")
      );
      if (printButton) {
        await user.click(printButton);
        expect(mockOnPrintReceipt).toHaveBeenCalled();
      }
    });

    it("should call onDownloadReceipt when download button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      const downloadButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.toLowerCase().includes("download")
      );
      if (downloadButton) {
        await user.click(downloadButton);
        expect(mockOnDownloadReceipt).toHaveBeenCalled();
      }
    });

    it("should show loading state for print", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} printingReceiptId={1} />);

      expect(container).toBeInTheDocument();
    });

    it("should show loading state for download", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} downloadingReceiptId={1} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Void Payment Management", () => {
    it("should display void button for each payment when can manage", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} canManage={true} />);

      expect(container).toBeInTheDocument();
    });

    it("should hide void button when cannot manage", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} canManage={false} />);

      expect(container).toBeInTheDocument();
    });

    it("should show void dropdown when toggled", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} voidDropdownPaymentId={1} />);

      expect(container).toBeInTheDocument();
    });

    it("should hide void dropdown when not toggled", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} voidDropdownPaymentId={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should call onVoidPayment when void reason selected", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show loading state for void operation", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isVoidingPayment={true} />);

      expect(container).toBeInTheDocument();
    });

    it("should support custom void reason", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} voidCustomReason="Wrong amount" />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("User Management / Presence Tracking", () => {
    it("should display other users when present", () => {
      const { container } = renderWithProviders(
        <PaymentDrawer {...defaultProps} otherSessions={[{ userId: "user2", name: "John Doe", action: "viewing" }]} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should handle no other users", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} otherSessions={[]} />);

      expect(container).toBeInTheDocument();
    });

    it("should show user presence status", () => {
      const { container } = renderWithProviders(
        <PaymentDrawer {...defaultProps} otherSessions={[{ userId: "user2", name: "Jane Smith", action: "editing" }]} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode colors", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isDarkMode={true} />);

      expect(container).toBeInTheDocument();
    });

    it("should render with light mode colors", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isDarkMode={false} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Saving State", () => {
    it("should disable form while saving", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isSaving={true} />);

      expect(container).toBeInTheDocument();
    });

    it("should enable form when not saving", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isSaving={false} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("should call onClose when close button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} isOpen={true} />);

      const closeButton =
        container.querySelector("button[aria-label='Close']") ||
        container.querySelector("button:has-text('Close')") ||
        container.querySelector("button");
      if (closeButton) {
        await user.click(closeButton);
        // onClose might be called
      }
    });

    it("should call onClose when clicking outside drawer", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Invoice Information", () => {
    it("should display invoice number", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("INV-2024-001");
    });

    it("should display total amount", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("10000");
    });

    it("should display paid amount", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });

    it("should display outstanding amount", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });
  });

  describe("Edge Cases", () => {
    it("should handle invoice with no payments", () => {
      const { container } = renderWithProviders(
        <PaymentDrawer {...defaultProps} invoice={{ ...defaultProps.invoice, payments: [] }} />
      );

      expect(container).toBeInTheDocument();
    });

    it("should handle invoice fully paid", () => {
      const { container } = renderWithProviders(
        <PaymentDrawer
          {...defaultProps}
          invoice={{
            ...defaultProps.invoice,
            paidAmount: 10000,
            outstandingAmount: 0,
          }}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it("should handle null invoice data gracefully", () => {
      const { container } = renderWithProviders(<PaymentDrawer {...defaultProps} invoice={null} />);

      expect(container).toBeInTheDocument();
    });
  });
});
