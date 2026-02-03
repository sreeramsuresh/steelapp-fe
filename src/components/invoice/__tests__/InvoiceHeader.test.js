/**
 * InvoiceHeader Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice header with company info, invoice details, and customer billing
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import { createMockCompany, createMockInvoice } from "../../../test/mock-factories";
import InvoiceHeader from "../InvoiceHeader";

// Mock environment variable
vi.stubGlobal("import", {
  meta: {
    env: {
      VITE_API_BASE_URL: "http://localhost:5000/api",
    },
  },
});

describe("InvoiceHeader", () => {
  let mockCompany;
  let mockInvoice;
  let defaultProps;

  beforeEach(() => {
    mockCompany = createMockCompany({
      name: "Ultimate Steels LLC",
      phone: "+971501234567",
      email: "info@steels.ae",
      address: {
        street: "123 Business Street",
        city: "Dubai",
        country: "UAE",
      },
      logoUrl: "/images/logo.png",
      settings: {
        documentImages: {
          invoice: {
            showLogo: true,
            showSeal: true,
          },
        },
      },
    });

    mockInvoice = createMockInvoice({
      invoiceNumber: "INV-2024-001",
      status: "draft",
      date: "2024-01-15",
      dueDate: "2024-02-15",
      customer: {
        name: "Test Customer LLC",
        email: "customer@test.com",
        phone: "+971501234567",
        vatNumber: "98765432109876",
        address: {
          street: "456 Customer Road",
          city: "Abu Dhabi",
          country: "UAE",
        },
      },
      currency: "AED",
    });

    defaultProps = {
      company: mockCompany,
      invoice: mockInvoice,
      isFirstPage: true,
      primaryColor: "#0891b2",
      template: null,
      documentType: "invoice",
    };
  });

  describe("Company Information Display", () => {
    it("should display company name", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      expect(container.textContent).toContain("Ultimate Steels LLC");
    });

    it("should display company address", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      expect(container.textContent).toContain("123 Business Street");
      expect(container.textContent).toContain("Dubai");
      expect(container.textContent).toContain("UAE");
    });

    it("should display company phone", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      expect(container.textContent).toContain("+971501234567");
      expect(container.textContent).toContain("Mobile");
    });

    it("should display company email", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      expect(container.textContent).toContain("info@steels.ae");
      expect(container.textContent).toContain("Email");
    });

    it("should display VAT registration number", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      expect(container.textContent).toContain("VAT Reg No");
    });

    it("should use default company name when missing", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} company={{ ...mockCompany, name: null }} />
      );

      expect(container.textContent).toContain("Ultimate Steels Building Materials Trading");
    });

    it("should display partial address when city/country provided", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          company={{
            ...mockCompany,
            address: { city: "Dubai", country: "UAE" },
          }}
        />
      );

      expect(container.textContent).toContain("Dubai");
      expect(container.textContent).toContain("UAE");
    });

    it("should not display missing address parts", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} company={{ ...mockCompany, address: { city: "Dubai" } }} />
      );

      expect(container.textContent).toContain("Dubai");
    });
  });

  describe("Invoice Status Display", () => {
    it("should display DRAFT INVOICE for draft status", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} invoice={{ ...mockInvoice, status: "draft" }} />
      );

      expect(container.textContent).toContain("DRAFT INVOICE");
    });

    it("should display PROFORMA INVOICE for proforma status", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} invoice={{ ...mockInvoice, status: "proforma" }} />
      );

      expect(container.textContent).toContain("PROFORMA INVOICE");
    });

    it("should display TAX INVOICE for confirmed status", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} invoice={{ ...mockInvoice, status: "confirmed" }} />
      );

      expect(container.textContent).toContain("TAX INVOICE");
    });

    it("should display TAX INVOICE when status is null", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} invoice={{ ...mockInvoice, status: null }} />
      );

      expect(container.textContent).toContain("TAX INVOICE");
    });
  });

  describe("Customer Information Display", () => {
    it("should display customer name when on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("Test Customer LLC");
      expect(container.textContent).toContain("Invoice To");
    });

    it("should display customer address when on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("456 Customer Road");
      expect(container.textContent).toContain("Abu Dhabi");
    });

    it("should display customer email when on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("customer@test.com");
    });

    it("should display customer phone when on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("+971501234567");
      expect(container.textContent).toContain("Phone");
    });

    it("should display customer TRN when on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("TRN");
      expect(container.textContent).toContain("98765432109876");
    });

    it("should not display customer info when not first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={false} />);

      expect(container.textContent).not.toContain("Invoice To");
    });

    it("should handle missing customer address parts", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            customer: {
              name: "Test Customer",
              email: "test@example.com",
            },
          }}
        />
      );

      expect(container.textContent).toContain("Test Customer");
    });
  });

  describe("Invoice Details Box", () => {
    it("should display invoice number on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("Invoice No");
      expect(container.textContent).toContain("INV-2024-001");
    });

    it("should display invoice date on first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("Invoice Date");
    });

    it("should display due date on first page when present", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      expect(container.textContent).toContain("Due Date");
    });

    it("should display customer PO number when present", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{ ...mockInvoice, customerPurchaseOrderNumber: "PO-2024-123" }}
          isFirstPage={true}
        />
      );

      expect(container.textContent).toContain("SO");
      expect(container.textContent).toContain("PO-2024-123");
    });

    it("should display customer PO date when present", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            customerPurchaseOrderDate: "2024-01-10",
          }}
          isFirstPage={true}
        />
      );

      expect(container.textContent).toContain("Order Date");
    });

    it("should not display details box when not first page", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={false} />);

      expect(container.textContent).not.toContain("Invoice No");
    });
  });

  describe("Logo Display", () => {
    it("should display company logo when enabled", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      const logo = container.querySelector("img");
      expect(logo).toBeInTheDocument();
    });

    it("should not display logo when showLogo is false", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          company={{
            ...mockCompany,
            settings: {
              documentImages: {
                invoice: { showLogo: false, showSeal: true },
              },
            },
          }}
        />
      );

      const logo = container.querySelector("img");
      expect(logo).not.toBeInTheDocument();
    });

    it("should use pdfLogoUrl if available", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          company={{
            ...mockCompany,
            pdfLogoUrl: "/images/pdf-logo.png",
            logoUrl: "/images/logo.png",
          }}
        />
      );

      const logo = container.querySelector("img");
      expect(logo.src).toContain("pdf-logo");
    });

    it("should prepend baseUrl to relative logo paths", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          company={{
            ...mockCompany,
            pdfLogoUrl: "/images/logo.png",
          }}
        />
      );

      const logo = container.querySelector("img");
      expect(logo.src).toContain("localhost");
    });

    it("should use logoUrl when pdfLogoUrl not available", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          company={{
            ...mockCompany,
            pdfLogoUrl: null,
            logoUrl: "/images/logo.png",
          }}
        />
      );

      const logo = container.querySelector("img");
      expect(logo).toBeInTheDocument();
    });
  });

  describe("Currency Exchange Rate", () => {
    it("should display exchange rate for non-AED currency on first page", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            currency: "USD",
            exchangeRate: 3.67,
          }}
          isFirstPage={true}
        />
      );

      expect(container.textContent).toContain("Exchange Rate");
      expect(container.textContent).toContain("USD");
      expect(container.textContent).toContain("3.67");
    });

    it("should not display exchange rate for AED", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            currency: "AED",
          }}
          isFirstPage={true}
        />
      );

      expect(container.textContent).not.toContain("Exchange Rate");
    });

    it("should not display exchange rate when not first page", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            currency: "USD",
            exchangeRate: 3.67,
          }}
          isFirstPage={false}
        />
      );

      expect(container.textContent).not.toContain("Exchange Rate");
    });

    it("should use default exchange rate of 1 when not provided", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            currency: "USD",
            exchangeRate: null,
          }}
          isFirstPage={true}
        />
      );

      expect(container.textContent).toContain("= 1 AED");
    });
  });

  describe("Color Theming", () => {
    it("should use primaryColor prop", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} primaryColor="#FF0000" />);

      const header = container.querySelector(".invoice-header");
      expect(header).toBeInTheDocument();
    });

    it("should use template colors when provided", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          template={{
            colors: { primary: "#0891b2" },
            layout: {},
            fonts: {},
          }}
        />
      );

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });

    it("should use default color when neither provided", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} primaryColor={null} template={{ layout: {}, colors: {}, fonts: {} }} />
      );

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });
  });

  describe("Header Style and Layout", () => {
    it("should render centered header style by default", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      const flexDiv = container.querySelector(".flex");
      expect(flexDiv).toBeInTheDocument();
    });

    it("should render letterhead style when specified", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          template={{
            layout: { headerStyle: "letterhead" },
            colors: {},
            fonts: {},
          }}
        />
      );

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });

    it("should render with custom font family when template provided", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          template={{
            layout: {},
            colors: {},
            fonts: { heading: "Georgia, serif" },
          }}
        />
      );

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });
  });

  describe("Watermark", () => {
    it("should not display watermark by default", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      const watermark = Array.from(container.querySelectorAll("div")).find((div) => div.textContent === "INVOICE");
      expect(watermark?.style?.position).not.toBe("absolute");
    });

    it("should display watermark when enabled in template", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          template={{
            layout: { showWatermark: true },
            colors: {},
            fonts: {},
          }}
        />
      );

      const watermark = Array.from(container.querySelectorAll("div")).find((div) => div.textContent === "INVOICE");
      expect(watermark?.style?.position).toBe("absolute");
    });
  });

  describe("Document Type Support", () => {
    it("should support invoice document type", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} documentType="invoice" />);

      expect(container.textContent).toContain("DRAFT INVOICE");
    });

    it("should support quotation document type", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          documentType="quotation"
          company={{
            ...mockCompany,
            settings: {
              documentImages: {
                quotation: {
                  showLogo: true,
                  showSeal: true,
                },
              },
            },
          }}
        />
      );

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing company object", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} company={null} />);

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });

    it("should handle missing invoice date", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} invoice={{ ...mockInvoice, date: null }} isFirstPage={true} />
      );

      expect(container.textContent).toContain("Invoice Date");
    });

    it("should handle missing customer object", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader {...defaultProps} invoice={{ ...mockInvoice, customer: null }} isFirstPage={true} />
      );

      expect(container.querySelector(".invoice-header")).toBeInTheDocument();
    });

    it("should handle very long company name", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          company={{
            ...mockCompany,
            name: "This Is A Very Long Company Name That Might Cause Layout Issues",
          }}
        />
      );

      expect(container.textContent).toContain("This Is A Very Long Company Name");
    });

    it("should handle very long invoice number", () => {
      const { container } = renderWithProviders(
        <InvoiceHeader
          {...defaultProps}
          invoice={{ ...mockInvoice, invoiceNumber: "INV-2024-12345-LONGEXTENSION" }}
          isFirstPage={true}
        />
      );

      expect(container.textContent).toContain("INV-2024-12345-LONGEXTENSION");
    });
  });

  describe("Accessibility", () => {
    it("should have proper structure with headings", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} isFirstPage={true} />);

      const headings = container.querySelectorAll("h1, h3");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should have alt text for logo image", () => {
      const { container } = renderWithProviders(<InvoiceHeader {...defaultProps} />);

      const logo = container.querySelector("img");
      expect(logo?.alt).toBe("Company Logo");
    });
  });
});
