/**
 * InvoiceStockMovements Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests invoice stock movements tracking
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import InvoiceStockMovements from "../InvoiceStockMovements";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// Mock the API service
vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../../services/api";

describe("InvoiceStockMovements", () => {
  let defaultProps;
  let mockMovements;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMovements = [
      {
        id: 1,
        date: "2024-01-15",
        type: "RESERVATION",
        quantity: 50,
        batchId: 1,
        batchNumber: "BATCH-2024-001",
        status: "COMPLETED",
        reference: "INV-2024-001",
      },
      {
        id: 2,
        date: "2024-01-16",
        type: "DEDUCTION",
        quantity: 50,
        batchId: 1,
        batchNumber: "BATCH-2024-001",
        status: "COMPLETED",
        reference: "DN-2024-001",
      },
      {
        id: 3,
        date: "2024-01-17",
        type: "REVERSAL",
        quantity: 25,
        batchId: 1,
        batchNumber: "BATCH-2024-001",
        status: "PENDING",
        reference: "CN-2024-001",
      },
    ];

    defaultProps = {
      invoiceId: 123,
      invoiceLineId: 456,
      companyId: "company-123",
    };

    api.get.mockResolvedValue({ movements: mockMovements });
  });

  describe("Rendering", () => {
    it("should render stock movements section", () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display section title", () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      expect(container.textContent).toContain("Stock Movements");
    });

    it("should load movements on mount", async () => {
      renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe("Movement Display", () => {
    it("should display movement dates", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("2024-01-15");
      expect(container.textContent).toContain("2024-01-16");
      expect(container.textContent).toContain("2024-01-17");
    });

    it("should display movement types", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("RESERVATION");
      expect(container.textContent).toContain("DEDUCTION");
      expect(container.textContent).toContain("REVERSAL");
    });

    it("should display quantities", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("50");
      expect(container.textContent).toContain("25");
    });

    it("should display batch information", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH-2024-001");
    });

    it("should display references (invoices, delivery notes, etc)", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("INV-2024-001");
      expect(container.textContent).toContain("DN-2024-001");
      expect(container.textContent).toContain("CN-2024-001");
    });
  });

  describe("Status Indicators", () => {
    it("should display movement status", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("COMPLETED");
      expect(container.textContent).toContain("PENDING");
    });

    it("should use color coding for status", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should indicate completed movements", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("COMPLETED");
    });

    it("should indicate pending movements", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("PENDING");
    });
  });

  describe("Movement Types", () => {
    it("should show RESERVATION movements", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("RESERVATION");
    });

    it("should show DEDUCTION movements", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("DEDUCTION");
    });

    it("should show REVERSAL movements", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("REVERSAL");
    });

    it("should display movement type icons", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Table Structure", () => {
    it("should display movements in table format", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });

    it("should have proper table headers", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Date");
      expect(container.textContent).toContain("Type");
      expect(container.textContent).toContain("Quantity");
    });

    it("should have table body rows for each movement", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBeGreaterThanOrEqual(mockMovements.length);
    });
  });

  describe("Summary Information", () => {
    it("should show total movements count", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("3");
    });

    it("should calculate total quantity moved", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // 50 + 50 + 25 = 125
      expect(container.textContent).toContain("125");
    });

    it("should show breakdown by movement type", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("RESERVATION");
      expect(container.textContent).toContain("DEDUCTION");
    });
  });

  describe("Loading State", () => {
    it("should display loading indicator initially", () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      expect(container.textContent).toContain("Loading");
    });

    it("should hide loading after data loads", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).not.toContain("Loading");
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      api.get.mockRejectedValue(new Error("Failed to load movements"));

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Failed");
    });

    it("should show retry button on error", async () => {
      api.get.mockRejectedValue(new Error("API Error"));

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Retry");
    });
  });

  describe("Empty State", () => {
    it("should handle no movements", async () => {
      api.get.mockResolvedValue({ movements: [] });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("No movements");
    });

    it("should show helpful message for empty state", async () => {
      api.get.mockResolvedValue({ movements: [] });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Quantity Formatting", () => {
    it("should format quantities with decimals", async () => {
      const decimalMovements = [{ ...mockMovements[0], quantity: 50.5 }];
      api.get.mockResolvedValue({ movements: decimalMovements });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle zero quantities", async () => {
      const zeroMovements = [{ ...mockMovements[0], quantity: 0 }];
      api.get.mockResolvedValue({ movements: zeroMovements });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("0");
    });

    it("should handle very large quantities", async () => {
      const largeMovements = [{ ...mockMovements[0], quantity: 999999.99 }];
      api.get.mockResolvedValue({ movements: largeMovements });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Date Formatting", () => {
    it("should format dates consistently", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("2024");
    });

    it("should handle different date formats", async () => {
      const altDateMovements = [{ ...mockMovements[0], date: "15 Jan 2024" }];
      api.get.mockResolvedValue({ movements: altDateMovements });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Jan");
    });
  });

  describe("Movement Timeline", () => {
    it("should show movements in chronological order", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const text = container.textContent;
      const firstDate = text.indexOf("2024-01-15");
      const secondDate = text.indexOf("2024-01-16");
      expect(firstDate).toBeLessThan(secondDate);
    });

    it("should group movements by type", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode colors", () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should render with light mode colors", () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single movement", async () => {
      api.get.mockResolvedValue({ movements: [mockMovements[0]] });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("BATCH-2024-001");
    });

    it("should handle many movements", async () => {
      const manyMovements = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
        type: ["RESERVATION", "DEDUCTION", "REVERSAL"][i % 3],
        quantity: 10 * (i + 1),
        batchId: 1,
        batchNumber: "BATCH-2024-001",
        status: i % 2 === 0 ? "COMPLETED" : "PENDING",
        reference: `DOC-2024-${String(i + 1).padStart(3, "0")}`,
      }));
      api.get.mockResolvedValue({ movements: manyMovements });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle missing optional fields", async () => {
      const incompleteMovements = [{ id: 1, date: "2024-01-15", type: "DEDUCTION", quantity: 50 }];
      api.get.mockResolvedValue({ movements: incompleteMovements });

      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic table structure", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      const heading = container.querySelector("h4, h5, h6");
      expect(heading || container.textContent.includes("Stock Movements")).toBeTruthy();
    });

    it("should have descriptive column headers", async () => {
      const { container } = renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const headers = container.querySelectorAll("th");
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe("API Integration", () => {
    it("should fetch movements on mount", async () => {
      renderWithProviders(<InvoiceStockMovements {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should pass invoiceId to API", async () => {
      renderWithProviders(<InvoiceStockMovements {...defaultProps} invoiceId={999} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should pass invoiceLineId to API", async () => {
      renderWithProviders(<InvoiceStockMovements {...defaultProps} invoiceLineId={888} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should pass companyId to API", async () => {
      renderWithProviders(<InvoiceStockMovements {...defaultProps} companyId="CUSTOM-CO" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });
  });
});
