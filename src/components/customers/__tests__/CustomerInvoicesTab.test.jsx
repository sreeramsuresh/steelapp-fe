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
  AlertCircle: (props) => <svg {...props} />,
  AlertTriangle: (props) => <svg {...props} />,
  Clock: (props) => <svg {...props} />,
  DollarSign: (props) => <svg {...props} />,
  FileText: (props) => <svg {...props} />,
  RefreshCw: (props) => <svg {...props} />,
}));

import CustomerInvoicesTab from "../tabs/CustomerInvoicesTab";

const mockInvoices = [
  { id: 1, invoiceNumber: "INV-001", date: "2025-01-10", dueDate: "2025-02-10", totalAmount: 5000, outstandingAmount: 2000, status: "open" },
  { id: 2, invoiceNumber: "INV-002", date: "2025-01-15", dueDate: "2025-02-15", totalAmount: 3000, outstandingAmount: 0, status: "paid" },
];

describe("CustomerInvoicesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<CustomerInvoicesTab customerId={1} />);
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("renders header after loading", async () => {
    mockApiGet.mockResolvedValue({ invoices: [] });
    render(<CustomerInvoicesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Customer Invoices")).toBeInTheDocument();
    });
  });

  it("shows no invoices message when empty", async () => {
    mockApiGet.mockResolvedValue({ invoices: [] });
    render(<CustomerInvoicesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("No invoices found")).toBeInTheDocument();
    });
  });

  it("renders summary cards", async () => {
    mockApiGet.mockResolvedValue({ invoices: mockInvoices });
    render(<CustomerInvoicesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Total Invoices")).toBeInTheDocument();
      expect(screen.getByText("Total Amount")).toBeInTheDocument();
      expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
      expect(screen.getByText("Overdue Count")).toBeInTheDocument();
    });
  });

  it("renders invoice rows", async () => {
    mockApiGet.mockResolvedValue({ invoices: mockInvoices });
    render(<CustomerInvoicesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("INV-001")).toBeInTheDocument();
      expect(screen.getByText("INV-002")).toBeInTheDocument();
    });
  });

  it("renders filters", async () => {
    mockApiGet.mockResolvedValue({ invoices: [] });
    render(<CustomerInvoicesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Status")).toBeInTheDocument();
      expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));
    render(<CustomerInvoicesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Error Loading Invoices")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });
});
