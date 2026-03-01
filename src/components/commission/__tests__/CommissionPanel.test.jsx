import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import CommissionPanel from "../CommissionPanel";

// Mock dependencies
vi.mock("../../../services/notificationService", () => ({
  notificationService: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatDateDMY: vi.fn((d) => d),
  formatCurrency: vi.fn((v) => `AED ${v}`),
  formatDate: vi.fn((d) => d),
}));

vi.mock("../../ConfirmDialog", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-dialog">
      <span>{title}</span>
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" onClick={onCancel}>
        Cancel Confirm
      </button>
    </div>
  ),
}));

vi.mock("../../ui/badge", () => ({
  Badge: ({ children, className }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock("../../ui/button", () => ({
  Button: ({ children, onClick, disabled, ...rest }) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock("../../ui/card", () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }) => <p className={className}>{children}</p>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children, className }) => <h2 className={className}>{children}</h2>,
}));

vi.mock("../../ui/dialog", () => ({
  Dialog: ({ children, open }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <p>{children}</p>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h3>{children}</h3>,
}));

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("CommissionPanel", () => {
  const baseInvoice = {
    id: 1,
    commissionAmount: 500,
    commissionPercentage: 10,
    commissionStatus: "PENDING",
    salesPersonName: "John Doe",
    salesPersonId: 42,
  };

  it("renders commission details title", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText("Commission Details")).toBeInTheDocument();
  });

  it("displays commission amount", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText("AED 500.00")).toBeInTheDocument();
  });

  it("displays sales person name", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("displays PENDING status badge", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("shows Approve button for PENDING status", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText(/Approve for Payout/)).toBeInTheDocument();
  });

  it("shows Mark as Paid button for APPROVED status", () => {
    const invoice = { ...baseInvoice, commissionStatus: "APPROVED" };
    renderWithTheme(<CommissionPanel invoice={invoice} />);
    expect(screen.getByText(/Mark as Paid/)).toBeInTheDocument();
  });

  it("hides action buttons when readOnly", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} readOnly={true} />);
    expect(screen.queryByText(/Approve for Payout/)).not.toBeInTheDocument();
  });

  it("shows View History button", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText("View History")).toBeInTheDocument();
  });

  it("calls onViewAuditTrail when View History clicked", () => {
    const onView = vi.fn();
    renderWithTheme(<CommissionPanel invoice={baseInvoice} onViewAuditTrail={onView} />);
    screen.getByText("View History").click();
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it("displays commission workflow info box", () => {
    renderWithTheme(<CommissionPanel invoice={baseInvoice} />);
    expect(screen.getByText("Commission Workflow")).toBeInTheDocument();
  });
});
