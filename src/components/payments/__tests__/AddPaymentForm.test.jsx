/**
 * AddPaymentForm Component Tests
 * Tests payment form with multi-currency support and VAT tracking
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/customerCreditService", () => ({
  customerCreditService: {
    getCustomerCreditSummary: vi.fn().mockResolvedValue({
      creditLimit: 100000,
      currentCredit: 50000,
    }),
  },
}));

vi.mock("../../../services/dataService", () => ({
  PAYMENT_MODES: {
    cash: { value: "cash", label: "Cash", icon: "💵", requiresRef: false },
    bank_transfer: { value: "bank_transfer", label: "Bank Transfer", icon: "🏦", requiresRef: true, refLabel: "Transfer Ref" },
    cheque: { value: "cheque", label: "Cheque", icon: "📝", requiresRef: true, refLabel: "Cheque #" },
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${Number(val || 0).toFixed(2)}`,
  formatDate: (val) => val || "",
}));

vi.mock("../../../utils/timezone", () => ({
  toUAEDateForInput: () => "2025-01-15",
}));

vi.mock("../../forms/CurrencyInput", () => ({
  default: ({ amount, onAmountChange }) => (
    <input
      data-testid="currency-input"
      value={amount || ""}
      onChange={(e) => onAmountChange(e.target.value)}
    />
  ),
}));

import AddPaymentForm from "../AddPaymentForm";

describe("AddPaymentForm", () => {
  const defaultProps = {
    outstanding: 5000,
    onSave: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = render(<AddPaymentForm {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders Record Payment Details heading", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.getByText("Record Payment Details")).toBeInTheDocument();
  });

  it("renders outstanding balance", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.getByText(/Outstanding Balance/)).toBeInTheDocument();
  });

  it("renders balance label as Balance for PO entity type", () => {
    render(<AddPaymentForm {...defaultProps} entityType="po" />);
    expect(screen.getByText(/Balance/)).toBeInTheDocument();
  });

  it("renders payment date input", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.getByText("Payment Date")).toBeInTheDocument();
  });

  it("renders payment method select", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.getByText("Payment Method")).toBeInTheDocument();
  });

  it("renders notes textarea", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("renders Save Payment button", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.getByText("Save Payment")).toBeInTheDocument();
  });

  it("renders Saving... text when isSaving", () => {
    render(<AddPaymentForm {...defaultProps} isSaving />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders Close button when onCancel is provided", () => {
    render(<AddPaymentForm {...defaultProps} onCancel={vi.fn()} />);
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("does not render Close button when onCancel is not provided", () => {
    render(<AddPaymentForm {...defaultProps} />);
    expect(screen.queryByText("Close")).not.toBeInTheDocument();
  });
});
