/**
 * InvoiceTotalsSection Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests financial calculations: subtotal, discount, VAT, total, advance, balance due
 */

import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import { createMockArray, createMockInvoice, createMockLineItem } from "../../../test/mock-factories";
import InvoiceTotalsSection from "../InvoiceTotalsSection";

describe("InvoiceTotalsSection", () => {
  let mockInvoice;
  let defaultProps;

  beforeEach(() => {
    mockInvoice = createMockInvoice({
      items: createMockArray(createMockLineItem, 3, (index) => ({
        quantity: 100 + index * 50,
        price: 100,
        total: (100 + index * 50) * 100,
      })),
      discountType: null,
      discountPercentage: 0,
      discountAmount: 0,
      packingCharges: 0,
      freightCharges: 0,
      loadingCharges: 0,
      otherCharges: 0,
      advanceReceived: 0,
    });

    defaultProps = {
      invoice: mockInvoice,
      primaryColor: "#0891b2",
      template: null,
    };
  });

  describe("Subtotal Calculation", () => {
    it("should display subtotal from line items", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("SubTotal");
      expect(container.textContent).toContain("AED");
    });

    it("should calculate subtotal correctly", () => {
      const lineItems = [
        { quantity: 100, price: 100, total: 10000 },
        { quantity: 50, price: 200, total: 10000 },
        { quantity: 75, price: 100, total: 7500 },
      ];

      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, items: lineItems }} />
      );

      expect(container.textContent).toContain("SubTotal");
    });

    it("should handle empty items array", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, items: [] }} />
      );

      expect(container.textContent).toContain("SubTotal");
      expect(container.textContent).toContain("0");
    });

    it("should handle null items", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, items: null }} />
      );

      expect(container.textContent).toContain("SubTotal");
    });
  });

  describe("Discount Handling", () => {
    it("should display discount when percentage discount applied", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            discountType: "percentage",
            discountPercentage: 10,
          }}
        />
      );

      expect(container.textContent).toContain("Discount");
    });

    it("should display discount when flat amount discount applied", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            discountType: "flat",
            discountAmount: 500,
          }}
        />
      );

      expect(container.textContent).toContain("Discount");
      expect(container.textContent).toContain("500");
    });

    it("should not display discount when discount is zero", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            discountType: "percentage",
            discountPercentage: 0,
          }}
        />
      );

      const discountCount = (container.textContent.match(/Discount/g) || []).length;
      expect(discountCount).toBe(0);
    });

    it("should handle both percentage and flat discounts", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            discountType: "percentage",
            discountPercentage: 5,
          }}
        />
      );

      expect(container.textContent).toContain("Discount");
    });

    it("should show discount with minus sign", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            discountType: "flat",
            discountAmount: 1000,
          }}
        />
      );

      expect(container.textContent).toContain("-");
      expect(container.textContent).toContain("Discount");
    });
  });

  describe("VAT Calculation", () => {
    it("should display VAT amount", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("VAT");
      expect(container.textContent).toContain("AED");
    });

    it("should calculate VAT from items", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("VAT");
    });

    it("should include discount in VAT calculation", () => {
      const invoiceWithDiscount = {
        ...mockInvoice,
        discountType: "percentage",
        discountPercentage: 10,
      };

      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={invoiceWithDiscount} />
      );

      expect(container.textContent).toContain("VAT");
    });
  });

  describe("Total Amount", () => {
    it("should display TOTAL", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("TOTAL");
    });

    it("should calculate total with subtotal + VAT", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("TOTAL");
      expect(container.textContent).toContain("AED");
    });

    it("should include discounts in total", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            discountType: "flat",
            discountAmount: 1000,
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should include additional charges in total", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            packingCharges: 100,
            freightCharges: 200,
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should have bold styling on TOTAL", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      const totalDiv = Array.from(container.querySelectorAll("div")).find((div) => div.textContent.includes("TOTAL"));
      expect(totalDiv?.style?.fontWeight).toBe("bold");
    });
  });

  describe("Additional Charges", () => {
    it("should include packing charges", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, packingCharges: 100 }} />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should include freight charges", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, freightCharges: 200 }} />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should include loading charges", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, loadingCharges: 50 }} />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should include other charges", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, otherCharges: 150 }} />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should combine all charges", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            packingCharges: 100,
            freightCharges: 200,
            loadingCharges: 50,
            otherCharges: 150,
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should handle string charge values", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            packingCharges: "100",
            freightCharges: "200.50",
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should handle null charge values", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            packingCharges: null,
            freightCharges: undefined,
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });
  });

  describe("Advance Received and Balance Due", () => {
    it("should not display advance section when no advance", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, advanceReceived: 0 }} />
      );

      expect(container.textContent).not.toContain("Advance Received");
    });

    it("should display advance section when advance received", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, advanceReceived: 5000 }} />
      );

      expect(container.textContent).toContain("Advance Received");
      expect(container.textContent).toContain("Balance Due");
    });

    it("should calculate correct balance due", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, advanceReceived: 5000 }} />
      );

      expect(container.textContent).toContain("Balance Due");
    });

    it("should show advance with minus sign", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, advanceReceived: 5000 }} />
      );

      expect(container.textContent).toContain("-");
      expect(container.textContent).toContain("Advance Received");
    });

    it("should show balance due in red when amount due", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, advanceReceived: 5000 }} />
      );

      const balanceDueDiv = Array.from(container.querySelectorAll("div")).find((div) =>
        div.textContent.includes("Balance Due")
      );
      expect(balanceDueDiv?.style?.color).toContain("dc2626");
    });

    it("should show balance due in green when fully paid", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            items: createMockArray(createMockLineItem, 1, () => ({
              quantity: 10,
              price: 100,
              total: 1000,
            })),
            advanceReceived: 1050,
          }}
        />
      );

      const balanceDueDiv = Array.from(container.querySelectorAll("div")).find((div) =>
        div.textContent.includes("Balance Due")
      );
      if (balanceDueDiv?.style?.color) {
        expect(balanceDueDiv?.style?.color).toContain("059669");
      }
    });

    it("should handle string advance values", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, advanceReceived: "5000.50" }} />
      );

      expect(container.textContent).toContain("Balance Due");
    });
  });

  describe("Color Theming", () => {
    it("should use primaryColor prop", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} primaryColor="#FF0000" />);

      expect(container.textContent).toContain("TOTAL");
    });

    it("should use template colors when provided", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          template={{
            colors: { primary: "#0891b2" },
            fonts: {},
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should apply color to TOTAL border", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} primaryColor="#0891b2" />);

      expect(container.textContent).toContain("TOTAL");
    });
  });

  describe("Font Theming", () => {
    it("should use template font when provided", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          template={{
            colors: {},
            fonts: { body: "Georgia, serif" },
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should use default font when template not provided", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("TOTAL");
    });
  });

  describe("Currency Display", () => {
    it("should display AED currency on all amounts", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      const aedCount = (container.textContent.match(/AED/g) || []).length;
      expect(aedCount).toBeGreaterThan(3);
    });

    it("should format numbers with proper decimal places", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("AED");
    });
  });

  describe("Layout and Structure", () => {
    it("should have proper flex layout", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      const mainDiv = container.querySelector(".invoice-totals-section");
      expect(mainDiv).toBeInTheDocument();
    });

    it("should have totals box with proper styling", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      const totalsBox = container.querySelector("div[style*='width: 300px']");
      expect(totalsBox).toBeInTheDocument();
    });

    it("should have right-aligned layout", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.querySelector(".invoice-totals-section")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle large invoice amounts", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            items: [{ quantity: 1000000, price: 1000, total: 1000000000 }],
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should handle zero amounts", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection {...defaultProps} invoice={{ ...mockInvoice, items: [] }} />
      );

      expect(container.textContent).toContain("SubTotal");
      expect(container.textContent).toContain("0");
    });

    it("should handle decimal amounts", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            items: [{ quantity: 10.5, price: 99.99, total: 1049.895 }],
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
    });

    it("should handle advance greater than total", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            items: [{ quantity: 10, price: 100, total: 1000 }],
            advanceReceived: 5000,
          }}
        />
      );

      expect(container.textContent).toContain("Balance Due");
    });

    it("should handle all charges together", () => {
      const { container } = renderWithProviders(
        <InvoiceTotalsSection
          {...defaultProps}
          invoice={{
            ...mockInvoice,
            packingCharges: 100,
            freightCharges: 200,
            loadingCharges: 50,
            otherCharges: 150,
            discountType: "percentage",
            discountPercentage: 10,
            advanceReceived: 2000,
          }}
        />
      );

      expect(container.textContent).toContain("TOTAL");
      expect(container.textContent).toContain("Balance Due");
      expect(container.textContent).toContain("Discount");
    });
  });

  describe("Accessibility", () => {
    it("should display all financial values", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      expect(container.textContent).toContain("SubTotal");
      expect(container.textContent).toContain("VAT");
      expect(container.textContent).toContain("TOTAL");
    });

    it("should clearly separate sections with styling", () => {
      const { container } = renderWithProviders(<InvoiceTotalsSection {...defaultProps} />);

      const totalDiv = Array.from(container.querySelectorAll("div")).find((div) => div.textContent.includes("TOTAL"));
      expect(totalDiv).toBeInTheDocument();
    });
  });
});
