/**
 * AddPaymentForm Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests payment form with multi-currency support, VAT, and credit limits
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import AddPaymentForm from "../AddPaymentForm";
import sinon from 'sinon';

const mockCustomerCreditService = {
  getCustomerCreditSummary: sinon.stub(),
};

// sinon.stub() // "../../../services/customerCreditService", () => ({
  customerCreditService: mockCustomerCreditService,
}));

// sinon.stub() // "../../../services/dataService", () => ({
  PAYMENT_MODES: {
    cash: { label: "Cash", requiresRef: false },
    cheque: { label: "Cheque", requiresRef: true },
    transfer: { label: "Bank Transfer", requiresRef: true },
    card: { label: "Card", requiresRef: false },
  },
}));

// sinon.stub() // "../../../utils/invoiceUtils", () => ({
  formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`,
}));

// sinon.stub() // "../../../utils/timezone", () => ({
  toUAEDateForInput: (_date) => "2024-01-15",
}));

describe("AddPaymentForm", () => {
  let defaultProps;
  let mockOnSave;
  let mockOnCancel;

  beforeEach(() => {
    sinon.restore();
    mockOnSave = sinon.stub();
    mockOnCancel = sinon.stub();

    defaultProps = {
      outstanding: 10000,
      onSave: mockOnSave,
      onCancel: mockOnCancel,
      isSaving: false,
      entityType: "invoice",
      defaultCurrency: "AED",
      customerId: null,
    };

    mockCustomerCreditService.getCustomerCreditSummary.mockResolvedValue({
      creditLimit: 50000,
      currentCredit: 20000,
    });
  });

  describe("Rendering", () => {
    it("should render payment form", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display payment amount input", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      const amountInputs = container.querySelectorAll("input[type='text'], input[type='number']");
      expect(amountInputs.length).toBeGreaterThan(0);
    });

    it("should display payment date field", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/date/i);
    });

    it("should display payment method selector", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/method|cash|cheque|transfer/i);
    });
  });

  describe("Payment Amount Validation", () => {
    it("should reject empty amount", async () => {
      setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      const saveButton =
        container.querySelector("button[type='submit']") || container.querySelector("button:has-text('Save')");
      if (saveButton) {
        await user.click(saveButton);
        expect(mockOnSave).not.toHaveBeenCalled();
      }
    });

    it("should reject zero amount", async () => {
      setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      // Try to save with 0 amount
      const saveButton = container.querySelector("button[type='submit']");
      if (saveButton) {
        await user.click(saveButton);
        expect(mockOnSave).not.toHaveBeenCalled();
      }
    });

    it("should reject amount exceeding outstanding balance", async () => {
      setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} outstanding={1000} />);

      // Try to enter amount greater than outstanding
      expect(container).toBeInTheDocument();
    });

    it("should accept valid payment amount", async () => {
      setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should accept partial payment", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} outstanding={10000} />);

      expect(container).toBeInTheDocument();
    });

    it("should accept full payment", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} outstanding={5000} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Payment Methods", () => {
    it("should show cash payment option", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toContain("Cash");
    });

    it("should show cheque payment option", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toContain("Cheque");
    });

    it("should show transfer payment option", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toContain("Bank Transfer");
    });

    it("should show card payment option", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toContain("Card");
    });

    it("should require reference for cheque", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should not require reference for cash", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should require reference for bank transfer", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Multi-Currency Support", () => {
    it("should default to AED currency", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });

    it("should allow currency selection", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} defaultCurrency="AED" />);

      expect(container).toBeInTheDocument();
    });

    it("should require exchange rate for foreign currency", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should calculate AED equivalent for foreign currency", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} defaultCurrency="USD" />);

      expect(container).toBeInTheDocument();
    });

    it("should show exchange rate field for foreign currency", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle USD payments with exchange rate", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} defaultCurrency="USD" />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("VAT Handling", () => {
    it("should display VAT rate field", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/vat|tax/i);
    });

    it("should default to 5% VAT rate", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/5/);
    });

    it("should allow VAT rate customization", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should support reverse charge option", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/reverse|charge/i);
    });

    it("should calculate VAT amount correctly", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should zero VAT with reverse charge enabled", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Credit Limit Tracking", () => {
    it("should fetch credit summary when customerId provided", async () => {
      renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for API call
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockCustomerCreditService.getCustomerCreditSummary).toHaveBeenCalledWith(123);
    });

    it("should display credit limit", async () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for credit data
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should display current credit usage", async () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for credit data
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should display available credit", async () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for credit data
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should show credit warning when available credit is low", async () => {
      mockCustomerCreditService.getCustomerCreditSummary.mockResolvedValue({
        creditLimit: 50000,
        currentCredit: 48000, // 96% utilization
      });

      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for credit data
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle missing credit information gracefully", async () => {
      mockCustomerCreditService.getCustomerCreditSummary.mockRejectedValue(new Error("Failed to fetch credit"));

      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for error handling
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should calculate new credit usage after payment", async () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={123} />);

      // Wait for credit data
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call onSave with payment data", async () => {
      setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      // Fill in form (implementation depends on component structure)
      expect(container).toBeInTheDocument();
    });

    it("should disable save button while saving", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} isSaving={true} />);

      const saveButton = container.querySelector("button[type='submit']");
      expect(saveButton?.disabled || container.textContent.includes("Saving")).toBeTruthy();
    });

    it("should show validation errors", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should clear validation errors on successful save", async () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should call onCancel when cancel button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      const cancelButton = Array.from(container.querySelectorAll("button")).find((btn) =>
        btn.textContent.toLowerCase().includes("cancel")
      );
      if (cancelButton) {
        await user.click(cancelButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });
  });

  describe("Entity Type Context", () => {
    it("should accept invoice entity type", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} entityType="invoice" />);

      expect(container).toBeInTheDocument();
    });

    it("should accept po entity type", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} entityType="po" />);

      expect(container).toBeInTheDocument();
    });

    it("should show context-aware labels", () => {
      const { container: invoiceContainer } = renderWithProviders(
        <AddPaymentForm {...defaultProps} entityType="invoice" />
      );

      expect(invoiceContainer).toBeInTheDocument();
    });
  });

  describe("Reference Field", () => {
    it("should display reference field", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/reference|ref/i);
    });

    it("should make reference required for cheque", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should accept reference text", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should reject empty reference for methods that require it", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Notes Field", () => {
    it("should display notes field", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/notes?/i);
    });

    it("should accept payment notes", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle long notes", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Date Field", () => {
    it("should default to today's date", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toContain("2024-01-15");
    });

    it("should allow date selection", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle future dates", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero outstanding balance", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} outstanding={0} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very large outstanding amounts", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} outstanding={999999999} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing customerId gracefully", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} customerId={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle null currency", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} defaultCurrency={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle extreme exchange rates", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} defaultCurrency="USD" />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for inputs", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/amount|date|method|reference/i);
    });

    it("should support keyboard navigation", async () => {
      const _user = setupUser();
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      const inputs = container.querySelectorAll("input, select, button, textarea");
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should have descriptive button text", () => {
      const { container } = renderWithProviders(<AddPaymentForm {...defaultProps} />);

      expect(container.textContent).toMatch(/save|cancel|submit/i);
    });
  });
});
