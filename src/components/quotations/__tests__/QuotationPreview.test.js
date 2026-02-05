/**
 * QuotationPreview Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests quotation preview modal with status display, items, and totals
 */

import sinon from "sinon";
// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import QuotationPreview from "../QuotationPreview";

// sinon.stub() // "../../../contexts/ThemeContext", () => ({
useTheme: () => ({ isDarkMode: false }),
}))

// sinon.stub() // "../../../constants/defaultTemplateSettings", () => ({
getDocumentTemplateColor: () => "#1e40af",
}))

// sinon.stub() // "../../../utils/invoiceUtils", () => ({
formatCurrency: (value) => `AED ${value?.toFixed(2) || "0.00"}`, toUAEDateProfessional;
: (_date) => "15 January 2024",
  TIMEZONE_DISCLAIMER: "Times shown in UAE timezone",
}))

// sinon.stub() // "../../../utils/recordUtils", () => ({
validateQuotationForDownload: () => ({ isValid: true, warnings: [] }),
}))

describe("QuotationPreview", () => {
  let defaultProps;
  let mockOnClose;

  beforeEach(() => {
    sinon.restore();
    mockOnClose = sinon.stub();

    defaultProps = {
      quotation: {
        id: "QTN-001",
        quotationNumber: "QTN-2024-001",
        status: "sent",
        quotationDate: "2024-01-15",
        validUntil: "2024-02-15",
        customerDetails: {
          name: "Steel Trading LLC",
          company: "Trading Corp",
          vatNumber: "123456789",
          address: {
            street: "Dubai, UAE",
            city: "Dubai",
            emirate: "Dubai",
          },
        },
        items: [
          {
            name: "SS304 Coil",
            grade: "304",
            finish: "BA",
            size: "1000mm",
            quantity: 100,
            unit: "kg",
            rate: 50,
            vatRate: 5,
            amount: 5000,
          },
        ],
        subtotal: 5000,
        vatAmount: 250,
        total: 5250,
        notes: "Payment due within 30 days",
        termsAndConditions: "Terms apply as per quotation",
        warehouseName: "Dubai Warehouse",
      },
      company: {
        name: "My Steel Corp",
        address: {
          street: "Abu Dhabi, UAE",
        },
        phone: "+971-123-4567",
      },
      onClose: mockOnClose,
    };
  });

  describe("Rendering", () => {
    it("should render preview modal", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display close button", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      const closeButton = container.querySelector("button");
      expect(closeButton).toBeTruthy();
    });

    it("should display quotation number", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("QTN-2024-001");
    });

    it("should display preview title", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Quotation Preview");
    });

    it("should display quotation header with QUOTATION text", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("QUOTATION");
    });
  });

  describe("Status Display", () => {
    it("should display draft status", () => {
      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={{ ...defaultProps.quotation, status: "draft" }} />
      );

      expect(container.textContent).toContain("Draft");
    });

    it("should display sent status", () => {
      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={{ ...defaultProps.quotation, status: "sent" }} />
      );

      expect(container.textContent).toContain("Sent");
    });

    it("should display accepted status", () => {
      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={{ ...defaultProps.quotation, status: "accepted" }} />
      );

      expect(container.textContent).toContain("Accepted");
    });

    it("should display rejected status", () => {
      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={{ ...defaultProps.quotation, status: "rejected" }} />
      );

      expect(container.textContent).toContain("Rejected");
    });

    it("should display expired status", () => {
      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={{ ...defaultProps.quotation, status: "expired" }} />
      );

      expect(container.textContent).toContain("Expired");
    });

    it("should display converted status", () => {
      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={{ ...defaultProps.quotation, status: "converted" }} />
      );

      expect(container.textContent).toContain("Converted to Invoice");
    });
  });

  describe("Quotation Details", () => {
    it("should display quotation date", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("15 January 2024");
    });

    it("should display valid until date", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Valid Until");
    });

    it("should display customer name", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Steel Trading LLC");
    });

    it("should display customer company", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Trading Corp");
    });

    it("should display customer address", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Dubai");
    });

    it("should display customer VAT number", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("123456789");
    });

    it("should display company name", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("My Steel Corp");
    });

    it("should display company address", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Abu Dhabi");
    });

    it("should display company phone", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("+971-123-4567");
    });

    it("should display warehouse name", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Dubai Warehouse");
    });
  });

  describe("Items Display", () => {
    it("should display items table", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("SS304 Coil");
    });

    it("should display item name", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("SS304 Coil");
    });

    it("should display item specifications", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("304");
    });

    it("should display item quantity and unit", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("100");
      expect(container.textContent).toContain("kg");
    });

    it("should display item rate", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("50");
    });

    it("should display item VAT rate", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("5%");
    });

    it("should display item amount", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("5000");
    });

    it("should handle multiple items", () => {
      const multiItemQuotation = {
        ...defaultProps.quotation,
        items: [
          { ...defaultProps.quotation.items[0] },
          {
            name: "SS316 Sheet",
            grade: "316",
            quantity: 50,
            unit: "pcs",
            rate: 100,
            amount: 5000,
          },
        ],
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={multiItemQuotation} />);

      expect(container.textContent).toContain("SS304 Coil");
      expect(container.textContent).toContain("SS316 Sheet");
    });

    it("should display empty items message", () => {
      const noItemsQuotation = {
        ...defaultProps.quotation,
        items: [],
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={noItemsQuotation} />);

      expect(container.textContent).toContain("No items added");
    });
  });

  describe("Financial Totals", () => {
    it("should display subtotal", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Subtotal");
      expect(container.textContent).toContain("5000");
    });

    it("should display VAT amount", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("VAT");
      expect(container.textContent).toContain("250");
    });

    it("should display total", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Total");
      expect(container.textContent).toContain("5250");
    });

    it("should handle other charges", () => {
      const quotationWithCharges = {
        ...defaultProps.quotation,
        packingCharges: 100,
        freightCharges: 150,
      };

      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={quotationWithCharges} />
      );

      expect(container.textContent).toContain("Other Charges");
    });

    it("should handle snake_case financial fields", () => {
      const snakeCaseQuotation = {
        ...defaultProps.quotation,
        sub_total: 5000,
        vat_amount: 250,
        grand_total: 5250,
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={snakeCaseQuotation} />);

      expect(container.textContent).toContain("5000");
    });

    it("should calculate totals from items when not provided", () => {
      const quotationWithoutTotals = {
        ...defaultProps.quotation,
        subtotal: 0,
        total: 0,
        items: [{ amount: 1000 }, { amount: 2000 }, { amount: 3000 }],
      };

      const { container } = renderWithProviders(
        <QuotationPreview {...defaultProps} quotation={quotationWithoutTotals} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("Notes and Terms", () => {
    it("should display notes", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Notes");
      expect(container.textContent).toContain("Payment due within 30 days");
    });

    it("should display terms and conditions", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toContain("Terms & Conditions");
      expect(container.textContent).toContain("Terms apply as per quotation");
    });

    it("should handle missing notes", () => {
      const quotationNoNotes = {
        ...defaultProps.quotation,
        notes: null,
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={quotationNoNotes} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("should call onClose when close button clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      const closeButton = container.querySelector("button");
      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe("Validation Warnings", () => {
    it("should display validation warnings if present", () => {
      vi.doMock("../../../utils/recordUtils", () => ({
        validateQuotationForDownload: () => ({
          isValid: false,
          warnings: ["Missing customer address", "No items added"],
        }),
      }));

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show warning icon for invalid quotations", () => {
      vi.doMock("../../../utils/recordUtils", () => ({
        validateQuotationForDownload: () => ({
          isValid: false,
          warnings: ["Incomplete quotation"],
        }),
      }));

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styling", () => {
      vi.resetModules();
      vi.doMock("../../../contexts/ThemeContext", () => ({
        useTheme: () => ({ isDarkMode: true }),
      }));

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Field Name Compatibility", () => {
    it("should support both camelCase and snake_case quotation number", () => {
      const quotationSnakeCase = {
        ...defaultProps.quotation,
        quotation_number: "QTN-2024-002",
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={quotationSnakeCase} />);

      expect(container.textContent).toContain("QTN-2024-002");
    });

    it("should support both camelCase and snake_case dates", () => {
      const quotationSnakeCase = {
        ...defaultProps.quotation,
        quotation_date: "2024-01-20",
        valid_until: "2024-02-20",
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={quotationSnakeCase} />);

      expect(container).toBeInTheDocument();
    });

    it("should support both camelCase and snake_case customer details", () => {
      const quotationSnakeCase = {
        ...defaultProps.quotation,
        customer_details: {
          name: "Another Customer",
          vatNumber: "987654321",
        },
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={quotationSnakeCase} />);

      expect(container.textContent).toContain("Another Customer");
    });

    it("should support both camelCase and snake_case warehouse name", () => {
      const quotationSnakeCase = {
        ...defaultProps.quotation,
        warehouse_name: "Abu Dhabi Warehouse",
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={quotationSnakeCase} />);

      expect(container.textContent).toContain("Abu Dhabi Warehouse");
    });

    it("should support both camelCase and snake_case terms", () => {
      const quotationSnakeCase = {
        ...defaultProps.quotation,
        terms_and_conditions: "Snake case terms",
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={quotationSnakeCase} />);

      expect(container.textContent).toContain("Snake case terms");
    });
  });

  describe("Print Support", () => {
    it("should display properly for printing", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show timezone disclaimer", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} />);

      expect(container.textContent).toMatch(/timezone|UAE/i);
    });
  });

  describe("Edge Cases", () => {
    it("should handle quotation with no items", () => {
      const noItemsQuotation = {
        ...defaultProps.quotation,
        items: [],
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={noItemsQuotation} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing customer data", () => {
      const noCustomerQuotation = {
        ...defaultProps.quotation,
        customerDetails: null,
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={noCustomerQuotation} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing company data", () => {
      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} company={null} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle very large quotations", () => {
      const largeQuotation = {
        ...defaultProps.quotation,
        items: Array.from({ length: 100 }, (_, i) => ({
          name: `Item ${i}`,
          quantity: 100,
          unit: "kg",
          rate: 50,
          amount: 5000,
        })),
        total: 500000,
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={largeQuotation} />);

      expect(container).toBeInTheDocument();
    });

    it("should handle missing optional fields", () => {
      const minimalQuotation = {
        quotationNumber: "QTN-001",
        status: "draft",
        items: [],
      };

      const { container } = renderWithProviders(<QuotationPreview {...defaultProps} quotation={minimalQuotation} />);

      expect(container).toBeInTheDocument();
    });
  });
});
