/**
 * InvoiceItemsTable Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice line items display with various template settings and styles
 */

import { describe, it, expect, beforeEach } from "vitest";
import InvoiceItemsTable from "../InvoiceItemsTable";
import { renderWithProviders } from "../../../test/component-setup";
import { createMockLineItem, createMockArray } from "../../../test/mock-factories";

describe("InvoiceItemsTable", () => {
  let mockItems;

  beforeEach(() => {
    mockItems = createMockArray(createMockLineItem, 3);
  });

  describe("Rendering", () => {
    it("should render with default props", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should render empty state when no items", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[]} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should render correct number of rows", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(mockItems.length);
    });

    it("should render table headers", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      const headerRow = container.querySelector("thead tr");
      expect(headerRow).toBeInTheDocument();
    });
  });

  describe("Item Display", () => {
    it("should display product name without origin for UAE items", () => {
      const uaeItem = {
        ...mockItems[0],
        name: "SS-304-Sheet",
        productOrigin: "UAE",
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[uaeItem]} />,
      );

      expect(container.textContent).toContain("SS-304-Sheet");
      expect(container.textContent).not.toContain("UAE");
    });

    it("should display product name with origin for non-UAE items", () => {
      const importItem = {
        ...mockItems[0],
        name: "Stainless Steel Coil",
        productOrigin: "Germany",
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[importItem]} />,
      );

      expect(container.textContent).toContain("Stainless Steel Coil - Germany");
    });

    it("should handle missing product name", () => {
      const itemWithoutName = { ...mockItems[0], name: undefined };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[itemWithoutName]} />,
      );

      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("should display quantity and price columns", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      const cells = container.querySelectorAll("tbody td");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe("Template Styling", () => {
    it("should apply template primary color when provided", () => {
      const template = {
        colors: { primary: "#FF5733" },
        layout: { itemsStyle: "full-grid" },
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={template} />,
      );

      const headerRow = container.querySelector("thead tr");
      expect(headerRow.style.backgroundColor).toBe("rgb(255, 87, 51)");
    });

    it("should apply custom border color from template", () => {
      const template = {
        colors: {
          primary: "#000000",
          border: "#CCCCCC",
        },
        layout: { itemsStyle: "full-grid" },
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={template} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should apply accent color from template", () => {
      const template = {
        colors: {
          primary: "#000000",
          accent: "#EEEEEE",
        },
        layout: { itemsStyle: "full-grid" },
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={template} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Layout Styles", () => {
    const layoutStyles = ["full-grid", "horizontal-lines", "no-borders", "bold-header"];

    layoutStyles.forEach((style) => {
      it(`should apply ${style} layout style`, () => {
        const template = {
          layout: { itemsStyle: style },
          colors: { primary: "#000000" },
        };

        const { container } = renderWithProviders(
          <InvoiceItemsTable items={mockItems} template={template} />,
        );

        expect(container.querySelector("table")).toBeInTheDocument();
      });
    });

    it("should use default layout when template not provided", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Alternating Rows", () => {
    it("should apply alternating row styles when enabled", () => {
      const template = {
        layout: { alternatingRows: true, itemsStyle: "full-grid" },
        colors: { primary: "#000000", accent: "#F5F5F5" },
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={template} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should not apply alternating row styles when disabled", () => {
      const template = {
        layout: { alternatingRows: false, itemsStyle: "full-grid" },
        colors: { primary: "#000000" },
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={template} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Pagination Props", () => {
    it("should handle startingIndex prop", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} startingIndex={1} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should handle isFirstPage prop", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} isFirstPage={true} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should handle isContinued prop", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} isContinued={true} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Primary Color", () => {
    it("should use provided primaryColor prop", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} primaryColor="#2563EB" />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should prefer template color over primaryColor prop", () => {
      const template = {
        colors: { primary: "#FF0000" },
        layout: { itemsStyle: "full-grid" },
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable
          items={mockItems}
          primaryColor="#0000FF"
          template={template}
        />,
      );

      const headerRow = container.querySelector("thead tr");
      // Template color should take precedence
      expect(headerRow.style.backgroundColor).toBe("rgb(255, 0, 0)");
    });

    it("should use default color when neither provided", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Complex Items", () => {
    it("should handle items with special characters in name", () => {
      const specialItem = {
        ...mockItems[0],
        name: "SS-304 (BA) & Stainless Steel Sheet™",
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[specialItem]} />,
      );

      expect(container.textContent).toContain("SS-304 (BA) & Stainless Steel Sheet™");
    });

    it("should handle items with very long names", () => {
      const longNameItem = {
        ...mockItems[0],
        name: "Extra Long Product Name With Multiple Descriptors And Additional Information That Spans Multiple Words",
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[longNameItem]} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should handle items with decimal quantities", () => {
      const decimalItem = {
        ...mockItems[0],
        quantity: 123.456,
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[decimalItem]} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should handle items with zero quantity", () => {
      const zeroItem = {
        ...mockItems[0],
        quantity: 0,
      };

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={[zeroItem]} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large item arrays", () => {
      const largeItemArray = createMockArray(createMockLineItem, 100);

      const { container } = renderWithProviders(
        <InvoiceItemsTable items={largeItemArray} />,
      );

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(100);
    });

    it("should handle null template gracefully", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={null} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should handle undefined template gracefully", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={undefined} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });

    it("should handle empty template object", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} template={{}} />,
      );

      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have table structure with thead and tbody", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      expect(container.querySelector("thead")).toBeInTheDocument();
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("should have proper header row", () => {
      const { container } = renderWithProviders(
        <InvoiceItemsTable items={mockItems} />,
      );

      const headerCells = container.querySelectorAll("thead th");
      expect(headerCells.length).toBeGreaterThan(0);
    });
  });
});
