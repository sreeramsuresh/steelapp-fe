import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../constants/defaultTemplateSettings", () => ({
  getDocumentTemplateColor: () => "#1a5276",
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (v) => `AED ${v}`,
  TIMEZONE_DISCLAIMER: "All times are in UAE timezone (GST, UTC+4)",
  toUAEDateProfessional: (d) => d || "N/A",
}));

vi.mock("../../utils/recordUtils", () => ({
  validateQuotationForDownload: () => ({ isValid: true, warnings: [] }),
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <span data-testid="alert-triangle" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

import QuotationPreview from "../QuotationPreview";

describe("QuotationPreview", () => {
  const defaultProps = {
    quotation: {
      quotationNumber: "QTN-001",
      quotationDate: "2024-01-15",
      status: "draft",
      items: [{ id: 1, name: "Steel Bar", quantity: 10, rate: 100, amount: 1000 }],
      customerDetails: {
        name: "Test Customer",
        company: "Test Corp",
        address: { street: "123 Main St" },
      },
      subtotal: 1000,
      vatAmount: 50,
      total: 1050,
    },
    company: { name: "Ultimate Steels" },
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal header", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("Quotation Preview")).toBeTruthy();
  });

  it("shows QUOTATION heading in document", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("QUOTATION")).toBeTruthy();
  });

  it("shows quotation number", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("QTN-001")).toBeTruthy();
  });

  it("shows customer name", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("Test Customer")).toBeTruthy();
  });

  it("shows company name", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("Ultimate Steels")).toBeTruthy();
  });

  it("shows items table with item data", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("Steel Bar")).toBeTruthy();
    expect(screen.getByText("Items (1)")).toBeTruthy();
  });

  it("shows totals section", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("Subtotal:")).toBeTruthy();
    expect(screen.getByText("VAT:")).toBeTruthy();
    expect(screen.getByText("Total:")).toBeTruthy();
  });

  it("shows timezone disclaimer", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("All times are in UAE timezone (GST, UTC+4)")).toBeTruthy();
  });

  it("calls onClose when X button is clicked", () => {
    render(<QuotationPreview {...defaultProps} />);
    const closeBtn = screen.getByTitle("Close preview");
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows status badge", () => {
    render(<QuotationPreview {...defaultProps} />);
    expect(screen.getByText("Draft")).toBeTruthy();
  });
});
