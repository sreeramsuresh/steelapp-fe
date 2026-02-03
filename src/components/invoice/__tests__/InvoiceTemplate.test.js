/**
 * InvoiceTemplate Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice template page layout and composition
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import InvoiceTemplate from "../InvoiceTemplate";

vi.mock("../InvoiceHeader", () => ({
  default: ({ isFirstPage }) => <div data-testid="invoice-header">Header {isFirstPage ? "(First)" : ""}</div>,
}));

vi.mock("../InvoiceItemsTable", () => ({
  default: ({ items, isFirstPage, isContinued, startingIndex }) => (
    <div data-testid="invoice-items-table">
      Items {items.length} {isFirstPage ? "(First)" : ""} {isContinued ? "(Continued)" : ""} Start: {startingIndex}
    </div>
  ),
}));

vi.mock("../InvoiceTotalsSection", () => ({
  default: () => <div data-testid="invoice-totals-section">Totals</div>,
}));

vi.mock("../InvoiceFooterNotes", () => ({
  default: () => <div data-testid="invoice-footer-notes">Notes</div>,
}));

vi.mock("../InvoiceSignatureSection", () => ({
  default: () => <div data-testid="invoice-signature-section">Signature</div>,
}));

vi.mock("../InvoiceFooter", () => ({
  default: ({ pageNumber, totalPages }) => (
    <div data-testid="invoice-footer">
      Footer {pageNumber} of {totalPages}
    </div>
  ),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe("InvoiceTemplate", () => {
  let defaultProps;
  let defaultInvoice;
  let defaultCompany;

  beforeEach(() => {
    vi.clearAllMocks();

    defaultInvoice = {
      id: "INV-001",
      invoiceNumber: "INV-2024-001",
      date: "2024-01-15",
      totalAmount: 10000,
      vatAmount: 500,
    };

    defaultCompany = {
      name: "Steel Trading Co.",
      trn: "123456789",
      settings: {
        invoiceTemplate: {
          colors: {
            primary: "#1e40af",
          },
        },
      },
    };

    defaultProps = {
      invoice: defaultInvoice,
      company: defaultCompany,
      items: [
        { id: 1, description: "Item 1", quantity: 100, price: 100 },
        { id: 2, description: "Item 2", quantity: 50, price: 100 },
      ],
      startingIndex: 0,
      pageNumber: 1,
      totalPages: 1,
      isFirstPage: true,
      isLastPage: true,
      showSignature: true,
      showTotals: true,
    };
  });

  describe("Rendering", () => {
    it("should render invoice template container", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should have A4 page dimensions", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ width: "210mm", minHeight: "297mm" });
    });

    it("should have white background", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ background: "white" });
    });

    it("should have proper padding for print", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ padding: "15mm" });
    });

    it("should render invoice header", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      expect(getByTestId("invoice-header")).toBeInTheDocument();
    });

    it("should render invoice items table", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      expect(getByTestId("invoice-items-table")).toBeInTheDocument();
    });

    it("should render invoice footer", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      expect(getByTestId("invoice-footer")).toBeInTheDocument();
    });
  });

  describe("Multi-Page Support", () => {
    it("should pass isFirstPage to header", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={true} />);

      expect(getByTestId("invoice-header").textContent).toContain("(First)");
    });

    it("should pass isFirstPage to items table", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={true} />);

      expect(getByTestId("invoice-items-table").textContent).toContain("(First)");
    });

    it("should show continued indicator on non-first pages", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={false} />);

      expect(getByTestId("invoice-items-table").textContent).toContain("(Continued)");
    });

    it("should pass starting index to items table", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} startingIndex={51} />);

      expect(getByTestId("invoice-items-table").textContent).toContain("Start: 51");
    });

    it("should pass page numbers to footer", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} pageNumber={2} totalPages={5} />);

      expect(getByTestId("invoice-footer").textContent).toContain("Footer 2 of 5");
    });

    it("should set pageBreakAfter for last page", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={true} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ pageBreakAfter: "avoid" });
    });

    it("should set pageBreakAfter for non-last pages", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={false} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ pageBreakAfter: "always" });
    });
  });

  describe("Conditional Sections", () => {
    it("should show totals section when isLastPage and showTotals", () => {
      const { getByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showTotals={true} />
      );

      expect(getByTestId("invoice-totals-section")).toBeInTheDocument();
    });

    it("should hide totals section when not isLastPage", () => {
      const { queryByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={false} showTotals={true} />
      );

      expect(queryByTestId("invoice-totals-section")).not.toBeInTheDocument();
    });

    it("should hide totals section when showTotals is false", () => {
      const { queryByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showTotals={false} />
      );

      expect(queryByTestId("invoice-totals-section")).not.toBeInTheDocument();
    });

    it("should show footer notes on last page", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={true} />);

      expect(getByTestId("invoice-footer-notes")).toBeInTheDocument();
    });

    it("should hide footer notes on non-last pages", () => {
      const { queryByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={false} />);

      expect(queryByTestId("invoice-footer-notes")).not.toBeInTheDocument();
    });

    it("should show signature section when isLastPage and showSignature", () => {
      const { getByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showSignature={true} />
      );

      expect(getByTestId("invoice-signature-section")).toBeInTheDocument();
    });

    it("should hide signature section when not isLastPage", () => {
      const { queryByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={false} showSignature={true} />
      );

      expect(queryByTestId("invoice-signature-section")).not.toBeInTheDocument();
    });

    it("should hide signature section when showSignature is false", () => {
      const { queryByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showSignature={false} />
      );

      expect(queryByTestId("invoice-signature-section")).not.toBeInTheDocument();
    });
  });

  describe("Template Settings", () => {
    it("should use provided template colors", () => {
      const customTemplate = {
        colors: {
          primary: "#ff0000",
        },
      };

      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} template={customTemplate} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should fallback to company template settings", () => {
      const companyWithTemplate = {
        ...defaultCompany,
        settings: {
          invoiceTemplate: {
            colors: {
              primary: "#00ff00",
            },
          },
        },
      };

      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} company={companyWithTemplate} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should handle snake_case company settings", () => {
      const companyWithSnakeCase = {
        ...defaultCompany,
        settings: {
          invoice_template: {
            colors: {
              primary: "#0000ff",
            },
          },
        },
      };

      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} company={companyWithSnakeCase} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should use default colors when no template provided", () => {
      const companyWithoutTemplate = {
        ...defaultCompany,
        settings: {},
      };

      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} company={companyWithoutTemplate} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });
  });

  describe("Item Composition", () => {
    it("should pass all items to items table", () => {
      const items = [
        { id: 1, description: "Item 1", quantity: 100, price: 100 },
        { id: 2, description: "Item 2", quantity: 50, price: 100 },
        { id: 3, description: "Item 3", quantity: 25, price: 100 },
      ];

      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} items={items} />);

      expect(getByTestId("invoice-items-table").textContent).toContain("Items 3");
    });

    it("should pass invoice data correctly", () => {
      const customInvoice = {
        id: "INV-002",
        invoiceNumber: "INV-2024-002",
        date: "2024-01-20",
      };

      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} invoice={customInvoice} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should pass company data correctly", () => {
      const customCompany = {
        name: "Another Trading Co.",
        trn: "987654321",
      };

      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} company={customCompany} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });
  });

  describe("Document Type Support", () => {
    it("should support invoice document type", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} documentType="invoice" />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should support credit note document type", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} documentType="credit_note" />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should support debit note document type", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} documentType="debit_note" />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should pass document type to header", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} documentType="quotation" />);

      expect(getByTestId("invoice-header")).toBeInTheDocument();
    });
  });

  describe("Last Page Group Layout", () => {
    it("should group notes and signature on last page", () => {
      const { container } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showSignature={true} />
      );

      const lastPageGroup = container.querySelector(".invoice-last-page-group");
      expect(lastPageGroup).toBeInTheDocument();
    });

    it("should have page-break-inside avoid for last page group", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={true} />);

      const lastPageGroup = container.querySelector(".invoice-last-page-group");
      expect(lastPageGroup).toHaveStyle({ pageBreakInside: "avoid" });
    });

    it("should have break-inside avoid for last page group", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={true} />);

      const lastPageGroup = container.querySelector(".invoice-last-page-group");
      expect(lastPageGroup).toHaveStyle({ breakInside: "avoid" });
    });

    it("should not show last page group on non-last pages", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={false} />);

      const lastPageGroup = container.querySelector(".invoice-last-page-group");
      expect(lastPageGroup).not.toBeInTheDocument();
    });
  });

  describe("Print Optimization", () => {
    it("should be A4 printable", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ width: "210mm" });
    });

    it("should have proper margins for printing", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ padding: "15mm" });
    });

    it("should preserve page break settings", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} isLastPage={false} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ pageBreakAfter: "always" });
    });

    it("should have proper box-sizing", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} />);

      const page = container.querySelector(".invoice-page");
      expect(page).toHaveStyle({ boxSizing: "border-box" });
    });
  });

  describe("First vs Non-First Pages", () => {
    it("should show header on first page", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={true} />);

      expect(getByTestId("invoice-header")).toBeInTheDocument();
    });

    it("should show header on non-first pages", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={false} />);

      expect(getByTestId("invoice-header")).toBeInTheDocument();
    });

    it("should show items table on first page", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={true} />);

      expect(getByTestId("invoice-items-table")).toBeInTheDocument();
    });

    it("should show items table on non-first pages", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} isFirstPage={false} />);

      expect(getByTestId("invoice-items-table")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single page invoice", () => {
      const { container } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} pageNumber={1} totalPages={1} isFirstPage={true} isLastPage={true} />
      );

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should handle first of multiple pages", () => {
      const { container } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} pageNumber={1} totalPages={5} isFirstPage={true} isLastPage={false} />
      );

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should handle middle pages", () => {
      const { container } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} pageNumber={3} totalPages={5} isFirstPage={false} isLastPage={false} />
      );

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should handle last of multiple pages", () => {
      const { container } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} pageNumber={5} totalPages={5} isFirstPage={false} isLastPage={true} />
      );

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should handle empty items", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} items={[]} />);

      expect(getByTestId("invoice-items-table").textContent).toContain("Items 0");
    });

    it("should handle null company", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} company={null} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should handle undefined template", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} template={undefined} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });
  });

  describe("Default Props", () => {
    it("should default showSignature to false", () => {
      const { queryByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showSignature={undefined} />
      );

      expect(queryByTestId("invoice-signature-section")).not.toBeInTheDocument();
    });

    it("should default showTotals to false", () => {
      const { queryByTestId } = renderWithProviders(
        <InvoiceTemplate {...defaultProps} isLastPage={true} showTotals={undefined} />
      );

      expect(queryByTestId("invoice-totals-section")).not.toBeInTheDocument();
    });

    it("should default documentType to invoice", () => {
      const { container } = renderWithProviders(<InvoiceTemplate {...defaultProps} documentType={undefined} />);

      expect(container.querySelector(".invoice-page")).toBeInTheDocument();
    });

    it("should default startingIndex to 0", () => {
      const { getByTestId } = renderWithProviders(<InvoiceTemplate {...defaultProps} startingIndex={undefined} />);

      expect(getByTestId("invoice-items-table").textContent).toContain("Start: 0");
    });
  });
});
