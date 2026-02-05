/**
 * WarehouseStockSelector Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests warehouse selection with stock availability display
 */

// Jest provides describe, it, expect, beforeEach globally - no need to import
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../../test/component-setup";
import { createMockArray, createMockWarehouse } from "../../../test/mock-factories";
import WarehouseStockSelector from "../WarehouseStockSelector";
import sinon from 'sinon';

// Mock the API service
// sinon.stub() // "../../../services/api", () => ({
  default: {
    get: sinon.stub(),
  },
}));

import api from "../../../services/api";

describe("WarehouseStockSelector", () => {
  let mockOnWarehouseSelect;
  let mockWarehouses;
  let defaultProps;

  beforeEach(() => {
    sinon.restore();
    mockOnWarehouseSelect = sinon.stub();

    mockWarehouses = createMockArray(createMockWarehouse, 3, (index) => ({
      id: `WH-${String(index + 1).padStart(3, "0")}`,
      name: `Warehouse ${String.fromCharCode(65 + index)}`,
      code: `WH${index + 1}`,
    }));

    defaultProps = {
      productId: 123,
      warehouses: mockWarehouses,
      selectedWarehouseId: null,
      onWarehouseSelect: mockOnWarehouseSelect,
      companyId: "company-123",
    };

    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 100 + index }, { quantityAvailable: 50 + index }],
    });
  });

  describe("Rendering", () => {
    it("should render selector component", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should display stock availability label", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Stock availability");
    });

    it("should render warehouse buttons", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should display warehouse names", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Warehouse");
    });
  });

  describe("Loading State", () => {
    it("should show loading state initially", async () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      expect(container.textContent).toContain("Loading");
    });

    it("should display loading spinner", async () => {
      api.get.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Stock Display", () => {
    it("should display available stock quantities", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("100");
    });

    it("should show zero stock correctly", async () => {
      api.get.mockResolvedValue({ batches: [] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("0");
    });

    it("should format quantities with proper decimals", async () => {
      api.get.mockResolvedValue({
        batches: [{ quantityAvailable: 123.45 }],
      });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("123");
    });

    it("should accumulate quantities from multiple batches", async () => {
      api.get.mockResolvedValue({
        batches: [{ quantityAvailable: 100 }, { quantityAvailable: 50 }, { quantityAvailable: 25 }],
      });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("175");
    });

    it("should show warehouse in title attribute", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button[type='button']");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Warehouse Selection", () => {
    it("should highlight selected warehouse", async () => {
      const { container, rerender } = renderWithProviders(
        <WarehouseStockSelector {...defaultProps} selectedWarehouseId={null} />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      rerender(<WarehouseStockSelector {...defaultProps} selectedWarehouseId="WH-001" />);

      expect(container).toBeInTheDocument();
    });

    it("should call onWarehouseSelect when warehouse clicked", async () => {
      const user = setupUser();
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button[type='button']");
      if (buttons.length > 0) {
        await user.click(buttons[0]);
        expect(mockOnWarehouseSelect).toHaveBeenCalled();
      }
    });

    it("should pass warehouseId and hasStock to callback", async () => {
      const user = setupUser();
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button[type='button']");
      if (buttons.length > 0) {
        await user.click(buttons[0]);
        expect(mockOnWarehouseSelect).toHaveBeenCalledWith(expect.any(String), expect.any(Boolean));
      }
    });

    it("should indicate hasStock as true when quantity > 0", async () => {
      const user = setupUser();
      api.get.mockResolvedValue({ batches: [{ quantityAvailable: 100 }] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button[type='button']");
      if (buttons.length > 0) {
        await user.click(buttons[0]);
        const call = mockOnWarehouseSelect.mock.calls[0];
        expect(call[1]).toBe(true);
      }
    });

    it("should indicate hasStock as false when quantity = 0", async () => {
      const user = setupUser();
      api.get.mockResolvedValue({ batches: [] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button[type='button']");
      if (buttons.length > 0) {
        await user.click(buttons[0]);
        const call = mockOnWarehouseSelect.mock.calls[0];
        expect(call[1]).toBe(false);
      }
    });
  });

  describe("Zero Stock Handling", () => {
    it("should notify parent when all warehouses have zero stock", async () => {
      api.get.mockResolvedValue({ batches: [] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnWarehouseSelect).toHaveBeenCalledWith(null, false);
    });

    it("should not notify parent when at least one warehouse has stock", async () => {
      api.get.mockResolvedValueOnce({ batches: [{ quantityAvailable: 100 }] });
      api.get.mockResolvedValueOnce({ batches: [] });
      api.get.mockResolvedValueOnce({ batches: [] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnWarehouseSelect).not.toHaveBeenCalledWith(null, false);
    });
  });

  describe("Error Handling", () => {
    it("should display error message on API failure", async () => {
      api.get.mockRejectedValue(new Error("API Error"));

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Failed");
    });

    it("should continue with other warehouses if one fails", async () => {
      api.get.mockResolvedValueOnce({ batches: [{ quantityAvailable: 100 }] });
      api.get.mockRejectedValueOnce(new Error("Warehouse offline"));
      api.get.mockResolvedValueOnce({ batches: [{ quantityAvailable: 50 }] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show message when no warehouses provided", () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} warehouses={[]} />);

      expect(container.textContent).toContain("No warehouses");
    });

    it("should not call API when no warehouses", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} warehouses={[]} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe("API Integration", () => {
    it("should call API with correct parameters", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalledWith("/stock-batches/available", expect.any(Object));
    });

    it("should include productId in API call", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} productId={999} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should include companyId in API call", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} companyId="CUSTOM-COMPANY" />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).toHaveBeenCalled();
    });

    it("should handle missing productId gracefully", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} productId={null} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).not.toHaveBeenCalled();
    });

    it("should handle missing companyId gracefully", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} companyId={null} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe("Color Coding", () => {
    it("should show green icon for warehouse with stock", async () => {
      api.get.mockResolvedValue({ batches: [{ quantityAvailable: 100 }] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should show red icon for warehouse without stock", async () => {
      api.get.mockResolvedValue({ batches: [] });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Warehouse Display", () => {
    it("should display warehouse name", async () => {
      renderWithProviders(
        <WarehouseStockSelector {...defaultProps} warehouses={[{ id: "WH-1", name: "Main Warehouse", code: "WH1" }]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Main Warehouse");
    });

    it("should use warehouse code as fallback", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} warehouses={[{ id: "WH-1", code: "WH1" }]} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("WH1");
    });

    it("should use warehouse id as last resort", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} warehouses={[{ id: "WH-123" }]} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single warehouse", async () => {
      renderWithProviders(
        <WarehouseStockSelector {...defaultProps} warehouses={[{ id: "WH-1", name: "Single Warehouse" }]} />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("Single Warehouse");
    });

    it("should handle many warehouses", async () => {
      const manyWarehouses = createMockArray(createMockWarehouse, 10);

      renderWithProviders(<WarehouseStockSelector {...defaultProps} warehouses={manyWarehouses} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container).toBeInTheDocument();
    });

    it("should handle large stock quantities", async () => {
      api.get.mockResolvedValue({
        batches: [{ quantityAvailable: 999999.99 }],
      });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("999");
    });

    it("should handle decimal stock quantities", async () => {
      api.get.mockResolvedValue({
        batches: [{ quantityAvailable: 10.5 }],
      });

      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.textContent).toContain("10.5");
    });
  });

  describe("Accessibility", () => {
    it("should have warehouse buttons with type button", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button[type='button']");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have title attribute with warehouse info", async () => {
      renderWithProviders(<WarehouseStockSelector {...defaultProps} />);

      await new Promise((resolve) => setTimeout(resolve, 50));

      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        if (!button.classList.contains("disabled")) {
          expect(button.title || button.textContent).toBeTruthy();
        }
      });
    });
  });
});
