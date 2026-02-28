import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// CustomerCreditPanel uses useContext(ThemeContext) directly, so we provide it via Provider
vi.mock("../../../utils/invoiceUtils", () => ({
  formatDateDMY: (d) => d || "N/A",
}));

vi.mock("../../ui/badge", () => ({
  Badge: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../ui/button", () => ({
  Button: ({ children, onClick, disabled, size, variant, className, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled} className={className} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock("../../ui/card", () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }) => <p className={className}>{children}</p>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children, className }) => <h3 className={className}>{children}</h3>,
}));

vi.mock("../../ui/dialog", () => ({
  Dialog: ({ children, open }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <p>{children}</p>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h3>{children}</h3>,
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <svg {...props} />,
  Calendar: (props) => <svg {...props} />,
  DollarSign: (props) => <svg {...props} />,
  Edit3: (props) => <svg {...props} />,
  Shield: (props) => <svg {...props} />,
  TrendingUp: (props) => <svg {...props} />,
}));

// Import ThemeContext so we can wrap with Provider
import { ThemeContext } from "../../../contexts/ThemeContext";
import CustomerCreditPanel from "../CustomerCreditPanel";

const customer = {
  id: 1,
  name: "ABC Corp",
  creditLimit: 100000,
  creditUsed: 45000,
  creditAvailable: 55000,
  creditGrade: "B",
  dsoDays: 25,
  creditScore: 75,
  lastPaymentDate: "2025-01-15",
  agingCurrent: 10000,
  aging1To30: 5000,
  aging31To60: 2000,
  aging61To90: 1000,
  aging90_plus: 500,
};

function renderWithTheme(ui) {
  return render(<ThemeContext.Provider value={{ isDarkMode: false }}>{ui}</ThemeContext.Provider>);
}

describe("CustomerCreditPanel", () => {
  it("renders credit management title", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("Credit Management")).toBeInTheDocument();
  });

  it("renders credit grade badge", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("Grade B")).toBeInTheDocument();
  });

  it("renders credit utilization percentage", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("45.0%")).toBeInTheDocument();
  });

  it("renders credit details grid - Limit, Used, Available", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("Limit")).toBeInTheDocument();
    expect(screen.getByText("Used")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("renders DSO days", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("25 days")).toBeInTheDocument();
  });

  it("renders credit score", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("75 / 100")).toBeInTheDocument();
  });

  it("renders aging breakdown section", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("Aging Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Current (0 days)")).toBeInTheDocument();
    expect(screen.getByText("1-30 days overdue")).toBeInTheDocument();
  });

  it("shows order blocked alert for grade D", () => {
    const blockedCustomer = { ...customer, creditGrade: "D" };
    renderWithTheme(<CustomerCreditPanel customer={blockedCustomer} />);
    expect(screen.getByText("Order Blocked")).toBeInTheDocument();
  });

  it("hides adjust credit limit button when readOnly", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} readOnly />);
    expect(screen.queryByText("Adjust Credit Limit")).not.toBeInTheDocument();
  });

  it("renders adjust credit limit button when not readOnly", () => {
    renderWithTheme(<CustomerCreditPanel customer={customer} />);
    expect(screen.getByText("Adjust Credit Limit")).toBeInTheDocument();
  });
});
