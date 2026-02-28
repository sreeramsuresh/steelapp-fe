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
  CheckCircle: (props) => <svg {...props} />,
  Clock: (props) => <svg {...props} />,
  DollarSign: (props) => <svg {...props} />,
  FileText: (props) => <svg {...props} />,
  RefreshCw: (props) => <svg {...props} />,
}));

import CustomerCreditNotesTab from "../tabs/CustomerCreditNotesTab";

const mockCreditNotes = [
  { id: 1, creditNoteNumber: "CN-001", date: "2025-01-15", amount: 1000, remainingBalance: 500 },
  { id: 2, creditNoteNumber: "CN-002", date: "2025-01-20", amount: 2000, remainingBalance: 0 },
];

describe("CustomerCreditNotesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<CustomerCreditNotesTab customerId={1} />);
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("renders header after loading", async () => {
    mockApiGet.mockResolvedValue({ creditNotes: [] });
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Customer Credit Notes")).toBeInTheDocument();
    });
  });

  it("shows no credit notes message when empty", async () => {
    mockApiGet.mockResolvedValue({ creditNotes: [] });
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("No credit notes found")).toBeInTheDocument();
    });
  });

  it("renders summary cards", async () => {
    mockApiGet.mockResolvedValue({ creditNotes: mockCreditNotes });
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Total Credit Notes")).toBeInTheDocument();
      expect(screen.getByText("Total Amount")).toBeInTheDocument();
      expect(screen.getByText("Total Applied")).toBeInTheDocument();
      expect(screen.getByText("Total Remaining")).toBeInTheDocument();
    });
  });

  it("renders credit note rows", async () => {
    mockApiGet.mockResolvedValue({ creditNotes: mockCreditNotes });
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("CN-001")).toBeInTheDocument();
      expect(screen.getByText("CN-002")).toBeInTheDocument();
    });
  });

  it("renders status and date filters", async () => {
    mockApiGet.mockResolvedValue({ creditNotes: [] });
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Status")).toBeInTheDocument();
      expect(screen.getByLabelText("Date Range")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    mockApiGet.mockRejectedValue(new Error("Failed to fetch"));
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Error Loading Credit Notes")).toBeInTheDocument();
    });
  });

  it("renders refresh button", async () => {
    mockApiGet.mockResolvedValue({ creditNotes: [] });
    render(<CustomerCreditNotesTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });
});
