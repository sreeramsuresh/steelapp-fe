import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../constants/defaultTemplateSettings", () => ({
  getDocumentTemplateColor: () => "#0d9488",
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatAddress: (addr) => ({ line1: addr?.street || "", line2: "" }),
  formatCurrency: (val) => `AED ${parseFloat(val || 0).toFixed(2)}`,
  TIMEZONE_DISCLAIMER: "All dates shown in UAE timezone",
  toUAEDateProfessional: (d) => d || "N/A",
}));

const mockValidate = vi.fn().mockReturnValue({ isValid: true, warnings: [] });
vi.mock("../../../utils/recordUtils", () => ({
  validateCreditNoteForDownload: (...args) => mockValidate(...args),
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg data-testid="alert-icon" {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
}));

import CreditNotePreview from "../CreditNotePreview";

const baseCreditNote = {
  id: 1,
  creditNoteNumber: "CN-2025-001",
  status: "issued",
  creditNoteType: "RETURN_WITH_QC",
  creditNoteDate: "2025-01-15",
  reasonForReturn: "Defective items",
  customer: { name: "ABC Corp", phone: "555-1234" },
  items: [{ id: 1, name: "Steel Rod", quantityReturned: 10, unitPrice: 50 }],
  subtotal: 500,
  vatAmount: 25,
  totalCredit: 525,
};

const company = { name: "Ultimate Steel Trading LLC" };

describe("CreditNotePreview", () => {
  it("renders the preview header", () => {
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("Credit Note Preview")).toBeInTheDocument();
  });

  it("displays credit note number", () => {
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("CN-2025-001")).toBeInTheDocument();
  });

  it("displays customer name", () => {
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("ABC Corp")).toBeInTheDocument();
  });

  it("displays status label", () => {
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("Issued")).toBeInTheDocument();
  });

  it("displays type label", () => {
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("Return with QC")).toBeInTheDocument();
  });

  it("displays reason for return", () => {
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("Defective items")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={onClose} />);
    fireEvent.click(screen.getByTitle("Close preview"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows validation warnings when validation fails", () => {
    mockValidate.mockReturnValue({
      isValid: false,
      warnings: ["Missing customer TRN"],
    });

    render(<CreditNotePreview creditNote={baseCreditNote} company={company} onClose={() => {}} />);
    expect(screen.getByText("Missing customer TRN")).toBeInTheDocument();
    mockValidate.mockReturnValue({ isValid: true, warnings: [] });
  });
});
