import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/customerCreditService", () => ({
  customerCreditService: {
    getOverLimitCustomers: vi.fn(),
    getHighRiskCustomers: vi.fn(),
    updateCreditLimit: vi.fn(),
    performCreditReview: vi.fn(),
  },
}));

vi.mock("../../ConfirmDialog", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-dialog">
      <p>{title}</p>
      <button type="button" onClick={onConfirm}>Yes</button>
      <button type="button" onClick={onCancel}>No</button>
    </div>
  ),
}));

vi.mock("../../ui/badge", () => ({
  Badge: ({ children, className }) => <span className={className}>{children}</span>,
}));

vi.mock("../../ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock("../../ui/card", () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children }) => <div>{children}</div>,
  CardDescription: ({ children }) => <p>{children}</p>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardTitle: ({ children, className }) => <h3 className={className}>{children}</h3>,
}));

vi.mock("../../ui/dialog", () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <p>{children}</p>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h3>{children}</h3>,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Edit3: (props) => <svg {...props} />,
  RefreshCw: (props) => <svg {...props} />,
  TrendingDown: (props) => <svg {...props} />,
}));

import { customerCreditService } from "../../../services/customerCreditService";
import CreditManagementPanel from "../CreditManagementPanel";

describe("CreditManagementPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({ customers: [] });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({ customers: [] });
    render(<CreditManagementPanel />);
    await waitFor(() => {
      expect(screen.getByText("Credit Management")).toBeInTheDocument();
    });
  });

  it("renders recalculate button", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({ customers: [] });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({ customers: [] });
    render(<CreditManagementPanel />);
    await waitFor(() => {
      expect(screen.getByText("Recalculate All")).toBeInTheDocument();
    });
  });

  it("shows no over-limit customers message", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({ customers: [] });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({ customers: [] });
    render(<CreditManagementPanel />);
    await waitFor(() => {
      expect(screen.getByText("No customers over their credit limit")).toBeInTheDocument();
    });
  });

  it("shows no at-risk customers message", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({ customers: [] });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({ customers: [] });
    render(<CreditManagementPanel />);
    await waitFor(() => {
      expect(screen.getByText("No at-risk customers")).toBeInTheDocument();
    });
  });

  it("renders over-limit customers in a table", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({
      customers: [
        { id: 1, name: "ABC Corp", creditLimit: 50000, creditUsed: 60000, overage: 10000, creditGrade: "D", dso: 45 },
      ],
    });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({ customers: [] });
    render(<CreditManagementPanel />);
    await waitFor(() => {
      expect(screen.getByText("ABC Corp")).toBeInTheDocument();
    });
  });

  it("renders at-risk customers", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({ customers: [] });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({
      customers: [
        { id: 2, name: "XYZ Ltd", creditLimit: 30000, creditUsed: 28000, utilizationPct: 93, creditGrade: "E", dso: 100 },
      ],
    });
    render(<CreditManagementPanel />);
    await waitFor(() => {
      expect(screen.getByText("XYZ Ltd")).toBeInTheDocument();
    });
  });

  it("disables recalculate button when readOnly", async () => {
    customerCreditService.getOverLimitCustomers.mockResolvedValue({ customers: [] });
    customerCreditService.getHighRiskCustomers.mockResolvedValue({ customers: [] });
    render(<CreditManagementPanel readOnly />);
    await waitFor(() => {
      expect(screen.getByText("Recalculate All").closest("button")).toBeDisabled();
    });
  });
});
