import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../services/creditNoteService", () => ({
  creditNoteService: {
    getCreditNotesByInvoice: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (v) => `AED ${v}`,
  formatDate: (d) => d || "N/A",
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <span data-testid="alert-circle" {...props} />,
  ExternalLink: (props) => <span data-testid="external-link" {...props} />,
  Loader2: (props) => <span data-testid="loader" {...props} />,
  Plus: (props) => <span data-testid="plus-icon" {...props} />,
  ReceiptText: (props) => <span data-testid="receipt-icon" {...props} />,
}));

import { creditNoteService } from "../../services/creditNoteService";
import InvoiceCreditNotesSection from "../InvoiceCreditNotesSection";

describe("InvoiceCreditNotesSection", () => {
  const defaultProps = {
    invoiceId: 1,
    invoiceStatus: "issued",
    isDarkMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Credit Notes header", async () => {
    creditNoteService.getCreditNotesByInvoice.mockResolvedValueOnce({ data: [] });
    render(<InvoiceCreditNotesSection {...defaultProps} />);
    expect(screen.getByText("Credit Notes")).toBeTruthy();
  });

  it("shows New button for issued invoices", () => {
    creditNoteService.getCreditNotesByInvoice.mockResolvedValueOnce({ data: [] });
    render(<InvoiceCreditNotesSection {...defaultProps} />);
    expect(screen.getByText("New")).toBeTruthy();
  });

  it("hides New button for draft invoices", () => {
    creditNoteService.getCreditNotesByInvoice.mockResolvedValueOnce({ data: [] });
    render(<InvoiceCreditNotesSection {...defaultProps} invoiceStatus="draft" />);
    expect(screen.queryByText("New")).toBeNull();
  });

  it("shows empty state message when no credit notes", async () => {
    creditNoteService.getCreditNotesByInvoice.mockResolvedValueOnce({ data: [] });
    render(<InvoiceCreditNotesSection {...defaultProps} />);
    expect(await screen.findByText("No credit notes for this invoice")).toBeTruthy();
  });

  it("renders credit notes list when data is available", async () => {
    creditNoteService.getCreditNotesByInvoice.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          creditNoteNumber: "CN-001",
          creditNoteDate: "2024-01-15",
          totalCredit: 500,
          status: "applied",
        },
      ],
    });
    render(<InvoiceCreditNotesSection {...defaultProps} />);
    expect(await screen.findByText("CN-001")).toBeTruthy();
  });

  it("shows error state on API failure", async () => {
    creditNoteService.getCreditNotesByInvoice.mockRejectedValueOnce(new Error("API Error"));
    render(<InvoiceCreditNotesSection {...defaultProps} />);
    expect(await screen.findByText("Failed to load credit notes")).toBeTruthy();
  });
});
