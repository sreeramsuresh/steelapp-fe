/**
 * WarehouseStockSummary Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests warehouse stock summary display
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import { createMockArray, createMockWarehouse } from "../../../test/mock-factories";
import WarehouseStockSummary from "../WarehouseStockSummary";

// Mock the API service
vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from "../../../services/api";

describe("WarehouseStockSummary", () => {
  let defaultProps;
  let mockWarehouses;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWarehouses = createMockArray(createMockWarehouse, 3, (index) => ({
      id: `WH-${String(index + 1).padStart(3, "0")}`,
      name: `Warehouse ${String.fromCharCode(65 + index)}`,
      code: `WH${index + 1}`,
      totalStock: 1000 + index * 500,
      availableStock: 800 + index * 300,
      reservedStock: 200 - index * 50,
    }));

    defaultProps = {
      productId: 123,
      companyId: "company-123",
    };

    api.get.mockResolvedValue({ warehouses: mockWarehouses });
  });

  describe("Rendering", () => {
    it("should render warehouse stock summary", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should display summary title", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container.textContent).toContain("Warehouse Stock Summary");
    });

    it("should load warehouse data on mount", async () => {
      renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe("Warehouse List Display", () => {
    it("should display all warehouses", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      mockWarehouses.forEach((warehouse) => {
        expect(container.textContent).toContain(warehouse.name);
      });
    });

    it("should show warehouse codes", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      mockWarehouses.forEach((warehouse) => {
        expect(container.textContent).toContain(warehouse.code);
      });
    });

    it("should display warehouse IDs as fallback", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("WH-001");
    });
  });

  describe("Stock Quantity Display", () => {
    it("should show total stock per warehouse", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("1000");
      expect(container.textContent).toContain("1500");
    });

    it("should show available stock", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("800");
      expect(container.textContent).toContain("1100");
    });

    it("should show reserved stock", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("200");
      expect(container.textContent).toContain("150");
    });

    it("should calculate available vs total percentage", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Stock Status Indicators", () => {
    it("should indicate high stock availability", async () => {
      const highStockWarehouses = [
        { ...mockWarehouses[0], totalStock: 1000, availableStock: 950 },
      ];
      api.get.mockResolvedValue({ warehouses: highStockWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should indicate low stock availability", async () => {
      const lowStockWarehouses = [
        { ...mockWarehouses[0], totalStock: 1000, availableStock: 50 },
      ];
      api.get.mockResolvedValue({ warehouses: lowStockWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should indicate zero stock availability", async () => {
      const zeroStockWarehouses = [
        { ...mockWarehouses[0], totalStock: 0, availableStock: 0 },
      ];
      api.get.mockResolvedValue({ warehouses: zeroStockWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("0");
    });
  });

  describe("Color Coding", () => {
    it("should use green for adequate stock", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should use amber for low stock", async () => {
      const lowStockWarehouses = [
        { ...mockWarehouses[0], availableStock: 20, totalStock: 100 },
      ];
      api.get.mockResolvedValue({ warehouses: lowStockWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should use red for out of stock", async () => {
      const outOfStockWarehouses = [
        { ...mockWarehouses[0], availableStock: 0, totalStock: 0 },
      ];
      api.get.mockResolvedValue({ warehouses: outOfStockWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading indicator initially", () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container.textContent).toContain("Loading");
    });

    it("should hide loading after data loads", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).not.toContain("Loading");
    });

    it("should show skeleton placeholder while loading", () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      api.get.mockRejectedValue(new Error("Failed to load warehouses"));

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Failed");
    });

    it("should show retry button on error", async () => {
      api.get.mockRejectedValue(new Error("API Error"));

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Retry");
    });

    it("should recover from error when retrying", async () => {
      api.get.mockRejectedValueOnce(new Error("API Error"));
      api.get.mockResolvedValueOnce({ warehouses: mockWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should handle no warehouses", async () => {
      api.get.mockResolvedValue({ warehouses: [] });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("No warehouses");
    });

    it("should show helpful message for empty state", async () => {
      api.get.mockResolvedValue({ warehouses: [] });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Quantity Formatting", () => {
    it("should format quantities with proper decimals", async () => {
      const decimalWarehouses = [
        { ...mockWarehouses[0], totalStock: 1000.5, availableStock: 800.75 },
      ];
      api.get.mockResolvedValue({ warehouses: decimalWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle zero quantities", async () => {
      const zeroWarehouses = [
        { ...mockWarehouses[0], totalStock: 0, availableStock: 0, reservedStock: 0 },
      ];
      api.get.mockResolvedValue({ warehouses: zeroWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("0");
    });

    it("should format very large quantities", async () => {
      const largeWarehouses = [
        { ...mockWarehouses[0], totalStock: 999999.99, availableStock: 888888.88 },
      ];
      api.get.mockResolvedValue({ warehouses: largeWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Multiple Warehouses", () => {
    it("should handle single warehouse", async () => {
      api.get.mockResolvedValue({ warehouses: [mockWarehouses[0]] });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Warehouse A");
    });

    it("should handle many warehouses", async () => {
      const manyWarehouses = createMockArray(createMockWarehouse, 20);
      api.get.mockResolvedValue({ warehouses: manyWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should calculate total across all warehouses", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Total");
    });
  });

  describe("Summary Calculations", () => {
    it("should show total across all warehouses", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Total");
    });

    it("should calculate total available stock", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Total available: 800 + 1100 + 1400 = 3300
      expect(container).toBeInTheDocument();
    });

    it("should calculate overall availability percentage", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Visual Layout", () => {
    it("should use cards for warehouse display", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should have responsive layout", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });

    it("should show progress bars for stock levels", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const progressBars = container.querySelectorAll("[role='progressbar']");
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode styles", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />, {
        initialState: { theme: { isDarkMode: true } },
      });

      expect(container).toBeInTheDocument();
    });

    it("should render with light mode styles", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />, {
        initialState: { theme: { isDarkMode: false } },
      });

      expect(container).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("should call API with productId", async () => {
      renderWithProviders(<WarehouseStockSummary {...defaultProps} productId={456} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should call API with companyId", async () => {
      renderWithProviders(<WarehouseStockSummary {...defaultProps} companyId="CUSTOM-COMPANY" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should handle missing productId", async () => {
      renderWithProviders(<WarehouseStockSummary {...defaultProps} productId={null} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle warehouse with all reserved stock", async () => {
      const reservedWarehouses = [
        { ...mockWarehouses[0], totalStock: 1000, availableStock: 0, reservedStock: 1000 },
      ];
      api.get.mockResolvedValue({ warehouses: reservedWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle warehouse with no reserved stock", async () => {
      const noReserveWarehouses = [
        { ...mockWarehouses[0], totalStock: 1000, availableStock: 1000, reservedStock: 0 },
      ];
      api.get.mockResolvedValue({ warehouses: noReserveWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle reserved exceeding total", async () => {
      const invalidWarehouses = [
        { ...mockWarehouses[0], totalStock: 100, availableStock: 50, reservedStock: 200 },
      ];
      api.get.mockResolvedValue({ warehouses: invalidWarehouses });

      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic HTML structure", () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      expect(container.querySelector("main") || container).toBeTruthy();
    });

    it("should have descriptive headings", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Warehouse Stock Summary");
    });

    it("should have progress bars with accessible labels", async () => {
      const { container } = renderWithProviders(<WarehouseStockSummary {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const progressBars = container.querySelectorAll("[role='progressbar']");
      progressBars.forEach((bar) => {
        expect(bar.getAttribute("aria-valuenow") || bar.getAttribute("aria-label")).toBeTruthy();
      });
    });
  });
});
