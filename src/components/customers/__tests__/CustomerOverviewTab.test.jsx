import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${parseFloat(val || 0).toFixed(2)}`,
  formatDateDMY: (d) => d || "N/A",
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Calendar: (props) => <svg {...props} />,
  CheckCircle: (props) => <svg {...props} />,
  Clock: (props) => <svg {...props} />,
  CreditCard: (props) => <svg {...props} />,
  FileText: (props) => <svg {...props} />,
  Mail: (props) => <svg {...props} />,
  MapPin: (props) => <svg {...props} />,
  Phone: (props) => <svg {...props} />,
  TrendingUp: (props) => <svg {...props} />,
}));

import CustomerOverviewTab from "../tabs/CustomerOverviewTab";

const customer = {
  name: "ABC Trading LLC",
  code: "CUST-001",
  email: "info@abc.com",
  phone: "+971501234567",
  status: "active",
  paymentTermsDays: 30,
  creditLimit: 100000,
  creditUsed: 45000,
  agingCurrent: 10000,
  aging1To30: 5000,
  aging31To60: 2000,
  aging61To90: 1000,
  aging90Plus: 500,
  creditGrade: "B",
  creditScore: 75,
};

describe("CustomerOverviewTab", () => {
  it("shows no data message when customer is null", () => {
    render(<CustomerOverviewTab customer={null} />);
    expect(screen.getByText("No customer data available")).toBeInTheDocument();
  });

  it("renders customer name", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("ABC Trading LLC")).toBeInTheDocument();
  });

  it("renders customer code", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("CUST-001")).toBeInTheDocument();
  });

  it("renders active status badge", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders email link", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("info@abc.com")).toBeInTheDocument();
  });

  it("renders phone number", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("+971501234567")).toBeInTheDocument();
  });

  it("renders payment terms", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("Net 30 days")).toBeInTheDocument();
  });

  it("renders credit summary section", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("Credit Summary")).toBeInTheDocument();
    expect(screen.getByText("Credit Utilization")).toBeInTheDocument();
  });

  it("renders AR summary section with aging buckets", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("AR Summary")).toBeInTheDocument();
    expect(screen.getByText("1-30 days")).toBeInTheDocument();
    expect(screen.getByText("31-60 days")).toBeInTheDocument();
    expect(screen.getByText("61-90 days")).toBeInTheDocument();
    // "90+ days" may appear multiple times (aging bucket + oldest invoice bucket label)
    const ninetyPlusLabels = screen.getAllByText("90+ days");
    expect(ninetyPlusLabels.length).toBeGreaterThan(0);
  });

  it("shows 90+ days warning when aging90Plus > 0", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("Customer has invoices over 90 days old")).toBeInTheDocument();
  });

  it("renders credit grade badge", () => {
    render(<CustomerOverviewTab customer={customer} />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
