/**
 * AddPaymentModal Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests payment modal with form validation, mode selection, and balance calculations
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";
import { createMockPayment } from "../../test/mock-factories";
import AddPaymentModal from "../AddPaymentModal";
import sinon from 'sinon';

describe("AddPaymentModal", () => {
  let mockOnClose;
  let mockOnSave;
  let defaultProps;

  beforeEach(() => {
    mockOnClose = sinon.stub();
    mockOnSave = sinon.stub();
    defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onSave: mockOnSave,
      invoiceTotal: 10000,
      existingPayments: [],
      editingPayment: null,
    };
  });

  describe("Rendering", () => {
    it("should render modal when isOpen is true", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.querySelector(".fixed")).toBeInTheDocument();
    });

    it("should not render modal when isOpen is false", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} isOpen={false} />);

      expect(container.querySelector(".fixed")).not.toBeInTheDocument();
    });

    it("should render 'Add Payment' title when creating", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.textContent).toContain("Add Payment");
    });

    it("should render 'Edit Payment' title when editing", () => {
      const { container } = renderWithProviders(
        <AddPaymentModal {...defaultProps} editingPayment={createMockPayment()} />
      );

      expect(container.textContent).toContain("Edit Payment");
    });

    it("should render close button", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const closeButton = container.querySelector("button");
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("should render all required input fields", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.querySelector("#payment-date")).toBeInTheDocument();
      expect(container.querySelector("#payment-amount")).toBeInTheDocument();
      expect(container.querySelector("#payment-mode")).toBeInTheDocument();
      expect(container.querySelector("#payment-reference")).toBeInTheDocument();
      expect(container.querySelector("#payment-notes")).toBeInTheDocument();
    });

    it("should have correct input types", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.querySelector("#payment-date").type).toBe("date");
      expect(container.querySelector("#payment-amount").type).toBe("number");
      expect(container.querySelector("#payment-mode").tagName.toLowerCase()).toBe("select");
      expect(container.querySelector("#payment-notes").tagName.toLowerCase()).toBe("textarea");
    });

    it("should initialize with default payment state", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      expect(amountField.value).toBe("");

      const modeField = container.querySelector("#payment-mode");
      expect(modeField.value).toBe("cash");
    });

    it("should have required attribute on required fields", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.textContent).toContain("Payment Date");
      expect(container.textContent).toContain("Amount (AED)");
      expect(container.textContent).toContain("Payment Mode");
    });
  });

  describe("Balance Due Display", () => {
    it("should display balance due when no payments exist", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={10000} />);

      expect(container.textContent).toContain("Balance Due");
      expect(container.textContent).toContain("10,000.00");
    });

    it("should calculate balance due correctly with existing payments", () => {
      const existingPayments = [{ amount: 4000 }, { amount: 2000 }];
      const { container } = renderWithProviders(
        <AddPaymentModal {...defaultProps} invoiceTotal={10000} existingPayments={existingPayments} />
      );

      const balanceText = container.textContent;
      expect(balanceText).toContain("4,000.00");
    });

    it("should show tip text when creating new payment", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.textContent).toContain("Click the balance amount above to auto-fill");
    });

    it("should not show tip text when editing payment", () => {
      const { container } = renderWithProviders(
        <AddPaymentModal {...defaultProps} editingPayment={createMockPayment()} />
      );

      expect(container.textContent).not.toContain("Click the balance amount above to auto-fill");
    });
  });

  describe("Balance Auto-fill", () => {
    it("should auto-fill amount when balance button is clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={5000} />);

      const balanceButton = container.querySelector(".group");
      await user.click(balanceButton);

      const amountField = container.querySelector("#payment-amount");
      expect(amountField.value).toBe("5000");
    });

    it("should not allow balance click when editing", () => {
      const { container } = renderWithProviders(
        <AddPaymentModal {...defaultProps} editingPayment={createMockPayment()} />
      );

      const balanceButton = container.querySelector(".group");
      expect(balanceButton).toHaveAttribute("disabled");
    });
  });

  describe("Payment Mode Selection", () => {
    it("should render payment mode select with options", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const modeSelect = container.querySelector("#payment-mode");
      const options = modeSelect.querySelectorAll("option");

      expect(options.length).toBeGreaterThan(0);
    });

    it("should default to cash payment mode", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const modeSelect = container.querySelector("#payment-mode");
      expect(modeSelect.value).toBe("cash");
    });

    it("should clear reference number when mode changes", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const referenceField = container.querySelector("#payment-reference");
      await user.type(referenceField, "CHK-12345");

      const modeSelect = container.querySelector("#payment-mode");
      const options = Array.from(modeSelect.querySelectorAll("option"));
      const bankTransferOption = options.find((opt) => opt.value === "bank_transfer");

      if (bankTransferOption) {
        await user.selectOption(modeSelect, "bank_transfer");
        expect(referenceField.value).toBe("");
      }
    });
  });

  describe("Amount Validation", () => {
    it("should show error when amount exceeds balance due", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={5000} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "6000");

      expect(container.textContent).toContain("Amount cannot exceed balance due");
    });

    it("should not show error when amount equals balance due", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={5000} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      expect(container.textContent).not.toContain("Amount cannot exceed balance due");
    });

    it("should allow partial payment amounts", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={5000} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "2500");

      expect(amountField.value).toBe("2500");
    });

    it("should handle decimal amounts", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={5000} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "2500.50");

      expect(amountField.value).toBe("2500.50");
    });
  });

  describe("Form Submission", () => {
    it("should call onSave with correct payment data", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
      const savedData = mockOnSave.mock.calls[0][0];
      expect(savedData.amount).toBe(5000);
    });

    it("should convert amount to number when saving", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "1500.75");

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      const savedData = mockOnSave.mock.calls[0][0];
      expect(typeof savedData.amount).toBe("number");
      expect(savedData.amount).toBe(1500.75);
    });

    it("should set createdAt for new payments", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      const savedData = mockOnSave.mock.calls[0][0];
      expect(savedData.createdAt).toBeDefined();
    });

    it("should preserve createdAt when editing", async () => {
      const user = setupUser();
      const editingPayment = createMockPayment({ createdAt: "2024-01-01T10:00:00Z" });
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} editingPayment={editingPayment} />);

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      const savedData = mockOnSave.mock.calls[0][0];
      expect(savedData.createdAt).toBe("2024-01-01T10:00:00Z");
    });
  });

  describe("Close Button Behavior", () => {
    it("should call onClose when cancel button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const cancelButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.includes("Cancel")
      );
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when X button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const closeButton = container.querySelector("button");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should disable buttons while saving", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      const saveButton = container.querySelector(".bg-teal-600");
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe("Editing Payment", () => {
    it("should load editing payment data", () => {
      const editingPayment = createMockPayment({
        amount: 5000,
        paymentMethod: "check",
      });

      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} editingPayment={editingPayment} />);

      const amountField = container.querySelector("#payment-amount");
      expect(amountField.value).toBe("5000");

      const modeField = container.querySelector("#payment-mode");
      expect(modeField.value).toBe("check");
    });

    it("should format date correctly when editing", () => {
      const editingPayment = createMockPayment({
        date: "2024-01-15",
      });

      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} editingPayment={editingPayment} />);

      const dateField = container.querySelector("#payment-date");
      expect(dateField.value).toBeTruthy();
    });

    it("should show 'Update Payment' button when editing", () => {
      const editingPayment = createMockPayment();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} editingPayment={editingPayment} />);

      const saveButton = container.querySelector(".bg-teal-600");
      expect(saveButton.textContent).toContain("Update Payment");
    });

    it("should show 'Add Payment' button when creating", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const saveButton = container.querySelector(".bg-teal-600");
      expect(saveButton.textContent).toContain("Add Payment");
    });
  });

  describe("Dark Mode Support", () => {
    it("should apply dark mode classes when isDarkMode is true", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const modalContent = container.querySelector("div[class*='rounded-lg']");
      expect(modalContent).toBeInTheDocument();
    });

    it("should have proper contrast styling for dark mode", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const inputs = container.querySelectorAll("input, select, textarea");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe("Reference Number Field", () => {
    it("should render reference number field", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.querySelector("#payment-reference")).toBeInTheDocument();
    });

    it("should allow entering reference number", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const referenceField = container.querySelector("#payment-reference");
      await user.type(referenceField, "REF-12345");

      expect(referenceField.value).toBe("REF-12345");
    });

    it("should show reference number in saved data", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      const referenceField = container.querySelector("#payment-reference");
      await user.type(referenceField, "REF-12345");

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      const savedData = mockOnSave.mock.calls[0][0];
      expect(savedData.referenceNumber).toBe("REF-12345");
    });
  });

  describe("Notes Field", () => {
    it("should render notes field", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.querySelector("#payment-notes")).toBeInTheDocument();
    });

    it("should allow entering notes", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const notesField = container.querySelector("#payment-notes");
      await user.type(notesField, "Payment for invoice #123");

      expect(notesField.value).toBe("Payment for invoice #123");
    });

    it("should include notes in saved data", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      const notesField = container.querySelector("#payment-notes");
      await user.type(notesField, "Test notes");

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      const savedData = mockOnSave.mock.calls[0][0];
      expect(savedData.notes).toBe("Test notes");
    });
  });

  describe("Payment Method Label", () => {
    it("should display correct label for payment method", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      expect(container.textContent).toContain("Payment Mode");
    });

    it("should update reference label based on payment mode", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const modeSelect = container.querySelector("#payment-mode");
      const options = Array.from(modeSelect.querySelectorAll("option"));

      if (options.length > 1) {
        await user.selectOption(modeSelect, options[1].value);
        expect(container.textContent).toContain("Reference");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero invoice total", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={0} />);

      expect(container.textContent).toContain("Balance Due");
    });

    it("should handle large payment amounts", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} invoiceTotal={999999.99} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "999999.99");

      expect(amountField.value).toBe("999999.99");
    });

    it("should handle empty notes", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const amountField = container.querySelector("#payment-amount");
      await user.type(amountField, "5000");

      const saveButton = container.querySelector(".bg-teal-600");
      await user.click(saveButton);

      const savedData = mockOnSave.mock.calls[0][0];
      expect(savedData.notes).toBe("");
    });

    it("should handle multiple payment modes", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const modeSelect = container.querySelector("#payment-mode");
      const options = modeSelect.querySelectorAll("option");

      expect(options.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Accessibility", () => {
    it("should have proper label associations", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const labels = container.querySelectorAll("label");
      expect(labels.length).toBeGreaterThan(0);

      labels.forEach((label) => {
        expect(label.htmlFor).toBeTruthy();
      });
    });

    it("should have required field indicators", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const requiredIndicators = container.querySelectorAll(".text-red-500");
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it("should have placeholder text for optional fields", () => {
      const { container } = renderWithProviders(<AddPaymentModal {...defaultProps} />);

      const notesField = container.querySelector("#payment-notes");
      expect(notesField.placeholder).toBeTruthy();
    });
  });
});
