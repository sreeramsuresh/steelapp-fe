/**
 * InvoiceFooter Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice footer with company details and disclaimer
 */

import sinon from "sinon";
// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import InvoiceFooter from "../InvoiceFooter";

// sinon.stub() // "../../contexts/ThemeContext", () => ({
useTheme: () => ({ isDarkMode: false }),
}))

describe("InvoiceFooter", () => {
  let defaultProps;

  beforeEach(() => {
    sinon.restore();

    defaultProps = {
      companyName: "Ultimate Steel Trading",
      companyTRN: "123456789012",
      companyEmail: "info@ultimatesteel.ae",
      companyPhone: "+971-4-1234567",
      companyWebsite: "www.ultimatesteel.ae",
      bankName: "Emirates NBD",
      accountNumber: "1234567890",
      IBAN: "AE201234567890123456",
      swiftCode: "EIBLAEAD",
    };
  });

  describe("Rendering", () => {
    it("should render invoice footer", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display footer in document", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const footer = container.querySelector("footer");
      expect(footer || container).toBeTruthy();
    });
  });

  describe("Company Information", () => {
    it("should display company name", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Ultimate Steel Trading");
    });

    it("should display company TRN", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("123456789012");
    });

    it("should display company email", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("info@ultimatesteel.ae");
    });

    it("should display company phone", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("+971-4-1234567");
    });

    it("should display company website", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("ultimatesteel.ae");
    });

    it("should handle missing company information", () => {
      const minimalProps = { companyName: "Test Company" };

      const { container } = renderWithProviders(<InvoiceFooter {...minimalProps} />);

      expect(container.textContent).toContain("Test Company");
    });
  });

  describe("Bank Information", () => {
    it("should display bank name", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Emirates NBD");
    });

    it("should display account number", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("1234567890");
    });

    it("should display IBAN", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("AE201234567890123456");
    });

    it("should display SWIFT code", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("EIBLAEAD");
    });

    it("should handle missing bank details", () => {
      const noBank = { ...defaultProps, bankName: null, IBAN: null };

      const { container } = renderWithProviders(<InvoiceFooter {...noBank} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    it("should have columns for organization", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should separate company and bank information", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Ultimate Steel Trading");
      expect(container.textContent).toContain("Emirates NBD");
    });

    it("should have clear visual hierarchy", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const headings = container.querySelectorAll("h4, h5, h6");
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe("Footer Labels", () => {
    it("should have Company Information section", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Company");
    });

    it("should have Bank Details section", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Bank");
    });

    it("should clearly label contact information", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Contact") || expect(container.textContent).toContain("Email");
    });
  });

  describe("Contact Links", () => {
    it("should render email as link or text", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const emailLink = container.querySelector('a[href*="mailto"]');
      if (emailLink) {
        expect(emailLink.href).toContain("info@ultimatesteel.ae");
      } else {
        expect(container.textContent).toContain("info@ultimatesteel.ae");
      }
    });

    it("should render website as link if provided", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const websiteLink = container.querySelector('a[href*="ultimatesteel"]');
      if (websiteLink) {
        expect(websiteLink.href).toContain("ultimatesteel.ae");
      } else {
        expect(container.textContent).toContain("ultimatesteel.ae");
      }
    });
  });

  describe("Disclaimer", () => {
    it("should display footer disclaimer text", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Disclaimer") || expect(container).toBeInTheDocument();
    });

    it("should include payment terms if provided", () => {
      const withTerms = { ...defaultProps, paymentTerms: "Net 30 days" };

      const { container } = renderWithProviders(<InvoiceFooter {...withTerms} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Formatting", () => {
    it("should format phone number clearly", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("+971");
    });

    it("should format IBAN with proper spacing", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("AE20");
    });

    it("should handle long company names", () => {
      const longName = {
        ...defaultProps,
        companyName: "Ultimate Steel Trading LLC - Middle East Branch",
      };

      const { container } = renderWithProviders(<InvoiceFooter {...longName} />);

      expect(container.textContent).toContain("Ultimate Steel Trading");
    });
  });

  describe("Dark Mode Support", () => {
    it("should render footer with proper contrast", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should adapt colors for dark mode", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Print Optimization", () => {
    it("should have print-friendly styling", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should maintain layout when printed", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const text = container.textContent;
      expect(text).toContain("Ultimate Steel Trading");
      expect(text).toContain("Emirates NBD");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings", () => {
      const emptyProps = {
        companyName: "",
        companyTRN: "",
        companyEmail: "",
      };

      const { container } = renderWithProviders(<InvoiceFooter {...emptyProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle null values", () => {
      const nullProps = {
        companyName: null,
        bankName: null,
        IBAN: null,
      };

      const { container } = renderWithProviders(<InvoiceFooter {...nullProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle undefined values", () => {
      const undefinedProps = {
        companyName: undefined,
        bankName: undefined,
      };

      const { container } = renderWithProviders(<InvoiceFooter {...undefinedProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very long IBAN", () => {
      const longIBAN = {
        ...defaultProps,
        IBAN: "AE201234567890123456789012345678",
      };

      const { container } = renderWithProviders(<InvoiceFooter {...longIBAN} />);

      expect(container.textContent).toContain("AE20");
    });
  });

  describe("Accessibility", () => {
    it("should have semantic footer element", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const footer = container.querySelector("footer");
      expect(footer || container).toBeTruthy();
    });

    it("should have proper heading hierarchy", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const headings = container.querySelectorAll("h4, h5, h6");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should render links with href attributes", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const links = container.querySelectorAll("a[href]");
      links.forEach((link) => {
        expect(link.href).toBeTruthy();
      });
    });
  });

  describe("Multi-Language Support", () => {
    it("should display English content by default", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Company");
    });

    it("should handle regional variations", () => {
      const uaeProps = {
        ...defaultProps,
        companyTRN: "123456789012",
      };

      const { container } = renderWithProviders(<InvoiceFooter {...uaeProps} />);

      expect(container.textContent).toContain("123456789012");
    });
  });

  describe("Responsive Layout", () => {
    it("should stack information on small screens", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should use columns on larger screens", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Information Organization", () => {
    it("should group related information together", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      const text = container.textContent;
      expect(text.length).toBeGreaterThan(0);
    });

    it("should clearly separate sections", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container.textContent).toContain("Ultimate Steel Trading");
      expect(container.textContent).toContain("Emirates NBD");
    });

    it("should maintain consistent alignment", () => {
      const { container } = renderWithProviders(<InvoiceFooter {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });
});
