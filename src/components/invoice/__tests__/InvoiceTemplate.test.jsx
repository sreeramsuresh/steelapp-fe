import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../constants/defaultTemplateSettings", () => ({
  DEFAULT_TEMPLATE_SETTINGS: {
    colors: { primary: "#1a5276" },
    fonts: { body: "Inter, sans-serif" },
  },
}));

vi.mock("./InvoiceFooter", () => ({
  default: ({ pageNumber, totalPages }) => (
    <div data-testid="invoice-footer">
      Page {pageNumber}/{totalPages}
    </div>
  ),
}));

vi.mock("./InvoiceFooterNotes", () => ({
  default: () => <div data-testid="invoice-footer-notes" />,
}));

vi.mock("./InvoiceHeader", () => ({
  default: ({ isFirstPage }) => (
    <div data-testid="invoice-header">{isFirstPage ? "First Page Header" : "Continued Header"}</div>
  ),
}));

vi.mock("./InvoiceItemsTable", () => ({
  default: ({ items }) => <div data-testid="invoice-items-table">{items.length} items</div>,
}));

vi.mock("./InvoiceSignatureSection", () => ({
  default: () => <div data-testid="invoice-signature" />,
}));

vi.mock("./InvoiceTotalsSection", () => ({
  default: () => <div data-testid="invoice-totals" />,
}));

import InvoiceTemplate from "../InvoiceTemplate";

describe("InvoiceTemplate", () => {
  const defaultProps = {
    invoice: { id: 1, invoiceNumber: "INV-001" },
    company: { name: "Test Company" },
    items: [{ id: 1, name: "Steel Bar" }],
    startingIndex: 0,
    pageNumber: 1,
    totalPages: 2,
    isFirstPage: true,
    isLastPage: false,
  };

  it("renders without crashing", () => {
    const { container } = render(<InvoiceTemplate {...defaultProps} />);
    expect(container.querySelector(".invoice-page")).toBeTruthy();
  });

  it("renders header component", () => {
    render(<InvoiceTemplate {...defaultProps} />);
    expect(screen.getByTestId("invoice-header")).toBeTruthy();
  });

  it("renders items table", () => {
    render(<InvoiceTemplate {...defaultProps} />);
    expect(screen.getByTestId("invoice-items-table")).toBeTruthy();
  });

  it("renders page footer on every page", () => {
    render(<InvoiceTemplate {...defaultProps} />);
    expect(screen.getByTestId("invoice-footer")).toBeTruthy();
    expect(screen.getByText("Page 1/2")).toBeTruthy();
  });

  it("does not render totals on non-last page", () => {
    render(<InvoiceTemplate {...defaultProps} showTotals={true} />);
    expect(screen.queryByTestId("invoice-totals")).toBeNull();
  });

  it("renders totals on last page when showTotals is true", () => {
    render(<InvoiceTemplate {...defaultProps} isLastPage={true} showTotals={true} />);
    expect(screen.getByTestId("invoice-totals")).toBeTruthy();
  });

  it("renders signature on last page when showSignature is true", () => {
    render(<InvoiceTemplate {...defaultProps} isLastPage={true} showSignature={true} />);
    expect(screen.getByTestId("invoice-signature")).toBeTruthy();
  });

  it("renders footer notes on last page", () => {
    render(<InvoiceTemplate {...defaultProps} isLastPage={true} />);
    expect(screen.getByTestId("invoice-footer-notes")).toBeTruthy();
  });
});
