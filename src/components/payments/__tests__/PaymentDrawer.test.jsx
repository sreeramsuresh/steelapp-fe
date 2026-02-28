/**
 * PaymentDrawer Component Tests
 * Tests unified payment drawer with payment history, void, and receipt management
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${Number(val || 0).toFixed(2)}`,
  formatDate: (val) => val || "N/A",
}));

vi.mock("../../../utils/timezone", () => ({
  toUAEDateForInput: () => "2025-01-15",
}));

vi.mock("../../../services/customerCreditService", () => ({
  customerCreditService: {
    getCustomerCreditSummary: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../../services/dataService", () => ({
  PAYMENT_MODES: {
    cash: { value: "cash", label: "Cash", icon: "💵", requiresRef: false },
  },
}));

vi.mock("../../forms/CurrencyInput", () => ({
  default: () => <div data-testid="currency-input" />,
}));

vi.mock("../../finance/paymentCorrectionConfig", () => ({
  default: { title: "Payment Corrections" },
}));

vi.mock("../../posted-document-framework", () => ({
  CorrectionHelpModal: ({ open }) => open ? <div data-testid="correction-modal" /> : null,
}));

vi.mock("../AddPaymentForm", () => ({
  default: () => <div data-testid="add-payment-form" />,
}));

import PaymentDrawer from "../PaymentDrawer";

describe("PaymentDrawer", () => {
  const mockInvoice = {
    invoiceNo: "INV-001",
    customer: { name: "Test Customer" },
    invoiceAmount: 10000,
    received: 3000,
    outstanding: 7000,
    invoiceDate: "2025-01-01",
    dueDate: "2025-02-01",
    payments: [
      {
        id: 1,
        paymentDate: "2025-01-15",
        method: "cash",
        amount: 3000,
        referenceNo: "REF-001",
      },
    ],
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <PaymentDrawer invoice={mockInvoice} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when invoice is null", () => {
    const { container } = render(
      <PaymentDrawer invoice={null} isOpen={true} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders drawer when open with invoice", () => {
    render(
      <PaymentDrawer
        invoice={mockInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByTestId("payment-drawer")).toBeInTheDocument();
  });

  it("renders invoice number in header", () => {
    render(
      <PaymentDrawer
        invoice={mockInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByText("INV-001")).toBeInTheDocument();
  });

  it("renders customer name", () => {
    render(
      <PaymentDrawer
        invoice={mockInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByText("Test Customer")).toBeInTheDocument();
  });

  it("renders Invoice Summary section", () => {
    render(
      <PaymentDrawer
        invoice={mockInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByText("Invoice Summary")).toBeInTheDocument();
  });

  it("renders Payment History section", () => {
    render(
      <PaymentDrawer
        invoice={mockInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByText("Payment History")).toBeInTheDocument();
  });

  it("renders payment status badge", () => {
    render(
      <PaymentDrawer
        invoice={mockInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByText("Partially Paid")).toBeInTheDocument();
  });

  it("shows Fully Paid status when outstanding is 0", () => {
    const paidInvoice = { ...mockInvoice, outstanding: 0, received: 10000 };
    render(
      <PaymentDrawer
        invoice={paidInvoice}
        isOpen={true}
        onClose={vi.fn()}
        onAddPayment={vi.fn()}
        PAYMENT_MODES={{ cash: { label: "Cash", icon: "💵" } }}
      />
    );
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Invoice Fully Paid")).toBeInTheDocument();
  });
});
