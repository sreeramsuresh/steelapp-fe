import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const mockApiGet = vi.fn();
vi.mock("../../../services/api", () => ({
  apiClient: {
    get: (...args) => mockApiGet(...args),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${parseFloat(val || 0).toFixed(2)}`,
  formatDate: (d) => d || "N/A",
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Banknote: (props) => <svg {...props} />,
  Calendar: (props) => <svg {...props} />,
  ChevronDown: (props) => <svg {...props} />,
  ChevronRight: (props) => <svg {...props} />,
  CreditCard: (props) => <svg {...props} />,
  DollarSign: (props) => <svg {...props} />,
  RefreshCw: (props) => <svg {...props} />,
  TrendingUp: (props) => <svg {...props} />,
}));

import CustomerPaymentsTab from "../tabs/CustomerPaymentsTab";

const mockPayments = [
  {
    id: 1,
    paymentDate: "2025-01-10",
    referenceNumber: "PAY-001",
    paymentMethod: "bank transfer",
    amount: 5000,
    allocatedAmount: 4000,
    unallocatedAmount: 1000,
    allocations: [{ invoiceNumber: "INV-001", amount: 4000 }],
  },
  {
    id: 2,
    paymentDate: "2025-01-15",
    referenceNumber: "PAY-002",
    paymentMethod: "cash",
    amount: 3000,
    allocatedAmount: 3000,
    unallocatedAmount: 0,
    allocations: [],
  },
];

describe("CustomerPaymentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<CustomerPaymentsTab customerId={1} />);
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("renders header after loading", async () => {
    mockApiGet.mockResolvedValue({ payments: [] });
    render(<CustomerPaymentsTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Customer Payments")).toBeInTheDocument();
    });
  });

  it("shows no payments message when empty", async () => {
    mockApiGet.mockResolvedValue({ payments: [] });
    render(<CustomerPaymentsTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("No payments found")).toBeInTheDocument();
    });
  });

  it("renders summary cards", async () => {
    mockApiGet.mockResolvedValue({ payments: mockPayments });
    render(<CustomerPaymentsTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Total Received")).toBeInTheDocument();
      expect(screen.getByText("Total Allocated")).toBeInTheDocument();
      expect(screen.getByText("Total Unallocated")).toBeInTheDocument();
      expect(screen.getByText("Last Payment")).toBeInTheDocument();
    });
  });

  it("renders payment rows", async () => {
    mockApiGet.mockResolvedValue({ payments: mockPayments });
    render(<CustomerPaymentsTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("PAY-001")).toBeInTheDocument();
      expect(screen.getByText("PAY-002")).toBeInTheDocument();
    });
  });

  it("renders filters", async () => {
    mockApiGet.mockResolvedValue({ payments: [] });
    render(<CustomerPaymentsTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
      expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    mockApiGet.mockRejectedValue(new Error("Server error"));
    render(<CustomerPaymentsTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Error Loading Payments")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });
});
